'use strict';
const { e, attr, money, t } = require('./lib');

/* ------------------------------------------------------------------- icons */
const ICONS = {
  cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  phone: '<path d="M6.6 3.5 9 8l-2 1.8a12 12 0 0 0 6.2 6.2L15 14l4.5 2.4v3.1a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.4 5.7a2 2 0 0 1 2-2.2z"/>',
  wa: '<path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Z"/><path d="M8.5 8.2c.2-.5.4-.5.7-.5h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.6l-.5.6c-.1.2-.2.3 0 .6a7 7 0 0 0 3.4 3c.3.1.5.1.6-.1l.7-.8c.2-.2.3-.2.6-.1l1.9.9c.3.1.5.2.5.4a2.4 2.4 0 0 1-1.7 2.2c-.7.2-1.5.2-2.5-.1a11 11 0 0 1-5.7-4.9c-.5-.9-.8-1.7-.8-2.4a3 3 0 0 1 1-2.2Z"/>',
  truck: '<path d="M1 4h13v11H1z"/><path d="M14 8h4l3 3v4h-7z"/><circle cx="5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
  shield: '<path d="M12 2.5 4.5 5.5v6c0 5 3.2 8.6 7.5 10 4.3-1.4 7.5-5 7.5-10v-6z"/><path d="m9 12 2 2 4-4"/>',
  box: '<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
  tag: '<path d="M20.6 13.4 12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z"/><circle cx="7" cy="7" r="1.4"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M18 20a6.4 6.4 0 0 0-2-4.6"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 16.5 5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  logout: '<path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
  edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14.5 6 3 3"/>',
  bag: '<path d="M6 8h12l1.5 12.5a1 1 0 0 1-1 1.5h-13a1 1 0 0 1-1-1.5z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17.5v.5"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="7" rx="2"/><path d="M6 16h12v5H6z"/>',
};

