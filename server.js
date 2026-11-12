'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { db, settings, seed, initDb, flush: dbFlush } = require('./db');
const L = require('./lib');
const ui = require('./ui');
const store = require('./views-store');
const admin = require('./views-admin');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'demostore2026';
const ROOT = __dirname;

// On serverless the DB starts empty at module load (blob restore happens later,
// inside initDb); seeding here would race the snapshot restore.
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);
if (!IS_SERVERLESS) seed();
if (!IS_SERVERLESS) {
  // Demo store sells new products only. Keep this invariant for older databases too.
  db.prepare("UPDATE products SET condition = 'new' WHERE condition <> 'new'").run();
}

/* ------------------------------------------------------------------ utils */
function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function setCookie(res, name, value, opts = {}) {
  const bits = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (opts.maxAge) bits.push(`Max-Age=${opts.maxAge}`);
  if (opts.expires) bits.push(`Expires=${opts.expires.toUTCString()}`);
  (res._cookies = res._cookies || []).push(bits.join('; '));
}
function send(res, status, body, headers = {}) {
  const h = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  };
  if (res._cookies && res._cookies.length) h['Set-Cookie'] = res._cookies;
  res.writeHead(status, h);
  res.end(body);
}
const redirect = (res, to, status = 303) => {
  const h = { Location: to, 'Cache-Control': 'no-store' };
  if (res._cookies && res._cookies.length) h['Set-Cookie'] = res._cookies;
  res.writeHead(status, h);
  res.end();
};
const html = (res, status, body) => send(res, status, body);

function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
const formOf = (raw) => new URLSearchParams(raw);

function sidOf(req, res) {
  const c = parseCookies(req);
  if (c.pb_sid && /^[a-f0-9-]{8,}$/.test(c.pb_sid)) return c.pb_sid;
  const sid = crypto.randomUUID();
  setCookie(res, 'pb_sid', sid, { maxAge: 60 * 60 * 24 * 30 });
  return sid;
}

/* --------------------------------------------------------------- admin auth */
const ADMIN_AUTH_KEY = crypto
  .createHash('sha256')
  .update(`demo-store-admin:${ADMIN_PASSWORD}`)
  .digest();

function newAdminToken() {
  const exp = String(Date.now() + 12 * 3600 * 1000);
  const sig = crypto.createHmac('sha256', ADMIN_AUTH_KEY).update(exp).digest('base64url');
  return `${exp}.${sig}`;
}

function adminToken(req) {
  const token = parseCookies(req).pb_admin;
  if (!token) return null;
  const [exp, sig] = token.split('.');
  if (!/^\d{13}$/.test(exp || '') || Number(exp) < Date.now() || !sig) return null;
  const expected = crypto.createHmac('sha256', ADMIN_AUTH_KEY).update(exp).digest('base64url');
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(actualBuf, expectedBuf)) return null;
  return token;
}

/* -------------------------------------------------------------------- data */
const qCats = () =>
  db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.cat_id = c.id AND p.active = 1) AS n
    FROM categories c ORDER BY c.sort`).all();

function countsByStatus() {
  const rows = db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all();
  const out = { all: 0 };
  for (const r of rows) { out[r.status] = r.n; out.all += r.n; }
  return out;
}

function cartRows(sid) {
  return db
    .prepare(
      `SELECT ci.product_id, ci.qty, p.slug, p.name_fr, p.name_ar, p.price, p.stock, p.brand, p.sku, p.image
       FROM carts ci JOIN products p ON p.id = ci.product_id
       WHERE ci.sid = ? ORDER BY ci.added_at`
    )
    .all(sid);
}
function cartCount(sid) {
  if (!sid) return 0;
  return db.prepare('SELECT COALESCE(SUM(qty),0) AS n FROM carts WHERE sid = ?').get(sid).n;
}
function totalsFor(rows, s, gov = 'Ariana') {
  const subtotal = rows.reduce((a, r) => a + r.price * r.qty, 0);
  const shipping = rows.length ? L.shippingFor(subtotal, gov, s) : 0;
  const freeShip = Number(s.free_ship) || 500;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShipGap: Math.max(0, freeShip - subtotal),
  };
}

function orderWhatsAppUrl(s, lang, order, items) {
  let number = String(s.wa || '').replace(/\D/g, '');
  if (/^[2-9]\d{7}$/.test(number)) number = `216${number}`;
  const productLines = items.map((item) => {
    const name = lang === 'ar' ? item.name_ar : item.name_fr;
    return `• ${item.qty} × ${name} — ${L.money(item.price * item.qty, lang)}`;
  });
  const address = `${order.address}, ${order.city}, ${
    lang === 'ar' ? L.GOV_AR[order.governorate] || order.governorate : order.governorate
  }`;
  const message = lang === 'ar'
    ? [
        'طلب جديد من المتجر التجريبي',
        `المرجع: ${order.ref}`,
        '',
        `الحريف: ${order.customer_name}`,
        `الهاتف: ${order.phone}`,
        `العنوان: ${address}`,
        '',
        'المنتجات:',
        ...productLines,
        '',
        `المجموع الفرعي: ${L.money(order.subtotal, lang)}`,
        `التوصيل: ${order.shipping === 0 ? 'مجاني' : L.money(order.shipping, lang)}`,
        `المجموع: ${L.money(order.total, lang)}`,
        order.note ? `ملاحظة: ${order.note}` : '',
      ]
    : [
        'Nouvelle commande — boutique démo',
        `Référence : ${order.ref}`,
        '',
        `Client : ${order.customer_name}`,
        `Téléphone : ${order.phone}`,
        `Adresse : ${address}`,
        '',
        'Produits :',
        ...productLines,
        '',
        `Sous-total : ${L.money(order.subtotal, lang)}`,
        `Livraison : ${order.shipping === 0 ? 'Gratuite' : L.money(order.shipping, lang)}`,
        `Total : ${L.money(order.total, lang)}`,
        order.note ? `Note : ${order.note}` : '',
      ];
  return `https://wa.me/${number}?text=${encodeURIComponent(message.filter(Boolean).join('\n'))}`;
}

