'use strict';
const { e, attr, money, t, GOV, GOV_AR, GRAND_TUNIS, STATUSES, shippingFor, productArt } = require('./lib');
const { ic, u, priceBlock, badge, stockPill, productCard, layout } = require('./ui');

const catName = (c, lang) => (lang === 'ar' ? c.name_ar : c.name_fr);

/* ------------------------------------------------------------------- hero */
function hero(ctx, featured) {
  const { lang, s } = ctx;
  const p = featured;
  const art = p
    ? p.image
      ? `<img src="${attr(p.image)}" alt="${attr(lang === 'ar' ? p.name_ar : p.name_fr)}">`
      : `<img src="/img/p/${p.id}.svg" alt="${attr(lang === 'ar' ? p.name_ar : p.name_fr)}">`
    : '';
  return `<section class="hero">
    <div class="wrap hero__in">
      <div class="hero__copy">
        <span class="eyebrow">${ic('pin')} ${t(lang, 'hero.eyebrow')}</span>
        <h1>${lang === 'ar' ? 'صوت وهواتف،<br><em>في كتالوج واحد.</em>' : 'Le son et le mobile,<br><em>dans un seul catalogue.</em>'}</h1>
        <p class="hero__sub">${t(lang, 'hero.sub')}</p>
        <div class="hero__cta">
          <a class="btn btn--lg" href="${u(lang, '/boutique')}">${t(lang, 'hero.cta1')} ${ic('arrow')}</a>
          <a class="btn btn--lg btn--ghost" href="${u(lang, '/c/smartphones')}">${t(lang, 'hero.cta2')}</a>
        </div>
        <dl class="hero__stats">
          <div><dt>${ctx.counts.products}</dt><dd>${t(lang, 'hero.stat1')}</dd></div>
          <div><dt>24–48h</dt><dd>${t(lang, 'hero.stat2')}</dd></div>
          <div><dt>12 ${lang === 'ar' ? 'شهرا' : 'mois'}</dt><dd>${t(lang, 'hero.stat3')}</dd></div>
        </dl>
      </div>
      ${
        p
          ? `<div class="hero__art">
        <div class="hero__frame">
          ${art}
          <span class="hero__tag">${badge(p, lang) || `<span class="badge badge--best">${lang === 'ar' ? 'مختار الأسبوع' : 'Coup de cœur'}</span>`}</span>
        </div>
        <a class="hero__card" href="${u(lang, '/produit/' + p.slug)}">
          <span class="hero__card-brand">${e(p.brand)}</span>
          <strong>${e(lang === 'ar' ? p.name_ar : p.name_fr)}</strong>
          ${priceBlock(p, lang)}
          <span class="hero__card-link">${lang === 'ar' ? 'تفاصيل المنتج' : 'Voir le produit'} ${ic('arrow')}</span>
        </a>
      </div>`
          : ''
      }
    </div>
  </section>`;
}

