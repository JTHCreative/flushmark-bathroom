import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ACCESS_TYPES, AMENITIES, ACCESS_KEYS, AMENITY_KEYS } from './constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Great-circle distance in kilometers. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function parseListParam(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createApp(db) {
  const app = express();
  app.use(express.json());

  const listStmt = db.prepare(`
    SELECT b.*,
           ROUND(AVG(r.rating), 2) AS avg_rating,
           COUNT(r.id) AS review_count
    FROM bathrooms b
    LEFT JOIN reviews r ON r.bathroom_id = b.id
    GROUP BY b.id
  `);
  const amenitiesStmt = db.prepare(
    'SELECT bathroom_id, amenity FROM bathroom_amenities'
  );
  const amenitiesForStmt = db.prepare(
    'SELECT amenity FROM bathroom_amenities WHERE bathroom_id = ?'
  );
  const getStmt = db.prepare(`
    SELECT b.*,
           ROUND(AVG(r.rating), 2) AS avg_rating,
           COUNT(r.id) AS review_count
    FROM bathrooms b
    LEFT JOIN reviews r ON r.bathroom_id = b.id
    WHERE b.id = ?
    GROUP BY b.id
  `);
  const reviewsStmt = db.prepare(
    'SELECT id, author, rating, comment, created_at FROM reviews WHERE bathroom_id = ? ORDER BY created_at DESC, id DESC'
  );
  const insertBathroomStmt = db.prepare(`
    INSERT INTO bathrooms (name, description, address, lat, lng, access)
    VALUES (@name, @description, @address, @lat, @lng, @access)
  `);
  const insertAmenityStmt = db.prepare(
    'INSERT INTO bathroom_amenities (bathroom_id, amenity) VALUES (?, ?)'
  );
  const insertReviewStmt = db.prepare(
    'INSERT INTO reviews (bathroom_id, author, rating, comment) VALUES (?, ?, ?, ?)'
  );

  app.get('/api/meta', (req, res) => {
    res.json({ amenities: AMENITIES, accessTypes: ACCESS_TYPES });
  });

  app.get('/api/bathrooms', (req, res) => {
    const { q, access, sort } = req.query;
    const amenities = parseListParam(req.query.amenities);
    const accessFilter = parseListParam(access);
    const minRating = req.query.minRating ? Number(req.query.minRating) : null;
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : null;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : null;
    const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

    const amenityRows = amenitiesStmt.all();
    const amenityMap = new Map();
    for (const row of amenityRows) {
      if (!amenityMap.has(row.bathroom_id)) amenityMap.set(row.bathroom_id, []);
      amenityMap.get(row.bathroom_id).push(row.amenity);
    }

    let results = listStmt.all().map((b) => ({
      ...b,
      avg_rating: b.avg_rating ?? null,
      amenities: amenityMap.get(b.id) ?? [],
      distance_km: hasLocation
        ? Math.round(haversineKm(lat, lng, b.lat, b.lng) * 100) / 100
        : null,
    }));

    if (q) {
      const needle = String(q).toLowerCase();
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(needle) ||
          b.address.toLowerCase().includes(needle) ||
          b.description.toLowerCase().includes(needle)
      );
    }
    if (accessFilter.length > 0) {
      results = results.filter((b) => accessFilter.includes(b.access));
    }
    if (Number.isFinite(minRating)) {
      results = results.filter((b) => (b.avg_rating ?? 0) >= minRating);
    }
    if (amenities.length > 0) {
      results = results.filter((b) => amenities.every((a) => b.amenities.includes(a)));
    }

    const sortKey = sort || (hasLocation ? 'distance' : 'rating');
    const byRating = (a, b) =>
      (b.avg_rating ?? 0) - (a.avg_rating ?? 0) || b.review_count - a.review_count;
    if (sortKey === 'distance' && hasLocation) {
      results.sort((a, b) => a.distance_km - b.distance_km);
    } else if (sortKey === 'reviews') {
      results.sort((a, b) => b.review_count - a.review_count || byRating(a, b));
    } else if (sortKey === 'newest') {
      results.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else {
      results.sort(byRating);
    }

    res.json({ bathrooms: results });
  });

  app.get('/api/bathrooms/:id', (req, res) => {
    const bathroom = getStmt.get(req.params.id);
    if (!bathroom || bathroom.id === null) {
      return res.status(404).json({ error: 'Bathroom not found' });
    }
    res.json({
      ...bathroom,
      avg_rating: bathroom.avg_rating ?? null,
      amenities: amenitiesForStmt.all(bathroom.id).map((r) => r.amenity),
      reviews: reviewsStmt.all(bathroom.id),
    });
  });

  app.post('/api/bathrooms', (req, res) => {
    const { name, description = '', address = '', lat, lng, access, amenities = [], initialReview } = req.body ?? {};
    const errors = [];
    if (!name || typeof name !== 'string' || !name.trim()) errors.push('name is required');
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.push('lat must be a number between -90 and 90');
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.push('lng must be a number between -180 and 180');
    if (!ACCESS_KEYS.includes(access)) errors.push(`access must be one of: ${ACCESS_KEYS.join(', ')}`);
    if (!Array.isArray(amenities) || amenities.some((a) => !AMENITY_KEYS.includes(a))) {
      errors.push(`amenities must be an array of: ${AMENITY_KEYS.join(', ')}`);
    }
    if (initialReview !== undefined) {
      const rating = initialReview?.rating;
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.push('initialReview.rating must be an integer between 1 and 5');
      }
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    const createBathroom = db.transaction(() => {
      const { lastInsertRowid: id } = insertBathroomStmt.run({
        name: name.trim(),
        description: String(description).trim(),
        address: String(address).trim(),
        lat,
        lng,
        access,
      });
      for (const amenity of new Set(amenities)) insertAmenityStmt.run(id, amenity);
      if (initialReview) {
        insertReviewStmt.run(
          id,
          String(initialReview.author || 'Anonymous').trim() || 'Anonymous',
          initialReview.rating,
          String(initialReview.comment || '').trim()
        );
      }
      return id;
    });

    const id = createBathroom();
    const bathroom = getStmt.get(id);
    res.status(201).json({
      ...bathroom,
      avg_rating: bathroom.avg_rating ?? null,
      amenities: amenitiesForStmt.all(id).map((r) => r.amenity),
      reviews: reviewsStmt.all(id),
    });
  });

  app.post('/api/bathrooms/:id/reviews', (req, res) => {
    const bathroom = getStmt.get(req.params.id);
    if (!bathroom || bathroom.id === null) {
      return res.status(404).json({ error: 'Bathroom not found' });
    }
    const { author, rating, comment = '' } = req.body ?? {};
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ errors: ['rating must be an integer between 1 and 5'] });
    }
    const { lastInsertRowid: reviewId } = insertReviewStmt.run(
      bathroom.id,
      String(author || 'Anonymous').trim() || 'Anonymous',
      rating,
      String(comment).trim()
    );
    const review = db
      .prepare('SELECT id, author, rating, comment, created_at FROM reviews WHERE id = ?')
      .get(reviewId);
    res.status(201).json(review);
  });

  // Serve the built client in production, with an SPA fallback.
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api\/).*/, (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
