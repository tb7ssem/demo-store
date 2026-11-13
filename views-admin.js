'use strict';
const { e, attr, money, dateFmt, t, GOV, GOV_AR, STATUSES } = require('./lib');
const { ic } = require('./ui');

const FR = (k) => t('fr', k);
const statusBadge = (k) => {
  const s = STATUSES.find((x) => x.key === k) || STATUSES[0];
  return `<span class="pstatus" style="--sc:${s.color};--sb:${s.bg}">${FR('status.' + k)}</span>`;
};

function adminLayout(ctx, opt) {
  const { s } = ctx;
  const nav = [
    ['/', 'grid', 'Tableau de bord'],
    ['/admin/produits', 'box', 'Produits'],
    ['/admin/commandes', 'bag', 'Commandes'],
    ['/admin/stock', 'alert', 'Stock'],
    ['/admin/parametres', 'cog', 'Paramètres'],
  ];
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(opt.title)} — Admin ${e(s.store_name)}</title>
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/admin.css">
</head>
<body class="ad">
<aside class="ad__side">
  <a class="ad__brand" href="/admin">
    <img src="/logo-demo-light.png" alt="Demo Store" width="316" height="119">
    <em>admin</em>
  </a>
  <nav class="ad__nav">
    ${nav
      .map(
        ([href, i, label]) =>
          `<a href="${href}" class="${ctx.adActive === href ? 'is-on' : ''}">${ic(i)}<span>${label}</span>${
            href === '/admin/commandes' && ctx.newOrders ? `<b>${ctx.newOrders}</b>` : ''
          }${href === '/admin/stock' && ctx.lowCount ? `<b class="b--warn">${ctx.lowCount}</b>` : ''}</a>`
      )
      .join('')}
  </nav>
  <div class="ad__sidefoot">
    <a class="ad__view" href="/" target="_blank">${ic('arrow')} Voir la boutique</a>
    <form method="post" action="/admin/logout"><button class="ad__logout" type="submit">${ic('logout')} Déconnexion</button></form>
  </div>
</aside>

<div class="ad__main">
  <header class="ad__top">
    <div>
      <p class="ad__eyebrow">${e(opt.eyebrow || 'Administration')}</p>
      <h1>${e(opt.title)}</h1>
    </div>
    <div class="ad__topact">
      ${opt.actions || ''}
      <div class="ad__user"><span>${e(s.store_name)}</span><small>Tunisie</small></div>
    </div>
  </header>
  ${opt.flash ? `<div class="flash">${ic('check')} ${e(opt.flash)}</div>` : ''}
  ${opt.body}
</div>
<div class="toast" data-toast role="status"></div>
<script src="/app.js" defer></script>
</body>
</html>`;
}

function login(ctx, error) {
  const { s } = ctx;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Connexion — Admin ${e(s.store_name)}</title>
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/favicon.png" type="image/png">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/admin.css">
</head>
<body class="ad ad--login">
  <div class="login">
    <div class="login__card">
      <a class="ad__brand" href="/">
        <img src="/logo-demo-dark.png" alt="Demo Store" width="316" height="119">
      </a>
      <h1>Espace administration</h1>
      <p>Gérez votre catalogue, vos commandes et votre stock.</p>
      ${error ? `<div class="alert">${ic('alert')} ${e(error)}</div>` : ''}
      <form method="post" action="/admin/login">
        <label class="field"><span>Mot de passe</span><input type="password" name="password" autofocus required placeholder="••••••••"></label>
        <button class="btn btn--block" type="submit">Se connecter ${ic('arrow')}</button>
      </form>
      <div class="login__hint">Accès de démonstration sécurisé</div>
    </div>
  </div>
</body>
</html>`;
}