/* ------------------------------------------------------------------- home */
function home(ctx, data) {
  const { lang, s, cats } = ctx;
  const { featured, best, deals, brands } = data;

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: s.store_name,
      description: lang === 'ar' ? s.meta_ar : s.meta_fr,
      url: s.site_url,
      telephone: s.phone,
      image: s.site_url + '/og.svg',
      priceRange: '45–5999 TND',
      currenciesAccepted: 'TND',
      paymentAccepted: lang === 'ar' ? 'الدفع عند الاستلام' : 'Paiement à la livraison',
      address: {
        '@type': 'PostalAddress',
        streetAddress: s.address,
        addressLocality: 'Tunis',
        postalCode: '2080',
        addressCountry: 'TN',
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '19:00',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: s.store_name,
      url: s.site_url,
      inLanguage: ['fr-TN', 'ar-TN'],
      potentialAction: {
        '@type': 'SearchAction',
        target: s.site_url + '/boutique?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  const body = `
${hero(ctx, featured)}

${ctx.counts.inStock > 0 ? `<section class="trustbar">
  <div class="wrap trustbar__in">
    ${[
      ['truck', 'trust.delivery', 'trust.delivery.sub'],
      ['box', 'trust.payment', 'trust.payment.sub'],
      ['shield', 'trust.warranty', 'trust.warranty.sub'],
      ['phone', 'trust.support', 'trust.support.sub'],
    ]
      .map(
        ([i, k, sub]) => `<div class="trust">${ic(i)}<div><strong>${t(lang, k)}</strong><span>${t(lang, sub)}</span></div></div>`
      )
      .join('')}
  </div>
</section>` : ''}

<section class="sec">
  <div class="wrap">
    <div class="sec__head">
      <div><h2>${t(lang, 'cat.title')}</h2><p>${t(lang, 'cat.sub')}</p></div>
      <a class="link" href="${u(lang, '/boutique')}">${lang === 'ar' ? 'كل المنتجات' : 'Tout le catalogue'} ${ic('arrow')}</a>
    </div>
    <div class="cats">
      ${cats
        .map(
          (c) => `<a class="cat" href="${u(lang, '/c/' + c.slug)}" style="--c:${c.accent}">
        <span class="cat__n">${c.n}</span>
        <span class="cat__name">${e(catName(c, lang))}</span>
        <span class="cat__go">${ic('arrow')}</span>
      </a>`
        )
        .join('')}
    </div>
  </div>
</section>

<section class="sec sec--soft">
  <div class="wrap">
    <div class="sec__head">
      <div><h2>${t(lang, 'best.title')}</h2><p>${t(lang, 'best.sub')}</p></div>
      <a class="link" href="${u(lang, '/boutique?sort=best')}">${lang === 'ar' ? 'عرض الكل' : 'Tout voir'} ${ic('arrow')}</a>
    </div>
    <div class="grid grid--4">${best.map((p) => productCard(ctx, p)).join('')}</div>
  </div>
</section>

${ctx.counts.inStock > 0 ? `<section class="wrap">
  <a class="promo" href="${u(lang, '/boutique')}">
    <div>
      <span class="eyebrow eyebrow--light">${ic('tag')} ${t(lang, 'promo.eyebrow')}</span>
      <h2>${t(lang, 'promo.title')}</h2>
      <p>${t(lang, 'promo.sub')}</p>
    </div>
    <span class="btn btn--light">${t(lang, 'promo.cta')} ${ic('arrow')}</span>
  </a>
</section>` : ''}

${
  deals.length
    ? `<section class="sec">
  <div class="wrap">
    <div class="sec__head">
      <div><h2>${t(lang, 'deals.title')}</h2><p>${t(lang, 'deals.sub')}</p></div>
      <a class="link" href="${u(lang, '/boutique?promo=1')}">${t(lang, 'deals.all')} ${ic('arrow')}</a>
    </div>
    <div class="grid grid--4">${deals.map((p) => productCard(ctx, p)).join('')}</div>
  </div>
</section>`
    : ''
}

<section class="sec sec--soft">
  <div class="wrap">
    <div class="sec__head"><div><h2>${t(lang, 'why.title')}</h2></div></div>
    <div class="why">
      ${['why.1', 'why.2', 'why.3']
        .map(
          (k, i) => `<div class="why__item">
        <span class="why__num">0${i + 1}</span>
        <h3>${t(lang, k)}</h3>
        <p>${t(lang, k + '.sub')}</p>
      </div>`
        )
        .join('')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <p class="kicker">${t(lang, 'brands.title')}</p>
    <div class="brands">${brands.map((b) => `<span>${e(b)}</span>`).join('')}</div>
  </div>
</section>

<section class="sec sec--soft">
  <div class="wrap storeblock">
    <div class="storeblock__info">
      <span class="eyebrow">${ic('pin')} ${t(lang, 'store.title')}</span>
      <h2>${e(s.address)}</h2>
      <ul class="storeblock__list">
        <li>${ic('clock')} ${t(lang, 'store.hours')}</li>
        <li>${ic('phone')} <a href="tel:${attr(s.phone.replace(/\s/g, ''))}" dir="ltr">${e(s.phone)}</a></li>
        <li>${ic('mail')} <a href="mailto:${attr(s.email)}">${e(s.email)}</a></li>
      </ul>
      <div class="storeblock__cta">
        <a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Demo Store Tunisie')}" target="_blank" rel="noopener">${ic('pin')} ${t(lang, 'store.dir')}</a>
        <a class="btn btn--wa" href="https://wa.me/${attr(s.wa)}" target="_blank" rel="noopener">${ic('wa')} WhatsApp</a>
      </div>
    </div>
    <div class="newsletter">
      <h3>${t(lang, 'news.title')}</h3>
      <p>${t(lang, 'news.sub')}</p>
      <form method="post" action="${u(lang, '/newsletter')}" class="newsletter__form">
        <input type="email" name="email" required placeholder="${attr(t(lang, 'news.ph'))}" aria-label="Email" ${lang === 'ar' ? 'dir="ltr"' : ''}>
        <button class="btn" type="submit">${t(lang, 'news.cta')}</button>
      </form>
      <p class="newsletter__fine">${lang === 'ar' ? 'يمكنك إلغاء الاشتراك في أي وقت.' : 'Désinscription en un clic, à tout moment.'}</p>
    </div>
  </div>
</section>`;

  return layout(ctx, {
    title:
      lang === 'ar'
        ? 'Demo Store — نسخة تجريبية لعرض المتاجر'
        : 'Demo Store — boutique démo : smartphones, audio et accessoires',
    desc: lang === 'ar' ? s.meta_ar : s.meta_fr,
    body,
    jsonld,
    active: 'home',
    canonicalPath: lang === 'ar' ? '/ar/' : '/',
  });
}

/* ---------------------------------------------------------------- catalog */
function catalog(ctx, data) {
  const { lang, cats, q, filters, path } = ctx;
  const { products, total, page, pages, priceMax, promoOnly, brands } = data;
  const catSlug = filters.cat || '';
  const activeCat = cats.find((c) => c.slug === catSlug);

  const baseParams = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) baseParams.set(k, v);
  if (q) baseParams.set('q', q);
  if (promoOnly) baseParams.set('promo', '1');
  const pageHref = (n) => {
    const p = new URLSearchParams(baseParams);
    if (n > 1) p.set('page', String(n));
    const qs = p.toString();
    return u(lang, (catSlug ? '/c/' + catSlug : '/boutique') + (qs ? '?' + qs : ''));
  };
  const brandOpts = filters.brand ? filters.brand.split(',') : [];

  const title = activeCat
    ? `${catName(activeCat, lang)} — ${s_name(ctx)}`
    : q
    ? `${q} — ${s_name(ctx)}`
    : `${t(lang, 'nav.shop')} — ${s_name(ctx)}`;

  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="${u(lang, '/')}">${t(lang, 'crumb.home')}</a>${ic('chevron')}
    <a href="${u(lang, '/boutique')}">${t(lang, 'nav.shop')}</a>
    ${activeCat ? ic('chevron') + `<span>${e(catName(activeCat, lang))}</span>` : ''}
  </nav>
</div>

<div class="wrap catpage">
  <aside class="filters" data-filters>
    <div class="filters__head">
      <h2>${t(lang, 'filters')}</h2>
      <button class="iconbtn filters__close" type="button" data-filters-close aria-label="${attr(t(lang, 'common.close'))}">${ic('close')}</button>
    </div>
    <form method="get" action="${u(lang, catSlug ? '/c/' + catSlug : '/boutique')}">
      ${q ? `<input type="hidden" name="q" value="${attr(q)}">` : ''}
      ${promoOnly ? `<input type="hidden" name="promo" value="1">` : ''}
      <fieldset>
        <legend>${t(lang, 'filters.cat')}</legend>
        <label class="radio"><input type="radio" name="cat" value="" ${!catSlug ? 'checked' : ''}><span>${t(lang, 'filters.all')}</span><b>${ctx.counts.products}</b></label>
        ${cats
          .map(
            (c) => `<label class="radio"><input type="radio" name="cat" value="${c.slug}" ${catSlug === c.slug ? 'checked' : ''}><span>${e(catName(c, lang))}</span><b>${c.n}</b></label>`
          )
          .join('')}
      </fieldset>
      <fieldset>
        <legend>${t(lang, 'filters.brand')}</legend>
        ${brands
          .map(
            (b) => `<label class="check"><input type="checkbox" name="brand" value="${attr(b)}" ${brandOpts.includes(b) ? 'checked' : ''}><span>${e(b)}</span></label>`
          )
          .join('')}
      </fieldset>
      <fieldset>
        <legend>${t(lang, 'filters.price')}</legend>
        <div class="range">
          <input type="number" name="min" min="0" max="${priceMax}" placeholder="0" value="${attr(filters.min || '')}" aria-label="Min">
          <span>—</span>
          <input type="number" name="max" min="0" max="${priceMax}" placeholder="${priceMax}" value="${attr(filters.max || '')}" aria-label="Max">
        </div>
        <label class="check check--mt"><input type="checkbox" name="stock" value="1" ${filters.stock ? 'checked' : ''}><span>${t(lang, 'filters.stock')}</span></label>
        <input type="hidden" name="sort" value="${attr(filters.sort || 'new')}">
      </fieldset>
      <div class="filters__actions">
        <button class="btn btn--block" type="submit">${t(lang, 'filters.apply')}</button>
        <a class="link link--muted" href="${u(lang, catSlug ? '/c/' + catSlug : '/boutique')}">${t(lang, 'filters.reset')}</a>
      </div>
    </form>
  </aside>

  <div class="catmain">
    <div class="cathead">
      <div>
        <h1>${activeCat ? e(catName(activeCat, lang)) : q ? `« ${e(q)} »` : t(lang, 'nav.shop')}</h1>
        <p class="cathead__count">${total} ${t(lang, 'results')}${promoOnly ? ` · ${lang === 'ar' ? 'عروض فقط' : 'promos uniquement'}` : ''}</p>
      </div>
      <div class="cathead__tools">
        <button class="btn btn--ghost btn--sm filtbtn" type="button" data-filters-open>${ic('filter')} ${t(lang, 'filters')}</button>
        <form method="get" action="${u(lang, catSlug ? '/c/' + catSlug : '/boutique')}" class="sortform">
          ${q ? `<input type="hidden" name="q" value="${attr(q)}">` : ''}
          ${promoOnly ? `<input type="hidden" name="promo" value="1">` : ''}
          ${catSlug ? `<input type="hidden" name="cat" value="${attr(catSlug)}">` : ''}
          ${brandOpts.map((b) => `<input type="hidden" name="brand" value="${attr(b)}">`).join('')}
          ${filters.min ? `<input type="hidden" name="min" value="${attr(filters.min)}">` : ''}
          ${filters.max ? `<input type="hidden" name="max" value="${attr(filters.max)}">` : ''}
          ${filters.stock ? `<input type="hidden" name="stock" value="1">` : ''}
          <label for="sort">${t(lang, 'sort.label')}</label>
          <select id="sort" name="sort" data-autosubmit>
            <option value="new" ${filters.sort === 'new' ? 'selected' : ''}>${t(lang, 'sort.new')}</option>
            <option value="price_asc" ${filters.sort === 'price_asc' ? 'selected' : ''}>${t(lang, 'sort.price_asc')}</option>
            <option value="price_desc" ${filters.sort === 'price_desc' ? 'selected' : ''}>${t(lang, 'sort.price_desc')}</option>
            <option value="best" ${filters.sort === 'best' ? 'selected' : ''}>${t(lang, 'sort.best')}</option>
          </select>
        </form>
      </div>
    </div>

    ${
      products.length
        ? `<div class="grid grid--3">${products.map((p) => productCard(ctx, p)).join('')}</div>`
        : `<div class="empty">${ic('search')}<h3>${t(lang, 'results.empty')}</h3><a class="btn" href="${u(lang, '/boutique')}">${t(lang, 'results.empty.cta')}</a></div>`
    }

    ${
      pages > 1
        ? `<nav class="pager" aria-label="Pagination">
      ${page > 1 ? `<a class="pager__btn" href="${attr(pageHref(page - 1))}">${ic('chevron')}</a>` : ''}
      ${Array.from({ length: pages }, (_, i) => i + 1)
        .map((n) => `<a class="pager__btn${n === page ? ' is-on' : ''}" href="${attr(pageHref(n))}">${n}</a>`)
        .join('')}
      ${page < pages ? `<a class="pager__btn" href="${attr(pageHref(page + 1))}">${ic('chevron')}</a>` : ''}
    </nav>`
        : ''
    }

    ${
      activeCat
        ? `<section class="seotext">
      <h2>${lang === 'ar' ? 'شراء ' + e(catName(activeCat, lang)) + ' في تونس' : 'Acheter ' + e(catName(activeCat, lang)).toLowerCase() + ' en Tunisie'}</h2>
      <p>${
        lang === 'ar'
          ? 'تشكيلة مختارة من ' + e(catName(activeCat, lang)) + ' بأسعار معلنة بالدينار التونسي، متوفرة في متجرنا بأريانة مع التوصيل إلى كل الولايات في 24–48 ساعة والدفع عند الاستلام. كل منتج مرفوق بضمان المتجر وخدمة ما بعد بيع في المكان.'
          : 'Sélection de ' + e(catName(activeCat, lang)).toLowerCase() + " aux prix affichés en dinars, disponible dans notre magasin avec livraison dans les 24 gouvernorats en 24–48h et paiement à la livraison. Chaque produit est couvert par la garantie boutique et notre SAV sur place."
      }</p>
    </section>`
        : ''
    }
  </div>
</div>`;

  return layout(ctx, {
    title,
    desc: activeCat
      ? lang === 'ar'
        ? `تشكيلة ${activeCat.name_ar} — أسعار بالدينار، توصيل 24–48 ساعة ودفع عند الاستلام.`
        : `${activeCat.name_fr} pas cher en Tunisie — Demo Store. Prix en DT, livraison 24–48h, paiement à la livraison.`
      : lang === 'ar'
      ? s_meta(ctx, 'ar')
      : s_meta(ctx, 'fr'),
    body,
    active: 'shop',
    canonicalPath: path,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(lang, 'crumb.home'), item: ctx.s.site_url + '/' },
        { '@type': 'ListItem', position: 2, name: t(lang, 'nav.shop'), item: ctx.s.site_url + '/boutique' },
        ...(activeCat
          ? [{ '@type': 'ListItem', position: 3, name: catName(activeCat, lang), item: ctx.s.site_url + '/c/' + activeCat.slug }]
          : []),
      ],
    },
  });
}
const s_name = (c) => c.s.store_name;
const s_meta = (c, l) => (l === 'ar' ? c.s.meta_ar : c.s.meta_fr);

