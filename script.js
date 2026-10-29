// ===== MaxwellGames =====
// Two tabs: Games (from games1.json) and Proxies (from proxies.json).
// Each item's "iframe" (or "url") field can be a plain URL
// or a full <iframe ...> embed code — both work.

const TABS = {
  games:   { file: "games1.json",  key: "games",   word: "game",  items: [] },
  proxies: { file: "proxies.json", key: "proxies", word: "proxy", items: [] }
};
let currentTab = "games";
let activeCategory = "All";
let sortMode = "default";
// ----- Favorites / Recently played / Continue -----
function lsGet(k, d) { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { try { return JSON.parse(d); } catch (x) { return null; } } }
function favs() { return lsGet("mg-favs", "[]") || []; }
function isFav(id) { return favs().indexOf(id) >= 0; }
function toggleFav(id) { const f = favs(); const i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); try { localStorage.setItem("mg-favs", JSON.stringify(f)); } catch (e) {} }
function recentIds() { return lsGet("mg-recent", "[]") || []; }
function pushRecent(id) { let r = recentIds().filter((x) => x !== id); r.unshift(id); r = r.slice(0, 12); try { localStorage.setItem("mg-recent", JSON.stringify(r)); localStorage.setItem("mg-last-game", id); } catch (e) {} }
function lastGame() { try { return localStorage.getItem("mg-last-game") || ""; } catch (e) { return ""; } }
function gameById(id) { return items().find((g) => g.id === id); }
function todaySeed() { const d = new Date(); return (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()); }

const $ = (id) => document.getElementById(id);
const grid = $("grid");
const statusEl = $("status");
const searchEl = $("search");
const categoriesEl = $("categories");
const libraryView = $("libraryView");
const playerView = $("playerView");
const frame = $("gameFrame");

// Pull the src out of an <iframe> string, or return the URL as-is
function getSrc(field) {
  if (!field) return "";
  const trimmed = field.trim();
  if (trimmed.startsWith("<")) {
    const match = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    return match ? match[1] : "";
  }
  return trimmed;
}

async function loadTab(name) {
  const tab = TABS[name];
  try {
    const res = await fetch(tab.file, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    tab.items = Array.isArray(data) ? data : data[tab.key] || [];
  } catch (err) {
    tab.error = true;
    console.error(err);
  }
}

async function loadAll() {
  await Promise.all([...Object.keys(TABS).map(loadTab), loadSounds()]);
  if (location.hash === "#sounds") return switchTab("sounds");
  if (!openFromHash()) switchTab(location.hash === "#proxies" ? "proxies" : "games");
}

// ===== Soundboard (Myinstants embeds) =====
let sounds = [], soundCat = "All";
const soundView = $("soundView");

async function loadSounds() {
  try {
    const res = await fetch("sounds.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    sounds = data.sounds || [];
  } catch (err) {
    $("soundStatus").textContent = "Couldn't load sounds.json.";
    console.error(err);
  }
}

function renderSoundCats() {
  const el = $("soundCats");
  const cats = ["All", ...new Set(sounds.map((s) => s.category || "Other"))];
  el.innerHTML = "";
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === soundCat ? " active" : "");
    btn.textContent = cat === "Cats" ? "🐱 Cats" : cat;
    btn.onclick = () => { soundCat = cat; renderSoundCats(); renderSounds(); };
    el.appendChild(btn);
  });
}

function renderSounds() {
  const q = searchEl.value.trim().toLowerCase();
  const list = sounds.filter((s) =>
    (soundCat === "All" || (s.category || "Other") === soundCat) &&
    (!q || s.title.toLowerCase().includes(q)));
  $("soundStatus").textContent = list.length ? `${list.length} sound${list.length === 1 ? "" : "s"}` : "No sounds found.";
  const gridEl = $("soundGrid");
  gridEl.innerHTML = "";
  list.forEach((s) => {
    const box = document.createElement("div");
    box.className = "sound";
    const f = document.createElement("iframe");
    f.src = `https://www.myinstants.com/instant/${encodeURIComponent(s.myinstants)}/embed/`;
    f.title = s.title;
    f.loading = "lazy";
    f.scrolling = "no";
    f.referrerPolicy = "no-referrer";
    const name = document.createElement("div");
    name.className = "sound-name";
    name.textContent = s.title;
    box.append(f, name);
    gridEl.appendChild(box);
  });
}

