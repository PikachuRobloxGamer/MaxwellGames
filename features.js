// ===== MaxwellGames: the "website is a game" layer =====
// Treats (🐟), XP & levels, achievements, a shop, catchable :3 particles,
// a daily bonus, and some secrets. Progress is saved in this browser.

(function () {
  const $ = (id) => document.getElementById(id);

  // ---------- Save data ----------
  const SAVE_KEY = "maxwellgames-save-v1";
  const DEFAULT = {
    treats: 0, xp: 0, caught: 0, golden: 0, maxwellClicks: 0,
    opened: [], tabs: [], owned: ["p-3", "c-cat", "t-purple"],
    equip: { particle: "p-3", cursor: "c-cat", theme: "t-purple", skin: "sk-auto" },
    ach: [], lastDaily: "", streak: 0, playSeconds: 0, bought: 0,
    asc: 0, rebirths: 0, ascCaught: 0, yt: 0, abuses: 0
  };
  let save;
  try { save = Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(SAVE_KEY) || "{}")); }
  catch (e) { save = Object.assign({}, DEFAULT); }
  save.equip = Object.assign({}, DEFAULT.equip, save.equip);
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

  // ---------- Levels ----------
  // Every ascension makes levels harder to get.
  const ascMul = () => 1 + 0.6 * (save.asc || 0);
  const levelFor = (xp) => Math.floor(Math.sqrt(xp / (15 * ascMul()))) + 1;
  const xpForLevel = (lv) => 15 * ascMul() * (lv - 1) * (lv - 1);
  // Bonus from rebirths (+25% each) and from live Admin Abuse events.
  let eventMult = 1;
  const treatMult = () => eventMult * (1 + 0.25 * (save.rebirths || 0));

  function addTreats(n, x, y) {
    n = Math.max(1, Math.round(n * treatMult()));
    const before = levelFor(save.xp);
    save.treats += n;
    save.xp += n;
    const after = levelFor(save.xp);
    if (x !== undefined) floatText(`+${n} 🐟`, x, y);
    if (after > before) {
      toast("⬆️", `Level ${after}!`, "You're leveling up. Keep going!");
      boomSound(0.15);
    }
    checkAch();
    updateHud();
    persist();
  }

  function updateHud() {
    const lv = levelFor(save.xp);
    const lo = xpForLevel(lv), hi = xpForLevel(lv + 1);
    $("treatCount").textContent = save.treats;
    $("levelNum").textContent = lv;
    $("xpFill").style.width = Math.min(100, ((save.xp - lo) / (hi - lo)) * 100) + "%";
    if (!$("panel").classList.contains("hidden")) renderPanelHead();
  }

  // ---------- Shop ----------
  const SHOP = [
    { id: "p-3",      type: "particle", name: ":3 Rain",        price: 0,   icon: ":3" },
    { id: "p-fish",   type: "particle", name: "Fish Rain",      price: 25,  icon: "🐟" },
    { id: "p-heart",  type: "particle", name: "Heart Rain",     price: 40,  icon: "❤️" },
    { id: "p-star",   type: "particle", name: "Star Rain",      price: 60,  icon: "⭐" },
    { id: "p-paw",    type: "particle", name: "Paw Prints",     price: 80,  icon: "🐾" },
    { id: "p-maxwell",type: "particle", name: "Maxwell Rain",   price: 150, icon: "🐈‍⬛" },
    { id: "p-mix",    type: "particle", name: "Chaos Mix",      price: 300, icon: "🌀" },
    { id: "c-cat",    type: "cursor",   name: "Tabby Cat",      price: 0,   icon: "🐈" },
    { id: "c-big",    type: "cursor",   name: "Big Tabby",      price: 50,  icon: "🐅" },
    { id: "c-maxwell",type: "cursor",   name: "Maxwell Cursor", price: 120, icon: "🐈‍⬛" },
    { id: "c-normal", type: "cursor",   name: "Normal Arrow",   price: 0,   icon: "🖱️" },
    { id: "t-purple", type: "theme",    name: "Purple",         price: 0,   icon: "🟣", color: "#6c5ce7" },
    { id: "t-green",  type: "theme",    name: "Toxic Green",    price: 30,  icon: "🟢", color: "#2ecc71" },
    { id: "t-pink",   type: "theme",    name: "Bubblegum",      price: 30,  icon: "🩷", color: "#ff5fa2" },
    { id: "t-blue",   type: "theme",    name: "Sans Blue",      price: 50,  icon: "🔵", color: "#2f8cff" },
    { id: "t-red",    type: "theme",    name: "Determination",  price: 70,  icon: "❤️", color: "#e8303a" },
    { id: "t-gold",   type: "theme",    name: "Golden Maxwell", price: 200, icon: "🟡", color: "#f5b82e" },
    { id: "x-spin",   type: "extra",    name: "Spinning Logo",  price: 100, icon: "💫" },
    { id: "x-trail",  type: "extra",    name: "Sparkle Trail",  price: 180, icon: "✨" },
    // ----- Owner / GamesOn786 exclusives -----
    { id: "o-crown",  type: "particle", name: "Crown Rain",     role: "owner", icon: "👑" },
    { id: "o-cursor", type: "cursor",   name: "Owner Cursor",   role: "owner", icon: "👑" },
    { id: "o-rainbow",type: "theme",    name: "Owner Rainbow",  role: "owner", icon: "🌈", color: "#ff5fa2", rainbow: true },
    { id: "p-ghost",  type: "particle", name: "Ghost Rain",     role: "sami",  icon: "👻" },
    { id: "c-gengar", type: "cursor",   name: "Gengar Cursor",  role: "sami",  icon: "👻", cursor: 'url("images/cursor-gengar.png") 8 6, auto' },
    { id: "sk-gengar",type: "skin",     name: "Gengar Maxwell", role: "sami",  img: "images/maxwell-gengar.png", icon: "👻" },
    { id: "sk-king",  type: "skin",     name: "King Maxwell",   role: "owner", img: "images/maxwell-king.png", icon: "👑" },
    { id: "s-ocean",  type: "theme",    name: "GamesOn Blue",   role: "sami",  icon: "💎", color: "#20b4ff" },
    { id: "sk-auto",  type: "skin",     name: "My Ascension",   role: "owner", icon: "✨" },
    { id: "sk-0", type: "skin", name: "Classic",   role: "owner", tier: 0 },
    { id: "sk-1", type: "skin", name: "Crimson",   role: "owner", tier: 1 },
    { id: "sk-2", type: "skin", name: "Sunset",    role: "owner", tier: 2 },
    { id: "sk-3", type: "skin", name: "Golden",    role: "owner", tier: 3 },
    { id: "sk-4", type: "skin", name: "Emerald",   role: "owner", tier: 4 },
    { id: "sk-5", type: "skin", name: "Ocean",     role: "owner", tier: 5 },
    { id: "sk-6", type: "skin", name: "Galaxy",    role: "owner", tier: 6 },
    { id: "sk-7", type: "skin", name: "Bubblegum", role: "owner", tier: 7 },
    { id: "sk-8", type: "skin", name: "Rainbow",   role: "owner", tier: 8 },
    { id: "sk-9", type: "skin", name: "Inverted",  role: "owner", tier: 9 }
  ];
  let role = null; // "owner", "sami", or null
  const canSee = (it) => !it.role || it.role === role || (role === "owner" && it.role === "sami");
  const item = (id) => SHOP.find((s) => s.id === id);
  const owns = (id) => { const it = item(id); if (it && it.role) return canSee(it); return save.owned.includes(id) || (role && it && !it.role); };

  function buy(id) {
    const it = item(id);
    if (!it || owns(id)) return;
    if (save.treats < it.price) { toast("😿", "Not enough treats", `You need ${it.price - save.treats} more 🐟`); return; }
    save.treats -= it.price;
    save.owned.push(id);
    save.bought++;
    toast(it.icon, `Bought ${it.name}!`, it.type === "extra" ? "Turn it on in the shop." : "It's equipped now.");
    if (it.type !== "extra") equip(id); else toggleExtra(id, true);
    checkAch(); updateHud(); persist(); renderPanel();
  }

  function equip(id) {
    const it = item(id);
    if (!it || !owns(id)) return;
    save.equip[it.type] = id;
    if (it.type === "skin") { persist(); applyMaxwell(); renderPanel(); return; }
    applyLooks(); persist(); renderPanel();
  }

  function toggleExtra(id, force) {
    save.equip[id] = force !== undefined ? force : !save.equip[id];
    applyLooks(); persist(); renderPanel();
  }

  let rainbowTimer = null;

  function applyLooks() {
    const cur = save.equip.cursor;
    const map = {
      "c-cat": 'url("images/cursor-cat.png") 10 2, auto',
      "c-big": 'url("images/cursor-cat-big.png") 15 3, auto',
      "c-maxwell": 'url("images/cursor-maxwell.png") 20 4, auto',
      "c-normal": "auto",
      "o-cursor": 'url("images/cursor-owner.png") 6 14, auto'
    };
    const curItem = item(cur);
    let curCss = curItem && curItem.cursor ? curItem.cursor : (map[cur] || map["c-cat"]);
    if (curItem && curItem.role && !canSee(curItem)) curCss = map["c-cat"];
    document.documentElement.style.setProperty("--cat-cursor", curCss);
    let th = item(save.equip.theme);
    if (th && th.role && !canSee(th)) th = item("t-purple");
    clearInterval(rainbowTimer);
    if (th && th.rainbow) {
      let hue = 0;
      rainbowTimer = setInterval(() => { hue = (hue + 4) % 360; document.documentElement.style.setProperty("--accent", `hsl(${hue} 90% 60%)`); }, 80);
    } else if (th) document.documentElement.style.setProperty("--accent", th.color);
    if (typeof applyMaxwell === "function" && window.MG) applyMaxwell();
    document.body.classList.toggle("logo-spin", !!save.equip["x-spin"]);
    particles.setStyle(save.equip.particle);
  }

  // ---------- Achievements ----------
  const ACH = [
    { id: "first",   icon: "🎮", name: "First Play",        desc: "Open any game or proxy",          test: () => save.opened.length >= 1 },
    { id: "explore", icon: "🧭", name: "Explorer",          desc: "Open 5 different games/proxies",  test: () => save.opened.length >= 5 },
    { id: "all-tabs",icon: "🗂️", name: "Tab Hopper",        desc: "Visit Games, Proxies & Soundboard", test: () => ["games","proxies","sounds"].every((t) => save.tabs.includes(t)) },
    { id: "c10",     icon: "😺", name: "Kitten Catcher",    desc: "Catch 10 falling :3s",            test: () => save.caught >= 10 },
    { id: "c100",    icon: "😸", name: "Cat Wrangler",      desc: "Catch 100 falling :3s",           test: () => save.caught >= 100 },
    { id: "c500",    icon: "😻", name: ":3 Legend",         desc: "Catch 500 falling :3s",           test: () => save.caught >= 500 },
    { id: "gold",    icon: "🌟", name: "Golden Paw",        desc: "Catch a rare golden :3",          test: () => save.golden >= 1 },
    { id: "gold10",  icon: "👑", name: "Gold Rush",         desc: "Catch 10 golden :3s",             test: () => save.golden >= 10 },
    { id: "pet",     icon: "🐈‍⬛", name: "Maxwell Petter",   desc: "Click Maxwell 25 times",          test: () => save.maxwellClicks >= 25 },
    { id: "pet2",    icon: "💖", name: "Maxwell's Bestie",  desc: "Click Maxwell 250 times",         test: () => save.maxwellClicks >= 250 },
    { id: "shop",    icon: "🛍️", name: "First Purchase",    desc: "Buy something in the shop",       test: () => save.bought >= 1 },
    { id: "shop5",   icon: "💸", name: "Big Spender",       desc: "Buy 5 things in the shop",        test: () => save.bought >= 5 },
    { id: "rich",    icon: "💰", name: "Fish Hoarder",      desc: "Hold 500 treats at once",         test: () => save.treats >= 500 },
    { id: "lv5",     icon: "⭐", name: "Level 5",           desc: "Reach level 5",                   test: () => levelFor(save.xp) >= 5 },
    { id: "lv10",    icon: "🌠", name: "Level 10",          desc: "Reach level 10",                  test: () => levelFor(save.xp) >= 10 },
    { id: "gamer",   icon: "⏱️", name: "Gamer Moment",      desc: "Play games for 10 minutes total", test: () => save.playSeconds >= 600 },
    { id: "gamer2",  icon: "🕹️", name: "No Life (jk)",      desc: "Play games for 1 hour total",     test: () => save.playSeconds >= 3600 },
    { id: "streak3", icon: "📅", name: "Regular",           desc: "Get a 3 day login streak",        test: () => save.streak >= 3 },
    { id: "night",   icon: "🌙", name: "Night Owl",         desc: "Visit between midnight and 5am (bonus)", bonus: true, test: () => new Date().getHours() < 5 },
    { id: "yt",      icon: "▶️", name: "Subscriber",        desc: "Visit a MaxwellGames YouTube channel (bonus)", bonus: true, test: () => save.yt >= 1 },
    { id: "abuse",   icon: "🚨", name: "Witness",           desc: "Be on the site during an Admin Abuse (bonus)", bonus: true, test: () => save.abuses >= 1 },
    { id: "asc1",    icon: "✨", name: "Ascended",          desc: "Ascend your Maxwell (bonus)",      bonus: true, test: () => save.asc >= 1 || save.rebirths >= 1 },
    { id: "inv",     icon: "🔄", name: "Inverted",          desc: "Reach Inverted Maxwell (bonus)",   bonus: true, test: () => save.asc >= 9 || save.rebirths >= 1 },
    { id: "reborn",  icon: "♾️", name: "Reborn",            desc: "Rebirth for the first time (bonus)", bonus: true, test: () => save.rebirths >= 1 },
    { id: "konami",  icon: "🕹️", name: "Secret Code",       desc: "??? (an old-school cheat code)",  secret: true, test: () => save.ach.includes("konami") },
    { id: "meow",    icon: "🙀", name: "Typed it",          desc: "??? (type a cat word anywhere)",   secret: true, test: () => save.ach.includes("meow") }
  ];

  function unlock(id) {
    if (save.ach.includes(id)) return;
    const a = ACH.find((x) => x.id === id);
    save.ach.push(id);
    if (a) toast(a.icon, "Achievement: " + a.name, a.secret ? "You found a secret!" : a.desc);
    save.treats += 20; save.xp += 20; // bonus for every achievement
    persist(); updateHud();
    if (!$("panel").classList.contains("hidden")) renderPanel();
  }
  function checkAch() { ACH.forEach((a) => { if (!a.secret && !save.ach.includes(a.id) && a.test()) unlock(a.id); }); }

  // ---------- Toasts & floating text ----------
  function toast(icon, title, body) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<div class="toast-icon"></div><div><b class="t-title"></b><span class="t-body"></span></div>`;
    t.querySelector(".toast-icon").textContent = icon;
    t.querySelector(".t-title").textContent = title;
    t.querySelector(".t-body").textContent = body || "";
    $("toasts").appendChild(t);
    setTimeout(() => t.classList.add("out"), 3200);
    setTimeout(() => t.remove(), 3700);
  }
  function floatText(text, x, y, cls) {
    const f = document.createElement("div");
    f.className = "float-text " + (cls || "");
    f.textContent = text;
    f.style.left = x + "px"; f.style.top = y + "px";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }

  // ---------- Little sounds (made in the browser) ----------
  let ac;
  function audio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); return ac; } catch (e) { return null; } }
  function blip(freq, dur, type, vol) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type || "square"; o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 1.8, t + dur);
    g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
  }
  function meow() {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter(), t = a.currentTime;
    o.type = "sawtooth";
    o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(820, t + 0.12);
    o.frequency.linearRampToValueAtTime(430, t + 0.4);
    f.type = "bandpass"; f.frequency.setValueAtTime(1200, t); f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(f).connect(g).connect(a.destination); o.start(t); o.stop(t + 0.46);
  }
  function boomSound(vol) { blip(300, 0.12, "triangle", vol || 0.1); setTimeout(() => blip(450, 0.12, "triangle", vol || 0.1), 110); setTimeout(() => blip(680, 0.2, "triangle", vol || 0.1), 220); }

  // ---------- Falling particles you can catch ----------
  const maxwellImg = new Image(); maxwellImg.src = "maxwell.png";
  const particles = (function () {
    const canvas = $("particles"), ctx = canvas.getContext("2d");
    const COUNT = 45;
    const STYLES = {
      "p-3": [":3"], "p-fish": ["🐟"], "p-heart": ["❤️", "💖", "💜"], "p-star": ["⭐", "✨", "🌟"],
      "p-paw": ["🐾"], "p-maxwell": ["MAXWELL"], "o-crown": ["👑", "💎", "MAXWELL"], "p-ghost": ["👻", "⭐", "✨"], "p-mix": [":3", "🐟", "❤️", "⭐", "🐾", "MAXWELL", "😺"]
    };
    let w, h, parts = [], style = "p-3", party = 0;

    function resize() { w = canvas.width = innerWidth; h = canvas.height = innerHeight; }
    function make(anywhere) {
      const set = STYLES[style] || STYLES["p-3"];
      const golden = Math.random() < 0.025;
      return {
        x: Math.random() * w, y: anywhere ? Math.random() * h : -40,
        size: golden ? 26 : 12 + Math.random() * 14,
        speed: 0.4 + Math.random() * 1.1, drift: Math.random() * 6.28,
        spin: (Math.random() - 0.5) * 0.02, angle: (Math.random() - 0.5) * 0.6,
        alpha: golden ? 1 : 0.45 + Math.random() * 0.45,
        glyph: golden ? ":3" : set[Math.floor(Math.random() * set.length)],
        golden, pop: 0
      };
    }
    function draw(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      let a = p.alpha, s = 1;
      if (p.pop) { s = 1 + p.pop * 1.5; a *= 1 - p.pop; }
      ctx.globalAlpha = a; ctx.scale(s, s);
      if (p.glyph === "MAXWELL") {
        if (maxwellImg.complete) ctx.drawImage(maxwellImg, -p.size, -p.size, p.size * 2, p.size * 2 * (maxwellImg.height / maxwellImg.width));
      } else {
        ctx.font = `bold ${p.size}px system-ui, "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (p.golden) { ctx.shadowColor = "#ffd84a"; ctx.shadowBlur = 18; ctx.fillStyle = "#ffd84a"; }
        else ctx.fillStyle = "#ffffff";
        ctx.fillText(p.glyph, 0, 0);
      }
      ctx.restore();
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      const speedMul = party > 0 ? 3 : 1;
      if (party > 0) party--;
      for (const p of parts) {
        if (p.pop) { p.pop += 0.08; if (p.pop >= 1) Object.assign(p, make(false)); }
        else {
          p.y += p.speed * speedMul; p.drift += 0.01;
          p.x += Math.sin(p.drift) * 0.4; p.angle += p.spin;
          if (p.y > h + 40) Object.assign(p, make(false));
        }
        draw(p);
      }
      requestAnimationFrame(tick);
    }
    // Try to catch a particle near (x, y). Returns the particle or null.
    function catchAt(x, y) {
      let best = null, bestD = 34;
      for (const p of parts) {
        if (p.pop) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD + p.size * 0.4) { best = p; bestD = d; }
      }
      if (best) best.pop = 0.01;
      return best;
    }
    function setStyle(s) { style = s; parts.forEach((p, i) => { if (i % 2 === 0) Object.assign(p, make(true)); }); }
    function partyMode(frames) { party = frames; }
    function burst(n) { for (let i = 0; i < n; i++) parts.push(make(false)); setTimeout(() => parts.splice(COUNT), 12000); }
    function goldenStorm(n) {
      for (let i = 0; i < n; i++) {
        const p = make(false);
        Object.assign(p, { golden: true, glyph: ":3", size: 26, alpha: 1, y: -40 - Math.random() * 500 });
        parts.push(p);
      }
      setTimeout(() => parts.splice(COUNT), 15000);
    }
    resize(); parts = Array.from({ length: COUNT }, () => make(true));
    addEventListener("resize", resize); tick();
    return { catchAt, setStyle, partyMode, burst, goldenStorm };
  })();

  // Clicking empty space catches :3s (not when clicking buttons, cards, etc.)
  document.addEventListener("click", (e) => {
    if (e.target.closest("button, a, input, .card, .sound, iframe, .panel, .player-bar, .frame-wrap")) return;
    const p = particles.catchAt(e.clientX, e.clientY);
    if (!p) return;
    save.caught++; save.ascCaught++;
    if (p.golden) { save.golden++; blip(700, 0.25, "triangle", 0.12); addTreats(10, e.clientX, e.clientY); floatText("GOLDEN!", e.clientX, e.clientY - 22, "gold"); }
    else { blip(500 + Math.random() * 300, 0.08); addTreats(1, e.clientX, e.clientY); }
  });

  // ---------- Pet Maxwell (the logo) ----------
  const logoImg = document.querySelector(".logo-img");
  logoImg.addEventListener("click", (e) => {
    save.maxwellClicks++;
    meow();
    logoImg.classList.remove("boing"); void logoImg.offsetWidth; logoImg.classList.add("boing");
    const r = logoImg.getBoundingClientRect();
    floatText(["meow", "mrrp", ":3", "purr", "nya"][Math.floor(Math.random() * 5)], r.left + r.width / 2, r.bottom + 4, "meow");
    if (save.maxwellClicks % 10 === 0) addTreats(3, r.left + r.width, r.bottom);
    checkAch(); persist();
  });

  // ---------- Sparkle trail (shop extra) ----------
  let lastTrail = 0;
  document.addEventListener("mousemove", (e) => {
    if (!save.equip["x-trail"]) return;
    const now = performance.now();
    if (now - lastTrail < 40) return;
    lastTrail = now;
    const s = document.createElement("div");
    s.className = "sparkle";
    s.textContent = ["✨", "⭐", "·", "✦"][Math.floor(Math.random() * 4)];
    s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });

  // ---------- Earn treats while playing ----------
  let playing = false;
  addEventListener("mg:open", (e) => {
    playing = true;
    const id = e.detail.id;
    if (!save.opened.includes(id)) { save.opened.push(id); addTreats(5); }
    checkAch(); persist();
  });
  addEventListener("mg:close", () => { playing = false; });
  addEventListener("mg:tab", (e) => {
    if (!save.tabs.includes(e.detail)) { save.tabs.push(e.detail); checkAch(); persist(); }
  });
  setInterval(() => {
    if (!playing || document.hidden) return;
    save.playSeconds += 10;
    if (save.playSeconds % 60 === 0) { addTreats(2); toast("🎮", "+2 🐟", "Treats for playing!"); }
    else { checkAch(); persist(); }
  }, 10000);

  // ---------- Daily bonus ----------
  function dailyBonus() {
    const today = new Date().toDateString();
    if (save.lastDaily === today) return;
    const yesterday = new Date(Date.now() - 864e5).toDateString();
    save.streak = save.lastDaily === yesterday ? save.streak + 1 : 1;
    save.lastDaily = today;
    const amount = 10 + Math.min(save.streak, 7) * 5;
    setTimeout(() => { toast("🎁", `Daily bonus: +${amount} 🐟`, `Login streak: ${save.streak} day${save.streak === 1 ? "" : "s"}`); addTreats(amount); }, 1200);
  }

  // ---------- Secrets ----------
  const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let kIdx = 0, typed = "";
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kIdx = k === KONAMI[kIdx] ? kIdx + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) { kIdx = 0; maxwellParty(); unlock("konami"); }
    if (e.key.length === 1) {
      typed = (typed + e.key.toLowerCase()).slice(-12);
      if (typed.endsWith("meow") || typed.endsWith("maxwell")) { typed = ""; meow(); particles.burst(40); floatText("MEOW!", innerWidth / 2, innerHeight / 2, "big"); unlock("meow"); }
    }
  });
  function maxwellParty() {
    document.documentElement.classList.add("party");
    particles.partyMode(600); particles.burst(80);
    boomSound(0.12); meow();
    floatText("🎉 MAXWELL PARTY 🎉", innerWidth / 2, innerHeight / 2, "big");
    setTimeout(() => document.documentElement.classList.remove("party"), 10000);
  }

  // ---------- Panel ----------
  let panelTab = "shop";
  function renderPanelHead() {
    const lv = levelFor(save.xp);
    $("pLevel").textContent = lv;
    $("pTreats").textContent = save.treats;
    $("pXp").textContent = `${save.xp - xpForLevel(lv)} / ${xpForLevel(lv + 1) - xpForLevel(lv)} XP to next level`;
  }
  function renderPanel() {
    renderPanelHead();
    document.querySelectorAll(".ptab").forEach((b) => b.classList.toggle("active", b.dataset.p === panelTab));
    const body = $("panelBody");
    body.innerHTML = "";
    if (panelTab === "shop") {
      if (role) {
        const banner = document.createElement("div");
        banner.className = "owner-shop-banner " + role;
        banner.textContent = role === "owner" ? "👑 OWNER: you own everything in the shop, plus owner-only items!" : "💎 GamesOn786: everything's unlocked for you, plus your own GamesOn items!";
        body.appendChild(banner);
      }
      const groups = { particle: "Falling particles", cursor: "Cursors", theme: "Colors", skin: "✨ Maxwell skins (admins)", extra: "Extras" };
      for (const [type, label] of Object.entries(groups)) {
        const h = document.createElement("h3"); h.textContent = label; body.appendChild(h);
        const g = document.createElement("div"); g.className = "shop-grid"; body.appendChild(g);
        const list = SHOP.filter((s) => s.type === type && canSee(s));
        if (!list.length) { h.remove(); g.remove(); continue; }
        list.forEach((s) => {
          const own = owns(s.id);
          const on = type === "extra" ? !!save.equip[s.id] : save.equip[type] === s.id;
          const el = document.createElement("button");
          el.className = "shop-item" + (on ? " on" : "") + (own ? " owned" : "");
          el.innerHTML = `<span class="si-icon"></span><span class="si-name"></span><span class="si-price"></span>`;
          if (s.tier !== undefined) { const im = document.createElement("img"); im.src = tierImg(s.tier); im.className = "si-img"; el.querySelector(".si-icon").appendChild(im); }
          else if (s.img) { const im = document.createElement("img"); im.src = s.img; im.className = "si-img"; el.querySelector(".si-icon").appendChild(im); }
          else el.querySelector(".si-icon").textContent = s.icon;
          if (s.role) el.classList.add("exclusive", s.role);
          el.querySelector(".si-name").textContent = s.name;
          el.querySelector(".si-price").textContent = !own ? `${s.price} 🐟` : s.role && !on ? (s.role === "owner" ? "👑 Equip" : "💎 Equip") : type === "extra" ? (on ? "ON" : "OFF") : (on ? "Equipped" : "Equip");
          if (s.color) el.style.setProperty("--swatch", s.color);
          el.onclick = () => !own ? buy(s.id) : type === "extra" ? toggleExtra(s.id) : equip(s.id);
          g.appendChild(el);
        });
      }
    } else if (panelTab === "ach") {
      const p = document.createElement("p"); p.className = "panel-note";
      p.textContent = `${save.ach.length} / ${ACH.length} unlocked · every achievement gives +20 🐟`;
      body.appendChild(p);
      const g = document.createElement("div"); g.className = "ach-grid"; body.appendChild(g);
      ACH.forEach((a) => {
        const got = save.ach.includes(a.id);
        const el = document.createElement("div");
        el.className = "ach" + (got ? " got" : "");
        el.innerHTML = `<span class="ach-icon"></span><div><b class="ach-name"></b><span class="ach-desc"></span></div>`;
        el.querySelector(".ach-icon").textContent = got || !a.secret ? a.icon : "❔";
        el.querySelector(".ach-name").textContent = got || !a.secret ? a.name : "Secret";
        el.querySelector(".ach-desc").textContent = a.desc;
        g.appendChild(el);
      });
    } else if (panelTab === "asc") {
      renderAscend(body);
    } else if (panelTab === "stats") {
      const rows = [
        ["🐟 Treats right now", save.treats], ["⭐ Total XP", save.xp], ["📈 Level", levelFor(save.xp)],
        [":3s caught", save.caught], ["🌟 Golden :3s caught", save.golden], ["🐈‍⬛ Maxwell pets", save.maxwellClicks],
        ["🎮 Different games/proxies opened", save.opened.length], ["⏱️ Time playing", Math.floor(save.playSeconds / 60) + " min"],
        ["📅 Login streak", save.streak + " days"], ["🛍️ Shop items bought", save.bought],
        ["✨ Ascension", TIERS[save.asc].name + " Maxwell"], ["♾️ Rebirths", save.rebirths + " (+" + (save.rebirths * 25) + "% treats)"],
        ["🚨 Admin Abuses seen", save.abuses]
      ];
      const t = document.createElement("div"); t.className = "stats";
      rows.forEach(([k, v]) => { const r = document.createElement("div"); r.innerHTML = "<span></span><b></b>"; r.querySelector("span").textContent = k; r.querySelector("b").textContent = v; t.appendChild(r); });
      body.appendChild(t);
      const reset = document.createElement("button"); reset.className = "btn reset"; reset.textContent = "Reset my progress";
      reset.onclick = () => {
        if (reset.dataset.sure) { save = JSON.parse(JSON.stringify(DEFAULT)); persist(); applyLooks(); updateHud(); renderPanel(); toast("🧹", "Progress reset", "Fresh start!"); }
        else { reset.dataset.sure = "1"; reset.textContent = "Click again to really reset"; }
      };
      body.appendChild(reset);
    } else {
      body.innerHTML = `<ul class="help">
        <li><b>Catch the falling :3s.</b> Click empty space near one for +1 🐟. Shiny <b style="color:#ffd84a">golden :3s</b> are worth +10.</li>
        <li><b>Pet Maxwell.</b> Click the Maxwell logo at the top. Every 10 pets gives +3 🐟.</li>
        <li><b>Try new games.</b> The first time you open each game or proxy: +5 🐟.</li>
        <li><b>Keep playing.</b> +2 🐟 for every minute you're in a game.</li>
        <li><b>Come back daily.</b> Daily bonus gets bigger with your login streak.</li>
        <li><b>Unlock achievements.</b> Each one gives +20 🐟.</li>
        <li><b>Secrets.</b> There are hidden things to find. Old-school gamers might know a certain code... and cats like it when you type their favorite word.</li>
        <li>Spend treats in the <b>Shop</b> on new falling particles, cursors, colors, and extras.</li>
        <li><b>Ascend.</b> Reach Level 10 with every main achievement to evolve your Maxwell into a new color. Each ascension makes levels harder. The last one is <b>Inverted Maxwell</b>, then you can <b>Rebirth</b> for a permanent +25% treat bonus.</li>
        <li><b>Admin Abuse!</b> When the owner starts one, everyone on the site gets bonus treats and special drops.</li>
        <li>Progress is saved in this browser.</li>
      </ul>`;
    }
  }
  $("profileBtn").onclick = () => { $("panel").classList.remove("hidden"); renderPanel(); };
  $("panelClose").onclick = () => $("panel").classList.add("hidden");
  $("panel").addEventListener("click", (e) => { if (e.target.id === "panel") $("panel").classList.add("hidden"); });
  document.querySelectorAll(".ptab").forEach((b) => b.onclick = () => { panelTab = b.dataset.p; renderPanel(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("panel").classList.add("hidden"); });

  // ---------- Ascension ----------
  const TIERS = [
    { name: "Classic",   color: "#ffffff" }, { name: "Crimson",   color: "#ff5a6e" },
    { name: "Sunset",    color: "#ff9a3c" }, { name: "Golden",    color: "#ffd84a" },
    { name: "Emerald",   color: "#3ee08f" }, { name: "Ocean",     color: "#4fb3ff" },
    { name: "Galaxy",    color: "#b77bff" }, { name: "Bubblegum", color: "#ff7ad1" },
    { name: "Rainbow",   color: "#ff6bd6" }, { name: "Inverted",  color: "#e8e9ee" }
  ];
  const LAST = TIERS.length - 1;
  const tierImg = (i) => `images/maxwell-tiers/maxwell-${i}.png`;
  const needCaught = () => 50 * (save.asc + 1) * (1 + save.rebirths);
  const mainAch = () => ACH.filter((a) => !a.secret && !a.bonus);

  function ascendChecks() {
    const lvOk = levelFor(save.xp) >= 10;
    const missing = mainAch().filter((a) => !save.ach.includes(a.id));
    const catchOk = save.ascCaught >= needCaught();
    return { lvOk, missing, catchOk, ready: lvOk && missing.length === 0 && catchOk };
  }

  function skinImg() {
    const sk = item(save.equip.skin);
    if (sk && sk.img) return { src: sk.img, tier: -1 };
    if (sk && sk.tier !== undefined) return { src: tierImg(sk.tier), tier: sk.tier };
    return { src: tierImg(save.asc), tier: save.asc };
  }
  function applyMaxwell() {
    const sk = skinImg();
    const tier = sk.tier;
    const src = sk.src;
    document.querySelectorAll(".logo-img, .panel-maxwell, .credits-maxwell, #loaderCat").forEach((img) => (img.src = src));
    maxwellImg.src = src;
    let fav = document.querySelector('link[rel="icon"]');
    if (fav) fav.href = src;
    document.body.classList.toggle("tier-rainbow", tier === 8);
    document.body.dataset.tier = tier;
    const tag = $("roleTag");
    if (tag) { tag.className = "role-tag " + (role || ""); tag.textContent = role === "owner" ? "👑 OWNER" : role === "sami" ? "💎 GamesOn786" : ""; }
    const badge = $("rebirthBadge");
    if (badge) badge.textContent = save.rebirths ? "♾️" + save.rebirths : "";
  }

  function renderAscend(body) {
    const c = ascendChecks();
    const cur = TIERS[save.asc], next = TIERS[save.asc + 1];
    const wrap = document.createElement("div");
    wrap.className = "asc-wrap";
    wrap.innerHTML = `
      <div class="asc-row">
        <div class="asc-card"><img alt=""><b></b><span>Current</span></div>
        <div class="asc-arrow">➜</div>
        <div class="asc-card next"><img alt=""><b></b><span></span></div>
      </div>
      <ul class="asc-reqs"></ul>
      <button class="btn asc-btn"></button>
      <div class="asc-track"></div>`;
    const cards = wrap.querySelectorAll(".asc-card");
    cards[0].querySelector("img").src = tierImg(save.asc);
    cards[0].querySelector("b").textContent = cur.name + " Maxwell";
    const reqs = wrap.querySelector(".asc-reqs");
    const addReq = (ok, text) => { const li = document.createElement("li"); li.className = ok ? "ok" : ""; li.textContent = (ok ? "✅ " : "⬜ ") + text; reqs.appendChild(li); };
    addReq(c.lvOk, `Reach Level 10 (you're Level ${levelFor(save.xp)})`);
    addReq(c.catchOk, `Catch ${needCaught()} :3s this ascension (${Math.min(save.ascCaught, needCaught())}/${needCaught()})`);
    addReq(c.missing.length === 0, c.missing.length ? `Unlock every main achievement (${c.missing.length} left: ${c.missing.slice(0, 4).map((a) => a.name).join(", ")}${c.missing.length > 4 ? "..." : ""})` : "Unlock every main achievement");
    const btn = wrap.querySelector(".asc-btn");
    if (save.asc < LAST) {
      cards[1].querySelector("img").src = tierImg(save.asc + 1);
      cards[1].querySelector("b").textContent = next.name + " Maxwell";
      cards[1].querySelector("span").textContent = "Next";
      if (!c.ready) cards[1].classList.add("locked");
      btn.textContent = c.ready ? `✨ ASCEND into ${next.name} Maxwell ✨` : "Not ready yet";
      btn.disabled = !c.ready;
      btn.onclick = () => ascend();
    } else {
      cards[1].querySelector("img").src = tierImg(0);
      cards[1].querySelector("b").textContent = "Rebirth";
      cards[1].querySelector("span").textContent = `Rebirth #${save.rebirths + 1} · +25% treats forever`;
      if (!c.ready) cards[1].classList.add("locked");
      btn.textContent = c.ready ? "♾️ REBIRTH ♾️" : "Not ready yet";
      btn.disabled = !c.ready;
      btn.onclick = () => rebirth();
    }
    const track = wrap.querySelector(".asc-track");
    TIERS.forEach((t, i) => {
      const d = document.createElement("div");
      d.className = "asc-pip" + (i < save.asc ? " done" : i === save.asc ? " now" : "");
      d.title = t.name;
      const im = document.createElement("img"); im.src = tierImg(i); im.alt = t.name;
      d.appendChild(im); track.appendChild(d);
    });
    if (save.rebirths) {
      const p = document.createElement("p"); p.className = "panel-note";
      p.textContent = `♾️ Rebirths: ${save.rebirths} · permanent treat bonus +${save.rebirths * 25}%`;
      wrap.appendChild(p);
    }
    body.appendChild(wrap);
  }

  function ascend() {
    if (!ascendChecks().ready || save.asc >= LAST) return;
    const from = save.asc, to = save.asc + 1;
    $("panel").classList.add("hidden");
    playEvolution(tierImg(from), tierImg(to), TIERS[to].color, `Congratulations! Your ${TIERS[from].name} Maxwell ascended into ${TIERS[to].name} Maxwell!`, () => {
      save.asc = to; save.xp = 0; save.ascCaught = 0;
      persist(); applyMaxwell(); checkAch(); updateHud();
    });
  }

  function rebirth() {
    if (!ascendChecks().ready || save.asc < LAST) return;
    $("panel").classList.add("hidden");
    playEvolution(tierImg(LAST), tierImg(0), "#ffd84a", `REBIRTH! Your Maxwell was reborn. Permanent bonus: +${(save.rebirths + 1) * 25}% treats!`, () => {
      save.rebirths++; save.asc = 0; save.xp = 0; save.treats = 0; save.ascCaught = 0;
      save.ach = save.ach.filter((id) => ACH.find((a) => a.id === id && (a.bonus || a.secret)));
      save.caught = 0; save.golden = 0; save.maxwellClicks = 0; save.opened = []; save.playSeconds = 0; save.bought = 0;
      persist(); applyMaxwell(); checkAch(); updateHud();
    });
  }

  // Pokémon GO-style evolution animation
  function playEvolution(fromSrc, toSrc, glow, message, done) {
    const ov = document.createElement("div");
    ov.className = "evo";
    ov.style.setProperty("--glow", glow);
    ov.innerHTML = `
      <div class="evo-rays"></div>
      <div class="evo-stage">
        <div class="evo-ring"></div><div class="evo-ring r2"></div>
        <img class="evo-img" alt="">
      </div>
      <div class="evo-sparks"></div>
      <div class="evo-flash"></div>
      <div class="evo-text"></div>
      <button class="btn evo-ok">OK</button>`;
    document.body.appendChild(ov);
    const img = ov.querySelector(".evo-img"), text = ov.querySelector(".evo-text");
    img.src = fromSrc;
    text.textContent = "What? Your Maxwell is ascending!";
    requestAnimationFrame(() => ov.classList.add("show"));

    // rising sparkles
    const sparks = ov.querySelector(".evo-sparks");
    const sparkTimer = setInterval(() => {
      const s = document.createElement("i");
      s.style.left = 30 + Math.random() * 40 + "%";
      s.style.animationDuration = 1 + Math.random() * 1.2 + "s";
      sparks.appendChild(s);
      setTimeout(() => s.remove(), 2400);
    }, 70);

    // chime that climbs higher
    let note = 0;
    const chime = () => { blip(330 * Math.pow(1.06, note), 0.18, "sine", 0.07); note++; };

    setTimeout(() => img.classList.add("silhouette"), 1300);
    // flip between old and new forms, faster and faster
    let flips = 0, delay = 520, showingNew = false;
    function flip() {
      showingNew = !showingNew;
      img.src = showingNew ? toSrc : fromSrc;
      img.classList.toggle("big", showingNew);
      chime();
      flips++;
      delay = Math.max(55, delay * 0.82);
      if (flips < 22) setTimeout(flip, delay);
      else finish();
    }
    setTimeout(flip, 2200);

    function finish() {
      clearInterval(sparkTimer);
      ov.classList.add("flash");
      boomSound(0.12);
      setTimeout(() => {
        img.src = toSrc;
        img.classList.remove("silhouette", "big");
        ov.classList.add("revealed");
        text.textContent = message;
        meow();
        for (let i = 0; i < 40; i++) {
          const s = document.createElement("i");
          s.className = "burst";
          const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
          s.style.setProperty("--dx", Math.cos(a) * d + "px");
          s.style.setProperty("--dy", Math.sin(a) * d + "px");
          sparks.appendChild(s);
        }
        done();
      }, 450);
    }
    ov.querySelector(".evo-ok").onclick = () => { ov.classList.remove("show"); setTimeout(() => ov.remove(), 400); };
  }

  // ---------- YouTube channel ----------
  const YT = "https://www.youtube.com/channel/UCXcZ2HP_B3NLLbvnd3QT75A";
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a.yt-link");
    if (!a) return;
    save.yt++;
    if (save.yt === 1) addTreats(50);
    checkAch(); persist();
  });
  let ytTurn = false;
  setInterval(() => {
    if (document.hidden) return;
    ytTurn = !ytTurn;
    if (ytTurn) toast("▶️", "Subscribe to Pikachu Roblox Gamer!", "Click the red Subscribe button at the top.");
    else toast("▶️", "Subscribe to Games On (GamesOn786)!", "Sami's channel. Click the Games On button at the top.");
  }, 6 * 60 * 1000);

  // ---------- For the owner / admin code ----------
  window.MG = {
    addTreats, toast, floatText, meow, boomSound, particles, unlock, checkAch, updateHud, persist,
    get save() { return save; },
    setEventMult(m) { eventMult = m; },
    sawAbuse() { save.abuses++; checkAch(); persist(); },
    maxLevel() { save.xp = Math.max(save.xp, xpForLevel(10)); checkAch(); updateHud(); persist(); },
    give(n) { save.treats += n; save.xp += n; checkAch(); updateHud(); persist(); },
    get role() { return role; },
    setRole(r) {
      const was = role;
      role = r;
      if (r && !was) {
        // first time this visit: equip the special stuff
        if (r === "owner" && save.equip.cursor === "c-cat") save.equip.cursor = "o-cursor";
        if (r === "sami" && save.equip.cursor === "c-cat") save.equip.cursor = "c-gengar";
      }
      if (!r) {
        ["particle", "cursor", "theme"].forEach((t) => { const it = item(save.equip[t]); if (it && it.role) save.equip[t] = DEFAULT.equip[t]; if (it && !it.role && !save.owned.includes(it.id) && it.price) save.equip[t] = DEFAULT.equip[t]; });
        save.equip.skin = "sk-auto";
      }
      persist(); applyLooks(); applyMaxwell(); updateHud();
      if (!$("panel").classList.contains("hidden")) renderPanel();
    },
    unlockAllAch() { ACH.forEach((a) => { if (!save.ach.includes(a.id)) save.ach.push(a.id); }); persist(); updateHud(); },
    setAsc(n) { save.asc = Math.max(0, Math.min(LAST, n)); save.xp = 0; persist(); applyMaxwell(); updateHud(); },
    evolve(from, to, msg) { playEvolution(tierImg(from), tierImg(to), TIERS[to].color, msg, () => {}); },
    skinList() {
      const list = TIERS.map((t, i) => ({ id: "sk-" + i, name: t.name + " Maxwell", color: t.color }));
      if (role === "owner") list.push({ id: "sk-king", name: "👑 King Maxwell", color: "#ffd84a" });
      if (role === "sami" || role === "owner") list.push({ id: "sk-gengar", name: "👻 Gengar Maxwell", color: "#9b59ff" });
      return list;
    },
    pickAscension(id, msg) {
      const sk = item(id) || SHOP.find((x) => x.id === id);
      const toSrc = sk && sk.img ? sk.img : tierImg(Number((id || "sk-0").replace("sk-", "")) || 0);
      const glow = sk && sk.color ? sk.color : "#6c5ce7";
      const fromSrc = skinImg().src;
      save.equip.skin = id;
      persist(); applyMaxwell(); updateHud();
      playEvolution(fromSrc, toSrc, glow, msg, () => { persist(); applyMaxwell(); updateHud(); });
    },
    resetSave() { save = JSON.parse(JSON.stringify(DEFAULT)); persist(); applyLooks(); applyMaxwell(); updateHud(); },
    tierImg, TIERS
  };

  // ---------- Start ----------
  applyLooks();
  applyMaxwell();
  updateHud();
  dailyBonus();
  checkAch();
  persist();
})();