/* ---------------------------------------------------------------- product */
function product(ctx, p, related) {
  const { lang, s } = ctx;
  const name = lang === 'ar' ? p.name_ar : p.name_fr;
  const desc = (lang === 'ar' ? p.desc_ar : p.desc_fr) || s.meta_fr;
  const specs = JSON.parse(p.specs || '{}');
  const off = p.old_price && p.old_price > p.price;
  const cat = ctx.cats.find((c) => c.id === p.cat_id) || {};
  const images = p.image ? [p.image] : [`/img/p/${p.id}.svg`];

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: desc,
    sku: p.sku,
    mpn: p.sku,
    brand: { '@type': 'Brand', name: p.brand },
    category: cat.name_fr,
    image: images.map((i) => (i.startsWith('http') ? i : s.site_url + i)),
    offers: {
      '@type': 'Offer',
      url: s.site_url + '/produit/' + p.slug,
      priceCurrency: 'TND',
      price: p.price,
      priceValidUntil: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
      itemCondition: 'https://schema.org/NewCondition',
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: s.store_name },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnInStore',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 7, currency: 'TND' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'TN' },
        deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' } },
      },
    },
    additionalProperty: Object.entries(specs).map(([k, v]) => ({ '@type': 'PropertyValue', name: k, value: String(v) })),
  };

  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="${u(lang, '/')}">${t(lang, 'crumb.home')}</a>${ic('chevron')}
    <a href="${u(lang, '/boutique')}">${t(lang, 'nav.shop')}</a>${ic('chevron')}
    ${cat.slug ? `<a href="${u(lang, '/c/' + cat.slug)}">${e(catName(cat, lang))}</a>${ic('chevron')}` : ''}
    <span>${e(name)}</span>
  </nav>