function switchTab(name) {
  currentTab = name;
  window.dispatchEvent(new CustomEvent("mg:tab", { detail: name }));
  if (name === "sounds") {
    searchEl.value = "";
    searchEl.placeholder = "Search sounds...";
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.tab === name));
    if (!playerView.classList.contains("hidden")) frame.src = "about:blank";
    playerView.classList.add("hidden");
    libraryView.classList.add("hidden");
    soundView.classList.remove("hidden");
    history.replaceState(null, "", "#sounds");
    renderSoundCats();
    renderSounds();
    return;
  }
  soundView.classList.add("hidden");
  libraryView.classList.remove("hidden");
  activeCategory = "All";
  searchEl.value = "";
  searchEl.placeholder = name === "proxies" ? "Search proxies..." : "Search games...";
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === name));
  if (!playerView.classList.contains("hidden")) closeGame();
  history.replaceState(null, "", name === "proxies" ? "#proxies" : location.pathname);
  renderCategories();
  renderGrid();
}

function items() { return TABS[currentTab].items; }

function renderCategories() {
  const special = [];
  if (currentTab === "games") {
    if (favs().length) special.push("⭐ Favorites");
    if (recentIds().length) special.push("🕒 Recent");
  }
  const cats = [...special, "All", ...new Set(items().map((g) => g.category || "Other"))];
  categoriesEl.innerHTML = "";
  // 🎲 Random + sort control (games tab only)
  if (currentTab === "games") {
    const rnd = document.createElement("button");
    rnd.className = "chip chip-rnd"; rnd.textContent = "🎲 Random";
    rnd.onclick = () => { const g = items()[Math.floor(Math.random() * items().length)]; if (g) openGame(g); };
    categoriesEl.appendChild(rnd);
    const sort = document.createElement("select");
    sort.className = "lib-sort";
    [["default", "Sort: Default"], ["newest", "Sort: Newest"], ["az", "Sort: A–Z"]].forEach(([v, t]) => { const o = document.createElement("option"); o.value = v; o.textContent = t; if (v === sortMode) o.selected = true; sort.appendChild(o); });
    sort.onchange = () => { sortMode = sort.value; renderGrid(); };
    categoriesEl.appendChild(sort);
  }
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === activeCategory ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => {
      activeCategory = cat;
      renderCategories();
      renderGrid();
    };
    categoriesEl.appendChild(btn);
  });
}

function buildCard(item) {
  const card = document.createElement("div");
  card.className = "card"; card.dataset.id = item.id;
  card.onclick = () => explodeThenOpen(card, item);
  let thumb;
  if (item.thumbnail) {
    thumb = document.createElement("img");
    thumb.className = "thumb"; thumb.src = item.thumbnail; thumb.alt = item.title; thumb.loading = "lazy";
    thumb.onerror = () => thumb.replaceWith(makeFallback(item.title));
  } else { thumb = makeFallback(item.title); }
  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = `<div class="card-title"></div><div class="card-cat"></div>`;
  body.querySelector(".card-title").textContent = item.title;
  body.querySelector(".card-cat").textContent = item.category || "Other";
  card.append(thumb, body);
  if (currentTab === "games") {
    const star = document.createElement("button");
    star.className = "fav-star" + (isFav(item.id) ? " on" : ""); star.textContent = isFav(item.id) ? "★" : "☆";
    star.title = "Favorite"; star.onclick = (e) => { e.stopPropagation(); toggleFav(item.id); renderCategories(); renderGrid(); };
    card.appendChild(star);
  }
  return card;
}

function renderGrid() {
  const tab = TABS[currentTab];
  const q = searchEl.value.trim().toLowerCase();
  let list;
  if (activeCategory === "⭐ Favorites") list = items().filter((g) => isFav(g.id));
  else if (activeCategory === "🕒 Recent") list = recentIds().map(gameById).filter(Boolean);
  else list = items().filter((g) => activeCategory === "All" || (g.category || "Other") === activeCategory);
  if (q) list = list.filter((g) => g.title.toLowerCase().includes(q));
  // sorting (Recent keeps its recency order)
  if (activeCategory !== "🕒 Recent") {
    if (sortMode === "az") list = list.slice().sort((a, b) => a.title.localeCompare(b.title));
    else if (sortMode === "newest") { const idx = new Map(items().map((g, i) => [g, i])); list = list.slice().sort((a, b) => idx.get(b) - idx.get(a)); }
  }

  const plural = tab.word === "proxy" ? "proxies" : tab.word + "s";
  if (tab.error) statusEl.textContent = `Couldn't load ${tab.file}. Open the site through GitHub Pages, not by double-clicking index.html.`;
  else statusEl.textContent = list.length ? `${list.length} ${list.length === 1 ? tab.word : plural}` : `No ${plural} found.`;
  grid.innerHTML = "";

  // Featured row (games tab, All category, no search)
  if (currentTab === "games" && activeCategory === "All" && !q && items().length) {
    const gotd = items()[todaySeed() % items().length];
    const last = gameById(lastGame());
    const row = document.createElement("div"); row.className = "lib-feature-row";
    row.appendChild(featureCard("🌟 Game of the Day", gotd));
    if (last) row.appendChild(featureCard("▶️ Continue", last));
    grid.appendChild(row);
  }

  list.forEach((item) => grid.appendChild(buildCard(item)));
}

