// ===== MaxwellGames: 🥷 Stealth kit (tab cloak + panic key + about:blank) =====
// The signature "unblocked games" toolkit: disguise the browser tab, jump to a
// safe site instantly with a hotkey, and launch the site inside about:blank.
(function () {
  "use strict";

  var CLOAKS = [
    { id: "off",       label: "MaxwellGames", title: "MaxwellGames", icon: "" },
    { id: "classroom", label: "Classroom",    title: "Home",                                   icon: "https://ssl.gstatic.com/classroom/favicon.png" },
    { id: "docs",      label: "Google Docs",  title: "Untitled document - Google Docs",        icon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
    { id: "slides",    label: "Google Slides",title: "Untitled presentation - Google Slides",  icon: "https://ssl.gstatic.com/docs/presentations/images/favicon5.ico" },
    { id: "sheets",    label: "Google Sheets",title: "Untitled spreadsheet - Google Sheets",   icon: "https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico" },
    { id: "drive",     label: "Google Drive", title: "My Drive - Google Drive",                icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" },
    { id: "gmail",     label: "Gmail",        title: "Inbox - Gmail",                          icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
    { id: "google",    label: "Google",       title: "Google",                                 icon: "https://www.google.com/favicon.ico" },
    { id: "classes",   label: "Clever",       title: "Clever | Portal",                        icon: "https://clever.com/favicon.ico" }
  ];
  var PANIC_URLS = [
    { label: "Canvas (FISD)",    url: "https://fisd.instructure.org" },
    { label: "Google Classroom", url: "https://classroom.google.com" },
    { label: "Google",           url: "https://www.google.com" },
    { label: "Google Docs",      url: "https://docs.google.com" },
    { label: "Wikipedia",        url: "https://www.wikipedia.org" },
    { label: "Khan Academy",     url: "https://www.khanacademy.org" }
  ];
  var DEFAULT_PANIC = "https://fisd.instructure.org";

  function lsg(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lss(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function toast(i, t, b) { try { window.MGUI.toast(i, t, b); } catch (e) {} }
  function tone(f, d, ty) { try { window.MGUI.tone(f, d, ty); } catch (e) {} }

  var ORIG_TITLE = document.title || "MaxwellGames";

  function setFavicon(href) {
    var links = document.querySelectorAll("link[rel~='icon'],link[rel='shortcut icon']");
    if (!links.length) { var l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); links = [l]; }
    links.forEach(function (l) { if (href) l.href = href; });
  }
  function currentCloak() { return lsg("mg-cloak", "off"); }
  function applyCloak(id) {
    var c = CLOAKS.find(function (x) { return x.id === id; }) || CLOAKS[0];
    document.title = c.id === "off" ? ORIG_TITLE : c.title;
    if (c.id === "off") { setFavicon("maxwell.png"); } else if (c.icon) { setFavicon(c.icon); }
    lss("mg-cloak", c.id);
  }

  // ---------- panic key ----------
  function panicKey() { return lsg("mg-panic-key", "`"); }
  function panicUrl() { return lsg("mg-panic-url", DEFAULT_PANIC); }
  function panicOn() { return lsg("mg-panic-on", "1") === "1"; }
  function doPanic() { try { window.top.location.replace(panicUrl()); } catch (e) { location.replace(panicUrl()); } }
  function onKey(e) {
    if (!panicOn()) return;
    var t = e.target, tag = (t && t.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || (t && t.isContentEditable)) return; // don't fire while typing
    if (e.key === panicKey()) { e.preventDefault(); doPanic(); }
  }

  // ---------- about:blank cloak ----------
  function openBlank() {
    var url = location.href;
    var c = CLOAKS.find(function (x) { return x.id === currentCloak(); }) || CLOAKS[0];
    var title = c.id === "off" ? "Google" : c.title;
    var icon = c.icon || "https://www.google.com/favicon.ico";
    var w = window.open("about:blank", "_blank");
    if (!w) { toast("⚠️", "Allow pop-ups", "Your browser blocked the about:blank window — allow pop-ups and try again."); return; }
    var doc = w.document;
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>' + title + '</title>' +
      '<link rel="icon" href="' + icon + '"><style>html,body{margin:0;height:100%;overflow:hidden;background:#000}iframe{border:0;width:100%;height:100%;display:block}</style></head>' +
      '<body><iframe src="' + url + '"></iframe></body></html>');
    doc.close();
    toast("🥷", "Opened in about:blank", "The game is now in a cloaked tab. You can close this one.");
  }

  // ---------- CSS ----------
  (function css() {
    if (document.getElementById("stealth-css")) return;
    var s = document.createElement("style"); s.id = "stealth-css";
    s.textContent = [
      ".stl-intro{text-align:center;color:var(--mg-sub,#8a6a3a);font-size:.9rem;margin:2px 0 12px;line-height:1.35}",
      ".stl-sec{font-weight:900;color:var(--mg-ink,#5a3a12);margin:16px 0 6px;font-size:1rem}",
      ".stl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}",
      ".stl-opt{display:flex;align-items:center;gap:9px;background:#fff;border:2px solid #ffd84a;border-radius:14px;padding:9px 11px;cursor:pointer;color:#4a3410;font-weight:800;font-size:.84rem;text-align:left}",
      ".stl-opt.on{background:linear-gradient(135deg,#ff9f43,#ff6b6b);color:#fff;border-color:#ff6b6b}",
      ".stl-opt img{width:22px;height:22px;border-radius:5px;background:#fff;object-fit:contain;flex:none}",
      ".stl-opt .noico{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;background:#fff0c2;flex:none}",
      ".stl-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}",
      ".stl-row label{font-size:.82rem;font-weight:800;color:#7a5a2a}",
      ".stl-row input,.stl-row select{border:2px solid #ffd84a;border-radius:10px;padding:8px 10px;font-size:.88rem;font-family:inherit;background:#fffdf7;color:#3a2a10}",
      ".stl-key{width:70px;text-align:center;font-weight:900}",
      ".stl-btn{background:linear-gradient(135deg,#ff9f43,#ff6b6b);border:none;color:#fff;font-weight:900;font-family:inherit;border-radius:999px;padding:11px 18px;cursor:pointer;font-size:.9rem}",
      ".stl-btn.ghost{background:#eee;color:#555}",
      ".stl-btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}",
      ".stl-toggle{display:flex;align-items:center;gap:8px;font-weight:800;color:#5a3a12;font-size:.88rem;cursor:pointer}",
      ".stl-note{font-size:.76rem;color:#8a6a3a;margin-top:6px;line-height:1.35}"
    ].join("");
    document.head.appendChild(s);
  })();

  // ---------- panel ----------
  function open() {
    var P = window.MGUI.panel("mgStealth", "🥷 Stealth", "stealth-head");
    render(P.body);
  }
  function render(body) {
    var cur = currentCloak();
    var optsHtml = CLOAKS.map(function (c) {
      var ic = c.id === "off" ? '<span class="noico">🐱</span>' : (c.icon ? '<img src="' + c.icon + '" alt="" onerror="this.outerHTML=\'<span class=noico>🌐</span>\'">' : '<span class="noico">🌐</span>');
      return '<div class="stl-opt' + (c.id === cur ? " on" : "") + '" data-cloak="' + c.id + '">' + ic + '<span>' + c.label + '</span></div>';
    }).join("");
    var curUrl = panicUrl();
    var isPreset = PANIC_URLS.some(function (p) { return p.url === curUrl; });
    var urlOpts = PANIC_URLS.map(function (p) { return '<option value="' + p.url + '"' + (p.url === curUrl ? " selected" : "") + '>' + p.label + '</option>'; }).join("") +
      (isPreset ? "" : '<option value="' + curUrl + '" selected>Custom: ' + curUrl + '</option>');
    body.innerHTML =
      '<p class="stl-intro">Make this site blend in. Disguise the browser tab, jump away instantly with a panic key, or run the whole site inside a blank tab. 🥷</p>' +
      '<div class="stl-sec">🎭 Tab disguise</div>' +
      '<p class="stl-note">Changes the tab\'s name and icon so a glance at the top of the browser doesn\'t give it away. Picks are remembered.</p>' +
      '<div class="stl-grid" id="stlGrid">' + optsHtml + '</div>' +
      '<div class="stl-sec">🚨 Panic key</div>' +
      '<label class="stl-toggle"><input type="checkbox" id="stlPanicOn"' + (panicOn() ? " checked" : "") + '> Panic key on</label>' +
      '<div class="stl-row"><label>Press</label><input class="stl-key" id="stlKey" value="' + (panicKey() === " " ? "Space" : panicKey()) + '" readonly><button class="stl-btn ghost" id="stlRebind">Change key</button></div>' +
      '<div class="stl-row"><label>Jump to</label><select id="stlUrl" style="flex:1;min-width:120px">' + urlOpts + '</select><button class="stl-btn ghost" id="stlPen" title="Type your own link">✏️</button></div>' +
      '<div class="stl-row" id="stlCustomRow" style="display:none"><input id="stlCustom" placeholder="https://..." style="flex:1;min-width:120px" value="' + curUrl + '"><button class="stl-btn" id="stlCustomSave">Save</button></div>' +
      '<p class="stl-note">Tap the key anytime and the whole page instantly goes to the safe site. Default is Canvas (fisd.instructure.org). Hit ✏️ to use any link you want. (Won\'t fire while you\'re typing in a box.)</p>' +
      '<div class="stl-sec">🕳️ Open in about:blank</div>' +
      '<p class="stl-note">Launches MaxwellGames inside a blank tab — no title, no obvious address, harder to spot or block.</p>' +
      '<div class="stl-btns"><button class="stl-btn" id="stlBlank">🕳️ Open in about:blank</button><button class="stl-btn ghost" id="stlTest">🚨 Test panic</button></div>';

    body.querySelectorAll(".stl-opt").forEach(function (el) {
      el.onclick = function () {
        var id = el.getAttribute("data-cloak"); applyCloak(id); tone(760, 0.05);
        body.querySelectorAll(".stl-opt").forEach(function (o) { o.classList.toggle("on", o === el); });
        var c = CLOAKS.find(function (x) { return x.id === id; });
        toast(c.id === "off" ? "🐱" : "🥷", c.id === "off" ? "Disguise off" : "Tab disguised", c.id === "off" ? "Back to MaxwellGames." : "Looks like " + c.label + " now.");
      };
    });
    body.querySelector("#stlPanicOn").onchange = function (e) { lss("mg-panic-on", e.target.checked ? "1" : "0"); };
    body.querySelector("#stlUrl").onchange = function (e) { lss("mg-panic-url", e.target.value); };
    body.querySelector("#stlPen").onclick = function () {
      var row = body.querySelector("#stlCustomRow");
      row.style.display = row.style.display === "none" ? "flex" : "none";
      if (row.style.display === "flex") body.querySelector("#stlCustom").focus();
    };
    function saveCustom() {
      var v = (body.querySelector("#stlCustom").value || "").trim();
      if (!v) return;
      if (!/^https?:\/\//i.test(v)) v = "https://" + v;
      lss("mg-panic-url", v); toast("🚨", "Panic link set", "Panic now jumps to " + v);
      render(body);
    }
    body.querySelector("#stlCustomSave").onclick = saveCustom;
    body.querySelector("#stlCustom").addEventListener("keydown", function (e) { if (e.key === "Enter") saveCustom(); });
    body.querySelector("#stlRebind").onclick = function () {
      var inp = body.querySelector("#stlKey"); inp.value = "Press a key…";
      function grab(ev) { ev.preventDefault(); var k = ev.key; lss("mg-panic-key", k); inp.value = k === " " ? "Space" : k; window.removeEventListener("keydown", grab, true); toast("🚨", "Panic key set", "Now press " + (k === " " ? "Space" : k) + " to bail out."); }
      window.addEventListener("keydown", grab, true);
    };
    body.querySelector("#stlBlank").onclick = openBlank;
    body.querySelector("#stlTest").onclick = function () { toast("🚨", "Panic preview", "For real it jumps to: " + panicUrl()); };
  }

  window.MG_STEALTH = { open: open, applyCloak: applyCloak, panic: doPanic };

  // ---------- boot ----------
  function mountBtn() {
    if (document.getElementById("stealthBtn")) return;
    var nav = document.querySelector("nav.tabs"); if (!nav) return;
    var b = document.createElement("button");
    b.className = "tab x-tab hot"; b.id = "stealthBtn";
    b.title = "Hide this site — tab disguise, panic key & about:blank";
    b.textContent = "🥷 Stealth";
    b.onclick = open;
    var anchor = document.getElementById("arcadeBtn");
    if (anchor) nav.insertBefore(b, anchor); else nav.appendChild(b);
  }
  function boot() {
    applyCloak(currentCloak());        // restore saved disguise
    window.addEventListener("keydown", onKey, true);
    mountBtn();
    setTimeout(mountBtn, 1500);        // in case the nav renders late
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
