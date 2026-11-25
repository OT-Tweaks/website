// Reviews from the Discord (/vouch), served by the OT Tweaks bot. Shown only when there are real ones.
(function () {
  var API = 'https://ot-tweaks-bot.matriv1213.workers.dev/api/vouches';
  var sec = document.getElementById('reviews');
  if (!sec || !window.fetch) return;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function stars(n) { n = Math.round(n); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
  fetch(API).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d || !d.count) return;
    document.getElementById('revAvg').textContent = d.average.toFixed(1);
    document.getElementById('revStars').textContent = stars(d.average);
    document.getElementById('revCount').textContent = d.count + (d.count === 1 ? ' review' : ' reviews');
    var grid = document.getElementById('revGrid');
    d.vouches.slice(0, 6).forEach(function (v) {
      var card = el('figure', 'card spot review');
      card.appendChild(el('div', 'stars', stars(v.rating)));
      var p = el('p'); p.textContent = '“' + v.text + '”'; card.appendChild(p);
      var who = el('figcaption', 'who');
      var img = new Image(); img.src = v.avatar; img.alt = ''; img.loading = 'lazy'; img.width = 32; img.height = 32; who.appendChild(img);
      var t = el('div'); t.appendChild(el('b', null, v.name)); t.appendChild(el('br'));
      var meta = el('span'); meta.appendChild(el('span', 'verified', '✔ Verified customer'));
      if (v.at) meta.appendChild(document.createTextNode(' · ' + new Date(v.at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })));
      t.appendChild(meta); who.appendChild(t); card.appendChild(who);
      grid.appendChild(card);
    });
    sec.hidden = false;
  }).catch(function () {});
})();
