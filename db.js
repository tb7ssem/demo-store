'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Serverless platforms expose a writable /tmp directory; the deployed demo
// recreates its seeded database there on a cold start. Traditional servers use
// the persistent project data directory.
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);
const DATA_DIR = IS_SERVERLESS
  ? path.join('/tmp', 'demo-store-data')
  : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'demo-store.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

const origPrepare = db.prepare.bind(db);
const origExec = db.exec.bind(db);

/* --------------------------------------------------------------------------
   Serverless persistence — Netlify Blobs.
   On Netlify the SQLite file lives in a per-instance /tmp that is wiped on
   cold start. We keep a JSON snapshot of every table in a Blob store, restore
   it at boot, and write it back after each mutating request, so admin edits
   (settings, stock, orders) survive instance recycling.
   -------------------------------------------------------------------------- */
const IS_NETLIFY = Boolean(
  process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const TABLES = ['settings', 'categories', 'products', 'orders', 'order_items', 'carts', 'newsletter', 'visits'];

// Indirection so tests can inject a fake Blob store implementation.
let getStoreFn = null;
try {
  ({ getStore: getStoreFn } = require('@netlify/blobs'));
} catch {
  /* not installed locally — fine outside Netlify */
}
if (process.env.PORTABLOOK_BLOBS_MODULE) {
  ({ getStore: getStoreFn } = require(process.env.PORTABLOOK_BLOBS_MODULE));
}

let blobStore = null;
function blobs() {
  if (!IS_SERVERLESS) return null;
  if (blobStore !== null) return blobStore || null;
  try {
    if (IS_NETLIFY) {
      blobStore = getStoreFn({ name: 'demo-store-data', consistency: 'strong' });
    } else if (process.env.VERCEL) {
      // Vercel Blob backend (private store, token auto-injected on the project).
      const vb = require('@vercel/blob');
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set');
      const isNotFound = (err) =>
        err &&
        ((err.name && /NotFound/.test(err.name)) ||
          /not found/i.test(String(err.message || err)));
      blobStore = {
        async get(key) {
          try {
            const res = await vb.get(key, { access: 'private', token });
            if (res == null) return null;
            if (typeof res === 'string') return res;
            if (res.stream) return await new Response(res.stream).text();
            const url = (res.blob && (res.blob.downloadUrl || res.blob.url)) || res.downloadUrl || res.url;
            if (!url) return null;
            const r = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
            return await r.text();
          } catch (err) {
            if (isNotFound(err)) return null;
            throw err;
          }
        },
        async set(key, value) {
          await vb.put(key, value, { access: 'private', addRandomSuffix: false, allowOverwrite: true, token });
        },
      };
    }
  } catch (err) {
    console.error('Demo: Blob store unavailable, data will not persist:', err.message);
    blobStore = false;
  }
  return blobStore || null;
}

let dirty = false;
let flushChain = null;
const INSTANCE_ID = Math.random().toString(36).slice(2, 8);

function markDirty() {
  if (IS_SERVERLESS) dirty = true;
}

function snapshotJSON() {
  const data = { v: 1, tables: {} };
  for (const t of TABLES) {
    const cols = origPrepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
    data.tables[t] = { cols, rows: origPrepare(`SELECT * FROM ${t}`).all() };
  }
  return JSON.stringify(data);
}

function restoreSnapshot(text) {
  const data = JSON.parse(text);
  if (!data || data.v !== 1 || !data.tables) throw new Error('bad snapshot');
  origExec('BEGIN IMMEDIATE');
  try {
    for (const t of [...TABLES].reverse()) origExec(`DELETE FROM ${t}`);
    for (const t of TABLES) {
      const { cols, rows } = data.tables[t] || { cols: [], rows: [] };
      if (!rows.length) continue;
      const ins = origPrepare(`INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
      for (const row of rows) ins.run(...cols.map((c) => row[c]));
    }
    origExec('COMMIT');
  } catch (err) {
    origExec('ROLLBACK');
    throw err;
  }
}

async function flush() {
  if (!IS_SERVERLESS) return;
  if (!dirty) return;
  dirty = false;
  const store = blobs();
  if (!store) return;
  const body = snapshotJSON();
  const prev = flushChain || Promise.resolve();
  flushChain = prev
    .then(() => store.set('db.json', body))
    .then(() => {
      if (process.env.VERCEL) console.error(`[flush:${INSTANCE_ID}] wrote ${body.length}B`);
    })
    .catch((err) => console.error('Demo: persist failed:', err.message));
  await flushChain;
}

// Boot once per instance, lazily from inside the request handler: the Blobs
// environment is injected per invocation, so the store must be created there
// (and the schema is guaranteed to exist by then).
let bootPromise = null;
function initDb() {
  if (!bootPromise) bootPromise = boot();
  return bootPromise;
}

async function boot() {
  if (!IS_SERVERLESS) return;
  const store = blobs();
  if (store) {
    try {
      const snap = await store.get('db.json');
      if (snap) {
        restoreSnapshot(snap);
        // Restored data is authoritative — don't re-flush it on this request.
        dirty = false;
        if (process.env.VERCEL) console.error(`[boot:${INSTANCE_ID}] restored ${snap.length}B`);
        return;
      }
      if (process.env.VERCEL) console.error(`[boot:${INSTANCE_ID}] no snapshot, seeding`);
    } catch (err) {
      console.error(`[boot:${INSTANCE_ID}] restore failed, reseeding:`, err.message);
    }
  }
  seed();
  if (store) {
    try {
      await store.set('db.json', snapshotJSON());
      if (process.env.VERCEL) console.error(`[boot:${INSTANCE_ID}] seeded + wrote snapshot`);
    } catch (err) {
      console.error('Demo: initial persist failed:', err.message);
    }
  }
}

/* --- capture every write so nothing is lost between requests --- */
db.prepare = (sql) => {
  const stmt = origPrepare(sql);
  if (/\b(insert|update|delete|replace)\b/i.test(sql)) {
    const origRun = stmt.run.bind(stmt);
    stmt.run = (...args) => {
      const r = origRun(...args);
      markDirty();
      return r;
    };
  }
  return stmt;
};
db.exec = (sql) => {
  const r = origExec(sql);
  if (
    !/^\s*(begin|commit|rollback|pragma|create|select)\b/i.test(sql) &&
    /\b(insert|update|delete|replace)\b/i.test(sql)
  ) {
    markDirty();
  }
  return r;
};

/* ------------------------------------------------------------------ schema */
db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT '#2563EB',
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  brand TEXT NOT NULL,
  cat_id INTEGER NOT NULL REFERENCES categories(id),
  price REAL NOT NULL,
  old_price REAL,
  stock INTEGER NOT NULL DEFAULT 0,
  warranty INTEGER NOT NULL DEFAULT 12,
  condition TEXT NOT NULL DEFAULT 'new',
  badge TEXT,
  specs TEXT NOT NULL DEFAULT '{}',
  desc_fr TEXT NOT NULL DEFAULT '',
  desc_ar TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  ref TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  subtotal REAL NOT NULL,
  shipping REAL NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'nouvelle',
  stock_restored INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  sku TEXT NOT NULL,
  price REAL NOT NULL,
  qty INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS carts (
  sid TEXT NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (sid, product_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS newsletter (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY,
  sid TEXT NOT NULL,
  path TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'fr',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits (created_at);
`);

/* --------------------------------------------------------------- settings */
const DEFAULTS = {
  site_url: 'https://demo-store.netlify.app',
  store_name: 'Demo Store',
  tagline_fr: 'Smartphones, écouteurs & enceintes — boutique démo',
  tagline_ar: 'هواتف وسماعات ومكبرات صوت — نسخة تجريبية',
  phone: '+216 70 000 000',
  wa: '21670000000',
  email: 'contact@demo-store.tn',
  address: 'Adresse de démonstration, Tunisie',
  free_ship: '500',
  ship_tunis: '7',
  ship_other: '8',
  announcement_fr: 'Version de démonstration — données fictives',
  announcement_ar: 'نسخة تجريبية — بيانات وهمية',
  meta_fr:
    "Demo Store, boutique de démonstration : smartphones, écouteurs sans fil et enceintes Bluetooth. Catalogue en DT avec fiches techniques en français et en arabe.",
  meta_ar:
    'متجر تجريبي: هواتف ذكية وسماعات لاسلكية ومكبرات صوت بلوتوث. كتالوج بالدينار مع مواصفات بالفرنسية والعربية.',
  admin_note: 'Boutique de démonstration : catalogue fictif, prix et stocks de démonstration. Commandes WhatsApp à configurer dans Paramètres.',
};

const settingStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
const settingSet = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
);

if (!db.prepare('SELECT COUNT(*) AS n FROM settings').get().n) {
  for (const [k, v] of Object.entries(DEFAULTS)) settingSet.run(k, v);
}

function settings() {
  const out = { ...DEFAULTS };
  for (const row of db.prepare('SELECT key, value FROM settings').all()) out[row.key] = row.value;
  if (process.env.SITE_URL) out.site_url = process.env.SITE_URL.replace(/\/+$/, '');
  return out;
}

/* ----------------------------------------------------------------- seeding */
const { CATS, PRODUCTS } = require('./catalog');

function seed() {
  const n = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (n > 0) return false;

  db.exec('BEGIN IMMEDIATE');
  try {

  const insCat = db.prepare(
    'INSERT OR IGNORE INTO categories (slug, name_fr, name_ar, accent, sort) VALUES (?, ?, ?, ?, ?)'
  );
  for (const c of CATS) insCat.run(...c);
  const catId = Object.fromEntries(
    db.prepare('SELECT id, slug FROM categories').all().map((r) => [r.slug, r.id])
  );

  const insP = db.prepare(`INSERT INTO products
    (slug, sku, name_fr, name_ar, brand, cat_id, price, old_price, stock, warranty,
     condition, badge, specs, desc_fr, desc_ar, image)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const p of PRODUCTS) {
    insP.run(
      p.slug, p.sku, p.nameFr, p.nameAr, p.brand, catId[p.category], p.price, p.oldPrice,
      p.stock, p.warranty, p.condition, p.badge, JSON.stringify(p.specs), p.descriptionFr,
      p.descriptionAr, p.image
    );
  }
    db.exec('COMMIT');
    return true;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ------------------------------------------------------------- visits
// Visitor counter for the admin dashboard. One row per page view
// (same sid + path within a minute is ignored). Pruned to 90 days so
// the blob snapshot stays small.
function pruneVisits() {
  try { origExec(`DELETE FROM visits WHERE created_at < datetime('now','-90 days')`); } catch {}
}
pruneVisits();

function logVisit(sid, path, lang) {
  try {
    const dup = db
      .prepare(`SELECT 1 AS x FROM visits WHERE sid = ? AND path = ? AND created_at > datetime('now','-1 minute')`)
      .get(sid, path);
    if (dup) return;
    db.prepare('INSERT INTO visits (sid, path, lang) VALUES (?, ?, ?)').run(sid, path, lang);
    pruneVisits();
  } catch {}
}

module.exports = { db, settings, seed, DATA_DIR, initDb, flush, logVisit };