</div>

<section class="wrap pdp">
  <div class="pdp__media">
    <div class="pdp__main">
      <img src="${attr(images[0])}" alt="${attr(name)}" data-main-img>
      <span class="pdp__badges">${badge(p, lang)}</span>
    </div>
    ${
      images.length > 1
        ? `<div class="pdp__thumbs">
      ${images.map((src, i) => `<button class="pdp__thumb${i === 0 ? ' is-on' : ''}" type="button" data-thumb="${attr(src)}"><img src="${attr(src)}" alt=""></button>`).join('')}
    </div>`
        : ''
    }
    <ul class="pdp__perks">
      <li>${ic('truck')}<div><strong>${t(lang, 'p.delivery')}</strong><span>${t(lang, 'p.delivery.sub')}</span></div></li>
      <li>${ic('box')}<div><strong>${t(lang, 'p.pay')}</strong><span>${t(lang, 'p.pay.sub')}</span></div></li>
      <li>${ic('shield')}<div><strong>${t(lang, 'p.warranty.box')} · ${p.warranty} ${t(lang, 'p.warranty.m')}</strong><span>${t(lang, 'p.warranty.box.sub')}</span></div></li>
    </ul>
  </div>

  <div class="pdp__info">
    <div class="pdp__meta">
      <span class="pdp__brand">${e(p.brand)}</span>
      <span class="pdp__sku">${t(lang, 'p.sku')} ${e(p.sku)}</span>
    </div>
    <h1>${e(name)}</h1>
    <p class="pdp__desc">${e(desc)}</p>
    <div class="pdp__price">
      ${priceBlock(p, lang, true)}
      <span class="${off ? 'pdp__save' : 'pdp__save is-hidden'}">${off ? `${lang === 'ar' ? 'توفّر' : 'Vous économisez'} ${money(p.old_price - p.price, lang)}` : ''}</span>
    </div>
    <div class="pdp__stock">${stockPill(p, lang)}<span class="pdp__cond">${t(lang, 'p.condition')} : ${t(lang, 'p.new')}</span></div>
    <div class="pdp__chips">
      <span class="chip">${ic('shield')} ${t(lang, 'p.warranty')} ${p.warranty} ${t(lang, 'p.warranty.m')}</span>
      <span class="chip">${ic('truck')} ${t(lang, 'p.delivery')}</span>
      <span class="chip">${ic('box')} ${t(lang, 'co.cod')}</span>
    </div>

    <form class="pdp__buy" method="post" action="${u(lang, '/panier/ajouter')}" data-add>
      <input type="hidden" name="id" value="${p.id}">
      <input type="hidden" name="next" value="${attr(ctx.path)}">
      <div class="qty" data-qty>
        <button type="button" class="qty__btn" data-qty-down aria-label="-">${ic('minus')}</button>
        <input type="number" name="qty" value="1" min="1" max="20" data-qty-input aria-label="${attr(t(lang, 'p.qty'))}">
        <button type="button" class="qty__btn" data-qty-up aria-label="+">${ic('plus')}</button>
      </div>
      <button class="btn btn--lg btn--block" type="submit" ${p.stock <= 0 ? 'disabled' : ''}>${ic('cart')} ${t(lang, 'p.add')}</button>
      <button class="btn btn--lg btn--ghost btn--block" type="submit" name="buynow" value="1" ${p.stock <= 0 ? 'disabled' : ''}>${t(lang, 'p.buy')} ${ic('arrow')}</button>
    </form>

    <div class="pdp__pay">
      ${ic('shield')} <span>${lang === 'ar' ? 'الدفع عند الاستلام متوفر في كل الولايات. ضمان 7 أيام للإرجاع.' : 'Paiement à la livraison partout en Tunisie. Retour sous 7 jours.'}</span>
    </div>

    <section class="pdp__specs" aria-label="${attr(t(lang, 'p.specs'))}">
      <h2>${t(lang, 'p.specs')}</h2>
      <table class="specs">${Object.entries(specs).map(([k, v]) => `<tr><th>${e(k)}</th><td>${e(v)}</td></tr>`).join('')}</table>
    </section>
    <div class="pdp__tabs">
      <details>
        <summary>${t(lang, 'f.delivery')}</summary>
        <p>${lang === 'ar'
          ? 'التوصيل في 24–48 ساعة إلى كل الولايات. 7 د.ت في تونس الكبرى، 8 د.ت في باقي الولايات، ومجاني للطلبات فوق 500 د.ت. الدفع نقدا عند الاستلام.'
          : 'Livraison en 24–48h dans les 24 gouvernorats. 7 DT au Grand Tunis, 8 DT ailleurs, offerte dès 500 DT. Paiement en espèces à la livraison.'}</p>
      </details>
    </div>
  </div>
