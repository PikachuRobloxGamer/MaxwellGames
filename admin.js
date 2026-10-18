// ===== MaxwellGames: Owner mode + live Admin Abuse =====
// The owner unlocks admin powers with a secret code (only its SHA-256 hash is stored here).
// Admin Abuse events go out live to everyone on the site through ntfy.sh,
// a free public messaging service, so every visitor sees them at the same time.

(function () {
  const $ = (id) => document.getElementById(id);
  const MG = window.MG;

  // ---------- Settings ----------
  const OWNER_HASH = "03187c39b7ed90e6ad2efde77f3061ecb4ee920316ce29414fb281d31e8b9b55";
  const SALT = "maxwellgames-owner-v1:";
  const TOPIC = "maxwellgames-prg-c3fba596c229d851";
  const NTFY = "https://ntfy.sh/" + TOPIC;
  const OIIA_URL = "https://www.myinstants.com/media/sounds/oiia-oiia-sound.mp3";
  const OWNER_KEY = "maxwellgames-owner";

  // ---------- Owner login ----------
  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let isOwner = false;
  try { isOwner = localStorage.getItem(OWNER_KEY) === OWNER_HASH; } catch (e) {}

  function updateLock() {
    $("lockBtn").textContent = isOwner ? "👑" : "🔒";
    $("lockBtn").title = isOwner ? "Open the admin panel" : "Owner login";
    $("lockBtn").classList.toggle("owner", isOwner);
  }
  $("lockBtn").onclick = () => {
    if (isOwner) openAdmin();
    else { $("lockModal").classList.remove("hidden"); $("lockMsg").textContent = ""; $("lockInput").value = ""; setTimeout(() => $("lockInput").focus(), 50); }
  };
  $("lockCancel").onclick = () => $("lockModal").classList.add("hidden");
  $("lockForm").onsubmit = async (e) => {
    e.preventDefault();
    let hash = "";
    try { hash = await sha256(SALT + $("lockInput").value); } catch (err) { $("lockMsg").textContent = "This browser can't check the code here."; return; }
    if (hash === OWNER_HASH) {
      isOwner = true;
      try { localStorage.setItem(OWNER_KEY, OWNER_HASH); } catch (err) {}
      $("lockModal").classList.add("hidden");
      updateLock();
      MG.toast("👑", "Owner mode unlocked!", "Welcome back, Pikachu Roblox Gamer.");
      openAdmin();
    } else {
      $("lockMsg").textContent = "❌ Wrong code.";
      $("lockInput").value = "";
      $("lockModal").querySelector(".lock-box").classList.remove("shake-x");
      void $("lockModal").offsetWidth;
      $("lockModal").querySelector(".lock-box").classList.add("shake-x");
    }
  };
  $("logoutBtn").onclick = () => {
    isOwner = false;
    try { localStorage.removeItem(OWNER_KEY); } catch (e) {}
    $("adminModal").classList.add("hidden");
    updateLock();
    MG.toast("🔒", "Owner mode locked", "");
  };

  // ---------- Live connection ----------
  let serverOffset = 0;          // server time minus our time (seconds)
  let live = false;
  const seen = new Set();
  const nowSec = () => Date.now() / 1000 + serverOffset;

  function setStatus(text, ok) {
    live = ok;
    $("liveStatus").textContent = text;
    $("liveStatus").style.color = ok ? "#3ee08f" : "#ff7a7a";
  }

  function connect() {
    if (!window.EventSource) { setStatus("not supported in this browser", false); return; }
    const es = new EventSource(NTFY + "/sse?since=10m");
    es.addEventListener("open", (e) => {
      try { const d = JSON.parse(e.data); serverOffset = d.time - Date.now() / 1000; } catch (err) {}
      setStatus("connected ✅ (everyone online sees your powers)", true);
    });
    es.onopen = () => setStatus("connected ✅ (everyone online sees your powers)", true);
    es.onmessage = (e) => {
      let d, msg;
      try { d = JSON.parse(e.data); } catch (err) { return; }
      if (d.event && d.event !== "message") return;
      try { msg = JSON.parse(d.message); } catch (err) { return; }
      if (!msg || msg.k !== "mg1" || seen.has(msg.id)) return;
      seen.add(msg.id);
      handle(msg, Math.max(0, nowSec() - (d.time || nowSec())));
    };
    es.onerror = () => setStatus("not connected ❌ (your network may block ntfy.sh)", false);
  }

  let lastWarn = 0;
  function send(msg) {
    msg.k = "mg1";
    msg.id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    msg.at = Math.floor(nowSec());
    seen.add(msg.id);
    handle(msg, 0); // show it to the owner right away
    fetch(NTFY, { method: "POST", body: JSON.stringify(msg) })
      .catch(() => {
        if (Date.now() - lastWarn < 30000) return;
        lastWarn = Date.now();
        MG.toast("⚠️", "Couldn't reach everyone", "Only you saw that. This network may block ntfy.sh.");
      });
  }

  // ---------- Admin Abuse ----------
  const oiia = new Audio(OIIA_URL);
  oiia.loop = true;
  oiia.volume = 0.5;
  let soundOn = true;
  let abuseEnd = 0, abuseTimer = null;

  function abuseActive() { return nowSec() < abuseEnd; }

  function playOiia() {
    if (!soundOn) return;
    const p = oiia.play();
    if (p && p.catch) p.catch(() => { $("abuseSound").textContent = "🔇 Tap for OIIA"; });
    else $("abuseSound").textContent = "🔊 OIIA on";
  }
  oiia.addEventListener("playing", () => { $("abuseSound").textContent = "🔊 Mute OIIA"; });
  $("abuseSound").onclick = () => {
    if (!oiia.paused) { soundOn = false; oiia.pause(); $("abuseSound").textContent = "🔇 Turn on OIIA"; }
    else { soundOn = true; playOiia(); }
  };
  // Browsers only allow sound after a click, so try again on the next click.
  document.addEventListener("pointerdown", () => { if (abuseActive() && soundOn && oiia.paused) playOiia(); });

  function startAbuse(endsAt, mult) {
    const fresh = !abuseActive();
    abuseEnd = endsAt;
    MG.setEventMult(mult);
    $("abuseMult").textContent = mult + "x";
    $("abuseBar").classList.remove("hidden");
    document.documentElement.classList.add("party", "abuse");
    MG.particles.partyMode(99999);
    playOiia();
    if (fresh) {
      MG.particles.burst(60);
      MG.toast("🚨", "ADMIN ABUSE STARTED!", `${mult}x treats! +10 🐟 just for being here.`);
      MG.addTreats(10);
      MG.sawAbuse();
    }
    clearInterval(abuseTimer);
    abuseTimer = setInterval(tickAbuse, 250);
    tickAbuse();
    updatePowers();
  }
  function tickAbuse() {
    const left = Math.max(0, Math.ceil(abuseEnd - nowSec()));
    $("abuseTime").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
    if (left <= 0) endAbuse();
  }
  function endAbuse() {
    if (!abuseTimer && $("abuseBar").classList.contains("hidden")) return;
    clearInterval(abuseTimer); abuseTimer = null;
    abuseEnd = 0;
    MG.setEventMult(1);
    MG.particles.partyMode(0);
    $("abuseBar").classList.add("hidden");
    document.documentElement.classList.remove("party", "abuse");
    oiia.pause(); oiia.currentTime = 0;
    MG.toast("🛑", "Admin Abuse is over", "Thanks for coming!");
    updatePowers();
  }

  // ---------- Powers ----------
  const POWERS = [
    { t: "fish",   icon: "🐟", name: "Fish Rain",       info: "+25 🐟 for everyone" },
    { t: "golden", icon: "🌟", name: "Golden :3 Storm", info: "30 golden :3s to catch" },
    { t: "giant",  icon: "🐈‍⬛", name: "Giant Maxwell",   info: "Click him for +50 🐟" },
    { t: "gift",   icon: "🎁", name: "Mystery Gifts",   info: "Falling gifts with 10-100 🐟" },
    { t: "xp",     icon: "⭐", name: "XP Boost",        info: "+100 🐟 & XP for everyone" },
    { t: "boom",   icon: "💥", name: "Deltarune Boom",  info: "Big explosion + shake" },
    { t: "disco",  icon: "🌈", name: "Disco Mode",      info: "Crazy colors for 15s" },
    { t: "spin",   icon: "🌀", name: "Spin Everything", info: "The whole site spins" },
    { t: "meow",   icon: "🙀", name: "MEOW Blast",      info: "Everyone hears a meow" },
    { t: "maxwells", icon: "🐾", name: "Maxwell Swarm", info: "Lots of Maxwells to click" }
  ];
  function renderPowers() {
    const g = $("powerGrid");
    g.innerHTML = "";
    POWERS.forEach((p) => {
      const b = document.createElement("button");
      b.className = "shop-item power";
      b.innerHTML = `<span class="si-icon"></span><span class="si-name"></span><span class="si-price"></span>`;
      b.querySelector(".si-icon").textContent = p.icon;
      b.querySelector(".si-name").textContent = p.name;
      b.querySelector(".si-price").textContent = p.info;
      b.onclick = () => { if (abuseActive()) send({ t: p.t }); };
      g.appendChild(b);
    });
    updatePowers();
  }
  function updatePowers() {
    const on = abuseActive();
    document.querySelectorAll(".power").forEach((b) => (b.disabled = !on));
    $("powerHint").textContent = on ? "(click to use, everyone sees it!)" : "(start an Admin Abuse to use these)";
  }

  function handle(msg, age) {
    if (msg.t === "abuse") {
      const endsAt = msg.at + msg.dur;
      if (nowSec() < endsAt) startAbuse(endsAt, msg.mult || 2);
      return;
    }
    if (msg.t === "abuse_end") { if (age < 600) endAbuse(); return; }
    if (age > 12) return; // old spawns don't replay for people who join late
    if (msg.t === "announce") { announce(String(msg.text || "").slice(0, 100)); return; }
    if (!abuseActive()) return;
    switch (msg.t) {
      case "fish": MG.particles.burst(50); MG.addTreats(25, innerWidth / 2, innerHeight / 3); MG.toast("🐟", "Fish Rain!", "+25 🐟 from the owner"); break;
      case "golden": MG.particles.goldenStorm(30); MG.toast("🌟", "Golden :3 Storm!", "Click the golden :3s for +10 each!"); break;
      case "giant": giantMaxwell(); break;
      case "gift": for (let i = 0; i < 6; i++) setTimeout(spawnGift, i * 400); MG.toast("🎁", "Mystery Gifts!", "Click the falling gifts!"); break;
      case "xp": MG.addTreats(100, innerWidth / 2, innerHeight / 3); MG.toast("⭐", "XP Boost!", "+100 🐟 & XP"); break;
      case "boom": bigBoom(); break;
      case "disco": document.documentElement.classList.add("disco"); setTimeout(() => document.documentElement.classList.remove("disco"), 15000); break;
      case "spin": document.body.classList.remove("spin-all"); void document.body.offsetWidth; document.body.classList.add("spin-all"); setTimeout(() => document.body.classList.remove("spin-all"), 2100); break;
      case "meow": MG.meow(); setTimeout(MG.meow, 250); setTimeout(MG.meow, 500); MG.floatText("MEOW!!!", innerWidth / 2, innerHeight / 2, "big"); break;
      case "maxwells": for (let i = 0; i < 12; i++) setTimeout(() => clickable(maxwellSrc(), 70, 5, "🐈‍⬛ +5"), i * 250); break;
    }
  }

  function maxwellSrc() { const l = document.querySelector(".logo-img"); return l ? l.src : "maxwell.png"; }

  // Something that floats across the screen and gives treats when clicked
  function clickable(src, size, reward, label, cls) {
    const el = document.createElement("img");
    el.src = src; el.alt = "";
    el.className = "spawn " + (cls || "");
    el.style.width = size + "px";
    el.style.left = Math.random() * (innerWidth - size) + "px";
    el.style.animationDuration = 5 + Math.random() * 4 + "s";
    el.onclick = (e) => {
      e.stopPropagation();
      MG.addTreats(reward, e.clientX, e.clientY);
      if (label) MG.floatText(label, e.clientX, e.clientY - 24, "gold");
      MG.meow();
      el.remove();
    };
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 10000);
  }
  function spawnGift() {
    const el = document.createElement("div");
    el.className = "spawn gift";
    el.textContent = "🎁";
    el.style.left = Math.random() * (innerWidth - 60) + "px";
    el.style.animationDuration = 5 + Math.random() * 3 + "s";
    el.onclick = (e) => {
      e.stopPropagation();
      const n = 10 + Math.floor(Math.random() * 91);
      MG.addTreats(n, e.clientX, e.clientY);
      MG.floatText("🎉 GIFT!", e.clientX, e.clientY - 24, "gold");
      el.remove();
    };
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 9000);
  }
  function giantMaxwell() {
    const el = document.createElement("img");
    el.src = maxwellSrc(); el.alt = "Giant Maxwell";
    el.className = "giant-maxwell";
    el.onclick = (e) => {
      if (el.dataset.got) return;
      el.dataset.got = "1";
      MG.addTreats(50, e.clientX, e.clientY);
      MG.floatText("GIANT MAXWELL +50!", e.clientX, e.clientY - 30, "gold");
      MG.meow();
      el.classList.add("caught");
    };
    document.body.appendChild(el);
    MG.toast("🐈‍⬛", "GIANT MAXWELL!", "Click him before he leaves for +50 🐟");
    setTimeout(() => el.remove(), 9000);
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
  function announce(text) {
    if (!text) return;
    const el = $("announce");
    el.textContent = "📢 " + text;
    el.classList.remove("hidden");
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => el.classList.add("hidden"), 8000);
  }

  // ---------- Admin panel ----------
  function openAdmin() { $("adminModal").classList.remove("hidden"); renderPowers(); }
  $("adminClose").onclick = () => $("adminModal").classList.add("hidden");
  $("adminModal").addEventListener("click", (e) => { if (e.target.id === "adminModal") $("adminModal").classList.add("hidden"); });
  $("abuseStart").onclick = () => {
    if (!isOwner) return;
    send({ t: "abuse", dur: Number($("abuseDur").value), mult: Number($("abuseMultSel").value) });
  };
  $("abuseStop").onclick = () => { if (isOwner) send({ t: "abuse_end" }); };
  $("announceForm").onsubmit = (e) => {
    e.preventDefault();
    const text = $("announceText").value.trim().slice(0, 100);
    if (isOwner && text) { send({ t: "announce", text }); $("announceText").value = ""; }
  };
  $("giveMe").onclick = () => { if (isOwner) { MG.give(1000); MG.toast("👑", "+1000 🐟", "Owner perks!"); } };
  $("maxMe").onclick = () => { if (isOwner) { MG.maxLevel(); MG.toast("👑", "Level 10!", "Owner perks!"); } };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { $("adminModal").classList.add("hidden"); $("lockModal").classList.add("hidden"); } });

  updateLock();
  setStatus("connecting...", false);
  connect();
})();
