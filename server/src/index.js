import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, seedIfEmpty } from './db.js';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../data/flushmark.db');
const port = Number(process.env.PORT) || 3001;

const db = openDb(dbPath);
if (seedIfEmpty(db)) {
  console.log('Seeded database with sample bathrooms.');
}

const app = createApp(db);
app.listen(port, () => {
  console.log(`FlushMark API listening on http://localhost:${port}`);
});