</section>

${
  related.length
    ? `<section class="sec sec--soft">
  <div class="wrap">
    <div class="sec__head"><div><h2>${t(lang, 'p.related')}</h2></div></div>
    <div class="grid grid--3">${related.map((r) => productCard(ctx, r)).join('')}</div>
  </div>
</section>`
    : ''
}`;

  return layout(ctx, {
    title: `${name} — ${p.brand} | ${s.store_name}`,
    desc: desc.slice(0, 300),
    body,
    ogType: 'product',
    ogImage: p.image || `/img/p/${p.id}.svg`,
    canonicalPath: ctx.path,
    jsonld,
  });
}

/* ------------------------------------------------------------------- cart */
function cartPage(ctx, items, totals) {
  const { lang, s } = ctx;
  const body = `
<div class="wrap pagehead">
  <nav class="crumbs"><a href="${u(lang, '/')}">${t(lang, 'crumb.home')}</a>${ic('chevron')}<span>${t(lang, 'cart.title')}</span></nav>
  <h1>${t(lang, 'cart.title')}</h1>
</div>

${
  !items.length
    ? `<div class="wrap"><div class="empty">${ic('bag')}<h3>${t(lang, 'cart.empty')}</h3><a class="btn" href="${u(lang, '/boutique')}">${t(lang, 'cart.empty.cta')} ${ic('arrow')}</a></div></div>`
    : `<div class="wrap cart">
  <div class="cart__list">
    <table class="cart__table">
      <thead><tr><th colspan="2">${t(lang, 'cart.product')}</th><th>${t(lang, 'cart.price')}</th><th>${t(lang, 'cart.qty')}</th><th>${t(lang, 'cart.total')}</th><th></th></tr></thead>
      <tbody>
        ${items
          .map(
            (it) => `<tr>
          <td class="cart__img"><a href="${u(lang, '/produit/' + it.slug)}"><img src="${attr(it.image || '/img/p/' + it.product_id + '.svg')}" alt=""></a></td>
          <td class="cart__name">
            <a href="${u(lang, '/produit/' + it.slug)}">${e(lang === 'ar' ? it.name_ar : it.name_fr)}</a>
            <span>${e(it.brand)} · ${e(it.sku)}</span>
          </td>
          <td data-label="${attr(t(lang, 'cart.price'))}">${money(it.price, lang)}</td>
          <td data-label="${attr(t(lang, 'cart.qty'))}">
            <form method="post" action="${u(lang, '/panier/maj')}" class="qty qty--sm" data-autosubmit-form>
              <input type="hidden" name="id" value="${it.product_id}">
              <button type="button" class="qty__btn" data-qty-down aria-label="-">${ic('minus')}</button>
              <input type="number" name="qty" value="${it.qty}" min="1" max="20" data-qty-input>
              <button type="button" class="qty__btn" data-qty-up aria-label="+">${ic('plus')}</button>
            </form>
          </td>
          <td class="cart__line" data-label="${attr(t(lang, 'cart.total'))}"><strong>${money(it.price * it.qty, lang)}</strong></td>
          <td>
            <form method="post" action="${u(lang, '/panier/supprimer')}">
              <input type="hidden" name="id" value="${it.product_id}">
              <button class="iconbtn iconbtn--danger" type="submit" aria-label="${attr(t(lang, 'cart.remove'))}">${ic('trash')}</button>
            </form>
          </td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
    <div class="cart__actions">
      <a class="link" href="${u(lang, '/boutique')}">${ic('chevron')} ${t(lang, 'cart.continue')}</a>
      <form method="post" action="${u(lang, '/panier/vider')}"><button class="link link--muted" type="submit">${t(lang, 'cart.clear')}</button></form>
    </div>
  </div>

  <aside class="summary">
    <h2>${t(lang, 'cart.summary')}</h2>
    <dl>
      <div><dt>${t(lang, 'cart.subtotal')}</dt><dd>${money(totals.subtotal, lang)}</dd></div>
      <div><dt>${t(lang, 'cart.shipping')}</dt><dd>${totals.shipping === 0 ? `<span class="ok">${t(lang, 'cart.free')}</span>` : money(totals.shipping, lang)}</dd></div>
      <div class="summary__total"><dt>${t(lang, 'cart.total')}</dt><dd>${money(totals.total, lang)}</dd></div>
    </dl>
    ${totals.freeShipGap > 0 ? `<p class="summary__note">${ic('truck')} ${lang === 'ar' ? `أضف ${money(totals.freeShipGap, lang)} للحصول على توصيل مجاني` : `Plus que ${money(totals.freeShipGap, lang)} pour la livraison offerte`}</p>` : `<p class="summary__note ok">${ic('check')} ${t(lang, 'cart.free.note')}</p>`}
    <a class="btn btn--lg btn--block" href="${u(lang, '/commande')}">${t(lang, 'cart.checkout')} ${ic('arrow')}</a>
    <p class="summary__secure">${ic('shield')} ${lang === 'ar' ? 'الدفع عند الاستلام — دون دفع مسبق' : 'Paiement à la livraison — aucun prépaiement'}</p>
  </aside>
</div>`
}`;

  return layout(ctx, { title: `${t(lang, 'cart.title')} — ${s.store_name}`, body, noindex: true, canonicalPath: '/panier' });
}

