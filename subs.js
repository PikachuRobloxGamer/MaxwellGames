// ===== MaxwellGames: Live Subscriber Counter =====
// Real-time-ish YouTube sub count for Pikachu Roblox Gamer.
// Pulls keyless, CORS-enabled estimators (socialcounts -> mixerno fallback).
(function () {
  "use strict";
  var U = window.MGUI || null;
  var CHANNEL_ID = "UCXcZ2HP_B3NLLbvnd3QT75A";       // Pikachu Roblox Gamer
  var CHANNEL_URL = "https://www.youtube.com/channel/" + CHANNEL_ID;
  var REFRESH_MS = 5000;

  var timer = null, raf = null, pane = null;
  var shown = null, target = null, startSub = null, lastRendered = null;

  function num(v) { v = parseInt(v, 10); return isNaN(v) ? null : v; }
  function fmt(n) { return (n == null || isNaN(n)) ? "—" : Math.round(n).toLocaleString("en-US"); }

  function css() {
    if (document.getElementById("mg-subs-css")) return;
    var s = document.createElement("style"); s.id = "mg-subs-css";
    s.textContent = [
      ".subs-wrap{text-align:center;padding:14px 6px 24px;position:relative;overflow:hidden}",
      ".subs-live{display:inline-flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.16em;",
      "font-size:12px;text-transform:uppercase;color:#ffd1da;background:#ff00331a;border:1px solid #ff003355;",
      "border-radius:999px;padding:6px 14px 6px 11px;margin-bottom:22px}",
      ".subs-dot{width:9px;height:9px;border-radius:50%;background:#ff0033;animation:subsPulse 1.6s infinite}",
      "@keyframes subsPulse{0%{box-shadow:0 0 0 0 rgba(255,0,51,.6)}70%{box-shadow:0 0 0 12px rgba(255,0,51,0)}100%{box-shadow:0 0 0 0 rgba(255,0,51,0)}}",
      ".subs-chan{display:flex;align-items:center;justify-content:center;gap:13px;margin-bottom:26px}",
      ".subs-chan img{width:54px;height:54px;border-radius:50%;border:2px solid #ffffff22;background:#222;object-fit:cover}",
      ".subs-chan .nm{font-weight:800;font-size:clamp(18px,4vw,26px);line-height:1.05}",
      ".subs-chan .nm small{display:block;font-weight:500;font-size:12px;opacity:.6;margin-top:3px}",
      ".subs-count{font-weight:800;color:#fff;font-size:clamp(58px,15vw,128px);line-height:.95;",
      "letter-spacing:-.02em;font-variant-numeric:tabular-nums;text-shadow:0 0 55px rgba(255,0,51,.4)}",
      ".subs-count.bump{animation:subsBump .4s ease}",
      "@keyframes subsBump{0%{transform:scale(1)}30%{transform:scale(1.04)}100%{transform:scale(1)}}",
      ".subs-label{margin-top:10px;text-transform:uppercase;letter-spacing:.34em;font-size:13px;color:#ff3b5c;font-weight:700}",
      ".subs-stats{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:28px}",
      ".subs-stat{background:#ffffff0d;border:1px solid #ffffff1c;border-radius:15px;padding:13px 20px;min-width:120px}",
      ".subs-stat b{display:block;font-size:22px;font-weight:800;font-variant-numeric:tabular-nums}",
      ".subs-stat span{font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:.11em}",
      ".subs-foot{margin-top:24px;display:flex;align-items:center;justify-content:center;gap:15px;flex-wrap:wrap;font-size:12.5px;opacity:.85}",
      ".subs-foot .d{color:#38e08a;font-weight:700}.subs-foot .d.neg{color:#ff5c7a}",
      ".subs-foot a{color:#ff3b5c;text-decoration:none;font-weight:700}.subs-foot a:hover{text-decoration:underline}",
      ".subs-err{color:#ff8a9c}",
      "@media(max-width:430px){.subs-chan img{width:44px;height:44px}.subs-stat{min-width:0;flex:1}}"
    ].join("");
    document.head.appendChild(s);
  }

  function fromSocialcounts() {
    return fetch("https://api.socialcounts.org/youtube-live-subscriber-count/" + CHANNEL_ID)
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        var sub = d.est_sub != null ? d.est_sub : (d.apiEstSub != null ? d.apiEstSub : null);
        if (sub == null) throw 0;
        return { sub: sub, views: num(d.est_view != null ? d.est_view : d.apiViews),
                 videos: num(d.est_video != null ? d.est_video : d.apiVideos),
                 name: d.name || null, pfp: d.profilePicture || d.pfp || null };
      });
  }
  function fromMixerno() {
    return fetch("https://mixerno.space/api/youtube-channel-counter/user/" + CHANNEL_ID)
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        var c = d.counts || [], u = d.user || [];
        function pick(key) {
          var est = null;
          for (var i = 0; i < c.length; i++) { var dn = (c[i].displayName || "").toLowerCase();
            if (dn.indexOf(key) > -1) { if (dn.indexOf("estimated") < 0) return num(c[i].count); if (est == null) est = num(c[i].count); } }
          return est;
        }
        function usr(key) { for (var i = 0; i < u.length; i++) { if ((u[i].displayName || "").toLowerCase().indexOf(key) > -1) return u[i].count; } return null; }
        var sub = pick("subscriber");
        if (sub == null) throw 0;
        return { sub: sub, views: pick("view"), videos: pick("video"), name: usr("name"), pfp: usr("pfp") };
      });
  }

  function q(id) { return pane ? pane.body.querySelector(id) : null; }

  function renderCount(n) {
    if (n === lastRendered) return; lastRendered = n;
    var el = q("#subsCount"); if (!el) return;
    el.textContent = fmt(n);
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }
  function animate() {
    if (!pane) return;
    if (target != null) {
      if (shown == null) shown = target;
      var diff = target - shown;
      shown = Math.abs(diff) < 0.5 ? target : shown + diff * 0.12;
      renderCount(Math.round(shown));
    }
    raf = requestAnimationFrame(animate);
  }

  function apply(d) {
    if (!pane) return;
    target = d.sub;
    if (startSub == null) startSub = d.sub;
    if (d.views != null) q("#subsViews").textContent = fmt(d.views);
    if (d.videos != null) q("#subsVideos").textContent = fmt(d.videos);
    if (d.name) { q("#subsName").childNodes[0].nodeValue = d.name; }
    if (d.pfp) { var p = q("#subsPfp"); p.src = d.pfp; p.style.display = ""; }
    q("#subsHandle").textContent = "updating live • " + new Date().toLocaleTimeString();
    var st = q("#subsStatus"); st.className = ""; st.textContent = "● Live";
    var diff = d.sub - startSub, dw = q("#subsDeltaWrap"), de = q("#subsDelta");
    dw.hidden = false; de.textContent = (diff >= 0 ? "+" : "") + fmt(diff);
    de.className = "d" + (diff < 0 ? " neg" : "");
  }
  function fail() {
    if (!pane) return;
    var st = q("#subsStatus"); st.className = "subs-err";
    st.textContent = "Couldn't reach the live counter — retrying…";
  }
  function load() { fromSocialcounts().catch(fromMixerno).then(apply).catch(fail); }

  function open() {
    U = window.MGUI;
    if (!U || !U.panel) { setTimeout(open, 150); return; }
    css();
    shown = target = startSub = lastRendered = null;
    pane = U.panel("mgSubs", "📊 Live Subs", "subs-head");
    pane.body.innerHTML =
      '<div class="subs-wrap">' +
        '<div class="subs-live"><span class="subs-dot"></span> Live subscriber count</div>' +
        '<div class="subs-chan"><img id="subsPfp" alt="" style="display:none" onerror="this.style.display=\'none\'">' +
          '<div class="nm" id="subsName">Pikachu Roblox Gamer<small id="subsHandle">connecting…</small></div></div>' +
        '<div class="subs-count" id="subsCount">——</div>' +
        '<div class="subs-label">subscribers</div>' +
        '<div class="subs-stats">' +
          '<div class="subs-stat"><b id="subsViews">—</b><span>Total views</span></div>' +
          '<div class="subs-stat"><b id="subsVideos">—</b><span>Videos</span></div></div>' +
        '<div class="subs-foot"><span id="subsStatus">Connecting…</span>' +
          '<span id="subsDeltaWrap" hidden>since open <b class="d" id="subsDelta">+0</b></span>' +
          '<a href="' + CHANNEL_URL + '" target="_blank" rel="noopener">Open channel ↗</a></div>' +
      '</div>';
    pane.onClean(function () { if (timer) clearInterval(timer); if (raf) cancelAnimationFrame(raf); timer = raf = null; pane = null; });
    animate(); load(); timer = setInterval(load, REFRESH_MS);
  }
  window.MG_SUBS = { open: open };

  function mountBtn() {
    if (document.getElementById("subsBtn")) return;
    var nav = document.querySelector("nav.tabs"); if (!nav) return;
    var b = document.createElement("button");
    b.className = "tab subs-tab hot"; b.id = "subsBtn";
    b.title = "Live subscriber counter for Pikachu Roblox Gamer!";
    b.textContent = "📊 Live Subs";
    b.onclick = open;
    var anchor = document.getElementById("tvBtn") || document.getElementById("ranksBtn");
    if (anchor) nav.insertBefore(b, anchor); else nav.appendChild(b);
  }
  function boot() { mountBtn(); setTimeout(mountBtn, 1500); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
