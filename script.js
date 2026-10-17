// ===== MaxwellGames =====
// Loads games from games.json and shows them in a grid.
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
    const res = await fetch("games.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    games = Array.isArray(data) ? data : data.games || [];
    renderCategories();
    renderGrid();
    openFromHash();
  } catch (err) {
    statusEl.textContent =
      "Couldn't load games.json. If you opened index.html directly from your computer, " +
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

// ===== Background video (YouTube) =====
const BG_VIDEO_ID = "YRvOePz2OqQ";
const BG_START = 143; // seconds (2:23)

function onYouTubeIframeAPIReady() {
  new YT.Player("bgPlayer", {
    videoId: BG_VIDEO_ID,
    playerVars: {
      autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0,
      modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3,
      start: BG_START
    },
    events: {
      onReady: (e) => { e.target.mute(); e.target.playVideo(); },
      onStateChange: (e) => {
        // When the video ends, jump back to the start time and keep playing
        if (e.data === YT.PlayerState.ENDED) {
          e.target.seekTo(BG_START, true);
          e.target.playVideo();
        }
      }
    }
  });
}
