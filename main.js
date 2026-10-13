(function () {
  var C = window.OT_CONFIG || {};
  var linkReady = C.stripePaymentLink && C.stripePaymentLink.indexOf('REPLACE') === -1;

  // Buy buttons -> Stripe Payment Link (until it's set, they scroll to pricing)
  document.querySelectorAll('[data-buy]').forEach(function (a) {
    if (linkReady) { a.href = C.stripePaymentLink; a.rel = 'noopener'; }
  });
  document.querySelectorAll('[data-discord]').forEach(function (a) { if (C.discordUrl) a.href = C.discordUrl; });
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  // Header border on scroll + mobile menu
  var top = document.getElementById('top');
  if (top) {
    var onScroll = function () { top.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var mb = document.getElementById('menuBtn');
    if (mb) mb.addEventListener('click', function () {
      var open = top.classList.toggle('open'); mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('#nav a').forEach(function (a) { a.addEventListener('click', function () { top.classList.remove('open'); if (mb) mb.setAttribute('aria-expanded', 'false'); }); });
  }

  // Trailer: load only when the visitor presses play
  var v = document.getElementById('trailerVideo'), pb = document.getElementById('playBtn');
  if (v && pb) pb.addEventListener('click', function () {
    v.controls = true; pb.remove(); v.play();
  });

  // Hero frame-time graph: a stuttery line that gets smoothed out, left to right
  var cv = document.getElementById('ftCanvas'), out = document.getElementById('ftValue');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = 160, rough = [], seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  for (var i = 0; i < N; i++) {
    var base = 16.7 + (rnd() - 0.5) * 7;                // jittery frames around 60 fps
    if (rnd() < 0.09) base += 14 + rnd() * 26;          // stutter spikes
    rough.push(base);
  }
  var W, H, dpr;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); window.addEventListener('resize', function () { size(); draw(lastP, lastT); });
  function yOf(ms) { var top = 46, bot = H - 6; return bot - (Math.min(ms, 50) / 50) * (bot - top); }
  var lastP = 0, lastT = 0;
  function draw(p, t) {
    lastP = p; lastT = t;
    ctx.clearRect(0, 0, W, H);
    // grid: 60 fps and 144 fps reference lines
    ctx.lineWidth = 1; ctx.font = '13px Archivo, sans-serif'; ctx.fillStyle = '#5c6879';
    [[16.7, '16.7 ms (60 fps)'], [6.9, '6.9 ms (144 fps)']].forEach(function (g) {
      var yy = Math.round(yOf(g[0])) + 0.5;
      ctx.strokeStyle = 'rgba(139,151,168,.16)'; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillText(g[1], W - ctx.measureText(g[1]).width, g[0] < 10 ? yy + 18 : yy - 6);
    });
    var cut = p * (N - 1 + 8); // frames left of the cut are smoothed (overshoots so the last frames finish smooth)
    function val(i) {
      var smooth = 6.9 + Math.sin(i * 0.55 + t * 3) * 0.35;
      var k = Math.max(0, Math.min(1, (cut - i) / 6));    // soft transition at the cut
      return rough[i] * (1 - k) + smooth * k;
    }
    function path(from, to, color, width, glow) {
      if (to <= from) return;
      ctx.beginPath();
      for (var i = from; i <= to; i++) {
        var x = (i / (N - 1)) * W, yy = yOf(val(i));
        if (i === from) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
      ctx.shadowColor = glow; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
    }
    var c = Math.min(N - 1, Math.floor(cut));
    path(0, Math.min(N - 1, c + 1), '#3ed598', 2.5, 'rgba(62,213,152,.55)');
    path(Math.max(0, c), N - 1, '#f0506e', 2, 'rgba(240,80,110,.35)');
    if (p > 0 && p < 1 && cut <= N - 1) {
      var x = (cut / (N - 1)) * W;
      ctx.strokeStyle = 'rgba(62,213,152,.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, H); ctx.stroke();
    }
    if (out) {
      var ci = Math.min(N - 1, Math.max(0, Math.round(cut))); var cur = val(ci);
      var show = p >= 1 ? 6.9 : Math.max.apply(null, rough.slice(ci, ci + 12).concat([cur]));
      out.textContent = show.toFixed(1) + ' ms';
      out.style.color = p >= 1 ? '#3ed598' : (show > 25 ? '#f0506e' : '#e9eef5');
    }
  }
  if (reduce) { draw(1, 0); return; }
  var start = null, visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(cv);
  function tick(now) {
    if (start === null) start = now;
    var s = (now - start) / 1000;
    // hold the stutter for 0.9s, sweep the fix across over 2.6s, then idle gently
    var p = Math.max(0, Math.min(1, (s - 0.9) / 2.6));
    p = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    if (visible || p < 1) draw(p, s);
    requestAnimationFrame(tick);
  }
  draw(0, 0); requestAnimationFrame(tick);
})();
