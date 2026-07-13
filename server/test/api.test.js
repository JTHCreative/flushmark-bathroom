import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb, seedIfEmpty } from '../src/db.js';
import { createApp, haversineKm } from '../src/app.js';

function startServer() {
  const db = openDb(':memory:');
  seedIfEmpty(db);
  const app = createApp(db);
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  return { server, base };
}

async function json(res) {
  assert.ok(res.headers.get('content-type').includes('application/json'));
  return res.json();
}

test('API', async (t) => {
  const { server, base } = startServer();
  t.after(() => server.close());

  await t.test('GET /api/meta returns amenities and access types', async () => {
    const res = await fetch(`${base}/api/meta`);
    assert.equal(res.status, 200);
    const body = await json(res);
    assert.ok(body.amenities.some((a) => a.key === 'shower'));
    assert.deepEqual(
      body.accessTypes.map((a) => a.key),
      ['public', 'customers_only', 'private']
    );
  });

  await t.test('GET /api/bathrooms returns seeded list with ratings and amenities', async () => {
    const res = await fetch(`${base}/api/bathrooms`);
    const { bathrooms } = await json(res);
    assert.ok(bathrooms.length >= 6);
    const ferry = bathrooms.find((b) => b.name.includes('Ferry Building'));
    assert.ok(ferry);
    assert.equal(ferry.avg_rating, 4.5);
    assert.equal(ferry.review_count, 2);
    assert.ok(ferry.amenities.includes('baby_changing'));
    // Default sort is by rating descending.
    const ratings = bathrooms.map((b) => b.avg_rating ?? 0);
    assert.deepEqual(ratings, [...ratings].sort((a, b) => b - a));
  });

  await t.test('filters by minRating, access, and amenities together', async () => {
    const res = await fetch(
      `${base}/api/bathrooms?minRating=4&access=private&amenities=shower,toiletries`
    );
    const { bathrooms } = await json(res);
    assert.equal(bathrooms.length, 1);
    assert.ok(bathrooms[0].name.includes('YMCA'));
  });

  await t.test('amenity filter uses AND semantics', async () => {
    const res = await fetch(`${base}/api/bathrooms?amenities=shower,menstrual_products`);
    const { bathrooms } = await json(res);
    assert.equal(bathrooms.length, 0);
  });

  await t.test('lat/lng adds distance and sorts nearest first', async () => {
    // Near Dolores Park.
    const res = await fetch(`${base}/api/bathrooms?lat=37.7599&lng=-122.4274`);
    const { bathrooms } = await json(res);
    assert.ok(bathrooms[0].name.includes('Dolores'));
    assert.ok(bathrooms[0].distance_km < 0.1);
    const distances = bathrooms.map((b) => b.distance_km);
    assert.deepEqual(distances, [...distances].sort((a, b) => a - b));
  });

  await t.test('text search matches name and address', async () => {
    const res = await fetch(`${base}/api/bathrooms?q=mint`);
    const { bathrooms } = await json(res);
    assert.equal(bathrooms.length, 1);
    assert.ok(bathrooms[0].name.includes('Blue Bottle'));
  });

  await t.test('GET /api/bathrooms/:id returns detail with reviews', async () => {
    const list = await json(await fetch(`${base}/api/bathrooms?q=ymca`));
    const id = list.bathrooms[0].id;
    const res = await fetch(`${base}/api/bathrooms/${id}`);
    const body = await json(res);
    assert.equal(body.reviews.length, 2);
    assert.ok(body.amenities.includes('shower'));
  });

  await t.test('GET /api/bathrooms/:id 404s for unknown id', async () => {
    const res = await fetch(`${base}/api/bathrooms/99999`);
    assert.equal(res.status, 404);
  });

  await t.test('POST /api/bathrooms creates a bathroom with amenities and initial review', async () => {
    const res = await fetch(`${base}/api/bathrooms`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Cafe Restroom',
        address: '123 Test St',
        lat: 37.75,
        lng: -122.42,
        access: 'customers_only',
        amenities: ['soap', 'hand_dryer'],
        initialReview: { author: 'Tester', rating: 5, comment: 'Spotless.' },
      }),
    });
    assert.equal(res.status, 201);
    const body = await json(res);
    assert.ok(body.id);
    assert.equal(body.avg_rating, 5);
    assert.deepEqual([...body.amenities].sort(), ['hand_dryer', 'soap']);
    assert.equal(body.reviews[0].comment, 'Spotless.');
  });

  await t.test('POST /api/bathrooms validates input', async () => {
    const res = await fetch(`${base}/api/bathrooms`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', lat: 999, lng: 0, access: 'nope', amenities: ['jacuzzi'] }),
    });
    assert.equal(res.status, 400);
    const body = await json(res);
    assert.equal(body.errors.length, 4);
  });

  await t.test('POST /api/bathrooms/:id/reviews adds a review and updates the average', async () => {
    const list = await json(await fetch(`${base}/api/bathrooms?q=blue+bottle`));
    const id = list.bathrooms[0].id;
    const res = await fetch(`${base}/api/bathrooms/${id}/reviews`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rating: 2, comment: 'Out of soap today.' }),
    });
    assert.equal(res.status, 201);
    const review = await json(res);
    assert.equal(review.author, 'Anonymous');

    const detail = await json(await fetch(`${base}/api/bathrooms/${id}`));
    assert.equal(detail.review_count, 2);
    assert.equal(detail.avg_rating, 3);
  });

  await t.test('POST review validates rating', async () => {
    const list = await json(await fetch(`${base}/api/bathrooms`));
    const id = list.bathrooms[0].id;
    const res = await fetch(`${base}/api/bathrooms/${id}/reviews`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rating: 6 }),
    });
    assert.equal(res.status, 400);
  });
});

test('haversineKm computes sane distances', () => {
  // SF to LA is roughly 560 km.
  const d = haversineKm(37.7749, -122.4194, 34.0522, -118.2437);
  assert.ok(d > 540 && d < 580, `expected ~560, got ${d}`);
  assert.equal(haversineKm(37.7, -122.4, 37.7, -122.4), 0);
});
