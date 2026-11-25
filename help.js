// Help centre: instant search + a live status line.
(function () {
  var q = document.getElementById('q'), empty = document.getElementById('empty');
  var items = [].slice.call(document.querySelectorAll('.help-list details'));
  var cats = [].slice.call(document.querySelectorAll('.help-cat'));
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' '); }
  items.forEach(function (d) { d._t = norm(d.textContent); });
  function run() {
    var words = norm(q.value).split(/\s+/).filter(Boolean), shown = 0;
    items.forEach(function (d) {
      var hit = words.every(function (w) { return d._t.indexOf(w) >= 0; });
      d.hidden = !hit; if (hit) shown++;
      if (words.length && hit && shown <= 2) d.open = true;
      if (!words.length) d.open = false;
    });
    cats.forEach(function (c) { c.hidden = !c.querySelector('details:not([hidden])'); });
    empty.hidden = shown > 0;
  }
  q.addEventListener('input', run);
  // Open the question linked in the URL (#i-forgot-my-password)
  if (location.hash) { var d = document.getElementById(location.hash.slice(1)); if (d && d.tagName === 'DETAILS') d.open = true; }

  // Status line
  function set(dot, txt, ok, text) { document.getElementById(dot).className = ok ? 'ok' : 'bad'; document.getElementById(txt).textContent = text; }
  var C = window.OT_CONFIG || {};
  if (C.githubRepo && window.fetch) {
    fetch('https://api.github.com/repos/' + C.githubRepo + '/releases/latest').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (r) {
        if (!r || !r.tag_name) throw 0;
        var when = r.published_at ? ' (' + new Date(r.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ')' : '';
        set('stApp', 'stAppT', true, 'Latest version ' + r.tag_name.replace(/^v/, '') + when);
      }).catch(function () { set('stApp', 'stAppT', true, 'Downloads available'); });
  }
  fetch('https://ot-tweaks-bot.matriv1213.workers.dev/api/vouches', { cache: 'no-store' })
    .then(function (r) { set('stSup', 'stSupT', r.ok, r.ok ? 'Support bot online' : 'Support bot having trouble, the team is still on Discord'); })
    .catch(function () { set('stSup', 'stSupT', false, 'Support bot unreachable, the team is still on Discord'); });
})();