/* --------------------------------------------------------------- checkout */
function checkout(ctx, items, totals, form = {}, errors = {}) {
  const { lang, s } = ctx;
  const err = (k) => (errors[k] ? ' is-err' : '');
  const inp = (k, label, attrs = '', type = 'text') => `
    <label class="field${err(k)}">
      <span>${label}${errors[k] ? `<em>${errors[k]}</em>` : ''}</span>
      <input type="${type}" name="${k}" value="${attr(form[k] || '')}" ${attrs}>
    </label>`;

  const fees = Object.fromEntries(
    GOV.map((g) => [g, GRAND_TUNIS.has(g) ? Number(s.ship_tunis) : Number(s.ship_other)])
  );
  const body = `
<div class="wrap pagehead">
  <nav class="crumbs"><a href="${u(lang, '/panier')}">${t(lang, 'cart.title')}</a>${ic('chevron')}<span>${t(lang, 'co.title')}</span></nav>
  <h1>${t(lang, 'co.title')}</h1>
  <p class="pagehead__sub">${t(lang, 'co.step')}</p>
</div>

<form class="wrap co" method="post" action="${u(lang, '/commande')}" novalidate>
  <div class="co__form">
    ${errors._global ? `<div class="alert">${ic('alert')} ${e(errors._global)}</div>` : ''}
    <section class="panel">
      <h2><span>1</span> ${t(lang, 'co.contact')}</h2>
      <div class="fields">
        ${inp('customer_name', t(lang, 'co.name'), 'autocomplete="name" required')}
        ${inp('phone', t(lang, 'co.phone'), 'inputmode="tel" placeholder="22 123 456" autocomplete="tel" required dir="ltr"')}
        <label class="field${err('governorate')}">
          <span>${t(lang, 'co.gov')}</span>
          <select name="governorate" data-gov required>
            <option value="">—</option>
            ${GOV.map((g) => `<option value="${attr(g)}" ${form.governorate === g ? 'selected' : ''}>${lang === 'ar' ? e(GOV_AR[g]) : e(g)}</option>`).join('')}
          </select>
        </label>
        ${inp('city', t(lang, 'co.city'), 'autocomplete="address-level2" required')}
        <label class="field field--full${err('address')}">
          <span>${t(lang, 'co.addr')}</span>
          <input type="text" name="address" value="${attr(form.address || '')}" autocomplete="street-address" required>
        </label>
        <label class="field field--full">
          <span>${t(lang, 'co.note')}</span>
          <textarea name="note" rows="2" placeholder="${attr(t(lang, 'co.note.ph'))}">${e(form.note || '')}</textarea>
        </label>
      </div>
    </section>

    <section class="panel">
      <h2><span>2</span> ${t(lang, 'co.pay')}</h2>
      <label class="payopt">
        <input type="radio" name="payment" value="cod" checked>
        <span class="payopt__box">
          <strong>${t(lang, 'co.cod')}</strong>
          <em>${t(lang, 'co.cod.sub')}</em>
        </span>
        <span class="payopt__tag">${lang === 'ar' ? 'موصى به' : 'Recommandé'}</span>
      </label>
    </section>

    <button class="btn btn--lg btn--wa btn--block co__submit" type="submit">${ic('wa')} ${t(lang, 'co.place')} · ${money(totals.total, lang)}</button>
    <p class="co__terms">${t(lang, 'co.terms')}</p>
  </div>

  <aside class="summary summary--co">
    <h2>${t(lang, 'co.summary')}</h2>
    <ul class="summary__items">
      ${items
        .map(
          (it) => `<li>
        <img src="${attr(it.image || '/img/p/' + it.product_id + '.svg')}" alt="">
        <div><strong>${e(lang === 'ar' ? it.name_ar : it.name_fr)}</strong><span>${it.qty} × ${money(it.price, lang)}</span></div>
        <b>${money(it.qty * it.price, lang)}</b>
      </li>`
        )
        .join('')}
    </ul>
    <dl>
      <div><dt>${t(lang, 'cart.subtotal')}</dt><dd>${money(totals.subtotal, lang)}</dd></div>
      <div><dt>${t(lang, 'cart.shipping')}</dt><dd data-ship>${totals.shipping === 0 ? t(lang, 'cart.free') : money(totals.shipping, lang)}</dd></div>
      <div class="summary__total"><dt>${t(lang, 'cart.total')}</dt><dd data-total>${money(totals.total, lang)}</dd></div>
    </dl>
    <div class="summary__trust">
      ${ic('shield')}<span>${lang === 'ar' ? 'تشفير وبيانات محمية. لا نشارك معلوماتك.' : 'Connexion sécurisée. Vos données ne sont jamais revendues.'}</span>
    </div>
  </aside>
</form>
<script>
window.PB_CO = { subtotal: ${totals.subtotal}, free: ${Number(s.free_ship)}, fees: ${JSON.stringify(fees)}, lang: ${JSON.stringify(lang)} };
</script>`;

  return layout(ctx, { title: `${t(lang, 'co.title')} — ${s.store_name}`, body, noindex: true, canonicalPath: '/commande' });
}

