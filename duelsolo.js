// ===== MaxwellGames: solo "run" versions of every duel — used for ONLINE score-duels & vs CPU in Battle =====
(function () {
  function cv(host, w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; c.className = "ar-canvas"; host.appendChild(c); return c; }
  function hint(host, html) { const p = document.createElement("p"); p.className = "ar-hint"; p.innerHTML = html; host.appendChild(p); }
  let MAXIMG = null;
  function maxImg(api) { if (!MAXIMG) { MAXIMG = new Image(); MAXIMG.src = (api && api.img) || (document.querySelector(".logo-img") || {}).src || "maxwell.png"; } return MAXIMG; }
  function drawMax(x, cx, cy, r, img) { if (img && img.complete && img.naturalWidth) { x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.closePath(); x.clip(); x.drawImage(img, cx - r, cy - r, r * 2, r * 2); x.restore(); } else { x.fillStyle = "#fff"; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } }

  const SOLO = {
    // Pong → keep the ball up, most hits wins
    pong(host, api, done) {
      const W = 420, H = 300, c = cv(host, W, H), x = c.getContext("2d"); const cat = maxImg(api);
      hint(host, "Keep Maxwell up! <b>A/D</b> or drag. +1 per bounce.");
      let px = W / 2, bx = W / 2, by = 60, vx = 3, vy = 3, score = 0, over = false, raf; const keys = {}, PW = 70;
      function loop() {
        x.fillStyle = "#0e1730"; x.fillRect(0, 0, W, H);
        if (!over) { if (keys["a"]) px -= 7; if (keys["d"]) px += 7; px = Math.max(PW / 2, Math.min(W - PW / 2, px)); bx += vx; by += vy; if (bx < 8 || bx > W - 8) vx *= -1; if (by < 8) vy = Math.abs(vy); if (by > H - 24 && bx > px - PW / 2 && bx < px + PW / 2 && vy > 0) { vy = -Math.abs(vy) * 1.03; vx += (bx - px) * 0.05; score++; api.tone(500, 0.04); } if (by > H) { over = true; cancelAnimationFrame(raf); return done(score); } }
        x.fillStyle = "#3ee08f"; x.fillRect(px - PW / 2, H - 14, PW, 8); drawMax(x, bx, by, 13, cat); x.fillStyle = "#fff"; x.font = "bold 22px system-ui"; x.textAlign = "left"; x.fillText("Hits: " + score, 10, 26);
        raf = requestAnimationFrame(loop);
      }
      const kd = (e) => { const k = e.key.toLowerCase(); if (["a", "d"].includes(k)) { keys[k] = true; e.preventDefault(); } }; const ku = (e) => keys[e.key.toLowerCase()] = false;
      document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
      const mv = (e) => { const r = c.getBoundingClientRect(); px = (e.clientX - r.left) * (W / r.width); }; c.addEventListener("pointermove", mv);
      api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); }); loop();
    },
    // Tug → mash for 8s
    tug(host, api, done) {
      const W = 420, H = 160, c = cv(host, W, H), x = c.getContext("2d");
      hint(host, "MASH <b>Space</b> or tap as fast as you can for <b>8s</b>!");
      let n = 0, t = 8, over = false, raf;
      function loop() { x.fillStyle = "#101a2e"; x.fillRect(0, 0, W, H); x.fillStyle = "#3ee08f"; x.fillRect(0, H - 20, Math.min(W, n / 60 * W), 20); x.fillStyle = "#fff"; x.font = "bold 30px system-ui"; x.textAlign = "center"; x.fillText("Mashes: " + n, W / 2, 60); x.font = "bold 20px system-ui"; x.fillText("⏱️ " + t, W / 2, 100); if (!over) raf = requestAnimationFrame(loop); }
      const bump = () => { if (over) return; n++; api.tone(400 + n * 3, 0.02); }; const kd = (e) => { if (e.key === " ") { e.preventDefault(); bump(); } }; document.addEventListener("keydown", kd); c.addEventListener("pointerdown", bump);
      const iv = setInterval(() => { t--; if (t <= 0) { over = true; clearInterval(iv); cancelAnimationFrame(raf); done(n); } }, 1000);
      api.onClean(() => { clearInterval(iv); cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); }); loop();
    },
    // Reaction → 3 rounds, faster = higher score
    react(host, api, done) {
      const pad = document.createElement("div"); pad.className = "duel-pad wait"; pad.textContent = "Click to start"; host.appendChild(pad);
      hint(host, "When it turns <b>GREEN</b>, click! 3 rounds — faster is better.");
      let state = "idle", t0 = 0, timer, rounds = [];
      function arm() { state = "ready"; pad.className = "duel-pad ready"; pad.textContent = "Wait…"; timer = setTimeout(() => { state = "go"; t0 = performance.now(); pad.className = "duel-pad go"; pad.textContent = "CLICK!"; api.tone(880, 0.08); }, 1000 + Math.random() * 2600); }
      pad.onclick = () => { if (state === "idle") arm(); else if (state === "ready") { clearTimeout(timer); pad.className = "duel-pad wait"; pad.textContent = "Too early! Click to retry"; state = "idle"; api.tone(160, 0.15, "sawtooth"); } else if (state === "go") { const ms = performance.now() - t0; rounds.push(ms); api.tone(660, 0.08); if (rounds.length >= 3) { const avg = rounds.reduce((a, b) => a + b) / 3; state = "done"; pad.className = "duel-pad wait"; pad.textContent = Math.round(avg) + "ms avg"; done(Math.max(0, Math.round(1500 - avg))); } else { pad.className = "duel-pad wait"; pad.textContent = Math.round(ms) + "ms — click for next"; state = "idle"; } } };
      api.onClean(() => clearTimeout(timer));
    },
    // Light Cycles → survive, score = time
    tron(host, api, done) {
      const SZ = 10, GW = 42, GH = 28, W = GW * SZ, H = GH * SZ, c = cv(host, W, H), x = c.getContext("2d");
      hint(host, "Survive! <b>Arrow keys / WASD</b>. Avoid walls &amp; your trail.");
      let grid = {}, p = { x: 5, y: 14, dx: 1, dy: 0 }, over = false, raf, acc = 0, last = 0, frames = 0;
      function tick() { p.x += p.dx; p.y += p.dy; const k = p.x + "," + p.y; if (p.x < 0 || p.y < 0 || p.x >= GW || p.y >= GH || grid[k]) { over = true; cancelAnimationFrame(raf); return done(Math.round(frames / 14)); } grid[k] = 1; frames++; }
      function draw() { x.fillStyle = "#070b16"; x.fillRect(0, 0, W, H); x.fillStyle = "#3ee08f"; for (const k in grid) { const pr = k.split(","); x.fillRect(pr[0] * SZ, pr[1] * SZ, SZ - 1, SZ - 1); } x.fillStyle = "#fff"; x.fillRect(p.x * SZ, p.y * SZ, SZ - 1, SZ - 1); x.font = "bold 16px system-ui"; x.textAlign = "left"; x.fillText("⏱️ " + Math.round(frames / 14), 8, 18); }
      function loop(t) { if (!last) last = t; acc += t - last; last = t; if (!over && acc > 70) { acc = 0; tick(); } if (!over) { draw(); raf = requestAnimationFrame(loop); } }
      const kd = (e) => { const k = e.key.toLowerCase(); const s = (dx, dy) => { if (p.dx !== -dx || p.dy !== -dy) { p.dx = dx; p.dy = dy; } }; if (k === "w" || k === "arrowup") s(0, -1); else if (k === "s" || k === "arrowdown") s(0, 1); else if (k === "a" || k === "arrowleft") s(-1, 0); else if (k === "d" || k === "arrowright") s(1, 0); if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault(); };
      document.addEventListener("keydown", kd); api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); }); raf = requestAnimationFrame(loop);
    },
    // Catch → most fish in 20s
    catch(host, api, done) {
      const W = 420, H = 300, c = cv(host, W, H), x = c.getContext("2d"); const cat = maxImg(api);
      hint(host, "Help Maxwell catch the 🐟! <b>A/D</b> or drag. <b>20s</b>.");
      let bx = W / 2, items = [], score = 0, t = 20, over = false, raf, frame = 0; const keys = {};
      function loop() {
        x.fillStyle = "#0e1526"; x.fillRect(0, 0, W, H);
        if (!over) { if (keys["a"]) bx -= 7; if (keys["d"]) bx += 7; bx = Math.max(26, Math.min(W - 26, bx)); frame++; if (frame % 26 === 0) items.push({ x: 20 + Math.random() * (W - 40), y: -20, v: 3 + Math.random() * 2 }); items.forEach((it) => it.y += it.v); items = items.filter((it) => { if (it.y > H - 40 && it.y < H - 12 && Math.abs(it.x - bx) < 30) { score++; api.tone(660, 0.05); return false; } return it.y < H + 20; }); }
        x.font = "22px system-ui,'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle"; items.forEach((it) => x.fillText("🐟", it.x, it.y));
        x.fillStyle = "#3ee08f"; x.fillRect(bx - 26, H - 10, 52, 8); drawMax(x, bx, H - 24, 18, cat); x.fillStyle = "#fff"; x.font = "bold 20px system-ui"; x.textBaseline = "alphabetic"; x.textAlign = "left"; x.fillText("🐟 " + score, 10, 24); x.textAlign = "right"; x.fillText("⏱️ " + t, W - 10, 24);
        if (!over) raf = requestAnimationFrame(loop);
      }
      const kd = (e) => { const k = e.key.toLowerCase(); if (["a", "d"].includes(k)) { keys[k] = true; e.preventDefault(); } }; const ku = (e) => keys[e.key.toLowerCase()] = false;
      document.addEventListener("keydown", kd); document.addEventListener("keyup", ku); const mv = (e) => { const r = c.getBoundingClientRect(); bx = (e.clientX - r.left) * (W / r.width); }; c.addEventListener("pointermove", mv);
      const iv = setInterval(() => { t--; if (t <= 0) { over = true; clearInterval(iv); cancelAnimationFrame(raf); done(score); } }, 1000);
      api.onClean(() => { clearInterval(iv); cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); }); loop();
    },
    // Dot Grab → most taps in 20s
    fill(host, api, done) {
      const W = 420, H = 280, c = cv(host, W, H), x = c.getContext("2d");
      hint(host, "Tap the 🟡 dots fast! <b>20s</b>.");
      let score = 0, t = 20, dot = null, over = false, raf;
      function spawn() { dot = { x: 30 + Math.random() * (W - 60), y: 30 + Math.random() * (H - 60), r: 22 }; }
      function loop() { x.fillStyle = "#0e1526"; x.fillRect(0, 0, W, H); if (dot) { x.fillStyle = "#ffd84a"; x.beginPath(); x.arc(dot.x, dot.y, dot.r, 0, 7); x.fill(); } x.fillStyle = "#fff"; x.font = "bold 20px system-ui"; x.textAlign = "left"; x.fillText("Score: " + score, 10, 24); x.textAlign = "right"; x.fillText("⏱️ " + t, W - 10, 24); if (!over) raf = requestAnimationFrame(loop); }
      const click = (e) => { if (over || !dot) return; const r = c.getBoundingClientRect(); const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height); if (Math.hypot(mx - dot.x, my - dot.y) < dot.r + 6) { score++; api.tone(600, 0.04); spawn(); } };
      c.addEventListener("pointerdown", click);
      const iv = setInterval(() => { t--; if (t <= 0) { over = true; clearInterval(iv); cancelAnimationFrame(raf); done(score); } }, 1000);
      api.onClean(() => { clearInterval(iv); cancelAnimationFrame(raf); }); spawn(); loop();
    },
    // Soccer → score past the goalie in 20s
    soccer(host, api, done) {
      const W = 420, H = 280, c = cv(host, W, H), x = c.getContext("2d"); const cat = maxImg(api);
      hint(host, "Aim <b>A/D</b>, shoot <b>Space</b>! Blast Maxwell past the goalie. <b>20s</b>.");
      let aim = W / 2, gx = W / 2, gdir = 2.4, score = 0, t = 20, over = false, raf, flash = 0, good = false; const keys = {};
      function loop() {
        x.fillStyle = "#123b1e"; x.fillRect(0, 0, W, H); x.strokeStyle = "#fff"; x.lineWidth = 3; x.strokeRect(60, 28, W - 120, 16);
        gx += gdir; if (gx < 70 || gx > W - 70) gdir *= -1; x.fillStyle = "#ff5fa2"; x.fillRect(gx - 30, 28, 60, 16);
        if (!over) { if (keys["a"]) aim -= 6; if (keys["d"]) aim += 6; aim = Math.max(70, Math.min(W - 70, aim)); }
        x.strokeStyle = "#ffd84a"; x.beginPath(); x.moveTo(aim, H - 20); x.lineTo(aim, 36); x.stroke(); drawMax(x, aim, H - 20, 12, cat);
        if (flash > 0) { x.fillStyle = good ? "#3ee08f" : "#ff4d4d"; x.font = "bold 28px system-ui"; x.textAlign = "center"; x.fillText(good ? "GOAL!" : "SAVED!", W / 2, H / 2); flash--; }
        x.fillStyle = "#fff"; x.font = "bold 20px system-ui"; x.textAlign = "left"; x.fillText("⚽ " + score, 10, 24); x.textAlign = "right"; x.fillText("⏱️ " + t, W - 10, 24);
        if (!over) raf = requestAnimationFrame(loop);
      }
      const shoot = () => { if (over) return; good = Math.abs(aim - gx) > 44; if (good) { score++; api.tone(700, 0.08); } else api.tone(200, 0.1, "sawtooth"); flash = 18; };
      const kd = (e) => { const k = e.key.toLowerCase(); if (k === " ") { e.preventDefault(); shoot(); } if (["a", "d"].includes(k)) { keys[k] = true; e.preventDefault(); } }; const ku = (e) => keys[e.key.toLowerCase()] = false;
      document.addEventListener("keydown", kd); document.addEventListener("keyup", ku); c.addEventListener("pointerdown", shoot);
      const iv = setInterval(() => { t--; if (t <= 0) { over = true; clearInterval(iv); cancelAnimationFrame(raf); done(score); } }, 1000);
      api.onClean(() => { clearInterval(iv); cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); }); loop();
    },
    // Snake → eat the most before crashing
    snakeduel(host, api, done) {
      const SZ = 16, GW = 26, GH = 18, W = GW * SZ, H = GH * SZ, c = cv(host, W, H), x = c.getContext("2d"); const cat = maxImg(api);
      hint(host, "Maxwell eats 🐟 — don't crash! <b>Arrows / WASD</b>.");
      let snake = [{ x: 5, y: 9 }], dir = { x: 1, y: 0 }, nd = dir, score = 0, over = false, raf, acc = 0, last = 0;
      function place() { let f; do { f = { x: (Math.random() * GW) | 0, y: (Math.random() * GH) | 0 }; } while (snake.some((s) => s.x === f.x && s.y === f.y)); return f; }
      let food = place();
      function step() { dir = nd; const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }; if (h.x < 0 || h.y < 0 || h.x >= GW || h.y >= GH || snake.some((s) => s.x === h.x && s.y === h.y)) { over = true; cancelAnimationFrame(raf); return done(score); } snake.unshift(h); if (h.x === food.x && h.y === food.y) { score++; api.tone(700, 0.05); food = place(); } else snake.pop(); }
      function draw() { x.fillStyle = "#0a1020"; x.fillRect(0, 0, W, H); x.font = SZ + "px system-ui,'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("🐟", food.x * SZ + SZ / 2, food.y * SZ + SZ / 2); snake.forEach((s, i) => { if (i === 0) { drawMax(x, s.x * SZ + SZ / 2, s.y * SZ + SZ / 2, SZ / 2, cat); } else { x.fillStyle = "#3ee08f"; x.fillRect(s.x * SZ + 1, s.y * SZ + 1, SZ - 2, SZ - 2); } }); x.fillStyle = "#fff"; x.font = "bold 16px system-ui"; x.textBaseline = "alphabetic"; x.textAlign = "left"; x.fillText("🐟 " + score, 6, 18); }
      function loop(t) { if (!last) last = t; acc += t - last; last = t; if (!over && acc > 110) { acc = 0; step(); } if (!over) { draw(); raf = requestAnimationFrame(loop); } }
      const kd = (e) => { const k = e.key.toLowerCase(); const s = (dx, dy) => { if (dir.x !== -dx || dir.y !== -dy) nd = { x: dx, y: dy }; }; if (k === "w" || k === "arrowup") s(0, -1); else if (k === "s" || k === "arrowdown") s(0, 1); else if (k === "a" || k === "arrowleft") s(-1, 0); else if (k === "d" || k === "arrowright") s(1, 0); if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault(); };
      document.addEventListener("keydown", kd); api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); }); raf = requestAnimationFrame(loop);
    },
    // Mash → most presses in 10s
    mash(host, api, done) {
      const W = 420, H = 160, c = cv(host, W, H), x = c.getContext("2d");
      hint(host, "MASH <b>Space</b> / tap for <b>10s</b>!");
      let n = 0, t = 10, over = false, raf;
      function loop() { x.fillStyle = "#0e1526"; x.fillRect(0, 0, W, H); x.fillStyle = "#ff5fa2"; x.fillRect(0, H - 18, Math.min(W, n / 80 * W), 18); x.fillStyle = "#fff"; x.font = "bold 30px system-ui"; x.textAlign = "center"; x.fillText(n + " mashes", W / 2, 60); x.font = "bold 20px system-ui"; x.fillText("⏱️ " + t, W / 2, 100); if (!over) raf = requestAnimationFrame(loop); }
      const bump = () => { if (over) return; n++; api.tone(400 + n * 3, 0.02); }; const kd = (e) => { if (e.key === " ") { e.preventDefault(); bump(); } }; document.addEventListener("keydown", kd); c.addEventListener("pointerdown", bump);
      const iv = setInterval(() => { t--; if (t <= 0) { over = true; clearInterval(iv); cancelAnimationFrame(raf); done(n); } }, 1000);
      api.onClean(() => { clearInterval(iv); cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); }); loop();
    },
    // Quick Math → most correct in 20s
    qmath(host, api, done) {
      hint(host, "Answer as many as you can in <b>20s</b>!");
      const q = document.createElement("h3"); q.className = "md-q"; host.appendChild(q); const opts = document.createElement("div"); opts.className = "trivia-opts"; host.appendChild(opts); const msg = document.createElement("p"); msg.className = "ar-hint"; host.appendChild(msg);
      let score = 0, t = 20, over = false;
      function ask() { if (over) return; const a = 2 + (Math.random() * 11 | 0), b = 2 + (Math.random() * 11 | 0), op = Math.random() < 0.5 ? "+" : "×"; const ans = op === "+" ? a + b : a * b; q.textContent = a + " " + op + " " + b + " = ?"; const set = new Set([ans]); while (set.size < 3) { const w = ans + (Math.random() * 10 | 0) - 5; if (w > 0) set.add(w); } const o = [...set].sort(() => Math.random() - 0.5); opts.innerHTML = ""; o.forEach((v) => { const bn = document.createElement("button"); bn.className = "btn trivia-opt"; bn.textContent = v; bn.onclick = () => { if (over) return; if (v === ans) { score++; api.tone(800, 0.06); } else api.tone(180, 0.1, "sawtooth"); msg.textContent = "Score: " + score; ask(); }; opts.appendChild(bn); }); }
      ask(); msg.textContent = "Score: 0";
      const iv = setInterval(() => { t--; if (t <= 0) { over = true; clearInterval(iv); done(score); } }, 1000);
      api.onClean(() => clearInterval(iv));
    },
    // Dodge → survive longest
    dodgeduel(host, api, done) {
      const W = 420, H = 320, c = cv(host, W, H), x = c.getContext("2d");
      hint(host, "Dodge the ☄️! <b>A/D</b> or drag. Survive as long as you can!");
      let px = W / 2, rocks = [], over = false, raf, frame = 0; const keys = {};
      function loop() {
        x.fillStyle = "#0b1020"; x.fillRect(0, 0, W, H);
        if (!over) { if (keys["a"]) px -= 7; if (keys["d"]) px += 7; px = Math.max(16, Math.min(W - 16, px)); frame++; if (frame % 14 === 0) rocks.push({ x: 16 + Math.random() * (W - 32), y: -20, v: 3 + Math.random() * 2 + frame / 600 }); rocks.forEach((r) => r.y += r.v); rocks = rocks.filter((r) => r.y < H + 20); rocks.forEach((r) => { if (r.y > H - 44 && r.y < H - 8 && Math.abs(r.x - px) < 20) over = true; }); if (over) { cancelAnimationFrame(raf); return done(Math.round(frame / 60)); } }
        x.font = "22px system-ui,'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle"; rocks.forEach((r) => x.fillText("☄️", r.x, r.y)); x.fillText("🐱", px, H - 22);
        x.fillStyle = "#fff"; x.font = "bold 20px system-ui"; x.textBaseline = "alphabetic"; x.textAlign = "left"; x.fillText("⏱️ " + Math.round(frame / 60) + "s", 10, 24);
        if (!over) raf = requestAnimationFrame(loop);
      }
      const kd = (e) => { const k = e.key.toLowerCase(); if (["a", "d"].includes(k)) { keys[k] = true; e.preventDefault(); } }; const ku = (e) => keys[e.key.toLowerCase()] = false;
      document.addEventListener("keydown", kd); document.addEventListener("keyup", ku); const mv = (e) => { const r = c.getBoundingClientRect(); px = (e.clientX - r.left) * (W / r.width); }; c.addEventListener("pointermove", mv);
      api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); }); loop();
    }
  };

  window.MG_DUELSOLO = SOLO;
})();
