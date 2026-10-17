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
  await Promise.all(Object.keys(TABS).map(loadTab));
  if (!openFromHash()) switchTab(location.hash === "#proxies" ? "proxies" : "games");
}

function switchTab(name) {
  currentTab = name;
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
  const cats = ["All", ...new Set(items().map((g) => g.category || "Other"))];
  categoriesEl.innerHTML = "";
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

function renderGrid() {
  const tab = TABS[currentTab];
  const q = searchEl.value.trim().toLowerCase();
  const list = items().filter((g) => {
    const inCat = activeCategory === "All" || (g.category || "Other") === activeCategory;
    const inSearch = !q || g.title.toLowerCase().includes(q);
    return inCat && inSearch;
  });

  const plural = tab.word === "proxy" ? "proxies" : tab.word + "s";
  if (tab.error) statusEl.textContent = `Couldn't load ${tab.file}. Open the site through GitHub Pages, not by double-clicking index.html.`;
  else statusEl.textContent = list.length ? `${list.length} ${list.length === 1 ? tab.word : plural}` : `No ${plural} found.`;
  grid.innerHTML = "";

  list.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => explodeThenOpen(card, item);

    let thumb;
    if (item.thumbnail) {
      thumb = document.createElement("img");
      thumb.className = "thumb";
      thumb.src = item.thumbnail;
      thumb.alt = item.title;
      thumb.loading = "lazy";
      thumb.onerror = () => thumb.replaceWith(makeFallback(item.title));
    } else {
      thumb = makeFallback(item.title);
    }

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `<div class="card-title"></div><div class="card-cat"></div>`;
    body.querySelector(".card-title").textContent = item.title;
    body.querySelector(".card-cat").textContent = item.category || "Other";

    card.append(thumb, body);
    grid.appendChild(card);
  });
}

function makeFallback(title) {
  const div = document.createElement("div");
  div.className = "thumb thumb-fallback";
  div.textContent = title.charAt(0).toUpperCase();
  return div;
}

function openGame(item) {
  frame.src = getSrc(item.iframe || item.url);
  $("playerTitle").textContent = item.title;
  $("playerDesc").textContent = item.description || "";
  libraryView.classList.add("hidden");
  playerView.classList.remove("hidden");
  location.hash = (currentTab === "proxies" ? "proxy-" : "") + item.id;
  window.scrollTo(0, 0);
}

function closeGame() {
  frame.src = "about:blank"; // stops the game & its sound
  playerView.classList.add("hidden");
  libraryView.classList.remove("hidden");
  history.replaceState(null, "", currentTab === "proxies" ? "#proxies" : location.pathname);
}

function openFromHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h || h === "proxies") return false;
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
  playBoom();

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

// Events
searchEl.addEventListener("input", () => {
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

// ===== Falling :3 particles =====
(function () {
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  const COUNT = 45;
  let w, h, parts = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function makePart(startAnywhere) {
    return {
      x: Math.random() * w,
      y: startAnywhere ? Math.random() * h : -30,
      size: 12 + Math.random() * 14,
      speed: 0.4 + Math.random() * 1.1,
      drift: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      angle: (Math.random() - 0.5) * 0.6,
      alpha: 0.45 + Math.random() * 0.45
    };
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.y += p.speed;
      p.drift += 0.01;
      p.x += Math.sin(p.drift) * 0.4;
      p.angle += p.spin;
      if (p.y > h + 30) Object.assign(p, makePart(false));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.alpha;
      ctx.font = `bold ${p.size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(":3", 0, 0);
      ctx.restore();
    }
    requestAnimationFrame(tick);
  }

  resize();
  parts = Array.from({ length: COUNT }, () => makePart(true));
  window.addEventListener("resize", resize);
  tick();
})();
