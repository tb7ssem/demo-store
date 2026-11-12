'use strict';
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const LANG = document.documentElement.lang || 'fr';
  const MSG = {
    fr: { added: 'Ajouté au panier', error: 'Impossible d’ajouter ce produit' },
    ar: { added: 'تمت الإضافة إلى السلة', error: 'تعذّر إضافة هذا المنتج' },
  }[LANG.startsWith('ar') ? 'ar' : 'fr'];

  /* ------------------------------------------------------------------ toast */
  let toastTimer;
  function toast(msg) {
    const el = $('[data-toast]');
    if (!el) return;
    el.innerHTML = `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg><span></span>`;
    el.querySelector('span').textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  if (new URLSearchParams(location.search).get('news') === '1') {
    toast(LANG.startsWith('ar') ? 'شكرا على الاشتراك!' : 'Merci pour votre inscription !');
    history.replaceState({}, '', location.pathname);
  }

  /* ----------------------------------------------------------------- drawer */
  const drawer = $('[data-drawer]');
  const openDrawer = () => { if (drawer) { drawer.hidden = false; document.body.style.overflow = 'hidden'; } };
  const closeDrawer = () => { if (drawer) { drawer.hidden = true; document.body.style.overflow = ''; } };
  $$('[data-drawer-open]').forEach((b) => b.addEventListener('click', openDrawer));
  $$('[data-drawer-close]').forEach((b) => b.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  /* ---------------------------------------------------------------- filters */
  const filters = $('[data-filters]');
  $$('[data-filters-open]').forEach((b) => b.addEventListener('click', () => {
    if (filters) { filters.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  }));
  $$('[data-filters-close]').forEach((b) => b.addEventListener('click', () => {
    if (filters) { filters.classList.remove('is-open'); document.body.style.overflow = ''; }
  }));

  /* ------------------------------------------------------------- qty inputs */
  $$('[data-qty]').forEach((box) => {
    const input = $('[data-qty-input]', box) || $('input', box);
    if (!input) return;
    const step = (d) => {
      const min = Number(input.min || 1);
      const max = Number(input.max || 999);
      const next = Math.min(max, Math.max(min, (Number(input.value) || 1) + d));
      input.value = next;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const up = $('[data-qty-up]', box);
    const down = $('[data-qty-down]', box);
    if (up) up.addEventListener('click', () => step(1));
    if (down) down.addEventListener('click', () => step(-1));
  });

  /* ------------------------------------------------------------ autosubmit */
  $$('[data-autosubmit]').forEach((el) => el.addEventListener('change', () => el.form && el.form.submit()));
  $$('[data-autosubmit-form]').forEach((form) => {
    $$('input[type="number"]', form).forEach((i) => i.addEventListener('change', () => form.submit()));
  });

  /* ------------------------------------------------------------------- confirm */
  $$('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  /* ---------------------------------------------------------------- add cart */
  function setCount(n) {
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = n;
      el.classList.toggle('is-empty', !n);
      if (!el.classList.contains('is-empty')) el.removeAttribute('hidden');
    });
  }

  $$('form[data-add]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      if (e.submitter && e.submitter.name === 'buynow') return;
      e.preventDefault();
      const btn = e.submitter || form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-PB': '1' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        const data = await res.json();
        if (!data.ok) throw new Error('failed');
        setCount(data.count);
        toast(MSG.added);
      } catch {
        toast(MSG.error);
        form.submit();
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });

  /* --------------------------------------------------------------- csv file */
  const csvFile = $('[data-csv-file]');
  if (csvFile) {
    csvFile.addEventListener('change', async () => {
      const file = csvFile.files && csvFile.files[0];
      if (!file) return;
      const ta = document.querySelector('.importer textarea[name="csv"]');
      if (!ta) return;
      ta.value = (await file.text()).replace(/^\uFEFF/, '');
      const label = $('[data-csv-name]');
      if (label) label.textContent = `${file.name} · ${ta.value.split('\n').length - 1} lignes`;
    });
  }

  /* ------------------------------------------------------------- pdp gallery */
  $$('[data-thumb]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = $('[data-main-img]');
      if (!img) return;
      img.src = btn.getAttribute('data-thumb');
      $$('.pdp__thumb').forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
    });
  });

  /* ----------------------------------------------------------- checkout ship */
  const CO = window.PB_CO;
  if (CO && document.querySelector('[data-gov]')) {
    const fmt = (v) => (CO.lang === 'ar' ? `${v} د.ت` : `${v} DT`);
    const num = (v) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    const moneylike = (v) => (CO.lang === 'ar' ? `${num(v)} د.ت` : `${num(v)} DT`);
    const update = () => {
      const gov = document.querySelector('[data-gov]').value;
      const free = CO.subtotal >= CO.free;
      const fee = free ? 0 : (CO.fees[gov] ?? 8);
      const shipEl = document.querySelector('[data-ship]');
      const totalEl = document.querySelector('[data-total]');
      if (shipEl) shipEl.textContent = fee === 0 ? (CO.lang === 'ar' ? 'مجاني' : 'Offerte') : moneylike(fee);
      if (totalEl) totalEl.textContent = moneylike(CO.subtotal + fee);
      const btn = document.querySelector('.co__submit');
      if (btn) btn.innerHTML = btn.innerHTML.replace(/(·).*$/, `· ${moneylike(CO.subtotal + fee)}`);
    };
    document.querySelector('[data-gov]').addEventListener('change', update);
  }
})();
