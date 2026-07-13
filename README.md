# 🚻 FlushMark

Find and rate bathrooms near you. Browse a Yelp-style map + list, filter by rating,
amenities, and access type, read and post reviews, and get turn-by-turn directions
from your phone.

## Features

- **Map + list browsing** — split view on desktop, a Map/List tab switcher on mobile.
  Map pins are color-coded by rating (green ≥ 4★, amber ≥ 3★, red below) and show the
  average rating at a glance.
- **Ratings & reviews** — 1–5 star ratings with optional comments. Averages update live.
- **Amenities** — shower, baby changing table, wheelchair access, gender neutral,
  menstrual products, soap, paper towels, hand dryer, free toiletries.
- **Access types** — public, customers only (requires purchase), or private (ask staff).
- **Filtering & search** — combine text search, minimum rating, access type, and any
  number of amenities (AND semantics); sort by top rated, most reviewed, newest, or nearest.
- **"Near me"** — uses browser geolocation to show distances and sort by proximity.
- **Directions** — every bathroom has a Directions button that opens Google Maps
  (which hands off to the native Apple/Google Maps app on iOS/Android).
- **Add a bathroom** — tap the map to drop a pin, then fill in details, amenities,
  and an optional first review.
- **Installable PWA** — web app manifest included, so it can be added to a phone's
  home screen and runs in standalone mode.

## Stack

| Layer    | Tech                                                                 |
| -------- | -------------------------------------------------------------------- |
| Frontend | React 19 + Vite, Leaflet / react-leaflet with OpenStreetMap tiles     |
| Backend  | Node.js + Express 5                                                   |
| Database | SQLite via better-sqlite3 (zero-config, file-based)                   |
| Tests    | Node's built-in test runner (`node --test`)                           |

No API keys are required — map tiles come from OpenStreetMap and directions use
public Google Maps URLs.

## Getting started

```bash
npm install

# Development (two terminals):
npm run dev:server   # API on http://localhost:3001 (auto-seeds sample data)
npm run dev:client   # Vite dev server on http://localhost:5173 (proxies /api)

# Production:
npm run build        # builds client to client/dist
npm start            # serves API + built client on http://localhost:3001

# Tests:
npm test
```

The SQLite database is created at `server/data/flushmark.db` on first run and seeded
with sample San Francisco bathrooms. Override the location with `DB_PATH`, and the
port with `PORT`.

## API

| Method | Path                        | Description                                            |
| ------ | --------------------------- | ------------------------------------------------------ |
| GET    | `/api/meta`                 | Amenity and access-type definitions                    |
| GET    | `/api/bathrooms`            | List with filters: `q`, `minRating`, `access`, `amenities` (comma-separated, AND), `lat`/`lng` (adds `distance_km`), `sort` (`rating`\|`reviews`\|`newest`\|`distance`) |
| GET    | `/api/bathrooms/:id`        | Detail including amenities and reviews                 |
| POST   | `/api/bathrooms`            | Create (name, lat, lng, access required; optional address, description, amenities, initialReview) |
| POST   | `/api/bathrooms/:id/reviews`| Add a review (`rating` 1–5, optional `author`, `comment`) |

## Android / iPhone strategy

The app is mobile-first and installable as a PWA today. For native store apps, the
recommended path is [Capacitor](https://capacitorjs.com/): the existing React build
drops into a Capacitor shell unchanged, giving App Store / Play Store distribution
plus native geolocation and deep links into Apple/Google Maps. A React Native
rewrite is the alternative if fully native UI becomes a requirement; the Express API
already serves both cases unmodified.

## Roadmap ideas

- User accounts (so reviews are attributed and editable)
- Photo uploads for bathrooms
- Address geocoding/autocomplete when adding a bathroom
- Report/flag inaccurate listings, closures, and hours
- Marker clustering once density grows
- PostgreSQL + PostGIS when data outgrows SQLite