function featureCard(label, item) {
  const c = document.createElement("button");
  c.className = "feature-card"; c.onclick = () => openGame(item);
  c.innerHTML = `<span class="fc-label"></span><span class="fc-title"></span><span class="fc-cat"></span>`;
  c.querySelector(".fc-label").textContent = label;
  c.querySelector(".fc-title").textContent = item.title;
  c.querySelector(".fc-cat").textContent = item.category || "Other";
  return c;
}

function makeFallback(title) {
  const div = document.createElement("div");
  div.className = "thumb thumb-fallback";
  div.textContent = title.charAt(0).toUpperCase();
  return div;
}

function openGame(item) {
  if (currentTab === "games" && item && item.id) pushRecent(item.id);
  frame.src = getSrc(item.iframe || item.url);
  $("playerTitle").textContent = item.title;
  $("playerDesc").textContent = item.description || "";
  libraryView.classList.add("hidden");
  playerView.classList.remove("hidden");
  location.hash = (currentTab === "proxies" ? "proxy-" : "") + item.id;
  window.scrollTo(0, 0);
  window.dispatchEvent(new CustomEvent("mg:open", { detail: { id: currentTab + ":" + item.id } }));
}

function closeGame() {
  frame.src = "about:blank"; // stops the game & its sound
  window.dispatchEvent(new Event("mg:close"));
  playerView.classList.add("hidden");
  libraryView.classList.remove("hidden");
  history.replaceState(null, "", currentTab === "proxies" ? "#proxies" : location.pathname);
  if (currentTab !== "sounds") { renderCategories(); renderGrid(); } // refresh Recent / Continue
}

function openFromHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h || h === "proxies" || h === "sounds") return false;
  const isProxy = h.startsWith("proxy-");
  const name = isProxy ? "proxies" : "games";
  const id = isProxy ? h.slice(6) : h;
  const item = TABS[name].items.find((g) => g.id === id);
  if (!item) return false;
  switchTab(name);
  openGame(item);
  return true;
}

// ===== Pixel explosion when a game is clicked =====
let exploding = false;

function explodeThenOpen(card, game) {
  if (exploding) return;
  exploding = true;
  playExplosionSound();

  const rect = card.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.8;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // Low-res canvas scaled up = chunky pixels
  const GRID = 48;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = GRID;
  cvs.className = "boom";
  Object.assign(cvs.style, {
    left: cx - size / 2 + "px", top: cy - size / 2 + "px",
    width: size + "px", height: size + "px"
  });
  document.body.appendChild(cvs);
  const ctx = cvs.getContext("2d");

  card.classList.add("shake");
  document.body.classList.add("flash");

  const colors = ["#ffffff", "#fff27a", "#ffc21a", "#ff7a00", "#e03200", "#7a1a00"];
  const debris = Array.from({ length: 26 }, () => {
    const a = Math.random() * Math.PI * 2, sp = 0.25 + Math.random() * 0.55;
    return { a, sp, c: colors[1 + Math.floor(Math.random() * 3)] };
  });
  const noise = Array.from({ length: GRID * GRID }, () => Math.random());

  const DURATION = 850;
  const start = performance.now();
  const R = GRID / 2 - 2;
  const mid = GRID / 2;

  function frame(now) {
    const t = Math.min((now - start) / DURATION, 1);
    ctx.clearRect(0, 0, GRID, GRID);

    const outer = R * (1 - Math.pow(1 - Math.min(t * 1.6, 1), 3));
    const inner = t > 0.45 ? R * ((t - 0.45) / 0.55) * 1.1 : 0;

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const d = Math.hypot(x + 0.5 - mid, y + 0.5 - mid);
        const n = noise[y * GRID + x];
        const edge = outer - n * 3;
        if (d > edge || d < inner + n * 2) continue;
        // hotter in the middle, cooler as time goes on
        let k = d / Math.max(edge, 1) + t * 3.2 + n * 0.6;
        const idx = Math.min(colors.length - 1, Math.floor(k));
        ctx.fillStyle = colors[idx];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // flying chunks
    for (const p of debris) {
      const dist = (R * 0.3) + p.sp * R * 2.2 * t;
      const px = Math.round(mid + Math.cos(p.a) * dist);
      const py = Math.round(mid + Math.sin(p.a) * dist + t * t * 6);
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = p.c;
      ctx.fillRect(px, py, 2, 2);
      ctx.globalAlpha = 1;
    }

    if (t < 1) requestAnimationFrame(frame);
    else {
      cvs.remove();
      card.classList.remove("shake");
      document.body.classList.remove("flash");
      exploding = false;
      openGame(game);
    }
  }
  requestAnimationFrame(frame);
}

