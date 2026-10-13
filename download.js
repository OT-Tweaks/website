// Finds the newest OT Tweaks installer: latest GitHub release if configured, otherwise the local file.
window.OT_getDownload = async function () {
  var C = window.OT_CONFIG || {};
  var fallback = { url: C.downloadUrl || '', version: C.downloadVersion || '', size: null };
  if (!C.githubRepo || /YOUR_/.test(C.githubRepo)) return fallback;
  try {
    var r = await fetch('https://api.github.com/repos/' + C.githubRepo + '/releases/latest', { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) return fallback;
    var j = await r.json();
    var a = (j.assets || []).filter(function (x) { return /\.exe$/i.test(x.name) && !/blockmap/i.test(x.name); })[0];
    if (!a) return fallback;
    return { url: a.browser_download_url, version: String(j.tag_name || '').replace(/^v/, ''), size: a.size };
  } catch (e) { return fallback; }
};