function publicOrigin(req, fallback) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const host = forwardedHost || String(req.headers.host || '').trim();
  if (host && /^[a-z0-9.:[\]-]+$/i.test(host)) {
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const proto = forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : (process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME ? 'https' : 'http');
    return `${proto}://${host}`.replace(/\/+$/, '');
  }
  return String(fallback || 'https://demo-store.netlify.app').replace(/\/+$/, '');
}

function baseCtx(req, res, lang, p) {
  const s = { ...settings() };
  s.site_url = publicOrigin(req, s.site_url);
  const sid = sidOf(req, res);
  const rawUrl = new URL(req.url, 'http://localhost');
  const otherPath = lang === 'ar' ? (rawUrl.pathname.replace(/^\/ar/, '') || '/') : '/ar' + (rawUrl.pathname === '/' ? '/' : rawUrl.pathname);
  return {
    lang,
    s,
    cats: qCats(),
    sid,
    cartCount: cartCount(sid),
    path: (lang === 'ar' ? '/ar' : '') + p,
    otherLangHref: otherPath + rawUrl.search,
    active: '',
    counts: {
      products: db.prepare('SELECT COUNT(*) AS n FROM products WHERE active = 1').get().n,
      inStock: db.prepare('SELECT COUNT(*) AS n FROM products WHERE active = 1 AND stock > 0').get().n,
    },
  };
}

function safeNext(next, fallback) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

