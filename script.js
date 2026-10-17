// ===== MaxwellGames =====
// Loads games from games1.json and shows them in a grid.
// Each game's "iframe" field can be either a plain URL
// or a full <iframe ...> embed code — both work.

let games = [];
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
function getSrc(iframeField) {
  if (!iframeField) return "";
  const trimmed = iframeField.trim();
  if (trimmed.startsWith("<")) {
    const match = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    return match ? match[1] : "";
  }
  return trimmed;
}

async function loadGames() {
  try {
    const res = await fetch("games1.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    games = Array.isArray(data) ? data : data.games || [];
    renderCategories();
    renderGrid();
    openFromHash();
  } catch (err) {
    statusEl.textContent =
      "Couldn't load games1.json. If you opened index.html directly from your computer, " +
      "use GitHub Pages or a local server instead (see instructions).";
    console.error(err);
  }
}

function renderCategories() {
  const cats = ["All", ...new Set(games.map((g) => g.category || "Other"))];
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
  const q = searchEl.value.trim().toLowerCase();
  const list = games.filter((g) => {
    const inCat = activeCategory === "All" || (g.category || "Other") === activeCategory;
    const inSearch = !q || g.title.toLowerCase().includes(q);
    return inCat && inSearch;
  });

  statusEl.textContent = list.length ? `${list.length} game${list.length === 1 ? "" : "s"}` : "No games found.";
  grid.innerHTML = "";

  list.forEach((game) => {
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => explodeThenOpen(card, game);

    let thumb;
    if (game.thumbnail) {
      thumb = document.createElement("img");
      thumb.className = "thumb";
      thumb.src = game.thumbnail;
      thumb.alt = game.title;
      thumb.loading = "lazy";
      thumb.onerror = () => thumb.replaceWith(makeFallback(game.title));
    } else {
      thumb = makeFallback(game.title);
    }

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `<div class="card-title"></div><div class="card-cat"></div>`;
    body.querySelector(".card-title").textContent = game.title;
    body.querySelector(".card-cat").textContent = game.category || "Other";

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

function openGame(game) {
  frame.src = getSrc(game.iframe);
  $("playerTitle").textContent = game.title;
  $("playerDesc").textContent = game.description || "";
  const credit = $("playerCredit");
  credit.textContent = game.creditText || "";
  if (game.creditUrl) credit.href = game.creditUrl; else credit.removeAttribute("href");
  libraryView.classList.add("hidden");
  playerView.classList.remove("hidden");
  location.hash = game.id;
  window.scrollTo(0, 0);
}

function closeGame() {
  frame.src = "about:blank"; // stops the game & its sound
  playerView.classList.add("hidden");
  libraryView.classList.remove("hidden");
  history.replaceState(null, "", location.pathname);
}

function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const game = games.find((g) => g.id === id);
  if (game) openGame(game);
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
  if (!location.hash) closeGame();
});

loadGames();

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
