// ===== MaxwellGames: Service Worker — play offline (on the bus!) =====
// Caches the whole Maxwell site so the Arcade, Duels, Battles, Sims, AI Lab,
// Platformer and Kart 3D all work with NO internet once you've loaded them once.
// (External linked games on other websites still need internet.)
const CACHE = "maxwellgames-v107";
const PRECACHE = [
  "admin.js",
  "account.js",
  "ailab.js",
  "analytics.js",
  "arcade.js",
  "audio.js",
  "battle.js",
  "boss.js",
  "challenges.js",
  "flavor.js",
  "settings.js",
  "tutorial.js",
  "companion.js",
  "coreplay.js",
  "craft.js",
  "dressup.js",
  "duels.js",
  "duelsolo.js",
  "exchange.js",
  "factory.js",
  "features.js",
  "games/builtin/kit.js",
  "games/builtin/breakout.html",
  "games/builtin/bubble.html",
  "games/builtin/colormatch.html",
  "games/builtin/crossy.html",
  "games/builtin/fishslice.html",
  "games/builtin/highway.html",
  "games/builtin/invaders.html",
  "games/builtin/lightpaws.html",
  "games/builtin/match3.html",
  "games/builtin/maze.html",
  "games/builtin/muncher.html",
  "games/builtin/runner.html",
  "games/builtin/stack.html",
  "games/builtin/tiles.html",
  "games/builtin/battleship.html",
  "games/builtin/checkers.html",
  "games/builtin/othello.html",
  "games/builtin/chess.html",
  "games/builtin/jigsaw.html",
  "games/builtin/crossword.html",
  "games/builtin/mahjong.html",
  "games/builtin/dotsboxes.html",
  "games/builtin/spotdiff.html",
  "games/builtin/wordsearch.html",
  "games/builtin/solitaire.html",
  "games/builtin/rhythm.html",
  "games/builtin/airhockey.html",
  "games/builtin/fishmerge.html",
  "games/builtin/catman.html",
  "games/builtin/sudoku.html",
  "games/builtin/typerace.html",
  "games/builtin/idle.html",
  "games/builtin/minigolf.html",
  "games/builtin/towerdef.html",
  "games/builtin/wheresmaxwell.html",
  "games/builtin/connect4.html",
  "games/builtin/doodle.html",
  "games/builtin/flappy.html",
  "games/builtin/g2048.html",
  "games/builtin/memory.html",
  "games/builtin/minesweeper.html",
  "games/builtin/pong.html",
  "games/builtin/shooter.html",
  "games/builtin/simon.html",
  "games/builtin/snake.html",
  "games/builtin/tetris.html",
  "games/builtin/thumbs/breakout.svg",
  "games/builtin/thumbs/colormatch.svg",
  "games/builtin/thumbs/connect4.svg",
  "games/builtin/thumbs/doodle.svg",
  "games/builtin/thumbs/flappy.svg",
  "games/builtin/thumbs/g2048.svg",
  "games/builtin/thumbs/memory.svg",
  "games/builtin/thumbs/minesweeper.svg",
  "games/builtin/thumbs/pong.svg",
  "games/builtin/thumbs/shooter.svg",
  "games/builtin/thumbs/simon.svg",
  "games/builtin/thumbs/snake.svg",
  "games/builtin/thumbs/tetris.svg",
  "games/builtin/thumbs/tictactoe.svg",
  "games/builtin/tictactoe.html",
  "games/lumin/index.html",
  "games/platformer/index.html",
  "games/platformer/thumb.png",
  "games1.json",
  "hubtabs1.js",
  "hubtabs2.js",
  "hubtabs3.js",
  "hubtabs4.js",
  "hubtabs5.js",
  "images/background.jpg",
  "images/bad-time-simulator.png",
  "images/bee-sans.png",
  "images/cherri.png",
  "images/cursor-cat-big.png",
  "images/cursor-cat.png",
  "images/cursor-gengar.png",
  "images/cursor-maxwell.png",
  "images/cursor-owner.png",
  "images/deltarune.png",
  "images/fern.png",
  "images/gengar.png",
  "images/gn-math.png",
  "images/last-breath.png",
  "images/lumin.png",
  "images/maxwell-bulbasaur.png",
  "images/maxwell-charizard.png",
  "images/maxwell-gengar.png",
  "images/maxwell-king.png",
  "images/maxwell-mewtwo.png",
  "images/maxwell-pikachu.png",
  "images/maxwell-squirtle.png",
  "images/memes/cool.png",
  "images/memes/crying.png",
  "images/memes/derp.png",
  "images/memes/grumpy.png",
  "images/memes/happy.png",
  "images/memes/judging.png",
  "images/memes/love.png",
  "images/memes/shocked.png",
  "images/memes/sleepy.png",
  "images/opium.png",
  "images/owner-cat.png",
  "images/sami-cat.png",
  "images/tung-tung.png",
  "images/undertale.png",
  "index.html",
  "leaderboard.js",
  "live-config.js",
  "lootbox.js",
  "maxwellboss.js",
  "manifest.json",
  "maxwell.png",
  "maxwelltv.js",
  "pass.js",
  "pets.js",
  "proxies.json",
  "safety.js",
  "script.js",
  "sims.js",
  "themes.js",
  "sounds.json",
  "style.css",
  "suggest-config.js",
  "sw.js",
  "touch.js",
  "ui-kit.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // add each file individually so one missing file can't break the whole install
      Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  // Let cross-origin requests (external games, analytics, fonts) go straight to the network.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok && (res.type === "basic" || res.type === "default")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => {
        // offline fallback: serve the app shell for page navigations
        if (req.mode === "navigate") return caches.match("index.html");
        return undefined;
      });
    })
  );
});