/* ------------------------------------------------------------------ routes */
async function handler(req, res) {
  await initDb();
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    return send(res, 400, 'Bad request');
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    pathname = url.pathname;
  }
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);

  const method = req.method.toUpperCase();

  try {
    /* ---------------------------------------------------------- static */
    if ([
      '/styles.css', '/admin.css', '/app.js',
      '/favicon.svg', '/favicon.png', '/og.svg', '/og.png',
      '/logo-demo-dark.png', '/logo-demo-light.png',
    ].includes(pathname)) {
      return serveFile(res, path.join(ROOT, 'public', pathname.slice(1)), pathname);
    }
    if (pathname.startsWith('/uploads/')) {
      return serveFile(res, path.join(ROOT, 'uploads', path.basename(pathname)), pathname);
    }
    if (pathname.startsWith('/img/products/') && pathname.endsWith('.webp')) {
      return serveFile(res, path.join(ROOT, 'public', 'img', 'products', path.basename(pathname)), pathname);
    }

    /* ------------------------------------------------ generated images */
    if (pathname.startsWith('/img/p/') && pathname.endsWith('.svg')) {
      const id = Number(pathname.slice(7, -4));
      const row = db
        .prepare('SELECT p.*, c.slug AS cat_slug, c.accent FROM products p JOIN categories c ON c.id = p.cat_id WHERE p.id = ?')
        .get(id);
      if (!row) return notFound(res, req);
      row.variant = Number(url.searchParams.get('v')) || 1;
      return svg(res, L.productArt(row));
    }

    /* -------------------------------------------------------------- seo */
    if (pathname === '/robots.txt') {
      const s = settings();
      const base = publicOrigin(req, s.site_url);
      return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /panier\nDisallow: /commande\n\nSitemap: ${base}/sitemap.xml\n`, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      });
    }
    if (pathname === '/sitemap.xml') {
      return sitemap(res, req);
    }

    if (pathname === '/favicon.svg' || pathname === '/og.svg') {
      return serveFile(res, path.join(ROOT, 'public', pathname.slice(1)), pathname);
    }

    /* --------------------------------------------------------- language */
    let lang = 'fr';
    let p = pathname;
    if (p === '/ar') { p = '/'; lang = 'ar'; }
    else if (p.startsWith('/ar/')) { p = p.slice(3); lang = 'ar'; }

    const ctx = baseCtx(req, res, lang, p);

    /* ------------------------------------------------------------- cart */
    if (p === '/panier') {
      const rows = cartRows(ctx.sid);
      return html(res, 200, store.cartPage(ctx, rows, totalsFor(rows, ctx.s)));
    }
    if (p === '/panier/ajouter' && method === 'POST') {
      const f = formOf(await readBody(req));
      const id = Number(f.get('id'));
      const qty = Math.max(1, Math.min(20, Number(f.get('qty')) || 1));
      const prod = db.prepare('SELECT id, stock FROM products WHERE id = ? AND active = 1').get(id);
      if (prod && prod.stock > 0) {
        const cur = db.prepare('SELECT qty FROM carts WHERE sid = ? AND product_id = ?').get(ctx.sid, id);
        const nextQty = Math.min(prod.stock, (cur ? cur.qty : 0) + qty);
        if (cur) db.prepare('UPDATE carts SET qty = ? WHERE sid = ? AND product_id = ?').run(nextQty, ctx.sid, id);
        else db.prepare('INSERT INTO carts (sid, product_id, qty) VALUES (?, ?, ?)').run(ctx.sid, id, nextQty);
      }
      const count = cartCount(ctx.sid);
      if (req.headers['x-pb'] === '1') {
        return send(res, 200, JSON.stringify({ ok: true, count }), { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      }
      if (f.get('buynow') === '1') return redirect(res, ui.u(lang, '/commande'));
      return redirect(res, safeNext(f.get('next'), ui.u(lang, '/panier')), 302);
    }
    if (p === '/panier/maj' && method === 'POST') {
      const f = formOf(await readBody(req));
      const id = Number(f.get('id'));
      const qty = Number(f.get('qty'));
      const prod = db.prepare('SELECT stock FROM products WHERE id = ?').get(id);
      if (prod) {
        if (!Number.isFinite(qty) || qty <= 0) db.prepare('DELETE FROM carts WHERE sid = ? AND product_id = ?').run(ctx.sid, id);
        else db.prepare('UPDATE carts SET qty = ? WHERE sid = ? AND product_id = ?').run(Math.min(qty, prod.stock || 1), ctx.sid, id);
      }
      return redirect(res, ui.u(lang, '/panier'));
    }
    if (p === '/panier/supprimer' && method === 'POST') {
      const f = formOf(await readBody(req));
      db.prepare('DELETE FROM carts WHERE sid = ? AND product_id = ?').run(ctx.sid, Number(f.get('id')));
      return redirect(res, ui.u(lang, '/panier'));
    }
    if (p === '/panier/vider' && method === 'POST') {
      db.prepare('DELETE FROM carts WHERE sid = ?').run(ctx.sid);
      return redirect(res, ui.u(lang, '/panier'));
    }

    /* --------------------------------------------------------- checkout */
    if (p === '/commande' && method === 'GET') {
      const rows = cartRows(ctx.sid);
      if (!rows.length) return redirect(res, ui.u(lang, '/panier'));
      return html(res, 200, store.checkout(ctx, rows, totalsFor(rows, ctx.s)));
    }
    if (p === '/commande' && method === 'POST') {
      const f = formOf(await readBody(req));
      const rows = cartRows(ctx.sid);
      if (!rows.length) return redirect(res, ui.u(lang, '/panier'));
      const form = {
        customer_name: (f.get('customer_name') || '').trim(),
        phone: (f.get('phone') || '').replace(/\s+/g, ''),
        governorate: (f.get('governorate') || '').trim(),
        city: (f.get('city') || '').trim(),
        address: (f.get('address') || '').trim(),
        note: (f.get('note') || '').trim().slice(0, 300),
      };
      const errors = {};
      if (form.customer_name.length < 3) errors.customer_name = L.t(lang, 'co.required');
      if (!L.TND_CODES.test(form.phone)) errors.phone = L.t(lang, 'co.phone.err');
      if (!L.GOV.includes(form.governorate)) errors.governorate = L.t(lang, 'co.required');
      if (form.city.length < 2) errors.city = L.t(lang, 'co.required');
      if (form.address.length < 5) errors.address = L.t(lang, 'co.required');

      for (const r of rows) {
        if (r.qty > r.stock) {
          errors._global =
            lang === 'ar'
              ? `الكمية المطلوبة من «${r.name_ar}» غير متوفرة. يرجى تعديل السلة.`
              : `Stock insuffisant pour « ${r.name_fr} ». Merci d’ajuster votre panier.`;
        }
      }

      if (Object.keys(errors).length) {
        return html(res, 400, store.checkout(ctx, rows, totalsFor(rows, ctx.s, form.governorate || 'Ariana'), form, errors));
      }

      const totals = totalsFor(rows, ctx.s, form.governorate);
      const nextId = db.prepare('SELECT COALESCE(MAX(id),0)+1 AS n FROM orders').get().n;
      const ref = 'PB-' + (1040 + nextId);

      db.exec('BEGIN IMMEDIATE');
      try {
        const info = db
          .prepare(
            `INSERT INTO orders (ref, customer_name, phone, governorate, city, address, note, subtotal, shipping, total, status)
             VALUES (?,?,?,?,?,?,?,?,?,?,'nouvelle')`
          )
          .run(ref, form.customer_name, form.phone, form.governorate, form.city, form.address, form.note,
            totals.subtotal, totals.shipping, totals.total);
        const orderId = Number(info.lastInsertRowid);
        const insItem = db.prepare(
          'INSERT INTO order_items (order_id, product_id, name_fr, name_ar, sku, price, qty) VALUES (?,?,?,?,?,?,?)'
        );
        const dec = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?');
        for (const r of rows) {
          insItem.run(orderId, r.product_id, r.name_fr, r.name_ar, r.sku, r.price, r.qty);
          dec.run(r.qty, r.product_id);
        }
        db.prepare('DELETE FROM carts WHERE sid = ?').run(ctx.sid);
        db.exec('COMMIT');
        return redirect(res, orderWhatsAppUrl(ctx.s, lang, {
          ...form,
          ref,
          subtotal: totals.subtotal,
          shipping: totals.shipping,
          total: totals.total,
        }, rows));
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    }
    if (p.startsWith('/commande/confirmee/')) {
      const ref = p.split('/').pop();
      const o = db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref);
      if (!o) return notFound(res, req);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
      return html(res, 200, store.confirmed(ctx, o, items));
    }

    /* -------------------------------------------------------- newsletter */
    if (p === '/newsletter' && method === 'POST') {
      const f = formOf(await readBody(req));
      const email = (f.get('email') || '').trim().toLowerCase();
      if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) {
        db.prepare('INSERT INTO newsletter (email) VALUES (?) ON CONFLICT(email) DO NOTHING').run(email);
      }
      return redirect(res, ui.u(lang, '/') + '?news=1', 302);
    }

    /* ----------------------------------------------------------- admin */
    if (p === '/admin/login' && method === 'GET') {
      return html(res, 200, admin.login(ctx, null));
    }
    if (p === '/admin/login' && method === 'POST') {
      const f = formOf(await readBody(req));
      if ((f.get('password') || '') === ADMIN_PASSWORD) {
        const token = newAdminToken();
        setCookie(res, 'pb_admin', token, { maxAge: 12 * 3600 });
        return redirect(res, '/admin');
      }
      return html(res, 401, admin.login(ctx, 'Mot de passe incorrect.'));
    }
    if (p === '/admin/logout' && method === 'POST') {
      setCookie(res, 'pb_admin', '', { maxAge: 0 });
      return redirect(res, '/admin/login');
    }

    if (p.startsWith('/admin')) {
      if (!adminToken(req)) return redirect(res, '/admin/login');

      const status = countsByStatus();
      const lowCount = db.prepare('SELECT COUNT(*) AS n FROM products WHERE stock <= 5').get().n;
      const flash = url.searchParams.get('flash') || null;

      if (method === 'POST') {
        /* ---- product stock ---- */
        if (p === '/admin/produits/stock') {
          const f = formOf(await readBody(req));
          db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(
            Math.max(0, Number(f.get('stock')) || 0), Number(f.get('id'))
          );
          return redirect(res, '/admin/produits?flash=' + encodeURIComponent('Stock mis à jour.'));
        }
        /* ---- product save ---- */
        if (p === '/admin/produits/enregistrer') {
          const f = formOf(await readBody(req));
          const id = Number(f.get('id')) || 0;
          const name_fr = (f.get('name_fr') || '').trim();
          const name_ar = (f.get('name_ar') || '').trim();
          const sku = (f.get('sku') || '').trim();
          const brand = (f.get('brand') || '').trim();
          const cat_id = Number(f.get('cat_id')) || null;
          const price = Number(f.get('price'));
          if (!name_fr || !name_ar || !sku || !brand || !cat_id || !(price > 0)) {
            const cats = qCats();
            const draft = { ...Object.fromEntries(f), id };
            return html(res, 400, admin.productForm(ctx, draft, cats, 'Nom FR/AR, SKU, marque, catégorie et prix sont obligatoires.'));
          }
          const specsObj = {};
          for (const line of String(f.get('specs') || '').split('\n')) {
            const ix = line.search(/[:=]/);
            if (ix > 0) {
              const k = line.slice(0, ix).trim();
              const v = line.slice(ix + 1).trim();
              if (k && v) specsObj[k] = v;
            }
          }
          const baseSlug = L.slugify((f.get('slug') || '').trim() || name_fr);
          let slug = baseSlug || 'produit-' + Date.now();
          const taken = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(slug, id);
          if (taken) slug = slug + '-' + Math.floor(Math.random() * 900 + 100);
          const vals = [
            name_fr, name_ar, sku, brand, cat_id, price,
            Number(f.get('old_price')) || null, Math.max(0, Number(f.get('stock')) || 0),
             Math.max(0, Number(f.get('warranty')) || 0), 'new',
            (f.get('badge') || '').trim(), JSON.stringify(specsObj),
            (f.get('desc_fr') || '').trim(), (f.get('desc_ar') || '').trim(),
            (f.get('image') || '').trim(), f.get('active') === '0' ? 0 : 1,
          ];
          try {
            if (id) {
              db.prepare(`UPDATE products SET name_fr=?, name_ar=?, sku=?, brand=?, cat_id=?, price=?, old_price=?,
                stock=?, warranty=?, condition=?, badge=?, specs=?, desc_fr=?, desc_ar=?, image=?, active=?, slug=? WHERE id=?`)
                .run(...vals, slug, id);
            } else {
              db.prepare(`INSERT INTO products (name_fr, name_ar, sku, brand, cat_id, price, old_price, stock,
                warranty, condition, badge, specs, desc_fr, desc_ar, image, active, slug)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...vals, slug);
            }
          } catch (err) {
            const cats = qCats();
            return html(res, 400, admin.productForm(ctx, { ...Object.fromEntries(f), id }, cats, 'Ce SKU ou ce slug existe déjà.'));
          }
          return redirect(res, '/admin/produits?flash=' + encodeURIComponent(id ? 'Produit enregistré.' : 'Produit créé.'));
        }
        /* ---- delete ---- */
        if (p === '/admin/produits/supprimer') {
          const f = formOf(await readBody(req));
          const id = Number(f.get('id'));
          db.exec('BEGIN IMMEDIATE');
          try {
            db.prepare('UPDATE order_items SET product_id = NULL WHERE product_id = ?').run(id);
            db.prepare('DELETE FROM carts WHERE product_id = ?').run(id);
            db.prepare('DELETE FROM products WHERE id = ?').run(id);
            db.exec('COMMIT');
          } catch (e) { db.exec('ROLLBACK'); throw e; }
          return redirect(res, '/admin/produits?flash=' + encodeURIComponent('Produit supprimé.'));
        }
        /* ---- csv import ---- */
        if (p === '/admin/import') {
          const f = formOf(await readBody(req));
          const rows = L.parseCSV(f.get('csv') || '');
          const cats = db.prepare('SELECT * FROM categories').all();
          let created = 0, updated = 0, skipped = 0;
          for (const r of rows) {
            const get = (...keys) => keys.map((k) => r[k]).find((v) => v != null && v !== '');
            const sku = get('sku', 'reference', 'ref');
            const name_fr = get('nom_fr', 'name_fr', 'nom', 'name', 'produit');
            const price = Number(String(get('prix', 'price') || '').replace(',', '.'));
            if (!sku || !name_fr || !(price > 0)) { skipped++; continue; }
            const catRaw = String(get('categorie', 'category', 'cat') || '').trim().toLowerCase();
            const cat = cats.find((c) => c.slug === catRaw || c.name_fr.toLowerCase() === catRaw) || cats[0];
            const name_ar = get('nom_ar', 'name_ar') || name_fr;
            const brand = get('marque', 'brand') || 'Demo Store';
            const old = Number(String(get('ancien_prix', 'old_price') || '').replace(',', '.')) || null;
            const stock = Math.max(0, Number(get('stock', 'quantite', 'qty')) || 0);
            const warranty = Number(get('garantie', 'warranty')) || 12;
            const descFr = get('description_fr', 'desc_fr', 'description') || '';
            const image = get('image', 'image_url', 'photo') || '';
            const slug = L.slugify(name_fr) || 'produit-' + sku;
            const exists = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
            try {
              if (exists) {
                db.prepare(`UPDATE products SET name_fr=?, name_ar=?, brand=?, cat_id=?, price=?, old_price=?,
                  stock=?, warranty=?, desc_fr=?, image=? WHERE id=?`)
                  .run(name_fr, name_ar, brand, cat.id, price, old, stock, warranty, descFr, image, exists.id);
                updated++;
              } else {
                db.prepare(`INSERT INTO products (slug, sku, name_fr, name_ar, brand, cat_id, price, old_price,
                  stock, warranty, desc_fr, image) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
                  .run(slug + '-' + sku.toLowerCase().replace(/[^a-z0-9]+/g, ''), sku, name_fr, name_ar, brand, cat.id,
                    price, old, stock, warranty, descFr, image);
                created++;
              }
            } catch { skipped++; }
          }
          const msg = `Import terminé : ${created} créé(s), ${updated} mis à jour${skipped ? `, ${skipped} ignoré(s)` : ''}.`;
          return redirect(res, '/admin/produits?flash=' + encodeURIComponent(msg));
        }
        /* ---- order status ---- */
        const mStatus = p.match(/^\/admin\/commandes\/(\d+)\/statut$/);
        if (mStatus) {
          const f = formOf(await readBody(req));
          const id = Number(mStatus[1]);
          const next = f.get('status');
          if (!L.STATUSES.some((s) => s.key === next)) return redirect(res, `/admin/commandes/${id}`);
          const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
          if (!o) return notFound(res, req);
          db.exec('BEGIN IMMEDIATE');
          try {
            if (next === 'annulee' && !o.stock_restored) {
              for (const it of db.prepare('SELECT product_id, qty FROM order_items WHERE order_id = ? AND product_id IS NOT NULL').all(id)) {
                db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(it.qty, it.product_id);
              }
              db.prepare('UPDATE orders SET status = ?, stock_restored = 1 WHERE id = ?').run(next, id);
            } else if (o.status === 'annulee' && next !== 'annulee' && o.stock_restored) {
              for (const it of db.prepare('SELECT product_id, qty FROM order_items WHERE order_id = ? AND product_id IS NOT NULL').all(id)) {
                db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(it.qty, it.product_id);
              }
              db.prepare('UPDATE orders SET status = ?, stock_restored = 0 WHERE id = ?').run(next, id);
            } else {
              db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(next, id);
            }
            db.exec('COMMIT');
          } catch (e) { db.exec('ROLLBACK'); throw e; }
          return redirect(res, `/admin/commandes/${id}?flash=` + encodeURIComponent('Statut mis à jour.'));
        }
        /* ---- settings ---- */
        if (p === '/admin/parametres') {
          const f = formOf(await readBody(req));
          const allow = ['store_name', 'tagline_fr', 'tagline_ar', 'phone', 'wa', 'email', 'address',
            'free_ship', 'ship_tunis', 'ship_other', 'announcement_fr', 'announcement_ar', 'meta_fr', 'meta_ar', 'site_url'];
          const st = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
          for (const k of allow) if (f.has(k)) st.run(k, f.get(k).trim());
          return redirect(res, '/admin/parametres?flash=' + encodeURIComponent('Paramètres enregistrés.'));
        }
        return send(res, 404, 'Nope');
      }

      /* ---- GET admin ---- */
      if (p === '/admin' || p === '/admin/') {
        const rev = (days, offset = 0) =>
          db.prepare(`SELECT COALESCE(SUM(total),0) AS v FROM orders WHERE status != 'annulee'
            AND created_at >= datetime('now', ? ) AND created_at < datetime('now', ?)`)
            .get(`-${days + offset} days`, `-${offset} days`).v;
        const cnt = (days, offset = 0) =>
          db.prepare(`SELECT COUNT(*) AS v FROM orders WHERE status != 'annulee'
            AND created_at >= datetime('now', ?) AND created_at < datetime('now', ?)`)
            .get(`-${days + offset} days`, `-${offset} days`).v;

        const rev30 = rev(30);
        const prevRev = rev(30, 30);
        const orders30 = cnt(30);
        const prevOrders = cnt(30, 30);
        const delta = (a, b) => (b > 0 ? `${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)}%` : null);

        const chartRows = db.prepare(`SELECT date(created_at) AS d, SUM(total) AS t FROM orders
          WHERE status != 'annulee' AND created_at >= datetime('now','-13 days','start of day')
          GROUP BY d`).all();
        const byDay = Object.fromEntries(chartRows.map((r) => [r.d, r.t]));
        const chart = [];
        for (let i = 13; i >= 0; i--) {
          const dt = new Date(Date.now() - i * 864e5);
          const key = dt.toISOString().slice(0, 10);
          chart.push({
            day: key,
            label: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(dt),
            total: byDay[key] || 0,
          });
        }

        const top = db.prepare(`SELECT oi.product_id AS id, MAX(oi.name_fr) AS name_fr, MAX(oi.sku) AS sku,
            SUM(oi.qty) AS qty, SUM(oi.qty * oi.price) AS revenue
          FROM order_items oi JOIN orders o ON o.id = oi.order_id
          WHERE o.status != 'annulee' AND o.created_at >= datetime('now','-30 days')
          GROUP BY oi.product_id ORDER BY qty DESC LIMIT 5`).all();
        const prodMeta = Object.fromEntries(
          db.prepare('SELECT id, brand, image FROM products').all().map((r) => [r.id, r])
        );
        for (const t of top) {
          t.brand = (prodMeta[t.id] && prodMeta[t.id].brand) || t.sku;
          t.image = (prodMeta[t.id] && prodMeta[t.id].image) || '';
        }

        const recent = db.prepare(`SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
          FROM orders o ORDER BY o.created_at DESC, o.id DESC LIMIT 6`).all();
        const low = db.prepare('SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC, id DESC LIMIT 6').all();

        const acx = { ...ctx, adActive: '/', newOrders: status.nouvelle || 0, lowCount };
        return html(res, 200, admin.dashboard(acx, {
          rev30, revDelta: delta(rev30, prevRev), orders30, ordersDelta: delta(orders30, prevOrders),
          pending: status.nouvelle || 0, aov: orders30 ? rev30 / orders30 : 0,
          lowCount, chart, top, recent, low,
        }));
      }

      if (p === '/admin/produits') {
        const q = (url.searchParams.get('q') || '').trim();
        const like = `%${q}%`;
        const list = db.prepare(`SELECT p.*, c.name_fr AS cat_name FROM products p JOIN categories c ON c.id = p.cat_id
          ${q ? 'WHERE p.name_fr LIKE ? OR p.name_ar LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?' : ''}
          ORDER BY p.id DESC`).all(...(q ? [like, like, like, like] : []));
        const acx = { ...ctx, adActive: '/admin/produits', newOrders: status.nouvelle || 0, lowCount };
        return html(res, 200, admin.products(acx, list, q, flash));
      }
      if (p === '/admin/produits/nouveau') {
        const acx = { ...ctx, adActive: '/admin/produits', newOrders: status.nouvelle || 0, lowCount };
        return html(res, 200, admin.productForm(acx, { active: 1, warranty: 12, condition: 'new', price: '', stock: 0 }, qCats(), null, flash));
      }
      const mEdit = p.match(/^\/admin\/produits\/(\d+)$/);
      if (mEdit) {
        const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(mEdit[1]));
        if (!prod) return notFound(res, req);
        const acx = { ...ctx, adActive: '/admin/produits', newOrders: status.nouvelle || 0, lowCount };
        return html(res, 200, admin.productForm(acx, prod, qCats(), null, flash));
      }
      if (p === '/admin/commandes') {
        const filter = url.searchParams.get('statut') || 'all';
        const q = (url.searchParams.get('q') || '').trim();
        const like = `%${q}%`;
        const wheres = [];
        const params = [];
        if (filter !== 'all' && L.STATUSES.some((s) => s.key === filter)) { wheres.push('o.status = ?'); params.push(filter); }
        if (q) { wheres.push('(o.ref LIKE ? OR o.customer_name LIKE ? OR o.phone LIKE ?)'); params.push(like, like, like); }
        const list = db.prepare(`SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
          FROM orders o ${wheres.length ? 'WHERE ' + wheres.join(' AND ') : ''}
          ORDER BY o.created_at DESC, o.id DESC LIMIT 200`).all(...params);
        const acx = { ...ctx, adActive: '/admin/commandes', newOrders: status.nouvelle || 0, lowCount };
        return html(res, 200, admin.orders(acx, list, status, filter, q));
      }
      const mOrder = p.match(/^\/admin\/commandes\/(\d+)$/);
      if (mOrder) {
        const o = db.prepare(`SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
          FROM orders o WHERE o.id = ?`).get(Number(mOrder[1]));
        if (!o) return notFound(res, req);
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
        const acx = { ...ctx, adActive: '/admin/commandes', newOrders: status.nouvelle || 0, lowCount };
        return html(res, 200, admin.orderDetail(acx, o, items, flash));
      }
      if (p === '/admin/stock') {
        const all = db.prepare('SELECT * FROM products ORDER BY stock ASC').all();
        const low = all.filter((x) => x.stock <= 5);
        const acx = { ...ctx, adActive: '/admin/stock', newOrders: status.nouvelle || 0, lowCount };
        return html(res, 200, admin.stock(acx, low, all));
      }
      if (p === '/admin/parametres') {
        const acx = { ...ctx, adActive: '/admin/parametres', newOrders: status.nouvelle || 0, lowCount };
        return html(res, 200, admin.settings(acx, flash));
      }
      if (p === '/admin/export.csv') {
        const rows = db.prepare(`SELECT p.sku, p.name_fr AS nom_fr, p.name_ar AS nom_ar, p.brand AS marque,
          c.slug AS categorie, p.price AS prix, p.old_price AS ancien_prix, p.stock, p.warranty AS garantie,
          p.desc_fr AS description_fr, p.image FROM products p JOIN categories c ON c.id = p.cat_id ORDER BY p.id`).all();
        const head = ['sku', 'nom_fr', 'nom_ar', 'marque', 'categorie', 'prix', 'ancien_prix', 'stock', 'garantie', 'description_fr', 'image'];
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = [head.join(','), ...rows.map((r) => head.map((h) => esc(r[h])).join(','))].join('\n');
        return send(res, 200, '\ufeff' + csv, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="produits-demo.csv"',
        });
      }
      if (p === '/admin/modele.csv') {
        const csv = 'sku,nom_fr,nom_ar,marque,categorie,prix,ancien_prix,stock,garantie,description_fr,image\n' +
          'PB-NEW-001,Écouteurs JBL Tune Buds,سماعات JBL Tune Buds,JBL,ecouteurs,379,,10,12,Écouteurs Bluetooth,\n' +
          'PB-NEW-002,Enceinte JBL Go 4,مكبر صوت JBL Go 4,JBL,enceintes,149,159,20,12,Enceinte portable IP67,\n';
        return send(res, 200, '\ufeff' + csv, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="modele-import-produits.csv"',
        });
      }
      return notFound(res, req);
    }

    /* ------------------------------------------------------------- store */
    if (p === '/' || p === '') {
      const featured = db.prepare(`SELECT p.*, c.accent FROM products p JOIN categories c ON c.id = p.cat_id
        WHERE p.active = 1 AND p.badge = 'best'
        ORDER BY CASE c.slug
          WHEN 'casques-bluetooth' THEN 1 WHEN 'ecouteurs' THEN 2 WHEN 'enceintes' THEN 3
          WHEN 'smartphones' THEN 4 ELSE 5 END, p.id DESC LIMIT 1`).get()
        || db.prepare(`SELECT p.*, c.accent FROM products p JOIN categories c ON c.id = p.cat_id
        WHERE p.active = 1 ORDER BY p.id LIMIT 1`).get();
      const best = db.prepare(`WITH ranked AS (
        SELECT p.*, c.accent, c.slug AS cat_slug,
          ROW_NUMBER() OVER (
            PARTITION BY c.slug ORDER BY (p.badge = 'best') DESC, p.id DESC
          ) AS category_position,
          CASE c.slug
            WHEN 'casques-bluetooth' THEN 1 WHEN 'ecouteurs' THEN 2 WHEN 'enceintes' THEN 3
            WHEN 'smartphones' THEN 4 WHEN 'montres' THEN 5 ELSE 6 END AS category_rank
        FROM products p JOIN categories c ON c.id = p.cat_id WHERE p.active = 1
      )
      SELECT * FROM ranked WHERE category_position = 1
      ORDER BY (badge = 'best') DESC, category_rank LIMIT 4`).all();
      const deals = db.prepare(`SELECT p.*, c.accent FROM products p JOIN categories c ON c.id = p.cat_id
        WHERE p.active = 1 AND p.old_price IS NOT NULL AND p.old_price > p.price ORDER BY (p.old_price - p.price) DESC LIMIT 4`).all();
      const brands = db.prepare('SELECT DISTINCT brand FROM products ORDER BY brand').all().map((r) => r.brand);
      return html(res, 200, store.home({ ...ctx, active: 'home' }, { featured, best, deals, brands }));
    }

    if (p === '/boutique' || p.startsWith('/c/')) {
      const catSlug = p.startsWith('/c/') ? p.slice(3) : url.searchParams.get('cat') || '';
      const q = (url.searchParams.get('q') || '').trim().slice(0, 80);
      const brandsSel = url.searchParams.getAll('brand').filter(Boolean).slice(0, 8);
      const filters = {
        cat: catSlug,
        brand: brandsSel.join(','),
        min: url.searchParams.get('min') || '',
        max: url.searchParams.get('max') || '',
        stock: url.searchParams.get('stock') === '1' ? '1' : '',
        sort: url.searchParams.get('sort') || 'best',
      };
      const promoOnly = url.searchParams.get('promo') === '1';
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
      const perPage = 12;

      const where = ['p.active = 1'];
      const params = [];
      if (filters.cat) { where.push('c.slug = ?'); params.push(filters.cat); }
      if (q) {
        where.push('(p.name_fr LIKE ? OR p.name_ar LIKE ? OR p.brand LIKE ? OR p.sku LIKE ? OR p.desc_fr LIKE ?)');
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }
      if (brandsSel.length) {
        where.push(`p.brand IN (${brandsSel.map(() => '?').join(',')})`);
        params.push(...brandsSel);
      }
      if (Number(filters.min) > 0) { where.push('p.price >= ?'); params.push(Number(filters.min)); }
      if (Number(filters.max) > 0) { where.push('p.price <= ?'); params.push(Number(filters.max)); }
      if (filters.stock) where.push('p.stock > 0');
      if (promoOnly) where.push('p.old_price IS NOT NULL AND p.old_price > p.price');

      const orderBy = {
        price_asc: 'p.price ASC',
        price_desc: 'p.price DESC',
        best: "(p.badge = 'best') DESC, p.id DESC",
        new: 'p.id DESC',
      }[filters.sort] || 'p.id DESC';

      const whereSql = where.join(' AND ');
      const total = db.prepare(`SELECT COUNT(*) AS n FROM products p JOIN categories c ON c.id = p.cat_id WHERE ${whereSql}`).get(...params).n;
      const products = db.prepare(`SELECT p.*, c.accent FROM products p JOIN categories c ON c.id = p.cat_id
        WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, perPage, (page - 1) * perPage);
      const priceMax = Math.ceil(db.prepare('SELECT MAX(price) AS v FROM products WHERE active = 1').get().v || 0);
      const brands = db.prepare('SELECT DISTINCT brand FROM products ORDER BY brand').all().map((r) => r.brand);

      const acx = { ...ctx, active: 'shop', q, filters };
      return html(res, 200, store.catalog(acx, {
        products, total, page, pages: Math.max(1, Math.ceil(total / perPage)), priceMax, promoOnly, brands,
      }));
    }

    if (p.startsWith('/produit/')) {
      const slug = p.slice(9);
      const prod = db.prepare(`SELECT p.*, c.accent, c.slug AS cat_slug FROM products p JOIN categories c ON c.id = p.cat_id
        WHERE p.slug = ? AND p.active = 1`).get(slug);
      if (!prod) return notFound(res, req);
      const related = db.prepare(`SELECT p.*, c.accent FROM products p JOIN categories c ON c.id = p.cat_id
        WHERE p.cat_id = ? AND p.id != ? AND p.active = 1 ORDER BY p.stock DESC LIMIT 3`).all(prod.cat_id, prod.id);
      return html(res, 200, store.product(ctx, prod, related));
    }

    return notFound(res, req);
  } catch (err) {
    console.error('[error]', req.method, req.url, err);
    if (req.headers['x-pb'] === '1') {
      return send(res, 500, JSON.stringify({ ok: false }), { 'Content-Type': 'application/json' });
    }
    return send(res, 500, `<!doctype html><meta charset="utf-8"><title>Erreur</title>
      <body style="font-family:system-ui;padding:40px;background:#0B1220;color:#E2E8F0">
      <h1 style="font-size:20px">Erreur serveur</h1><p style="opacity:.7">${L.e(err.message)}</p></body>`);
  }
}

