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
    card.onclick = () => openGame(game);

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
