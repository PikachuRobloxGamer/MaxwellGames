// ===== MaxwellGames: ARCADE — a whole bunch of minigames =====
// Each game awards treats through window.MG. Best scores live in the main save.
(function () {
  function MAXsrc() { const i = document.querySelector(".logo-img"); return (i && i.src) || "maxwell.png"; }

  // tiny sound helper (own AudioContext so we don't depend on features.js internals)
  let AC;
  function actx() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); return AC; } catch (e) { return null; } }
  function tone(freq, dur, type, vol) {
    const a = actx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type || "square"; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
  }

  function canvas(host, w, h, cls) { const c = document.createElement("canvas"); c.width = w; c.height = h; c.className = "ar-canvas " + (cls || ""); host.appendChild(c); return c; }
  let MAXIMG = null;
  function maxImg() { if (!MAXIMG) { MAXIMG = new Image(); MAXIMG.src = MAXsrc(); } return MAXIMG; }
  function drawMax(x, cx, cy, r) { const img = maxImg(); if (img && img.complete && img.naturalWidth) { x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.closePath(); x.clip(); x.drawImage(img, cx - r, cy - r, r * 2, r * 2); x.restore(); } else { x.fillStyle = "#fff"; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } }
  function hintLine(host, text) { const p = document.createElement("p"); p.className = "ar-hint"; p.innerHTML = text; host.appendChild(p); return p; }

  // ---------- cleanup registry (per active game) ----------
  let reg = [];
  function cleanup() { reg.forEach((fn) => { try { fn(); } catch (e) {} }); reg = []; }
  function onClean(fn) { reg.push(fn); }

  // ---------- overlay ----------
  function refreshTreats() { const el = document.getElementById("arTreats"); if (el && window.MG) el.textContent = window.MG.save.treats; }

  function closeArcade() { cleanup(); const ov = document.getElementById("arcadeOv"); if (ov) { if (ov._esc) document.removeEventListener("keydown", ov._esc); ov.remove(); } }

  function openArcade() {
    if (!window.MG) return;
    closeArcade();
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = "arcadeOv";
    ov.innerHTML = `
      <div class="arcade-box">
        <div class="arcade-head">
          <button class="btn ar-back hidden" id="arBack">← Arcade</button>
          <h2 id="arTitle">🕹️ Maxwell Arcade</h2>
          <span class="ar-treats">🐟 <b id="arTreats">0</b></span>
          <button class="btn ar-x" id="arClose" aria-label="Close">✕</button>
        </div>
        <div class="arcade-body menu" id="arBody"></div>
      </div>`;
    document.body.appendChild(ov);
    document.getElementById("arClose").onclick = closeArcade;
    document.getElementById("arBack").onclick = showMenu;
    ov.addEventListener("click", (e) => { if (e.target === ov) closeArcade(); });
    const esc = (e) => { if (e.key !== "Escape") return; const back = document.getElementById("arBack"); if (!back) return; if (!back.classList.contains("hidden")) showMenu(); else closeArcade(); };
    document.addEventListener("keydown", esc);
    ov._esc = esc;
    refreshTreats();
    showMenu();
  }

  function catOf(g) {
    if (g.isNew) return "new";
    if (g.key === "sball") return "create";
    if (g.key === "wheel" || g.key === "slots") return "lucky";
    return "classic";
  }
  const CAT_META = [
    ["new", "✨ New Games"],
    ["classic", "🎮 Arcade Classics"],
    ["lucky", "🍀 Lucky Games"],
    ["create", "🎬 Create"]
  ];
  function showMenu() {
    cleanup();
    document.getElementById("arBack").classList.add("hidden");
    document.getElementById("arTitle").textContent = "🕹️ Maxwell Arcade";
    const body = document.getElementById("arBody");
    body.className = "arcade-body menu";
    body.innerHTML = "";
    const newCount = GAMES.filter((g) => g.isNew).length;
    const news = document.createElement("div"); news.className = "ar-news";
    news.innerHTML = `<b>🎉 BIGGEST UPDATE EVER!</b> ${newCount} new games added — Breakout, Blocks, Doodle Jump, Tower Stack, Meow Tiles, Aim Trainer & more. ${GAMES.length} games total!`;
    body.appendChild(news);
    CAT_META.forEach(([cat, label]) => {
      const list = GAMES.filter((g) => catOf(g) === cat);
      if (!list.length) return;
      const h = document.createElement("h3"); h.className = "ar-cat"; h.textContent = label; body.appendChild(h);
      const grid = document.createElement("div"); grid.className = "ar-grid"; body.appendChild(grid);
      list.forEach((g) => {
        const best = window.MG.arcadeBest(g.key);
        const tile = document.createElement("button"); tile.className = "ar-tile" + (g.isNew ? " is-new" : "");
        tile.innerHTML = `<span class="ar-ic"></span><span class="ar-name"></span><span class="ar-best"></span>` + (g.isNew ? `<span class="ar-ribbon">NEW</span>` : "");
        tile.querySelector(".ar-ic").textContent = g.icon;
        tile.querySelector(".ar-name").textContent = g.name;
        tile.querySelector(".ar-best").textContent = g.special ? g.tag : (g.bestLabel ? g.bestLabel(best) : (best ? "Best: " + best : "Play!"));
        tile.onclick = () => launch(g);
        grid.appendChild(tile);
      });
    });
    refreshTreats();
  }

  function launch(g) {
    cleanup();
    document.getElementById("arBack").classList.remove("hidden");
    document.getElementById("arTitle").textContent = g.icon + " " + g.name;
    const body = document.getElementById("arBody");
    body.className = "arcade-body game";
    body.innerHTML = "";
    const api = {
      finish: (score, opts) => finish(g, score, opts || {}),
      tone,
      meow: () => window.MG.meow(),
      boom: () => window.MG.boomSound(0.12),
      onClean,
      img: MAXsrc(),
      refreshTreats
    };
    try { g.play(body, api); } catch (e) { body.innerHTML = "<p class='ar-hint'>Oops, that game hiccuped. Go back and try again.</p>"; }
    maxwellMascot(body);
  }
  function maxwellMascot(container) { if (!container || container.querySelector(".game-maxwell")) return; const im = document.createElement("img"); im.className = "game-maxwell"; im.src = MAXsrc(); im.alt = "Maxwell"; container.appendChild(im); }

  function finish(g, score, opts) {
    cleanup();
    window.MG.arcadePlayed();
    const forBest = opts.scoreForBest != null ? opts.scoreForBest : score;
    const res = window.MG.arcadeScore(g.key, forBest);
    const reward = Math.max(1, Math.round(g.reward ? g.reward(score, opts) : score));
    window.MG.addTreats(reward);
    if (opts.flag) window.MG.flag(opts.flag);
    refreshTreats();
    const body = document.getElementById("arBody");
    body.className = "arcade-body result";
    body.innerHTML = `
      <div class="ar-result">
        <img src="${MAXsrc()}" class="ar-res-cat" alt="">
        <h2 class="ar-res-title"></h2>
        <p class="ar-score"></p>
        <p class="ar-reward">+${reward} 🐟</p>
        <p class="ar-bestline"></p>
        <div class="ar-res-btns">
          <button class="btn asc-btn" id="arAgain">▶ Play again</button>
          <button class="btn" id="arMenu">🕹️ Arcade</button>
        </div>
      </div>`;
    body.querySelector(".ar-res-title").textContent = opts.title || "Nice!";
    body.querySelector(".ar-score").innerHTML = opts.line || ("Score: <b>" + score + "</b>");
    body.querySelector(".ar-bestline").textContent = res.isBest ? "🏆 New best!" : (g.bestLabel ? g.bestLabel(res.best) : "Best: " + res.best);
    document.getElementById("arAgain").onclick = () => launch(g);
    document.getElementById("arMenu").onclick = showMenu;
    window.MG.boomSound(0.1);
  }

  // ============================================================
  // GAMES
  // ============================================================
  const GAMES = [

    // ==================== NEW GAMES ====================

    // ---------- Maxwell Maze 3D (raycaster) ----------
    {
      key: "maze3d", name: "Maxwell Maze 3D", icon: "🧊", isNew: true, reward: (s) => Math.max(5, s),
      play(host, api) {
        const W = 380, H = 300; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>Real 3D!</b> ↑/W forward · ↓/S back · ←/→ or A/D turn. Find the golden exit!");
        const N = 7, S = 2 * N + 1;
        const m = []; for (let y = 0; y < S; y++) { m.push([]); for (let xx = 0; xx < S; xx++) m[y].push(1); }
        (function carve(cx, cy) { m[cy][cx] = 0; const ds = [[0, -1], [0, 1], [-1, 0], [1, 0]].sort(() => Math.random() - 0.5); for (const d of ds) { const nx = cx + d[0] * 2, ny = cy + d[1] * 2; if (nx > 0 && nx < S && ny > 0 && ny < S && m[ny][nx] === 1) { m[cy + d[1]][cx + d[0]] = 0; carve(nx, ny); } } })(1, 1);
        const ex = S - 2, ey = S - 2; m[ey][ex] = 0;
        let px = 1.5, py = 1.5, ang = 0, t0 = Date.now(), over = false, raf; const keys = {};
        const FOV = 0.7;
        function cell(cx, cy) { if (cx < 0 || cy < 0 || cx >= S || cy >= S) return 1; return m[cy | 0][cx | 0]; }
        function loop() {
          if (!over) {
            const sp = 0.055, rot = 0.045;
            if (keys["arrowleft"] || keys["a"]) ang -= rot; if (keys["arrowright"] || keys["d"]) ang += rot;
            let mv = 0; if (keys["arrowup"] || keys["w"]) mv = 1; if (keys["arrowdown"] || keys["s"]) mv = -1;
            if (mv) { const nx = px + Math.cos(ang) * sp * mv, ny = py + Math.sin(ang) * sp * mv; if (!cell(nx, py)) px = nx; if (!cell(px, ny)) py = ny; }
            if ((px | 0) === ex && (py | 0) === ey) return end();
          }
          // ceiling & floor
          x.fillStyle = "#0a1020"; x.fillRect(0, 0, W, H / 2); x.fillStyle = "#161b2e"; x.fillRect(0, H / 2, W, H / 2);
          const cols = 120, cw = W / cols;
          for (let i = 0; i < cols; i++) {
            const ra = ang - FOV / 2 + (i / cols) * FOV;
            const sin = Math.sin(ra), cos = Math.cos(ra);
            let dist = 0, hit = false, side = 0;
            while (dist < 20 && !hit) { dist += 0.02; const tx = px + cos * dist, ty = py + sin * dist; if (cell(tx, ty)) { hit = true; const fx = tx - Math.floor(tx), fy = ty - Math.floor(ty); side = (Math.min(fx, 1 - fx) < Math.min(fy, 1 - fy)) ? 0 : 1; } }
            const corrected = dist * Math.cos(ra - ang);
            const hgt = Math.min(H, H / corrected);
            const near = (px | 0) === ex && (py | 0) === ey;
            const shade = Math.max(0, 1 - corrected / 10) * (side ? 0.7 : 1);
            // color: walls bluish, exit区 gold
            const exitNear = Math.hypot((px + cos * dist) - (ex + 0.5), (py + sin * dist) - (ey + 0.5)) < 0.8;
            if (exitNear) x.fillStyle = "rgba(" + (255 * shade | 0) + "," + (216 * shade | 0) + "," + (74 * shade | 0) + ",1)";
            else x.fillStyle = "rgba(" + (108 * shade | 0) + "," + (150 * shade | 0) + "," + (231 * shade | 0) + ",1)";
            x.fillRect(i * cw, (H - hgt) / 2, cw + 1, hgt);
          }
          // minimap
          const ms = 5; x.globalAlpha = 0.8;
          for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) { x.fillStyle = (xx === ex && yy === ey) ? "#ffd84a" : m[yy][xx] ? "#2a3350" : "#0c1020"; x.fillRect(6 + xx * ms, 6 + yy * ms, ms - 1, ms - 1); }
          x.fillStyle = "#3ee08f"; x.fillRect(6 + px * ms - 1, 6 + py * ms - 1, 3, 3); x.globalAlpha = 1;
          x.fillStyle = "#fff"; x.font = "bold 13px system-ui"; x.textAlign = "right"; x.fillText("Find the GOLD exit", W - 8, 18);
          raf = requestAnimationFrame(loop);
        }
        function end() { over = true; cancelAnimationFrame(raf); const secs = Math.round((Date.now() - t0) / 1000); const score = Math.max(5, 200 - secs * 2); api.boom(); api.finish(score, { scoreForBest: score, title: "Escaped! 🧊", line: "Out in <b>" + secs + "s</b>!" }); }
        const kd = (e) => { const k = e.key.toLowerCase(); if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) { keys[k] = true; e.preventDefault(); } };
        const ku = (e) => { keys[e.key.toLowerCase()] = false; };
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    },

    // ---------- Maxwell Road 3D (pseudo-3D driver) ----------
    {
      key: "road3d", name: "Maxwell Road 3D", icon: "🏎️", isNew: true, reward: (s) => Math.floor(s / 8),
      play(host, api) {
        const W = 380, H = 320; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>3D!</b> ←/→ or A/D to switch lanes. Dodge the cars down the highway!");
        const HZ = H * 0.34, roadW = W * 0.9;
        let lane = 1, obs = [], score = 0, over = false, raf, frame = 0, dash = 0, lanePos = 1;
        function projX(l, z) { const cx = W / 2; return cx + (l - 1) * (roadW * 0.33) * z; }
        function spawn() { obs.push({ lane: (Math.random() * 3) | 0, z: 0.02, hue: (Math.random() * 360) | 0 }); }
        function loop() {
          // sky + grass
          x.fillStyle = "#0a1226"; x.fillRect(0, 0, W, HZ); x.fillStyle = "#0c3b1e"; x.fillRect(0, HZ, W, H - HZ);
          // road trapezoid
          x.fillStyle = "#1c2030"; x.beginPath(); x.moveTo(W / 2 - 18, HZ); x.lineTo(W / 2 + 18, HZ); x.lineTo(W / 2 + roadW / 2, H); x.lineTo(W / 2 - roadW / 2, H); x.closePath(); x.fill();
          // lane dashes
          dash = (dash + 6) % 40;
          x.strokeStyle = "rgba(255,255,255,0.5)";
          for (let s = 0; s < 14; s++) { const z = (s * 40 + dash) / 560; if (z <= 0) continue; const y = HZ + z * (H - HZ); x.lineWidth = 1 + z * 4; [0.5, 1.5].forEach((l) => { x.beginPath(); x.moveTo(projX(l, z), y); x.lineTo(projX(l, z), y + z * 20); x.stroke(); }); }
          if (!over) {
            lanePos += (lane - lanePos) * 0.2;
            frame++; score += 0.25; if (frame % Math.max(26, 60 - (score / 8 | 0)) === 0) spawn();
            obs.forEach((o) => o.z += 0.012 + score * 0.00004);
            obs = obs.filter((o) => { if (o.z > 1.1) return false; if (o.z > 0.86 && o.z < 1.02 && o.lane === Math.round(lanePos)) { over = true; api.boom(); } return true; });
          }
          obs.sort((a, b) => a.z - b.z).forEach((o) => { const z = o.z, y = HZ + z * (H - HZ), w = 14 + z * 56, h = 10 + z * 40; x.fillStyle = "hsl(" + o.hue + " 70% " + (30 + z * 30) + "%)"; x.fillRect(projX(o.lane, z) - w / 2, y - h, w, h); });
          // player car
          const pz = 1, py = HZ + pz * (H - HZ) - 44; x.fillStyle = "#3ee08f"; x.fillRect(projX(lanePos, pz) - 18, py, 36, 40); x.fillStyle = "#0a0f1c"; x.fillRect(projX(lanePos, pz) - 12, py + 6, 24, 12);
          x.fillStyle = "#fff"; x.font = "bold 16px system-ui"; x.textAlign = "right"; x.fillText(Math.floor(score) + "m", W - 8, 22);
          if (over) { cancelAnimationFrame(raf); api.finish(Math.floor(score), { title: score >= 300 ? "Speed King! 🏎️" : "Crash!", line: "Drove <b>" + Math.floor(score) + "m</b>" }); return; }
          raf = requestAnimationFrame(loop);
        }
        const kd = (e) => { const k = e.key.toLowerCase(); if (k === "arrowleft" || k === "a") { lane = Math.max(0, lane - 1); e.preventDefault(); } if (k === "arrowright" || k === "d") { lane = Math.min(2, lane + 1); e.preventDefault(); } };
        document.addEventListener("keydown", kd);
        c.addEventListener("pointerdown", (e) => { const r = c.getBoundingClientRect(); if ((e.clientX - r.left) < r.width / 2) lane = Math.max(0, lane - 1); else lane = Math.min(2, lane + 1); });
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); });
        loop();
      }
    },

    // ---------- Maxwell Copter ----------
    {
      key: "copter", name: "Maxwell Copter", icon: "🚁", isNew: true, reward: (s) => Math.floor(s / 6),
      play(host, api) {
        const W = 420, H = 280; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>Hold</b> space / mouse to rise, release to fall. Fly through the cave!");
        const cat = new Image(); cat.src = api.img;
        let y = H / 2, vy = 0, down = false, score = 0, over = false, raf, frame = 0, walls = [], gap = 150;
        function loop() {
          x.fillStyle = "#0a1020"; x.fillRect(0, 0, W, H);
          if (!over) {
            vy += down ? -0.5 : 0.42; vy = Math.max(-5, Math.min(6, vy)); y += vy;
            frame++; gap = Math.max(96, 150 - score * 0.1);
            if (frame % 46 === 0) { const top = 20 + Math.random() * (H - gap - 40); walls.push({ x: W, top: top, gap: gap, p: false }); }
            walls.forEach((w) => { w.x -= 3; if (!w.p && w.x + 30 < 60) { w.p = true; score++; api.tone(700, 0.04); } });
            walls = walls.filter((w) => w.x > -40);
            if (y < 8 || y > H - 8) over = true;
            walls.forEach((w) => { if (60 + 14 > w.x && 60 - 14 < w.x + 30) { if (y - 12 < w.top || y + 12 > w.top + w.gap) over = true; } });
            if (over) api.boom();
          }
          x.fillStyle = "#6c5ce7"; walls.forEach((w) => { x.fillRect(w.x, 0, 30, w.top); x.fillRect(w.x, w.top + w.gap, 30, H - w.top - w.gap); });
          if (cat.complete) x.drawImage(cat, 48, y - 14, 28, 28); else { x.fillStyle = "#ffd84a"; x.beginPath(); x.arc(60, y, 13, 0, 7); x.fill(); }
          x.fillStyle = "#fff"; x.font = "bold 18px system-ui"; x.textAlign = "left"; x.fillText(score, 10, 24);
          if (over) { cancelAnimationFrame(raf); api.finish(score, { title: score >= 25 ? "Ace pilot! 🚁" : "Crash!", line: "Passed <b>" + score + "</b> walls" }); return; }
          raf = requestAnimationFrame(loop);
        }
        const dn = (e) => { if (e.type === "keydown" && e.code !== "Space") return; down = true; e.preventDefault && e.preventDefault(); };
        const up = () => { down = false; };
        document.addEventListener("keydown", dn); document.addEventListener("keyup", (e) => { if (e.code === "Space") down = false; });
        c.addEventListener("pointerdown", () => down = true); document.addEventListener("pointerup", up);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", dn); document.removeEventListener("pointerup", up); });
        loop();
      }
    },

    // ---------- Fish Ninja ----------
    {
      key: "ninja", name: "Fish Ninja", icon: "🔪", isNew: true, reward: (s) => s * 2,
      play(host, api) {
        const W = 380, H = 420; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Swipe/drag across the 🐟 to slice them! Avoid 💣. 3 misses = out.");
        let items = [], score = 0, lives = 3, over = false, raf, frame = 0, trail = [], down = false;
        function spawn() { const bomb = Math.random() < 0.18; items.push({ x: 30 + Math.random() * (W - 60), y: H + 20, vx: (Math.random() - 0.5) * 4, vy: -(9 + Math.random() * 3), bomb: bomb, sliced: false }); }
        function loop() {
          x.fillStyle = "#0c1626"; x.fillRect(0, 0, W, H);
          if (!over) {
            frame++; if (frame % 38 === 0) spawn();
            items.forEach((it) => { it.vy += 0.16; it.x += it.vx; it.y += it.vy; });
            items = items.filter((it) => { if (it.y > H + 40 && it.vy > 0) { if (!it.bomb && !it.sliced) { lives--; if (lives <= 0) over = true; } return false; } return true; });
          }
          x.font = "30px system-ui,'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle";
          items.forEach((it) => { if (it.sliced) return; x.fillText(it.bomb ? "💣" : "🐟", it.x, it.y); });
          // slice trail
          x.strokeStyle = "rgba(255,255,255,0.8)"; x.lineWidth = 3; x.beginPath(); trail.forEach((p, i) => { if (i === 0) x.moveTo(p.x, p.y); else x.lineTo(p.x, p.y); }); x.stroke();
          x.fillStyle = "#fff"; x.font = "bold 16px system-ui"; x.textBaseline = "alphabetic"; x.textAlign = "left"; x.fillText("🔪 " + score, 10, 22); x.textAlign = "right"; x.fillText("❤️".repeat(Math.max(0, lives)), W - 8, 22);
          if (over) { cancelAnimationFrame(raf); api.finish(score, { title: score >= 25 ? "Master Ninja! 🥷" : "Out!", line: "Sliced <b>" + score + "</b> fish" }); return; }
          raf = requestAnimationFrame(loop);
        }
        function sliceAt(mx, my) { items.forEach((it) => { if (it.sliced) return; if (Math.hypot(it.x - mx, it.y - my) < 26) { if (it.bomb) { lives = 0; over = true; api.boom(); } else { it.sliced = true; score++; api.tone(700 + score * 4, 0.04); } } }); }
        const move = (e) => { if (!down) return; const r = c.getBoundingClientRect(); const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height); trail.push({ x: mx, y: my }); if (trail.length > 10) trail.shift(); sliceAt(mx, my); };
        c.addEventListener("pointerdown", (e) => { down = true; trail = []; move(e); });
        c.addEventListener("pointermove", move);
        document.addEventListener("pointerup", () => { down = false; trail = []; });
        api.onClean(() => { cancelAnimationFrame(raf); });
        loop();
      }
    },

    // ---------- Sliding Puzzle ----------
    {
      key: "slide", name: "Sliding Puzzle", icon: "🧩", isNew: true, reward: (s) => Math.max(5, 200 - s * 2),
      bestLabel: (b) => b ? "Best: " + b + " moves" : "New!",
      play(host, api) {
        hintLine(host, "Slide the tiles to put 1–15 in order (blank in the corner).");
        const grid = document.createElement("div"); grid.className = "slide-grid"; host.appendChild(grid);
        let t = [], moves = 0, solved = false;
        function init() { t = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]; for (let i = 0; i < 200; i++) { const b = t.indexOf(0), opts = adj(b); const pick = opts[(Math.random() * opts.length) | 0]; t[b] = t[pick]; t[pick] = 0; } moves = 0; solved = false; render(); }
        function adj(i) { const r = (i / 4) | 0, c = i % 4, o = []; if (r > 0) o.push(i - 4); if (r < 3) o.push(i + 4); if (c > 0) o.push(i - 1); if (c < 3) o.push(i + 1); return o; }
        function click(i) { if (solved) return; const b = t.indexOf(0); if (adj(i).indexOf(b) < 0) return; t[b] = t[i]; t[i] = 0; moves++; api.tone(500, 0.03); render(); if (t.every((v, k) => v === (k + 1) % 16)) { solved = true; setTimeout(() => api.finish(moves, { scoreForBest: moves, title: "Solved! 🧩", line: "In <b>" + moves + "</b> moves" }), 300); } }
        function render() { grid.innerHTML = ""; sc_moves(); t.forEach((v, i) => { const d = document.createElement("button"); d.className = "slide-cell" + (v === 0 ? " blank" : ""); d.textContent = v || ""; d.onclick = () => click(i); grid.appendChild(d); }); }
        function sc_moves() { } // moves shown via tile grid; keep simple
        init();
      }
    },

    // ---------- Lights Out ----------
    {
      key: "lights", name: "Lights Out", icon: "💡", isNew: true, reward: (s) => Math.max(5, 120 - s * 4),
      bestLabel: (b) => b ? "Best: " + b + " clicks" : "New!",
      play(host, api) {
        const N = 5;
        hintLine(host, "Tap a light to toggle it and its neighbors. Turn them ALL off!");
        const grid = document.createElement("div"); grid.className = "lights-grid"; grid.style.gridTemplateColumns = "repeat(" + N + ",1fr)"; host.appendChild(grid);
        const info = document.createElement("p"); info.className = "ar-hint"; host.appendChild(info);
        let on = [], cells = [], clicks = 0, done = false;
        function idx(r, c) { return r * N + c; }
        function toggle(i, user) { const r = (i / N) | 0, c = i % N; [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach((d) => { const nr = r + d[0], nc = c + d[1]; if (nr >= 0 && nr < N && nc >= 0 && nc < N) on[idx(nr, nc)] = !on[idx(nr, nc)]; }); if (user) { clicks++; api.tone(500, 0.04); } render(); if (user && on.every((v) => !v)) { done = true; setTimeout(() => api.finish(clicks, { scoreForBest: clicks, title: "Lights Out! 💡", line: "In <b>" + clicks + "</b> clicks" }), 300); } }
        function render() { cells.forEach((c, i) => c.classList.toggle("on", on[i])); info.textContent = "Clicks: " + clicks; }
        on = new Array(N * N).fill(false);
        for (let i = 0; i < N * N; i++) { const b = document.createElement("button"); b.className = "lights-cell"; b.onclick = () => { if (!done) toggle(i, true); }; cells.push(b); grid.appendChild(b); }
        for (let i = 0; i < 8; i++) toggle((Math.random() * N * N) | 0, false); // scramble (solvable)
        clicks = 0; render();
      }
    },

    // ---------- Maxwell Hunt 3D (raycaster coin hunt) ----------
    {
      key: "hunt3d", name: "Maxwell Hunt 3D", icon: "🪙", isNew: true, reward: (s) => s * 3,
      play(host, api) {
        const W = 380, H = 300; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>3D!</b> ↑/↓/W/S move · ←/→/A/D turn. Grab all the 🪙 coins in 45s!");
        const N = 6, S = 2 * N + 1;
        const m = []; for (let y = 0; y < S; y++) { m.push([]); for (let xx = 0; xx < S; xx++) m[y].push(1); }
        (function carve(cx, cy) { m[cy][cx] = 0; const ds = [[0, -1], [0, 1], [-1, 0], [1, 0]].sort(() => Math.random() - 0.5); for (const d of ds) { const nx = cx + d[0] * 2, ny = cy + d[1] * 2; if (nx > 0 && nx < S && ny > 0 && ny < S && m[ny][nx] === 1) { m[cy + d[1]][cx + d[0]] = 0; carve(nx, ny); } } })(1, 1);
        const coins = []; const open = []; for (let y = 1; y < S; y++) for (let xx = 1; xx < S; xx++) if (!m[y][xx]) open.push([xx, y]);
        open.sort(() => Math.random() - 0.5).slice(0, 10).forEach((o) => coins.push({ x: o[0] + 0.5, y: o[1] + 0.5, got: false }));
        let px = 1.5, py = 1.5, ang = 0, score = 0, time = 45, over = false, raf, timer; const keys = {}; const FOV = 0.7;
        function cell(cx, cy) { if (cx < 0 || cy < 0 || cx >= S || cy >= S) return 1; return m[cy | 0][cx | 0]; }
        function loop() {
          if (!over) {
            const sp = 0.06, rot = 0.045;
            if (keys["arrowleft"] || keys["a"]) ang -= rot; if (keys["arrowright"] || keys["d"]) ang += rot;
            let mv = 0; if (keys["arrowup"] || keys["w"]) mv = 1; if (keys["arrowdown"] || keys["s"]) mv = -1;
            if (mv) { const nx = px + Math.cos(ang) * sp * mv, ny = py + Math.sin(ang) * sp * mv; if (!cell(nx, py)) px = nx; if (!cell(px, ny)) py = ny; }
            coins.forEach((co) => { if (!co.got && Math.hypot(co.x - px, co.y - py) < 0.5) { co.got = true; score++; api.tone(880, 0.06); } });
            if (score >= coins.length) return end();
          }
          x.fillStyle = "#0a1020"; x.fillRect(0, 0, W, H / 2); x.fillStyle = "#161b2e"; x.fillRect(0, H / 2, W, H / 2);
          const cols = 120, cw = W / cols; const zbuf = [];
          for (let i = 0; i < cols; i++) { const ra = ang - FOV / 2 + (i / cols) * FOV, cos = Math.cos(ra), sin = Math.sin(ra); let dist = 0, hit = false, side = 0; while (dist < 20 && !hit) { dist += 0.02; const tx = px + cos * dist, ty = py + sin * dist; if (cell(tx, ty)) { hit = true; const fx = tx - Math.floor(tx), fy = ty - Math.floor(ty); side = Math.min(fx, 1 - fx) < Math.min(fy, 1 - fy) ? 0 : 1; } } const corr = dist * Math.cos(ra - ang); zbuf[i] = corr; const hgt = Math.min(H, H / corr), shade = Math.max(0, 1 - corr / 10) * (side ? 0.7 : 1); x.fillStyle = "rgba(" + (108 * shade | 0) + "," + (150 * shade | 0) + "," + (231 * shade | 0) + ",1)"; x.fillRect(i * cw, (H - hgt) / 2, cw + 1, hgt); }
          // draw coins as billboards
          coins.filter((co) => !co.got).map((co) => { const dx = co.x - px, dy = co.y - py; const d = Math.hypot(dx, dy); let a = Math.atan2(dy, dx) - ang; while (a < -Math.PI) a += 2 * Math.PI; while (a > Math.PI) a -= 2 * Math.PI; return { a, d, co }; }).filter((o) => Math.abs(o.a) < FOV / 2 && o.d > 0.3).sort((a, b) => b.d - a.d).forEach((o) => { const sxp = W / 2 + (o.a / (FOV / 2)) * (W / 2); const sz = Math.min(80, 22 / o.d); const col = (sxp / cw) | 0; if (col >= 0 && col < cols && o.d < zbuf[col] + 0.3) { x.font = "bold " + (sz * 1.6 | 0) + "px system-ui"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("🪙", sxp, H / 2 + 20); } });
          x.fillStyle = "#fff"; x.font = "bold 15px system-ui"; x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillText("🪙 " + score + "/" + coins.length, 8, 20); x.textAlign = "right"; x.fillText("⏱️ " + time + "s", W - 8, 20);
          raf = requestAnimationFrame(loop);
        }
        function end() { if (over) return; over = true; cancelAnimationFrame(raf); clearInterval(timer); api.boom(); api.finish(score, { title: score >= coins.length ? "All coins! 🪙" : "Time!", line: "Collected <b>" + score + "/" + coins.length + "</b> coins" }); }
        const kd = (e) => { const k = e.key.toLowerCase(); if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) { keys[k] = true; e.preventDefault(); } };
        const ku = (e) => { keys[e.key.toLowerCase()] = false; };
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        timer = setInterval(() => { time--; if (time <= 0) end(); }, 1000);
        api.onClean(() => { cancelAnimationFrame(raf); clearInterval(timer); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    },

    // ---------- Star Tunnel 3D ----------
    {
      key: "tunnel3d", name: "Star Tunnel 3D", icon: "🌌", isNew: true, reward: (s) => Math.floor(s / 6),
      play(host, api) {
        const W = 380, H = 320; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>3D!</b> Move with the <b>mouse</b> / arrows. Dodge the asteroids flying at you!");
        const cx = W / 2, cy = H / 2; let shipX = 0, shipY = 0, obs = [], stars = [], score = 0, over = false, raf, frame = 0; const keys = {};
        for (let i = 0; i < 70; i++) stars.push({ a: Math.random() * 7, d: Math.random(), sp: 0.004 + Math.random() * 0.01 });
        function spawn() { const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 120; obs.push({ ox: Math.cos(a) * r, oy: Math.sin(a) * r, z: 0.02, hue: (Math.random() * 360) | 0 }); }
        function loop() {
          x.fillStyle = "#05060f"; x.fillRect(0, 0, W, H);
          // starfield tunnel
          stars.forEach((s) => { s.d += s.sp; if (s.d > 1) s.d = 0.02; const px = cx + Math.cos(s.a) * s.d * W, py = cy + Math.sin(s.a) * s.d * H; x.fillStyle = "rgba(255,255,255," + s.d + ")"; x.fillRect(px, py, 2, 2); });
          if (!over) {
            if (keys["arrowleft"]) shipX -= 7; if (keys["arrowright"]) shipX += 7; if (keys["arrowup"]) shipY -= 7; if (keys["arrowdown"]) shipY += 7;
            shipX = Math.max(-W / 2 + 20, Math.min(W / 2 - 20, shipX)); shipY = Math.max(-H / 2 + 20, Math.min(H / 2 - 20, shipY));
            frame++; score += 0.25; if (frame % Math.max(16, 40 - (score / 10 | 0)) === 0) spawn();
            obs.forEach((o) => o.z += 0.014 + score * 0.00004);
            obs = obs.filter((o) => { if (o.z > 1.15) return false; const sxp = cx + o.ox * o.z, syp = cy + o.oy * o.z; if (o.z > 0.9 && Math.hypot(sxp - (cx + shipX), syp - (cy + shipY)) < 22 + o.z * 14) { over = true; api.boom(); } return true; });
          }
          obs.sort((a, b) => a.z - b.z).forEach((o) => { const sxp = cx + o.ox * o.z, syp = cy + o.oy * o.z, r = 3 + o.z * 22; x.fillStyle = "hsl(" + o.hue + " 70% " + (30 + o.z * 35) + "%)"; x.beginPath(); x.arc(sxp, syp, r, 0, 7); x.fill(); });
          // ship
          x.fillStyle = "#3ee08f"; x.beginPath(); x.moveTo(cx + shipX, cy + shipY - 14); x.lineTo(cx + shipX - 12, cy + shipY + 12); x.lineTo(cx + shipX + 12, cy + shipY + 12); x.closePath(); x.fill();
          x.fillStyle = "#fff"; x.font = "bold 16px system-ui"; x.textAlign = "right"; x.fillText(Math.floor(score), W - 8, 22);
          if (over) { cancelAnimationFrame(raf); api.finish(Math.floor(score), { title: score >= 200 ? "Star Pilot! 🌌" : "Boom!", line: "Flew <b>" + Math.floor(score) + "</b>" }); return; }
          raf = requestAnimationFrame(loop);
        }
        const mv = (e) => { const r = c.getBoundingClientRect(); shipX = (e.clientX - r.left) * (W / r.width) - cx; shipY = (e.clientY - r.top) * (H / r.height) - cy; };
        const kd = (e) => { const k = e.key.toLowerCase(); if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) { keys[k] = true; e.preventDefault(); } };
        const ku = (e) => { keys[e.key.toLowerCase()] = false; };
        c.addEventListener("pointermove", mv); document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    },

    // ---------- Maxwell Breakout ----------
    {
      key: "breakout", name: "Maxwell Breakout", icon: "🧱", isNew: true, reward: (s) => s,
      play(host, api) {
        const W = 360, H = 460; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Move the paddle with your <b>mouse</b>. Break every brick!");
        let px = W / 2, bx = W / 2, by = H - 70, vx = 3, vy = -3.6, score = 0, lives = 3, over = false, raf;
        const PW = 72, PH = 12, BR = 7, cols = 8, rows = 5, bw = W / cols, bh = 20;
        const bricks = [];
        for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) bricks.push({ x: cc * bw, y: 44 + r * bh, w: bw - 4, h: bh - 4, alive: true, hue: (r * 42) % 360 });
        function loop() {
          x.fillStyle = "#0d1428"; x.fillRect(0, 0, W, H);
          if (!over) {
            bx += vx; by += vy;
            if (bx < BR || bx > W - BR) { vx *= -1; bx = Math.max(BR, Math.min(W - BR, bx)); }
            if (by < BR) vy = Math.abs(vy);
            if (by > H - 50 - PH && by < H - 42 && bx > px - PW / 2 && bx < px + PW / 2 && vy > 0) { vy = -Math.abs(vy); vx += (bx - px) / PW * 3.2; api.tone(520, 0.04); }
            if (by > H + 10) { lives--; api.tone(200, 0.1, "sawtooth"); if (lives <= 0) return end(false); bx = W / 2; by = H - 70; vx = 3 * (Math.random() < 0.5 ? 1 : -1); vy = -3.6; }
            for (const bk of bricks) { if (!bk.alive) continue; if (bx > bk.x && bx < bk.x + bk.w && by > bk.y && by < bk.y + bk.h) { bk.alive = false; vy *= -1; score++; api.tone(600 + score * 4, 0.04); break; } }
            if (bricks.every((b) => !b.alive)) return end(true);
          }
          bricks.forEach((bk) => { if (bk.alive) { x.fillStyle = "hsl(" + bk.hue + " 80% 55%)"; x.fillRect(bk.x, bk.y, bk.w, bk.h); } });
          x.fillStyle = "#3ee08f"; x.fillRect(px - PW / 2, H - 50, PW, PH);
          x.fillStyle = "#fff"; x.beginPath(); x.arc(bx, by, BR, 0, 7); x.fill();
          x.font = "bold 14px system-ui"; x.textAlign = "left"; x.fillText("Score " + score, 8, 20); x.textAlign = "right"; x.fillText("❤️".repeat(Math.max(0, lives)), W - 8, 22);
          raf = requestAnimationFrame(loop);
        }
        function end(win) { if (over) return; over = true; cancelAnimationFrame(raf); api.boom(); api.finish(score, { title: win ? "Cleared! 🎉" : "Game Over", line: "Broke <b>" + score + "</b> bricks" }); }
        const mv = (e) => { const r = c.getBoundingClientRect(); px = Math.max(PW / 2, Math.min(W - PW / 2, (e.clientX - r.left) * (W / r.width))); };
        c.addEventListener("pointermove", mv);
        api.onClean(() => { cancelAnimationFrame(raf); c.removeEventListener("pointermove", mv); });
        loop();
      }
    },

    // ---------- Maxwell Blocks (Tetris) ----------
    {
      key: "tetris", name: "Maxwell Blocks", icon: "🟦", isNew: true, reward: (s) => s,
      play(host, api) {
        const COLS = 10, ROWS = 16, SZ = 20, W = COLS * SZ, H = ROWS * SZ; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>← →</b> move · <b>↑</b> rotate · <b>↓</b> faster · <b>Space</b> hard drop");
        const COLORS = ["#00d2d2", "#3b5bff", "#ff9a3c", "#ffd84a", "#3ee08f", "#b77bff", "#ff5a6e"];
        const SHAPES = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]]];
        let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        let piece = null, px = 0, py = 0, score = 0, lines = 0, over = false, raf, drop = 0, speed = 40;
        function collide(nx, ny, m) { for (let r = 0; r < m.length; r++) for (let cc = 0; cc < m[r].length; cc++) { if (m[r][cc]) { const gx = nx + cc, gy = ny + r; if (gx < 0 || gx >= COLS || gy >= ROWS) return true; if (gy >= 0 && grid[gy][gx]) return true; } } return false; }
        function newPiece() { const t = Math.floor(Math.random() * SHAPES.length); piece = { m: SHAPES[t].map((r) => r.slice()), col: t + 1 }; px = Math.floor((COLS - piece.m[0].length) / 2); py = 0; if (collide(px, py, piece.m)) end(); }
        function merge() { piece.m.forEach((row, r) => row.forEach((v, cc) => { if (v) { const gy = py + r; if (gy >= 0) grid[gy][px + cc] = piece.col; } })); }
        function rotate() { const m = piece.m, nm = m[0].map((_, i) => m.map((r) => r[i]).reverse()); if (!collide(px, py, nm)) piece.m = nm; }
        function clearLines() { let cl = 0; for (let r = ROWS - 1; r >= 0; r--) { if (grid[r].every((v) => v)) { grid.splice(r, 1); grid.unshift(Array(COLS).fill(0)); cl++; r++; } } if (cl) { lines += cl; score += [0, 10, 30, 60, 100][cl]; speed = Math.max(8, 40 - lines); api.tone(600 + cl * 100, 0.1); } }
        function stepDown() { if (collide(px, py + 1, piece.m)) { merge(); clearLines(); newPiece(); } else py++; }
        function loop() {
          if (!over) { drop++; if (drop >= speed) { drop = 0; stepDown(); } }
          x.fillStyle = "#0a0e1c"; x.fillRect(0, 0, W, H);
          for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) if (grid[r][cc]) { x.fillStyle = COLORS[grid[r][cc] - 1]; x.fillRect(cc * SZ + 1, r * SZ + 1, SZ - 2, SZ - 2); }
          if (piece) piece.m.forEach((row, r) => row.forEach((v, cc) => { if (v) { x.fillStyle = COLORS[piece.col - 1]; x.fillRect((px + cc) * SZ + 1, (py + r) * SZ + 1, SZ - 2, SZ - 2); } }));
          x.fillStyle = "rgba(255,255,255,0.85)"; x.font = "bold 13px system-ui"; x.textAlign = "left"; x.fillText("Lines " + lines, 4, 14);
          raf = requestAnimationFrame(loop);
        }
        function end() { if (over) return; over = true; cancelAnimationFrame(raf); api.boom(); api.finish(score, { scoreForBest: score, title: "Game Over", line: "<b>" + lines + "</b> lines · " + score + " pts" }); }
        const key = (e) => { if (over || !piece) return; if (e.key === "ArrowLeft") { if (!collide(px - 1, py, piece.m)) px--; e.preventDefault(); } else if (e.key === "ArrowRight") { if (!collide(px + 1, py, piece.m)) px++; e.preventDefault(); } else if (e.key === "ArrowDown") { stepDown(); e.preventDefault(); } else if (e.key === "ArrowUp") { rotate(); e.preventDefault(); } else if (e.code === "Space") { while (!collide(px, py + 1, piece.m)) py++; stepDown(); e.preventDefault(); } };
        document.addEventListener("keydown", key);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); });
        newPiece(); loop();
      }
    },

    // ---------- Maxwell Jump (Doodle Jump) ----------
    {
      key: "jump", name: "Maxwell Jump", icon: "⬆️", isNew: true, reward: (s) => Math.max(1, Math.floor(s / 5)),
      play(host, api) {
        const W = 320, H = 460; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>← →</b> or move the mouse to steer. Bounce up the platforms!");
        const cat = new Image(); cat.src = api.img;
        let px = W / 2, py = H - 90, vy = -9, vx = 0, score = 0, over = false, raf, left = false, right = false, plats = [];
        const G = 0.32, JUMP = -9.4, PW = 56, PH = 10, R = 16;
        for (let i = 0; i < 8; i++) plats.push({ x: Math.random() * (W - PW), y: H - 40 - i * 55 });
        function loop() {
          x.fillStyle = "#0c1326"; x.fillRect(0, 0, W, H);
          if (!over) {
            if (left) vx = -4.4; else if (right) vx = 4.4; else vx *= 0.9;
            px += vx; if (px < -R) px = W + R; if (px > W + R) px = -R;
            vy += G; py += vy;
            if (vy > 0) for (const p of plats) { if (px > p.x - R && px < p.x + PW + R && py + R > p.y && py + R < p.y + PH + vy + 2) { vy = JUMP; api.tone(600, 0.05); break; } }
            if (py < H * 0.4) { const dy = H * 0.4 - py; py = H * 0.4; plats.forEach((p) => p.y += dy); score += dy; }
            plats = plats.filter((p) => p.y < H + 20); while (plats.length < 8) { let top = Math.min.apply(null, plats.map((p) => p.y)); plats.push({ x: Math.random() * (W - PW), y: top - 55 }); }
            if (py - R > H) return end();
          }
          plats.forEach((p) => { x.fillStyle = "#3ee08f"; x.fillRect(p.x, p.y, PW, PH); });
          if (cat.complete) x.drawImage(cat, px - R, py - R, R * 2, R * 2);
          x.fillStyle = "#fff"; x.font = "bold 16px system-ui"; x.textAlign = "left"; x.fillText(Math.floor(score / 10), 8, 22);
          raf = requestAnimationFrame(loop);
        }
        function end() { if (over) return; over = true; cancelAnimationFrame(raf); api.boom(); api.finish(Math.floor(score / 10), { title: score / 10 >= 50 ? "Sky high!" : "Fell!", line: "Height: <b>" + Math.floor(score / 10) + "</b>" }); }
        const kd = (e) => { if (e.key === "ArrowLeft") { left = true; e.preventDefault(); } if (e.key === "ArrowRight") { right = true; e.preventDefault(); } };
        const ku = (e) => { if (e.key === "ArrowLeft") left = false; if (e.key === "ArrowRight") right = false; };
        const mv = (e) => { const r = c.getBoundingClientRect(); const mx = (e.clientX - r.left) * (W / r.width); if (mx < px - 6) { left = true; right = false; } else if (mx > px + 6) { right = true; left = false; } else { left = right = false; } };
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku); c.addEventListener("pointermove", mv);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    },

    // ---------- Tower Stack ----------
    {
      key: "stack", name: "Tower Stack", icon: "🏗️", isNew: true, reward: (s) => s * 3,
      play(host, api) {
        const W = 320, H = 460; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>Click / SPACE</b> to drop the block. Stack it high!");
        const baseY = H - 30, bh = 24; let blocks = [{ x: W / 2 - 70, w: 140 }], cur = null, score = 0, over = false, raf, camY = 0;
        function newBlock() { const top = blocks[blocks.length - 1]; cur = { x: 0, w: top.w, dir: 1, sp: 3 + score * 0.15 }; }
        newBlock();
        function drop() {
          if (over || !cur) return;
          const top = blocks[blocks.length - 1];
          const left = Math.max(cur.x, top.x), right = Math.min(cur.x + cur.w, top.x + top.w), overlap = right - left;
          if (overlap <= 0) return end();
          blocks.push({ x: left, w: overlap }); score++; api.tone(380 + score * 12, 0.05); newBlock();
        }
        function end() { if (over) return; over = true; cancelAnimationFrame(raf); api.boom(); api.finish(score, { title: score >= 15 ? "Skyscraper! 🏙️" : "Toppled!", line: "Height: <b>" + score + "</b>" }); }
        function loop() {
          x.fillStyle = "#0b1020"; x.fillRect(0, 0, W, H);
          if (!over && cur) { cur.x += cur.dir * cur.sp; if (cur.x < 0) { cur.x = 0; cur.dir = 1; } if (cur.x + cur.w > W) { cur.x = W - cur.w; cur.dir = -1; } }
          const targetCam = Math.max(0, (blocks.length - 8) * bh); camY += (targetCam - camY) * 0.1;
          blocks.forEach((b, i) => { const yy = baseY - i * bh + camY; if (yy > -bh && yy < H) { x.fillStyle = "hsl(" + ((i * 25) % 360) + " 70% 55%)"; x.fillRect(b.x, yy, b.w, bh - 2); } });
          if (cur) { const yy = baseY - blocks.length * bh + camY; x.fillStyle = "#ffd84a"; x.fillRect(cur.x, yy, cur.w, bh - 2); }
          x.fillStyle = "#fff"; x.font = "bold 20px system-ui"; x.textAlign = "center"; x.fillText(score, W / 2, 36);
          raf = requestAnimationFrame(loop);
        }
        const key = (e) => { if (e.code === "Space") { e.preventDefault(); drop(); } };
        document.addEventListener("keydown", key); c.addEventListener("pointerdown", drop);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); });
        loop();
      }
    },

    // ---------- Meow Tiles (piano tiles) ----------
    {
      key: "tiles", name: "Meow Tiles", icon: "🎹", isNew: true, reward: (s) => s * 2,
      play(host, api) {
        const W = 320, H = 460, COLS = 4, cw = W / COLS; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Tap the column when a tile reaches the bottom. Don't miss — or tap empty!");
        const notes = [523, 587, 659, 784]; const TH = 92;
        let tiles = [], score = 0, over = false, raf, spd = 2.6, spawnT = 0, lastCol = -1;
        function spawn() { let col; do { col = Math.floor(Math.random() * COLS); } while (col === lastCol && Math.random() < 0.6); lastCol = col; tiles.push({ col, y: -TH, hit: false }); }
        function loop() {
          x.fillStyle = "#0e1020"; x.fillRect(0, 0, W, H);
          for (let i = 1; i < COLS; i++) { x.strokeStyle = "rgba(255,255,255,0.08)"; x.beginPath(); x.moveTo(i * cw, 0); x.lineTo(i * cw, H); x.stroke(); }
          x.strokeStyle = "rgba(255,255,255,0.25)"; x.beginPath(); x.moveTo(0, H - 6); x.lineTo(W, H - 6); x.stroke();
          if (!over) {
            spawnT++; spd = 2.6 + score * 0.05; if (spawnT > Math.max(36, 90 - score)) { spawnT = 0; spawn(); }
            tiles.forEach((t) => t.y += spd);
            for (const t of tiles) if (!t.hit && t.y > H) return end();
            tiles = tiles.filter((t) => t.y < H + TH);
          }
          tiles.forEach((t) => { x.fillStyle = t.hit ? "rgba(62,224,143,0.3)" : "#273357"; x.fillRect(t.col * cw + 3, t.y, cw - 6, TH - 4); });
          x.fillStyle = "#fff"; x.font = "bold 22px system-ui"; x.textAlign = "center"; x.fillText(score, W / 2, 40);
          raf = requestAnimationFrame(loop);
        }
        function tap(col) {
          if (over) return; let best = null;
          tiles.forEach((t) => { if (t.col === col && !t.hit && t.y > H * 0.25) { if (!best || t.y > best.y) best = t; } });
          if (best) { best.hit = true; score++; api.tone(notes[col], 0.08); setTimeout(() => { tiles = tiles.filter((t) => t !== best); }, 120); }
          else { api.tone(160, 0.12, "sawtooth"); end(); }
        }
        function end() { if (over) return; over = true; cancelAnimationFrame(raf); api.boom(); api.finish(score, { title: score >= 25 ? "Concert pianist! 🎼" : "Missed!", line: "<b>" + score + "</b> tiles" }); }
        const pd = (e) => { const r = c.getBoundingClientRect(); const mx = (e.clientX - r.left) * (W / r.width); tap(Math.floor(mx / cw)); };
        c.addEventListener("pointerdown", pd);
        const key = (e) => { const m = { a: 0, s: 1, d: 2, f: 3 }[e.key]; if (m != null) { e.preventDefault(); tap(m); } };
        document.addEventListener("keydown", key);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); });
        loop();
      }
    },

    // ---------- Aim Trainer ----------
    {
      key: "aim", name: "Aim Trainer", icon: "🎯", isNew: true, reward: (s) => s * 2,
      play(host, api) {
        const W = 360, H = 420; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Pop the targets fast! 30 seconds on the clock.");
        const cat = new Image(); cat.src = api.img;
        let targets = [], score = 0, misses = 0, time = 30, over = false, raf, timer, spawnT = 0;
        function spawn() { targets.push({ x: 30 + Math.random() * (W - 60), y: 44 + Math.random() * (H - 84), r: 17 + Math.random() * 11, life: 72 }); }
        function loop() {
          x.fillStyle = "#101a2e"; x.fillRect(0, 0, W, H);
          if (!over) { spawnT++; if (spawnT > 24) { spawnT = 0; if (targets.length < 5) spawn(); } targets.forEach((t) => t.life--); targets = targets.filter((t) => { if (t.life <= 0) { misses++; return false; } return true; }); }
          targets.forEach((t) => { x.fillStyle = "#e05a6e"; x.beginPath(); x.arc(t.x, t.y, t.r, 0, 7); x.fill(); x.fillStyle = "#fff"; x.beginPath(); x.arc(t.x, t.y, t.r * 0.62, 0, 7); x.fill(); if (cat.complete) x.drawImage(cat, t.x - t.r * 0.55, t.y - t.r * 0.55, t.r * 1.1, t.r * 1.1); });
          x.fillStyle = "#fff"; x.font = "bold 16px system-ui"; x.textAlign = "left"; x.fillText("🎯 " + score, 8, 22); x.textAlign = "right"; x.fillText("⏱️ " + time + "s", W - 8, 22);
          raf = requestAnimationFrame(loop);
        }
        const pd = (e) => { if (over) return; const r = c.getBoundingClientRect(); const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height); for (let i = targets.length - 1; i >= 0; i--) { const t = targets[i]; if (Math.hypot(t.x - mx, t.y - my) < t.r) { targets.splice(i, 1); score++; api.tone(720, 0.05); return; } } };
        c.addEventListener("pointerdown", pd);
        timer = setInterval(() => { time--; if (time <= 0) end(); }, 1000);
        function end() { if (over) return; over = true; clearInterval(timer); cancelAnimationFrame(raf); api.boom(); api.finish(score, { title: score >= 25 ? "Sharpshooter! 🎯" : "Time!", line: "<b>" + score + "</b> hit · " + misses + " missed" }); }
        api.onClean(() => { cancelAnimationFrame(raf); clearInterval(timer); });
        loop();
      }
    },

    // ---------- Odd One Out ----------
    {
      key: "oddone", name: "Odd One Out", icon: "🔍", isNew: true, reward: (s) => s * 3,
      play(host, api) {
        hintLine(host, "Tap the square that's a slightly different color. 30 seconds!");
        const wrap = document.createElement("div"); wrap.className = "odd-wrap"; host.appendChild(wrap);
        const timeEl = document.createElement("p"); timeEl.className = "ar-hint"; host.appendChild(timeEl);
        let score = 0, time = 30, over = false, timer, n = 2;
        function round() {
          wrap.innerHTML = ""; n = Math.min(7, 2 + Math.floor(score / 3)); wrap.style.gridTemplateColumns = "repeat(" + n + ",1fr)";
          const hue = Math.floor(Math.random() * 360), base = 50, diff = Math.max(5, 22 - score), odd = Math.floor(Math.random() * n * n);
          for (let i = 0; i < n * n; i++) { const b = document.createElement("button"); b.className = "odd-cell"; b.style.background = "hsl(" + hue + " 70% " + (base + (i === odd ? diff : 0)) + "%)"; b.onclick = () => { if (over) return; if (i === odd) { score++; api.tone(720, 0.05); round(); } else { api.tone(180, 0.1, "sawtooth"); } }; wrap.appendChild(b); }
        }
        timeEl.textContent = "⏱️ 30s · Score 0"; round();
        timer = setInterval(() => { time--; timeEl.textContent = "⏱️ " + time + "s · Score " + score; if (time <= 0) end(); }, 1000);
        function end() { if (over) return; over = true; clearInterval(timer); api.boom(); api.finish(score, { title: score >= 15 ? "Eagle eyes! 🦅" : "Time!", line: "<b>" + score + "</b> found" }); }
        api.onClean(() => clearInterval(timer));
      }
    },

    // ---------- Maxwell Mines (minesweeper) ----------
    {
      key: "mines", name: "Maxwell Mines", icon: "💣", isNew: true, reward: (s) => Math.round(s / 2),
      play(host, api) {
        const N = 8, M = 10;
        hintLine(host, "Reveal all safe tiles. Toggle 🚩 to mark mines. Don't tap a 💣!");
        const flagBtn = document.createElement("button"); flagBtn.className = "btn"; flagBtn.textContent = "🚩 Flag: OFF";
        let flagMode = false; flagBtn.onclick = () => { flagMode = !flagMode; flagBtn.textContent = "🚩 Flag: " + (flagMode ? "ON" : "OFF"); };
        host.appendChild(flagBtn);
        const bar = document.createElement("p"); bar.className = "ar-hint"; bar.textContent = "Safe: 0/" + (N * N - M); host.appendChild(bar);
        const grid = document.createElement("div"); grid.className = "mine-grid"; grid.style.gridTemplateColumns = "repeat(" + N + ",1fr)"; host.appendChild(grid);
        let cells = [], mines = new Set(), revealed = 0, over = false, placed = false;
        const idx = (r, cc) => r * N + cc;
        for (let i = 0; i < N * N; i++) { const b = document.createElement("button"); b.className = "mine-cell"; b.onclick = () => click(i); cells.push(b); grid.appendChild(b); }
        function placeMines(safe) { while (mines.size < M) { const p = Math.floor(Math.random() * N * N); if (p !== safe) mines.add(p); } placed = true; }
        function neighbors(i) { const r = Math.floor(i / N), cc = i % N, out = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const nr = r + dr, nc = cc + dc; if (nr >= 0 && nr < N && nc >= 0 && nc < N) out.push(idx(nr, nc)); } return out; }
        function count(i) { return neighbors(i).filter((n) => mines.has(n)).length; }
        function reveal(i) { const b = cells[i]; if (b.classList.contains("open")) return; b.classList.add("open"); revealed++; const n = count(i); if (n > 0) { b.textContent = n; b.dataset.n = n; } else neighbors(i).forEach((nb) => { if (!cells[nb].classList.contains("open") && !mines.has(nb)) reveal(nb); }); }
        function click(i) {
          if (over) return; const b = cells[i];
          if (flagMode) { if (!b.classList.contains("open")) { b.classList.toggle("flag"); b.textContent = b.classList.contains("flag") ? "🚩" : ""; } return; }
          if (b.classList.contains("flag") || b.classList.contains("open")) return;
          if (!placed) placeMines(i);
          if (mines.has(i)) { b.textContent = "💣"; b.classList.add("boom"); return end(false); }
          reveal(i); bar.textContent = "Safe: " + revealed + "/" + (N * N - M); api.tone(520, 0.04);
          if (revealed === N * N - M) end(true);
        }
        function end(win) { if (over) return; over = true; if (!win) { mines.forEach((m) => { if (!cells[m].classList.contains("flag")) cells[m].textContent = "💣"; }); api.boom(); } api.finish(win ? 100 + revealed : revealed, { scoreForBest: win ? 100 + revealed : revealed, title: win ? "Swept! 🎉" : "Boom! 💥", line: win ? "You cleared the whole board!" : "Revealed <b>" + revealed + "</b> safe tiles" }); }
        api.onClean(() => {});
      }
    },

    // ---------- Maxwell Dodge ----------
    {
      key: "dodge", name: "Maxwell Dodge", icon: "🌀", isNew: true, reward: (s) => Math.floor(s / 5),
      play(host, api) {
        const W = 340, H = 460; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Move with <b>mouse</b> / <b>arrows</b>. Dodge the falling blocks as long as you can!");
        const cat = new Image(); cat.src = api.img;
        let px = W / 2, blocks = [], score = 0, over = false, raf, frame = 0, left = false, right = false;
        function loop() {
          x.fillStyle = "#0d1428"; x.fillRect(0, 0, W, H);
          if (!over) {
            if (left) px -= 6; if (right) px += 6; px = Math.max(16, Math.min(W - 16, px));
            frame++; score += 0.2;
            if (frame % Math.max(16, 40 - (score / 10 | 0)) === 0) blocks.push({ x: Math.random() * (W - 26), y: -26, w: 20 + Math.random() * 30, v: 3 + Math.random() * 2 + score * 0.01 });
            blocks.forEach((b) => b.y += b.v); blocks = blocks.filter((b) => b.y < H + 30);
            for (const b of blocks) { if (px + 14 > b.x && px - 14 < b.x + b.w && H - 40 < b.y + 20 && H - 20 > b.y) { over = true; api.boom(); } }
          }
          x.fillStyle = "#e05a6e"; blocks.forEach((b) => x.fillRect(b.x, b.y, b.w, 20));
          if (cat.complete) x.drawImage(cat, px - 16, H - 42, 32, 32);
          x.fillStyle = "#fff"; x.font = "bold 18px system-ui"; x.textAlign = "left"; x.fillText(Math.floor(score), 10, 24);
          if (over) { cancelAnimationFrame(raf); api.finish(Math.floor(score), { title: score >= 150 ? "Untouchable!" : "Hit!", line: "You survived <b>" + Math.floor(score) + "</b>" }); return; }
          raf = requestAnimationFrame(loop);
        }
        const mv = (e) => { const r = c.getBoundingClientRect(); px = (e.clientX - r.left) * (W / r.width); };
        const kd = (e) => { if (e.key === "ArrowLeft") { left = true; e.preventDefault(); } if (e.key === "ArrowRight") { right = true; e.preventDefault(); } };
        const ku = (e) => { if (e.key === "ArrowLeft") left = false; if (e.key === "ArrowRight") right = false; };
        c.addEventListener("pointermove", mv); document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    },

    // ---------- Bubble Pop ----------
    {
      key: "bubble", name: "Bubble Pop", icon: "🫧", isNew: true, reward: (s) => s * 2,
      play(host, api) {
        const W = 340, H = 440; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Pop the bubbles before they float off the top! 30 seconds.");
        let bubbles = [], score = 0, missed = 0, time = 30, over = false, raf, frame = 0, timer;
        function spawn() { bubbles.push({ x: 24 + Math.random() * (W - 48), y: H + 20, r: 16 + Math.random() * 16, v: 1 + Math.random() * 1.6, hue: (Math.random() * 360) | 0 }); }
        function loop() {
          x.fillStyle = "#081826"; x.fillRect(0, 0, W, H);
          if (!over) { frame++; if (frame % 22 === 0) spawn(); bubbles.forEach((b) => b.y -= b.v); bubbles = bubbles.filter((b) => { if (b.y < -20) { missed++; return false; } return true; }); }
          bubbles.forEach((b) => { x.fillStyle = "hsla(" + b.hue + ",80%,60%,0.5)"; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); x.strokeStyle = "hsla(" + b.hue + ",90%,75%,0.9)"; x.lineWidth = 2; x.stroke(); x.fillStyle = "rgba(255,255,255,0.5)"; x.beginPath(); x.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.22, 0, 7); x.fill(); });
          x.fillStyle = "#fff"; x.font = "bold 16px system-ui"; x.textAlign = "left"; x.fillText("🫧 " + score, 10, 22); x.textAlign = "right"; x.fillText("⏱️ " + time + "s", W - 10, 22);
          raf = requestAnimationFrame(loop);
        }
        const pd = (e) => { if (over) return; const r = c.getBoundingClientRect(); const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height); for (let i = bubbles.length - 1; i >= 0; i--) { if (Math.hypot(bubbles[i].x - mx, bubbles[i].y - my) < bubbles[i].r) { bubbles.splice(i, 1); score++; api.tone(500 + score * 5, 0.05); return; } } };
        c.addEventListener("pointerdown", pd);
        timer = setInterval(() => { time--; if (time <= 0) { over = true; clearInterval(timer); cancelAnimationFrame(raf); api.boom(); api.finish(score, { title: score >= 25 ? "Pop star! 🫧" : "Time!", line: "Popped <b>" + score + "</b> bubbles" }); } }, 1000);
        api.onClean(() => { cancelAnimationFrame(raf); clearInterval(timer); });
        loop();
      }
    },

    // ==================== CLASSICS ====================

    // ---------- 1. Flyer (flappy) ----------
    {
      key: "flyer", name: "Maxwell Flyer", icon: "🐦", reward: (s) => s * 3,
      play(host, api) {
        const W = 340, H = 440; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Press <b>SPACE</b> / click / tap to flap. Fly through the gaps!");
        const cat = new Image(); cat.src = api.img;
        let y = H / 2, vy = 0, score = 0, pipes = [], frame = 0, dead = false, started = false, raf;
        const G = 0.45, FLAP = -7.2, GAP = 150, SPEED = 2.4, R = 17;
        function flap() { if (dead) return; started = true; vy = FLAP; api.tone(640, 0.06, "square", 0.05); }
        function spawn() { const top = 40 + Math.random() * (H - GAP - 120); pipes.push({ x: W, top, passed: false }); }
        function die() { if (dead) return; dead = true; api.boom(); setTimeout(() => { cancelAnimationFrame(raf); api.finish(score, { title: score >= 10 ? "Great flying!" : "Splat!", line: "You passed <b>" + score + "</b> pipes" }); }, 850); }
        function loop() {
          x.fillStyle = "#0f1630"; x.fillRect(0, 0, W, H);
          if (started && !dead) {
            vy += G; y += vy; frame++; if (frame % 95 === 0) spawn();
            pipes.forEach((p) => { p.x -= SPEED; if (!p.passed && p.x + 46 < W / 2 - R) { p.passed = true; score++; api.tone(880, 0.05, "square", 0.05); } });
            pipes = pipes.filter((p) => p.x > -60);
            if (y > H - R || y < R) die();
            pipes.forEach((p) => { if (W / 2 + R > p.x && W / 2 - R < p.x + 46) { if (y - R < p.top || y + R > p.top + GAP) die(); } });
          }
          x.fillStyle = "#3ee08f";
          pipes.forEach((p) => { x.fillRect(p.x, 0, 46, p.top); x.fillRect(p.x, p.top + GAP, 46, H - p.top - GAP); });
          if (cat.complete) x.drawImage(cat, W / 2 - R, y - R, R * 2, R * 2); else { x.fillStyle = "#fff"; x.beginPath(); x.arc(W / 2, y, R, 0, 7); x.fill(); }
          x.fillStyle = "#fff"; x.font = "bold 30px system-ui"; x.textAlign = "center"; x.fillText(score, W / 2, 48);
          if (!started) { x.font = "bold 18px system-ui"; x.fillText("Flap to start", W / 2, H / 2 + 70); }
          if (dead) { x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(0, 0, W, H); x.fillStyle = "#fff"; x.font = "bold 26px system-ui"; x.fillText("Game Over", W / 2, H / 2); }
          raf = requestAnimationFrame(loop);
        }
        const key = (e) => { if (e.code === "Space") { e.preventDefault(); flap(); } };
        document.addEventListener("keydown", key); c.addEventListener("pointerdown", flap);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); });
        loop();
      }
    },

    // ---------- 2. Fish Catcher ----------
    {
      key: "fishcatch", name: "Fish Catcher", icon: "🎣", reward: (s) => s * 2,
      play(host, api) {
        const W = 340, H = 420; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Move with <b>mouse</b> / <b>arrow keys</b>. Catch 🐟, dodge 💣 — 3 misses and you're out.");
        const cat = new Image(); cat.src = api.img;
        let bx = W / 2, score = 0, misses = 0, items = [], frame = 0, over = false, left = false, right = false, raf;
        const BW = 54;
        function spawn() { const bomb = Math.random() < 0.22; items.push({ x: 28 + Math.random() * (W - 56), y: -20, bomb, v: 2 + Math.random() * 2 + score * 0.03 }); }
        function end() { if (over) return; over = true; cancelAnimationFrame(raf); api.boom(); api.finish(score, { title: score >= 20 ? "Master angler!" : "Out!", line: "You caught <b>" + score + "</b> fish" }); }
        function loop() {
          x.fillStyle = "#101a33"; x.fillRect(0, 0, W, H);
          if (!over) {
            if (left) bx -= 6; if (right) bx += 6; bx = Math.max(BW / 2, Math.min(W - BW / 2, bx));
            frame++; if (frame % Math.max(24, 55 - score) === 0) spawn();
            items.forEach((it) => { it.y += it.v; });
            items = items.filter((it) => {
              if (it.y > H - 52 && it.y < H - 8 && Math.abs(it.x - bx) < BW / 2 + 13) {
                if (it.bomb) { misses = 3; api.boom(); } else { score++; api.tone(760, 0.05, "square", 0.05); }
                return false;
              }
              if (it.y > H + 20) { if (!it.bomb) { misses++; api.tone(200, 0.1, "sawtooth", 0.05); } return false; }
              return true;
            });
            if (misses >= 3) return end();
          }
          x.font = "26px system-ui, 'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle";
          items.forEach((it) => x.fillText(it.bomb ? "💣" : "🐟", it.x, it.y));
          if (cat.complete) x.drawImage(cat, bx - BW / 2, H - 50, BW, BW);
          x.fillStyle = "#fff"; x.font = "bold 18px system-ui"; x.textBaseline = "alphabetic";
          x.textAlign = "left"; x.fillText("🐟 " + score, 10, 24); x.textAlign = "right"; x.fillText("❌ " + misses + "/3", W - 10, 24);
          raf = requestAnimationFrame(loop);
        }
        const mv = (e) => { const r = c.getBoundingClientRect(); bx = (e.clientX - r.left) * (W / r.width); };
        const kd = (e) => { if (e.key === "ArrowLeft") { left = true; e.preventDefault(); } if (e.key === "ArrowRight") { right = true; e.preventDefault(); } };
        const ku = (e) => { if (e.key === "ArrowLeft") left = false; if (e.key === "ArrowRight") right = false; };
        c.addEventListener("pointermove", mv); document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    },

    // ---------- 3. Meow-mory (memory match) ----------
    {
      key: "memory", name: "Meow-mory", icon: "🃏", reward: (s) => Math.round(s / 5),
      bestLabel: (b) => b ? "Best: " + b + " pts" : "New!",
      play(host, api) {
        const EM = ["😺", "😹", "😻", "😼", "🐈", "🐾", "🐟", "👑"];
        const deck = EM.concat(EM).sort(() => Math.random() - 0.5);
        const info = hintLine(host, "Match all 8 pairs! Moves: <b>0</b>");
        const grid = document.createElement("div"); grid.className = "mem-grid"; host.appendChild(grid);
        let first = null, lock = false, moves = 0, matched = 0, t0 = Date.now();
        deck.forEach((em) => {
          const card = document.createElement("button"); card.className = "mem-card"; card.dataset.em = em;
          card.innerHTML = '<span class="mem-face">?</span>';
          card.onclick = () => {
            if (lock || card.classList.contains("open") || card.classList.contains("done")) return;
            card.classList.add("open"); card.querySelector(".mem-face").textContent = em; api.tone(520, 0.05, "square", 0.04);
            if (!first) { first = card; return; }
            moves++; info.innerHTML = "Match all 8 pairs! Moves: <b>" + moves + "</b>";
            if (first.dataset.em === em) {
              first.classList.add("done"); card.classList.add("done"); matched += 2; first = null; api.tone(880, 0.08);
              if (matched === deck.length) {
                const secs = Math.round((Date.now() - t0) / 1000);
                const pts = Math.max(10, 320 - secs * 3 - moves * 4);
                setTimeout(() => api.finish(pts, { scoreForBest: pts, title: "Solved! 🎉", line: "Done in <b>" + secs + "s</b> · " + moves + " moves" }), 450);
              }
            } else {
              lock = true; const a = first, b = card;
              setTimeout(() => { a.classList.remove("open"); b.classList.remove("open"); a.querySelector(".mem-face").textContent = "?"; b.querySelector(".mem-face").textContent = "?"; first = null; lock = false; }, 720);
            }
          };
          grid.appendChild(card);
        });
      }
    },

    // ---------- 4. Maxwell Dash (runner) ----------
    {
      key: "runner", name: "Maxwell Dash", icon: "🏃", reward: (s) => Math.floor(s / 8),
      play(host, api) {
        const W = 440, H = 220; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>SPACE</b> / click to jump. Dodge the cacti — it speeds up!");
        const cat = new Image(); cat.src = api.img;
        const yg = H - 18; let y = yg, vy = 0, onG = true, obs = [], frame = 0, score = 0, over = false, raf;
        function jump() { if (onG && !over) { vy = -11; onG = false; api.tone(600, 0.08, "square", 0.05); } }
        function die() { if (over) return; over = true; api.boom(); cancelAnimationFrame(raf); api.finish(Math.floor(score), { title: score >= 150 ? "Speed demon!" : "Crash!", line: "You ran <b>" + Math.floor(score) + "</b>m" }); }
        function loop() {
          x.fillStyle = "#0d1428"; x.fillRect(0, 0, W, H);
          x.strokeStyle = "#2a3760"; x.beginPath(); x.moveTo(0, yg); x.lineTo(W, yg); x.stroke();
          if (!over) {
            vy += 0.62; y += vy; if (y >= yg) { y = yg; vy = 0; onG = true; }
            frame++; const spd = 4 + score * 0.015;
            if (frame % Math.floor(Math.max(42, 95 - score * 0.3)) === 0) obs.push({ x: W, w: 14 + Math.random() * 14, h: 20 + Math.random() * 26 });
            obs.forEach((o) => o.x -= spd);
            obs = obs.filter((o) => o.x + o.w > -5);
            score += 0.2;
            obs.forEach((o) => { if (64 > o.x && 34 < o.x + o.w && y > yg - o.h) die(); });
          }
          x.fillStyle = "#e05a6e";
          obs.forEach((o) => x.fillRect(o.x, yg - o.h, o.w, o.h));
          if (cat.complete) x.drawImage(cat, 34, y - 30, 30, 30);
          x.fillStyle = "#fff"; x.font = "bold 18px system-ui"; x.textAlign = "right"; x.fillText(Math.floor(score) + "m", W - 10, 24);
          raf = requestAnimationFrame(loop);
        }
        const key = (e) => { if (e.code === "Space" || e.key === "ArrowUp") { e.preventDefault(); jump(); } };
        document.addEventListener("keydown", key); c.addEventListener("pointerdown", jump);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); });
        loop();
      }
    },

    // ---------- 5. Fast Paws (reaction) ----------
    {
      key: "reaction", name: "Fast Paws", icon: "⚡", reward: (s) => Math.round(s / 18),
      bestLabel: (b) => b ? "Best: " + b + " pts" : "New!",
      play(host, api) {
        const wrap = document.createElement("div"); wrap.className = "react-wrap"; host.appendChild(wrap);
        const pad = document.createElement("button"); pad.className = "react-pad wait"; wrap.appendChild(pad);
        const info = document.createElement("p"); info.className = "ar-hint"; wrap.appendChild(info);
        let round = 0, times = [], state = "idle", t0 = 0, timer = null;
        info.innerHTML = "Round 1 of 5 — click <b>Start</b>, then click the moment it turns <b style='color:#3ee08f'>GREEN</b>.";
        pad.textContent = "Start"; pad.classList.remove("go"); pad.classList.add("wait");
        function nextRound() {
          if (round >= 5) return done();
          state = "ready"; pad.textContent = "Wait…"; pad.className = "react-pad ready";
          timer = setTimeout(() => { state = "go"; t0 = performance.now(); pad.textContent = "CLICK!"; pad.className = "react-pad go"; api.tone(880, 0.07); }, 900 + Math.random() * 2200);
        }
        pad.onclick = () => {
          if (state === "idle") { state = "ready"; nextRound(); return; }
          if (state === "ready") { clearTimeout(timer); pad.textContent = "Too early! Click to retry"; pad.className = "react-pad early"; state = "idle"; pad.onclick2 = null; state = "idle"; return; }
          if (state === "go") {
            const ms = Math.round(performance.now() - t0); times.push(ms); round++;
            api.tone(600, 0.06); state = "idle";
            info.innerHTML = "That was <b>" + ms + "ms</b>! " + (round < 5 ? ("Round " + (round + 1) + " of 5 — click to continue.") : "Done!");
            pad.textContent = round < 5 ? "Next" : "See results"; pad.className = "react-pad wait";
          }
        };
        function done() {
          const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
          const best = Math.min.apply(null, times);
          const pts = Math.max(5, 650 - avg);
          api.finish(pts, { scoreForBest: pts, title: avg < 300 ? "Lightning paws! ⚡" : "Nice reflexes!", line: "Avg <b>" + avg + "ms</b> · fastest <b>" + best + "ms</b>", flag: best < 250 ? "reaction" : null });
        }
      }
    },

    // ---------- 6. Tic-Tac-Toe vs Maxwell ----------
    {
      key: "ttt", name: "Tic-Tac-Maxwell", icon: "⭕", reward: (s) => Math.round(s / 4),
      bestLabel: (b) => b >= 100 ? "Beaten Maxwell!" : (b ? "Best: " + b : "New!"),
      play(host, api) {
        hintLine(host, "You're 🐈. Beat Maxwell (👑)! Three in a row wins.");
        const grid = document.createElement("div"); grid.className = "ttt-grid"; host.appendChild(grid);
        let b = Array(9).fill(""), done = false;
        const cells = [];
        for (let i = 0; i < 9; i++) { const d = document.createElement("button"); d.className = "ttt-cell"; d.onclick = () => play(i); grid.appendChild(d); cells.push(d); }
        const WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        function winner(bd) { for (const [a, c, e] of WIN) if (bd[a] && bd[a] === bd[c] && bd[a] === bd[e]) return bd[a]; return bd.includes("") ? null : "draw"; }
        function render() { cells.forEach((c, i) => c.textContent = b[i] === "X" ? "🐈" : b[i] === "O" ? "👑" : ""); }
        function play(i) {
          if (done || b[i]) return; b[i] = "X"; api.tone(520, 0.05); render();
          let w = winner(b); if (w) return end(w);
          const m = best(b, "O").idx; if (m != null) { b[m] = "O"; api.tone(400, 0.05); } render();
          w = winner(b); if (w) end(w);
        }
        function best(bd, who) {
          const w = winner(bd);
          if (w === "O") return { score: 10 }; if (w === "X") return { score: -10 }; if (w === "draw") return { score: 0 };
          let moves = [];
          bd.forEach((v, i) => { if (!v) { const nb = bd.slice(); nb[i] = who; const r = best(nb, who === "O" ? "X" : "O"); moves.push({ idx: i, score: r.score }); } });
          if (who === "O") return moves.reduce((a, m) => m.score > a.score ? m : a, { score: -99 });
          return moves.reduce((a, m) => m.score < a.score ? m : a, { score: 99 });
        }
        function end(w) {
          done = true;
          const pts = w === "X" ? 120 : w === "draw" ? 45 : 12;
          setTimeout(() => api.finish(pts, { scoreForBest: pts, title: w === "X" ? "You win! 🎉" : w === "draw" ? "Draw!" : "Maxwell wins 😼", line: w === "X" ? "You beat Maxwell!" : w === "draw" ? "Nobody won." : "Maxwell got you this time." }), 500);
        }
        render();
      }
    },

    // ---------- 7. Maxwell Merge (2048) ----------
    {
      key: "merge", name: "Maxwell Merge", icon: "🔢", reward: (s, o) => Math.floor((o.pts || 0) / 20),
      bestLabel: (b) => b ? "Best tile: " + b : "New!",
      play(host, api) {
        hintLine(host, "Use <b>arrow keys</b> / swipe. Merge matching tiles. Get the big ones!");
        const grid = document.createElement("div"); grid.className = "merge-grid"; host.appendChild(grid);
        let g = Array(16).fill(0), score = 0, over = false, cells = [];
        for (let i = 0; i < 16; i++) { const d = document.createElement("div"); d.className = "merge-cell"; grid.appendChild(d); cells.push(d); }
        function render() {
          cells.forEach((c, i) => { const v = g[i]; c.textContent = v ? v : ""; c.dataset.v = v; });
        }
        function add() { const empty = g.map((v, i) => v ? -1 : i).filter((i) => i >= 0); if (!empty.length) return; g[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4; }
        function row(r) { return [g[r*4], g[r*4+1], g[r*4+2], g[r*4+3]]; }
        function setRow(r, a) { for (let i = 0; i < 4; i++) g[r*4+i] = a[i]; }
        function col(cI) { return [g[cI], g[cI+4], g[cI+8], g[cI+12]]; }
        function setCol(cI, a) { for (let i = 0; i < 4; i++) g[cI+i*4] = a[i]; }
        function slide(a) {
          let f = a.filter((v) => v); let moved = false;
          for (let i = 0; i < f.length - 1; i++) { if (f[i] === f[i+1]) { f[i] *= 2; score += f[i]; f.splice(i+1, 1); } }
          while (f.length < 4) f.push(0);
          for (let i = 0; i < 4; i++) if (f[i] !== a[i]) moved = true;
          return { a: f, moved };
        }
        function move(dir) {
          if (over) return; let moved = false;
          for (let i = 0; i < 4; i++) {
            let line = dir === "L" || dir === "R" ? row(i) : col(i);
            const rev = dir === "R" || dir === "D"; if (rev) line.reverse();
            const r = slide(line); if (rev) r.a.reverse();
            if (r.moved) moved = true;
            if (dir === "L" || dir === "R") setRow(i, r.a); else setCol(i, r.a);
          }
          if (moved) { add(); api.tone(440, 0.04); render(); if (dead()) end(); }
        }
        function dead() {
          if (g.includes(0)) return false;
          for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const v = g[r*4+c]; if (c < 3 && v === g[r*4+c+1]) return false; if (r < 3 && v === g[r*4+c+4]) return false; }
          return true;
        }
        function end() { over = true; const maxTile = Math.max.apply(null, g); api.boom(); setTimeout(() => api.finish(maxTile, { scoreForBest: maxTile, pts: score, title: maxTile >= 512 ? "Huge!" : "Board full!", line: "Score <b>" + score + "</b> · best tile <b>" + maxTile + "</b>" }), 400); }
        const key = (e) => { const m = { ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D", a: "L", d: "R", w: "U", s: "D" }[e.key]; if (m) { e.preventDefault(); move(m); } };
        document.addEventListener("keydown", key);
        // touch swipe
        let sx, sy; const ts = (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
        const te = (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "R" : "L"); else move(dy > 0 ? "D" : "U"); sx = sy = null; };
        grid.addEventListener("touchstart", ts); grid.addEventListener("touchend", te);
        api.onClean(() => document.removeEventListener("keydown", key));
        add(); add(); render();
      }
    },

    // ---------- 8. Simon Meows ----------
    {
      key: "simon", name: "Simon Meows", icon: "🎹", reward: (s) => s * 5,
      play(host, api) {
        hintLine(host, "Watch the pattern, then repeat it. It grows each round!");
        const wrap = document.createElement("div"); wrap.className = "simon-wrap"; host.appendChild(wrap);
        const status = document.createElement("p"); status.className = "ar-hint simon-status"; status.textContent = "Round 1 — watch…"; host.appendChild(status);
        const freqs = [330, 440, 550, 660]; const pads = [];
        for (let i = 0; i < 4; i++) { const p = document.createElement("button"); p.className = "simon-pad s" + i; p.onclick = () => press(i); wrap.appendChild(p); pads.push(p); }
        let seq = [], input = [], round = 0, showing = true;
        function flash(i, ms) { pads[i].classList.add("lit"); api.tone(freqs[i], 0.25); setTimeout(() => pads[i].classList.remove("lit"), ms || 320); }
        function nextRound() {
          round++; input = []; showing = true; status.textContent = "Round " + round + " — watch…";
          seq.push(Math.floor(Math.random() * 4));
          let t = 500; seq.forEach((i, k) => setTimeout(() => flash(i, 350), t + k * 560));
          setTimeout(() => { showing = false; status.textContent = "Round " + round + " — your turn!"; }, 500 + seq.length * 560 + 150);
        }
        function press(i) {
          if (showing) return; flash(i, 200); input.push(i);
          const k = input.length - 1;
          if (input[k] !== seq[k]) { api.boom(); return setTimeout(() => api.finish(round - 1, { title: "Oops!", line: "You reached round <b>" + round + "</b>" }), 300); }
          if (input.length === seq.length) { api.tone(880, 0.1); setTimeout(nextRound, 650); }
        }
        setTimeout(nextRound, 600);
      }
    },

    // ---------- 9. Rock Paper Scissors ----------
    {
      key: "rps", name: "Rock Paper Meow", icon: "✊", reward: (s) => Math.round(s / 6),
      bestLabel: (b) => b >= 100 ? "Won a match!" : (b ? "Best: " + b : "New!"),
      play(host, api) {
        hintLine(host, "First to 3 wins the match. Pick your move!");
        const score = document.createElement("p"); score.className = "ar-hint rps-score"; score.innerHTML = "You <b>0</b> — <b>0</b> Maxwell"; host.appendChild(score);
        const show = document.createElement("div"); show.className = "rps-show"; show.textContent = "🐈  vs  👑"; host.appendChild(show);
        const btns = document.createElement("div"); btns.className = "rps-btns"; host.appendChild(btns);
        const OPT = [["✊", "Rock"], ["✋", "Paper"], ["✌️", "Scissors"]];
        let me = 0, cpu = 0, done = false;
        OPT.forEach((o, i) => { const b = document.createElement("button"); b.className = "btn rps-b"; b.innerHTML = o[0] + "<small>" + o[1] + "</small>"; b.onclick = () => go(i); btns.appendChild(b); });
        function go(i) {
          if (done) return; const c = Math.floor(Math.random() * 3);
          show.textContent = OPT[i][0] + "  vs  " + OPT[c][0];
          if (i !== c) { if ((i === 0 && c === 2) || (i === 1 && c === 0) || (i === 2 && c === 1)) { me++; api.tone(760, 0.08); } else { cpu++; api.tone(240, 0.1, "sawtooth"); } }
          else api.tone(440, 0.05);
          score.innerHTML = "You <b>" + me + "</b> — <b>" + cpu + "</b> Maxwell";
          if (me === 3 || cpu === 3) { done = true; const pts = me === 3 ? 120 : 15; setTimeout(() => api.finish(pts, { scoreForBest: pts, title: me === 3 ? "You win the match! 🎉" : "Maxwell wins 😼", line: "Final: you " + me + " — " + cpu + " Maxwell" }), 600); }
        }
      }
    },

    // ---------- 10. Maxwell Snake ----------
    {
      key: "snake", name: "Maxwell Snake", icon: "🐍", reward: (s) => s * 2,
      play(host, api) {
        const W = 360, H = 360, SZ = 18, T = W / SZ; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>Arrow keys</b> / <b>WASD</b> to move. Eat the 🐟!");
        let snake, dir, nd, food, score, over, raf, acc = 0, last = 0;
        function reset() { snake = [{ x: 9, y: 9 }]; dir = { x: 1, y: 0 }; nd = dir; score = 0; over = false; placeFood(); }
        function placeFood() { do { food = { x: (Math.random() * T) | 0, y: (Math.random() * T) | 0 }; } while (snake.some((s) => s.x === food.x && s.y === food.y)); }
        function step() {
          dir = nd; const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
          if (h.x < 0 || h.y < 0 || h.x >= T || h.y >= T || snake.some((s) => s.x === h.x && s.y === h.y)) { over = true; api.boom(); cancelAnimationFrame(raf); return api.finish(score, { title: score >= 15 ? "Big snake!" : "Crashed!", line: "You ate <b>" + score + "</b> fish" }); }
          snake.unshift(h);
          if (h.x === food.x && h.y === food.y) { score++; api.tone(700, 0.05); placeFood(); } else snake.pop();
        }
        function draw() {
          x.fillStyle = "#101828"; x.fillRect(0, 0, W, H);
          x.font = "15px system-ui, 'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle";
          x.fillText("🐟", food.x * SZ + SZ / 2, food.y * SZ + SZ / 2);
          snake.forEach((s, i) => { if (i === 0) { drawMax(x, s.x * SZ + SZ / 2, s.y * SZ + SZ / 2, SZ / 2); } else { x.fillStyle = "#6c5ce7"; x.fillRect(s.x * SZ + 1, s.y * SZ + 1, SZ - 2, SZ - 2); } });
          x.fillStyle = "#fff"; x.font = "bold 16px system-ui"; x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillText("🐟 " + score, 8, 20);
        }
        function loop(t) { if (!last) last = t; acc += t - last; last = t; if (acc > 110 && !over) { acc = 0; step(); } if (!over) { draw(); raf = requestAnimationFrame(loop); } }
        const key = (e) => { const k = e.key.toLowerCase(); const m = { arrowup: [0,-1], w: [0,-1], arrowdown: [0,1], s: [0,1], arrowleft: [-1,0], a: [-1,0], arrowright: [1,0], d: [1,0] }[k]; if (m) { e.preventDefault(); if (m[0] !== -dir.x || m[1] !== -dir.y) nd = { x: m[0], y: m[1] }; } };
        document.addEventListener("keydown", key);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); });
        reset(); draw(); raf = requestAnimationFrame(loop);
      }
    },

    // ---------- 11. Fish Factory (clicker frenzy) ----------
    {
      key: "clicker", name: "Fish Frenzy", icon: "👆", reward: (s) => s,
      play(host, api) {
        hintLine(host, "Click the fish as FAST as you can for <b>15 seconds</b>!");
        const big = document.createElement("button"); big.className = "frenzy-fish"; big.textContent = "🐟"; host.appendChild(big);
        const hud = document.createElement("p"); hud.className = "ar-hint frenzy-hud"; hud.innerHTML = "Clicks: <b>0</b> · ⏱️ <b>15</b>s"; host.appendChild(hud);
        let clicks = 0, time = 15, started = false, timer = null;
        big.onclick = () => {
          if (time <= 0) return;
          if (!started) { started = true; timer = setInterval(() => { time--; hud.innerHTML = "Clicks: <b>" + clicks + "</b> · ⏱️ <b>" + time + "</b>s"; if (time <= 0) end(); }, 1000); }
          clicks++; api.tone(500 + (clicks % 8) * 40, 0.03, "square", 0.04);
          big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop");
          hud.innerHTML = "Clicks: <b>" + clicks + "</b> · ⏱️ <b>" + time + "</b>s";
        };
        function end() { clearInterval(timer); big.disabled = true; api.finish(clicks, { title: clicks >= 90 ? "Blazing fast! 🔥" : "Time!", line: "<b>" + clicks + "</b> clicks · " + (clicks / 15).toFixed(1) + "/sec" }); }
        api.onClean(() => clearInterval(timer));
      }
    },

    // ---------- 12. Maxwell Pong ----------
    {
      key: "pong", name: "Maxwell Pong", icon: "🏓", reward: (s) => Math.round(s / 6),
      bestLabel: (b) => b >= 100 ? "Beat Maxwell!" : (b ? "Best: " + b : "New!"),
      play(host, api) {
        const W = 400, H = 280; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Move your paddle with the <b>mouse</b>. First to 5 wins!");
        let py = H / 2, ay = H / 2, bx = W / 2, by = H / 2, vx = 3.2, vy = 2, me = 0, cpu = 0, over = false, raf;
        const PH = 56, PW = 9;
        function reset(dir) { bx = W / 2; by = H / 2; vx = 3.2 * dir; vy = (Math.random() * 3 - 1.5); }
        function loop() {
          x.fillStyle = "#0e1730"; x.fillRect(0, 0, W, H);
          x.strokeStyle = "#2a3760"; x.setLineDash([6, 8]); x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke(); x.setLineDash([]);
          if (!over) {
            bx += vx; by += vy;
            if (by < 6 || by > H - 6) vy *= -1;
            ay += Math.max(-3.4, Math.min(3.4, (by - ay) * 0.09));
            if (bx < 18 + PW && by > ay - PH / 2 && by < ay + PH / 2) { vx = Math.abs(vx) * 1.03; vy += (by - ay) * 0.04; api.tone(400, 0.04); }
            if (bx > W - 18 - PW && by > py - PH / 2 && by < py + PH / 2) { vx = -Math.abs(vx) * 1.03; vy += (by - py) * 0.04; api.tone(600, 0.04); }
            if (bx < 0) { cpu++; if (cpu >= 5) return end(); reset(1); }
            if (bx > W) { me++; api.tone(760, 0.08); if (me >= 5) return end(); reset(-1); }
          }
          x.fillStyle = "#e05a6e"; x.fillRect(12, ay - PH / 2, PW, PH);
          x.fillStyle = "#3ee08f"; x.fillRect(W - 12 - PW, py - PH / 2, PW, PH);
          drawMax(x, bx, by, 10);
          x.fillStyle = "#fff"; x.font = "bold 24px system-ui"; x.textAlign = "center"; x.fillText(cpu + "   " + me, W / 2, 30);
          raf = requestAnimationFrame(loop);
        }
        function end() { over = true; cancelAnimationFrame(raf); api.boom(); const pts = me >= 5 ? 120 : 15; api.finish(pts, { scoreForBest: pts, title: me >= 5 ? "You win! 🎉" : "Maxwell wins 😼", line: "Final: Maxwell " + cpu + " — " + me + " you" }); }
        const mv = (e) => { const r = c.getBoundingClientRect(); py = (e.clientY - r.top) * (H / r.height); py = Math.max(PH / 2, Math.min(H - PH / 2, py)); };
        c.addEventListener("pointermove", mv);
        api.onClean(() => { cancelAnimationFrame(raf); });
        reset(Math.random() < 0.5 ? 1 : -1); loop();
      }
    },

    // ========== MORE NEW GAMES ==========

    // ---------- Flappy Maxwell ----------
    {
      key: "flappy", name: "Flappy Maxwell", icon: "🐤", isNew: true, reward: (s) => s * 3,
      play(host, api) {
        const W = 360, H = 420; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "<b>Tap / Space</b> to flap. Fly through the gaps!");
        const cat = new Image(); cat.src = api.img;
        let y, vy, pipes, score, over, raf, started;
        function reset() { y = H / 2; vy = 0; pipes = []; score = 0; over = false; started = false; for (let i = 0; i < 3; i++) pipes.push({ x: W + i * 160, gap: 90 + Math.random() * (H - 240), passed: false }); }
        function flap() { if (over) return; started = true; vy = -6.2; api.tone(600, 0.04); }
        function loop() {
          x.fillStyle = "#4ec0ff"; x.fillRect(0, 0, W, H);
          if (started && !over) { vy += 0.4; y += vy; }
          pipes.forEach((p) => { if (started && !over) p.x -= 2.6; x.fillStyle = "#3ec46b"; x.fillRect(p.x, 0, 46, p.gap - 55); x.fillRect(p.x, p.gap + 55, 46, H); if (!p.passed && p.x + 46 < W / 2 - 16) { p.passed = true; score++; api.tone(800, 0.05); } if (p.x < -46) { p.x = W; p.gap = 90 + Math.random() * (H - 240); p.passed = false; } if (p.x < W / 2 + 16 && p.x + 46 > W / 2 - 16 && (y - 16 < p.gap - 55 || y + 16 > p.gap + 55)) dead(); });
          if (y > H - 16 || y < -40) dead();
          if (cat.complete) x.drawImage(cat, W / 2 - 18, y - 18, 36, 36); else { x.fillStyle = "#fff"; x.beginPath(); x.arc(W / 2, y, 16, 0, 7); x.fill(); }
          x.fillStyle = "#fff"; x.font = "bold 28px system-ui"; x.textAlign = "center"; x.fillText(score, W / 2, 40);
          if (!started) { x.font = "bold 18px system-ui"; x.fillText("Tap to start!", W / 2, H / 2 - 60); }
          if (!over) raf = requestAnimationFrame(loop);
        }
        function dead() { if (over) return; over = true; api.boom(); cancelAnimationFrame(raf); api.finish(score, { title: score >= 10 ? "Nice flying!" : "Splat!", line: "You passed <b>" + score + "</b> pipes" }); }
        const kd = (e) => { if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); flap(); } };
        document.addEventListener("keydown", kd); c.addEventListener("pointerdown", flap);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); });
        reset(); loop();
      }
    },

    // ---------- Maxwell 2048 ----------
    {
      key: "g2048", name: "Maxwell 2048", icon: "🔢", isNew: true, reward: (s) => Math.floor(s / 20),
      play(host, api) {
        const N = 4; let grid, score, over;
        const wrap = document.createElement("div"); wrap.className = "g2048-wrap"; host.appendChild(wrap);
        hintLine(host, "<b>Arrow keys / swipe</b> to merge tiles. Reach 2048!");
        const sc = document.createElement("p"); sc.className = "ar-hint"; host.appendChild(sc);
        function reset() { grid = Array(N * N).fill(0); score = 0; over = false; add(); add(); draw(); }
        function add() { const e = []; grid.forEach((v, i) => { if (!v) e.push(i); }); if (!e.length) return; grid[e[Math.random() * e.length | 0]] = Math.random() < 0.9 ? 2 : 4; }
        function slide(r) { let a = r.filter((v) => v); for (let i = 0; i < a.length - 1; i++) if (a[i] === a[i + 1]) { a[i] *= 2; score += a[i]; a[i + 1] = 0; } a = a.filter((v) => v); while (a.length < N) a.push(0); return a; }
        function move(dir) {
          if (over) return; const before = grid.join(",");
          for (let i = 0; i < N; i++) {
            let line = []; for (let j = 0; j < N; j++) line.push(dir === "l" || dir === "r" ? grid[i * N + j] : grid[j * N + i]);
            if (dir === "r" || dir === "d") line.reverse();
            line = slide(line);
            if (dir === "r" || dir === "d") line.reverse();
            for (let j = 0; j < N; j++) { if (dir === "l" || dir === "r") grid[i * N + j] = line[j]; else grid[j * N + i] = line[j]; }
          }
          if (grid.join(",") !== before) { add(); api.tone(520, 0.04); draw(); if (grid.indexOf(2048) >= 0) end("🎉 2048! You win!"); else if (!canMove()) end("No moves left!"); }
        }
        function canMove() { if (grid.indexOf(0) >= 0) return true; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const v = grid[i * N + j]; if (j < N - 1 && v === grid[i * N + j + 1]) return true; if (i < N - 1 && v === grid[(i + 1) * N + j]) return true; } return false; }
        function end(t) { over = true; api.boom(); api.finish(score, { title: t, line: "Score: <b>" + score + "</b>" }); }
        const COL = { 2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563", 32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61", 512: "#edc850", 1024: "#edc53f", 2048: "#edc22e" };
        function draw() { wrap.innerHTML = ""; grid.forEach((v) => { const t = document.createElement("div"); t.className = "g2048-cell"; if (v) { t.textContent = v; t.style.background = COL[v] || "#3c3a32"; t.style.color = v <= 4 ? "#776e65" : "#fff"; } wrap.appendChild(t); }); sc.innerHTML = "Score: <b>" + score + "</b>"; }
        const kd = (e) => { const m = { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d", a: "l", d: "r", w: "u", s: "d" }[e.key] || { a: "l" }[e.key]; const dir = { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d" }[e.key]; if (dir) { e.preventDefault(); move(dir); } };
        document.addEventListener("keydown", kd);
        let sx, sy; const ts = (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }; const te = (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "r" : "l"); else move(dy > 0 ? "d" : "u"); sx = null; };
        wrap.addEventListener("touchstart", ts); wrap.addEventListener("touchend", te);
        api.onClean(() => document.removeEventListener("keydown", kd));
        reset();
      }
    },

    // ---------- Memory Match ----------
    {
      key: "memory", name: "Memory Match", icon: "🃏", isNew: true, reward: (s) => Math.max(5, 150 - s * 3),
      play(host, api) {
        const EMO = ["🐱", "🐟", "👑", "✨", "🎮", "🧀", "🐭", "🎀"]; let deck = EMO.concat(EMO).sort(() => Math.random() - 0.5);
        hintLine(host, "Flip cards to find all <b>8 pairs</b> in as few moves as possible!");
        const grid = document.createElement("div"); grid.className = "mem-grid"; host.appendChild(grid);
        const msg = document.createElement("p"); msg.className = "ar-hint"; host.appendChild(msg);
        let flipped = [], matched = 0, moves = 0, lock = false; const cards = [];
        deck.forEach((e, i) => { const card = document.createElement("button"); card.className = "mem-card"; card.dataset.e = e; card.textContent = "?"; card.onclick = () => flip(i, card); grid.appendChild(card); cards.push(card); });
        function flip(i, card) {
          if (lock || card.classList.contains("up") || card.classList.contains("done")) return;
          card.textContent = card.dataset.e; card.classList.add("up"); api.tone(500, 0.04); flipped.push({ i, card });
          if (flipped.length === 2) { moves++; msg.textContent = "Moves: " + moves; lock = true; const [a, b] = flipped;
            if (a.card.dataset.e === b.card.dataset.e) { setTimeout(() => { a.card.classList.add("done"); b.card.classList.add("done"); flipped = []; lock = false; matched++; api.tone(800, 0.06); if (matched === 8) { api.meow(); api.finish(moves, { title: "All matched!", line: "Done in <b>" + moves + "</b> moves" }); } }, 350); }
            else setTimeout(() => { a.card.textContent = "?"; b.card.textContent = "?"; a.card.classList.remove("up"); b.card.classList.remove("up"); flipped = []; lock = false; }, 750); }
        }
      }
    },

    // ---------- Whack-a-Maxwell ----------
    {
      key: "whack", name: "Whack-a-Mole", icon: "🔨", isNew: true, reward: (s) => s * 2,
      play(host, api) {
        hintLine(host, "Bonk the 🐱 (not the 💣) before they vanish! <b>20 seconds</b>.");
        const grid = document.createElement("div"); grid.className = "whack-grid"; host.appendChild(grid);
        const msg = document.createElement("p"); msg.className = "ar-hint"; host.appendChild(msg);
        const holes = []; for (let i = 0; i < 9; i++) { const h = document.createElement("button"); h.className = "whack-hole"; h.onclick = () => bonk(i); grid.appendChild(h); holes.push(h); }
        let score = 0, time = 20, over = false;
        function bonk(i) { if (over) return; const h = holes[i]; if (h.dataset.on === "cat") { score += 1; h.textContent = "💥"; h.dataset.on = ""; api.tone(700, 0.05); msg.textContent = "Score: " + score + " · ⏱️ " + time; setTimeout(() => { if (h.textContent === "💥") h.textContent = ""; }, 150); } else if (h.dataset.on === "bomb") { score = Math.max(0, score - 2); h.textContent = "💥"; h.dataset.on = ""; api.boom(); } }
        const pop = setInterval(() => { if (over) return; holes.forEach((h) => { if (Math.random() < 0.25 && !h.dataset.on) { const bomb = Math.random() < 0.22; h.dataset.on = bomb ? "bomb" : "cat"; h.textContent = bomb ? "💣" : "🐱"; setTimeout(() => { if (h.dataset.on) { h.dataset.on = ""; h.textContent = ""; } }, 700 + Math.random() * 500); } }); }, 420);
        const clock = setInterval(() => { time--; msg.textContent = "Score: " + score + " · ⏱️ " + time; if (time <= 0) { over = true; clearInterval(pop); clearInterval(clock); api.finish(score, { title: "Time!", line: "You bonked <b>" + score + "</b>" }); } }, 1000);
        msg.textContent = "Score: 0 · ⏱️ 20";
        api.onClean(() => { clearInterval(pop); clearInterval(clock); });
      }
    },

    // ---------- Reaction Test ----------
    {
      key: "reflex", name: "Reaction Test", icon: "⚡", isNew: true, reward: () => 15,
      play(host, api) {
        const pad = document.createElement("div"); pad.className = "duel-pad wait"; pad.textContent = "Click to start"; host.appendChild(pad);
        const msg = document.createElement("p"); msg.className = "ar-hint"; msg.innerHTML = "When it turns <b style='color:#3ee08f'>GREEN</b>, click as fast as you can!"; host.appendChild(msg);
        let state = "idle", t0 = 0, timer = null, best = 9999, rounds = [];
        function arm() { state = "ready"; pad.className = "duel-pad ready"; pad.textContent = "Wait for green…"; timer = setTimeout(() => { state = "go"; t0 = performance.now(); pad.className = "duel-pad go"; pad.textContent = "CLICK!"; api.tone(880, 0.08); }, 1200 + Math.random() * 2800); }
        pad.onclick = () => {
          if (state === "idle") { arm(); }
          else if (state === "ready") { clearTimeout(timer); pad.className = "duel-pad wait"; pad.textContent = "Too early! Click to retry"; state = "idle"; api.tone(160, 0.15, "sawtooth"); }
          else if (state === "go") { const ms = Math.round(performance.now() - t0); rounds.push(ms); best = Math.min(best, ms); api.tone(660, 0.08); if (rounds.length >= 3) { const avg = Math.round(rounds.reduce((a, b) => a + b) / rounds.length); state = "done"; pad.className = "duel-pad wait"; pad.textContent = avg + " ms avg"; api.finish(avg, { title: avg < 300 ? "Lightning! ⚡" : "Nice!", line: "Avg <b>" + avg + "ms</b> · best <b>" + best + "ms</b>", scoreForBest: 1000 - avg }); } else { pad.className = "duel-pad wait"; pad.textContent = ms + " ms — click for round " + (rounds.length + 1); state = "idle"; } }
        };
      }
    },

    // ---------- Color Match ----------
    {
      key: "colormatch", name: "Color Rush", icon: "🌈", isNew: true, reward: (s) => s * 2,
      play(host, api) {
        hintLine(host, "Tap the button whose <b>word</b> matches the <b>ink color</b> of the top word. 25s!");
        const top = document.createElement("div"); top.className = "cr-word"; host.appendChild(top);
        const opts = document.createElement("div"); opts.className = "cr-opts"; host.appendChild(opts);
        const msg = document.createElement("p"); msg.className = "ar-hint"; host.appendChild(msg);
        const COLORS = [["Red", "#ff4d4d"], ["Green", "#3ee08f"], ["Blue", "#4e9bff"], ["Yellow", "#ffd84a"], ["Pink", "#ff5fa2"]];
        let score = 0, time = 25, over = false, answer = 0;
        function round() { const ink = Math.random() * COLORS.length | 0; const word = Math.random() * COLORS.length | 0; answer = ink; top.textContent = COLORS[word][0]; top.style.color = COLORS[ink][1]; const choices = [...Array(COLORS.length).keys()].sort(() => Math.random() - 0.5).slice(0, 3); if (choices.indexOf(ink) < 0) choices[0] = ink; choices.sort(() => Math.random() - 0.5); opts.innerHTML = ""; choices.forEach((ci) => { const b = document.createElement("button"); b.className = "btn cr-opt"; b.textContent = COLORS[ci][0]; b.onclick = () => { if (over) return; if (ci === answer) { score++; api.tone(760, 0.05); } else { score = Math.max(0, score - 1); api.tone(180, 0.1, "sawtooth"); } msg.textContent = "Score: " + score + " · ⏱️ " + time; round(); }; opts.appendChild(b); }); }
        round(); msg.textContent = "Score: 0 · ⏱️ 25";
        const clock = setInterval(() => { time--; msg.textContent = "Score: " + score + " · ⏱️ " + time; if (time <= 0) { over = true; clearInterval(clock); api.finish(score, { title: "Time!", line: "Score: <b>" + score + "</b>" }); } }, 1000);
        api.onClean(() => clearInterval(clock));
      }
    },

    // ---------- Maxwell Kart ----------
    {
      key: "kart", name: "Maxwell Kart 3D", icon: "🏁", isNew: true, reward: (s) => Math.max(10, (4 - s) * 25),
      play(host, api) {
        const W = 480, H = 320; const c = canvas(host, W, H); const x = c.getContext("2d"); const cat = maxImg();
        hintLine(host, "<b>↑</b> gas · <b>↓</b> brake · <b>← →</b> steer. 3 laps — finish ahead of the pack! 🏁");
        // ---- pseudo-3D road (behind-the-kart perspective) ----
        const SEG = 200, N = 760, ROADW = 2000, DRAW = 160, DEPTH = 0.84, CAMH = 1500;
        const TRACK = N * SEG;
        const segs = [];
        for (let i = 0; i < N; i++) segs.push({ curve: Math.sin(i * 0.013) * 2.6 + Math.sin(i * 0.031) * 1.3, y: Math.sin(i * 0.021) * 1400 + Math.sin(i * 0.05) * 500 });
        const MAX = SEG * 0.62, ACC = MAX / 90, DEC = MAX / 55, OFFDEC = MAX / 30, OFFMAX = MAX * 0.42;
        let pos = 0, speed = 0, playerX = 0, over = false, raf, t = 0;
        const LAPS = 3; let lap = 1, started = false;
        const cpus = []; for (let i = 0; i < 5; i++) cpus.push({ pos: (i + 1) * 420, x: (Math.random() * 1.4 - 0.7), spd: MAX * (0.62 + Math.random() * 0.14), hue: [0, 45, 130, 280, 200][i] });
        const keys = {};
        function project(camX, camY, camZ, wy, wz) { const cz = wz - camZ, scale = DEPTH / Math.max(1, cz); return { x: Math.round(W / 2 + scale * (0 - camX) * W / 2) + 0, sx: scale, cz: cz, X: Math.round(W / 2 + scale * (-camX) * W / 2), Y: Math.round(H / 2 - scale * (wy - camY) * H / 2), w: Math.round(scale * ROADW * W / 2) }; }
        function proj(camX, wy, wz, camZ) { const cz = wz - camZ, scale = DEPTH / Math.max(1, cz); return { X: Math.round(W / 2 + scale * -camX * W / 2), Y: Math.round(H / 2 - scale * (wy - CAMH) * H / 2), W: Math.round(scale * ROADW * W / 2), s: scale, cz }; }
        function poly(ax, ay, bx, by, cx, cy, dx, dy, col) { x.fillStyle = col; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.lineTo(cx, cy); x.lineTo(dx, dy); x.closePath(); x.fill(); }
        function loop() {
          t++;
          if (!over && started) {
            if (keys.up) speed += ACC; else if (keys.down) speed -= DEC; else speed -= DEC * 0.35;
            speed = Math.max(0, Math.min(MAX, speed));
            const offroad = Math.abs(playerX) > 1;
            if (offroad && speed > OFFMAX) speed -= OFFDEC;
            const sp = speed / MAX, base = Math.floor(pos / SEG) % N;
            const dxp = 0.0024 * sp;
            if (keys.left) playerX -= dxp; if (keys.right) playerX += dxp;
            playerX -= segs[base].curve * sp * sp * 0.0007;
            playerX = Math.max(-2.2, Math.min(2.2, playerX));
            pos += speed;
            cpus.forEach((cp) => { cp.pos += cp.spd; });
            const newLap = Math.floor(pos / TRACK) + 1;
            if (newLap > lap) { lap = newLap; api.tone(700, 0.12); if (lap > LAPS) return finish(); }
          }
          // sky + ground
          const grad = x.createLinearGradient(0, 0, 0, H / 2); grad.addColorStop(0, "#4ab3ff"); grad.addColorStop(1, "#bfe8ff"); x.fillStyle = grad; x.fillRect(0, 0, W, H);
          x.fillStyle = "#3a7d44"; x.fillRect(0, H / 2, W, H / 2);
          // road
          const base = Math.floor(pos / SEG); let xx = 0, dx = 0, maxy = H;
          for (let n = 0; n < DRAW; n++) {
            const si = (base + n) % N, seg = segs[si], nseg = segs[(base + n + 1) % N];
            const z1 = (base + n) * SEG, z2 = (base + n + 1) * SEG;
            const p1 = proj(playerX * ROADW - xx, seg.y, z1, pos);
            const p2 = proj(playerX * ROADW - xx - dx, nseg.y, z2, pos);
            xx += dx; dx += seg.curve;
            if (p1.cz <= DEPTH || p2.Y >= maxy) continue;
            const dark = Math.floor((base + n) / 3) % 2;
            const grass = dark ? "#3a7d44" : "#45944f"; const road = dark ? "#4a4e58" : "#53575f"; const rum = dark ? "#e2e2ea" : "#c43a3a";
            x.fillStyle = grass; x.fillRect(0, p2.Y, W, p1.Y - p2.Y);
            const r1 = p1.W * 0.14, r2 = p2.W * 0.14;
            poly(p1.X - p1.W - r1, p1.Y, p1.X - p1.W, p1.Y, p2.X - p2.W, p2.Y, p2.X - p2.W - r2, p2.Y, rum);
            poly(p1.X + p1.W + r1, p1.Y, p1.X + p1.W, p1.Y, p2.X + p2.W, p2.Y, p2.X + p2.W + r2, p2.Y, rum);
            poly(p1.X - p1.W, p1.Y, p1.X + p1.W, p1.Y, p2.X + p2.W, p2.Y, p2.X - p2.W, p2.Y, road);
            if (!dark) { poly(p1.X - p1.W * 0.04, p1.Y, p1.X + p1.W * 0.04, p1.Y, p2.X + p2.W * 0.04, p2.Y, p2.X - p2.W * 0.04, p2.Y, "#d8d8e0"); }
            if (si === 0) { x.fillStyle = "#fff"; for (let k = -5; k <= 5; k++) { if ((k + t) % 2 === 0) x.fillRect(p2.X + k * p2.W / 5, p2.Y - 2, p2.W / 5, Math.max(2, p1.Y - p2.Y + 4)); } }
            // CPU karts on this segment
            cpus.forEach((cp) => { if (Math.floor(cp.pos / SEG) % N === si && cp.pos > pos - SEG) { const kx = p1.X + cp.x * p1.W, ky = p1.Y, sz = Math.max(6, p1.s * 1600); x.fillStyle = "hsl(" + cp.hue + " 80% 55%)"; x.fillRect(kx - sz / 2, ky - sz, sz, sz * 0.7); x.fillStyle = "#222"; x.fillRect(kx - sz / 2, ky - sz * 0.35, sz, sz * 0.35); x.font = (sz | 0) + "px serif"; x.textAlign = "center"; x.fillText("🏎️", kx, ky - sz * 0.5); } });
            maxy = p2.Y;
          }
          // player kart (Maxwell)
          const tilt = (keys.left ? -0.12 : 0) + (keys.right ? 0.12 : 0);
          x.save(); x.translate(W / 2 + playerX * 10, H - 54); x.rotate(tilt);
          x.fillStyle = "#222"; x.fillRect(-30, 6, 60, 14);
          drawMax(x, 0, -8, 26);
          x.fillStyle = "#333"; x.fillRect(-32, 14, 14, 14); x.fillRect(18, 14, 14, 14);
          x.restore();
          // HUD
          x.fillStyle = "rgba(0,0,0,.45)"; x.fillRect(0, 0, W, 26);
          x.fillStyle = "#fff"; x.font = "bold 16px system-ui"; x.textAlign = "left"; x.fillText("LAP " + Math.min(lap, LAPS) + "/" + LAPS, 10, 19);
          const ahead = cpus.filter((cp) => cp.pos > pos).length; x.textAlign = "center"; x.fillText("POS " + (ahead + 1) + "/" + (cpus.length + 1), W / 2, 19);
          x.textAlign = "right"; x.fillText((speed / MAX * 180 | 0) + " mph", W - 10, 19);
          if (!started) { x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(0, H / 2 - 30, W, 60); x.fillStyle = "#ffd34a"; x.font = "900 34px system-ui"; x.textAlign = "center"; x.fillText(t < 40 ? "3" : t < 80 ? "2" : t < 120 ? "1" : "GO!", W / 2, H / 2 + 12); if (t >= 120) started = true; }
          if (!over) raf = requestAnimationFrame(loop);
        }
        function finish() { over = true; cancelAnimationFrame(raf); const ahead = cpus.filter((cp) => cp.pos > pos).length; const place = ahead + 1; api.finish(place, { title: place === 1 ? "🥇 1st place! You WON!" : place <= 3 ? "🏁 " + place + (place === 2 ? "nd" : "rd") + " place!" : "🏁 " + place + "th place", line: "Finished " + place + " of " + (cpus.length + 1) + " racers", scoreForBest: (cpus.length + 2 - place) }); }
        const kd = (e) => { const k = e.key.toLowerCase(); if (k === "arrowup" || k === "w") keys.up = 1; else if (k === "arrowdown" || k === "s") keys.down = 1; else if (k === "arrowleft" || k === "a") keys.left = 1; else if (k === "arrowright" || k === "d") keys.right = 1; else return; e.preventDefault(); };
        const ku = (e) => { const k = e.key.toLowerCase(); if (k === "arrowup" || k === "w") keys.up = 0; else if (k === "arrowdown" || k === "s") keys.down = 0; else if (k === "arrowleft" || k === "a") keys.left = 0; else if (k === "arrowright" || k === "d") keys.right = 0; };
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        c.addEventListener("pointerdown", () => { keys.up = 1; }); c.addEventListener("pointerup", () => { keys.up = 0; });
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    },

    // ---------- Maxwell Platformer ----------
    {
      key: "platformer", name: "Maxwell Platformer", icon: "🏃", isNew: true, reward: (s) => s * 5,
      play(host, api) {
        const W = 480, H = 320; const c = canvas(host, W, H); const x = c.getContext("2d"); const cat = maxImg();
        hintLine(host, "<b>← →</b> move, <b>Space / ↑</b> jump. Grab 🪙, reach the flag 🚩!");
        const G = 0.5, JUMP = -10.5, SPD = 3.2, PWd = 22, PHt = 26, WORLD = 1080;
        const plats = [{ x: 0, y: 290, w: WORLD, h: 30 }, { x: 180, y: 240, w: 90, h: 14 }, { x: 320, y: 200, w: 90, h: 14 }, { x: 480, y: 240, w: 90, h: 14 }, { x: 640, y: 185, w: 110, h: 14 }, { x: 820, y: 240, w: 120, h: 14 }];
        let coins = [{ x: 210, y: 215 }, { x: 355, y: 175 }, { x: 515, y: 215 }, { x: 685, y: 160 }, { x: 870, y: 215 }];
        const goal = { x: 1020, y: 262 };
        let px = 40, py = 250, vx = 0, vy = 0, onGround = false, score = 0, over = false, raf, camX = 0; const keys = {};
        function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
        function loop() {
          if (!over) {
            vx = 0; if (keys["arrowleft"] || keys["a"]) vx = -SPD; if (keys["arrowright"] || keys["d"]) vx = SPD;
            px += vx; plats.forEach((p) => { if (hit({ x: px, y: py, w: PWd, h: PHt }, p)) { if (vx > 0) px = p.x - PWd; else if (vx < 0) px = p.x + p.w; } });
            px = Math.max(0, Math.min(WORLD - PWd, px));
            vy += G; py += vy; onGround = false;
            plats.forEach((p) => { if (hit({ x: px, y: py, w: PWd, h: PHt }, p)) { if (vy > 0) { py = p.y - PHt; vy = 0; onGround = true; } else if (vy < 0) { py = p.y + p.h; vy = 0; } } });
            coins = coins.filter((cn) => { if (Math.hypot((px + PWd / 2) - cn.x, (py + PHt / 2) - cn.y) < 22) { score++; api.tone(700, 0.05); return false; } return true; });
            if (Math.abs((px + PWd / 2) - goal.x) < 28 && Math.abs((py + PHt / 2) - goal.y) < 60) { over = true; cancelAnimationFrame(raf); return api.finish(score, { title: "🏁 Level Complete!", line: "Coins: <b>" + score + "</b> / 5", scoreForBest: score }); }
            camX = Math.max(0, Math.min(px - W / 2, WORLD - W));
          }
          x.fillStyle = "#6cc3ff"; x.fillRect(0, 0, W, H);
          x.save(); x.translate(-camX, 0);
          plats.forEach((p) => { x.fillStyle = p.y === 290 ? "#3a7d44" : "#8a6a3a"; x.fillRect(p.x, p.y, p.w, p.h); x.fillStyle = "#4e9d58"; if (p.y !== 290) x.fillRect(p.x, p.y, p.w, 4); });
          x.font = "20px system-ui,'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle"; coins.forEach((cn) => x.fillText("🪙", cn.x, cn.y));
          x.font = "28px system-ui,'Segoe UI Emoji'"; x.fillText("🚩", goal.x, goal.y - 20);
          drawMax(x, px + PWd / 2, py + PHt / 2, 15);
          x.restore();
          x.fillStyle = "#fff"; x.font = "bold 18px system-ui"; x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillText("🪙 " + score + " / 5", 10, 24);
          if (!over) raf = requestAnimationFrame(loop);
        }
        const kd = (e) => { const k = e.key.toLowerCase(); if (["arrowleft", "arrowright", "a", "d", "arrowup", "w", " "].includes(k)) { keys[k] = true; if ((k === "arrowup" || k === "w" || k === " ") && onGround) { vy = JUMP; api.tone(500, 0.06); } e.preventDefault(); } };
        const ku = (e) => keys[e.key.toLowerCase()] = false;
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    },

    // ---------- Maxwell Pinball ----------
    {
      key: "pinball", name: "Maxwell Pinball", icon: "🪩", isNew: true, reward: (s) => Math.floor(s / 50),
      play(host, api) {
        const W = 360, H = 460; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Keep Maxwell alive with your <b>paddle</b> (mouse / <b>← →</b>). Bump the bumpers! 3 balls.");
        let px = W / 2, bx = W / 2, by = 80, vx = 2, vy = 0, score = 0, balls = 3, over = false, raf; const keys = {}; const PW = 84;
        const bumpers = [{ x: 90, y: 150, r: 24, c: "#ff5fa2" }, { x: 270, y: 150, r: 24, c: "#3ee08f" }, { x: 180, y: 108, r: 26, c: "#ffd34a" }, { x: 115, y: 250, r: 20, c: "#6c5ce7" }, { x: 245, y: 250, r: 20, c: "#4ea8ff" }];
        function reset() { bx = W / 2; by = 80; vx = (Math.random() * 2 - 1) * 2; vy = 1.2; }
        function loop() {
          x.fillStyle = "#0c1024"; x.fillRect(0, 0, W, H);
          if (!over) {
            if (keys["arrowleft"]) px -= 8; if (keys["arrowright"]) px += 8; px = Math.max(PW / 2, Math.min(W - PW / 2, px));
            vy += 0.14; bx += vx; by += vy;
            if (bx < 10) { bx = 10; vx = Math.abs(vx); } if (bx > W - 10) { bx = W - 10; vx = -Math.abs(vx); }
            if (by < 10) { by = 10; vy = Math.abs(vy); }
            bumpers.forEach((bp) => { const dx = bx - bp.x, dy = by - bp.y, d = Math.hypot(dx, dy) || 1; if (d < bp.r + 8) { const nx = dx / d, ny = dy / d; bx = bp.x + nx * (bp.r + 8); by = bp.y + ny * (bp.r + 8); const dot = vx * nx + vy * ny; vx = (vx - 2 * dot * nx) + nx * 1.5; vy = (vy - 2 * dot * ny) + ny * 1.5; score += 100; bp.hit = 6; api.tone(560, 0.04); } if (bp.hit) bp.hit--; });
            if (by > H - 28 && by < H - 8 && bx > px - PW / 2 && bx < px + PW / 2 && vy > 0) { vy = -Math.abs(vy) * 1.03 - 1; vx += (bx - px) * 0.08; api.tone(400, 0.05); }
            if (by > H + 10) { balls--; if (balls <= 0) { over = true; cancelAnimationFrame(raf); return api.finish(score, { title: score >= 2000 ? "Pinball Wizard! 🪩" : "Game Over", line: "Score: <b>" + score + "</b>" }); } reset(); }
          }
          bumpers.forEach((bp) => { x.fillStyle = bp.c; x.shadowColor = bp.c; x.shadowBlur = bp.hit ? 22 : 10; x.beginPath(); x.arc(bp.x, bp.y, bp.r, 0, 7); x.fill(); x.shadowBlur = 0; });
          x.fillStyle = "#e0e6ff"; x.fillRect(px - PW / 2, H - 16, PW, 11);
          drawMax(x, bx, by, 9);
          x.fillStyle = "#fff"; x.font = "bold 18px system-ui"; x.textAlign = "left"; x.fillText("Score " + score, 10, 24); x.textAlign = "right"; x.fillText("🔴".repeat(balls), W - 10, 24);
          if (!over) raf = requestAnimationFrame(loop);
        }
        const kd = (e) => { const k = e.key.toLowerCase(); if (["arrowleft", "arrowright"].includes(k)) { keys[k] = true; e.preventDefault(); } }; const ku = (e) => keys[e.key.toLowerCase()] = false;
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        const mv = (e) => { const r = c.getBoundingClientRect(); px = (e.clientX - r.left) * (W / r.width); }; c.addEventListener("pointermove", mv);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        reset(); loop();
      }
    },

    // ---------- Maxwell Beat (rhythm) ----------
    {
      key: "rhythm", name: "Maxwell Beat", icon: "🎵", isNew: true, reward: (s) => Math.floor(s / 30),
      play(host, api) {
        const LANES = 4, W = 320, H = 440, LW = W / LANES; const c = canvas(host, W, H); const x = c.getContext("2d");
        hintLine(host, "Hit the notes on the line! Keys <b>D F J K</b> (or tap the lanes).");
        const KEYS = ["d", "f", "j", "k"], HITY = H - 54, COL = ["#ff5fa2", "#3ee08f", "#ffd34a", "#4ea8ff"];
        let notes = [], score = 0, combo = 0, best = 0, over = false, raf, t = 0, idx = 0; const flash = [0, 0, 0, 0];
        const pat = [0, 1, 2, 3, 0, 2, 1, 3, 0, 0, 1, 1, 2, 2, 3, 3, 0, 2, 1, 3, 3, 2, 1, 0, 1, 2, 0, 3]; const chart = pat.map((l, i) => ({ lane: l, at: 50 + i * 24 }));
        function loop() {
          t++; x.fillStyle = "#0a0e1c"; x.fillRect(0, 0, W, H);
          for (let i = 0; i < LANES; i++) { x.fillStyle = flash[i] > 0 ? "rgba(108,92,231," + flash[i] / 12 + ")" : "rgba(255,255,255,0.03)"; x.fillRect(i * LW, 0, LW - 2, H); if (flash[i] > 0) flash[i]--; }
          x.strokeStyle = "#6c5ce7"; x.lineWidth = 3; x.beginPath(); x.moveTo(0, HITY); x.lineTo(W, HITY); x.stroke();
          while (idx < chart.length && chart[idx].at <= t) { notes.push({ lane: chart[idx].lane, y: -20 }); idx++; }
          notes.forEach((n) => n.y += 4.6);
          notes = notes.filter((n) => { if (n.y > HITY + 42) { combo = 0; return false; } return true; });
          notes.forEach((n) => { x.fillStyle = COL[n.lane]; if (x.roundRect) { x.beginPath(); x.roundRect(n.lane * LW + 8, n.y - 10, LW - 18, 20, 6); x.fill(); } else x.fillRect(n.lane * LW + 8, n.y - 10, LW - 18, 20); });
          x.fillStyle = "#fff"; x.font = "bold 18px system-ui"; x.textAlign = "center"; for (let i = 0; i < LANES; i++) x.fillText(KEYS[i].toUpperCase(), i * LW + LW / 2, HITY + 32);
          x.textAlign = "left"; x.fillText("Score " + score, 8, 24); x.textAlign = "right"; x.fillText("Combo " + combo, W - 8, 24);
          if (idx >= chart.length && notes.length === 0 && !over) { over = true; cancelAnimationFrame(raf); return api.finish(score, { title: "Song complete! 🎶", line: "Score <b>" + score + "</b> · Best combo <b>" + best + "</b>" }); }
          if (!over) raf = requestAnimationFrame(loop);
        }
        function hit(lane) { if (over) return; flash[lane] = 12; let bestN = null, bd = 999; notes.forEach((n) => { if (n.lane === lane) { const d = Math.abs(n.y - HITY); if (d < bd) { bd = d; bestN = n; } } }); if (bestN && bd < 42) { notes = notes.filter((n) => n !== bestN); combo++; best = Math.max(best, combo); score += (bd < 16 ? 100 : 50) * (1 + Math.floor(combo / 10)); api.tone(500 + lane * 80, 0.05); } else { combo = 0; api.tone(160, 0.08, "sawtooth"); } }
        const kd = (e) => { const l = KEYS.indexOf(e.key.toLowerCase()); if (l >= 0) { e.preventDefault(); hit(l); } };
        document.addEventListener("keydown", kd);
        const pd = (e) => { const r = c.getBoundingClientRect(); const lx = (e.clientX - r.left) * (W / r.width); hit(Math.max(0, Math.min(LANES - 1, Math.floor(lx / LW)))); }; c.addEventListener("pointerdown", pd);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); });
        loop();
      }
    },

    // ---------- SPECIAL: Daily Spin Wheel ----------
    {
      key: "wheel", name: "Lucky Wheel", icon: "🎡", special: true, tag: "Daily spin!",
      play(host, api) {
        const PRIZES = [5, 10, 20, 50, 100, 15, 30, 8, 250, 12];
        const COLORS = ["#ff5a6e","#ff9a3c","#ffd84a","#3ee08f","#4fb3ff","#b77bff","#ff7ad1","#19d39b","#f5b82e","#ff6bd6"];
        const wrap = document.createElement("div"); wrap.className = "wheel-wrap"; host.appendChild(wrap);
        const size = 260, R = size / 2, seg = PRIZES.length, ang = (Math.PI * 2) / seg;
        const c = canvas(wrap, size, size, "wheel-canvas"); const x = c.getContext("2d");
        const ptr = document.createElement("div"); ptr.className = "wheel-ptr"; ptr.textContent = "▼"; wrap.appendChild(ptr);
        let rot = 0;
        function drawWheel() {
          x.clearRect(0, 0, size, size); x.save(); x.translate(R, R); x.rotate(rot);
          for (let i = 0; i < seg; i++) {
            x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R - 4, i * ang, (i + 1) * ang); x.closePath();
            x.fillStyle = COLORS[i]; x.fill();
            x.save(); x.rotate(i * ang + ang / 2); x.textAlign = "right"; x.fillStyle = "#1a1030"; x.font = "bold 18px system-ui"; x.fillText(PRIZES[i] + "🐟", R - 16, 6); x.restore();
          }
          x.restore();
        }
        drawWheel();
        const free = window.MG.canSpinToday();
        const btn = document.createElement("button"); btn.className = "btn asc-btn wheel-spin";
        const note = document.createElement("p"); note.className = "ar-hint";
        note.innerHTML = free ? "Your <b>free daily spin</b> is ready! 🎉" : "Free spin used. Spin again for <b>15 🐟</b>.";
        btn.textContent = free ? "🎡 FREE SPIN" : "🎡 Spin (15 🐟)";
        host.appendChild(btn); host.appendChild(note);
        let spinning = false;
        btn.onclick = () => {
          if (spinning) return;
          const isFree = window.MG.canSpinToday();
          if (!isFree) { if (!window.MG.spend(15)) { note.innerHTML = "Not enough treats — you need 15 🐟."; return; } api.refreshTreats(); }
          spinning = true; btn.disabled = true;
          const idx = Math.floor(Math.random() * seg);
          const target = (Math.PI * 2 * 5) + (Math.PI * 1.5 - (idx * ang + ang / 2));
          const start = rot, dur = 3400, t0 = performance.now();
          (function anim(t) {
            const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3);
            rot = start + (target - start) * e; drawWheel();
            if (p < 1) requestAnimationFrame(anim);
            else {
              const prize = PRIZES[idx]; window.MG.addTreats(prize); window.MG.didSpin(); api.refreshTreats();
              api.boom(); window.MG.meow();
              note.innerHTML = "🎉 You won <b>" + prize + " 🐟</b>!" + (prize >= 250 ? " JACKPOT!" : "");
              spinning = false; btn.disabled = false;
              btn.textContent = "🎡 Spin again (15 🐟)";
              window.MG.toast("🎡", "Lucky Wheel: +" + prize + " 🐟", prize >= 100 ? "Huge win!" : "Nice spin!");
            }
          })(t0);
        };
      }
    },

    // ---------- SPECIAL: Slot Machine ----------
    {
      key: "slots", name: "Maxwell Slots", icon: "🎰", special: true, tag: "Bet 10 🐟",
      play(host, api) {
        const SYM = ["🐟", "😺", "🐾", "⭐", "👑", "💎"];
        const PAY = { "🐟": 20, "😺": 30, "🐾": 40, "⭐": 60, "👑": 120, "💎": 200 };
        hintLine(host, "Bet <b>10 🐟</b>. Match <b>3</b> to win big — 3× 💎 is the jackpot!");
        const reels = document.createElement("div"); reels.className = "slot-reels"; host.appendChild(reels);
        const cells = [];
        for (let i = 0; i < 3; i++) { const d = document.createElement("div"); d.className = "slot-reel"; d.textContent = "🐟"; reels.appendChild(d); cells.push(d); }
        const note = document.createElement("p"); note.className = "ar-hint slot-note"; note.innerHTML = "Pull the lever!"; host.appendChild(note);
        const btn = document.createElement("button"); btn.className = "btn asc-btn"; btn.textContent = "🎰 Spin (10 🐟)"; host.appendChild(btn);
        let busy = false;
        btn.onclick = () => {
          if (busy) return;
          if (!window.MG.spend(10)) { note.innerHTML = "Not enough treats — you need 10 🐟."; return; }
          api.refreshTreats(); window.MG.slotPlayed(); busy = true; btn.disabled = true; note.innerHTML = "Spinning…";
          const finalSym = cells.map(() => SYM[Math.floor(Math.random() * SYM.length)]);
          // bias: small chance to force a triple for excitement
          if (Math.random() < 0.12) { const s = SYM[Math.floor(Math.random() * SYM.length)]; finalSym[0] = finalSym[1] = finalSym[2] = s; }
          cells.forEach((cell, i) => {
            let n = 0; const spins = 14 + i * 6;
            const iv = setInterval(() => { cell.textContent = SYM[Math.floor(Math.random() * SYM.length)]; api.tone(300 + n * 10, 0.02, "square", 0.03); n++; if (n >= spins) { clearInterval(iv); cell.textContent = finalSym[i]; if (i === 2) setTimeout(result, 150); } }, 60);
          });
          function result() {
            busy = false; btn.disabled = false; btn.textContent = "🎰 Spin again (10 🐟)";
            const [a, b, cc] = finalSym;
            if (a === b && b === cc) {
              const win = PAY[a]; window.MG.addTreats(win); api.refreshTreats(); api.boom(); window.MG.meow();
              if (a === "💎") { window.MG.flag("jackpot"); note.innerHTML = "💎💎💎 <b>JACKPOT! +" + win + " 🐟</b> 💎💎💎"; window.MG.toast("🎰", "JACKPOT! +" + win + " 🐟", "Three diamonds!!"); }
              else { note.innerHTML = "🎉 Three " + a + "! <b>+" + win + " 🐟</b>"; window.MG.toast("🎰", "Slots win: +" + win + " 🐟", "Three of a kind!"); }
            } else if (a === b || b === cc || a === cc) {
              window.MG.addTreats(5); api.refreshTreats(); note.innerHTML = "Two matched — small win <b>+5 🐟</b>.";
            } else { note.innerHTML = "No match this time. Try again!"; }
          }
        };
      }
    },

    // ---------- SPECIAL: Satisfying Balls (AI chatbot → auto-fullscreen crash sim) ----------
    {
      key: "sball", name: "Satisfying Balls", icon: "🔮", special: true, tag: "AI chat!",
      play(host, api) {
        const SW = 480, SH = 854; // 9:16 recorded-short resolution (high quality)
        const esc = (s) => (s || "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

        // ===== chat UI =====
        const chat = document.createElement("div"); chat.className = "sball-chat"; host.appendChild(chat);
        chat.innerHTML = `
          <div class="sball-chat-head"><span class="sball-ai-dot"></span><b>🔮 Satisfying AI</b><button class="sball-gear" id="sbPic" title="Use your own picture as the balls">🖼️</button><button class="sball-gear" id="sbGear" title="Use a real AI (your own key)">⚙️</button><small>makes YouTube Shorts</small></div>
          <div class="sball-msgs" id="sbMsgs"></div>
          <div class="sball-suggest" id="sbSuggest"></div>
          <form class="sball-inputbar" id="sbForm"><input class="sball-input" id="sbInput" placeholder="Describe your satisfying short…" autocomplete="off"><button class="btn sball-send" type="submit">Send</button></form>`;
        const msgs = chat.querySelector("#sbMsgs");
        function bubble(html, who) { const d = document.createElement("div"); d.className = "sball-msg " + who; d.innerHTML = html; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; }
        bubble("Hey! I'm the <b>Satisfying AI</b> 🐾 Tell me what to make and I'll build a fullscreen satisfying short you can record.<br><br>Describe the <b>balls</b> and the <b>background</b> — like <i>\"a ball that grows every bounce with matrix background\"</i>.", "ai");
        const SUGG = [
          "square balls on fire with screen shake, lava background",
          "100 star shaped balls, reverse gravity, rainbow",
          "a ball that paints the screen with its rainbow trail",
          "balls that eat each other, magnet pulls to the center",
          "heart balls that pulse with sparkles, synthwave background",
          "a circle with 3 holes, super bouncy, confetti everywhere",
          "gravity flips and the ball teleports through the walls",
          "make something super crazy and insane!"
        ];
        const sug = chat.querySelector("#sbSuggest");
        SUGG.forEach((s) => { const b = document.createElement("button"); b.className = "sball-chip"; b.type = "button"; b.textContent = s; b.onclick = () => { input.value = s; submit(); }; sug.appendChild(b); });
        const input = chat.querySelector("#sbInput");
        chat.querySelector("#sbForm").onsubmit = (e) => { e.preventDefault(); submit(); };
        const gear = chat.querySelector("#sbGear");
        if (gear) gear.onclick = () => {
          const cur = (function () { try { return localStorage.getItem("mg-sball-key") || ""; } catch (e) { return ""; } })();
          const msgs = chat.querySelector("#sbMsgs");
          const b = document.createElement("div"); b.className = "sball-msg ai"; b.innerHTML =
            '<b>🤖 Real AI mode (optional)</b><br>Paste your <b>free Google Gemini API key</b> to have a real AI design your shorts. ' +
            '<b>It is saved only on THIS device</b> and never uploaded or shared. Leave blank &amp; Save to turn AI off and use the built-in engine.' +
            '<br>Get a free key at <b>aistudio.google.com/apikey</b>.' +
            '<div style="display:flex;gap:6px;margin-top:8px"><input class="sball-input" id="sbKey" placeholder="paste key (or leave blank)" value="' + cur.replace(/"/g, "&quot;") + '"><button class="btn sball-send" id="sbKeySave">Save</button></div>' +
            '<div style="font-size:.75rem;margin-top:4px;color:#8b8fa3">Status: <b id="sbKeyStat">' + (cur ? "AI ON ✅" : "using built-in engine") + '</b></div>';
          msgs.appendChild(b); msgs.scrollTop = msgs.scrollHeight;
          b.querySelector("#sbKeySave").onclick = () => { const v = b.querySelector("#sbKey").value.trim(); try { if (v) localStorage.setItem("mg-sball-key", v); else localStorage.removeItem("mg-sball-key"); } catch (e) {} b.querySelector("#sbKeyStat").textContent = v ? "AI ON ✅ (saved on this device)" : "using built-in engine"; };
        };

        // ===== fullscreen experience =====
        const fs = document.createElement("div"); fs.className = "sball-fs"; document.body.appendChild(fs);
        fs.innerHTML = `
          <canvas class="sball-view"></canvas>
          <div class="sball-loader" id="sbLoader">
            <div class="sball-3d"><img src="${api.img}" alt="Maxwell"></div>
            <h2>Generating your short…</h2>
            <p class="sball-sub" id="sbLoadSub"></p>
            <div class="sball-prog"><span id="sbProg"></span></div>
          </div>
          <div class="sball-fs-bar">
            <button class="btn sball-rec" id="sbRec">● Record 15s</button>
            <button class="btn" id="sbNew">✏️ New</button>
            <button class="btn" id="sbExit">✕ Exit</button>
          </div>`;
        const view = fs.querySelector(".sball-view"); const vx = view.getContext("2d");
        const loader = fs.querySelector("#sbLoader");
        const scene = document.createElement("canvas"); scene.width = SW; scene.height = SH; const sx = scene.getContext("2d");
        const maxwellImg = new Image(); maxwellImg.src = api.img; let customImg = null;
        // picture-balls uploader (image stays on this device)
        const picIn = document.createElement("input"); picIn.type = "file"; picIn.accept = "image/*"; picIn.style.display = "none"; document.body.appendChild(picIn);
        const picBtn = chat.querySelector("#sbPic");
        if (picBtn) picBtn.onclick = () => picIn.click();
        picIn.onchange = () => { const f = picIn.files && picIn.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { customImg = im; window.__sballImg = true; const msgs = chat.querySelector("#sbMsgs"); const bb = document.createElement("div"); bb.className = "sball-msg ai"; bb.innerHTML = "🖼️ <b>Got your picture!</b> Your balls are now that image. Type anything and hit Send. (Say <i>\"maxwell balls\"</i> or add an emoji like 🍕 to switch; it stays only on this device.)"; msgs.appendChild(bb); msgs.scrollTop = msgs.scrollHeight; }; im.src = rd.result; }; rd.readAsDataURL(f); };
        const sbuf = document.createElement("canvas"); sbuf.width = SW; sbuf.height = SH; const bxf = sbuf.getContext("2d");

        // ===== audio =====
        let recDest = null;
        try { const a = actx(); if (a && a.createMediaStreamDestination) recDest = a.createMediaStreamDestination(); } catch (e) {}
        function psound(freq, vol) {
          const a = actx(); if (!a) return;
          const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
          o.type = "sine"; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.55), t + 0.16);
          g.gain.setValueAtTime(vol || 0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          o.connect(g); g.connect(a.destination); if (recDest) g.connect(recDest);
          o.start(t); o.stop(t + 0.22);
        }

        // ===== backgrounds (sized to the scene) =====
        function detectBg(p) {
          if (/(matrix|falling code|green code|hacker|the matrix|binary)/.test(p)) return "matrix";
          if (/(synthwave|neon|retro grid|vaporwave|outrun|80s|retrowave)/.test(p)) return "synthwave";
          if (/(sunset|sunrise|warm gradient|orange sky|dusk)/.test(p)) return "sunset";
          if (/(aurora|northern lights|polar)/.test(p)) return "aurora";
          if (/(fire|lava|flames?|volcano|magma|hell|inferno)/.test(p)) return "fire";
          if (/(ocean|underwater|sea|deep blue|water)/.test(p)) return "ocean";
          if (/(disco|party|club|rave)/.test(p)) return "disco";
          if (/(space|stars?|galaxy|cosmos|night sky|universe|nebula|cosmic)/.test(p)) return "space";
          return "dark";
        }
        const BG_NAMES = { matrix: "Matrix code", space: "Starfield", synthwave: "Synthwave grid", sunset: "Sunset", aurora: "Aurora", fire: "Lava", ocean: "Ocean", disco: "Disco", dark: "Deep space" };
        function makeBg(type) {
          let stars = [], cols = [], t = 0;
          if (type === "space" || type === "dark") for (let i = 0; i < 160; i++) stars.push({ x: Math.random() * SW, y: Math.random() * SH, z: 0.4 + Math.random() * 2.2 });
          if (type === "matrix") { const n = Math.ceil(SW / 18); for (let i = 0; i < n; i++) cols.push({ x: i * 18, y: Math.random() * SH, sp: 3 + Math.random() * 7 }); }
          return function (ctx) {
            t++;
            if (type === "matrix") {
              ctx.fillStyle = "#000"; ctx.fillRect(0, 0, SW, SH);
              ctx.font = "18px monospace"; ctx.textAlign = "left";
              for (const col of cols) { col.y += col.sp; if (col.y > SH + 50) col.y = -30;
                for (let k = 0; k < 18; k++) { const yy = col.y - k * 18; if (yy < 0 || yy > SH) continue; ctx.fillStyle = k === 0 ? "rgba(225,255,225,0.95)" : "rgba(0,255,90," + Math.max(0, 0.55 - k * 0.032) + ")"; ctx.fillText(String.fromCharCode(0x30A0 + ((Math.random() * 96) | 0)), col.x, yy); } }
            } else if (type === "space" || type === "dark") {
              const g = ctx.createRadialGradient(SW / 2, SH * 0.4, 50, SW / 2, SH / 2, SH); g.addColorStop(0, "#0b1030"); g.addColorStop(1, "#04050c"); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
              for (const s of stars) { s.y += s.z * 0.5; if (s.y > SH) { s.y = 0; s.x = Math.random() * SW; } ctx.globalAlpha = Math.min(1, s.z / 2.4 + 0.25); ctx.fillStyle = "#fff"; ctx.fillRect(s.x, s.y, s.z, s.z); } ctx.globalAlpha = 1;
            } else if (type === "synthwave") {
              const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, "#1a0b2e"); g.addColorStop(0.5, "#3b0d52"); g.addColorStop(1, "#0b0618"); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
              const sun = ctx.createLinearGradient(0, SH * 0.25, 0, SH * 0.55); sun.addColorStop(0, "#ffe14d"); sun.addColorStop(1, "#ff2e97"); ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(SW / 2, SH * 0.4, 95, 0, Math.PI * 2); ctx.fill();
              const hz = SH * 0.62; ctx.strokeStyle = "rgba(0,255,230,0.45)"; ctx.lineWidth = 2;
              for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(SW / 2, hz); ctx.lineTo(SW / 2 + i * 110, SH); ctx.stroke(); }
              for (let j = 0; j < 16; j++) { const yy = hz + ((t * 3 + j * 48) % (SH - hz)); ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(SW, yy); ctx.stroke(); }
            } else if (type === "sunset") {
              const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, "#ff9a3c"); g.addColorStop(0.5, "#ff5fa2"); g.addColorStop(1, "#4a2c8a"); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
              ctx.fillStyle = "rgba(255,240,180,0.9)"; ctx.beginPath(); ctx.arc(SW / 2, SH * 0.55, 70, 0, Math.PI * 2); ctx.fill();
            } else if (type === "aurora") {
              ctx.fillStyle = "#03101a"; ctx.fillRect(0, 0, SW, SH);
              for (let i = 0; i < 4; i++) { const hue = (t * 0.6 + i * 70) % 360; const g = ctx.createLinearGradient(0, 0, SW, 0); g.addColorStop(0, "hsla(" + hue + ",90%,60%,0)"); g.addColorStop(0.5, "hsla(" + hue + ",90%,60%,0.32)"); g.addColorStop(1, "hsla(" + ((hue + 70) % 360) + ",90%,60%,0)"); ctx.fillStyle = g; ctx.fillRect(0, SH * 0.1 + i * 90 + Math.sin(t * 0.02 + i) * 36, SW, 180); }
            } else if (type === "fire") {
              const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, "#1a0300"); g.addColorStop(0.55, "#a81d06"); g.addColorStop(1, "#ffab2e"); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
            } else if (type === "ocean") {
              const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, "#0a3a5c"); g.addColorStop(1, "#020f18"); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
              ctx.strokeStyle = "rgba(120,200,255,0.14)"; ctx.lineWidth = 2; for (let j = 0; j < 10; j++) { const yy = (t * 0.7 + j * 90) % SH; ctx.beginPath(); ctx.moveTo(0, yy); for (let xx = 0; xx <= SW; xx += 24) ctx.lineTo(xx, yy + Math.sin((xx + t) * 0.04) * 9); ctx.stroke(); }
            } else if (type === "disco") {
              const hue = (t * 3) % 360; ctx.fillStyle = "hsl(" + hue + " 70% 10%)"; ctx.fillRect(0, 0, SW, SH);
              for (let i = 0; i < 7; i++) { ctx.fillStyle = "hsla(" + ((hue + i * 52) % 360) + ",90%,55%,0.14)"; ctx.fillRect(((i * 90 + t * 2) % (SW + 90)) - 45, 0, 48, SH); }
            }
          };
        }

        // ===== parser (reads the prompt as a sequence of mechanics) =====
        const W2N = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
        const EMOJI_WORDS = { pizza: "🍕", soccer: "⚽", "soccer ball": "⚽", basketball: "🏀", baseball: "⚾", tennis: "🎾", football: "🏈", volleyball: "🏐", bomb: "💣", skull: "💀", poop: "💩", apple: "🍎", moon: "🌙", sun: "☀️", earth: "🌍", planet: "🪐", coin: "🪙", money: "💰", ghost: "👻", alien: "👽", robot: "🤖", smiley: "😀", clown: "🤡", pumpkin: "🎃", snowman: "⛄", eyeball: "👁️", donut: "🍩", burger: "🍔", watermelon: "🍉", frog: "🐸", doge: "🐶", puppy: "🐶", kitten: "🐱", poo: "💩", brain: "🧠", rock: "🪨", gem: "💎", fire: "🔥", rainbow: "🌈", lightning: "⚡", snowball: "❄️" };
        function parse(pRaw) {
          const p = (pRaw || "").toLowerCase().replace(/[’']/g, "");
          function numBefore(word) { const m = p.match(new RegExp("(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)\\s*" + word)); if (!m) return null; return /\d/.test(m[1]) ? parseInt(m[1], 10) : W2N[m[1]]; }
          const bounceCount = numBefore("(?:times?|bounces?|hits?)");
          let ballCount = numBefore("(?:[a-z]+\\s+){0,3}balls?");
          if (ballCount == null && /\bballs\b/.test(p)) { const m = p.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/); if (m) ballCount = /\d/.test(m[1]) ? parseInt(m[1], 10) : W2N[m[1]]; }
          let changeTo = null;
          if (/(stone|rock|statue|petrif|concrete|turns? to stone)/.test(p)) changeTo = "stone";
          else if (/(freezes?|frozen|turns? to ice|ice block)/.test(p)) changeTo = "freeze";
          else if (/(explodes?|explosion|blows? up|detonat)/.test(p)) changeTo = "explode";
          else if (/(pops?|bursts?|disappears?|vanish|evaporat)/.test(p)) changeTo = "pop";
          else if (/(splits? into|breaks? into|splits? apart|then splits?)/.test(p)) changeTo = "split";
          else if (/(change colou?r|turns? (red|blue|green|gold|pink|purple|white|black|orange))/.test(p)) changeTo = "color";
          const hole = /(hole|gap|opening|escape|get out|break out|way out)/.test(p);
          const sequence = /(another ball|then another|next ball|a new ball|new ball comes|repeat|does the same|do the same|one by one|again and again|keeps? (coming|happening|going)|over and over)/.test(p);
          let shape = "circle";
          if (/(square|cube)s?\b[^.]*\b(ball|shape|shaped|bounc)|ball[^.]*\b(square|cube)|square balls|cube balls/.test(p)) shape = "square";
          else if (/triangle|pyramid|triangular/.test(p)) shape = "triangle";
          else if (/\bstars?\b|star-?shaped/.test(p)) shape = "star";
          else if (/\bhearts?\b/.test(p)) shape = "heart";
          else if (/diamond|rhombus|gem-?shaped/.test(p)) shape = "diamond";
          const boxWords = (/(box|rectangle)/.test(p) || (/\bsquare\b/.test(p) && shape !== "square")) && !hole;
          const wallsClose = /(walls? clos|closing in|caves? in|shrink.*(box|wall)|squeeze|tighten|crush)/.test(p);
          let gdir = "down";
          if (/(no gravity|zero ?g|weightless|space physics|anti-?gravity|floats? around)/.test(p)) gdir = "none";
          else if (/(reverse|reversed|upside ?down|upward|up-?ward|anti).{0,12}gravity|gravity.{0,8}(up|reversed|flipped)|floats? up|falls? up|rises? up/.test(p)) gdir = "up";
          else if (/gravity.{0,8}left|pulled left|falls? left/.test(p)) gdir = "left";
          else if (/gravity.{0,8}right|pulled right|falls? right/.test(p)) gdir = "right";
          const gravFlip = /(flip|flips|flipping|switch|switching|reversing|changing).{0,14}gravity|gravity.{0,10}(flip|switch|change|revers)|gravity keeps/.test(p);
          const crazy = /(crazy|insane|madness|wild|epic|awesome|amazing|coolest|best ever|super cool|go nuts|everything|all the)/.test(p);
          const chaos = /(chaos|chaotic|pandemonium|mayhem|total chaos|maximum|most chaotic|craziest|absolute chaos)/.test(p);
          const maxwellBall = /(maxwell|the cat) ?balls?|balls? (of|that look like|shaped like|made of) ?(maxwell|cats?)|cat ?head balls?/.test(p);
          let ballEmoji = null;
          if (!maxwellBall) { const emM = p.match(/\p{Extended_Pictographic}/u); if (emM) ballEmoji = emM[0]; else { for (const k in EMOJI_WORDS) { if (new RegExp("\\b" + k + "\\b").test(p) && /balls?|rain|everywhere|falling|bounc/.test(p)) { ballEmoji = EMOJI_WORDS[k]; break; } } } }
          const collide = /(collide|collisions?|bounce off each other|hit each other|pool balls|billiard|crash into|smash into each other|knock into|hit one another)/.test(p);
          const timeScale = /(slow ?motion|slow-?mo|slowly|slowmo)/.test(p) ? 0.4 : (/(hyper ?speed|super fast|turbo|insanely fast|lightning fast|warp speed)/.test(p) ? 1.8 : 1);
          let emit = null;
          if (/(on fire|fire ?ball|flaming|burning|flames|lava ball)/.test(p)) emit = "fire";
          else if (/(confetti|celebration|party popper)/.test(p)) emit = "confetti";
          else if (/(sparkle|glitter|stardust|shiny|twinkl)/.test(p)) emit = "sparkle";
          const cfg = {
            container: hole ? "hole" : (boxWords || wallsClose ? "box" : "circle"),
            count: Math.max(1, Math.min(250, ballCount || (/(many|lots|bunch|hundred|loads|tons|swarm)/.test(p) ? 60 : 1))),
            gravity: gdir === "none" ? 0 : (/(low gravity|moon|slow fall|floaty)/.test(p) ? 0.12 : (/(heavy|strong gravity|more gravity|falls fast)/.test(p) ? 0.7 : 0.4)),
            grow: /(bigger|grows?|growing|larger|expand|increase|huge|size up)/.test(p) ? 1.07 : 0,
            shrink: /(smaller|shrinks?|shrinking|tinier|size down)/.test(p) ? 0.94 : 0,
            split: /(keeps? splitting|splits? every|splits? each|multiply|clones?|duplicate|more balls each)/.test(p),
            speedUp: /(speed ?up|faster|speeds up|accelerat|quicker|gets? faster)/.test(p) ? 1.03 : 0,
            rainbow: /(rainbow|changing colou?rs|every colou?r|disco colou?rs|cycles? colou?r|color chang)/.test(p),
            trail: !/(no trail|without (a )?trail|trail-?less|no tail)/.test(p),
            wallsClose: wallsClose, spin: /(spin|spinning|rotating|rotate|rotates)/.test(p),
            changeAfter: changeTo ? (bounceCount || 1) : 0, changeTo: changeTo, sequence: sequence, escape: hole, bg: detectBg(p),
            shape: shape, gdir: gdir, gravFlip: gravFlip,
            attract: /(magnet|black ?hole|attracts?|pull.*(center|middle)|suck|vortex|gravity well)/.test(p),
            wind: /(wind|windy|blowing|breeze|gust|storm)/.test(p) ? (Math.random() < 0.5 ? -0.12 : 0.12) : 0,
            paint: /(paint|painting|splatter|leaves? colou?r|color trail|graffiti|draws?|coats?|stains?)/.test(p),
            emit: emit,
            shake: /(shake|shakes|earthquake|screen ?shake|rumble|camera shake)/.test(p),
            pulse: /(puls|heartbeat|throb|breathing|beats?|pumping)/.test(p),
            wrap: /(wrap|portal|teleport.{0,12}(wall|edge|side)|pac-?man|through the wall|through walls|other side)/.test(p),
            absorb: /(absorb|eats? (each|other|smaller|the)|eat each other|merges?|combine|consume|biggest wins)/.test(p),
            holes: hole ? (numBefore("holes?") || (/(multiple|many|several|lots of) (holes|gaps)/.test(p) ? 3 : 1)) : 0,
            containerGrow: /(growing|expanding|bigger) (circle|ring|box|container)/.test(p) ? 1 : (/(shrinking|smaller) (circle|ring|container)/.test(p) ? -1 : 0),
            rest: /(super ?bouncy|very bouncy|mega bounce|hyper bounce|bouncier|trampoline)/.test(p) ? 1.04 : (/(no bounce|not bouncy|dead bounce|sticky|loses? energy|low bounce)/.test(p) ? 0.985 : 1.012),
            ballEmoji: ballEmoji, maxwellBall: maxwellBall, collide: collide, timeScale: timeScale
          };
          if (cfg.escape) cfg.sequence = true;
          if (cfg.container === "hole") cfg.spin = !/no spin|not spinning/.test(p);
          if (cfg.bg === "dark" && !/(dark|black|night|void|plain|space)/.test(p)) cfg.bg = "space";
          const anyFx = cfg.grow || cfg.shrink || cfg.split || cfg.speedUp || cfg.rainbow || cfg.changeTo || cfg.attract || cfg.paint || cfg.emit || cfg.gravFlip || cfg.wrap || cfg.absorb || cfg.wind || cfg.pulse || cfg.shape !== "circle" || cfg.collide;
          if (crazy && !anyFx) { cfg.rainbow = true; cfg.grow = 1.05; cfg.emit = "sparkle"; cfg.pulse = true; cfg.trail = true; if (cfg.count < 4) cfg.count = 5; }
          if (chaos) { cfg.count = Math.max(cfg.count, 45); cfg.collide = true; cfg.rainbow = true; cfg.emit = cfg.emit || "sparkle"; cfg.shake = true; cfg.pulse = true; cfg.gravFlip = cfg.gravFlip || Math.random() < 0.5; cfg.rest = Math.max(cfg.rest, 1.02); if (!anyFx && !cfg.grow) cfg.grow = 1.02; }
          if (cfg.holes > 1) cfg.escape = false;
          if (cfg.count > 120) cfg.collide = false; // too many for pairwise collisions
          return cfg;
        }
        const CHANGE_TXT = { stone: "turns to stone", freeze: "freezes", explode: "explodes", pop: "pops", split: "splits apart", color: "changes color" };
        function summarize(cfg) {
          const b = [];
          if (cfg.shape !== "circle") b.push(cfg.shape + " balls"); else if (cfg.count > 1 && !cfg.sequence) b.push(cfg.count + " balls");
          b.push(cfg.container === "hole" ? (cfg.holes > 1 ? "circle with " + cfg.holes + " holes" : "escape a circle with a hole") : cfg.container === "box" ? "in a box" : "in a circle");
          if (cfg.changeAfter && cfg.changeTo) b.push("after " + cfg.changeAfter + " bounce" + (cfg.changeAfter > 1 ? "s" : "") + " → " + CHANGE_TXT[cfg.changeTo]);
          if (cfg.sequence && !cfg.escape) b.push("new ball repeats");
          if (cfg.escape && cfg.holes <= 1) b.push("escapes the hole");
          if (cfg.gdir === "up") b.push("reverse gravity"); else if (cfg.gdir === "none") b.push("no gravity"); else if (cfg.gdir === "left" || cfg.gdir === "right") b.push("gravity " + cfg.gdir);
          if (cfg.gravFlip) b.push("gravity flips"); if (cfg.attract) b.push("magnet pull"); if (cfg.wind) b.push("wind");
          if (cfg.grow) b.push("grows"); if (cfg.shrink) b.push("shrinks"); if (cfg.speedUp) b.push("speeds up"); if (cfg.split) b.push("keeps splitting");
          if (cfg.absorb) b.push("balls eat each other"); if (cfg.wrap) b.push("portal walls");
          if (cfg.rainbow) b.push("rainbow"); if (cfg.paint) b.push("paints trails"); if (cfg.emit) b.push(cfg.emit === "fire" ? "on fire" : cfg.emit);
          if (cfg.pulse) b.push("pulsing"); if (cfg.shake) b.push("screen shake");
          if (cfg.collide) b.push("balls collide"); if (cfg.timeScale < 1) b.push("slow motion"); else if (cfg.timeScale > 1) b.push("hyperspeed");
          if (cfg.ballEmoji) b.push(cfg.ballEmoji + " balls"); else if (cfg.maxwellBall) b.push("🐈 Maxwell balls"); else if (window.__sballImg) b.push("🖼️ your picture");
          if (cfg.wallsClose) b.push("walls close in"); if (cfg.containerGrow > 0) b.push("growing"); if (cfg.containerGrow < 0) b.push("shrinking");
          b.push(cfg.trail ? "trail" : "no trail"); if (cfg.spin && cfg.container !== "hole") b.push("spinning");
          b.push("🎨 " + (BG_NAMES[cfg.bg] || "Starfield"));
          return b.join(" · ");
        }

        // ===== physics =====
        let balls = [], cfg = null, bgDraw = null, bgView = null, wall = 0, spinAng = 0, gapCenter = 0, totalBounces = 0, stoneCount = 0, running = false, raf = null, flash = null;
        let GX = 0, GY = 0.4, gravSign = 1, rcScale = 1, shakeMag = 0, frameT = 0, parts = [], paintCv = null, pctx = null;
        const RC = () => SW * 0.44;
        const cx = SW / 2, cy = SH * 0.46;
        const GAP_HALF = 0.52; // half-width of the hole, radians
        const MINSPD = 5.5, MAXSPD = 24, REST = 1.012;
        function newBall(x0, y0, r0, hue, vx0, vy0) {
          const ang = Math.random() * Math.PI * 2;
          return { x: x0, y: y0, vx: vx0 != null ? vx0 : Math.cos(ang) * 7, vy: vy0 != null ? vy0 : Math.sin(ang) * 7 - 2, r: r0, hue: hue != null ? hue : Math.floor(Math.random() * 360), bounces: 0, state: "live" };
        }
        function startR() { return cfg.container === "box" ? (cfg.count > 15 ? 8 : 16) : (cfg.count > 15 ? 10 : 20); }
        function freshBall() {
          const r0 = startR();
          if (cfg.container === "box") return newBall(40 + Math.random() * (SW - 80), 90, r0);
          return newBall(cx + (Math.random() - 0.5) * RC() * 0.3, cy - RC() * 0.3, r0); // falls into the circle
        }
        function buildBalls() {
          bgDraw = makeBg(cfg.bg); bgView = makeBg(cfg.bg); wall = 0; spinAng = 0; gapCenter = Math.random() * Math.PI * 2; totalBounces = 0; stoneCount = 0; flash = null; rings = []; parts = []; bxf.clearRect(0, 0, SW, SH); balls = [];
          const gmag = cfg.gravity; GX = 0; GY = 0;
          if (cfg.gdir === "down") GY = gmag; else if (cfg.gdir === "up") GY = -gmag; else if (cfg.gdir === "left") GX = -gmag; else if (cfg.gdir === "right") GX = gmag;
          gravSign = 1; rcScale = 1; shakeMag = 0; frameT = 0;
          if (!paintCv) { paintCv = document.createElement("canvas"); paintCv.width = SW; paintCv.height = SH; pctx = paintCv.getContext("2d"); }
          pctx.clearRect(0, 0, SW, SH);
          const n = cfg.sequence ? 1 : cfg.count;
          for (let i = 0; i < n; i++) balls.push(freshBall());
        }
        function curRC() { return RC() * rcScale; }
        function gapCenters() { const n = Math.max(1, cfg.holes || 1), arr = []; for (let k = 0; k < n; k++) arr.push(gapCenter + k * (Math.PI * 2 / n)); return arr; }
        function emitAt(x, y, hue, kind) {
          if (parts.length > 400) return;
          if (kind === "fire") parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * 1.5, vy: -1 - Math.random() * 1.5, life: 22, max: 22, hue: 20 + Math.random() * 30, kind: "fire" });
          else if (kind === "sparkle") parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 28, max: 28, hue: hue, kind: "sparkle" });
          else parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 6, life: 44, max: 44, hue: Math.random() * 360, kind: "confetti" });
        }
        function emitBurst(x, y, hue, n, kind) { for (let i = 0; i < n; i++) emitAt(x, y, hue, kind); }
        function shapePath(c, x, y, r, type, rot) {
          c.beginPath();
          if (type === "square") { const s = r * 0.88; c.rect(x - s, y - s, s * 2, s * 2); return; }
          const r0 = rot || 0;
          if (type === "triangle") { for (let i = 0; i < 3; i++) { const a = r0 - Math.PI / 2 + i * 2 * Math.PI / 3, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); return; }
          if (type === "diamond") { c.moveTo(x, y - r); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.8, y); c.closePath(); return; }
          if (type === "star") { for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = r0 - Math.PI / 2 + i * Math.PI / 5, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); return; }
          if (type === "heart") { const s = r / 16; c.moveTo(x, y + s * 5); c.bezierCurveTo(x + s * 16, y - s * 7, x + s * 6, y - s * 17, x, y - s * 5); c.bezierCurveTo(x - s * 6, y - s * 17, x - s * 16, y - s * 7, x, y + s * 5); return; }
          c.arc(x, y, r, 0, Math.PI * 2);
        }
        function enforce(b) {
          let s = Math.hypot(b.vx, b.vy);
          if (s < 0.001) { b.vx = (Math.random() - 0.5) * 2; b.vy = -2; s = Math.hypot(b.vx, b.vy); }
          if (s < MINSPD) { const k = MINSPD / s; b.vx *= k; b.vy *= k; }
          else if (s > MAXSPD) { const k = MAXSPD / s; b.vx *= k; b.vy *= k; }
        }
        function setFlash(txt) { flash = { txt, ttl: 95 }; }
        let rings = [];
        function ring(x, y, hue) { rings.push({ x, y, r: 10, hue, a: 1 }); }
        function applyChange(b) {
          const ct = cfg.changeTo;
          if (ct === "stone" || ct === "freeze") { b.state = "stone"; b.vx = 0; b.vy = 0; b.frozen = (ct === "freeze"); stoneCount++; ring(b.x, b.y, b.hue); psound(170, 0.3); setFlash(ct === "freeze" ? "FROZEN! ❄️" : "TURNED TO STONE! 🪨"); }
          else if (ct === "pop") { b.state = "gone"; ring(b.x, b.y, b.hue); psound(320, 0.2); setFlash("POP! 💥"); }
          else if (ct === "explode") { b.state = "gone"; for (let i = 0; i < 3; i++) ring(b.x, b.y, (b.hue + i * 40) % 360); psound(110, 0.4); boomLike(); setFlash("BOOM! 💥"); }
          else if (ct === "split") { b.state = "gone"; for (let i = 0; i < 2; i++) balls.push(newBall(b.x, b.y, Math.max(6, b.r * 0.78), (b.hue + 120 * i) % 360)); setFlash("SPLIT!"); }
          else if (ct === "color") { b.hue = Math.floor(Math.random() * 360); b.bounces = 0; setFlash("COLOR CHANGE!"); }
        }
        function boomLike() { try { window.MG.boomSound(0.12); } catch (e) {} }
        function bounce(b) {
          b.bounces++; totalBounces++;
          b.vx *= cfg.rest; b.vy *= cfg.rest;
          if (cfg.speedUp) { b.vx *= cfg.speedUp; b.vy *= cfg.speedUp; }
          enforce(b);
          psound(Math.max(140, Math.min(900, 900 - b.r * 7)));
          if (cfg.shake) shakeMag = 9;
          if (cfg.emit === "confetti") emitBurst(b.x, b.y, b.hue, 8, "confetti");
          const maxR = (cfg.container !== "box" ? curRC() * 0.92 : Math.min(SW, SH) * 0.47);
          if (cfg.grow) { b.r *= cfg.grow; if (b.r >= maxR) { b.r = startR(); psound(160, 0.3); ring(b.x, b.y, b.hue); } }
          if (cfg.shrink) { b.r *= cfg.shrink; if (b.r < 4) b.r = startR(); }
          if (cfg.rainbow) b.hue = (b.hue + 32) % 360;
          if (cfg.split && balls.filter((x) => x.state === "live").length < 160) balls.push(newBall(b.x, b.y, Math.max(4, b.r * 0.82), (b.hue + 120) % 360, -b.vx + (Math.random() - 0.5) * 3, b.vy * 0.85));
          if (cfg.changeTo && cfg.changeAfter && b.state === "live" && b.bounces >= cfg.changeAfter) applyChange(b);
        }
        function angDiff(a, bb) { let d = Math.abs(a - bb) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; }
        function step() {
          frameT++;
          if (cfg.gravFlip && frameT % 160 === 0) gravSign *= -1;
          if (cfg.containerGrow > 0) rcScale = Math.min(1.4, rcScale + 0.0016); else if (cfg.containerGrow < 0) rcScale = Math.max(0.42, rcScale - 0.0013);
          if (cfg.wallsClose) { const mw = Math.min(SW, SH) * 0.3; if (wall < mw) wall += 0.25; }
          if (cfg.spin && cfg.container !== "hole") spinAng += 0.012;
          if (cfg.container === "hole" && cfg.spin) gapCenter += 0.016;
          const gx = GX * gravSign, gy = GY * gravSign, ts = cfg.timeScale || 1;
          const stones = balls.filter((b) => b.state === "stone");
          for (const b of balls) {
            if (b.state === "stone") continue;
            b.vx += (gx + cfg.wind) * ts; b.vy += gy * ts;
            if (cfg.attract) { b.vx += (cx - b.x) * 0.0022 * ts; b.vy += (cy - b.y) * 0.0022 * ts; }
            b.x += b.vx * ts; b.y += b.vy * ts;
            // emitters
            if (cfg.emit === "fire" && frameT % 2 === 0) emitAt(b.x, b.y, b.hue, "fire");
            else if (cfg.emit === "sparkle" && frameT % 5 === 0) emitAt(b.x, b.y, b.hue, "sparkle");
            // paint trail
            if (cfg.paint && b.state === "live") { pctx.fillStyle = "hsla(" + b.hue + ",90%,60%,0.5)"; pctx.beginPath(); pctx.arc(b.x, b.y, Math.max(3, b.r * 0.7), 0, Math.PI * 2); pctx.fill(); }
            if (b.state === "escaped") { if (b.y > SH + 120 || b.y < -120 || b.x < -120 || b.x > SW + 120) b.state = "gone"; continue; }
            if (cfg.wrap) {
              if (b.x < -b.r) b.x = SW + b.r; else if (b.x > SW + b.r) b.x = -b.r;
              if (b.y < -b.r) b.y = SH + b.r; else if (b.y > SH + b.r) b.y = -b.r;
            } else if (cfg.container === "box") {
              const L = wall, R = SW - wall, T = wall, B = SH - wall;
              if (b.x - b.r < L) { b.x = L + b.r; b.vx = Math.abs(b.vx); bounce(b); }
              else if (b.x + b.r > R) { b.x = R - b.r; b.vx = -Math.abs(b.vx); bounce(b); }
              if (b.y - b.r < T) { b.y = T + b.r; b.vy = Math.abs(b.vy); bounce(b); }
              else if (b.y + b.r > B) { b.y = B - b.r; b.vy = -Math.abs(b.vy); bounce(b); }
            } else {
              const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy) || 0.001, lim = curRC() - b.r;
              if (d > lim) {
                const ang = Math.atan2(dy, dx);
                const inGap = cfg.container === "hole" && gapCenters().some((gc) => angDiff(ang, gc) < GAP_HALF);
                if (inGap) { if (d > curRC() + b.r) { if (cfg.holes > 1) { const nx = dx / d, ny = dy / d; b.x = cx - nx * (curRC() - b.r - 2); b.y = cy - ny * (curRC() - b.r - 2); } else { b.state = "escaped"; psound(760, 0.25); setFlash("ESCAPED! 🎉"); } } }
                else { const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; b.x = cx + nx * lim; b.y = cy + ny * lim; bounce(b); }
              }
            }
            for (const s of stones) { const dx = b.x - s.x, dy = b.y - s.y, d = Math.hypot(dx, dy) || 0.001, md = b.r + s.r; if (d < md) { const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; } b.x = s.x + nx * md; b.y = s.y + ny * md; bounce(b); } }
            if (b.state === "live") enforce(b);
          }
          // ball-to-ball collisions (chaos!)
          if (cfg.collide) { const live = balls.filter((b) => b.state === "live"); for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const a = live[i], c2 = live[j]; const dx = c2.x - a.x, dy = c2.y - a.y, d = Math.hypot(dx, dy) || 0.001, md = a.r + c2.r; if (d < md) { const nx = dx / d, ny = dy / d, ov = (md - d) / 2; a.x -= nx * ov; a.y -= ny * ov; c2.x += nx * ov; c2.y += ny * ov; const rel = (c2.vx - a.vx) * nx + (c2.vy - a.vy) * ny; if (rel < 0) { a.vx += rel * nx; a.vy += rel * ny; c2.vx -= rel * nx; c2.vy -= rel * ny; } } } }
          // absorb: bigger balls eat smaller on contact
          if (cfg.absorb) { const live = balls.filter((b) => b.state === "live"); for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const a = live[i], c2 = live[j]; if (a.state !== "live" || c2.state !== "live") continue; const dx = a.x - c2.x, dy = a.y - c2.y; if (Math.hypot(dx, dy) < a.r + c2.r) { const big = a.r >= c2.r ? a : c2, sm = big === a ? c2 : a; big.r = Math.min(curRC() * 0.9, Math.sqrt(big.r * big.r + sm.r * sm.r)); sm.state = "gone"; emitBurst(sm.x, sm.y, big.hue, 4, "sparkle"); psound(300, 0.08); } } }
          // particles
          for (const q of parts) { q.x += q.vx; q.y += q.vy; if (q.kind === "confetti") q.vy += 0.22; else if (q.kind === "fire") { q.vy -= 0.04; q.vx *= 0.98; } q.life--; }
          parts = parts.filter((q) => q.life > 0);
          balls = balls.filter((b) => b.state !== "gone");
          if ((cfg.sequence) && balls.filter((b) => b.state === "live").length === 0 && stoneCount < 70) balls.push(freshBall());
          rings.forEach((r) => { r.r += 6; r.a -= 0.04; }); rings = rings.filter((r) => r.a > 0);
          if (flash) { flash.ttl--; if (flash.ttl <= 0) flash = null; }
          shakeMag *= 0.9;
          try { window.__sball = { bounces: totalBounces, stone: stoneCount, total: balls.length, live: balls.filter((b) => b.state === "live").length, escaped: balls.filter((b) => b.state === "escaped").length, container: cfg.container, bg: cfg.bg, parts: parts.length }; } catch (e) {}
        }
        function renderScene() {
          bgDraw(sx);
          if (cfg.paint && paintCv) sx.drawImage(paintCv, 0, 0);
          if (cfg.trail) { bxf.fillStyle = "rgba(0,0,0,0.14)"; bxf.fillRect(0, 0, SW, SH); } else bxf.clearRect(0, 0, SW, SH);
          // container
          if (cfg.container === "box") {
            bxf.strokeStyle = "rgba(255,255,255,0.3)"; bxf.lineWidth = 6; bxf.strokeRect(wall + 3, wall + 3, SW - wall * 2 - 6, SH - wall * 2 - 6);
          } else if (cfg.container === "hole") {
            bxf.strokeStyle = "rgba(255,255,255,0.55)"; bxf.lineWidth = 9; bxf.lineCap = "round";
            const gcs = gapCenters().slice().sort((a, b) => a - b); const R = curRC();
            for (let i = 0; i < gcs.length; i++) { const start = gcs[i] + GAP_HALF, end = (gcs[(i + 1) % gcs.length]) - GAP_HALF + (i === gcs.length - 1 ? Math.PI * 2 : 0); bxf.beginPath(); bxf.arc(cx, cy, R, start, end); bxf.stroke(); }
            bxf.lineCap = "butt";
          } else {
            bxf.save(); bxf.translate(cx, cy); bxf.rotate(spinAng);
            bxf.strokeStyle = "rgba(255,255,255,0.42)"; bxf.lineWidth = 8; bxf.beginPath(); bxf.arc(0, 0, curRC(), 0, Math.PI * 2); bxf.stroke();
            if (cfg.spin) { bxf.strokeStyle = "rgba(0,0,0,0.9)"; bxf.lineWidth = 8; bxf.beginPath(); bxf.arc(0, 0, curRC(), -0.45, 0.45); bxf.stroke(); }
            bxf.restore();
          }
          // particles (behind balls)
          for (const q of parts) { const a = q.life / q.max; if (q.kind === "fire") { bxf.fillStyle = "hsla(" + q.hue + ",100%," + (50 + a * 20) + "%," + a + ")"; bxf.beginPath(); bxf.arc(q.x, q.y, 2 + a * 4, 0, Math.PI * 2); bxf.fill(); } else if (q.kind === "sparkle") { bxf.fillStyle = "hsla(" + q.hue + ",90%,80%," + a + ")"; bxf.fillRect(q.x - 1.5, q.y - 1.5, 3, 3); } else { bxf.fillStyle = "hsla(" + q.hue + ",90%,60%," + a + ")"; bxf.fillRect(q.x - 3, q.y - 3, 6, 6); } }
          // rings (impact pulses)
          rings.forEach((r) => { bxf.strokeStyle = "hsla(" + r.hue + ",90%,65%," + r.a + ")"; bxf.lineWidth = 5; bxf.beginPath(); bxf.arc(r.x, r.y, r.r, 0, Math.PI * 2); bxf.stroke(); });
          // balls
          for (const b of balls) {
            const rEff = cfg.pulse ? b.r * (1 + 0.16 * Math.sin(frameT * 0.14 + b.x * 0.05)) : b.r;
            if (b.state === "stone") {
              bxf.fillStyle = b.frozen ? "#9fd8ff" : "#8a8f9e"; shapePath(bxf, b.x, b.y, b.r, cfg.shape, 0); bxf.fill();
              bxf.strokeStyle = b.frozen ? "rgba(255,255,255,0.7)" : "rgba(40,44,54,0.8)"; bxf.lineWidth = 2;
              bxf.beginPath(); bxf.moveTo(b.x - b.r * 0.5, b.y - b.r * 0.1); bxf.lineTo(b.x + b.r * 0.3, b.y - b.r * 0.4); bxf.stroke();
            } else if (cfg.ballEmoji) {
              bxf.font = "900 " + (rEff * 2.1 | 0) + "px system-ui,'Segoe UI Emoji'"; bxf.textAlign = "center"; bxf.textBaseline = "middle";
              bxf.save(); bxf.translate(b.x, b.y); bxf.rotate(b.bounces * 0.2); bxf.fillText(cfg.ballEmoji, 0, 0); bxf.restore();
            } else if ((cfg.maxwellBall && maxwellImg.complete) || (!cfg.maxwellBall && customImg && customImg.complete)) {
              const img = cfg.maxwellBall ? maxwellImg : customImg;
              bxf.save(); bxf.beginPath(); bxf.arc(b.x, b.y, rEff, 0, Math.PI * 2); bxf.clip(); bxf.translate(b.x, b.y); bxf.rotate(b.bounces * 0.15);
              bxf.shadowColor = "hsl(" + b.hue + " 95% 60%)"; bxf.shadowBlur = 16; bxf.drawImage(img, -rEff, -rEff, rEff * 2, rEff * 2); bxf.restore(); bxf.shadowBlur = 0;
            } else {
              const g = bxf.createRadialGradient(b.x - rEff * 0.3, b.y - rEff * 0.3, rEff * 0.1, b.x, b.y, rEff);
              g.addColorStop(0, "hsl(" + b.hue + " 100% 78%)"); g.addColorStop(1, "hsl(" + b.hue + " 90% 48%)");
              bxf.fillStyle = g; bxf.shadowColor = "hsl(" + b.hue + " 95% 60%)"; bxf.shadowBlur = 26;
              shapePath(bxf, b.x, b.y, rEff, cfg.shape, b.bounces * 0.3); bxf.fill(); bxf.shadowBlur = 0;
            }
          }
          sx.drawImage(sbuf, 0, 0);
          // HUD: big bounce counter
          sx.textAlign = "center"; sx.fillStyle = "rgba(255,255,255,0.95)"; sx.font = "900 62px system-ui, sans-serif";
          sx.fillText(totalBounces, SW / 2, 86);
          sx.font = "700 20px system-ui"; sx.fillStyle = "rgba(255,255,255,0.65)"; sx.fillText("BOUNCES", SW / 2, 112);
          // flash message (STONE!, ESCAPED!, etc.)
          if (flash) { sx.globalAlpha = Math.min(1, flash.ttl / 45); sx.fillStyle = "#fff"; sx.font = "900 44px system-ui"; sx.fillText(flash.txt, SW / 2, SH * 0.6); sx.globalAlpha = 1; }
          // background label (so you can see it's working) + watermark
          sx.textAlign = "left"; sx.fillStyle = "rgba(255,255,255,0.55)"; sx.font = "700 18px system-ui"; sx.fillText("🎨 " + (BG_NAMES[cfg.bg] || "Starfield"), 14, SH - 24);
          sx.textAlign = "center"; sx.fillStyle = "rgba(255,255,255,0.5)"; sx.font = "800 22px system-ui"; sx.fillText("MaxwellGames", SW / 2, SH - 26);
        }
        function renderView() {
          const vw = view.width, vh = view.height; if (!vw || !vh) return;
          vx.clearRect(0, 0, vw, vh);
          // 1) draw the chosen background across the WHOLE screen (reliable, no filter needed)
          if (bgView) { vx.save(); vx.setTransform(vw / SW, 0, 0, vh / SH, 0, 0); bgView(vx); vx.setTransform(1, 0, 0, 1, 0, 0); vx.restore(); }
          else { vx.fillStyle = "#0a0c18"; vx.fillRect(0, 0, vw, vh); }
          // soft darken so the centered play area pops
          vx.fillStyle = "rgba(0,0,0,0.28)"; vx.fillRect(0, 0, vw, vh);
          // 2) the crisp 9:16 play scene, centered, filling the height
          const fit = Math.min(vw / SW, vh / SH), fw = SW * fit, fh = SH * fit;
          const shk = shakeMag > 0.3 ? shakeMag * fit : 0, ox = (Math.random() - 0.5) * shk * 2, oy = (Math.random() - 0.5) * shk * 2;
          vx.save(); vx.shadowColor = "rgba(0,0,0,0.6)"; vx.shadowBlur = 40; vx.drawImage(scene, (vw - fw) / 2 + ox, (vh - fh) / 2 + oy, fw, fh); vx.restore();
        }
        function loop() { if (!running) return; step(); renderScene(); renderView(); raf = requestAnimationFrame(loop); }

        // ===== view sizing + fullscreen =====
        function resizeView() { const dpr = Math.min(2, window.devicePixelRatio || 1); const w = fs.clientWidth || window.innerWidth, h = fs.clientHeight || window.innerHeight; view.width = Math.round(w * dpr); view.height = Math.round(h * dpr); }
        const onResize = () => resizeView();
        window.addEventListener("resize", onResize);
        function requestFS() { const fn = fs.requestFullscreen || fs.webkitRequestFullscreen || fs.msRequestFullscreen; if (fn) { try { fn.call(fs); } catch (e) {} } }
        function exitFSapi() { if (document.fullscreenElement || document.webkitFullscreenElement) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} } }
        const onFsChange = () => { if (!document.fullscreenElement && !document.webkitFullscreenElement && fs.classList.contains("on")) doExit(); };
        document.addEventListener("fullscreenchange", onFsChange); document.addEventListener("webkitfullscreenchange", onFsChange);

        let loadIv = null;
        function openStage() {
          fs.classList.add("on"); resizeView(); requestFS();
          try { const a = actx(); if (a && a.resume) a.resume(); } catch (e) {}
          loader.classList.remove("gone");
          fs.querySelector("#sbProg").style.width = "0%";
          let prog = 0; clearInterval(loadIv);
          loadIv = setInterval(() => { prog += 4 + Math.random() * 7; if (prog >= 100) { prog = 100; clearInterval(loadIv); setTimeout(() => loader.classList.add("gone"), 300); } fs.querySelector("#sbProg").style.width = prog + "%"; }, 95);
        }
        function applyCfg(c) { cfg = c; buildBalls(); const sub = fs.querySelector("#sbLoadSub"); if (sub) sub.textContent = summarize(cfg); running = true; if (!raf) loop(); }
        // ----- optional "bring your own AI key" (Google Gemini). Key stays in THIS browser only. -----
        function getKey() { try { return localStorage.getItem("mg-sball-key") || ""; } catch (e) { return ""; } }
        function aiParse(prompt, key) {
          const base = parse(prompt);
          const schema = 'Return ONLY JSON with these keys (no prose): container ("circle"|"box"|"hole"), count (1-200 int), gravity (0 to 1 number), grow (bool), shrink (bool), split (bool), speedUp (bool), rainbow (bool), trail (bool), spin (bool), wallsClose (bool), changeAfter (int, 0 if none), changeTo (one of "stone","freeze","pop","explode","split","color", or null), sequence (bool), escape (bool), bg (one of "matrix","space","synthwave","sunset","aurora","fire","ocean","disco","dark").';
          const body = { contents: [{ parts: [{ text: schema + '\nDescribe a satisfying bouncing-ball short for this request: "' + prompt + '"' }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } };
          const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
          const to = setTimeout(() => { if (ctrl) ctrl.abort(); }, 12000);
          return fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + encodeURIComponent(key), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
            .then((r) => r.json()).then((j) => {
              clearTimeout(to);
              const txt = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts[0].text;
              const ai = JSON.parse(txt);
              const c = Object.assign({}, base);
              if (ai.container && ["circle", "box", "hole"].indexOf(ai.container) >= 0) c.container = ai.container;
              if (typeof ai.count === "number") c.count = Math.max(1, Math.min(200, ai.count | 0));
              if (typeof ai.gravity === "number") c.gravity = Math.max(0, Math.min(1, ai.gravity));
              c.grow = ai.grow ? 1.07 : 0; c.shrink = ai.shrink ? 0.94 : 0; c.speedUp = ai.speedUp ? 1.03 : 0;
              ["split", "rainbow", "trail", "spin", "wallsClose", "sequence", "escape"].forEach((k) => { if (typeof ai[k] === "boolean") c[k] = ai[k]; });
              if (ai.changeTo && ["stone", "freeze", "pop", "explode", "split", "color"].indexOf(ai.changeTo) >= 0) { c.changeTo = ai.changeTo; c.changeAfter = Math.max(1, (ai.changeAfter | 0) || 1); } else { c.changeTo = base.changeTo; c.changeAfter = base.changeAfter; }
              if (ai.bg && ["matrix", "space", "synthwave", "sunset", "aurora", "fire", "ocean", "disco", "dark"].indexOf(ai.bg) >= 0) c.bg = ai.bg;
              if (c.escape) c.sequence = true;
              return c;
            }).catch((e) => { clearTimeout(to); throw e; });
        }
        function startExperience(p) {
          openStage();
          const key = getKey();
          if (key) { const sub = fs.querySelector("#sbLoadSub"); if (sub) sub.textContent = "🤖 Asking the AI…"; aiParse(p, key).then(applyCfg).catch(() => applyCfg(parse(p))); }
          else applyCfg(parse(p));
        }
        function doExit() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; fs.classList.remove("on"); exitFSapi(); stopRec(); }
        fs.querySelector("#sbExit").onclick = doExit;
        fs.querySelector("#sbNew").onclick = () => { doExit(); setTimeout(() => input.focus(), 100); };

        function submit() {
          const p = input.value.trim(); if (!p) return;
          bubble(esc(p), "me"); input.value = "";
          const typing = bubble('<span class="sball-typing"><span></span><span></span><span></span></span>', "ai");
          startExperience(p); // runs inside the click gesture so fullscreen is allowed
          setTimeout(() => { typing.innerHTML = "Done! 🎬 Your short is playing fullscreen. Tap <b>● Record</b> to save it, or <b>✏️ New</b> for another."; }, 1500);
        }

        // ===== recording =====
        let recording = false, recIv = null, activeRec = null;
        const recBtn = fs.querySelector("#sbRec");
        function stopRec() { if (recIv) { clearInterval(recIv); recIv = null; } if (activeRec && activeRec.state !== "inactive") { try { activeRec.stop(); } catch (e) {} } }
        function fsToast(msg) { let t = fs.querySelector(".sball-toast"); if (!t) { t = document.createElement("div"); t.className = "sball-toast"; fs.appendChild(t); } t.textContent = msg; clearTimeout(t._h); t._h = setTimeout(() => { if (t) t.remove(); }, 4000); }
        recBtn.onclick = () => {
          if (recording) return;
          try { const a = actx(); if (a && a.resume) a.resume(); } catch (e) {}
          if (!window.MediaRecorder) { fsToast("Recording isn't supported in this browser."); return; }
          let stream; try { stream = scene.captureStream(60); } catch (e) { fsToast("Recording isn't supported here."); return; }
          if (recDest) { try { const tr = recDest.stream.getAudioTracks()[0]; if (tr) stream.addTrack(tr); } catch (e) {} }
          const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
          let rec; try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); } catch (e) { fsToast("Recording isn't supported here."); return; }
          activeRec = rec; const chunks = [];
          rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "satisfying-ball-" + Date.now() + ".webm";
            document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
            fsToast("✅ Saved to downloads — upload it as a YouTube Short!");
            window.MG.flag("sball"); window.MG.arcadePlayed(); window.MG.addTreats(20); api.refreshTreats();
            recording = false; recBtn.disabled = false; recBtn.textContent = "● Record 15s"; activeRec = null;
          };
          rec.start(); recording = true; recBtn.disabled = true;
          let left = 15; recBtn.textContent = "● Rec " + left + "s"; fsToast("🔴 Recording 15 seconds…");
          recIv = setInterval(() => { left--; recBtn.textContent = "● Rec " + left + "s"; if (left <= 0) { clearInterval(recIv); recIv = null; try { rec.stop(); } catch (e) {} } }, 1000);
        };

        // ===== cleanup =====
        api.onClean(() => {
          running = false; if (raf) cancelAnimationFrame(raf); raf = null; clearInterval(loadIv); stopRec();
          exitFSapi();
          window.removeEventListener("resize", onResize);
          document.removeEventListener("fullscreenchange", onFsChange); document.removeEventListener("webkitfullscreenchange", onFsChange);
          if (fs && fs.parentNode) fs.parentNode.removeChild(fs);
        });
        setTimeout(() => input.focus(), 60);
      }
    }
  ];

  // ---------- open hooks ----------
  window.MG_ARCADE = { open: openArcade, close: closeArcade };
  function wireBtn() { const b = document.getElementById("arcadeBtn"); if (b) b.onclick = openArcade; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireBtn); else wireBtn();
})();