const server = http.createServer(handler);

function notFound(res, req) {
  const url = new URL(req.url, 'http://x');
  let lang = url.pathname === '/ar' || url.pathname.startsWith('/ar/') ? 'ar' : 'fr';
  const fakeRes = res;
  const p = lang === 'ar' ? (url.pathname.slice(3) || '/') : url.pathname;
  const ctx = baseCtx(req, fakeRes, lang, p);
  return html(res, 404, store.notFound(ctx));
}

function svg(res, markup) {
  if (res._cookies && res._cookies.length) res.setHeader('Set-Cookie', res._cookies);
  res.writeHead(200, {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
  res.end(markup);
}

function serveFile(res, file, pathname) {
  if (!file) return send(res, 404, 'Not found');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found');
    const ext = path.extname(file).toLowerCase();
    const type = {
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.svg': 'image/svg+xml; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
    }[ext] || 'application/octet-stream';
    const h = { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' };
    if (res._cookies && res._cookies.length) h['Set-Cookie'] = res._cookies;
    res.writeHead(200, h);
    res.end(buf);
  });
}

function sitemap(res, req) {
  const s = settings();
  const base = publicOrigin(req, s.site_url);
  const today = new Date().toISOString().slice(0, 10);
  const cats = db.prepare('SELECT slug FROM categories').all();
  const prods = db.prepare('SELECT slug FROM products WHERE active = 1').all();
  const urlsFor = (path) => `
  <url>
    <loc>${base}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="${base}${path}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${base}/ar${path}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${base}${path}"/>
  </url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsFor('/')}${urlsFor('/boutique')}${cats.map((c) => urlsFor('/c/' + c.slug)).join('')}${prods.map((p) => urlsFor('/produit/' + p.slug)).join('')}
</urlset>`;
  return send(res, 200, xml, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=1800' });
}

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`\n  Demo Store → http://localhost:${PORT}`);
    console.log(`  Admin           → http://localhost:${PORT}/admin  (mot de passe : ${ADMIN_PASSWORD})\n`);
  });
}

// Persist any data written during this request before the lambda is frozen.
async function persistentHandler(req, res) {
  try {
    return await handler(req, res);
  } finally {
    if (typeof dbFlush === 'function') await dbFlush();
  }
}

// Export the request handler directly: Vercel's Node runtime bundles the
// module tree and requires a function (or server) as the export.
module.exports = persistentHandler;
