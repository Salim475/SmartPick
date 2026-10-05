/* ============================================================
   SMARTPICK CAR ORGANIZATION — SCRIPT
   Config · WhatsApp orders · Tracking · Menu · Reveal
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. CONFIG — the only block you need to edit
     ============================================================ */
  const CONFIG = {

    /* WhatsApp number — international format.
       0803 123 4567  →  "2348031234567"
       No +, no spaces, no leading zero.                        */
    whatsappNumber: '2348086033840',

    /* Tracking IDs — leave '' until you have them */
    metaPixelId:   '',
    tiktokPixelId: '',
    ga4Id:         '',

    /* Behaviour */
    debug: false,
    showStickyAfter: 500
  };
  /* ============================================================ */


  /* ============================================================
     2. HELPERS
     ============================================================ */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const log = (...args) => {
    if (CONFIG.debug) console.log('%c[SmartPick]', 'color:#B84E1E;font-weight:bold', ...args);
  };


  /* ============================================================
     3. UTM CAPTURE
     ============================================================ */
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function getUTMData() {
    const params = new URLSearchParams(window.location.search);
    const data = {};
    UTM_KEYS.forEach(key => {
      const value = params.get(key);
      if (value) data[key] = value;
    });

    if (Object.keys(data).length) {
      try { sessionStorage.setItem('smartpick_utm', JSON.stringify(data)); } catch (e) {}
      return data;
    }

    try {
      const stored = sessionStorage.getItem('smartpick_utm');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  const UTM = getUTMData();
  log('UTM data', UTM);


  /* ============================================================
     4. PIXEL LOADERS
     ============================================================ */
  function loadMetaPixel() {
    if (!CONFIG.metaPixelId) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', CONFIG.metaPixelId);
    window.fbq('track', 'PageView');
    log('Meta Pixel loaded');
  }

  function loadTikTokPixel() {
    if (!CONFIG.tiktokPixelId) return;
    /* eslint-disable */
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load(CONFIG.tiktokPixelId);
      ttq.page();
    }(window, document, 'ttq');
    /* eslint-enable */
    log('TikTok Pixel loaded');
  }

  function loadGA4() {
    if (!CONFIG.ga4Id) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4Id;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.ga4Id, { send_page_view: false });
    log('GA4 loaded');
  }


  /* ============================================================
     5. UNIFIED TRACKING
     ============================================================ */
  function track(eventName, params) {
    const payload = Object.assign({}, UTM, params || {});

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, payload));

    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, payload);
      const metaMap = {
        order_now_click: 'InitiateCheckout',
        whatsapp_click:  'Contact',
        product_view:    'ViewContent'
      };
      if (metaMap[eventName]) window.fbq('track', metaMap[eventName], payload);
    }

    if (window.ttq && typeof window.ttq.track === 'function') {
      const ttMap = {
        order_now_click: 'ClickButton',
        whatsapp_click:  'Contact',
        product_view:    'ViewContent'
      };
      window.ttq.track(ttMap[eventName] || eventName, payload);
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }

    log('track →', eventName, payload);
  }


  /* ============================================================
     6. WHATSAPP ORDER SYSTEM — one pre-filled message per product
        data-product on each button picks the message.
     ============================================================ */
  const PRODUCTS = {
    gap:      'Car Seat Gap Organizer / Filler',
    seatback: 'Sinofly Felt Car Seat Back Organizer',
    trunk:    'Car Trunk Storage Organiser'
  };

  function buildMessage(key) {
    if (PRODUCTS[key]) {
      return 'Hello SmartPick 👋\n\n' +
             'I want to order the ' + PRODUCTS[key] + '.\n\n' +
             'Please send me the order and delivery details.';
    }
    return 'Hello SmartPick 👋\n\nI have a question about your car organizers.';
  }

  function openWhatsApp(key, source) {
    track('whatsapp_click', { product: key || 'general', cta_location: source || 'unknown' });
    const url = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(buildMessage(key));
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url;
  }

  function initCTAs() {
    $$('.js-order').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const key = this.dataset.product || 'general';
        const where = this.dataset.cta || 'unknown';
        if (PRODUCTS[key]) track('order_now_click', { product: key, cta_location: where });
        openWhatsApp(key, where);
      });
    });
  }


  /* ============================================================
     7. PAGE VIEW + PRODUCT VIEW
     ============================================================ */
  track('page_view', { page_title: document.title, page_path: window.location.pathname });

  function initProductView() {
    const title = $('.pdp__title');
    if (!title) return;
    const key = Object.keys(PRODUCTS).find(k => $('[data-product="' + k + '"]'));
    track('product_view', { product: key || 'unknown' });
  }


  /* ============================================================
     8. MOBILE MENU
     ============================================================ */
  function initMenu() {
    const btn = $('#menuBtn'), nav = $('#nav');
    if (!btn || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    btn.addEventListener('click', () => {
      setOpen(!nav.classList.contains('is-open'));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open')) return;
      const withinNav = nav.contains(event.target) || btn.contains(event.target);
      if (!withinNav) setOpen(false);
    });
  }


  /* ============================================================
     9. STICKY BAR + HEADER SHADOW
     ============================================================ */
  function initStickyBar() {
    const bar = $('#stickyBar'), header = $('#header');
    let ticking = false;
    function update() {
      const y = window.scrollY, show = y > CONFIG.showStickyAfter;
      if (bar) {
        bar.classList.toggle('is-visible', show);
        bar.setAttribute('aria-hidden', show ? 'false' : 'true');
        document.body.classList.toggle('has-sticky-cta', show);
      }
      if (header) header.classList.toggle('is-scrolled', y > 8);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }


  /* ============================================================
     10. SCROLL REVEAL
     ============================================================ */
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => observer.observe(el));
  }


  /* ============================================================
     11. IMAGE FALLBACK + YEAR
     ============================================================ */
  function initImageFallback() {
    $$('img').forEach(img => {
      img.addEventListener('error', () => { img.classList.add('is-broken'); log('Image not found →', img.getAttribute('src')); });
      if (img.complete && img.naturalWidth === 0) img.classList.add('is-broken');
    });
  }

  function initYear() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  function initGallery() {
    const gallery = document.querySelector('.product-gallery');
    if (!gallery) return;

    const main = gallery.querySelector('[data-gallery-main]');
    const thumbs = gallery.querySelectorAll('.gallery-thumb');
    if (!main || !thumbs.length) return;

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const src = thumb.dataset.galleryTarget;
        if (!src || src === main.getAttribute('src')) return;

        main.style.opacity = '0.5';
        setTimeout(() => {
          main.setAttribute('src', src);
          main.setAttribute('alt', thumb.dataset.galleryAlt || main.getAttribute('alt') || 'Product image');
          main.style.opacity = '1';
        }, 120);

        thumbs.forEach(item => item.classList.toggle('is-active', item === thumb));
      });
    });
  }

  function initFaq() {
    document.querySelectorAll('.faq__item').forEach(item => {
      const wrapper = item.querySelector('.faq__body');
      if (!wrapper) return;
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        document.querySelectorAll('.faq__item').forEach(other => {
          if (other !== item) other.removeAttribute('open');
        });
      });
    });
  }


  /* ============================================================
     12. BOOT
     ============================================================ */
  function init() {
    loadMetaPixel(); loadTikTokPixel(); loadGA4();
    initCTAs(); initProductView(); initMenu(); initStickyBar();
    initReveal(); initImageFallback(); initYear(); initGallery(); initFaq();
    log('SmartPick ready ✓');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
