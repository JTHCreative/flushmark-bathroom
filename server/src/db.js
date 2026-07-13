import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS bathrooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  access TEXT NOT NULL CHECK (access IN ('public', 'customers_only', 'private')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS bathroom_amenities (
  bathroom_id INTEGER NOT NULL REFERENCES bathrooms(id) ON DELETE CASCADE,
  amenity TEXT NOT NULL,
  PRIMARY KEY (bathroom_id, amenity)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bathroom_id INTEGER NOT NULL REFERENCES bathrooms(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_bathroom ON reviews(bathroom_id);
CREATE INDEX IF NOT EXISTS idx_amenities_bathroom ON bathroom_amenities(bathroom_id);
`;

export function openDb(dbPath = ':memory:') {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

const SEED_BATHROOMS = [
  {
    name: 'Ferry Building Public Restroom',
    description:
      'Spacious, well-maintained restrooms inside the Ferry Building marketplace. Gets busy on weekend market days but cleaned hourly.',
    address: '1 Ferry Building, San Francisco, CA 94111',
    lat: 37.7955,
    lng: -122.3937,
    access: 'public',
    amenities: ['wheelchair_accessible', 'baby_changing', 'soap', 'paper_towels', 'gender_neutral'],
    reviews: [
      { author: 'Maya R.', rating: 5, comment: 'Cleanest public restroom downtown. Attendant on duty and never out of soap.' },
      { author: 'Devon K.', rating: 4, comment: 'Solid option near the Embarcadero. Line gets long on Saturdays.' },
    ],
  },
  {
    name: 'Blue Bottle Coffee — Mint Plaza',
    description: 'Single-stall bathroom in the back. Door code is printed on your receipt.',
    address: '66 Mint St, San Francisco, CA 94103',
    lat: 37.7826,
    lng: -122.4074,
    access: 'customers_only',
    amenities: ['gender_neutral', 'soap', 'hand_dryer'],
    reviews: [
      { author: 'Priya S.', rating: 4, comment: 'Clean and modern. You do need to buy something for the door code.' },
    ],
  },
  {
    name: 'Embarcadero YMCA Locker Rooms',
    description: 'Full locker rooms with hot showers and towel service. Day passes available at the front desk.',
    address: '169 Steuart St, San Francisco, CA 94105',
    lat: 37.7925,
    lng: -122.3927,
    access: 'private',
    amenities: ['shower', 'toiletries', 'soap', 'paper_towels', 'hand_dryer', 'wheelchair_accessible'],
    reviews: [
      { author: 'Jordan L.', rating: 5, comment: 'Best showers in the city if you can get a day pass. Towels included.' },
      { author: 'Sam W.', rating: 4, comment: 'Great facilities. A bit pricey without a membership.' },
    ],
  },
  {
    name: 'Golden Gate Park — Music Concourse',
    description: 'City-run restroom building near the bandshell, between the de Young and the Academy of Sciences.',
    address: 'Music Concourse Dr, San Francisco, CA 94118',
    lat: 37.7702,
    lng: -122.4674,
    access: 'public',
    amenities: ['wheelchair_accessible', 'baby_changing', 'soap'],
    reviews: [
      { author: 'Alex T.', rating: 3, comment: 'Convenient location, but cleanliness varies a lot by time of day.' },
      { author: 'Nina P.', rating: 4, comment: 'Fine for a park restroom. Stocked when I visited.' },
    ],
  },
  {
    name: 'Westfield Centre Level 4 Restrooms',
    description: 'Large mall restrooms near the food court with a dedicated family room.',
    address: '865 Market St, San Francisco, CA 94103',
    lat: 37.7841,
    lng: -122.4076,
    access: 'public',
    amenities: ['wheelchair_accessible', 'baby_changing', 'soap', 'paper_towels', 'hand_dryer', 'menstrual_products'],
    reviews: [
      { author: 'Chris B.', rating: 4, comment: 'Reliably clean and easy to find. Family room is a lifesaver with kids.' },
    ],
  },
  {
    name: 'Dolores Park Restrooms',
    description: 'Renovated restroom building at the 18th St side of the park. Expect lines on sunny weekends.',
    address: 'Dolores St & 18th St, San Francisco, CA 94114',
    lat: 37.7599,
    lng: -122.4274,
    access: 'public',
    amenities: ['wheelchair_accessible', 'soap'],
    reviews: [
      { author: 'Kim H.', rating: 2, comment: 'Long lines and often out of paper on busy days. Go early.' },
      { author: 'Leo M.', rating: 3, comment: 'Better since the renovation, but still hit or miss.' },
    ],
  },
];

export function seedIfEmpty(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM bathrooms').get().n;
  if (count > 0) return false;

  const insertBathroom = db.prepare(
    `INSERT INTO bathrooms (name, description, address, lat, lng, access)
     VALUES (@name, @description, @address, @lat, @lng, @access)`
  );
  const insertAmenity = db.prepare(
    'INSERT INTO bathroom_amenities (bathroom_id, amenity) VALUES (?, ?)'
  );
  const insertReview = db.prepare(
    'INSERT INTO reviews (bathroom_id, author, rating, comment) VALUES (?, ?, ?, ?)'
  );

  const seedAll = db.transaction(() => {
    for (const b of SEED_BATHROOMS) {
      const { lastInsertRowid: id } = insertBathroom.run(b);
      for (const amenity of b.amenities) insertAmenity.run(id, amenity);
      for (const r of b.reviews) insertReview.run(id, r.author, r.rating, r.comment);
    }
  });
  seedAll();
  return true;
}