/* -------------------------------------------------------------- dashboard */
function dashboard(ctx, d) {
  const { s } = ctx;
  const max = Math.max(1, ...d.chart.map((c) => c.total));
  const bars = d.chart
    .map(
      (c, i) => `<div class="bar" title="${c.day} — ${money(c.total)}">
      <span style="height:${Math.max(3, Math.round((c.total / max) * 100))}%"></span>
      <em>${i % 2 === 0 || i === d.chart.length - 1 ? c.label : ''}</em>
    </div>`
    )
    .join('');

  const kpi = (label, value, delta, sub) => `
    <div class="kpi">
      <p>${label}</p>
      <strong>${value}</strong>
      <div class="kpi__foot">${delta ? `<span class="delta ${delta.startsWith('-') ? 'delta--down' : ''}">${delta}</span>` : ''}<small>${sub}</small></div>
    </div>`;

  const body = `
${s.admin_note ? `<div class="adnote"><strong>Démo</strong> ${e(s.admin_note)} Le catalogue contient encore des produits de démonstration : importez ou ajoutez les vrais produits avant la mise en ligne.</div>` : ''}
<div class="kpis kpis--5">
  ${kpi("Chiffre d'affaires (30 j)", money(d.rev30), d.revDelta, 'calculé sur les commandes non annulées')}
  ${kpi('Commandes', d.orders30, d.ordersDelta, `${d.pending} à traiter`)}
  ${kpi('Panier moyen', money(d.aov), null, 'sur 30 jours')}
  ${kpi('Stock faible', d.lowCount, null, 'produits sous 5 unités')}
  ${kpi('Visites (30 j)', d.visits ? d.visits.v30 : '—', null, d.visits ? `${d.visits.uniq} visiteurs uniques au total` : '')}
</div>

<div class="ad__grid">
  <section class="cardpanel">
    <div class="cardpanel__head">
      <div><h2>Ventes des 14 derniers jours</h2><p>Montant hors livraison, commandes annulées exclues</p></div>
      <span class="cardpanel__total">${money(d.chart.reduce((a, b) => a + b.total, 0))}</span>
    </div>
    <div class="chart">${bars}</div>
    <div class="chart__legend"><span></span> Total encaissé par jour</div>
  </section>

  <section class="cardpanel">
    <div class="cardpanel__head"><div><h2>Meilleures ventes</h2><p>30 derniers jours</p></div></div>
    <ol class="toplist">
      ${
        d.top.length
          ? d.top
              .map(
                (p, i) => `<li>
        <span class="toplist__rank">${i + 1}</span>
        <img src="${attr(p.image || '/img/p/' + p.id + '.svg')}" alt="">
        <div><strong>${e(p.name_fr)}</strong><small>${e(p.brand)} · ${p.qty} ${p.qty > 1 ? 'vendus' : 'vendu'}</small></div>
        <b>${money(p.revenue)}</b>
      </li>`
              )
              .join('')
          : '<li class="muted">Aucune vente sur la période.</li>'
      }
    </ol>
  </section>

  <section class="cardpanel">
    <div class="cardpanel__head"><div><h2>Pages les plus vues</h2><p>30 derniers jours</p></div></div>
    <ol class="toplist">
      ${
        d.visits && d.visits.topPages.length
          ? d.visits.topPages
              .map(
                (p, i) => `<li>
        <span class="toplist__rank">${i + 1}</span>
        <div><strong>${e(p.path)}</strong><small>${p.n} vue${p.n > 1 ? 's' : ''}</small></div>
        <b>${p.n}</b>
      </li>`
              )
              .join('')
          : '<li class="muted">Aucune visite enregistrée.</li>'
      }
    </ol>
  </section>
</div>

<div class="ad__grid">
  <section class="cardpanel cardpanel--wide">
    <div class="cardpanel__head">
      <div><h2>Commandes récentes</h2><p>Les 6 dernières</p></div>
      <a class="link" href="/admin/commandes">Tout voir ${ic('arrow')}</a>
    </div>
    <table class="table">
      <thead><tr><th>Réf.</th><th>Client</th><th>Gouvernorat</th><th>Total</th><th>Statut</th><th></th></tr></thead>
      <tbody>
        ${d.recent
          .map(
            (o) => `<tr>
          <td><strong>${e(o.ref)}</strong><br><small>${dateFmt(o.created_at)}</small></td>
          <td>${e(o.customer_name)}<br><small>${e(o.phone)}</small></td>
          <td>${e(o.governorate)}</td>
          <td><strong>${money(o.total)}</strong></td>
          <td>${statusBadge(o.status)}</td>
          <td><a class="iconbtn" href="/admin/commandes/${o.id}" aria-label="Ouvrir">${ic('chevron')}</a></td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </section>

  <section class="cardpanel">
    <div class="cardpanel__head"><div><h2>Alertes stock</h2><p>À réapprovisionner</p></div></div>
    <ul class="lowlist">
      ${
        d.low.length
          ? d.low
              .map(
                (p) => `<li>
        <img src="${attr(p.image || '/img/p/' + p.id + '.svg')}" alt="">
        <div><strong>${e(p.name_fr)}</strong><small>${e(p.sku)}</small></div>
        <span class="${p.stock === 0 ? 'pill pill--red' : 'pill pill--amber'}">${p.stock === 0 ? 'Rupture' : p.stock + ' restants'}</span>
      </li>`
              )
              .join('')
          : '<li class="muted">Tout est en stock. 👌</li>'
      }
    </ul>
    <a class="link" href="/admin/stock">Gérer le stock ${ic('arrow')}</a>
  </section>
</div>`;

  return adminLayout(ctx, {
    title: 'Tableau de bord',
    eyebrow: 'Vue d’ensemble',
    body,
    adActive: '/',
    actions: `<a class="btn btn--sm" href="/admin/produits/nouveau">${ic('plus')} Nouveau produit</a>`,
  });
}

/* --------------------------------------------------------------- products */
function products(ctx, list, q, flash) {
  const body = `
<div class="toolbar">
  <form class="search search--ad" method="get" action="/admin/produits">
    ${ic('search')}<input type="search" name="q" value="${attr(q || '')}" placeholder="Rechercher un produit…">
  </form>
  <div class="toolbar__right">
    <a class="btn btn--sm btn--ghost" href="/admin/export.csv">${ic('down')} Export CSV</a>
    <a class="btn btn--sm" href="/admin/produits/nouveau">${ic('plus')} Nouveau produit</a>
  </div>
</div>

<details class="importer">
  <summary>${ic('up')} Importer un catalogue (CSV / Excel)</summary>
  <form method="post" action="/admin/import">
    <p>Collez ici le contenu d'un fichier CSV exporté depuis Meta Commerce Manager, Excel ou Google Sheets. Les colonnes reconnues : <code>sku, nom_fr, nom_ar, marque, categorie, prix, ancien_prix, stock, garantie, description_fr, image</code>. Un produit existant (même SKU) est mis à jour.</p>
    <div class="importer__file">
      <label class="btn btn--sm btn--ghost">${ic('up')} Choisir un fichier CSV<input type="file" accept=".csv,.txt,text/csv" data-csv-file hidden></label>
      <span class="importer__filename" data-csv-name>Aucun fichier sélectionné — ou collez le contenu ci-dessous</span>
    </div>
    <textarea name="csv" rows="7" placeholder="sku,nom_fr,nom_ar,marque,categorie,prix,stock&#10;PB-EC-2001,Écouteurs JBL Tune Buds,سماعات JBL Tune Buds,JBL,ecouteurs,379,10"></textarea>
    <div class="importer__actions">
      <button class="btn btn--sm" type="submit">Importer et mettre à jour</button>
      <a class="link" href="/admin/modele.csv">Télécharger le modèle</a>
    </div>
  </form>
</details>

<section class="cardpanel">
  <div class="cardpanel__head"><div><h2>${list.length} produits</h2><p>Catalogue complet, tous statuts</p></div></div>
  <table class="table table--prod">
    <thead><tr><th></th><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Statut</th><th></th></tr></thead>
    <tbody>
      ${list
        .map(
          (p) => `<tr>
        <td><img class="thumb" src="${attr(p.image || '/img/p/' + p.id + '.svg')}" alt=""></td>
        <td>
          <strong>${e(p.name_fr)}</strong>
          <small>${e(p.sku)} · ${e(p.brand)}</small>
        </td>
        <td>${e(p.cat_name)}</td>
        <td><strong>${money(p.price)}</strong>${p.old_price ? `<br><small><s>${money(p.old_price)}</s></small>` : ''}</td>
        <td>
          <form class="stockform" method="post" action="/admin/produits/stock">
            <input type="hidden" name="id" value="${p.id}">
            <input type="number" name="stock" value="${p.stock}" min="0" aria-label="Stock">
            <button class="iconbtn iconbtn--sm" type="submit" aria-label="Enregistrer">${ic('check')}</button>
          </form>
        </td>
        <td>${p.active ? '<span class="pill pill--green">En ligne</span>' : '<span class="pill">Masqué</span>'}</td>
        <td class="rowact">
          <a class="iconbtn" href="/admin/produits/${p.id}" aria-label="Modifier">${ic('edit')}</a>
          <form method="post" action="/admin/produits/supprimer" data-confirm="Supprimer « ${attr(p.name_fr)} » ?">
            <input type="hidden" name="id" value="${p.id}">
            <button class="iconbtn iconbtn--danger" type="submit" aria-label="Supprimer">${ic('trash')}</button>
          </form>
        </td>
      </tr>`
        )
        .join('')}
      ${list.length ? '' : '<tr><td colspan="7" class="muted">Aucun produit. Importez un catalogue ou créez un produit.</td></tr>'}
    </tbody>
  </table>
</section>`;

  return adminLayout(ctx, { title: 'Produits', eyebrow: 'Catalogue', body, adActive: '/admin/produits', flash });
}

function productForm(ctx, p, cats, err, flash) {
  const isNew = !p.id;
  const specsText = Object.entries(JSON.parse(p.specs && p.specs !== '{}' ? p.specs : '{}'))
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const body = `
<form class="adform" method="post" action="/admin/produits/enregistrer">
  <input type="hidden" name="id" value="${p.id || ''}">
  ${err ? `<div class="alert">${ic('alert')} ${e(err)}</div>` : ''}

  <div class="adform__grid">
    <section class="cardpanel">
      <div class="cardpanel__head"><div><h2>Informations</h2><p>Affichées sur la fiche produit</p></div></div>
      <div class="fields">
        <label class="field field--full"><span>Nom (français)</span><input name="name_fr" value="${attr(p.name_fr || '')}" required></label>
        <label class="field field--full"><span>Nom (arabe)</span><input name="name_ar" value="${attr(p.name_ar || '')}" dir="rtl" required></label>
        <label class="field"><span>Marque</span><input name="brand" value="${attr(p.brand || '')}" required></label>
        <label class="field"><span>SKU / Réf.</span><input name="sku" value="${attr(p.sku || '')}" required></label>
        <label class="field"><span>Catégorie</span>
          <select name="cat_id">
            ${cats.map((c) => `<option value="${c.id}" ${p.cat_id === c.id ? 'selected' : ''}>${e(c.name_fr)}</option>`).join('')}
          </select>
        </label>
        <label class="field"><span>URL (slug)</span><input name="slug" value="${attr(p.slug || '')}" placeholder="auto si vide"></label>
        <label class="field field--full"><span>Description (français)</span><textarea name="desc_fr" rows="3">${e(p.desc_fr || '')}</textarea></label>
        <label class="field field--full"><span>Description (arabe)</span><textarea name="desc_ar" rows="3" dir="rtl">${e(p.desc_ar || '')}</textarea></label>
        <label class="field field--full"><span>Image (URL) — vide = visuel généré</span><input name="image" value="${attr(p.image || '')}" placeholder="/uploads/mon-produit.jpg ou https://…"></label>
      </div>
    </section>

    <div class="adform__side">
      <section class="cardpanel">
        <div class="cardpanel__head"><div><h2>Prix & stock</h2></div></div>
        <div class="fields">
          <label class="field"><span>Prix (DT)</span><input type="number" step="0.001" name="price" value="${attr(p.price ?? '')}" required></label>
          <label class="field"><span>Ancien prix</span><input type="number" step="0.001" name="old_price" value="${attr(p.old_price ?? '')}"></label>
          <label class="field"><span>Stock</span><input type="number" name="stock" value="${attr(p.stock ?? 0)}" min="0"></label>
          <label class="field"><span>Garantie (mois)</span><input type="number" name="warranty" value="${attr(p.warranty ?? 12)}" min="0"></label>
          <label class="field"><span>État</span><input value="Neuf" disabled><input type="hidden" name="condition" value="new"></label>
          <label class="field"><span>Badge</span>
            <select name="badge">
              <option value="" ${!p.badge ? 'selected' : ''}>Aucun</option>
              <option value="best" ${p.badge === 'best' ? 'selected' : ''}>Top vente</option>
              <option value="promo" ${p.badge === 'promo' ? 'selected' : ''}>Promo</option>
            </select>
          </label>
          <label class="field"><span>Visibilité</span>
            <select name="active">
              <option value="1" ${p.active ? 'selected' : ''}>En ligne</option>
              <option value="0" ${p.active ? '' : 'selected'}>Masqué</option>
            </select>
          </label>
        </div>
      </section>

      <section class="cardpanel">
        <div class="cardpanel__head"><div><h2>Fiche technique</h2><p>Une ligne par caractéristique : <code>Clé: Valeur</code></p></div></div>
        <textarea name="specs" rows="7" class="mono" placeholder="Processeur: Intel Core i5-1335U&#10;RAM: 16 Go">${e(specsText)}</textarea>
      </section>

      <div class="adform__actions">
        <button class="btn btn--block" type="submit">${ic('check')} ${isNew ? 'Créer le produit' : 'Enregistrer'}</button>
        <a class="btn btn--ghost btn--block" href="/admin/produits">Annuler</a>
      </div>
    </div>
  </div>
</form>`;

  return adminLayout(ctx, {
    title: isNew ? 'Nouveau produit' : 'Modifier le produit',
    eyebrow: isNew ? 'Catalogue' : 'Édition',
    body,
    adActive: '/admin/produits',
    flash,
    actions: !isNew ? `<a class="btn btn--sm btn--ghost" href="/produit/${attr(p.slug)}" target="_blank">${ic('arrow')} Voir en ligne</a>` : '',
  });
}

/* ----------------------------------------------------------------- orders */
function orders(ctx, list, counts, filter, q) {
  const tabs = [{ key: 'all', label: 'Toutes' }, ...STATUSES.map((s) => ({ key: s.key, label: FR('status.' + s.key) }))];
  const body = `
<div class="toolbar">
  <div class="tabs">
    ${tabs
      .map(
        (x) => `<a class="tab${filter === x.key ? ' is-on' : ''}" href="/admin/commandes?statut=${x.key}">${x.label}<b>${counts[x.key] || 0}</b></a>`
      )
      .join('')}
  </div>
  <form class="search search--ad" method="get" action="/admin/commandes">
    <input type="hidden" name="statut" value="${attr(filter)}">
    ${ic('search')}<input type="search" name="q" value="${attr(q || '')}" placeholder="Réf., nom ou téléphone…">
  </form>
</div>

<section class="cardpanel">
  <table class="table">
    <thead><tr><th>Réf.</th><th>Date</th><th>Client</th><th>Livraison</th><th>Articles</th><th>Total</th><th>Statut</th><th></th></tr></thead>
    <tbody>
      ${list
        .map(
          (o) => `<tr>
        <td><strong>${e(o.ref)}</strong></td>
        <td><small>${dateFmt(o.created_at)}</small></td>
        <td>${e(o.customer_name)}<br><small>${e(o.phone)}</small></td>
        <td>${e(o.governorate)}<br><small>${e(o.city)}</small></td>
        <td>${o.items_count}</td>
        <td><strong>${money(o.total)}</strong></td>
        <td>${statusBadge(o.status)}</td>
        <td><a class="iconbtn" href="/admin/commandes/${o.id}" aria-label="Ouvrir">${ic('chevron')}</a></td>
      </tr>`
        )
        .join('')}
      ${list.length ? '' : '<tr><td colspan="8" class="muted">Aucune commande pour ce filtre.</td></tr>'}
    </tbody>
  </table>
</section>`;

  return adminLayout(ctx, { title: 'Commandes', eyebrow: 'Ventes', body, adActive: '/admin/commandes' });
}

function orderDetail(ctx, o, items, flash) {
  const body = `
<div class="orderhead">
  <div>
    <div class="orderhead__ref">${e(o.ref)} ${statusBadge(o.status)}</div>
    <p>Passée le ${dateFmt(o.created_at)} · ${o.items_count} article(s) · ${e(o.governorate)}</p>
  </div>
  <div class="orderhead__actions">
    <a class="btn btn--sm btn--ghost" href="/admin/commandes">${ic('chevron')} Retour</a>
    <button class="btn btn--sm" type="button" onclick="window.print()">${ic('print')} Bon de livraison</button>
  </div>
</div>

<div class="ad__grid">
  <section class="cardpanel">
    <div class="cardpanel__head"><div><h2>Articles</h2></div><span class="cardpanel__total">${money(o.total)}</span></div>
    <table class="table">
      <thead><tr><th>Produit</th><th>Réf.</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead>
      <tbody>
        ${items
          .map(
            (it) => `<tr>
          <td><div class="tditem"><img class="thumb" src="${attr('/img/p/' + (it.product_id || 0) + '.svg')}" alt=""><div class="tdname"><strong>${e(it.name_fr)}</strong><small dir="auto">${e(it.name_ar)}</small></div></div></td>
          <td><small>${e(it.sku)}</small></td>
          <td>${it.qty}</td>
          <td>${money(it.price)}</td>
          <td><strong>${money(it.price * it.qty)}</strong></td>
        </tr>`
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr><td colspan="4">Sous-total</td><td>${money(o.subtotal)}</td></tr>
        <tr><td colspan="4">Livraison</td><td>${o.shipping === 0 ? 'Offerte' : money(o.shipping)}</td></tr>
        <tr class="tfoot__total"><td colspan="4">Total à encaisser</td><td>${money(o.total)}</td></tr>
      </tfoot>
    </table>
  </section>

  <div class="adform__side">
    <section class="cardpanel">
      <div class="cardpanel__head"><div><h2>Client</h2></div></div>
      <ul class="confirm__info">
        <li><span>Nom</span><strong>${e(o.customer_name)}</strong></li>
        <li><span>Téléphone</span><strong><a href="tel:${attr(o.phone)}">${e(o.phone)}</a></strong></li>
        <li><span>Adresse</span><strong>${e(o.address)}</strong></li>
        <li><span>Ville</span><strong>${e(o.city)} · ${e(o.governorate)}</strong></li>
        <li><span>Paiement</span><strong>À la livraison</strong></li>
        ${o.note ? `<li><span>Note</span><strong>${e(o.note)}</strong></li>` : ''}
      </ul>
      <div class="ordercta">
        <a class="btn btn--sm btn--wa" href="https://wa.me/216${attr(o.phone.replace(/[^0-9]/g, '').replace(/^216/, ''))}?text=${encodeURIComponent('Bonjour ' + o.customer_name + ', votre commande ' + o.ref)}" target="_blank" rel="noopener">${ic('wa')} WhatsApp</a>
        <a class="btn btn--sm btn--ghost" href="tel:${attr(o.phone)}">${ic('phone')} Appeler</a>
      </div>
    </section>

    <section class="cardpanel">
      <div class="cardpanel__head"><div><h2>Statut</h2><p>Faire avancer la commande</p></div></div>
      <form class="statusform" method="post" action="/admin/commandes/${o.id}/statut">
        ${STATUSES.map(
          (s) => `<label class="statusopt${o.status === s.key ? ' is-on' : ''}" style="--sc:${s.color};--sb:${s.bg}">
          <input type="radio" name="status" value="${s.key}" ${o.status === s.key ? 'checked' : ''}>
          <span>${FR('status.' + s.key)}</span>
        </label>`
        ).join('')}
        <button class="btn btn--sm btn--block" type="submit">Mettre à jour</button>
      </form>
      <p class="muted small">Une annulation remet automatiquement les articles en stock.</p>
    </section>
  </div>
</div>`;

  return adminLayout(ctx, {
    title: 'Commande ' + o.ref,
    eyebrow: 'Détail commande',
    body,
    adActive: '/admin/commandes',
    flash,
  });
}

/* ------------------------------------------------------------------ stock */
function stock(ctx, low, all) {
  const body = `
<div class="kpis kpis--3">
  <div class="kpi"><p>Ruptures</p><strong>${all.filter((p) => p.stock === 0).length}</strong><div class="kpi__foot"><small>produits à commander</small></div></div>
  <div class="kpi"><p>Stock faible</p><strong>${all.filter((p) => p.stock > 0 && p.stock <= 5).length}</strong><div class="kpi__foot"><small>5 unités ou moins</small></div></div>
  <div class="kpi"><p>Valeur du stock</p><strong>${money(all.reduce((a, p) => a + p.price * p.stock, 0))}</strong><div class="kpi__foot"><small>au prix de vente</small></div></div>
</div>

<section class="cardpanel">
  <div class="cardpanel__head"><div><h2>À réapprovisionner</h2><p>Trié par urgence</p></div></div>
  <table class="table table--prod">
    <thead><tr><th></th><th>Produit</th><th>Réf.</th><th>Stock</th><th>Mise à jour</th></tr></thead>
    <tbody>
      ${low
        .map(
          (p) => `<tr>
        <td><img class="thumb" src="${attr(p.image || '/img/p/' + p.id + '.svg')}" alt=""></td>
        <td><strong>${e(p.name_fr)}</strong><small>${e(p.brand)}</small></td>
        <td><small>${e(p.sku)}</small></td>
        <td>${p.stock === 0 ? '<span class="pill pill--red">Rupture</span>' : `<span class="pill pill--amber">${p.stock} restants</span>`}</td>
        <td>
          <form class="stockform" method="post" action="/admin/produits/stock">
            <input type="hidden" name="id" value="${p.id}">
            <input type="number" name="stock" value="${p.stock}" min="0">
            <button class="iconbtn iconbtn--sm" type="submit" aria-label="Enregistrer">${ic('check')}</button>
          </form>
        </td>
      </tr>`
        )
        .join('')}
      ${low.length ? '' : '<tr><td colspan="5" class="muted">Aucun produit en alerte. Stock sain.</td></tr>'}
    </tbody>
  </table>
</section>`;

  return adminLayout(ctx, { title: 'Stock', eyebrow: 'Logistique', body, adActive: '/admin/stock' });
}

/* --------------------------------------------------------------- settings */
function settings(ctx, flash) {
  const { s } = ctx;
  const f = (name, label, val, attrs = '', type = 'text') => `
    <label class="field"><span>${label}</span><input type="${type}" name="${name}" value="${attr(val || '')}" ${attrs}></label>`;

  const body = `
<form class="adform" method="post" action="/admin/parametres">
  <div class="adform__grid">
    <section class="cardpanel">
      <div class="cardpanel__head"><div><h2>Boutique</h2><p>Coordonnées affichées sur le site</p></div></div>
      <div class="fields">
        ${f('store_name', 'Nom de la boutique', s.store_name)}
        ${f('phone', 'Téléphone affiché', s.phone)}
        ${f('wa', 'WhatsApp (216…)', s.wa)}
        ${f('email', 'Email', s.email, '', 'email')}
        <label class="field field--full"><span>Adresse</span><input name="address" value="${attr(s.address)}"></label>
        ${f('site_url', 'URL du site (SEO)', s.site_url)}
      </div>
    </section>

    <div class="adform__side">
      <section class="cardpanel">
        <div class="cardpanel__head"><div><h2>Livraison</h2></div></div>
        <div class="fields">
          ${f('free_ship', 'Livraison offerte dès (DT)', s.free_ship, 'type="number"')}
          ${f('ship_tunis', 'Frais Grand Tunis (DT)', s.ship_tunis, 'type="number"')}
          ${f('ship_other', 'Frais autres gouvernorats (DT)', s.ship_other, 'type="number"')}
        </div>
      </section>
      <div class="adform__actions">
        <button class="btn btn--block" type="submit">${ic('check')} Enregistrer</button>
      </div>
    </div>
  </div>

  <section class="cardpanel">
    <div class="cardpanel__head"><div><h2>Textes & SEO</h2><p>Bandeau d'annonce et métadonnées</p></div></div>
    <div class="fields">
      <label class="field field--full"><span>Bandeau d'annonce (FR)</span><input name="announcement_fr" value="${attr(s.announcement_fr)}"></label>
      <label class="field field--full"><span>Bandeau d'annonce (AR)</span><input name="announcement_ar" value="${attr(s.announcement_ar)}" dir="rtl"></label>
      <label class="field field--full"><span>Meta description (FR)</span><textarea name="meta_fr" rows="3">${e(s.meta_fr)}</textarea></label>
      <label class="field field--full"><span>Meta description (AR)</span><textarea name="meta_ar" rows="3" dir="rtl">${e(s.meta_ar)}</textarea></label>
    </div>
  </section>
</form>`;

  return adminLayout(ctx, { title: 'Paramètres', eyebrow: 'Configuration', body, adActive: '/admin/parametres', flash });
}

module.exports = { adminLayout, login, dashboard, products, productForm, orders, orderDetail, stock, settings };