// Deltarune explosion sound (falls back to the made-up boom if it can't play)
const explosionSound = new Audio("sounds/deltarune-explosion.mp3");
explosionSound.preload = "auto";
function playExplosionSound() {
  try {
    const s = explosionSound.cloneNode();
    s.volume = 0.8;
    const p = s.play();
    if (p && p.catch) p.catch(() => playBoom());
  } catch (e) { playBoom(); }
}

// Short retro "boom" made in the browser (no sound file needed)
let audioCtx;
function playBoom() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ac = audioCtx, now = ac.currentTime;

    // noise burst
    const len = Math.floor(ac.sampleRate * 0.6);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3000, now);
    lp.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.5, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    noise.connect(lp).connect(ng).connect(ac.destination);
    noise.start(now);

    // low thump
    const osc = ac.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.25, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(og).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) { /* sound is optional */ }
}

// Library-upgrade styles (favorites, random, sort, featured cards)
(function libCss() {
  const s = document.createElement("style"); s.id = "lib-css";
  s.textContent = ".card{position:relative}"
    + ".fav-star{position:absolute;top:6px;right:6px;z-index:3;background:rgba(0,0,0,.45);border:none;color:#ffd84a;font-size:1.1rem;width:30px;height:30px;border-radius:50%;cursor:pointer;line-height:1;padding:0;display:flex;align-items:center;justify-content:center}"
    + ".fav-star.on{background:rgba(255,216,74,.25)}.fav-star:hover{transform:scale(1.15)}"
    + ".chip-rnd{background:linear-gradient(90deg,#6c5ce7,#a06bff);color:#fff;font-weight:800}"
    + ".lib-sort{background:var(--panel);color:var(--text);border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:7px 12px;font-weight:700;font-size:.82rem;cursor:pointer}"
    + ".lib-feature-row{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:6px}"
    + ".feature-card{text-align:left;border:none;cursor:pointer;color:#fff;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:3px;background:linear-gradient(135deg,#2a1d55,#4a1d55);box-shadow:0 4px 16px rgba(108,92,231,.3)}"
    + ".feature-card:hover{filter:brightness(1.1)}.fc-label{font-size:.72rem;font-weight:800;color:#ffd84a;letter-spacing:1px}.fc-title{font-size:1.25rem;font-weight:900}.fc-cat{font-size:.78rem;opacity:.8}";
  document.head.appendChild(s);
})();

// Events
searchEl.addEventListener("input", () => {
  if (currentTab === "sounds") return renderSounds();
  if (!playerView.classList.contains("hidden")) closeGame();
  renderGrid();
});
$("backBtn").onclick = closeGame;
$("homeLink").onclick = (e) => { e.preventDefault(); closeGame(); };
$("reloadBtn").onclick = () => { frame.src = frame.src; };
$("fullscreenBtn").onclick = () => {
  const wrap = $("frameWrap");
  if (wrap.requestFullscreen) wrap.requestFullscreen();
  else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
};
window.addEventListener("hashchange", () => {
  if (!location.hash || location.hash === "#proxies") {
    if (!playerView.classList.contains("hidden")) closeGame();
  }
});
document.querySelectorAll(".tab").forEach((t) => {
  t.onclick = () => switchTab(t.dataset.tab);
});

loadAll();
