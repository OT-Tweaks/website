(function () {
  var C = window.OT_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // Run fn once when el first scrolls into view.
  function onView(el, fn, threshold) {
    if (!el) return;
    if (!hasIO) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: threshold || 0.35 });
    io.observe(el);
  }
  /* ---------- links, year ---------- */
  var linkReady = C.stripePaymentLink && C.stripePaymentLink.indexOf('REPLACE') === -1;
  $$('[data-buy]').forEach(function (a) { if (linkReady) { a.href = C.stripePaymentLink; a.rel = 'noopener'; } });
  $$('[data-discord]').forEach(function (a) { if (C.discordUrl) a.href = C.discordUrl; });
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- header: border, progress bar, active link, mobile menu ---------- */
  var top = $('#top'), prog = $('#progress');
  if (top) {
    var navLinks = $$('#nav a[href^="#"]');
    var secs = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var ticking = false;
    var onScroll = function () {
      ticking = false;
      var sy = window.scrollY;
      top.classList.toggle('scrolled', sy > 8);
      if (prog) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.width = (max > 0 ? Math.min(100, sy / max * 100) : 0) + '%';
      }
      var cur = -1;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = i; });
      navLinks.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    var mb = $('#menuBtn');
    if (mb) mb.addEventListener('click', function () {
      var open = top.classList.toggle('open'); mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { top.classList.remove('open'); if (mb) mb.setAttribute('aria-expanded', 'false'); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && top.classList.contains('open')) { top.classList.remove('open'); if (mb) { mb.setAttribute('aria-expanded', 'false'); mb.focus(); } } });
  }

  /* ---------- trailer: load only when the visitor presses play ---------- */
  var v = $('#trailerVideo'), pb = $('#playBtn');
  if (v && pb) pb.addEventListener('click', function () { v.controls = true; pb.remove(); v.play(); });

  /* ---------- cursor spotlight on cards ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- screenshots fade in as you scroll ---------- */
  if (!reduce && hasIO) {
    var rv = $$('.show, .g-item, .what li');
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    rv.forEach(function (el, i) {
      if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave as is
      el.classList.add('reveal');
      if (el.matches('.g-item, .what li')) el.style.transitionDelay = ((i % 4) * 80) + 'ms';
      rio.observe(el);
    });
  }

  /* ---------- lightbox for screenshots ---------- */
  (function lightbox() {
    var dlg = $('#lightbox'); if (!dlg || !dlg.showModal) return;
    var items = $$('[data-zoom]'), img = $('#lbImg'), cap = $('#lbCap'), cur = 0, opener = null;
    function caption(el) {
      var host = el.closest('.show');
      if (host) { var t = host.querySelector('.tag'), h = host.querySelector('h3'); return '<b>' + (t ? t.textContent + ' — ' : '') + '</b>' + (h ? h.textContent : ''); }
      var b = el.querySelector('figcaption b'), sp = el.querySelector('figcaption span');
      return (b ? '<b>' + b.textContent + '</b> — ' : '') + (sp ? sp.textContent : '');
    }
    function show(i) {
      cur = (i + items.length) % items.length;
      var src = items[cur].querySelector('img');
      img.src = src.currentSrc || src.src; img.alt = src.alt; cap.innerHTML = caption(items[cur]);
    }
    items.forEach(function (el, i) {
      el.tabIndex = 0; el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'View full size: ' + (el.querySelector('img').alt || 'screenshot'));
      var open = function () { opener = el; show(i); dlg.showModal(); document.body.style.overflow = 'hidden'; };
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    $('#lbClose').addEventListener('click', function () { dlg.close(); });
    $('#lbPrev').addEventListener('click', function () { show(cur - 1); });
    $('#lbNext').addEventListener('click', function () { show(cur + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    dlg.addEventListener('close', function () { document.body.style.overflow = ''; if (opener) opener.focus(); });
  })();

  /* ---------- support chat: AI types its answer ---------- */
  (function chat() {
    var root = $('#chat'); if (!root) return;
    var el = $('.typed', root), late = $('.msg.late', root);
    if (!el) return;
    var text = el.getAttribute('data-text') || '';
    if (reduce) { el.textContent = text; if (late) late.classList.add('show'); return; }
    onView(root, function () {
      var i = 0; el.classList.add('cursor');
      setTimeout(function tick() {
        i += 2; el.textContent = text.slice(0, i);
        if (i < text.length) setTimeout(tick, 18);
        else { el.classList.remove('cursor'); if (late) setTimeout(function () { late.classList.add('show'); }, 900); }
      }, 700);
    }, 0.5);
  })();

  /* ---------- FAQ: smooth open/close ---------- */
  $$('.faq details').forEach(function (d) {
    var sum = d.querySelector('summary'), body = d.querySelector('summary + div');
    if (!sum || !body || reduce || !body.animate) return;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.dataset.busy) return; d.dataset.busy = '1';
      if (!d.open) {
        d.open = true;
        var h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = function () { delete d.dataset.busy; };
      } else {
        var h2 = body.offsetHeight;
        body.animate([{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 200, easing: 'ease-in' }).onfinish = function () { d.open = false; delete d.dataset.busy; };
      }
    });
  });
})();
