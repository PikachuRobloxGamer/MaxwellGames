// ===== MaxwellGames: Owner / GamesOn786 mode + live Admin Abuse + loading screen =====
// Codes are never stored as plain text, only as SHA-256 hashes.
// Live events go to everyone on the site through ntfy.sh (a free public messaging service).

(function () {
  const $ = (id) => document.getElementById(id);
  const MG = window.MG;

  // ---------- Settings ----------
  const SALT = "maxwellgames-owner-v1:";
  const ROLES = {
    owner: { hash: "03187c39b7ed90e6ad2efde77f3061ecb4ee920316ce29414fb281d31e8b9b55", name: "Pikachu Roblox Gamer", icon: "👑", title: "OWNER" },
    sami:  { hash: "62e6b6aa467740b2ba6e22844434c13e1086489c776310cebd213d64d71b5fe4", name: "GamesOn786",           icon: "💎", title: "GamesOn786" }
  };
  const TOPIC = "maxwellgames-prg-c3fba596c229d851";
  const NTFY = "https://ntfy.sh/" + TOPIC;
  const ROLE_KEY = "maxwellgames-owner";
  const CLIENT_ID = Math.random().toString(36).slice(2, 10);

  // ---------- Login ----------
  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function samiOff() { try { return localStorage.getItem("mg-sami-off") === "1"; } catch (e) { return false; } }
  function setSamiOff(v) { try { v ? localStorage.setItem("mg-sami-off", "1") : localStorage.removeItem("mg-sami-off"); } catch (e) {} }
  let role = null;
  try {
    const stored = localStorage.getItem(ROLE_KEY);
    role = Object.keys(ROLES).find((r) => ROLES[r].hash === stored) || null;
  } catch (e) {}
  if (role === "sami" && samiOff()) { role = null; try { localStorage.removeItem(ROLE_KEY); } catch (e) {} }

  // Everyone gets a fun nickname (never a real email).
  let nick;
  try { nick = localStorage.getItem("mg-nick"); } catch (e) {}
  if (!nick) { nick = "Trainer-" + Math.floor(1000 + Math.random() * 9000); try { localStorage.setItem("mg-nick", nick); } catch (e) {} }
  window.MG_setNick = function () {
    const v = prompt("Pick a nickname (shown to the owner, keep it clean!):", nick);
    if (v && v.trim()) { nick = v.trim().slice(0, 20); try { localStorage.setItem("mg-nick", nick); } catch (e) {} MG.toast("🏷️", "Nickname set", nick); }
  };
  const isAdmin = () => !!role;
  const isOwner = () => role === "owner";

  function updateLock() {
    const r = role && ROLES[role];
    $("lockBtn").textContent = r ? r.icon : "🔒";
    $("lockBtn").title = r ? "Open the admin panel" : "Owner login";
    $("lockBtn").className = "lock-btn " + (role || "");
    document.body.classList.toggle("is-owner", role === "owner");
    document.body.classList.toggle("is-sami", role === "sami");
    document.querySelectorAll(".owner-only").forEach((el) => el.classList.toggle("hidden", !isOwner()));
    document.querySelectorAll(".sami-note").forEach((el) => el.classList.toggle("hidden", role !== "sami"));
    $("adminTitle").textContent = role === "sami" ? "GamesOn786 Admin Panel" : "Owner Admin Panel";
    $("adminIcon").textContent = r ? r.icon : "👑";
  }
  $("lockBtn").onclick = () => {
    if (isAdmin()) openAdmin();
    else { $("lockModal").classList.remove("hidden"); $("lockMsg").textContent = ""; $("lockInput").value = ""; setTimeout(() => $("lockInput").focus(), 50); }
  };
  $("lockCancel").onclick = () => $("lockModal").classList.add("hidden");
  $("lockForm").onsubmit = async (e) => {
    e.preventDefault();
    let hash = "";
    try { hash = await sha256(SALT + $("lockInput").value); } catch (err) { $("lockMsg").textContent = "This browser can't check codes here."; return; }
    const found = Object.keys(ROLES).find((r) => ROLES[r].hash === hash);
    if (found === "sami" && samiOff()) { $("lockMsg").textContent = "⛔ The owner turned off GamesOn786 mode."; $("lockInput").value = ""; return; }
    if (found) {
      role = found;
      try { localStorage.setItem(ROLE_KEY, hash); } catch (err) {}
      $("lockModal").classList.add("hidden");
      updateLock();
      MG.setRole(role);
      welcome(true);
      openAdmin();
    } else {
      $("lockMsg").textContent = "❌ Wrong code.";
      $("lockInput").value = "";
      const box = $("lockModal").querySelector(".lock-box");
      box.classList.remove("shake-x"); void box.offsetWidth; box.classList.add("shake-x");
    }
  };
  $("logoutBtn").onclick = () => {
    role = null;
    try { localStorage.removeItem(ROLE_KEY); } catch (e) {}
    $("adminModal").classList.add("hidden");
    updateLock();
    MG.setRole(null);
    MG.toast("🔒", "Admin mode locked", "");
  };

  function welcome(big) {
    if (!role) return;
    const r = ROLES[role];
    MG.particles.burst(40);
    if (big) {
      MG.floatText(`${r.icon} WELCOME BACK, ${role === "owner" ? "OWNER" : "GAMESON786"} ${r.icon}`, innerWidth / 2, innerHeight / 2, "big");
      MG.meow();
    }
    MG.toast(r.icon, role === "owner" ? "Owner mode ON" : "GamesOn786 mode ON", role === "owner" ? "You own everything. Check the shop for owner-only stuff!" : "Admin powers unlocked. Abuses will say GamesOn786!");
  }

  // ---------- Live connection (Firebase if set up, else ntfy.sh) ----------
  let serverOffset = 0;
  const seen = new Set();
  const nowSec = () => Date.now() / 1000 + serverOffset;
  let lastStatusText = "connecting…", lastStatusOk = false;
  function setStatus(text, ok) {
    lastStatusText = text; lastStatusOk = ok;
    ["liveStatus", "liveStatus2"].forEach((id) => { const el = document.getElementById(id); if (el) { el.textContent = text; el.style.color = ok ? "#3ee08f" : "#ff7a7a"; } });
  }
  function getLiveMode() {
    let m; try { m = localStorage.getItem("mg-live-mode"); } catch (e) {}
    if (m === "firebase" || m === "ntfy") return m;
    return (window.MG_FIREBASE_CONFIG && window.MG_FIREBASE_CONFIG.databaseURL) ? "firebase" : "ntfy";
  }
  function setLiveMode(m) { try { localStorage.setItem("mg-live-mode", m); } catch (e) {} location.reload(); }
  function updateModeButtons() {
    const m = getLiveMode();
    document.querySelectorAll(".live-mode-btn").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  }
  window.MG_LIVE = {
    getMode: getLiveMode,
    setMode: setLiveMode,
    refresh: () => { const el = document.getElementById("liveStatus2"); if (el) { el.textContent = lastStatusText; el.style.color = lastStatusOk ? "#3ee08f" : "#ff7a7a"; } updateModeButtons(); }
  };
  let publishFn = null;
  let lastWarn = 0;
  function warnFail() {
    if (!isAdmin() || Date.now() - lastWarn < 30000) return;
    lastWarn = Date.now();
    MG.toast("⚠️", "Couldn't reach everyone", "Only you saw that. Check your connection.");
  }
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

  // Several live servers run together so at least one gets through.
  const transports = [];
  function refreshStatus() {
    const on = transports.filter((t) => t.connected).map((t) => t.name);
    if (on.length) setStatus("connected ✅ (" + on.join(" + ") + ") — everyone online sees your powers", true);
    else setStatus("connecting to the live server… if this stays, your network blocks it. Firebase (in live-config.js) is the surest fix.", false);
  }
  async function connect() {
    const mode = getLiveMode();
    const FB = window.MG_FIREBASE_CONFIG;
    if (mode === "firebase") {
      if (FB && FB.databaseURL) {
        try { await connectFirebase(FB); return; }
        catch (e) { console.error(e); setStatus("Home (Firebase) couldn't connect. If you're at school, switch to 💻 Chromebook (ntfy.sh).", false); return; }
      }
      setStatus("Home (Firebase) is selected but no Firebase config was found — upload live-config.js, or switch to 💻 Chromebook (ntfy.sh).", false);
      return;
    }
    // Chromebook (ntfy.sh) mode: free servers
    publishFn = (msg) => { transports.forEach((t) => { try { t.publish(msg); } catch (e) {} }); if (!transports.some((t) => t.connected)) warnFail(); };
    startNtfy();
    startMqtt();
  }

  // Free public MQTT broker over WebSocket — no setup, different network path than ntfy.
  function startMqtt() {
    const t = { name: "server A", connected: false, publish: () => {} };
    transports.push(t);
    refreshStatus();
    loadScript("https://unpkg.com/mqtt@5.3.5/dist/mqtt.min.js").then(() => {
      if (!window.mqtt) { refreshStatus(); return; }
      let client;
      try { client = window.mqtt.connect("wss://broker.emqx.io:8084/mqtt", { clientId: "mg_" + CLIENT_ID + Math.random().toString(16).slice(2, 6), reconnectPeriod: 5000, connectTimeout: 9000, clean: true }); }
      catch (e) { refreshStatus(); return; }
      t.publish = (msg) => { try { client.publish(TOPIC, JSON.stringify(msg)); } catch (e) {} };
      client.on("connect", () => { t.connected = true; try { client.subscribe(TOPIC); } catch (e) {} refreshStatus(); });
      client.on("reconnect", refreshStatus);
      client.on("close", () => { t.connected = false; refreshStatus(); });
      client.on("offline", () => { t.connected = false; refreshStatus(); });
      client.on("error", () => { t.connected = false; refreshStatus(); });
      client.on("message", (topic, payload) => {
        let msg; try { msg = JSON.parse(payload.toString()); } catch (e) { return; }
        if (!msg || msg.k !== "mg1" || seen.has(msg.id)) return;
        seen.add(msg.id); msg.at = Math.floor(nowSec()); handle(msg, 0);
      });
    }).catch(() => refreshStatus());
  }

  function startNtfy() {
    const t = { name: "server B", connected: false, publish: (msg) => fetch(NTFY, { method: "POST", body: JSON.stringify(msg) }).catch(() => {}) };
    transports.push(t);
    refreshStatus();
    if (!window.EventSource) return;
    const es = new EventSource(NTFY + "/sse?since=10m");
    es.addEventListener("open", (e) => { try { const d = JSON.parse(e.data); serverOffset = d.time - Date.now() / 1000; } catch (err) {} t.connected = true; refreshStatus(); });
    es.onopen = () => { t.connected = true; refreshStatus(); };
    es.onmessage = (e) => {
      let d, msg;
      try { d = JSON.parse(e.data); } catch (err) { return; }
      if (d.event && d.event !== "message") return;
      try { msg = JSON.parse(d.message); } catch (err) { return; }
      if (!msg || msg.k !== "mg1" || seen.has(msg.id)) return;
      seen.add(msg.id);
      handle(msg, Math.max(0, nowSec() - (d.time || nowSec())));
    };
    es.onerror = () => { t.connected = false; refreshStatus(); };
  }

  async function connectFirebase(FB) {
    if (!FB.databaseURL) { setStatus("Firebase setup problem: your config has no \"databaseURL\". Add it from the Realtime Database page.", false); throw new Error("no databaseURL"); }
    const V = "10.12.5";
    await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-database-compat.js`);
    setStatus("connecting to Firebase...", false);
    firebase.initializeApp(FB);
    const db = firebase.database();
    let everConnected = false, blocked = false;
    db.ref(".info/serverTimeOffset").on("value", (s) => { serverOffset = (s.val() || 0) / 1000; });
    db.ref(".info/connected").on("value", (s) => { if (s.val()) { everConnected = true; if (!blocked) setStatus("connected ✅ (Firebase — everyone online sees your powers)", true); } else if (!blocked) setStatus("connecting to Firebase...", false); });
    const msgs = db.ref("mg/msgs");
    msgs.limitToLast(50).on("child_added", (snap) => {
      const m = snap.val(); if (!m || m.k !== "mg1" || seen.has(m.id)) return;
      seen.add(m.id);
      const t = m.ts || (m.at ? m.at * 1000 : Date.now());
      handle(m, Math.max(0, nowSec() - t / 1000));
    }, (err) => { blocked = true; setStatus("Firebase connected, but your database RULES are blocking it. Open Realtime Database → Rules and set read and write to true.", false); });
    publishFn = (msg) => { const m = Object.assign({}, msg, { ts: firebase.database.ServerValue.TIMESTAMP }); return msgs.push(m).catch(() => { setStatus("Firebase can't save messages — check your database Rules allow write.", false); warnFail(); }); };
    // If nothing connected after a while, tell them the likely fixes.
    setTimeout(() => { if (!everConnected && !blocked) setStatus("Firebase isn't connecting. Check: (1) databaseURL is exactly right, (2) the Realtime Database was created, (3) rules allow read/write.", false); }, 9000);
    // owner tidies old messages now and then so the database stays small
    if (isOwner()) setInterval(() => { msgs.limitToLast(400).once("value", (s) => { const keys = Object.keys(s.val() || {}); if (keys.length > 300) msgs.limitToLast(300).once("value", (keep) => { const keepSet = new Set(Object.keys(keep.val() || {})); keys.forEach((k) => { if (!keepSet.has(k)) msgs.child(k).remove(); }); }); }); }, 120000);
  }



  // Cooldown so nobody can spam powers and break the live connection.
  const SPAMMY = new Set(["fish","jackpot","golden","golden2","giant","nyan","parade","tornado","maxwells","gift","xp","crowns","confetti","boom","quake","disco","spin","flip","bighead","meow","poke","freeze","give","announce"]);
  const COOLDOWN_MS = 1200;
  let lastAct = 0;
  function cooled() {
    const now = Date.now();
    if (now - lastAct < COOLDOWN_MS) { MG.toast("⏳", "Slow down!", "Wait a moment between powers (stops the connection breaking)."); return false; }
    lastAct = now; return true;
  }

  function send(msg, localToo = true) {
    if (SPAMMY.has(msg.t) && !cooled()) return;
    msg.k = "mg1";
    msg.id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    msg.at = Math.floor(nowSec());
    msg.by = role || "";
    seen.add(msg.id);
    if (localToo) handle(msg, 0);
    if (publishFn) publishFn(msg); else warnFail();
  }

  // ---------- Admin Abuse ----------
  let abuseEnd = 0, abuseTimer = null, abuseMult = 2, abuseBy = "owner";
  const abuseActive = () => nowSec() < abuseEnd;

  // ---- Maxwell the Cat Theme music (official YouTube embed) ----
  const MUSIC_ID = "YRvOePz2OqQ", MUSIC_START = 149;
  let ytPlayer = null, ytReady = false, jukeboxOn = false, musicMuted = false;
  (function initMusic() {
    const d = document.createElement("div"); d.id = "ytmusic";
    d.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;";
    document.body.appendChild(d);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) try { prev(); } catch (e) {}
      ytPlayer = new YT.Player("ytmusic", {
        videoId: MUSIC_ID,
        playerVars: { autoplay: 0, start: MUSIC_START, controls: 0, disablekb: 1, playsinline: 1, fs: 0 },
        events: {
          onReady: () => { ytReady = true; refreshMusic(); },
          onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED) { try { ytPlayer.seekTo(MUSIC_START); ytPlayer.playVideo(); } catch (x) {} } }
        }
      });
    };
    loadScript("https://www.youtube.com/iframe_api").catch(() => {});
  })();
  function musicShouldPlay() { return !musicMuted && (jukeboxOn || abuseActive()); }
  function refreshMusic() {
    if (ytReady && ytPlayer) {
      try { if (musicShouldPlay()) { ytPlayer.unMute(); ytPlayer.setVolume(45); ytPlayer.playVideo(); } else { ytPlayer.pauseVideo(); } } catch (e) {}
    }
    const jb = $("jukeboxBtn");
    if (jb) { jb.classList.toggle("on", jukeboxOn); jb.textContent = jukeboxOn ? "🎵" : "🎶"; jb.title = jukeboxOn ? "Stop the Maxwell theme" : "Play the Maxwell the Cat Theme"; }
    const ab = $("abuseSound");
    if (ab) ab.textContent = musicMuted ? "🔇 Music off" : "🔊 Music on";
  }
  const jbBtn = $("jukeboxBtn");
  if (jbBtn) jbBtn.onclick = () => { jukeboxOn = !jukeboxOn; musicMuted = false; if (jukeboxOn) MG.markJukebox(); refreshMusic(); };
  $("abuseSound").onclick = () => { musicMuted = !musicMuted; refreshMusic(); };
  document.addEventListener("pointerdown", () => { if (musicShouldPlay()) refreshMusic(); }, { passive: true });

  function startAbuse(endsAt, mult, by) {
    const fresh = !abuseActive();
    abuseEnd = endsAt; abuseMult = mult; abuseBy = by === "sami" ? "sami" : "owner";
    MG.setEventMult(mult);
    $("abuseMult").textContent = mult + "x";
    $("abuseBy").textContent = ROLES[abuseBy].name;
    $("abuseBar").className = "abuse-bar by-" + abuseBy;
    document.documentElement.classList.add("party", "abuse");
    MG.particles.partyMode(99999);
    refreshMusic();
    if (fresh) {
      MG.particles.burst(60);
      MG.toast("🚨", `ADMIN ABUSE by ${ROLES[abuseBy].name}!`, `${mult}x treats! +10 🐟 just for being here.`);
      MG.addTreats(10);
      MG.sawAbuse();
    }
    clearInterval(abuseTimer);
    abuseTimer = setInterval(tickAbuse, 250);
    tickAbuse(); updatePowers();
  }
  function tickAbuse() {
    const left = Math.max(0, Math.ceil(abuseEnd - nowSec()));
    $("abuseTime").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
    if (left <= 0) endAbuse();
  }
  function endAbuse() {
    if (!abuseTimer && $("abuseBar").classList.contains("hidden")) return;
    clearInterval(abuseTimer); abuseTimer = null; abuseEnd = 0;
    MG.setEventMult(1);
    MG.particles.partyMode(0);
    $("abuseBar").classList.add("hidden");
    document.documentElement.classList.remove("party", "abuse");
    refreshMusic();
    MG.toast("🛑", "Admin Abuse is over", "Thanks for coming!");
    updatePowers();
  }

  // ---------- Powers ----------
  const POWERS = [
    { t: "fish",     icon: "🐟", name: "Fish Rain",        info: "+25 🐟 for everyone" },
    { t: "jackpot",  icon: "💰", name: "JACKPOT",          info: "+250 🐟 for everyone" },
    { t: "golden",   icon: "🌟", name: "Golden :3 Storm",  info: "30 golden :3s" },
    { t: "golden2",  icon: "✨", name: "MEGA Golden Storm", info: "80 golden :3s" },
    { t: "giant",    icon: "🐈‍⬛", name: "Giant Maxwell",    info: "Click him: +50 🐟" },
    { t: "nyan",     icon: "🌈", name: "Rainbow Flyby",    info: "Catch it: +30 🐟" },
    { t: "parade",   icon: "🎺", name: "Maxwell Parade",   info: "All 10 Maxwells march" },
    { t: "tornado",  icon: "🌪️", name: "Cat Tornado",      info: "Spinning Maxwells, +5 each" },
    { t: "maxwells", icon: "🐾", name: "Maxwell Swarm",    info: "Falling Maxwells, +5 each" },
    { t: "gift",     icon: "🎁", name: "Mystery Gifts",    info: "10-100 🐟 each" },
    { t: "xp",       icon: "⭐", name: "XP Boost",         info: "+100 🐟 & XP" },
    { t: "crowns",   icon: "👑", name: "Crown Rain",       info: "Everyone gets crowns for 20s" },
    { t: "confetti", icon: "🎉", name: "Confetti",         info: "Party time" },
    { t: "boom",     icon: "💥", name: "Deltarune Boom",   info: "Explosion + shake" },
    { t: "quake",    icon: "🫨", name: "Earthquake",       info: "Long screen shake" },
    { t: "disco",    icon: "🪩", name: "Disco Mode",       info: "Crazy colors 15s" },
    { t: "spin",     icon: "🌀", name: "Spin Everything",  info: "The site spins" },
    { t: "flip",     icon: "🙃", name: "Upside Down",      info: "Flip for 6s" },
    { t: "bighead",  icon: "🎈", name: "Wobble Mode",      info: "Everything wobbles 8s" },
    { t: "meow",     icon: "🙀", name: "MEOW Blast",       info: "Meow meow meow" },
    { t: "snow",     icon: "❄️", name: "Snow Storm",       info: "Let it snow" },
    { t: "fireworks",icon: "🎆", name: "Fireworks",        info: "Boom boom pow" },
    { t: "matrix",   icon: "💻", name: "Matrix Mode",      info: "Green code rain 12s" },
    { t: "rainbow",  icon: "🌈", name: "Rainbow Road",     info: "Rainbow sweeps the screen" },
    { t: "strobe",   icon: "🔆", name: "Strobe Party",     info: "Flashing lights 6s" },
    { t: "poke",     icon: "👻", name: "Pokémon Rain",     info: "Falling Pokémon: +30 🐟 each", role: "sami" },
    { t: "freezeall",icon: "🧊", name: "Freeze Everyone",  info: "Maxwell locks every screen" }
  ];
  function renderPowers() {
    const g = $("powerGrid");
    g.innerHTML = "";
    POWERS.forEach((p) => {
      if (p.role && !(role === p.role || role === "owner")) return;
      const b = document.createElement("button");
      b.className = "shop-item power";
      b.innerHTML = `<span class="si-icon"></span><span class="si-name"></span><span class="si-price"></span>`;
      b.querySelector(".si-icon").textContent = p.icon;
      b.querySelector(".si-name").textContent = p.name;
      b.querySelector(".si-price").textContent = p.info;
      b.onclick = () => { if (!abuseActive()) return; if (p.t === "freezeall") send({ t: "freeze", text: FREEZE_MSG }); else send({ t: p.t }); };
      g.appendChild(b);
    });
    updatePowers();
  }
  function updatePowers() {
    const on = abuseActive();
    document.querySelectorAll(".power, .needs-abuse").forEach((b) => (b.disabled = !on));
    $("powerHint").textContent = on ? "(click to use, everyone sees it!)" : "(start an Admin Abuse to use these)";
  }

  function handle(msg, age) {
    const byName = msg.by === "sami" ? ROLES.sami.name : ROLES.owner.name;
    if (msg.t === "abuse") {
      const endsAt = msg.at + Math.min(Number(msg.dur) || 60, 900);
      if (nowSec() < endsAt) startAbuse(endsAt, Math.min(Number(msg.mult) || 2, 10), msg.by);
      return;
    }
    if (msg.t === "abuse_end") { if (age < 600) endAbuse(); return; }
    if (age > 12) return;
    if (msg.t === "announce") { announce(String(msg.text || "").slice(0, 100), msg.style, byName); return; }
    if (msg.t === "rollcall") { if (msg.rid && !(rollcall && rollcall.rid === msg.rid)) setTimeout(() => post({ k: "mg1", id: Math.random().toString(36).slice(2), t: "here", rid: msg.rid, who: CLIENT_ID, nick: nick, at: Math.floor(nowSec()) }), Math.random() * 2500); return; }
    if (msg.t === "here") { if (rollcall && msg.rid === rollcall.rid && msg.who !== CLIENT_ID) { rollcall.people.set(msg.who, msg.nick || "Player"); $("rollCount").textContent = rollcall.people.size; renderWho(); } return; }
    if (msg.t === "setsami") { setSamiOff(!msg.on); if (!msg.on && role === "sami") { role = null; try { localStorage.removeItem(ROLE_KEY); } catch (e) {} updateLock(); MG.setRole(null); MG.toast("⛔", "Admin powers turned off", "The owner turned off your GamesOn786 mode."); $("adminModal").classList.add("hidden"); } if ($("samiState")) $("samiState").textContent = msg.on ? "ON" : "OFF (turned off by owner)"; return; }
    if (msg.t === "freeze") { if (age < 20 && (!msg.target || msg.target === CLIENT_ID)) showFreeze(msg.text); return; }
    if (msg.t === "unfreeze") { if (!msg.target || msg.target === CLIENT_ID) hideFreeze(); return; }
    if (!abuseActive()) return;
    const W = innerWidth, H = innerHeight;
    switch (msg.t) {
      case "fish": MG.particles.burst(50); MG.addTreats(25, W / 2, H / 3); MG.toast("🐟", "Fish Rain!", `+25 🐟 from ${byName}`); break;
      case "jackpot": MG.particles.burst(90); MG.addTreats(250, W / 2, H / 3); MG.floatText("💰 JACKPOT 💰", W / 2, H / 2, "big"); MG.boomSound(0.12); break;
      case "give": { const n = Math.max(1, Math.min(1000, Number(msg.n) || 0)); MG.addTreats(n, W / 2, H / 3); MG.toast("🎁", `+${n} 🐟`, `A gift from ${byName}!`); break; }
      case "golden": MG.particles.goldenStorm(30); MG.toast("🌟", "Golden :3 Storm!", "Click them for +10 each!"); break;
      case "golden2": MG.particles.goldenStorm(80); MG.toast("✨", "MEGA Golden Storm!", "SO MANY golden :3s!"); break;
      case "giant": giantMaxwell(); break;
      case "nyan": nyanFlyby(); break;
      case "parade": parade(); break;
      case "tornado": tornado(); break;
      case "gift": for (let i = 0; i < 6; i++) setTimeout(spawnGift, i * 400); MG.toast("🎁", "Mystery Gifts!", "Click the falling gifts!"); break;
      case "xp": MG.addTreats(100, W / 2, H / 3); MG.toast("⭐", "XP Boost!", "+100 🐟 & XP"); break;
      case "crowns": MG.particles.setStyle("o-crown"); MG.particles.burst(50); setTimeout(() => MG.particles.setStyle(MG.save.equip.particle), 20000); break;
      case "confetti": confetti(); break;
      case "boom": bigBoom(); break;
      case "quake": document.body.classList.add("quake"); setTimeout(() => document.body.classList.remove("quake"), 3000); break;
      case "disco": document.documentElement.classList.add("disco"); setTimeout(() => document.documentElement.classList.remove("disco"), 15000); break;
      case "spin": restartClass(document.body, "spin-all", 2100); break;
      case "flip": document.body.classList.add("flipped"); setTimeout(() => document.body.classList.remove("flipped"), 6000); break;
      case "bighead": document.body.classList.add("wobble"); setTimeout(() => document.body.classList.remove("wobble"), 8000); break;
      case "meow": MG.meow(); setTimeout(MG.meow, 250); setTimeout(MG.meow, 500); MG.floatText("MEOW!!!", W / 2, H / 2, "big"); break;
      case "maxwells": for (let i = 0; i < 12; i++) setTimeout(() => clickable(maxwellSrc(), 70, 5, "🐈‍⬛ +5"), i * 250); break;
      case "poke": pokeRain(); break;
      case "snow": snow(); break;
      case "fireworks": fireworks(); break;
      case "matrix": matrixRain(); break;
      case "rainbow": rainbowRoad(); break;
      case "strobe": document.documentElement.classList.add("strobe"); setTimeout(() => document.documentElement.classList.remove("strobe"), 6000); break;
    }
  }

  // ---- new visual powers ----
  function snow() {
    MG.toast("❄️", "SNOW STORM!", "");
    for (let i = 0; i < 90; i++) {
      const s = document.createElement("div"); s.className = "snowflake"; s.textContent = "❄";
      s.style.left = Math.random() * 100 + "vw";
      s.style.fontSize = 8 + Math.random() * 18 + "px";
      s.style.animationDuration = 4 + Math.random() * 5 + "s";
      s.style.animationDelay = Math.random() * 2 + "s";
      document.body.appendChild(s); setTimeout(() => s.remove(), 11000);
    }
  }
  function fireworks() {
    MG.toast("🎆", "FIREWORKS!", "");
    const colors = ["#ff5fa2", "#ffd84a", "#3ee08f", "#4fb3ff", "#b77bff", "#ff7a00", "#fff"];
    let shots = 0;
    const iv = setInterval(() => {
      const cx = innerWidth * (0.15 + Math.random() * 0.7), cy = innerHeight * (0.15 + Math.random() * 0.5);
      const col = colors[Math.floor(Math.random() * colors.length)];
      MG.boomSound(0.06);
      for (let i = 0; i < 26; i++) {
        const s = document.createElement("i"); s.className = "fw";
        const ang = (Math.PI * 2 * i) / 26, dist = 80 + Math.random() * 90;
        s.style.left = cx + "px"; s.style.top = cy + "px"; s.style.background = col;
        s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        s.style.setProperty("--dy", Math.sin(ang) * dist + "px");
        document.body.appendChild(s); setTimeout(() => s.remove(), 1200);
      }
      if (++shots >= 6) clearInterval(iv);
    }, 550);
  }
  function matrixRain() {
    MG.toast("💻", "MATRIX MODE", "");
    const c = document.createElement("canvas"); c.className = "matrix-cv";
    const ctx = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const cols = Math.floor(c.width / 16), yv = Array(cols).fill(0);
    const glyph = "01:3ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜ";
    const iv = setInterval(() => {
      ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#3ee08f"; ctx.font = "15px monospace";
      yv.forEach((y, i) => { ctx.fillText(glyph[Math.floor(Math.random() * glyph.length)], i * 16, y * 16); yv[i] = y * 16 > c.height && Math.random() > 0.975 ? 0 : y + 1; });
    }, 55);
    setTimeout(() => { clearInterval(iv); c.style.opacity = 0; setTimeout(() => c.remove(), 600); }, 12000);
  }
  function rainbowRoad() {
    MG.toast("🌈", "RAINBOW ROAD!", "");
    const r = document.createElement("div"); r.className = "rainbow-road";
    document.body.appendChild(r); setTimeout(() => r.remove(), 2600);
  }
  function restartClass(el, cls, ms) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); }
  function maxwellSrc() { const l = document.querySelector(".logo-img"); return l ? l.src : "maxwell.png"; }

  function clickable(src, size, reward, label) {
    const el = document.createElement("img");
    el.src = src; el.alt = "";
    el.className = "spawn";
    el.style.width = size + "px";
    el.style.left = Math.random() * (innerWidth - size) + "px";
    el.style.animationDuration = 5 + Math.random() * 4 + "s";
    el.onclick = (e) => { e.stopPropagation(); MG.addTreats(reward, e.clientX, e.clientY); if (label) MG.floatText(label, e.clientX, e.clientY - 24, "gold"); MG.meow(); el.remove(); };
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 10000);
  }
  function spawnGift() {
    const el = document.createElement("div");
    el.className = "spawn gift"; el.textContent = "🎁";
    el.style.left = Math.random() * (innerWidth - 60) + "px";
    el.style.animationDuration = 5 + Math.random() * 3 + "s";
    el.onclick = (e) => { e.stopPropagation(); const n = 10 + Math.floor(Math.random() * 91); MG.addTreats(n, e.clientX, e.clientY); MG.floatText("🎉 GIFT!", e.clientX, e.clientY - 24, "gold"); el.remove(); };
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 9000);
  }
  function giantMaxwell() {
    const el = document.createElement("img");
    el.src = maxwellSrc(); el.alt = "Giant Maxwell"; el.className = "giant-maxwell";
    el.onclick = (e) => { if (el.dataset.got) return; el.dataset.got = "1"; MG.addTreats(50, e.clientX, e.clientY); MG.floatText("GIANT MAXWELL +50!", e.clientX, e.clientY - 30, "gold"); MG.meow(); el.classList.add("caught"); };
    document.body.appendChild(el);
    MG.toast("🐈‍⬛", "GIANT MAXWELL!", "Click him before he leaves for +50 🐟");
    setTimeout(() => el.remove(), 9000);
  }
  function nyanFlyby() {
    const el = document.createElement("div");
    el.className = "nyan";
    el.innerHTML = `<span class="nyan-trail"></span><img alt="">`;
    el.querySelector("img").src = MG.tierImg(8);
    el.style.top = 90 + Math.random() * (innerHeight * 0.4) + "px";
    el.onclick = (e) => { if (el.dataset.got) return; el.dataset.got = "1"; MG.addTreats(30, e.clientX, e.clientY); MG.floatText("🌈 +30!", e.clientX, e.clientY - 24, "gold"); MG.meow(); el.classList.add("caught"); };
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 6500);
  }
  function parade() {
    MG.toast("🎺", "MAXWELL PARADE!", "Click each Maxwell for +5 🐟");
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const el = document.createElement("img");
        el.src = MG.tierImg(i); el.alt = ""; el.className = "parader";
        el.onclick = (e) => { if (el.dataset.got) return; el.dataset.got = "1"; MG.addTreats(5, e.clientX, e.clientY); MG.meow(); el.style.opacity = 0.4; };
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 9500);
      }, i * 500);
    }
  }
  function tornado() {
    const wrap = document.createElement("div");
    wrap.className = "tornado";
    for (let i = 0; i < 12; i++) {
      const el = document.createElement("img");
      el.src = MG.tierImg(i % 10); el.alt = "";
      el.style.setProperty("--a", (i * 30) + "deg");
      el.style.setProperty("--r", (60 + (i % 3) * 55) + "px");
      el.onclick = (e) => { e.stopPropagation(); MG.addTreats(5, e.clientX, e.clientY); MG.meow(); el.remove(); };
      wrap.appendChild(el);
    }
    document.body.appendChild(wrap);
    MG.toast("🌪️", "CAT TORNADO!", "Click the spinning Maxwells!");
    setTimeout(() => wrap.remove(), 9000);
  }
  function confetti() {
    const colors = ["#ff5fa2", "#ffd84a", "#3ee08f", "#4fb3ff", "#b77bff", "#ff7a00"];
    for (let i = 0; i < 120; i++) {
      const c = document.createElement("i");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 2 + Math.random() * 2.5 + "s";
      c.style.animationDelay = Math.random() * 0.8 + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5500);
    }
  }
  const boomAudio = new Audio("sounds/deltarune-explosion.mp3");
  function bigBoom() {
    try { const a = boomAudio.cloneNode(); a.volume = 0.9; a.play().catch(() => MG.boomSound(0.15)); } catch (e) {}
    const b = document.createElement("div");
    b.className = "big-boom";
    document.body.appendChild(b);
    document.body.classList.add("shake-screen");
    setTimeout(() => { b.remove(); document.body.classList.remove("shake-screen"); }, 900);
    MG.addTreats(5);
  }
  let announceTimer;
  function announce(text, style, byName) {
    if (!text) return;
    const el = $("announce");
    el.textContent = "📢 " + text;
    el.dataset.by = "— " + byName;
    el.className = "announce style-" + (["gold", "red", "blue", "rainbow"].includes(style) ? style : "gold");
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => el.classList.add("hidden"), 8000);
  }

  // ---------- Pokémon Rain ----------
  const POKE_IMGS = ["images/gengar.png"]; // more get added when PNGs are sent
  function pokeRain() {
    MG.toast("👻", "POKÉMON RAIN!", "Catch the Pokémon for +30 🐟 each!");
    for (let i = 0; i < 16; i++) {
      setTimeout(() => {
        const el = document.createElement("img");
        el.src = POKE_IMGS[i % POKE_IMGS.length]; el.alt = "Pokémon"; el.className = "spawn poke";
        el.style.width = 64 + Math.random() * 30 + "px";
        el.style.left = Math.random() * (innerWidth - 80) + "px";
        el.style.animationDuration = 5 + Math.random() * 4 + "s";
        el.onclick = (e) => { e.stopPropagation(); MG.addTreats(30, e.clientX, e.clientY); MG.floatText("👻 +30!", e.clientX, e.clientY - 24, "gold"); MG.meow(); el.remove(); };
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 10000);
      }, i * 280);
    }
  }

  // ---------- Freeze (escapable prank on our own site) ----------
  const FREEZE_MSG = "Your screen is blocked right now! Ask Zaiden at school (zaiden.hasan.088@k12.friscoisd.org) or zaiduh786@gmail.com to unblock it!";
  let frozen = false;
  function showFreeze(text) {
    if (frozen) return;
    frozen = true;
    const o = document.createElement("div");
    o.id = "freeze"; o.className = "freeze";
    o.innerHTML = `
      <div class="freeze-stage">
        <div class="freeze-bubble"></div>
        <img class="freeze-cat" alt="Maxwell">
      </div>
      <p class="freeze-hint">(click anywhere to unlock)</p>`;
    o.querySelector(".freeze-cat").src = maxwellSrc();
    o.querySelector(".freeze-bubble").textContent = text || FREEZE_MSG;
    document.body.appendChild(o);
    let n = 0;
    o._say = setInterval(() => { if (n++ % 2 === 0) MG.meow(); }, 1400);
    o.addEventListener("click", () => hideFreeze());
  }
  function hideFreeze() {
    const o = $("freeze");
    if (!o) { frozen = false; return; }
    clearInterval(o._say);
    o.classList.add("swoop"); // Maxwell swoops up slowly, then everything comes back
    setTimeout(() => { o.remove(); frozen = false; }, 1500);
  }

  // ---------- Who's online ----------
  let rollcall = null;
  function renderWho() {
    const box = $("whoList");
    if (!box || !rollcall) return;
    box.innerHTML = "";
    rollcall.people.forEach((nm, id) => {
      const row = document.createElement("div");
      row.className = "who-row";
      row.innerHTML = `<span class="who-name">👤 </span><button class="btn who-freeze">🧊 Freeze</button>`;
      row.querySelector(".who-name").appendChild(document.createTextNode(nm));
      row.querySelector(".who-freeze").onclick = () => { send({ t: "freeze", target: id, text: FREEZE_MSG }, false); MG.toast("🧊", "Froze " + nm, "Maxwell is on their screen!"); };
      box.appendChild(row);
    });
    if (!rollcall.people.size) box.innerHTML = '<p class="panel-note">Nobody else online yet (or they need to be on the site right now).</p>';
  }
  $("rollBtn").onclick = () => {
    if (!isAdmin()) return;
    rollcall = { rid: Math.random().toString(36).slice(2), people: new Map() };
    $("rollCount").textContent = "0";
    $("rollMsg").textContent = "Counting... (takes about 5 seconds)";
    renderWho();
    send({ t: "rollcall", rid: rollcall.rid }, false);
    setTimeout(() => { if (rollcall) $("rollMsg").textContent = `${rollcall.people.size} other ${rollcall.people.size === 1 ? "person" : "people"} online`; }, 5500);
  };
  const unfreezeAllBtn = $("unfreezeAll"); if (unfreezeAllBtn) unfreezeAllBtn.onclick = () => { if (isAdmin()) send({ t: "unfreeze" }); };
  const samiToggle = $("samiToggle"); if (samiToggle) samiToggle.onclick = () => { if (!isOwner()) return; const turnOn = samiOff(); send({ t: "setsami", on: turnOn }); MG.toast(turnOn ? "✅" : "⛔", turnOn ? "Sami's powers ON" : "Sami's powers OFF", ""); if ($("samiState")) $("samiState").textContent = turnOn ? "ON" : "OFF (turned off by owner)"; };

  // ---------- Admin panel ----------
  function openAdmin() { $("adminModal").classList.remove("hidden"); renderPowers(); updateLock(); fillTierSel(); }
  $("adminClose").onclick = () => $("adminModal").classList.add("hidden");
  $("adminModal").addEventListener("click", (e) => { if (e.target.id === "adminModal") $("adminModal").classList.add("hidden"); });
  $("abuseStart").onclick = () => { if (isAdmin()) send({ t: "abuse", dur: Number($("abuseDur").value), mult: Number($("abuseMultSel").value) }); };
  $("abuseExtend").onclick = () => {
    if (!isAdmin() || !abuseActive()) return;
    const left = abuseEnd - nowSec();
    send({ t: "abuse", dur: Math.round(left + 60), mult: abuseMult });
    MG.toast("⏱️", "+1 minute!", "Admin Abuse extended.");
  };
  $("abuseStop").onclick = () => { if (isAdmin()) send({ t: "abuse_end" }); };
  $("giveAllForm").onsubmit = (e) => {
    e.preventDefault();
    const n = Math.max(1, Math.min(1000, Number($("giveAllN").value) || 0));
    if (isAdmin() && abuseActive()) send({ t: "give", n });
  };
  $("announceForm").onsubmit = (e) => {
    e.preventDefault();
    const text = $("announceText").value.trim().slice(0, 100);
    if (isAdmin() && text) { send({ t: "announce", text, style: $("announceStyle").value }); $("announceText").value = ""; }
  };
  $("giveMe").onclick = () => { if (isAdmin()) { MG.give(1000); MG.toast(ROLES[role].icon, "+1000 🐟", "Admin perks!"); } };
  $("maxMe").onclick = () => { if (isAdmin()) { MG.maxLevel(); MG.toast(ROLES[role].icon, "Level 10!", "Admin perks!"); } };
  $("allAch").onclick = () => { if (isOwner()) { MG.unlockAllAch(); MG.toast("👑", "All achievements unlocked!", "Owner perks!"); } };
  function fillTierSel() {
    const sel = $("tierSel");
    sel.innerHTML = "";
    MG.skinList().forEach((sk) => { const o = document.createElement("option"); o.value = sk.id; o.textContent = sk.name; sel.appendChild(o); });
  }
  $("setTier").onclick = () => {
    if (!isAdmin()) return;
    const sel = MG.skinList().find((s) => s.id === $("tierSel").value);
    const name = sel ? sel.name.replace(/^[^ ]+ /, "") : "Maxwell";
    MG.pickAscension($("tierSel").value, `${ROLES[role].icon} Admin powers! Your Maxwell is now ${sel ? sel.name.replace(/^[^\w]+\s*/, "") : "set"}!`);
    $("adminModal").classList.add("hidden");
  };
  $("resetMe").onclick = (e) => {
    if (!isAdmin()) return;
    const b = e.currentTarget;
    if (b.dataset.sure) { MG.resetSave(); MG.setRole(role); b.textContent = "Reset my save"; delete b.dataset.sure; MG.toast("🧹", "Save reset", ""); }
    else { b.dataset.sure = "1"; b.textContent = "Click again to reset"; }
  };
  fillTierSel();
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { $("adminModal").classList.add("hidden"); $("lockModal").classList.add("hidden"); } });

  // ---------- Loading screen ----------
  const TIPS = [
    "Tip: click the falling :3s for treats!",
    "Tip: golden :3s are worth 10 treats.",
    "Tip: pet Maxwell (the logo) for meows and treats.",
    "Tip: reach Level 10 to ascend your Maxwell.",
    "Tip: Inverted Maxwell is the final form... then Rebirth!",
    "Tip: when an Admin Abuse starts, everyone gets bonus treats.",
    "Tip: subscribe to Pikachu Roblox Gamer and Games On!",
    "Tip: there are secret codes hidden on this site...",
    "Tip: the Soundboard has over 350 sounds."
  ];
  function runLoader() {
    const L = $("loader");
    if (!L) return;
    const r = role && ROLES[role];
    $("loaderCat").src = maxwellSrc();
    if (r) { $("loaderHello").textContent = `${r.icon} Welcome back, ${r.name} ${r.icon}`; L.classList.add("loader-" + role); }
    $("loaderTip").textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
    let p = 0;
    const steps = setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 9);
      $("loaderFill").style.width = p + "%";
      if (p >= 100) {
        clearInterval(steps);
        const go = $("loaderGo");
        go.disabled = false;
        go.textContent = "▶ CLICK TO PLAY";
        go.focus();
      }
    }, 90);
    function close() {
      if ($("loaderGo").disabled) return;
      L.classList.add("gone");
      setTimeout(() => L.remove(), 600);
      MG.meow();
      if (role) welcome(false);
      refreshMusic();
    }
    $("loaderGo").onclick = close;
    L.addEventListener("click", (e) => { if (e.target === L) close(); });
    document.addEventListener("keydown", function k(e) { if ((e.key === "Enter" || e.key === " ") && document.getElementById("loader")) { e.preventDefault(); close(); } });
  }

  // ---------- Start ----------
  updateLock();
  if (role) MG.setRole(role);
  runLoader();
  setStatus("connecting...", false);
  connect();
})();