function ic(name, cls = '') {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ------------------------------------------------------------------- links */
const u = (lang, path) => (lang === 'ar' ? '/ar' + path : path);
const otherLang = (lang) => (lang === 'ar' ? 'fr' : 'ar');

function priceBlock(p, lang, big = false) {
  const off = p.old_price && p.old_price > p.price;
  const pct = off ? Math.round((1 - p.price / p.old_price) * 100) : 0;
  return `<div class="price ${big ? 'price--big' : ''}">
    <span class="price__now">${money(p.price, lang)}</span>
    ${off ? `<span class="price__old">${money(p.old_price, lang)}</span><span class="price__off">-${pct}%</span>` : ''}
  </div>`;
}

function badge(p, lang) {
  if (p.badge === 'promo') return `<span class="badge badge--promo">${t(lang, 'p.promo')}</span>`;
  if (p.badge === 'best') return `<span class="badge badge--best">${lang === 'ar' ? 'الأكثر مبيعا' : 'Top vente'}</span>`;
  return '';
}

function stockPill(p, lang) {
  if (p.stock <= 0) return `<span class="stock stock--out">${t(lang, 'p.out')}</span>`;
  return `<span class="stock stock--in">${t(lang, 'p.stock')}</span>`;
}

function productCard(ctx, p, opts = {}) {
  const { lang } = ctx;
  const href = u(lang, `/produit/${p.slug}`);
  const img = p.image ? `<img src="${attr(p.image)}" alt="${attr(lang === 'ar' ? p.name_ar : p.name_fr)}" loading="lazy">` : `<img src="/img/p/${p.id}.svg" alt="${attr(lang === 'ar' ? p.name_ar : p.name_fr)}" loading="lazy">`;
  return `<article class="card${p.stock <= 0 ? ' card--out' : ''}">
    <a class="card__art" href="${href}" aria-label="${attr(lang === 'ar' ? p.name_ar : p.name_fr)}">
      ${img}
      <span class="card__badges">${badge(p, lang)}</span>
    </a>
    <div class="card__body">
      <div class="card__meta"><span class="card__brand">${e(p.brand)}</span>${stockPill(p, lang)}</div>
      <h3 class="card__title"><a href="${href}">${e(lang === 'ar' ? p.name_ar : p.name_fr)}</a></h3>
      ${priceBlock(p, lang)}
      <form method="post" action="${u(lang, '/panier/ajouter')}" class="card__add" data-add>
        <input type="hidden" name="id" value="${p.id}">
        <input type="hidden" name="qty" value="1">
        <input type="hidden" name="next" value="${attr(ctx.path)}">
        <button class="btn btn--sm btn--block" type="submit" ${p.stock <= 0 ? 'disabled' : ''}>
          ${ic('cart')}<span>${p.stock <= 0 ? t(lang, 'p.out') : t(lang, 'p.add')}</span>
        </button>
      </form>
    </div>
  </article>`;
}

/* ------------------------------------------------------------------ layout */
function layout(ctx, opt) {
  const { lang, s, cats, cartCount } = ctx;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const path = opt.canonicalPath || ctx.path;
  const title = opt.title || `${s.store_name} — ${lang === 'ar' ? s.tagline_ar : s.tagline_fr}`;
  const desc = opt.desc || (lang === 'ar' ? s.meta_ar : s.meta_fr);
  const canonical = `${s.site_url}${path}`;
  const waHref = `https://wa.me/${e(s.wa)}?text=${encodeURIComponent(
    lang === 'ar' ? 'مرحبا، أريد معلومات عن منتج' : 'Bonjour, je voudrais un renseignement'
  )}`;

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${attr(canonical)}">
<link rel="alternate" hreflang="fr" href="${attr(s.site_url + (path.startsWith('/ar') ? path.slice(3) || '/' : path))}">
<link rel="alternate" hreflang="ar" href="${attr(s.site_url + '/ar' + (path.startsWith('/ar') ? path.slice(3) : path))}">
<link rel="alternate" hreflang="x-default" href="${attr(s.site_url + (path.startsWith('/ar') ? path.slice(3) || '/' : path))}">
<meta property="og:type" content="${opt.ogType || 'website'}">
<meta property="og:site_name" content="${attr(s.store_name)}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${attr(canonical)}">
<meta property="og:image" content="${attr(s.site_url + (opt.ogImage || '/og.png'))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${lang === 'ar' ? 'ar_TN' : 'fr_TN'}">
<meta name="theme-color" content="#0B1220">
${opt.noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
${opt.jsonld ? `<script type="application/ld+json">${JSON.stringify(opt.jsonld)}</script>` : ''}
</head>
<body class="lang-${lang}">
<a class="skip" href="#main">${lang === 'ar' ? 'تجاوز إلى المحتوى' : 'Aller au contenu'}</a>

<div class="announce"><div class="wrap announce__in">
  <span>${ic('truck')} ${e(lang === 'ar' ? s.announcement_ar : s.announcement_fr)}</span>
  <a href="tel:${attr(s.phone.replace(/\s/g, ''))}" dir="ltr">${ic('phone')} ${e(s.phone)}</a>
</div></div>

<header class="hdr">
  <div class="wrap hdr__in">
    <button class="iconbtn hdr__burger" type="button" data-drawer-open aria-label="Menu">${ic('menu')}</button>
    <a class="brand" href="${u(lang, '/')}" aria-label="${attr(s.store_name)}">
      <img class="brand__logo" src="/logo-demo-dark.png" alt="Demo Store" width="316" height="119">
    </a>

    <nav class="nav" aria-label="${lang === 'ar' ? 'التنقل' : 'Navigation'}">
      <a href="${u(lang, '/boutique')}" class="${ctx.active === 'shop' ? 'is-on' : ''}">${t(lang, 'nav.shop')}</a>
      <a href="${u(lang, '/c/ecouteurs')}">${lang === 'ar' ? 'سماعات لاسلكية' : 'Écouteurs'}</a>
      <a href="${u(lang, '/c/enceintes')}">${lang === 'ar' ? 'مكبرات صوت' : 'Enceintes'}</a>
      <a href="${u(lang, '/c/smartphones')}">${lang === 'ar' ? 'هواتف' : 'Smartphones'}</a>
      <a href="${u(lang, '/boutique?promo=1')}" class="nav__promo">${t(lang, 'nav.deals')}</a>
    </nav>

    <form class="search" method="get" action="${u(lang, '/boutique')}" role="search">
      ${ic('search')}
      <input type="search" name="q" value="${attr(ctx.q || '')}" placeholder="${attr(t(lang, 'search.ph'))}" aria-label="${attr(t(lang, 'search.ph'))}">
      <button type="submit" class="search__btn">${ic('arrow')}</button>
    </form>

    <div class="hdr__actions">
      <a class="langbtn" href="${ctx.otherLangHref}" hreflang="${otherLang(lang)}" aria-label="Change language">${lang === 'ar' ? 'FR' : 'ع'}</a>
      <a class="iconbtn hdr__phone" href="tel:${attr(s.phone.replace(/\s/g, ''))}" aria-label="${attr(t(lang, 'store.call'))}">${ic('phone')}</a>
      <a class="cartbtn" href="${u(lang, '/panier')}" aria-label="${attr(t(lang, 'cart'))}">
        ${ic('cart')}<span class="cartbtn__label">${t(lang, 'cart')}</span>
        ${cartCount ? `<span class="cartbtn__count" data-cart-count>${cartCount}</span>` : '<span class="cartbtn__count is-empty" data-cart-count>0</span>'}
      </a>
    </div>
  </div>
</header>

<div class="drawer" data-drawer hidden>
  <div class="drawer__scrim" data-drawer-close></div>
  <aside class="drawer__panel">
    <div class="drawer__top">
      <img class="drawer__logo" src="/logo-demo-dark.png" alt="Demo Store" width="316" height="119">
      <button class="iconbtn" type="button" data-drawer-close aria-label="${attr(t(lang, 'common.close'))}">${ic('close')}</button>
    </div>
    <form class="search search--m" method="get" action="${u(lang, '/boutique')}">
      ${ic('search')}<input type="search" name="q" placeholder="${attr(t(lang, 'search.ph'))}">
    </form>
    <nav class="drawer__nav">
      <a href="${u(lang, '/boutique')}">${t(lang, 'nav.shop')}</a>
      ${cats.map((c) => `<a href="${u(lang, '/c/' + c.slug)}">${e(lang === 'ar' ? c.name_ar : c.name_fr)}<span>${c.n}</span></a>`).join('')}
    </nav>
    <div class="drawer__foot">
      <a class="btn btn--block" href="tel:${attr(s.phone.replace(/\s/g, ''))}">${ic('phone')} ${e(s.phone)}</a>
      <a class="btn btn--wa btn--block" href="${attr(waHref)}" target="_blank" rel="noopener">${ic('wa')} WhatsApp</a>
    </div>
  </aside>
</div>

<main id="main">
${opt.body}
</main>

<footer class="ftr">
  <div class="wrap ftr__grid">
    <div class="ftr__brand">
      <img class="ftr__logo" src="/logo-demo-light.png" alt="Demo Store" width="316" height="119">
      <p>${e(lang === 'ar' ? s.tagline_ar : s.tagline_fr)}</p>
      <ul class="ftr__contact">
        <li>${ic('pin')}<span>${e(s.address)}</span></li>
        <li>${ic('phone')}<a href="tel:${attr(s.phone.replace(/\s/g, ''))}" dir="ltr">${e(s.phone)}</a></li>
        <li>${ic('clock')}<span>${t(lang, 'store.hours')}</span></li>
      </ul>
    </div>
    <div>
      <h4>${t(lang, 'f.shop')}</h4>
      <ul>${cats.slice(0, 6).map((c) => `<li><a href="${u(lang, '/c/' + c.slug)}">${e(lang === 'ar' ? c.name_ar : c.name_fr)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h4>${t(lang, 'f.help')}</h4>
      <ul>
        <li><a href="${u(lang, '/boutique')}">${t(lang, 'f.delivery')}</a></li>
        <li><a href="${u(lang, '/boutique')}">${t(lang, 'f.warranty')}</a></li>
        <li><a href="${u(lang, '/boutique')}">${t(lang, 'f.contact')}</a></li>
        <li><a href="${u(lang, '/boutique')}">${t(lang, 'f.legal')}</a></li>
      </ul>
    </div>
    <div>
      <h4>${t(lang, 'f.pay')}</h4>
      <ul class="ftr__pay">
        <li>${ic('truck')} ${t(lang, 'f.pay.cod')}</li>
        <li>${ic('box')} ${t(lang, 'f.pay.bank')}</li>
        <li>${ic('shield')} ${t(lang, 'f.pay.card')}</li>
      </ul>
      <a class="btn btn--wa btn--sm" href="${attr(waHref)}" target="_blank" rel="noopener">${ic('wa')} ${t(lang, 'store.wa')}</a>
    </div>
  </div>
  <div class="wrap ftr__base">
    <span>© ${new Date().getFullYear()} ${e(s.store_name)}. ${t(lang, 'f.rights')}</span>
    <span>${t(lang, 'f.built')}</span>
  </div>
</footer>

<div class="mbar">
  <a href="${u(lang, '/')}">${ic('grid')}<span>${t(lang, 'nav.home')}</span></a>
  <a href="${u(lang, '/boutique')}">${ic('search')}<span>${t(lang, 'nav.shop')}</span></a>
  <a class="mbar__cta" href="tel:${attr(s.phone.replace(/\s/g, ''))}">${ic('phone')}<span>${t(lang, 'store.call')}</span></a>
  <a href="${u(lang, '/panier')}">${ic('cart')}<span>${t(lang, 'cart')}</span>${cartCount ? `<b data-cart-count>${cartCount}</b>` : ''}</a>
</div>

<div class="toast" data-toast role="status" aria-live="polite"></div>
<script src="/app.js" defer></script>
${opt.scripts || ''}
</body>
</html>`;
}

module.exports = {
  ICONS, ic, u, otherLang, priceBlock, badge, stockPill, productCard, layout,
};
