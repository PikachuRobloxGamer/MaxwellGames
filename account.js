// ===== MaxwellGames: cute account system (Sign Up / Log In, cross-device via Firebase) =====
// Your progress (treats, level, Maxwell, achievements) follows you to any device/proxy when you log in.
// Passwords are hashed (SHA-256) before they ever leave the device — never stored as plain text.
// NOTE: this is a fun game login, not bank-level security. The database is public, so tell players
// not to use a real/important password.
(function () {
  function fbUrl() { return (window.MG_FIREBASE_CONFIG && window.MG_FIREBASE_CONFIG.databaseURL) || ""; }
  const SAVE_BASE = "maxwellgames-save-v1";
  const SALT = "mg-acct-v2";
  const $ = (id) => document.getElementById(id);
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  function saveKey(u) { return u ? SAVE_BASE + "::" + u : SAVE_BASE; }
  function profile() { return ls.get("mg-profile") || ""; }
  function authUser() { return ls.get("mg-auth") || ""; }
  function uname(s) { return (s || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, ""); }
  async function sha(s) { const b = new TextEncoder().encode(s); const h = await crypto.subtle.digest("SHA-256", b); return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, "0")).join(""); }
  function normEmail(e) { return (e || "").trim().toLowerCase(); }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail(e)); }
  // we store only a scrambled fingerprint of the email (never the real address) — the DB is public, so this keeps players' emails private
  async function emailHash(e) { return (await sha("email:" + normEmail(e) + ":" + SALT)).slice(0, 40); }
  function fbGet(path) { var FB = fbUrl(); if (!FB) return Promise.resolve(null); return fetch(FB + "/" + path + ".json").then((r) => (r.ok ? r.json() : null)).catch(() => null); }
  function fbPut(path, data) { var FB = fbUrl(); if (!FB) return Promise.resolve(false); return fetch(FB + "/" + path + ".json", { method: "PUT", body: JSON.stringify(data) }).then((r) => r.ok).catch(() => false); }

  // ---------- styles ----------
  (function css() {
    const s = document.createElement("style"); s.id = "mga-style";
    s.textContent = `
      .mga-ov{position:fixed;inset:0;z-index:100050;display:flex;align-items:center;justify-content:center;padding:16px;
        background:radial-gradient(circle at 30% 20%,#6c5ce7,#3a2d80 55%,#1a1140);overflow:hidden}
      .mga-ov.hidden{display:none}
      .mga-float{position:absolute;inset:0;pointer-events:none;overflow:hidden}
      .mga-float img{position:absolute;width:64px;opacity:.22;animation:mgaFloat linear infinite}
      @keyframes mgaFloat{0%{transform:translateY(110vh) rotate(0)}100%{transform:translateY(-20vh) rotate(360deg)}}
      .mga-card{position:relative;width:min(380px,94vw);background:linear-gradient(180deg,#fff,#f3f0ff);border-radius:26px;
        padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.45);border:4px solid #ffd84a;text-align:center;max-height:94vh;overflow:auto}
      .mga-logo{width:84px;height:84px;border-radius:50%;border:4px solid #6c5ce7;background:#fff;object-fit:cover;margin-top:-54px;box-shadow:0 6px 18px rgba(108,92,231,.4);animation:mgaBob 2.4s ease-in-out infinite}
      @keyframes mgaBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-7px) rotate(3deg)}}
      .mga-card h1{margin:8px 0 2px;color:#3a2d80;font-size:1.5rem;font-weight:900;letter-spacing:.5px}
      .mga-sub{color:#6b6b86;font-size:.84rem;margin:0 0 14px}
      .mga-tabs{display:flex;gap:8px;background:#eceaf8;border-radius:16px;padding:5px;margin-bottom:14px}
      .mga-tabs button{flex:1;border:none;background:transparent;color:#6b6b86;font-weight:800;padding:10px;border-radius:12px;cursor:pointer;font-size:.95rem;transition:all .15s}
      .mga-tabs button.on{background:#6c5ce7;color:#fff;box-shadow:0 4px 12px rgba(108,92,231,.4)}
      .mga-field{position:relative;margin-bottom:11px}
      .mga-field input{width:100%;padding:13px 14px 13px 42px;border-radius:14px;border:2.5px solid #e0dcf5;background:#fff;color:#2a2340;font-size:1rem;font-weight:600;outline:none}
      .mga-field input:focus{border-color:#6c5ce7}
      .mga-field .mga-ic{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:1.1rem}
      .mga-go{width:100%;padding:14px;border:none;border-radius:16px;background:linear-gradient(90deg,#ff7eb3,#6c5ce7);color:#fff;
        font-size:1.1rem;font-weight:900;cursor:pointer;box-shadow:0 6px 0 #4a3aa0;transition:all .1s;margin-top:4px}
      .mga-go:active{transform:translateY(4px);box-shadow:0 2px 0 #4a3aa0}
      .mga-go:disabled{opacity:.6;cursor:wait}
      .mga-msg{min-height:20px;font-size:.84rem;font-weight:700;margin:10px 2px 4px}
      .mga-msg.err{color:#e0407a}.mga-msg.ok{color:#2bbd6e}
      .mga-guest{background:none;border:none;color:#8b7fd6;font-weight:800;cursor:pointer;font-size:.9rem;padding:8px;text-decoration:underline}
      .mga-note{color:#a7a2c0;font-size:.7rem;margin:6px 0 0}
      .mga-row{display:flex;gap:8px}.mga-row .mga-field{flex:1}
      .mga-acct{background:#f3f0ff;border-radius:16px;padding:14px;margin-bottom:12px}
      .mga-acct b{color:#3a2d80;font-size:1.15rem}
      .mga-close{position:absolute;top:10px;right:14px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#b7b2cf;line-height:1}
      .mga-back{position:absolute;top:10px;left:14px;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#b7b2cf;line-height:1}
      .mga-link{background:none;border:none;color:#8b7fd6;font-weight:700;cursor:pointer;font-size:.82rem;text-decoration:underline;margin-top:4px}
      .mga-pick{display:block;width:100%;text-align:left;background:#f3f0ff;border:2px solid #e0dcf5;border-radius:12px;padding:12px 14px;margin:7px 0;cursor:pointer;font-weight:800;color:#3a2d80;font-size:.95rem}
      .mga-pick:active,.mga-pick:hover{border-color:#6c5ce7;background:#ece8ff}
      .mga-hello{display:flex;align-items:center;gap:7px;background:linear-gradient(90deg,#6c5ce7,#a06bff);color:#fff;border:none;border-radius:20px;padding:5px 13px 5px 6px;font-weight:800;font-size:.85rem;cursor:pointer;box-shadow:0 3px 10px rgba(108,92,231,.35);white-space:nowrap}
      .mga-hello img{width:24px;height:24px;border-radius:50%;border:2px solid #fff;object-fit:cover;background:#fff}
      .mga-hello:hover{filter:brightness(1.08)}
    `;
    document.head.appendChild(s);
  })();

  // ---------- overlay ----------
  let ov, mode = "login";
  function build() {
    ov = document.createElement("div"); ov.className = "mga-ov hidden"; ov.id = "mgaOverlay";
    let floaters = '<div class="mga-float">';
    for (let i = 0; i < 8; i++) { const d = 7 + Math.random() * 9, delay = -Math.random() * 14, left = Math.random() * 100; floaters += `<img src="maxwell.png" alt="" style="left:${left}%;animation-duration:${d}s;animation-delay:${delay}s;width:${40 + Math.random() * 44}px">`; }
    floaters += "</div>";
    ov.innerHTML = floaters + `
      <div class="mga-card">
        <button class="mga-close" id="mgaClose" title="Close">✕</button>
        <img class="mga-logo" src="maxwell.png" alt="Maxwell">
        <h1>MaxwellGames</h1>
        <div id="mgaBody"></div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector("#mgaClose").onclick = hide;
    ov.addEventListener("mousedown", (e) => { if (e.target === ov) hide(); });
  }

  function authView() {
    const u = authUser();
    const body = ov.querySelector("#mgaBody");
    if (u) {
      body.innerHTML = `
        <p class="mga-sub">You're signed in — your progress is saved to the cloud! ☁️</p>
        <div class="mga-acct">Signed in as <b>${esc(displayName(u))}</b> 🐾</div>
        <div id="mgaEmailBox"><p class="mga-note">Checking recovery…</p></div>
        <button class="mga-go" id="mgaClose2">🎮 Keep Playing</button>
        <button class="mga-guest" id="mgaLogout">🚪 Log out</button>
        <p class="mga-note">Log in with the same username on any device to bring your Maxwell with you.</p>`;
      body.querySelector("#mgaClose2").onclick = hide;
      body.querySelector("#mgaLogout").onclick = () => { ls.del("mg-auth"); ls.del("mg-profile"); ls.set("mg-guest", "1"); location.reload(); };
      renderEmailBox(u);
      return;
    }
    const emailField = mode === "signup"
      ? `<div class="mga-field"><span class="mga-ic">📧</span><input id="mgaEmail" placeholder="Gmail (optional — for recovery)" autocomplete="off" maxlength="60" inputmode="email" autocapitalize="off"></div>`
      : "";
    const forgotLink = mode === "login" ? `<button type="button" class="mga-link" id="mgaForgot">😿 Forgot password or username?</button>` : "";
    body.innerHTML = `
      <p class="mga-sub">Make an account so your Maxwell follows you to any device! 🐾✨</p>
      <div class="mga-tabs"><button data-tab="login" class="${mode === "login" ? "on" : ""}">🔑 Log In</button><button data-tab="signup" class="${mode === "signup" ? "on" : ""}">✨ Sign Up</button></div>
      <form id="mgaForm">
        <div class="mga-field"><span class="mga-ic">🐱</span><input id="mgaUser" placeholder="Username" autocomplete="off" maxlength="16" autocapitalize="off"></div>
        <div class="mga-field"><span class="mga-ic">🔒</span><input id="mgaPass" type="password" placeholder="Password" autocomplete="off" maxlength="40"></div>
        ${emailField}
        <button class="mga-go" id="mgaGo" type="submit">${mode === "login" ? "🔑 Log In" : "✨ Create My Account"}</button>
      </form>
      ${forgotLink}
      <p class="mga-msg" id="mgaMsg"></p>
      <button class="mga-guest" id="mgaGuest">🐱 Just play as Guest</button>
      <p class="mga-note">🔒 Fun game login only — please don't use a real/important password.</p>`;
    body.querySelectorAll(".mga-tabs button").forEach((b) => b.onclick = () => { mode = b.dataset.tab; authView(); setTimeout(() => { const i = $("mgaUser"); if (i) i.focus(); }, 30); });
    body.querySelector("#mgaForm").onsubmit = (e) => { e.preventDefault(); go(); };
    body.querySelector("#mgaGuest").onclick = () => { ls.set("mg-guest", "1"); hide(); };
    const fb = body.querySelector("#mgaForgot"); if (fb) fb.onclick = () => forgotView();
  }

  // recovery-email box inside the signed-in view
  function renderEmailBox(u) {
    const box = ov.querySelector("#mgaEmailBox"); if (!box) return;
    fbGet("accounts/" + u + "/eh").then((eh) => {
      if (eh) { box.innerHTML = '<p class="mga-note">📧 A recovery Gmail is connected ✅ — you can reset your password if you forget it.</p>'; return; }
      box.innerHTML = `<div class="mga-field"><span class="mga-ic">📧</span><input id="mgaAddEmail" placeholder="Connect a Gmail (for recovery)" inputmode="email" autocapitalize="off" maxlength="60"></div><button class="mga-link" id="mgaSaveEmail">🔗 Connect this Gmail</button><p class="mga-note" id="mgaEmailMsg"></p>`;
      box.querySelector("#mgaSaveEmail").onclick = async () => {
        const e = (box.querySelector("#mgaAddEmail") || {}).value || "";
        const mm = box.querySelector("#mgaEmailMsg");
        if (!validEmail(e)) { if (mm) { mm.textContent = "That doesn't look like a Gmail."; mm.style.color = "#e0407a"; } return; }
        const eh2 = await emailHash(e);
        await fbPut("accounts/" + u + "/eh", eh2); await fbPut("emailIndex/" + eh2 + "/" + u, 1);
        box.innerHTML = '<p class="mga-note">📧 Gmail connected! ✅ You can recover this account now.</p>';
      };
    });
  }

  // ---------- forgot-password / recovery flow ----------
  function forgotView() {
    const body = ov.querySelector("#mgaBody");
    body.innerHTML = `
      <button class="mga-back" id="mgaBack" title="Back">←</button>
      <p class="mga-sub">Forgot your password or username? Type the Gmail you connected and we'll find your accounts! 🔎</p>
      <form id="mgaFForm">
        <div class="mga-field"><span class="mga-ic">📧</span><input id="mgaFEmail" placeholder="Your connected Gmail" inputmode="email" autocapitalize="off" maxlength="60"></div>
        <button class="mga-go" id="mgaFGo" type="submit">🔎 Find my accounts</button>
      </form>
      <p class="mga-msg" id="mgaMsg"></p>
      <p class="mga-note">Note: a free game site like this can't actually send emails by itself, so instead of mailing you a link, it finds your accounts right here once you enter the matching Gmail.</p>`;
    body.querySelector("#mgaBack").onclick = () => { mode = "login"; authView(); };
    body.querySelector("#mgaFForm").onsubmit = (e) => { e.preventDefault(); findAccounts(); };
    setTimeout(() => { const i = $("mgaFEmail"); if (i) i.focus(); }, 40);
  }
  async function findAccounts() {
    const e = (($("mgaFEmail") || {}).value || "");
    if (!validEmail(e)) return msg("Type the Gmail you connected to your account.", "err");
    if (!fbUrl()) return msg("Can't reach the account server right now.", "err");
    const go = $("mgaFGo"); if (go) { go.disabled = true; go.textContent = "⏳ Searching…"; }
    const eh = await emailHash(e);
    const idx = await fbGet("emailIndex/" + eh);
    if (go) { go.disabled = false; go.textContent = "🔎 Find my accounts"; }
    const users = idx ? Object.keys(idx) : [];
    if (!users.length) return msg("No accounts are connected to that Gmail. 😿 Check the spelling, or Sign Up for a new one.", "err");
    pickView(users);
  }
  function pickView(users) {
    const body = ov.querySelector("#mgaBody");
    const rows = users.map((u) => `<button class="mga-pick" data-u="${esc(u)}">👤 ${esc(displayName(u))}</button>`).join("");
    body.innerHTML = `
      <button class="mga-back" id="mgaBack" title="Back">←</button>
      <p class="mga-sub">We found these accounts for that Gmail. Pick the one to reset: ✅</p>
      ${rows}
      <p class="mga-msg" id="mgaMsg"></p>`;
    body.querySelector("#mgaBack").onclick = () => forgotView();
    body.querySelectorAll(".mga-pick").forEach((b) => b.onclick = () => newPassView(b.dataset.u));
  }
  function newPassView(u) {
    const body = ov.querySelector("#mgaBody");
    body.innerHTML = `
      <button class="mga-back" id="mgaBack" title="Back">←</button>
      <p class="mga-sub">Make a new password for <b>${esc(displayName(u))}</b> 🔑</p>
      <form id="mgaNPForm">
        <div class="mga-field"><span class="mga-ic">🔒</span><input id="mgaNP" type="password" placeholder="New password" maxlength="40"></div>
        <div class="mga-field"><span class="mga-ic">🔒</span><input id="mgaNP2" type="password" placeholder="Type it again" maxlength="40"></div>
        <button class="mga-go" id="mgaNPGo" type="submit">✅ Set new password</button>
      </form>
      <p class="mga-msg" id="mgaMsg"></p>`;
    body.querySelector("#mgaBack").onclick = () => forgotView();
    body.querySelector("#mgaNPForm").onsubmit = async (e) => {
      e.preventDefault();
      const p1 = ($("mgaNP") || {}).value || "", p2 = ($("mgaNP2") || {}).value || "";
      if (p1.length < 4) return msg("Password must be at least 4 characters.", "err");
      if (p1 !== p2) return msg("The two passwords don't match.", "err");
      const go = $("mgaNPGo"); if (go) { go.disabled = true; go.textContent = "⏳ ..."; }
      const pass = await sha(u + ":" + p1 + ":" + SALT);
      const ok = await fbPut("accounts/" + u + "/pass", pass);
      if (!ok) { if (go) { go.disabled = false; go.textContent = "✅ Set new password"; } return msg("Couldn't update the password. Try again.", "err"); }
      msg("🎉 Password changed! Signing you in…", "ok");
      const rec = await fbGet("accounts/" + u);
      finish(u, (rec && rec.name) || u, (rec && rec.save) || {}, "🎉 Welcome back!");
    };
  }

  function displayName(u) { return (window.__mgaName && window.__mgaName[u]) || u; }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function msg(t, cls) { const m = $("mgaMsg"); if (m) { m.textContent = t; m.className = "mga-msg " + (cls || ""); } }
  function busy(on) { const g = $("mgaGo"); if (g) { g.disabled = on; if (on) g.textContent = "⏳ ..."; else g.textContent = mode === "login" ? "🔑 Log In" : "✨ Create My Account"; } }

  async function go() {
    const uRaw = ($("mgaUser") || {}).value || "", pw = ($("mgaPass") || {}).value || "";
    const u = uname(uRaw);
    if (u.length < 3 || u.length > 16) return msg("Username must be 3–16 letters, numbers or _ .", "err");
    if (pw.length < 4) return msg("Password must be at least 4 characters.", "err");
    if (!fbUrl()) return msg("Can't reach the account server. You can still Play as Guest.", "err");
    busy(true);
    try {
      const rec = await fbGet("accounts/" + u);
      const pass = await sha(u + ":" + pw + ":" + SALT);
      if (mode === "signup") {
        if (rec) { busy(false); return msg("That username is taken — try another! 😺", "err"); }
        const emailRaw = ($("mgaEmail") || {}).value || "";
        if (emailRaw && !validEmail(emailRaw)) { busy(false); return msg("That Gmail doesn't look right — fix it or leave it blank.", "err"); }
        let cur = {}; try { cur = JSON.parse(ls.get(saveKey(profile())) || ls.get(SAVE_BASE) || "{}"); } catch (e) {}
        cur._ts = Date.now();
        const acct = { name: uRaw.trim().slice(0, 16), pass: pass, created: Date.now(), save: cur };
        let eh = null; if (emailRaw) { eh = await emailHash(emailRaw); acct.eh = eh; }
        const ok = await fbPut("accounts/" + u, acct);
        if (eh) await fbPut("emailIndex/" + eh + "/" + u, 1);
        busy(false);
        if (!ok) return msg("Couldn't create the account. Check your connection.", "err");
        finish(u, uRaw.trim().slice(0, 16), cur, "🎉 Account created! Welcome, " + esc(uRaw.trim()) + "!");
      } else {
        if (!rec) { busy(false); return msg('No account named “' + esc(uRaw.trim()) + "”. Tap ✨ Sign Up!", "err"); }
        if (pass !== rec.pass) { busy(false); return msg("Wrong password — try again! 🙀", "err"); }
        busy(false);
        finish(u, rec.name || u, rec.save || {}, "🐾 Welcome back, " + esc(rec.name || u) + "!");
      }
    } catch (e) { busy(false); msg("Something went wrong. Try again.", "err"); }
  }

  function finish(u, name, saveObj, okMsg) {
    ls.set("mg-profile", u); ls.set("mg-auth", u); ls.del("mg-guest");
    try { ls.set("mg-names", JSON.stringify(Object.assign(JSON.parse(ls.get("mg-names") || "{}"), { [u]: name }))); } catch (e) {}
    try { ls.set(saveKey(u), JSON.stringify(saveObj || {})); } catch (e) {}
    msg(okMsg, "ok");
    setTimeout(() => location.reload(), 950);
  }

  function show() {
    if (!ov) build();
    const wasHidden = ov.classList.contains("hidden");
    ov.classList.remove("hidden");
    if (wasHidden) { if (!authUser()) mode = "login"; authView(); setTimeout(() => { const i = $("mgaUser"); if (i) i.focus(); }, 60); }
  }
  function hide() { if (ov) ov.classList.add("hidden"); }

  // ---------- "Hello! [Username]" greeting, top-right ----------
  function renderHello() {
    const bar = document.querySelector(".topbar"); if (!bar) return;
    let el = document.getElementById("mgaHello");
    const u = authUser();
    if (!u) { if (el) el.style.display = "none"; return; }
    if (!el) {
      el = document.createElement("button"); el.id = "mgaHello"; el.className = "mga-hello"; el.title = "Your account";
      const ref = document.getElementById("accountBtn");
      if (ref && ref.parentNode) ref.parentNode.insertBefore(el, ref); else bar.appendChild(el);
      el.onclick = show;
    }
    el.style.display = "";
    const img = (document.querySelector(".logo-img") || {}).src || "maxwell.png";
    el.innerHTML = '<img src="' + img + '" alt=""> Hello! ' + esc(displayName(u));
  }

  // ---------- cloud save sync (only when logged in) ----------
  function startSync() {
    const u = profile(); if (!fbUrl() || !u || authUser() !== u) return;
    let last = "";
    function push() {
      let raw = ls.get(saveKey(u)); if (!raw) return; if (raw === last) return; last = raw;
      let obj; try { obj = JSON.parse(raw); } catch (e) { return; }
      obj._ts = Date.now(); try { ls.set(saveKey(u), JSON.stringify(obj)); last = ls.get(saveKey(u)); } catch (e) {}
      fbPut("accounts/" + u + "/save", obj);
    }
    setInterval(push, 8000);
    window.addEventListener("pagehide", push);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") push(); });
    // pull newer progress from another device on load
    fbGet("accounts/" + u + "/save").then((rec) => {
      if (!rec) return;
      let local = {}; try { local = JSON.parse(ls.get(saveKey(u)) || "{}"); } catch (e) {}
      if ((rec._ts || 0) > (local._ts || 0) + 1500) { try { ls.set(saveKey(u), JSON.stringify(rec)); } catch (e) {} location.reload(); }
    });
  }

  // ---------- boot ----------
  function boot() {
    try { window.__mgaName = JSON.parse(ls.get("mg-names") || "{}"); } catch (e) { window.__mgaName = {}; }
    // Override the account button (👤) to open the cute screen
    const btn = $("accountBtn");
    if (btn) { btn.title = authUser() ? "Your account" : "Log in / Sign up"; btn.onclick = (e) => { e && e.stopPropagation && e.stopPropagation(); show(); }; btn.classList.toggle("logged", !!authUser()); }
    renderHello();
    startSync();
    // Auto-welcome on a device that isn't signed in (and hasn't chosen guest yet)
    if (!authUser() && !ls.get("mg-guest")) {
      const waitLoader = setInterval(() => {
        const loader = $("loader");
        const gone = !loader || loader.classList.contains("gone") || loader.style.display === "none" || getComputedStyle(loader).display === "none";
        if (gone) { clearInterval(waitLoader); setTimeout(show, 500); }
      }, 400);
      setTimeout(() => clearInterval(waitLoader), 20000);
    }
    window.MG_ACCOUNT = { show: show, hide: hide, user: authUser };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
