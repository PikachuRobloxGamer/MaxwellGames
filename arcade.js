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
  }

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
          snake.forEach((s, i) => { x.fillStyle = i === 0 ? "#3ee08f" : "#6c5ce7"; x.fillRect(s.x * SZ + 1, s.y * SZ + 1, SZ - 2, SZ - 2); });
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
          x.fillStyle = "#fff"; x.beginPath(); x.arc(bx, by, 6, 0, 7); x.fill();
          x.font = "bold 24px system-ui"; x.textAlign = "center"; x.fillText(cpu + "   " + me, W / 2, 30);
          raf = requestAnimationFrame(loop);
        }
        function end() { over = true; cancelAnimationFrame(raf); api.boom(); const pts = me >= 5 ? 120 : 15; api.finish(pts, { scoreForBest: pts, title: me >= 5 ? "You win! 🎉" : "Maxwell wins 😼", line: "Final: Maxwell " + cpu + " — " + me + " you" }); }
        const mv = (e) => { const r = c.getBoundingClientRect(); py = (e.clientY - r.top) * (H / r.height); py = Math.max(PH / 2, Math.min(H - PH / 2, py)); };
        c.addEventListener("pointermove", mv);
        api.onClean(() => { cancelAnimationFrame(raf); });
        reset(Math.random() < 0.5 ? 1 : -1); loop();
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
          <div class="sball-chat-head"><span class="sball-ai-dot"></span><b>🔮 Satisfying AI</b><small>makes YouTube Shorts</small></div>
          <div class="sball-msgs" id="sbMsgs"></div>
          <div class="sball-suggest" id="sbSuggest"></div>
          <form class="sball-inputbar" id="sbForm"><input class="sball-input" id="sbInput" placeholder="Describe your satisfying short…" autocomplete="off"><button class="btn sball-send" type="submit">Send</button></form>`;
        const msgs = chat.querySelector("#sbMsgs");
        function bubble(html, who) { const d = document.createElement("div"); d.className = "sball-msg " + who; d.innerHTML = html; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; }
        bubble("Hey! I'm the <b>Satisfying AI</b> 🐾 Tell me what to make and I'll build a fullscreen satisfying short you can record.<br><br>Describe the <b>balls</b> and the <b>background</b> — like <i>\"a ball that grows every bounce with matrix background\"</i>.", "ai");
        const SUGG = [
          "a ball that grows every bounce, matrix background",
          "ball inside a spinning circle, space background",
          "balls that split each bounce, synthwave background",
          "a ball that speeds up with a trail, aurora background",
          "100 rainbow balls, sunset background",
          "walls closing in on a ball, lava background"
        ];
        const sug = chat.querySelector("#sbSuggest");
        SUGG.forEach((s) => { const b = document.createElement("button"); b.className = "sball-chip"; b.type = "button"; b.textContent = s; b.onclick = () => { input.value = s; submit(); }; sug.appendChild(b); });
        const input = chat.querySelector("#sbInput");
        chat.querySelector("#sbForm").onsubmit = (e) => { e.preventDefault(); submit(); };

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
        function parse(pRaw) {
          const p = (pRaw || "").toLowerCase().replace(/[’']/g, "");
          function numBefore(word) { const m = p.match(new RegExp("(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)\\s*" + word)); if (!m) return null; return /\d/.test(m[1]) ? parseInt(m[1], 10) : W2N[m[1]]; }
          const bounceCount = numBefore("(?:times?|bounces?|hits?)");
          let ballCount = numBefore("(?:[a-z]+\\s+){0,3}balls?"); // allows "100 rainbow balls"
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
          const boxWords = /(box|square|rectangle)/.test(p) && !hole;
          const wallsClose = /(walls? clos|closing in|caves? in|shrink.*(box|wall)|squeeze|tighten|crush)/.test(p);
          const cfg = {
            container: hole ? "hole" : (boxWords || wallsClose ? "box" : "circle"),
            count: Math.max(1, Math.min(200, ballCount || (/(many|lots|bunch|hundred|loads|tons)/.test(p) ? 60 : 1))),
            gravity: /(no gravity|zero ?g|float|weightless)/.test(p) ? 0 : (/(low gravity|moon|slow fall|floaty)/.test(p) ? 0.12 : (/(heavy|strong gravity|more gravity|falls fast)/.test(p) ? 0.7 : 0.4)),
            grow: /(bigger|grows?|growing|larger|expand|increase|huge|size up)/.test(p) ? 1.07 : 0,
            shrink: /(smaller|shrinks?|shrinking|tinier|size down)/.test(p) ? 0.94 : 0,
            split: /(keeps? splitting|splits? every|splits? each|multiply|clones?|duplicate|more balls each)/.test(p),
            speedUp: /(speed ?up|faster|speeds up|accelerat|quicker)/.test(p) ? 1.03 : 0,
            rainbow: /(rainbow|changing colou?rs|every colou?r|disco colou?rs|cycles? colou?r)/.test(p),
            trail: !/(no trail|without (a )?trail|trail-?less|no tail)/.test(p),
            wallsClose: wallsClose,
            spin: /(spin|spinning|rotating|rotate|rotates)/.test(p),
            changeAfter: changeTo ? (bounceCount || 1) : 0,
            changeTo: changeTo,
            sequence: sequence,
            escape: hole,
            bg: detectBg(p)
          };
          if (cfg.escape) cfg.sequence = true;
          if (cfg.container === "hole") cfg.spin = !/no spin|not spinning/.test(p);
          if (cfg.bg === "dark" && !/(dark|black|night|void|plain|space)/.test(p)) cfg.bg = "space";
          return cfg;
        }
        const CHANGE_TXT = { stone: "turns to stone", freeze: "freezes", explode: "explodes", pop: "pops", split: "splits apart", color: "changes color" };
        function summarize(cfg) {
          const b = [];
          if (cfg.count > 1 && !cfg.sequence) b.push(cfg.count + " balls");
          b.push(cfg.container === "hole" ? "escape a circle with a hole" : cfg.container === "box" ? "in a box" : "in a circle");
          if (cfg.changeAfter && cfg.changeTo) b.push("after " + cfg.changeAfter + " bounce" + (cfg.changeAfter > 1 ? "s" : "") + " → " + CHANGE_TXT[cfg.changeTo]);
          if (cfg.sequence && !cfg.escape) b.push("then a new ball repeats");
          if (cfg.escape) b.push("ball escapes the hole");
          if (cfg.grow) b.push("grows"); if (cfg.shrink) b.push("shrinks");
          if (cfg.speedUp) b.push("speeds up"); if (cfg.split) b.push("keeps splitting");
          if (cfg.rainbow) b.push("rainbow"); if (cfg.wallsClose) b.push("walls close in");
          b.push(cfg.trail ? "with trail" : "no trail");
          if (cfg.spin && cfg.container !== "hole") b.push("spinning");
          b.push("🎨 " + (BG_NAMES[cfg.bg] || "Starfield"));
          return b.join(" · ");
        }

        // ===== physics =====
        let balls = [], cfg = null, bgDraw = null, wall = 0, spinAng = 0, gapCenter = 0, totalBounces = 0, stoneCount = 0, running = false, raf = null, flash = null;
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
          bgDraw = makeBg(cfg.bg); wall = 0; spinAng = 0; gapCenter = Math.random() * Math.PI * 2; totalBounces = 0; stoneCount = 0; flash = null; rings = []; bxf.clearRect(0, 0, SW, SH); balls = [];
          const n = cfg.sequence ? 1 : cfg.count; // sequences run one ball at a time
          for (let i = 0; i < n; i++) balls.push(freshBall());
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
          b.vx *= REST; b.vy *= REST;
          if (cfg.speedUp) { b.vx *= cfg.speedUp; b.vy *= cfg.speedUp; }
          enforce(b);
          psound(Math.max(140, Math.min(900, 900 - b.r * 7)));
          const maxR = (cfg.container !== "box" ? RC() * 0.92 : Math.min(SW, SH) * 0.47);
          if (cfg.grow) { b.r *= cfg.grow; if (b.r >= maxR) { b.r = startR(); psound(160, 0.3); ring(b.x, b.y, b.hue); } }
          if (cfg.shrink) { b.r *= cfg.shrink; if (b.r < 4) b.r = startR(); }
          if (cfg.rainbow) b.hue = (b.hue + 32) % 360;
          if (cfg.split && balls.filter((x) => x.state === "live").length < 160) balls.push(newBall(b.x, b.y, Math.max(4, b.r * 0.82), (b.hue + 120) % 360, -b.vx + (Math.random() - 0.5) * 3, b.vy * 0.85));
          if (cfg.changeTo && cfg.changeAfter && b.state === "live" && b.bounces >= cfg.changeAfter) applyChange(b);
        }
        function angDiff(a, bb) { let d = Math.abs(a - bb) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; }
        function step() {
          if (cfg.wallsClose) { const mw = Math.min(SW, SH) * 0.3; if (wall < mw) wall += 0.25; }
          if (cfg.spin && cfg.container !== "hole") spinAng += 0.012;
          if (cfg.container === "hole" && cfg.spin) gapCenter += 0.016;
          const stones = balls.filter((b) => b.state === "stone");
          for (const b of balls) {
            if (b.state === "stone") continue;
            b.vy += cfg.gravity; b.x += b.vx; b.y += b.vy;
            if (b.state === "escaped") { if (b.y > SH + 120 || b.x < -120 || b.x > SW + 120) b.state = "gone"; continue; }
            // container collision
            if (cfg.container === "box") {
              const L = wall, R = SW - wall, T = wall, B = SH - wall;
              if (b.x - b.r < L) { b.x = L + b.r; b.vx = Math.abs(b.vx); bounce(b); }
              else if (b.x + b.r > R) { b.x = R - b.r; b.vx = -Math.abs(b.vx); bounce(b); }
              if (b.y - b.r < T) { b.y = T + b.r; b.vy = Math.abs(b.vy); bounce(b); }
              else if (b.y + b.r > B) { b.y = B - b.r; b.vy = -Math.abs(b.vy); bounce(b); }
            } else {
              const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy) || 0.001, lim = RC() - b.r;
              if (d > lim) {
                const ang = Math.atan2(dy, dx);
                const inGap = cfg.container === "hole" && angDiff(ang, gapCenter) < GAP_HALF;
                if (inGap) { if (d > RC() + b.r) { b.state = "escaped"; psound(760, 0.25); setFlash("ESCAPED! 🎉"); } }
                else { const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; b.x = cx + nx * lim; b.y = cy + ny * lim; bounce(b); }
              }
            }
            // bounce off stone balls
            for (const s of stones) { const dx = b.x - s.x, dy = b.y - s.y, d = Math.hypot(dx, dy) || 0.001, md = b.r + s.r; if (d < md) { const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; } b.x = s.x + nx * md; b.y = s.y + ny * md; bounce(b); } }
            if (b.state === "live") enforce(b);
          }
          balls = balls.filter((b) => b.state !== "gone");
          // sequence: when the live ball is done, the next one comes in
          if ((cfg.sequence) && balls.filter((b) => b.state === "live").length === 0 && stoneCount < 70) balls.push(freshBall());
          rings.forEach((r) => { r.r += 6; r.a -= 0.04; }); rings = rings.filter((r) => r.a > 0);
          if (flash) { flash.ttl--; if (flash.ttl <= 0) flash = null; }
          try { window.__sball = { bounces: totalBounces, stone: stoneCount, total: balls.length, live: balls.filter((b) => b.state === "live").length, escaped: balls.filter((b) => b.state === "escaped").length, container: cfg.container, bg: cfg.bg }; } catch (e) {}
        }
        function renderScene() {
          bgDraw(sx);
          if (cfg.trail) { bxf.fillStyle = "rgba(0,0,0,0.14)"; bxf.fillRect(0, 0, SW, SH); } else bxf.clearRect(0, 0, SW, SH);
          // container
          if (cfg.container === "box") {
            bxf.strokeStyle = "rgba(255,255,255,0.3)"; bxf.lineWidth = 6; bxf.strokeRect(wall + 3, wall + 3, SW - wall * 2 - 6, SH - wall * 2 - 6);
          } else if (cfg.container === "hole") {
            bxf.strokeStyle = "rgba(255,255,255,0.55)"; bxf.lineWidth = 9; bxf.lineCap = "round";
            bxf.beginPath(); bxf.arc(cx, cy, RC(), gapCenter + GAP_HALF, gapCenter - GAP_HALF + Math.PI * 2); bxf.stroke(); bxf.lineCap = "butt";
          } else {
            bxf.save(); bxf.translate(cx, cy); bxf.rotate(spinAng);
            bxf.strokeStyle = "rgba(255,255,255,0.42)"; bxf.lineWidth = 8; bxf.beginPath(); bxf.arc(0, 0, RC(), 0, Math.PI * 2); bxf.stroke();
            if (cfg.spin) { bxf.strokeStyle = "rgba(0,0,0,0.9)"; bxf.lineWidth = 8; bxf.beginPath(); bxf.arc(0, 0, RC(), -0.45, 0.45); bxf.stroke(); }
            bxf.restore();
          }
          // rings (impact pulses)
          rings.forEach((r) => { bxf.strokeStyle = "hsla(" + r.hue + ",90%,65%," + r.a + ")"; bxf.lineWidth = 5; bxf.beginPath(); bxf.arc(r.x, r.y, r.r, 0, Math.PI * 2); bxf.stroke(); });
          // balls
          for (const b of balls) {
            if (b.state === "stone") {
              bxf.fillStyle = b.frozen ? "#9fd8ff" : "#8a8f9e"; bxf.beginPath(); bxf.arc(b.x, b.y, b.r, 0, Math.PI * 2); bxf.fill();
              bxf.strokeStyle = b.frozen ? "rgba(255,255,255,0.7)" : "rgba(40,44,54,0.8)"; bxf.lineWidth = 2;
              bxf.beginPath(); bxf.moveTo(b.x - b.r * 0.5, b.y - b.r * 0.1); bxf.lineTo(b.x + b.r * 0.3, b.y - b.r * 0.4); bxf.moveTo(b.x - b.r * 0.1, b.y - b.r * 0.5); bxf.lineTo(b.x + b.r * 0.15, b.y + b.r * 0.45); bxf.stroke();
            } else {
              const g = bxf.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
              g.addColorStop(0, "hsl(" + b.hue + " 100% 78%)"); g.addColorStop(1, "hsl(" + b.hue + " 90% 48%)");
              bxf.fillStyle = g; bxf.shadowColor = "hsl(" + b.hue + " 95% 60%)"; bxf.shadowBlur = 26;
              bxf.beginPath(); bxf.arc(b.x, b.y, b.r, 0, Math.PI * 2); bxf.fill(); bxf.shadowBlur = 0;
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
          vx.save(); vx.filter = "blur(26px)";
          const cover = Math.max(vw / SW, vh / SH), cw = SW * cover, ch = SH * cover;
          vx.drawImage(scene, (vw - cw) / 2, (vh - ch) / 2, cw, ch); vx.restore();
          vx.fillStyle = "rgba(0,0,0,0.45)"; vx.fillRect(0, 0, vw, vh);
          const fit = Math.min(vw / SW, vh / SH), fw = SW * fit, fh = SH * fit;
          vx.save(); vx.shadowColor = "rgba(0,0,0,0.75)"; vx.shadowBlur = 46; vx.drawImage(scene, (vw - fw) / 2, (vh - fh) / 2, fw, fh); vx.restore();
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
        function startExperience(p) {
          cfg = parse(p); buildBalls();
          fs.classList.add("on"); resizeView(); requestFS();
          try { const a = actx(); if (a && a.resume) a.resume(); } catch (e) {}
          loader.classList.remove("gone");
          fs.querySelector("#sbLoadSub").textContent = summarize(cfg);
          fs.querySelector("#sbProg").style.width = "0%";
          let prog = 0; clearInterval(loadIv);
          loadIv = setInterval(() => { prog += 4 + Math.random() * 7; if (prog >= 100) { prog = 100; clearInterval(loadIv); setTimeout(() => loader.classList.add("gone"), 300); } fs.querySelector("#sbProg").style.width = prog + "%"; }, 95);
          running = true; if (!raf) loop();
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
