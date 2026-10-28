// ===== MaxwellGames: 🌙 Themes & Seasons — full site themes (bought with treats) + auto seasonal decorations =====
(function () {
  var U = window.MGUI;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // each theme overrides the base palette vars; --accent stays controlled by the shop's colour picker
  var THEMES = [
    { id: "default", name: "Classic", icon: "🟣", price: 0, deco: "auto" },
    { id: "dark", name: "Midnight Dark", icon: "🌑", price: 0, vars: { "--bg": "#05060b", "--panel": "#0f111a", "--panel-hover": "#171a26", "--text": "#e8e9ee", "--muted": "#7c8193" }, deco: "auto" },
    { id: "neon", name: "Neon Nights", icon: "🌈", price: 60, vars: { "--bg": "#0a0016", "--panel": "#160131", "--panel-hover": "#22064a", "--text": "#eafcff", "--muted": "#9a7fd6" }, deco: "auto" },
    { id: "winter", name: "Winter ❄️", icon: "⛄", price: 50, vars: { "--bg": "#0b1a2e", "--panel": "#122540", "--panel-hover": "#18304f", "--text": "#eaf4ff", "--muted": "#9bb3c9" }, deco: "snow" },
    { id: "halloween", name: "Halloween 🎃", icon: "👻", price: 50, vars: { "--bg": "#140a04", "--panel": "#231307", "--panel-hover": "#311a09", "--text": "#ffe8c8", "--muted": "#b98b5e" }, deco: "spooky" },
    { id: "sunset", name: "Sunset", icon: "🌅", price: 40, vars: { "--bg": "#2a1030", "--panel": "#3a1740", "--panel-hover": "#4a1e50", "--text": "#ffe9d6", "--muted": "#c79bb0" }, deco: "auto" },
    { id: "candy", name: "Cotton Candy", icon: "🍬", price: 40, vars: { "--bg": "#fff0f6", "--panel": "#ffe1ee", "--panel-hover": "#ffd0e4", "--text": "#3a2340", "--muted": "#a6788f" }, deco: "auto" }
  ];
  function theme(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]; return THEMES[0]; }
  function owned() { try { return JSON.parse(ls("mg-themes-owned") || "[]"); } catch (e) { return []; } }
  function isOwned(id) { var t = theme(id); return t.price === 0 || owned().indexOf(id) >= 0; }
  function equipped() { return ls("mg-theme") || "default"; }

  function applyVars(t) {
    var root = document.documentElement;
    // first clear any theme vars we might have set
    ["--bg", "--panel", "--panel-hover", "--text", "--muted"].forEach(function (v) { root.style.removeProperty(v); });
    if (t.vars) Object.keys(t.vars).forEach(function (k) { root.style.setProperty(k, t.vars[k]); });
    document.documentElement.setAttribute("data-mgtheme", t.id);
    document.body && document.body.style.setProperty("background", "var(--bg)");
  }

  // ---------- seasonal decorations ----------
  var decoLayer = null, decoKind = "";
  function ensureLayer() { if (!decoLayer) { decoLayer = document.createElement("div"); decoLayer.id = "mgDeco"; decoLayer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden"; document.body.appendChild(decoLayer); } return decoLayer; }
  function seasonDeco() { var m = new Date().getMonth(); if (m === 9) return "spooky"; if (m === 11 || m === 0 || m === 1) return "snow"; return ""; }
  function setDeco(kind) {
    if (kind === decoKind) return; decoKind = kind;
    var layer = ensureLayer(); layer.innerHTML = ""; if (!kind) { layer.style.display = "none"; return; } layer.style.display = "";
    var items = kind === "snow" ? ["❄️", "❄", "🌨️"] : ["🦇", "🎃", "👻", "🕸️"];
    var n = 22;
    for (var i = 0; i < n; i++) {
      var s = document.createElement("div");
      var dur = 6 + Math.random() * 9, delay = -Math.random() * dur, left = Math.random() * 100, sz = 12 + Math.random() * 20;
      s.textContent = items[(Math.random() * items.length) | 0];
      s.style.cssText = "position:absolute;top:-30px;left:" + left + "%;font-size:" + sz + "px;opacity:.55;animation:mgFall " + dur + "s linear " + delay + "s infinite";
      layer.appendChild(s);
    }
  }
  function decoForCurrent() { var t = theme(equipped()); if (t.deco === "snow") return "snow"; if (t.deco === "spooky") return "spooky"; return seasonDeco(); }

  function applyCustomCursor() {
    var cc = ls("mg-custom-cursor"), root = document.documentElement;
    if (cc) { root.style.setProperty("--mg-cc", 'url("' + cc + '") 6 3, auto'); root.classList.add("mg-cc-on"); }
    else { root.classList.remove("mg-cc-on"); root.style.removeProperty("--mg-cc"); }
  }
  function apply() { applyVars(theme(equipped())); setDeco(decoForCurrent()); applyCustomCursor(); }

  function css() {
    if (document.getElementById("mg-theme-css")) return;
    var s = document.createElement("style"); s.id = "mg-theme-css";
    s.textContent = "@keyframes mgFall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(110vh) rotate(360deg)}}"
      + ".mgth-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-top:8px}"
      + ".mgth-tile{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 8px;border-radius:14px;border:2px solid rgba(255,255,255,.12);background:var(--panel-hover);color:var(--text);cursor:pointer;text-align:center}"
      + ".mgth-tile.on{border-color:#3ee08f}.mgth-ic{font-size:2rem}.mgth-nm{font-weight:800;font-size:.9rem}.mgth-sub{font-size:.72rem;color:var(--muted)}"
      + ".mgth-row{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--panel-hover);border-radius:14px;padding:12px 14px;margin-top:12px}"
      + ".mgth-cc{background:var(--panel-hover);border-radius:14px;padding:12px 14px;margin-top:12px}.mgth-cc h3{margin:0 0 4px;font-size:1rem}.mgth-cc input{width:100%}.mgth-ccmsg{font-size:.76rem;color:var(--muted);margin-top:6px}"
      + "html.mg-cc-on,html.mg-cc-on body,html.mg-cc-on body *:not(iframe){cursor:var(--mg-cc)!important}";
    document.head.appendChild(s);
  }

  function open() {
    css();
    var p = U.panel("themesOv", "🌙 Themes & Seasons", "themes-head");
    function render() {
      var html = '<p class="ar-hint">Give MaxwellGames a whole new look! Buy a theme with 🐟 treats, then tap to wear it. ❄️🎃 Seasons decorate the site automatically!</p><div class="mgth-grid">';
      THEMES.forEach(function (t) {
        var own = isOwned(t.id), on = equipped() === t.id;
        var sub = on ? "✅ Wearing" : own ? "Tap to wear" : (t.price + " 🐟");
        html += '<button class="mgth-tile' + (on ? " on" : "") + '" data-id="' + t.id + '"><span class="mgth-ic">' + t.icon + '</span><span class="mgth-nm">' + t.name + '</span><span class="mgth-sub">' + sub + '</span></button>';
      });
      html += "</div>";
      var compOn = !window.MG_COMPANION || window.MG_COMPANION.on;
      html += '<div class="mgth-row"><span>🐱 <b>Buddy companion</b> that follows you around</span><button class="btn" id="mgCompToggle">' + (compOn ? "ON" : "OFF") + "</button></div>";
      html += '<div class="mgth-cc"><h3>🖱️ Custom Cursor</h3>'
        + '<p class="ar-hint" style="margin:0 0 6px">Find a cursor you love on <b>sweezy-cursors.com</b>, copy its image link (right-click → Copy image address) or upload a .png/.cur, paste it below, and hit Use it!</p>'
        + '<div style="display:flex;gap:6px"><input id="ccUrl" class="sball-input" placeholder="Paste cursor image URL…" autocomplete="off"><button class="btn" id="ccUpload" title="Upload an image">📁</button></div>'
        + '<div style="display:flex;gap:6px;margin-top:6px"><button class="btn asc-btn" id="ccUse">🖱️ Use it</button><button class="btn" id="ccReset">↺ Default</button></div>'
        + '<p class="mgth-ccmsg" id="ccMsg">' + (ls("mg-custom-cursor") ? "✅ A custom cursor is active." : "") + '</p></div>';
      p.body.innerHTML = html;
      p.body.querySelectorAll(".mgth-tile").forEach(function (b) {
        b.onclick = function () {
          var t = theme(b.dataset.id);
          if (!isOwned(t.id)) {
            if (!U.spend(t.price)) { U.toast && U.toast("🔒", "Not enough treats", "You need " + t.price + " 🐟 for " + t.name + "."); return; }
            var o = owned(); o.push(t.id); ls("mg-themes-owned", JSON.stringify(o));
            U.toast && U.toast(t.icon, "Unlocked " + t.name + "!", "Now wearing it.");
          }
          ls("mg-theme", t.id); apply(); render();
        };
      });
      var ct = p.body.querySelector("#mgCompToggle");
      if (ct) ct.onclick = function () { if (!window.MG_COMPANION) return; if (window.MG_COMPANION.on) window.MG_COMPANION.disable(); else window.MG_COMPANION.enable(); render(); };
      // custom cursor
      var ccMsg = p.body.querySelector("#ccMsg");
      var fileIn = document.createElement("input"); fileIn.type = "file"; fileIn.accept = "image/png,image/x-icon,image/vnd.microsoft.icon,.cur,.ani,image/*"; fileIn.style.display = "none"; p.body.appendChild(fileIn);
      p.body.querySelector("#ccUpload").onclick = function () { fileIn.click(); };
      fileIn.onchange = function () { var f = fileIn.files && fileIn.files[0]; if (!f) return; if (f.size > 400000) { ccMsg.textContent = "That image is too big — pick one under ~400KB (cursors are tiny!)."; return; } var rd = new FileReader(); rd.onload = function () { p.body.querySelector("#ccUrl").value = rd.result; ccMsg.textContent = "Loaded — now hit 🖱️ Use it!"; }; rd.readAsDataURL(f); };
      p.body.querySelector("#ccUse").onclick = function () {
        var v = (p.body.querySelector("#ccUrl").value || "").trim();
        if (!/^https:\/\/|^data:image\//i.test(v)) { ccMsg.textContent = "Paste a valid https:// image link or upload a file."; return; }
        ls("mg-custom-cursor", v); applyCustomCursor();
        ccMsg.textContent = "✅ Custom cursor set! If you don't see it, the image link may be blocked — try uploading the file instead.";
      };
      p.body.querySelector("#ccReset").onclick = function () { try { localStorage.removeItem("mg-custom-cursor"); } catch (e) {} applyCustomCursor(); p.body.querySelector("#ccUrl").value = ""; ccMsg.textContent = "Back to the default cursor."; };
    }
    render();
  }

  // apply saved theme ASAP
  apply();
  if (U && U.wire) U.wire("themesBtn", open);
  window.MG_THEMES = { open: open, apply: apply };
})();
