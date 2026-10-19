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

  function closeArcade() { cleanup(); const ov = document.getElementById("arcadeOv"); if (ov) ov.remove(); }

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
    const esc = (e) => { if (e.key === "Escape") { if (!document.getElementById("arBack").classList.contains("hidden")) showMenu(); else closeArcade(); } };
    document.addEventListener("keydown", esc);
    ov._esc = esc;
    refreshTreats();
    showMenu();
  }

  function showMenu() {
    cleanup();
    document.getElementById("arBack").classList.add("hidden");
    document.getElementById("arTitle").textContent = "🕹️ Maxwell Arcade";
    const body = document.getElementById("arBody");
    body.className = "arcade-body menu";
    body.innerHTML = "";
    const grid = document.createElement("div"); grid.className = "ar-grid";
    GAMES.forEach((g) => {
      const best = window.MG.arcadeBest(g.key);
      const tile = document.createElement("button"); tile.className = "ar-tile";
      tile.innerHTML = `<span class="ar-ic"></span><span class="ar-name"></span><span class="ar-best"></span>`;
      tile.querySelector(".ar-ic").textContent = g.icon;
      tile.querySelector(".ar-name").textContent = g.name;
      tile.querySelector(".ar-best").textContent = g.special ? g.tag : (g.bestLabel ? g.bestLabel(best) : (best ? "Best: " + best : "New!"));
      tile.onclick = () => launch(g);
      grid.appendChild(tile);
    });
    body.appendChild(grid);
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

    // ---------- SPECIAL: Satisfying Balls (prompt → fullscreen physics short) ----------
    {
      key: "sball", name: "Satisfying Balls", icon: "🔮", special: true, tag: "AI prompt!",
      play(host, api) {
        const W = 324, H = 576; // 9:16
        const panel = document.createElement("div"); panel.className = "sball-panel"; host.appendChild(panel);
        panel.innerHTML = `
          <p class="ar-hint">Describe your short — the balls AND the background. I'll build it, then hit <b>Fullscreen</b> or <b>Record</b> to make a YouTube Short!</p>
          <div class="sball-promptrow">
            <input id="sballPrompt" class="sball-input" placeholder="e.g. a ball that grows each bounce with matrix falling in the background">
            <button class="btn asc-btn" id="sballGo">✨ Make it</button>
          </div>
          <div class="sball-chips" id="sballChips"></div>
          <p class="sball-read" id="sballRead"></p>`;
        const EXAMPLES = [
          "a ball that gets bigger every bounce, matrix background",
          "100 rainbow balls in space with stars",
          "a ball bouncing inside a circle, synthwave background",
          "balls that split, sunset background",
          "a ball that speeds up with a trail, aurora background",
          "walls closing in, fire background"
        ];
        const chips = panel.querySelector("#sballChips");
        EXAMPLES.forEach((ex) => { const ch = document.createElement("button"); ch.className = "sball-chip"; ch.textContent = ex; ch.onclick = () => { input.value = ex; generate(); }; chips.appendChild(ch); });

        const stage = document.createElement("div"); stage.className = "sball-stage"; host.appendChild(stage);
        const c = canvas(stage, W, H, "sball-canvas"); const x = c.getContext("2d");
        // offscreen buffer for the ball layer (lets trails persist over a live background)
        const buf = document.createElement("canvas"); buf.width = W; buf.height = H; const bx = buf.getContext("2d");
        // floating bar shown only in fullscreen
        const fsBar = document.createElement("div"); fsBar.className = "sball-fs-bar";
        fsBar.innerHTML = `<button class="btn sball-rec" id="sballFsRec">● Record 12s</button><button class="btn" id="sballFsExit">⛶ Exit</button>`;
        stage.appendChild(fsBar);

        const controls = document.createElement("div"); controls.className = "sball-controls"; host.appendChild(controls);
        controls.innerHTML = `
          <button class="btn" id="sballReplay">↻ Replay</button>
          <button class="btn sball-fs" id="sballFull">⛶ Fullscreen</button>
          <button class="btn sball-rec" id="sballRec">● Record 12s</button>
          <span class="sball-recnote" id="sballRecNote"></span>`;
        const input = panel.querySelector("#sballPrompt");
        const read = panel.querySelector("#sballRead");
        const recBtn = controls.querySelector("#sballRec");
        const fsRecBtn = fsBar.querySelector("#sballFsRec");
        const recNote = controls.querySelector("#sballRecNote");
        controls.querySelector("#sballReplay").onclick = () => build(lastCfg);

        // ----- fullscreen -----
        function enterFull() {
          const fn = stage.requestFullscreen || stage.webkitRequestFullscreen || stage.msRequestFullscreen;
          if (fn) { try { fn.call(stage); } catch (e) {} }
          else { stage.classList.add("fake-full"); } // fallback: CSS fullscreen
        }
        function exitFull() {
          if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen || function(){}).call(document); }
          stage.classList.remove("fake-full");
        }
        controls.querySelector("#sballFull").onclick = enterFull;
        fsBar.querySelector("#sballFsExit").onclick = exitFull;

        // audio (routed to speakers + a recording destination so the video has sound)
        let recDest = null;
        try { const a = actx(); if (a && a.createMediaStreamDestination) recDest = a.createMediaStreamDestination(); } catch (e) {}
        function psound(freq) {
          const a = actx(); if (!a) return;
          const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
          o.type = "sine"; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.6), t + 0.18);
          g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          o.connect(g); g.connect(a.destination); if (recDest) g.connect(recDest);
          o.start(t); o.stop(t + 0.22);
        }

        // ----- backgrounds -----
        function detectBg(p) {
          if (/(matrix|falling code|green code|hacker|the matrix)/.test(p)) return "matrix";
          if (/(space|stars?|galaxy|cosmos|night sky|universe|outer space)/.test(p)) return "space";
          if (/(synthwave|neon|retro grid|vaporwave|outrun|80s grid)/.test(p)) return "synthwave";
          if (/(sunset|sunrise|warm gradient|orange sky)/.test(p)) return "sunset";
          if (/(aurora|northern lights)/.test(p)) return "aurora";
          if (/(fire|lava|flames?|volcano|magma)/.test(p)) return "fire";
          if (/(ocean|underwater|sea|deep blue)/.test(p)) return "ocean";
          if (/(rainbow background|disco floor|party background)/.test(p)) return "disco";
          return "dark";
        }
        const BG_NAMES = { matrix: "Matrix code", space: "Starfield", synthwave: "Synthwave grid", sunset: "Sunset", aurora: "Aurora", fire: "Lava", ocean: "Ocean", disco: "Disco", dark: "Dark" };
        function makeBg(type) {
          let stars = [], cols = [], t = 0;
          if (type === "space") for (let i = 0; i < 110; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: 0.4 + Math.random() * 2 });
          if (type === "matrix") { const n = Math.ceil(W / 14); for (let i = 0; i < n; i++) cols.push({ x: i * 14, y: Math.random() * H, sp: 2 + Math.random() * 5 }); }
          return function (ctx) {
            t++;
            if (type === "matrix") {
              ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
              ctx.font = "14px monospace"; ctx.textAlign = "left";
              for (const col of cols) {
                col.y += col.sp; if (col.y > H + 40) col.y = -20;
                for (let k = 0; k < 16; k++) {
                  const yy = col.y - k * 14; if (yy < 0 || yy > H) continue;
                  ctx.fillStyle = k === 0 ? "rgba(220,255,220,0.95)" : "rgba(0,255,90," + Math.max(0, 0.55 - k * 0.035) + ")";
                  ctx.fillText(String.fromCharCode(0x30A0 + ((Math.random() * 96) | 0)), col.x, yy);
                }
              }
            } else if (type === "space") {
              ctx.fillStyle = "#05060f"; ctx.fillRect(0, 0, W, H);
              for (const s of stars) { s.y += s.z * 0.5; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } ctx.globalAlpha = Math.min(1, s.z / 2 + 0.3); ctx.fillStyle = "#fff"; ctx.fillRect(s.x, s.y, s.z, s.z); } ctx.globalAlpha = 1;
            } else if (type === "synthwave") {
              const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1a0b2e"); g.addColorStop(0.5, "#3b0d52"); g.addColorStop(1, "#0b0618"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
              ctx.fillStyle = "#ff5fa2"; ctx.beginPath(); ctx.arc(W / 2, H * 0.4, 58, 0, Math.PI * 2); ctx.fill();
              const hz = H * 0.6; ctx.strokeStyle = "rgba(0,255,230,0.4)"; ctx.lineWidth = 1;
              for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(W / 2, hz); ctx.lineTo(W / 2 + i * 70, H); ctx.stroke(); }
              for (let j = 0; j < 14; j++) { const yy = hz + ((t * 2 + j * 36) % (H - hz)); ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
            } else if (type === "sunset") {
              const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#ff9a3c"); g.addColorStop(0.5, "#ff5fa2"); g.addColorStop(1, "#5b2c8a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            } else if (type === "aurora") {
              ctx.fillStyle = "#04101a"; ctx.fillRect(0, 0, W, H);
              for (let i = 0; i < 3; i++) { const hue = (t * 0.6 + i * 80) % 360; const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "hsla(" + hue + ",90%,60%,0)"); g.addColorStop(0.5, "hsla(" + hue + ",90%,60%,0.3)"); g.addColorStop(1, "hsla(" + ((hue + 70) % 360) + ",90%,60%,0)"); ctx.fillStyle = g; ctx.fillRect(0, 70 + i * 60 + Math.sin(t * 0.02 + i) * 24, W, 130); }
            } else if (type === "fire") {
              const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2a0500"); g.addColorStop(0.6, "#b22207"); g.addColorStop(1, "#ff8a24"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            } else if (type === "ocean") {
              const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0a3a5c"); g.addColorStop(1, "#021018"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
              ctx.strokeStyle = "rgba(120,200,255,0.12)"; for (let j = 0; j < 8; j++) { const yy = (t * 0.6 + j * 80) % H; ctx.beginPath(); ctx.moveTo(0, yy); for (let xx = 0; xx <= W; xx += 20) ctx.lineTo(xx, yy + Math.sin((xx + t) * 0.05) * 6); ctx.stroke(); }
            } else if (type === "disco") {
              const hue = (t * 3) % 360; ctx.fillStyle = "hsl(" + hue + " 70% 12%)"; ctx.fillRect(0, 0, W, H);
              for (let i = 0; i < 6; i++) { ctx.fillStyle = "hsla(" + ((hue + i * 60) % 360) + ",90%,55%,0.12)"; ctx.fillRect((i * 70 + t) % W, 0, 36, H); }
            } else { ctx.fillStyle = "#0a0c18"; ctx.fillRect(0, 0, W, H); }
          };
        }

        // ----- prompt parser -----
        function parse(p) {
          p = (p || "").toLowerCase();
          const numM = p.match(/(\d{1,3})/);
          const circle = /(circle|ring|inside a|donut|hoop|orbit)/.test(p);
          return {
            container: circle ? "circle" : "box",
            count: Math.max(1, Math.min(300, numM ? parseInt(numM[1], 10) : (/(many|lots|bunch|hundred|loads)/.test(p) ? 60 : 1))),
            gravity: /(no gravity|zero ?g|float)/.test(p) ? 0 : (/(low gravity|moon|slow fall|floaty)/.test(p) ? 0.08 : (/(heavy|strong gravity|lots of gravity|more gravity)/.test(p) ? 0.55 : 0.26)),
            grow: /(bigger|grows?|larger|expand|increase|huge each|size up)/.test(p) ? 1.09 : 0,
            shrink: /(smaller|shrinks?|tinier|size down)/.test(p) ? 0.93 : 0,
            split: /(split|multiply|clones?|duplicate|divide|more balls each|spawn)/.test(p),
            speedUp: /(speed ?up|faster|speeds up|accelerat|quicker each)/.test(p) ? 1.07 : 0,
            rainbow: /(rainbow|colou?rs?|changing colou?r|every colou?r|disco)/.test(p),
            trail: /(trail|trails|motion blur|streak|tail)/.test(p),
            wallsClose: /(walls? clos|closing in|shrink.*box|squeeze|smaller box|tighten)/.test(p),
            spin: /(spin|spinning|rotating|rotate)/.test(p),
            bg: detectBg(p)
          };
        }
        function summarize(cfg) {
          const bits = [];
          bits.push(cfg.count > 1 ? cfg.count + " balls" : "1 ball");
          bits.push(cfg.container === "circle" ? "inside a circle" : "in a box");
          if (cfg.grow) bits.push("grows each bounce");
          if (cfg.shrink) bits.push("shrinks each bounce");
          if (cfg.split) bits.push("splits on bounce");
          if (cfg.speedUp) bits.push("speeds up");
          if (cfg.rainbow) bits.push("rainbow");
          if (cfg.trail) bits.push("motion trail");
          if (cfg.wallsClose) bits.push("walls close in");
          if (cfg.spin) bits.push("spinning");
          if (cfg.gravity === 0) bits.push("no gravity"); else if (cfg.gravity < 0.1) bits.push("low gravity"); else if (cfg.gravity > 0.4) bits.push("heavy gravity");
          bits.push("🎨 " + (BG_NAMES[cfg.bg] || "Dark") + " background");
          return "🤖 Made it: " + bits.join(" · ");
        }

        // ----- sim -----
        let balls = [], cfg = null, lastCfg = null, raf = null, wall = 0, spinAng = 0, bgDraw = null;
        const RC = () => W * 0.46;
        const cx = W / 2, cy = H * 0.42;
        function spawn(x0, y0, r0, hue) {
          const ang = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 2;
          return { x: x0, y: y0, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 2, r: r0, hue: hue != null ? hue : Math.floor(Math.random() * 360), bounces: 0 };
        }
        function build(config) {
          cfg = config; lastCfg = config; wall = 0; spinAng = 0; bgDraw = makeBg(cfg.bg);
          bx.clearRect(0, 0, W, H); balls = [];
          const startR = cfg.container === "circle" ? 14 : (cfg.count > 20 ? 7 : (cfg.grow ? 12 : 16));
          for (let i = 0; i < cfg.count; i++) {
            if (cfg.container === "circle") { const a = Math.random() * Math.PI * 2, d = Math.random() * RC() * 0.5; balls.push(spawn(cx + Math.cos(a) * d, cy + Math.sin(a) * d, startR)); }
            else balls.push(spawn(30 + Math.random() * (W - 60), 40 + Math.random() * (H * 0.4), startR));
          }
          read.textContent = summarize(cfg);
          if (!raf) loop();
        }
        function onBounce(b) {
          b.bounces++;
          psound(Math.max(120, Math.min(900, 880 - b.r * 9)));
          const maxR = (cfg.container === "circle" ? RC() * 0.85 : Math.min(W, H) * 0.48);
          if (cfg.grow) { b.r *= cfg.grow; if (b.r > maxR) b.r = cfg.container === "circle" ? maxR : 10; }
          if (cfg.shrink) { b.r *= cfg.shrink; if (b.r < 3) b.r = 16; }
          if (cfg.speedUp) { b.vx *= cfg.speedUp; b.vy *= cfg.speedUp; }
          if (cfg.rainbow) b.hue = (b.hue + 36) % 360;
          if (cfg.split && balls.length < 300) balls.push({ x: b.x, y: b.y, vx: -b.vx + (Math.random() - 0.5) * 2, vy: b.vy * 0.8, r: Math.max(4, b.r * 0.8), hue: (b.hue + 120) % 360, bounces: 0 });
        }
        function clampSpeed(b) { const m = 16, s = Math.hypot(b.vx, b.vy); if (s > m) { b.vx = b.vx / s * m; b.vy = b.vy / s * m; } }
        function step() {
          if (cfg.wallsClose) { const maxWall = Math.min(W, H) * 0.33; if (wall < maxWall) wall += 0.18; }
          if (cfg.spin) spinAng += 0.01;
          for (const b of balls) {
            b.vy += cfg.gravity; b.x += b.vx; b.y += b.vy; clampSpeed(b);
            if (cfg.container === "circle") {
              const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy), lim = RC() - b.r;
              if (d > lim) { const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; b.x = cx + nx * lim; b.y = cy + ny * lim; onBounce(b); }
            } else {
              const L = wall, R = W - wall, T = wall, B = H - wall;
              if (b.x - b.r < L) { b.x = L + b.r; b.vx = Math.abs(b.vx); onBounce(b); }
              else if (b.x + b.r > R) { b.x = R - b.r; b.vx = -Math.abs(b.vx); onBounce(b); }
              if (b.y - b.r < T) { b.y = T + b.r; b.vy = Math.abs(b.vy); onBounce(b); }
              else if (b.y + b.r > B) { b.y = B - b.r; b.vy = -Math.abs(b.vy); onBounce(b); }
            }
          }
        }
        function draw() {
          // 1) live background on the visible canvas
          if (bgDraw) bgDraw(x); else { x.fillStyle = "#0a0c18"; x.fillRect(0, 0, W, H); }
          // 2) ball layer on the buffer (trails persist here, bg stays live)
          if (cfg.trail) { bx.fillStyle = "rgba(0,0,0,0.18)"; bx.fillRect(0, 0, W, H); } else bx.clearRect(0, 0, W, H);
          if (cfg.container === "circle") {
            bx.save(); bx.translate(cx, cy); bx.rotate(spinAng);
            bx.strokeStyle = "rgba(255,255,255,0.35)"; bx.lineWidth = 6; bx.beginPath(); bx.arc(0, 0, RC(), 0, Math.PI * 2); bx.stroke();
            if (cfg.spin) { bx.strokeStyle = "rgba(255,255,255,0.12)"; bx.beginPath(); bx.arc(0, 0, RC(), -0.4, 0.4); bx.stroke(); }
            bx.restore();
          } else { bx.strokeStyle = "rgba(255,255,255,0.22)"; bx.lineWidth = 4; bx.strokeRect(wall + 2, wall + 2, W - wall * 2 - 4, H - wall * 2 - 4); }
          for (const b of balls) {
            bx.beginPath(); bx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            bx.fillStyle = "hsl(" + b.hue + " 90% 60%)"; bx.shadowColor = "hsl(" + b.hue + " 90% 60%)"; bx.shadowBlur = 16; bx.fill(); bx.shadowBlur = 0;
            bx.fillStyle = "rgba(255,255,255,0.35)"; bx.beginPath(); bx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, Math.max(1, b.r * 0.22), 0, Math.PI * 2); bx.fill();
          }
          // 3) composite ball layer over background
          x.drawImage(buf, 0, 0);
          // 4) watermark
          x.fillStyle = "rgba(255,255,255,0.5)"; x.font = "bold 15px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", W / 2, H - 16);
        }
        function loop() { step(); draw(); raf = requestAnimationFrame(loop); }

        function generate() {
          try { const a = actx(); if (a && a.resume) a.resume(); } catch (e) {}
          build(parse(input.value.trim() || "a ball that gets bigger every bounce, matrix background"));
        }
        panel.querySelector("#sballGo").onclick = generate;
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") generate(); });

        // ----- recording -----
        let recording = false, recIv = null;
        function setRecBtns(dis, txt) { [recBtn, fsRecBtn].forEach((b) => { if (b) { b.disabled = dis; b.textContent = txt; } }); }
        function startRec() {
          if (recording) return;
          try { const a = actx(); if (a && a.resume) a.resume(); } catch (e) {}
          if (!window.MediaRecorder) { recNote.textContent = "Recording isn't supported in this browser."; return; }
          let stream;
          try { stream = c.captureStream(60); } catch (e) { recNote.textContent = "Recording isn't supported here."; return; }
          if (recDest) { try { const tr = recDest.stream.getAudioTracks()[0]; if (tr) stream.addTrack(tr); } catch (e) {} }
          const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
          let rec;
          try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); } catch (e) { recNote.textContent = "Recording isn't supported here."; return; }
          const chunks = [];
          rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "satisfying-ball-" + Date.now() + ".webm";
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            recNote.textContent = "✅ Saved to your downloads! Upload it as a YouTube Short.";
            window.MG.toast("🎬", "Short saved!", "Check your downloads folder.");
            window.MG.flag("sball"); window.MG.arcadePlayed(); window.MG.addTreats(15); api.refreshTreats();
            recording = false; setRecBtns(false, "● Record 12s");
          };
          build(lastCfg || parse(input.value));
          rec.start(); recording = true; setRecBtns(true, "● Rec 12s"); recNote.textContent = "🔴 Recording…";
          let left = 12;
          recIv = setInterval(() => { left--; setRecBtns(true, "● Rec " + left + "s"); if (left <= 0) { clearInterval(recIv); try { rec.stop(); } catch (e) {} } }, 1000);
          api.onClean(() => { clearInterval(recIv); try { if (rec.state !== "inactive") rec.stop(); } catch (e) {} });
        }
        recBtn.onclick = startRec; fsRecBtn.onclick = startRec;

        api.onClean(() => { if (raf) cancelAnimationFrame(raf); raf = null; try { exitFull(); } catch (e) {} });
        build(parse("a ball that gets bigger every bounce, matrix background"));
      }
    }
  ];

  // ---------- open hooks ----------
  window.MG_ARCADE = { open: openArcade, close: closeArcade };
  function wireBtn() { const b = document.getElementById("arcadeBtn"); if (b) b.onclick = openArcade; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireBtn); else wireBtn();
})();
