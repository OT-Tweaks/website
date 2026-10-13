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
  // Track whether el is on screen (to pause animations that are off-screen).
  function watch(el, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }).observe(el);
  }
  function setupCanvas(cv) {
    var ctx = cv.getContext('2d'), o = { ctx: ctx };
    o.size = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      o.W = cv.clientWidth; o.H = cv.clientHeight;
      cv.width = Math.max(1, o.W * dpr); cv.height = Math.max(1, o.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    o.size();
    return o;
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

  /* ---------- stat counters ---------- */
  $$('[data-count]').forEach(function (el) {
    var to = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || '';
    var fmt = function (n) { return n.toFixed(dec) + suf; };
    el.textContent = fmt(to);
    // only count up if it's still below the fold (so it never sits at 0)
    if (reduce || el.getBoundingClientRect().top < window.innerHeight) return;
    el.textContent = fmt(0);
    onView(el, function () {
      var t0 = null, dur = 1300;
      (function step(now) {
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e);
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }, 0.6);
  });

  /* ---------- hero demo: Full Optimize ---------- */
  (function demo() {
    var win = $('#demoWin'); if (!win) return;
    var steps = $$('#demoSteps li'), tiles = $$('.ds b'), bar = $('#demoBar'), btn = $('#demoRun');
    var label = btn && btn.querySelector('span');
    var cv = $('#dgCanvas'), out = $('#dgVal'), G = cv && setupCanvas(cv);

    // frame-time data: jittery frames with spikes, deterministic
    var N = 120, rough = [], seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    for (var i = 0; i < N; i++) { var b = 11 + (rnd() - 0.5) * 6; if (rnd() < 0.1) b += 10 + rnd() * 20; rough.push(b); }
    var fix = 0, t = 0;   // fix: 0 = stock Windows, 1 = optimized
    function val(i) {
      var smooth = 6.9 + Math.sin(i * 0.5 + t * 2.4) * 0.3;
      return rough[i] * (1 - fix) + smooth * fix;
    }
    function draw() {
      if (!G) return;
      var c = G.ctx, W = G.W, H = G.H;
      c.clearRect(0, 0, W, H);
      var yOf = function (ms) { return H - 4 - Math.min(ms, 40) / 40 * (H - 10); };
      var ref = Math.round(yOf(6.9)) + 0.5;
      c.strokeStyle = 'rgba(139,151,168,.18)'; c.setLineDash([3, 5]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, ref); c.lineTo(W, ref); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#5c6879'; c.font = '11px Archivo, sans-serif';
      c.fillText('144 fps', W - c.measureText('144 fps').width, ref - 4);
      // offset by time so the graph scrolls
      var off = Math.floor(t * 30);
      c.beginPath();
      for (var k = 0; k < N; k++) {
        var x = k / (N - 1) * W, yy = yOf(valAt(k + off));
        if (k === 0) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      var col = fix > 0.5 ? '#3ed598' : '#f0506e';
      c.strokeStyle = col; c.lineWidth = 2; c.lineJoin = 'round';
      c.shadowColor = col; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0;
      if (out) {
        var worst = 0; for (var j = N - 20; j < N; j++) worst = Math.max(worst, valAt(j + off));
        out.textContent = (fix > 0.95 ? 6.9 + Math.sin(t) * 0.1 : worst).toFixed(1) + ' ms';
        out.style.color = fix > 0.95 ? '#3ed598' : (worst > 20 ? '#f0506e' : '#e9eef5');
      }
    }
    function valAt(k) { return val(((k % N) + N) % N); }

    var running = false, visible = true, raf = null;
    function loop(now) {
      raf = null;
      t = now / 1000;
      draw();
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf && !reduce) raf = requestAnimationFrame(loop); }
    watch(win, function (vis) { visible = vis; if (vis) kick(); });
    window.addEventListener('resize', function () { if (G) { G.size(); draw(); } });

    function setTiles(done, animate) {
      tiles.forEach(function (b) {
        var txt = done ? b.dataset.to : b.dataset.from;
        b.textContent = txt; b.classList.toggle('done', done);
        if (animate) { b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip'); }
      });
    }
    function reset() {
      steps.forEach(function (s) { s.className = ''; });
      setTiles(false, false); fix = 0; if (bar) bar.style.width = '0%';
    }
    function finish() {
      steps.forEach(function (s) { s.className = 'ok'; });
      tiles.forEach(function (b) { b.textContent = b.dataset.to; b.classList.add('done'); });
      fix = 1; if (bar) bar.style.width = '100%';
      running = false; if (btn) btn.disabled = false; if (label) label.textContent = 'Run it again';
      draw();
    }
    function run() {
      if (running) return;
      if (reduce) { finish(); return; }
      running = true; reset();
      if (btn) btn.disabled = true; if (label) label.textContent = 'Optimizing…';
      var i = 0, per = 650;
      // which tile flips after which step
      var tileAt = { 1: 1, 3: 0, 4: 2, 6: 3 };
      (function next() {
        if (i > 0) {
          steps[i - 1].className = 'ok';
          var ti = tileAt[i - 1];
          if (ti !== undefined && tiles[ti]) { var b = tiles[ti]; b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip'); setTimeout(function () { b.textContent = b.dataset.to; b.classList.add('done'); }, 200); }
        }
        if (bar) bar.style.width = (i / steps.length * 100) + '%';
        if (i >= steps.length) { setTimeout(finish, 250); return; }
        steps[i].className = 'run';
        // ease the graph from rough to smooth over the run
        var from = fix, to = (i + 1) / steps.length, t0 = performance.now();
        (function ease(now) { var p = Math.min(1, (now - t0) / per); fix = from + (to - from) * p; if (p < 1) requestAnimationFrame(ease); })(t0);
        i++; setTimeout(next, per);
      })();
    }
    if (btn) btn.addEventListener('click', run);
    reset(); t = 0; draw();
    if (reduce) { finish(); return; }
    kick();
    onView(win, function () { setTimeout(run, 900); }, 0.5);
  })();

  /* ---------- feature explorer ---------- */
  (function explorer() {
    var root = $('#explorer'); if (!root) return;
    var D = [
      { img: 'optimize', url: 'Dashboard › Full Optimize', title: 'One click does it all',
        desc: 'Full Optimize makes a restore point, then applies every safe tweak for your hardware in the right order. Restart once and you\'re done.',
        list: ['Restore point before any change', 'Detects NVIDIA, AMD or Intel and adapts', 'Shows what it changed, step by step'] },
      { img: 'fps', url: 'FPS & Power', title: 'Steadier frames, no throttling',
        desc: 'Windows ships tuned for battery life and quiet fans. These tweaks let your CPU and GPU run at full speed when a game is open.',
        list: ['Ultimate power plan, power throttling off', 'Hardware GPU scheduling and MPO stutter fix', 'Game priority, Game DVR and visual effects'] },
      { img: 'input', url: 'Input & Latency', title: 'What you click is what you get',
        desc: 'Cuts the delay between your mouse or keyboard and the screen, from the system timer down to how the GPU signals Windows.',
        list: ['Raw mouse input, no acceleration', '0.5 ms timer resolution', 'MSI mode for the GPU, faster keyboard repeat'] },
      { img: 'network', url: 'Network', title: 'Lower ping, fewer spikes',
        desc: 'Finds the fastest DNS for you, turns off network throttling and tests whether your connection lags when others use it.',
        list: ['DNS benchmark with one-click switch', 'Nagle off, NIC latency settings', 'Lag-under-load test with router fix steps'] },
      { img: 'scanner', url: 'PC Scanner', title: 'Find what\'s holding your PC back',
        desc: 'Scans for common performance problems — a monitor stuck at 60 Hz, RAM without XMP, old GPU drivers, high DPC latency — and tells you how to fix each one.',
        list: ['Monitor refresh rate and XMP checks', 'GPU driver and hardware health', 'DPC latency diagnostics'] },
      { img: 'always-on', url: 'Always-On', title: 'Set it once. It stays.',
        desc: 'Windows updates quietly undo tweaks. Always-On re-applies them and holds the 0.5 ms timer, so you never have to run anything again.',
        list: ['Survives reboots and Windows updates', 'Undo button on every active tweak', 'Rollback All returns Windows defaults'] },
      { img: 'games', url: 'Game Profiles', title: 'Tuned per game',
        desc: 'Presets for 60+ games that apply what helps each one — and skip tweaks its anti-cheat is sensitive to.',
        list: ['Fortnite, Valorant, CS2, Apex, Warzone and more', 'Anti-cheat aware by design', 'Never touches game files or processes'] },
      { img: 'uninstaller', url: 'Uninstaller & Debloat', title: 'A cleaner Windows',
        desc: 'Remove apps along with the leftovers normal uninstallers miss, and turn off the bloat and telemetry you never asked for.',
        list: ['Removes apps plus leftover files and registry', 'Debloat & Privacy toggles, explained', 'Cleaner for temp files and shader cache'] }
    ];
    var tabs = $$('.ex-tabs button', root), img = $('#exImg'), shot = $('#exShot');
    var tTitle = $('#exTitle'), tDesc = $('#exDesc'), tList = $('#exList'), tUrl = $('#exUrl');
    var DUR = 7000, cur = -1, timer = null, paused = false, userTook = false, visible = false;
    root.style.setProperty('--ex-dur', DUR + 'ms');
    // preload images
    D.forEach(function (d) { var im = new Image(); im.src = '/assets/img/' + d.img + '.webp'; });

    function show(i, focus) {
      if (i === cur) return;
      cur = i; var d = D[i];
      tabs.forEach(function (b, k) {
        var on = k === i; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        var p = b.querySelector('.ex-prog'); if (p) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }
      });
      if (focus) tabs[i].focus();
      // keep active tab visible in horizontal scroller (mobile), without scrolling the page
      var bar = tabs[i].parentNode;
      if (bar.scrollWidth > bar.clientWidth) { var pad = parseFloat(getComputedStyle(bar).paddingLeft) || 0; bar.scrollTo({ left: bar.scrollLeft + tabs[i].getBoundingClientRect().left - bar.getBoundingClientRect().left - pad, behavior: reduce ? 'auto' : 'smooth' }); }
      var apply = function () {
        img.src = '/assets/img/' + d.img + '.webp';
        img.classList.toggle('fit', d.img === 'optimize');
        img.alt = 'OT Tweaks ' + d.url + ' screen';
        tUrl.textContent = 'OT Tweaks › ' + d.url;
        tTitle.textContent = d.title; tDesc.textContent = d.desc;
        tList.innerHTML = '';
        d.list.forEach(function (x) { var li = document.createElement('li'); li.textContent = x; tList.appendChild(li); });
        img.classList.remove('fade');
      };
      if (reduce || !img.getAttribute('data-ready')) { img.setAttribute('data-ready', '1'); apply(); }
      else { img.classList.add('fade'); setTimeout(apply, 180); }
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      var stop = paused || userTook || reduce || !visible;
      root.classList.toggle('paused', stop);
      if (!stop) timer = setTimeout(function () { show((cur + 1) % D.length); }, DUR);
    }
    tabs.forEach(function (b, k) {
      b.addEventListener('click', function () { userTook = true; show(k); schedule(); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (cur + 1) % D.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (cur - 1 + D.length) % D.length;
        if (e.key === 'Home') n = 0; if (e.key === 'End') n = D.length - 1;
        if (n !== null) { e.preventDefault(); userTook = true; show(n, true); }
      });
    });
    root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { paused = true; schedule(); } });
    root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { paused = false; schedule(); } });
    root.addEventListener('focusin', function () { paused = true; schedule(); });
    root.addEventListener('focusout', function () { paused = false; schedule(); });
    if (reduce) root.classList.add('paused');
    // gentle tilt on the screenshot
    if (!reduce && shot && window.matchMedia('(hover: hover)').matches) {
      shot.addEventListener('pointermove', function (e) {
        var r = shot.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, yy = (e.clientY - r.top) / r.height - 0.5;
        shot.style.transform = 'perspective(1200px) rotateY(' + (x * 4) + 'deg) rotateX(' + (-yy * 4) + 'deg)';
      });
      shot.addEventListener('pointerleave', function () { shot.style.transform = ''; });
    }
    watch(root, function (vis) { visible = vis; schedule(); });
    show(0);
  })();

  /* ---------- stutter visualizer ---------- */
  (function pace() {
    var root = $('#pace'); if (!root) return;
    var pB = $('#puckBad'), pG = $('#puckGood'), mB = $('#msBad'), mG = $('#msGood');
    var sB = setupCanvas($('#sparkBad')), sG = setupCanvas($('#sparkGood'));
    var speed = $('#paceSpeed'), pauseBtn = $('#pacePause');
    var seed = 3; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    // Bad lane: frames presented with uneven intervals (same average as good lane).
    var AVG = 16.7, histB = [], histG = [], HN = 90;
    function badInterval() { var r = rnd(); if (r < 0.12) return AVG * (2.4 + rnd() * 1.4); return AVG * (0.55 + rnd() * 0.5); }
    var lap = 2600;               // ms to cross the track at speed 1
    var simT = 0, lastNow = null, paused = reduce, visible = false;
    var bad = { nextAt: 0, shownT: 0 }, good = { nextAt: 0, shownT: 0 };
    function trackW(p) { return p.parentNode.clientWidth - p.offsetWidth; }
    function posFor(t) { var x = (t % (lap * 2)) / lap; return x <= 1 ? x : 2 - x; } // ping-pong 0..1
    function push(h, v) { h.push(v); if (h.length > HN) h.shift(); }
    function spark(S, h, col) {
      var c = S.ctx, W = S.W, H = S.H; c.clearRect(0, 0, W, H);
      var yOf = function (ms) { return H - 3 - Math.min(ms, 60) / 60 * (H - 6); };
      var ref = Math.round(yOf(AVG)) + 0.5;
      c.strokeStyle = 'rgba(139,151,168,.16)'; c.setLineDash([3, 5]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, ref); c.lineTo(W, ref); c.stroke(); c.setLineDash([]);
      if (h.length < 2) return;
      c.beginPath();
      for (var i = 0; i < h.length; i++) { var x = W - (h.length - 1 - i) / (HN - 1) * W, yy = yOf(h[i]); if (!i) c.moveTo(x, yy); else c.lineTo(x, yy); }
      c.strokeStyle = col; c.lineWidth = 1.6; c.lineJoin = 'round'; c.stroke();
    }
    function frame(now) {
      if (lastNow === null) lastNow = now;
      var dt = Math.min(100, now - lastNow); lastNow = now;
      if (!paused) {
        simT += dt * parseFloat(speed.value || 1);
        // When a lane "presents" a frame, its puck jumps to where it should be at that time.
        while (simT >= bad.nextAt) { var iv = badInterval(); bad.shownT = bad.nextAt; bad.nextAt += iv; push(histB, iv); mB.textContent = iv.toFixed(1) + ' ms'; mB.style.color = iv > 30 ? '#f0506e' : ''; }
        while (simT >= good.nextAt) { var g = AVG + (rnd() - 0.5) * 0.6; good.shownT = good.nextAt; good.nextAt += g; push(histG, g); mG.textContent = g.toFixed(1) + ' ms'; }
        pB.style.transform = 'translateX(' + (posFor(bad.shownT) * trackW(pB)) + 'px)';
        pG.style.transform = 'translateX(' + (posFor(good.shownT) * trackW(pG)) + 'px)';
        spark(sB, histB, '#f0506e'); spark(sG, histG, '#3ed598');
      }
      if (visible && !paused) requestAnimationFrame(frame); else lastNow = null;
    }
    function start() { if (visible && !paused) requestAnimationFrame(frame); }
    function staticView() {
      // reduced motion / paused-at-start: show a representative frozen state
      for (var i = 0; i < HN; i++) { push(histB, badInterval()); push(histG, AVG + (rnd() - 0.5) * 0.6); }
      spark(sB, histB, '#f0506e'); spark(sG, histG, '#3ed598');
      mB.textContent = Math.max.apply(null, histB).toFixed(1) + ' ms (worst)'; mB.style.color = '#f0506e';
      mG.textContent = AVG.toFixed(1) + ' ms';
      pB.style.transform = 'translateX(' + (0.38 * trackW(pB)) + 'px)';
      pG.style.transform = 'translateX(' + (0.5 * trackW(pG)) + 'px)';
    }
    pauseBtn.addEventListener('click', function () {
      paused = !paused; pauseBtn.textContent = paused ? 'Play' : 'Pause';
      if (!paused) { if (reduce) { histB = []; histG = []; } start(); }
    });
    if (reduce) { pauseBtn.textContent = 'Play'; staticView(); }
    window.addEventListener('resize', function () { sB.size(); sG.size(); spark(sB, histB, '#f0506e'); spark(sG, histG, '#3ed598'); });
    watch(root, function (vis) { var was = visible; visible = vis; if (vis && !was) start(); });
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