/* ------------------------------------------------------------- confirmation */
function confirmed(ctx, order, items) {
  const { lang, s } = ctx;
  const status = STATUSES.find((x) => x.key === order.status);
  const waText = encodeURIComponent(
    lang === 'ar'
      ? `مرحبا، بخصوص الطلب ${order.ref}`
      : `Bonjour, je souhaite suivre ma commande ${order.ref}`
  );
  const body = `
<div class="wrap confirm">
  <div class="confirm__head">
    <span class="confirm__check">${ic('check')}</span>
    <span class="eyebrow">${t(lang, 'ok.eyebrow')}</span>
    <h1>${t(lang, 'ok.title')}</h1>
    <p>${t(lang, 'ok.sub')}</p>
    <div class="confirm__ref"><span>${t(lang, 'ok.ref')}</span><strong>${e(order.ref)}</strong></div>
  </div>

  <div class="confirm__grid">
    <section class="panel">
      <h2>${t(lang, 'co.summary')}</h2>
      <ul class="summary__items">
        ${items
          .map(
            (it) => `<li><img src="${attr('/img/p/' + (it.product_id || 0) + '.svg')}" alt=""><div><strong>${e(lang === 'ar' ? it.name_ar : it.name_fr)}</strong><span>${it.qty} × ${money(it.price, lang)}</span></div><b>${money(it.qty * it.price, lang)}</b></li>`
          )
          .join('')}
      </ul>
      <dl class="confirm__totals">
        <div><dt>${t(lang, 'cart.subtotal')}</dt><dd>${money(order.subtotal, lang)}</dd></div>
        <div><dt>${t(lang, 'cart.shipping')}</dt><dd>${order.shipping === 0 ? t(lang, 'cart.free') : money(order.shipping, lang)}</dd></div>
        <div class="summary__total"><dt>${t(lang, 'cart.total')}</dt><dd>${money(order.total, lang)}</dd></div>
      </dl>
    </section>

    <section class="panel">
      <h2>${t(lang, 'co.contact')}</h2>
      <ul class="confirm__info">
        <li><span>${t(lang, 'co.name')}</span><strong>${e(order.customer_name)}</strong></li>
        <li><span>${t(lang, 'co.phone')}</span><strong>${e(order.phone)}</strong></li>
        <li><span>${t(lang, 'co.addr')}</span><strong>${e(order.address)}, ${e(order.city)}, ${e(lang === 'ar' ? GOV_AR[order.governorate] || order.governorate : order.governorate)}</strong></li>
        <li><span>${t(lang, 'co.pay')}</span><strong>${t(lang, 'co.cod')}</strong></li>
      </ul>
      <div class="confirm__status" style="--sc:${status.color};--sb:${status.bg}">${t(lang, 'status.' + order.status)}</div>
    </section>
  </div>

  <section class="confirm__next">
    <h2>${t(lang, 'ok.next')}</h2>
    <ol>
      <li><span>1</span>${t(lang, 'ok.step1')}</li>
      <li><span>2</span>${t(lang, 'ok.step2')}</li>
      <li><span>3</span>${t(lang, 'ok.step3')}</li>
    </ol>
    <div class="confirm__cta">
      <a class="btn" href="${u(lang, '/boutique')}">${t(lang, 'ok.shop')}</a>
      <a class="btn btn--wa" href="https://wa.me/${attr(s.wa)}?text=${waText}" target="_blank" rel="noopener">${ic('wa')} ${t(lang, 'ok.wa')}</a>
      <button class="btn btn--ghost" type="button" onclick="window.print()">${ic('print')} ${t(lang, 'ok.print')}</button>
    </div>
  </section>
</div>`;

  return layout(ctx, { title: `${t(lang, 'ok.eyebrow')} ${order.ref} — ${s.store_name}`, body, noindex: true, canonicalPath: '/commande/confirmee' });
}

/* ------------------------------------------------------------------ 404 */
function notFound(ctx) {
  const { lang, s } = ctx;
  const body = `<div class="wrap"><div class="empty empty--404">
    <h1>404</h1>
    <h3>${t(lang, '404.title')}</h3>
    <p>${t(lang, '404.sub')}</p>
    <a class="btn" href="${u(lang, '/')}">${t(lang, '404.cta')}</a>
  </div></div>`;
  return layout(ctx, { title: `404 — ${s.store_name}`, body, noindex: true });
}

/* ------------------------------------------------------------ info pages */
const INFO_PAGES = {
  livraison: {
    fr: 'Livraison & retours',
    ar: 'التوصيل والإرجاع',
  },
  retours: {
    fr: 'Garantie & échange',
    ar: 'الضمان والتبديل',
  },
  contact: {
    fr: 'Contact',
    ar: 'اتصل بنا',
  },
  mentions: {
    fr: 'Mentions légales',
    ar: 'معلومات قانونية',
  },
};

