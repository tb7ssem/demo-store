# Demo Store — boutique e-commerce de démonstration

Copie de démonstration de la boutique Portablook, avec une marque neutre
(**Demo Store**) pour présenter la solution à d'autres magasins.

- Catalogue de 40 produits (smartphones, écouteurs, enceintes) avec images
  réelles, descriptions FR/AR et fiches techniques.
- Commandes enregistrées puis envoyées sur WhatsApp (numéro configurable dans
  **Admin → Paramètres**).
- Paiement à la livraison, livraison 24–48h, gratuits dès 500 DT.
- Bilingue : `/` (français) et `/ar` (arabe).

## Accès admin

| | |
|---|---|
| URL | `/admin` |
| Mot de passe | `demostore2026` (ou variable d'environnement `DEMO_ADMIN_PASSWORD`) |

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `SITE_URL` | URL publique (canonical/OG) |
| `DEMO_ADMIN_PASSWORD` | mot de passe admin |

## Lancement local

```bash
node server.js   # http://localhost:3000
```

## Déploiement Netlify

```bash
netlify deploy --prod --message '...' --json
```

Les données (paramètres, stock, commandes) persistent via Netlify Blobs
(store `demo-store-data`).

## Remplacer la marque

1. Remplacer `public/logo-demo-dark.png` (header, fond clair) et
   `public/logo-demo-light.png` (admin/footer, fond sombre) — 632×238.
2. `public/favicon.png` (64×64) et `public/og.png` (1200×630) / `og.svg`.
3. **Admin → Paramètres** : nom, téléphone, WhatsApp, e-mail, adresse,
   annonces, textes SEO.
