'use strict';

/* ------------------------------------------------------------------ basics */
const e = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const attr = e;

function money(n, lang = 'fr') {
  const v = Number(n) || 0;
  const base = v.toLocaleString('fr-FR', {
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return lang === 'ar' ? `${base} د.ت` : `${base} DT`;
}

function dateFmt(iso, lang = 'fr') {
  const d = new Date(String(iso).replace(' ', 'T') + 'Z');
  if (isNaN(d)) return String(iso);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-TN' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function slugify(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

const TND_CODES = /^(\+?216)?[0-9]{8}$/;

/* --------------------------------------------------------------- i18n copy */
const T = {
  fr: {
    'nav.home': 'Accueil',
    'nav.shop': 'Boutique',
    'nav.gaming': 'Gaming',
    'nav.deals': 'Promos',
    'nav.contact': 'Contact',
    'nav.all': 'Toutes les catégories',
    'search.ph': 'Rechercher un produit…',
    'search.btn': 'Rechercher',
    'lang.other': 'العربية',
    'cart': 'Panier',
    'cart.short': 'Panier',
    'account': 'Compte',
    'announce.free': 'Livraison offerte dès 500 DT · Paiement à la livraison',
    'hero.eyebrow': 'Audio & mobile · Tunisie',
    'hero.title': 'Le son et le mobile, au juste prix.',
    'hero.sub':
      "40 smartphones et produits audio sélectionnés sur le marché tunisien, avec images réelles, prix indicatifs et fiches détaillées en français et en arabe.",
    'hero.cta1': 'Voir la boutique',
    'hero.cta2': 'Voir les smartphones',
    'hero.stat1': 'références à valider',
    'hero.stat2': 'livraison 24–48h',
    'hero.stat3': 'garantie boutique',
    'trust.delivery': 'Livraison 24–48h',
    'trust.delivery.sub': 'Les 24 gouvernorats',
    'trust.payment': 'Paiement à la livraison',
    'trust.payment.sub': 'Vous payez à réception',
    'trust.warranty': 'Garantie & SAV',
    'trust.warranty.sub': 'Atelier local',
    'trust.support': 'Conseil avant achat',
    'trust.support.sub': 'Par téléphone ou WhatsApp',
    'cat.title': 'Catégories',
    'cat.sub': 'Trouvez le modèle qu’il vous faut',
    'cat.count': 'produits',
    'best.title': 'Sélection du catalogue',
    'best.sub': 'Une référence de chaque univers à découvrir',
    'deals.title': 'Promos en cours',
    'deals.sub': 'Stock limité, prix affichés en dinars',
    'deals.all': 'Toutes les promos',
    'why.title': 'Pourquoi cette boutique',
    'why.1': 'Produits documentés',
    'why.1.sub':
      'Chaque fiche reprend des caractéristiques vérifiées auprès de sources tunisiennes actives.',
    'why.2': 'Descriptions originales FR/AR',
    'why.2.sub': 'Les textes ont été rédigés pour la boutique en français et en arabe, sans copier les descriptions des autres boutiques.',
    'why.3': 'Validation avant vente',
    'why.3.sub': 'Le client doit confirmer ses prix, ses quantités et ses conditions de garantie avant d’activer les commandes.',
    'promo.eyebrow': 'Offre de lancement',
    'promo.title': 'Livraison offerte dès 500 DT',
    'promo.sub': 'Sur tout le catalogue, partout en Tunisie. Paiement à la livraison.',
    'promo.cta': 'En profiter',
    'brands.title': 'Marques au catalogue',
    'news.title': 'Les bonnes affaires, une fois par semaine',
    'news.sub': 'Nouveaux arrivages et baisses de prix. Pas de spam.',
    'news.ph': 'votre@email.tn',
    'news.cta': 'Je m’inscris',
    'news.ok': 'Merci ! Vous êtes inscrit.',
    'store.title': 'La boutique',
    'store.hours': 'Lun–Sam · 9h00 – 19h00',
    'store.dir': 'Itinéraire',
    'store.call': 'Appeler',
    'store.wa': 'WhatsApp',
    'f.shop': 'Boutique',
    'f.help': 'Aide',
    'f.about': 'À propos',
    'f.delivery': 'Livraison & retours',
    'f.warranty': 'Garantie',
    'f.contact': 'Contact',
    'f.legal': 'Mentions légales',
    'f.pay': 'Moyens de paiement',
    'f.pay.cod': 'À la livraison',
    'f.pay.bank': 'Virement / chèque',
    'f.pay.card': 'Carte bancaire (bientôt)',
    'f.rights': 'Tous droits réservés.',
    'f.built': 'Site conçu par Vetrine+',
    'sort.label': 'Trier par',
    'sort.new': 'Nouveautés',
    'sort.price_asc': 'Prix croissant',
    'sort.price_desc': 'Prix décroissant',
    'sort.best': 'Meilleures ventes',
    'filters': 'Filtres',
    'filters.cat': 'Catégorie',
    'filters.brand': 'Marque',
    'filters.price': 'Prix',
    'filters.stock': 'En stock uniquement',
    'filters.reset': 'Réinitialiser',
    'filters.apply': 'Appliquer',
    'filters.all': 'Toutes',
    'results': 'produits',
    'results.empty': 'Aucun produit ne correspond à votre recherche.',
    'results.empty.cta': 'Voir tout le catalogue',
    'p.add': 'Ajouter au panier',
    'p.buy': 'Acheter maintenant',
    'p.stock': 'En stock',
    'p.low': 'Dernières pièces',
    'p.out': 'Rupture de stock',
    'p.qty': 'Quantité',
    'p.sku': 'Réf.',
    'p.warranty': 'Garantie',
    'p.warranty.m': 'mois',
    'p.condition': 'État',
    'p.new': 'Neuf',
    'p.refurb': 'Reconditionné',
    'p.specs': 'Fiche technique',
    'p.desc': 'Description',
    'p.delivery': 'Livraison 24–48h',
    'p.delivery.sub': 'Partout en Tunisie, 7–8 DT',
    'p.pay': 'Paiement à la livraison',
    'p.pay.sub': 'Vous payez le livreur',
    'p.warranty.box': 'Garantie boutique',
    'p.warranty.box.sub': 'SAV local',
    'p.related': 'Souvent achetés ensemble',
    'p.brand': 'Marque',
    'p.ref': 'Référence',
    'p.promo': 'Promo',
    'p.share': 'Partager',
    'cart.title': 'Votre panier',
    'cart.empty': 'Votre panier est vide.',
    'cart.empty.cta': 'Découvrir la boutique',
    'cart.product': 'Produit',
    'cart.price': 'Prix',
    'cart.qty': 'Qté',
    'cart.total': 'Total',
    'cart.remove': 'Retirer',
    'cart.update': 'Mettre à jour',
    'cart.summary': 'Récapitulatif',
    'cart.subtotal': 'Sous-total',
    'cart.shipping': 'Livraison',
    'cart.free': 'Offerte',
    'cart.free.note': 'Livraison offerte dès 500 DT',
    'cart.grand': 'Calculée à l’étape suivante',
    'cart.checkout': 'Passer commande',
    'cart.continue': 'Continuer mes achats',
    'cart.clear': 'Vider le panier',
    'co.title': 'Finaliser la commande',
    'co.step': 'Coordonnées, livraison et envoi sur WhatsApp',
    'co.contact': 'Coordonnées',
    'co.name': 'Nom et prénom',
    'co.phone': 'Téléphone',
    'co.gov': 'Gouvernorat',
    'co.city': 'Ville / Localité',
    'co.addr': 'Adresse complète',
    'co.note': 'Note (optionnel)',
    'co.note.ph': 'Étage, repère, heure de livraison…',
    'co.pay': 'Paiement',
    'co.cod': 'Paiement à la livraison',
    'co.cod.sub': 'Vous réglez en espèces au livreur. Aucun frais supplémentaire.',
    'co.place': 'Confirmer sur WhatsApp',
    'co.terms': 'WhatsApp va s’ouvrir avec votre commande. Appuyez sur Envoyer pour la transmettre au magasin.',
    'co.summary': 'Votre commande',
    'co.err': 'Merci de corriger les champs indiqués.',
    'co.required': 'Champ obligatoire',
    'co.phone.err': 'Numéro tunisien invalide (8 chiffres).',
    'ok.eyebrow': 'Commande enregistrée',
    'ok.title': 'Merci, votre commande est confirmée !',
    'ok.sub': 'Nous vous appelons pour confirmer avant expédition.',
    'ok.ref': 'Numéro de commande',
    'ok.next': 'Et maintenant ?',
    'ok.step1': 'Nous vous appelons au numéro indiqué pour confirmer.',
    'ok.step2': 'Préparation et expédition sous 24h ouvrées.',
    'ok.step3': 'Livraison en 24–48h, paiement au livreur.',
    'ok.wa': 'Suivre sur WhatsApp',
    'ok.shop': 'Retour à la boutique',
    'ok.print': 'Imprimer le reçu',
    '404.title': 'Page introuvable',
    '404.sub': 'Cette adresse n’existe pas ou le produit a été retiré.',
    '404.cta': 'Retour à l’accueil',
    'crumb.home': 'Accueil',
    'status.nouvelle': 'Nouvelle',
    'status.confirmee': 'Confirmée',
    'status.expediee': 'Expédiée',
    'status.livree': 'Livrée',
    'status.annulee': 'Annulée',
    'footer.note': 'Boutique de démonstration',
    'common.close': 'Fermer',
    'common.back': 'Retour',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.shop': 'المتجر',
    'nav.gaming': 'الألعاب',
    'nav.deals': 'العروض',
    'nav.contact': 'اتصل بنا',
    'nav.all': 'كل الفئات',
    'search.ph': 'ابحث عن منتج…',
    'search.btn': 'بحث',
    'lang.other': 'Français',
    'cart': 'السلة',
    'cart.short': 'السلة',
    'account': 'حسابي',
    'announce.free': 'التوصيل مجاني ابتداءً من 500 د.ت · الدفع عند الاستلام',
    'hero.eyebrow': 'صوت وهواتف · أريانة',
    'hero.title': 'صوت وهواتف، بسعر عادل.',
    'hero.sub':
      '40 هاتفا ومنتجا صوتيا مختارا من السوق التونسية، بصور حقيقية وأسعار إرشادية وتفاصيل بالفرنسية والعربية.',
    'hero.cta1': 'تسوّق الآن',
    'hero.cta2': 'شاهد الهواتف',
    'hero.stat1': 'مرجعا في انتظار التأكيد',
    'hero.stat2': 'توصيل 24–48 ساعة',
    'hero.stat3': 'ضمان المتجر',
    'trust.delivery': 'توصيل 24–48 ساعة',
    'trust.delivery.sub': 'كل الولايات',
    'trust.payment': 'الدفع عند الاستلام',
    'trust.payment.sub': 'تدفع عند التوصيل',
    'trust.warranty': 'ضمان وخدمة بعد البيع',
    'trust.warranty.sub': 'ورشة في أريانة',
    'trust.support': 'استشارة قبل الشراء',
    'trust.support.sub': 'هاتفيا أو على واتساب',
    'cat.title': 'الفئات',
    'cat.sub': 'اعثر على ما تحتاجه',
    'cat.count': 'منتج',
    'best.title': 'اختيارات من الكتالوج',
    'best.sub': 'منتج مختار من كل فئة',
    'deals.title': 'العروض الجارية',
    'deals.sub': 'كمية محدودة، الأسعار بالدينار',
    'deals.all': 'كل العروض',
    'why.title': 'لماذا هذا المتجر',
    'why.1': 'منتجات موثقة',
    'why.1.sub': 'كل بطاقة تعتمد مواصفات تم التحقق منها لدى مصادر تونسية نشطة.',
    'why.2': 'وصف أصلي بالفرنسية والعربية',
    'why.2.sub': 'كُتبت النصوص خصيصا للمتجر بالفرنسية والعربية دون نسخ أوصاف المتاجر الأخرى.',
    'why.3': 'تأكيد قبل البيع',
    'why.3.sub': 'على الحريف تأكيد الأسعار والكميات وشروط الضمان قبل تفعيل الطلبات.',
    'promo.eyebrow': 'عرض الافتتاح',
    'promo.title': 'توصيل مجاني ابتداءً من 500 د.ت',
    'promo.sub': 'على كل التشكيلة وفي كل تونس. الدفع عند الاستلام.',
    'promo.cta': 'استفد الآن',
    'brands.title': 'الماركات في الكتالوج',
    'news.title': 'أفضل العروض، مرة في الأسبوع',
    'news.sub': 'وصلات جديدة وتخفيضات. دون إزعاج.',
    'news.ph': 'email@exemple.tn',
    'news.cta': 'أشترك',
    'news.ok': 'شكرا! تم تسجيلك.',
    'store.title': 'المتجر',
    'store.hours': 'الإثنين–السبت · من 9:00 إلى 19:00',
    'store.dir': 'الاتجاهات',
    'store.call': 'اتصل',
    'store.wa': 'واتساب',
    'f.shop': 'المتجر',
    'f.help': 'مساعدة',
    'f.about': 'من نحن',
    'f.delivery': 'التوصيل والإرجاع',
    'f.warranty': 'الضمان',
    'f.contact': 'اتصل بنا',
    'f.legal': 'معلومات قانونية',
    'f.pay': 'طرق الدفع',
    'f.pay.cod': 'عند الاستلام',
    'f.pay.bank': 'تحويل / صك',
    'f.pay.card': 'بطاقة بنكية (قريبا)',
    'f.rights': 'كل الحقوق محفوظة.',
    'f.built': 'الموقع من تصميم Vetrine+',
    'sort.label': 'ترتيب حسب',
    'sort.new': 'الأحدث',
    'sort.price_asc': 'السعر تصاعديا',
    'sort.price_desc': 'السعر تنازليا',
    'sort.best': 'الأكثر مبيعا',
    'filters': 'الفرز',
    'filters.cat': 'الفئة',
    'filters.brand': 'الماركة',
    'filters.price': 'السعر',
    'filters.stock': 'المتوفر فقط',
    'filters.reset': 'إعادة تعيين',
    'filters.apply': 'تطبيق',
    'filters.all': 'الكل',
    'results': 'منتج',
    'results.empty': 'لا يوجد منتج يطابق بحثك.',
    'results.empty.cta': 'تصفّح كل التشكيلة',
    'p.add': 'أضف إلى السلة',
    'p.buy': 'اشتر الآن',
    'p.stock': 'متوفر',
    'p.low': 'آخر الكميات',
    'p.out': 'نفدت الكمية',
    'p.qty': 'الكمية',
    'p.sku': 'المرجع',
    'p.warranty': 'الضمان',
    'p.warranty.m': 'شهر',
    'p.condition': 'الحالة',
    'p.new': 'جديد',
    'p.refurb': 'مجدّد',
    'p.specs': 'المواصفات',
    'p.desc': 'الوصف',
    'p.delivery': 'توصيل 24–48 ساعة',
    'p.delivery.sub': 'في كل تونس، 7–8 د.ت',
    'p.pay': 'الدفع عند الاستلام',
    'p.pay.sub': 'تدفع لعامل التوصيل',
    'p.warranty.box': 'ضمان المتجر',
    'p.warranty.box.sub': 'خدمة في أريانة',
    'p.related': 'يُشترى معه عادة',
    'p.brand': 'الماركة',
    'p.ref': 'المرجع',
    'p.promo': 'تخفيض',
    'p.share': 'شارك',
    'cart.title': 'سلتك',
    'cart.empty': 'سلتك فارغة.',
    'cart.empty.cta': 'اكتشف المتجر',
    'cart.product': 'المنتج',
    'cart.price': 'السعر',
    'cart.qty': 'الكمية',
    'cart.total': 'المجموع',
    'cart.remove': 'حذف',
    'cart.update': 'تحديث',
    'cart.summary': 'ملخص',
    'cart.subtotal': 'المجموع الفرعي',
    'cart.shipping': 'التوصيل',
    'cart.free': 'مجاني',
    'cart.free.note': 'توصيل مجاني ابتداءً من 500 د.ت',
    'cart.grand': 'يُحسب في الخطوة الموالية',
    'cart.checkout': 'إتمام الطلب',
    'cart.continue': 'متابعة التسوق',
    'cart.clear': 'إفراغ السلة',
    'co.title': 'إتمام الطلب',
    'co.step': 'البيانات والتوصيل وإرسال الطلب على واتساب',
    'co.contact': 'بياناتك',
    'co.name': 'الاسم واللقب',
    'co.phone': 'الهاتف',
    'co.gov': 'الولاية',
    'co.city': 'المدينة / المنطقة',
    'co.addr': 'العنوان الكامل',
    'co.note': 'ملاحظة (اختياري)',
    'co.note.ph': 'الطابق، علامة مميزة، وقت التوصيل…',
    'co.pay': 'الدفع',
    'co.cod': 'الدفع عند الاستلام',
    'co.cod.sub': 'تدفع نقدا لعامل التوصيل. دون مصاريف إضافية.',
    'co.place': 'تأكيد الطلب على واتساب',
    'co.terms': 'سيفتح واتساب مع تفاصيل طلبك. اضغط على إرسال لتبعث الطلب إلى المتجر.',
    'co.summary': 'طلبك',
    'co.err': 'يرجى تصحيح الحقول المشار إليها.',
    'co.required': 'حقل إجباري',
    'co.phone.err': 'رقم تونسي غير صحيح (8 أرقام).',
    'ok.eyebrow': 'تم تسجيل الطلب',
    'ok.title': 'شكرا، تم تأكيد طلبك!',
    'ok.sub': 'سنتصل بك للتأكيد قبل الإرسال.',
    'ok.ref': 'رقم الطلب',
    'ok.next': 'ماذا بعد؟',
    'ok.step1': 'سنتصل بك على الرقم المذكور للتأكيد.',
    'ok.step2': 'التحضير والإرسال في 24 ساعة عمل.',
    'ok.step3': 'التوصيل في 24–48 ساعة، الدفع عند الاستلام.',
    'ok.wa': 'المتابعة على واتساب',
    'ok.shop': 'العودة إلى المتجر',
    'ok.print': 'طباعة الوصل',
    '404.title': 'الصفحة غير موجودة',
    '404.sub': 'هذا العنوان غير متوفر أو تم حذف المنتج.',
    '404.cta': 'العودة للرئيسية',
    'crumb.home': 'الرئيسية',
    'status.nouvelle': 'جديد',
    'status.confirmee': 'مؤكَّد',
    'status.expediee': 'تم الإرسال',
    'status.livree': 'تم التسليم',
    'status.annulee': 'ملغى',
    'footer.note': 'متجر تجريبي',
    'common.close': 'إغلاق',
    'common.back': 'رجوع',
  },
};

const t = (lang, key) => (T[lang] && T[lang][key]) || T.fr[key] || key;

/* ------------------------------------------------------------ governorates */
const GOV = [
  'Ariana', 'Tunis', 'Ben Arous', 'Manouba',
  'Nabeul', 'Bizerte', 'Sousse', 'Monastir',
  'Mahdia', 'Sfax', 'Kairouan', 'Kasserine',
  'Sidi Bouzid', 'Gabès', 'Médenine', 'Tataouine',
  'Gafsa', 'Tozeur', 'Kébili', 'Jendouba',
  'Béja', 'Siliana', 'Le Kef', 'Zaghouan',
];
const GRAND_TUNIS = new Set(['Ariana', 'Tunis', 'Ben Arous', 'Manouba']);

const GOV_AR = {
  Ariana: 'أريانة', Tunis: 'تونس', 'Ben Arous': 'بن عروس', Manouba: 'منوبة',
  Nabeul: 'نابل', Bizerte: 'بنزرت', Sousse: 'سوسة', Monastir: 'المنستير',
  Mahdia: 'المهدية', Sfax: 'صفاقس', Kairouan: 'القيروان', Kasserine: 'القصرين',
  'Sidi Bouzid': 'سيدي بوزيد', 'Gabès': 'قابس', 'Médenine': 'مدنين',
  Tataouine: 'تطاوين', Gafsa: 'قفصة', Tozeur: 'توزر', 'Kébili': 'قبلي',
  Jendouba: 'جندوبة', 'Béja': 'باجة', Siliana: 'سليانة', 'Le Kef': 'الكاف',
  Zaghouan: 'زغوان',
};

const STATUSES = [
  { key: 'nouvelle', color: '#2563EB', bg: '#EFF4FF' },
  { key: 'confirmee', color: '#7C3AED', bg: '#F5F0FF' },
  { key: 'expediee', color: '#C2750B', bg: '#FFF7E6' },
  { key: 'livree', color: '#0E9F6E', bg: '#E9FBF3' },
  { key: 'annulee', color: '#E11D48', bg: '#FFF0F3' },
];

function shippingFor(subtotal, gov, s) {
  const free = Number(s.free_ship) || 500;
  if (subtotal >= free) return 0;
  const fee = GRAND_TUNIS.has(gov) ? Number(s.ship_tunis) : Number(s.ship_other);
  return Number.isFinite(fee) ? fee : 8;
}

/* ---------------------------------------------------------------- CSV utils */
function parseCSV(text) {
  const lines = String(text).replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const delim = [',', ';', '\t']
    .map((d) => [d, lines[0].split(d).length])
    .sort((a, b) => b[1] - a[1])[0][0];
  const split = (line) => {
    const out = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
      } else if (ch === delim && !q) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };
  const head = split(lines[0]).map((h) => h.toLowerCase().trim());
  return lines.slice(1).map((l) => {
    const cols = split(l);
    const o = {};
    head.forEach((h, i) => (o[h] = cols[i] ?? ''));
    return o;
  });
}

/* ------------------------------------------------------------- product art */
const SHAPES = {
  laptop: `
    <g transform="translate(0 6)">
      <rect x="118" y="96" width="244" height="150" rx="9" fill="#0F172A"/>
      <rect x="128" y="106" width="224" height="130" rx="5" fill="url(#screen)"/>
      <circle cx="240" cy="218" r="3" fill="#94A3B8"/>
      <path d="M96 250h288l22 26H74z" fill="#1E293B"/>
      <path d="M74 276h332l-8 8H82z" fill="#334155"/>
      <path d="M120 252h240l10 14H110z" fill="#475569" opacity=".55"/>
    </g>`,
  tower: `
    <g transform="translate(10 0)">
      <rect x="150" y="58" width="160" height="248" rx="14" fill="#0F172A"/>
      <rect x="166" y="74" width="128" height="216" rx="8" fill="#111C33"/>
      <circle cx="230" cy="112" r="34" fill="none" stroke="url(#accent)" stroke-width="5"/>
      <circle cx="230" cy="112" r="10" fill="url(#accent)"/>
      <circle cx="230" cy="200" r="20" fill="none" stroke="#334155" stroke-width="4"/>
      <rect x="196" y="246" width="68" height="8" rx="4" fill="#334155"/>
      <rect x="196" y="262" width="44" height="6" rx="3" fill="#1E293B"/>
      <circle cx="284" cy="88" r="4" fill="#22C55E"/>
    </g>`,
  phone: `
    <g transform="translate(0 -6)">
      <rect x="176" y="34" width="128" height="284" rx="26" fill="#0F172A"/>
      <rect x="186" y="46" width="108" height="260" rx="19" fill="url(#screen)"/>
      <rect x="220" y="54" width="40" height="7" rx="3.5" fill="#0F172A"/>
      <circle cx="240" cy="300" r="3" fill="#475569"/>
      <rect x="304" y="96" width="7" height="48" rx="3" fill="#1E293B"/>
      <path d="M200 260c26-42 54-30 80-70v96h-80z" fill="#0F172A" opacity=".08"/>
    </g>`,
  monitor: `
    <g transform="translate(0 -8)">
      <rect x="86" y="62" width="308" height="184" rx="10" fill="#0F172A"/>
      <rect x="96" y="72" width="288" height="164" rx="5" fill="url(#screen)"/>
      <path d="M216 246h48l10 44h-68z" fill="#1E293B"/>
      <rect x="176" y="288" width="128" height="10" rx="5" fill="#334155"/>
    </g>`,
  gpu: `
    <g transform="translate(0 14) rotate(-4 240 190)">
      <rect x="72" y="120" width="336" height="132" rx="10" fill="#0F172A"/>
      <circle cx="156" cy="186" r="42" fill="none" stroke="url(#accent)" stroke-width="6"/>
      <circle cx="156" cy="186" r="16" fill="#1E293B"/>
      <circle cx="300" cy="186" r="42" fill="none" stroke="url(#accent)" stroke-width="6"/>
      <circle cx="300" cy="186" r="16" fill="#1E293B"/>
      <rect x="72" y="112" width="336" height="14" rx="6" fill="#334155"/>
      <rect x="330" y="240" width="60" height="18" rx="3" fill="#1E293B"/>
    </g>`,
  keyboard: `
    <g transform="translate(0 22) rotate(-3 240 190)">
      <rect x="62" y="132" width="356" height="132" rx="12" fill="#0F172A"/>
      <rect x="74" y="144" width="332" height="108" rx="7" fill="#111C33"/>
      ${Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 13 }, (_, c) =>
          `<rect x="${82 + c * 24.5}" y="${152 + r * 19}" width="18" height="14" rx="3" fill="${(r * 13 + c) % 9 === 0 ? 'url(#accent)' : '#334155'}" opacity="${(r * 13 + c) % 9 === 0 ? '1' : '.85'}"/>`
        ).join('')
      ).join('')}
    </g>`,
  printer: `
    <g transform="translate(0 4)">
      <rect x="132" y="96" width="216" height="34" rx="5" fill="#CBD5E1"/>
      <rect x="108" y="126" width="264" height="118" rx="10" fill="#0F172A"/>
      <rect x="132" y="152" width="86" height="10" rx="5" fill="#334155"/>
      <rect x="132" y="170" width="52" height="8" rx="4" fill="#1E293B"/>
      <rect x="150" y="206" width="180" height="76" rx="6" fill="#F8FAFC"/>
      <rect x="166" y="222" width="148" height="6" rx="3" fill="#CBD5E1"/>
      <rect x="166" y="238" width="120" height="6" rx="3" fill="#E2E8F0"/>
      <circle cx="332" cy="176" r="6" fill="#22C55E"/>
    </g>`,
  router: `
    <g transform="translate(0 10)">
      <path d="M150 120l-34-72M330 120l34-72" stroke="#1E293B" stroke-width="9" stroke-linecap="round"/>
      <rect x="112" y="140" width="256" height="96" rx="14" fill="#0F172A"/>
      <circle cx="152" cy="188" r="7" fill="#22C55E"/>
      <circle cx="180" cy="188" r="7" fill="#22C55E" opacity=".7"/>
      <circle cx="208" cy="188" r="7" fill="#334155"/>
      <circle cx="236" cy="188" r="7" fill="#334155"/>
      <rect x="284" y="176" width="56" height="24" rx="6" fill="#1E293B"/>
    </g>`,
  headset: `
    <g transform="translate(0 6)">
      <path d="M150 200v-40a90 90 0 01180 0v40" fill="none" stroke="#0F172A" stroke-width="22" stroke-linecap="round"/>
      <rect x="122" y="186" width="58" height="96" rx="24" fill="#0F172A"/>
      <rect x="300" y="186" width="58" height="96" rx="24" fill="#0F172A"/>
      <circle cx="151" cy="234" r="12" fill="url(#accent)" opacity=".85"/>
      <circle cx="329" cy="234" r="12" fill="url(#accent)" opacity=".85"/>
    </g>`,
  earbuds: `
    <g transform="translate(0 4)">
      <path d="M150 132a30 30 0 1160 0v44a30 30 0 01-60 0z" fill="#0F172A"/>
      <rect x="168" y="170" width="24" height="78" rx="12" fill="#0F172A"/>
      <circle cx="180" cy="134" r="10" fill="url(#accent)" opacity=".85"/>
      <path d="M270 132a30 30 0 1160 0v44a30 30 0 01-60 0z" fill="#0F172A"/>
      <rect x="288" y="170" width="24" height="78" rx="12" fill="#0F172A"/>
      <circle cx="300" cy="134" r="10" fill="url(#accent)" opacity=".85"/>
      <ellipse cx="240" cy="268" rx="118" ry="18" fill="#0F172A" opacity=".1"/>
    </g>`,
  speaker: `
    <g transform="translate(0 4)">
      <rect x="150" y="54" width="180" height="256" rx="44" fill="#0F172A"/>
      <rect x="166" y="70" width="148" height="224" rx="34" fill="#111C33"/>
      <circle cx="240" cy="142" r="44" fill="none" stroke="url(#accent)" stroke-width="7"/>
      <circle cx="240" cy="142" r="14" fill="#1E293B"/>
      <circle cx="240" cy="240" r="30" fill="none" stroke="#334155" stroke-width="6"/>
      <circle cx="240" cy="240" r="10" fill="#334155"/>
      <rect x="206" y="286" width="68" height="7" rx="3.5" fill="#334155"/>
    </g>`,
  watch: `
    <g transform="translate(0 2)">
      <rect x="196" y="28" width="88" height="70" rx="20" fill="#1E293B"/>
      <rect x="196" y="262" width="88" height="70" rx="20" fill="#1E293B"/>
      <rect x="180" y="86" width="120" height="188" rx="34" fill="#0F172A"/>
      <rect x="194" y="100" width="92" height="160" rx="24" fill="url(#screen)"/>
      <circle cx="308" cy="162" r="7" fill="#334155"/>
      <path d="M216 182h48M216 204h30" stroke="#F8FAFC" stroke-width="7" stroke-linecap="round" opacity=".85"/>
    </g>`,
  charger: `
    <g transform="translate(0 6)">
      <rect x="160" y="70" width="156" height="160" rx="30" fill="#0F172A"/>
      <rect x="186" y="96" width="104" height="48" rx="10" fill="#1E293B"/>
      <circle cx="238" cy="176" r="12" fill="url(#accent)"/>
      <rect x="200" y="230" width="28" height="36" rx="6" fill="#334155"/>
      <rect x="248" y="230" width="28" height="36" rx="6" fill="#334155"/>
      <path d="M316 150c42 6 42 72 0 78" stroke="#334155" stroke-width="9" fill="none" stroke-linecap="round"/>
    </g>`,
  powerbank: `
    <g transform="translate(0 6)">
      <rect x="138" y="84" width="204" height="192" rx="28" fill="#0F172A"/>
      <rect x="154" y="100" width="172" height="160" rx="20" fill="#111C33"/>
      <circle cx="196" cy="140" r="7" fill="#22C55E"/>
      <circle cx="222" cy="140" r="7" fill="#22C55E"/>
      <circle cx="248" cy="140" r="7" fill="#22C55E" opacity=".4"/>
      <circle cx="274" cy="140" r="7" fill="#334155"/>
      <rect x="184" y="200" width="42" height="18" rx="4" fill="#334155"/>
      <rect x="240" y="200" width="26" height="18" rx="4" fill="#334155"/>
    </g>`,
  box: `
    <g transform="translate(0 8) rotate(-4 240 190)">
      <path d="M136 132l104-50 104 50-104 50z" fill="#1E293B"/>
      <path d="M136 132v112l104 50v-112z" fill="#0F172A"/>
      <path d="M344 132v112l-104 50v-112z" fill="#16233B"/>
      <path d="M240 182v80" stroke="#334155" stroke-width="4"/>
      <circle cx="240" cy="152" r="16" fill="url(#accent)" opacity=".9"/>
    </g>`,
};

const CAT_SHAPE = {
  'casques-bluetooth': 'headset',
  ecouteurs: 'earbuds',
  enceintes: 'speaker',
  smartphones: 'phone',
  montres: 'watch',
  chargeurs: 'charger',
  powerbanks: 'powerbank',
  accessoires: 'box',
};

function productArt(p) {
  const accent = p.accent || '#2563EB';
  const v = Number(p.variant) || 1;
  const shape = SHAPES[CAT_SHAPE[p.cat_slug] || 'box'];
  const label = p.brand || 'Demo Store';
  const g1 = v === 2 ? 'x1="1" y1="0" x2="0" y2="1"' : v === 3 ? 'x1="0" y1="1" x2="1" y2="0"' : 'x1="0" y1="0" x2="1" y2="1"';
  const tint = v === 3 ? '22' : v === 2 ? '18' : '14';
  const art = v === 1 ? shape
    : v === 2 ? `<g transform="translate(-14 -8) scale(1.07) rotate(-2 240 190)">${shape}</g>`
    : `<g transform="translate(16 8) scale(0.93) rotate(2.5 240 190)">${shape}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" role="img" aria-label="${attr(p.name_fr)}">
  <defs>
    <linearGradient id="bg" ${g1}>
      <stop offset="0" stop-color="#F8FAFC"/><stop offset="1" stop-color="${accent}${tint}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${accent}99"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="#0F172A"/>
    </linearGradient>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0v24" fill="none" stroke="${accent}" stroke-opacity=".08" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="480" height="360" fill="url(#bg)"/>
  <rect width="480" height="360" fill="url(#grid)"/>
  <circle cx="${v === 3 ? 300 : 392}" cy="66" r="${v === 2 ? 140 : 120}" fill="${accent}" opacity=".07"/>
  <circle cx="72" cy="318" r="${v === 3 ? 110 : 90}" fill="${accent}" opacity=".05"/>
  ${art}
  <text x="30" y="330" font-family="ui-monospace,Menlo,monospace" font-size="13" letter-spacing="2.5" fill="#0F172A" opacity=".55">${e(String(label).toUpperCase())}</text>
  <text x="450" y="330" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-size="12" letter-spacing="1" fill="${accent}" opacity=".8">${e(p.sku || '')}</text>
</svg>`;
}

const catShape = (slug) => SHAPES[CAT_SHAPE[slug] || 'box'];

module.exports = {
  e, attr, money, dateFmt, slugify, TND_CODES, t, T,
  GOV, GOV_AR, GRAND_TUNIS, STATUSES, shippingFor, parseCSV, productArt, catShape,
};