function infoBody(key, ctx) {
  const { lang, s } = ctx;
  const ar = lang === 'ar';
  const waNumber = String(s.wa || s.phone || '').replace(/\D/g, '');
  const waLink = waNumber
    ? `https://wa.me/${/^[2-9]\d{7}$/.test(waNumber) ? '216' + waNumber : waNumber}`
    : '';
  const waBtn = waLink
    ? `<a class="btn btn--wa" href="${attr(waLink)}" target="_blank" rel="noopener">${ic('phone')} WhatsApp</a>`
    : '';
  const shipTunis = money(Number(s.ship_tunis) || 8, lang);
  const shipOther = money(Number(s.ship_other) || 8, lang);
  const freeShip = money(Number(s.free_ship) || 500, lang);

  const bodies = {
    livraison: ar
      ? `<h2>التوصيل</h2>
        <p>نوصل إلى كل ولايات الجمهورية التونسية، والتوصيل يكون على باب المنزل.</p>
        <ul>
          <li>تونس الكبرى: ${shipTunis} — من 24 إلى 48 ساعة.</li>
          <li>باقي الولايات: ${shipOther} — من 2 إلى 4 أيام.</li>
          <li>التوصيل مجاني للطلبات التي تتجاوز ${freeShip}.</li>
        </ul>
        <h2>الدفع</h2>
        <p>الدفع يكون عند الاستلام: تفحص طلبك أولا ثم تدفع للموظف الموصّل.</p>
        <h2>الإرجاع</h2>
        <p>يمكنك إرجاع أي منتج غير مستعمل ومع علامته خلال 14 يوما من الاستلام، ونعيد لك المبلغ أو نبدّل لك المنتج.</p>`
      : `<h2>Livraison</h2>
        <p>Nous livrons dans les 24 gouvernorats, directement à votre porte.</p>
        <ul>
          <li>Grand Tunis : ${shipTunis} — sous 24 à 48h.</li>
          <li>Autres gouvernorats : ${shipOther} — sous 2 à 4 jours.</li>
          <li>Livraison offerte dès ${freeShip} d'achat.</li>
        </ul>
        <h2>Paiement</h2>
        <p>Paiement à la livraison : vous vérifiez votre commande, puis vous payez au livreur. Rien à payer en ligne.</p>
        <h2>Retours</h2>
        <p>Un produit ne vous convient pas ? Renvoyez-le dans les 14 jours, non porté et avec son étiquette : remboursement ou échange.</p>`,
    retours: ar
      ? `<h2>ضمان 12 شهرا</h2>
        <p>كل المنتجات المعروضة في هذا الموقع جديدة ومغطاة بضمان 12 شهرا ضد عيوب التصنيع.</p>
        <h2>تبديل في 14 يوما</h2>
        <p>أنت غير راض عن منتج؟ يمكنك إرجاعه خلال 14 يوما من الاستلام:</p>
        <ul>
          <li>المنتج غير مفتوح وبعلبته الأصلية.</li>
          <li>مع كل ملحقاته.</li>
          <li>مع رقم الطلب.</li>
        </ul>
                <h2>منتج معيب؟</h2>
        <p>إذا كان بالمنتج عيب في التصنيع، نستبدله مجانا ونتحمل نحن تكاليف الإرجاع. أرسل لنا صورة على واتساب وسنحل المشكلة في أسرع وقت.</p>
        <h2>كيف تتابع؟</h2>
        <p>راسلنا على واتساب مع رقم طلبك وسنرتب الاستلام والإرجاع.</p>`
      : `<h2>Garantie 12 mois</h2>
        <p>Tous les produits vendus sur ce site sont neufs et couverts par une garantie de 12 mois contre les défauts de fabrication.</p>
        <h2>Échange sous 14 jours</h2>
        <p>Un produit ne vous plaît pas ? Renvoyez-le dans les 14 jours suivant la réception :</p>
        <ul>
          <li>Article non ouvert, dans son emballage d'origine.</li>
          <li>Avec tous ses accessoires.</li>
          <li>Avec votre référence de commande.</li>
        </ul>
        <h2>Produit défectueux ?</h2>
        <p>Si un défaut apparaît pendant la garantie, nous le remplaçons gratuitement — les frais de retour sont à notre charge. Envoyez-nous simplement une photo ou une vidéo sur WhatsApp.</p>
        <h2>Comment procéder ?</h2>
        <p>Écrivez-nous sur WhatsApp avec votre numéro de commande : nous organisons la récupération et l'échange.</p>`,
        contact: ar
      ? `<h2>تواصل معنا</h2>
        <ul>
          <li>📞 الهاتف : <a href="tel:${attr(s.phone)}" dir="ltr">${e(s.phone)}</a></li>
          <li>📍 العنوان : ${e(s.address)}</li>
          ${s.email ? `<li>✉️ البريد : ${e(s.email)}</li>` : ''}
        </ul>
        <p>${t(lang, 'store.hours')}</p>
        <p>أسرع طريقة للطلب أو للسؤال : واتساب. نرد عادة في دقائق.</p>
        <p>${waBtn}</p>`
      : `<h2>Nous joindre</h2>
        <ul>
          <li>📞 Téléphone : <a href="tel:${attr(s.phone)}" dir="ltr">${e(s.phone)}</a></li>
          <li>📍 Adresse : ${e(s.address)}</li>
          ${s.email ? `<li>✉️ E-mail : ${e(s.email)}</li>` : ''}
        </ul>
        <p>${t(lang, 'store.hours')}</p>
        <p>Le plus rapide pour commander ou poser une question : WhatsApp. On répond en général en quelques minutes.</p>
        <p>${waBtn}</p>`,
    mentions: ar
      ? `<h2>المحرّر</h2>
        <p>المتجر : ${e(s.store_name)}<br>العنوان : ${e(s.address)}<br>الهاتف : ${e(s.phone)}</p>
        <h2>الأسعار</h2>
        <p>جميع الأسعار بالدينار التونسي (TND)، وتشمل الضرائب. تكلفة التوصيل تظهر قبل تأكيد الطلب.</p>
        <h2>البيانات الشخصية</h2>
        <p>المعلومات التي تقدمها (الاسم، الهاتف، العنوان) تستخدم فقط لمعالجة وتوصيل طلبك، ولا تُشارك مع أي طرف ثالث ولا تُباع.</p>
        <h2>الموقع</h2>
        <p>الموقع من تصميم Vetrine+.</p>`
      : `<h2>Éditeur</h2>
        <p>Magasin : ${e(s.store_name)}<br>Adresse : ${e(s.address)}<br>Téléphone : ${e(s.phone)}</p>
        <h2>Prix</h2>
        <p>Tous les prix sont indiqués en dinars tunisiens (TND), taxes incluses. Les frais de livraison sont affichés avant la confirmation de commande.</p>
        <h2>Données personnelles</h2>
        <p>Les informations que vous communiquez (nom, téléphone, adresse) servent uniquement à traiter et livrer votre commande. Elles ne sont ni revendues ni partagées avec des tiers.</p>
        <h2>Site</h2>
        <p>Site conçu par Vetrine+.</p>`,
  };
  return bodies[key] || '';
}

function infoPage(ctx, key) {
  const { lang, s } = ctx;
  const meta = INFO_PAGES[key];
  if (!meta) return null;
  const title = lang === 'ar' ? meta.ar : meta.fr;
  const sub = lang === 'ar'
    ? 'كل ما تحتاج معرفته قبل الطلب.'
    : "Tout ce qu'il faut savoir avant de commander.";
  const body = `<div class="pagehead"><div class="wrap">
    <h1>${e(title)}</h1>
    <p class="pagehead__sub">${e(sub)}</p>
  </div></div>
  <section class="sec"><div class="wrap"><div class="info">${infoBody(key, ctx)}</div></div></section>`;
  return layout(ctx, { title: `${title} — ${s.store_name}`, body });
}

module.exports = { home, catalog, product, cartPage, checkout, confirmed, notFound, infoPage };
