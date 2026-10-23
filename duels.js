// ===== MaxwellGames: DUELS — 1v1 on one keyboard (play with a friend!) =====
(function () {
  let AC;
  function tone(f, d, ty, v) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = ty || "square"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} }
  const give = (n) => { try { if (window.MG) window.MG.addTreats(n); } catch (e) {} };

  let reg = [];
  function cleanup() { reg.forEach((fn) => { try { fn(); } catch (e) {} }); reg = []; }
  function onClean(fn) { reg.push(fn); }
  function canvas(host, w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; c.className = "ar-canvas"; host.appendChild(c); return c; }
  let MAXIMG = null;
  function maxImg() { if (!MAXIMG) { MAXIMG = new Image(); MAXIMG.src = (document.querySelector(".logo-img") || {}).src || "maxwell.png"; } return MAXIMG; }
  function drawMax(x, cx, cy, r) { const img = maxImg(); if (img && img.complete && img.naturalWidth) { x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.closePath(); x.clip(); x.drawImage(img, cx - r, cy - r, r * 2, r * 2); x.restore(); } else { x.fillStyle = "#fff"; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } }

  function close() { cleanup(); const o = document.getElementById("duelOv"); if (o) { if (o._esc) document.removeEventListener("keydown", o._esc); o.remove(); } }

  function open() {
    close();
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = "duelOv";
    ov.innerHTML = `
      <div class="arcade-box">
        <div class="arcade-head">
          <button class="btn ar-back hidden" id="dBack">← Duels</button>
          <h2 id="dTitle">⚔️ Maxwell Duels</h2>
          <button class="btn ar-x" id="dClose" aria-label="Close">✕</button>
        </div>
        <div class="arcade-body menu" id="dBody"></div>
      </div>`;
    document.body.appendChild(ov);
    document.getElementById("dClose").onclick = close;
    document.getElementById("dBack").onclick = menu;
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    const esc = (e) => { if (e.key !== "Escape") return; const back = document.getElementById("dBack"); if (!back) return; if (!back.classList.contains("hidden")) menu(); else close(); };
    document.addEventListener("keydown", esc); ov._esc = esc;
    menu();
  }

  let duelMode = "local"; // "local" (2-player) or "solo"
  function menu() {
    cleanup();
    document.getElementById("dBack").classList.add("hidden");
    document.getElementById("dTitle").textContent = "⚔️ Maxwell Duels";
    const body = document.getElementById("dBody");
    body.className = "arcade-body menu"; body.innerHTML = "";
    const toggle = document.createElement("div"); toggle.className = "duel-modes";
    toggle.innerHTML = '<button class="duel-mode' + (duelMode === "local" ? " on" : "") + '" data-m="local">👥 2-Player</button><button class="duel-mode' + (duelMode === "solo" ? " on" : "") + '" data-m="solo">🙋 Solo</button>';
    toggle.querySelectorAll(".duel-mode").forEach((b) => b.onclick = () => { duelMode = b.dataset.m; menu(); });
    body.appendChild(toggle);
    const note = document.createElement("div"); note.className = "ar-news";
    note.innerHTML = duelMode === "solo"
      ? "<b>🙋 Solo mode — play a one-player version of any duel!</b> Chase a high score and earn 🐟. (Switch to 2-Player to play a friend on the same keyboard.)"
      : "<b>⚔️ 1v1 your friend on the same keyboard!</b> Green = Player 1, Pink = Player 2. Winner gets 🐟. (Switch to 🙋 Solo to play alone!)";
    body.appendChild(note);
    const grid = document.createElement("div"); grid.className = "ar-grid";
    DUELS.forEach((d) => {
      const solo = duelMode === "solo" && window.MG_DUELSOLO && window.MG_DUELSOLO[d.key];
      if (duelMode === "solo" && !(window.MG_DUELSOLO && window.MG_DUELSOLO[d.key])) return; // skip if no solo version
      const t = document.createElement("button"); t.className = "ar-tile is-new";
      t.innerHTML = `<span class="ar-ic"></span><span class="ar-name"></span><span class="ar-best"></span>`;
      t.querySelector(".ar-ic").textContent = d.icon; t.querySelector(".ar-name").textContent = d.name; t.querySelector(".ar-best").textContent = duelMode === "solo" ? "Solo • high score" : d.tag;
      t.onclick = () => launch(d); grid.appendChild(t);
    });
    body.appendChild(grid);
  }

  function launch(d) {
    cleanup();
    document.getElementById("dBack").classList.remove("hidden");
    document.getElementById("dTitle").textContent = d.icon + " " + d.name + (duelMode === "solo" ? " (Solo)" : "");
    const body = document.getElementById("dBody"); body.className = "arcade-body game"; body.innerHTML = "";
    if (duelMode === "solo" && window.MG_DUELSOLO && window.MG_DUELSOLO[d.key]) {
      const api = { tone, onClean, img: (document.querySelector(".logo-img") || {}).src || "maxwell.png" };
      try { window.MG_DUELSOLO[d.key](body, api, (score) => soloResult(d, score)); } catch (e) { body.innerHTML = "<p class='ar-hint'>That hiccuped — go back and retry.</p>"; }
    } else {
      const api = { tone, onClean, win: (p, line) => result(d, p, line) };
      try { d.play(body, api); } catch (e) { body.innerHTML = "<p class='ar-hint'>That duel hiccuped — go back and retry.</p>"; }
    }
    maxwellMascot(body);
  }

  function soloResult(d, score) {
    cleanup();
    const rew = Math.max(5, Math.min(120, Math.round(score)));
    give(rew);
    try { if (window.MG) window.MG.flag("duel"); } catch (e) {}
    const body = document.getElementById("dBody"); body.className = "arcade-body result"; body.innerHTML = `
      <div class="ar-result">
        <h2 class="ar-res-title">Your score: ${score}</h2>
        <p class="ar-score">Nice solo run! 🙋</p>
        <p class="ar-reward">+${rew} 🐟</p>
        <div class="ar-res-btns"><button class="btn asc-btn" id="dAgain">↻ Play again</button><button class="btn" id="dMenu">⚔️ Duels</button></div>
      </div>`;
    document.getElementById("dAgain").onclick = () => launch(d);
    document.getElementById("dMenu").onclick = menu;
    try { window.MG.boomSound(0.1); } catch (e) {}
  }
  function maxwellMascot(container) { if (!container || container.querySelector(".game-maxwell")) return; const im = document.createElement("img"); im.className = "game-maxwell"; im.src = (document.querySelector(".logo-img") || {}).src || "maxwell.png"; im.alt = "Maxwell"; container.appendChild(im); }

  function result(d, winner, line) {
    cleanup();
    give(winner ? 30 : 10);
    try { if (window.MG && winner) window.MG.flag("duel"); } catch (e) {}
    const body = document.getElementById("dBody"); body.className = "arcade-body result"; body.innerHTML = `
      <div class="ar-result">
        <h2 class="ar-res-title"></h2>
        <p class="ar-score"></p>
        <p class="ar-reward">Winner +30 🐟</p>
        <div class="ar-res-btns"><button class="btn asc-btn" id="dAgain">↻ Rematch</button><button class="btn" id="dMenu">⚔️ Duels</button></div>
      </div>`;
    body.querySelector(".ar-res-title").textContent = winner === 1 ? "🟢 Player 1 Wins!" : winner === 2 ? "🩷 Player 2 Wins!" : "Draw!";
    body.querySelector(".ar-score").innerHTML = line || "";
    document.getElementById("dAgain").onclick = () => launch(d);
    document.getElementById("dMenu").onclick = menu;
    try { window.MG.boomSound(0.1); } catch (e) {}
  }

  const DUELS = [
    // ---------- Pong Duel ----------
    {
      key: "pong", name: "Pong Duel", icon: "🏓", tag: "P1: W/S · P2: ↑/↓",
      play(host, api) {
        const W = 440, H = 300; const c = canvas(host, W, H); const x = c.getContext("2d");
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "First to <b>7</b>. 🟢 Player 1 = <b>W / S</b> · 🩷 Player 2 = <b>↑ / ↓</b>"; host.appendChild(hint);
        let l = H / 2, r = H / 2, bx = W / 2, by = H / 2, vx = 3.6, vy = 2, s1 = 0, s2 = 0, over = false, raf;
        const PH = 60, PW = 10, keys = {};
        function reset(dir) { bx = W / 2; by = H / 2; vx = 3.6 * dir; vy = Math.random() * 3 - 1.5; }
        function loop() {
          x.fillStyle = "#0e1730"; x.fillRect(0, 0, W, H);
          x.strokeStyle = "#2a3760"; x.setLineDash([6, 8]); x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke(); x.setLineDash([]);
          if (!over) {
            if (keys["w"]) l -= 5; if (keys["s"]) l += 5; if (keys["arrowup"]) r -= 5; if (keys["arrowdown"]) r += 5;
            l = Math.max(PH / 2, Math.min(H - PH / 2, l)); r = Math.max(PH / 2, Math.min(H - PH / 2, r));
            bx += vx; by += vy; if (by < 6 || by > H - 6) vy *= -1;
            if (bx < 18 + PW && by > l - PH / 2 && by < l + PH / 2) { vx = Math.abs(vx) * 1.04; vy += (by - l) * 0.04; api.tone(400, 0.04); }
            if (bx > W - 18 - PW && by > r - PH / 2 && by < r + PH / 2) { vx = -Math.abs(vx) * 1.04; vy += (by - r) * 0.04; api.tone(600, 0.04); }
            if (bx < 0) { s2++; if (s2 >= 7) return end(); reset(1); } if (bx > W) { s1++; if (s1 >= 7) return end(); reset(-1); }
          }
          x.fillStyle = "#3ee08f"; x.fillRect(12, l - PH / 2, PW, PH); x.fillStyle = "#ff5fa2"; x.fillRect(W - 12 - PW, r - PH / 2, PW, PH);
          drawMax(x, bx, by, 9); x.fillStyle = "#fff"; x.font = "bold 26px system-ui"; x.textAlign = "center"; x.fillText(s1 + "   " + s2, W / 2, 32);
          raf = requestAnimationFrame(loop);
        }
        function end() { over = true; cancelAnimationFrame(raf); api.win(s1 >= 7 ? 1 : 2, "Final: " + s1 + " — " + s2); }
        const kd = (e) => { const k = e.key.toLowerCase(); if (["w", "s", "arrowup", "arrowdown"].includes(k)) { keys[k] = true; e.preventDefault(); } };
        const ku = (e) => { keys[e.key.toLowerCase()] = false; };
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        reset(Math.random() < 0.5 ? 1 : -1); loop();
      }
    },

    // ---------- Tug of War ----------
    {
      key: "tug", name: "Tug of War", icon: "🪢", tag: "P1: mash A · P2: mash L",
      play(host, api) {
        const W = 440, H = 220; const c = canvas(host, W, H); const x = c.getContext("2d");
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "MASH your key! 🟢 Player 1 = <b>A</b> · 🩷 Player 2 = <b>L</b>. Pull the Maxwell past your line!"; host.appendChild(hint);
        const cat = new Image(); cat.src = (document.querySelector(".logo-img") || {}).src || "maxwell.png";
        let pos = 0, over = false, raf, go = false, cd = 3;
        function loop() {
          x.fillStyle = "#101a2e"; x.fillRect(0, 0, W, H);
          x.strokeStyle = "#3ee08f"; x.lineWidth = 4; x.beginPath(); x.moveTo(70, 0); x.lineTo(70, H); x.stroke();
          x.strokeStyle = "#ff5fa2"; x.beginPath(); x.moveTo(W - 70, 0); x.lineTo(W - 70, H); x.stroke();
          const mx = W / 2 + pos;
          x.strokeStyle = "rgba(255,255,255,0.3)"; x.lineWidth = 3; x.beginPath(); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
          if (cat.complete) x.drawImage(cat, mx - 26, H / 2 - 26, 52, 52); else { x.fillStyle = "#ffd84a"; x.beginPath(); x.arc(mx, H / 2, 22, 0, 7); x.fill(); }
          x.fillStyle = "#fff"; x.font = "bold 18px system-ui"; x.textAlign = "center";
          if (!go) { x.font = "bold 40px system-ui"; x.fillText(cd > 0 ? cd : "PULL!", W / 2, H / 2 - 50); }
          raf = requestAnimationFrame(loop);
        }
        const tick = setInterval(() => { cd--; if (cd <= 0) { go = true; clearInterval(tick); api.tone(800, 0.1); } else api.tone(400, 0.08); }, 800);
        function end(p) { over = true; cancelAnimationFrame(raf); clearInterval(tick); api.win(p, p === 1 ? "Player 1 pulled Maxwell home!" : "Player 2 pulled Maxwell home!"); }
        const kd = (e) => { if (over || !go) return; const k = e.key.toLowerCase(); if (k === "a") { pos -= 7; api.tone(500, 0.03); } else if (k === "l") { pos += 7; api.tone(620, 0.03); } if (W / 2 + pos < 72) end(1); if (W / 2 + pos > W - 72) end(2); };
        document.addEventListener("keydown", kd);
        api.onClean(() => { cancelAnimationFrame(raf); clearInterval(tick); document.removeEventListener("keydown", kd); });
        loop();
      }
    },

    // ---------- Reaction Duel ----------
    {
      key: "react", name: "Reaction Duel", icon: "⚡", tag: "P1: A · P2: L",
      play(host, api) {
        const pad = document.createElement("div"); pad.className = "duel-pad wait"; pad.textContent = "Get ready…"; host.appendChild(pad);
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "When it turns <b style='color:#3ee08f'>GREEN</b>, smash your key! 🟢 P1 = <b>A</b> · 🩷 P2 = <b>L</b>. Too early = you lose the round."; host.appendChild(hint);
        let state = "wait", timer, w1 = 0, w2 = 0;
        function round() {
          state = "ready"; pad.className = "duel-pad ready"; pad.textContent = "Wait for green…";
          timer = setTimeout(() => { state = "go"; pad.className = "duel-pad go"; pad.textContent = "SMASH YOUR KEY!"; api.tone(880, 0.08); }, 1200 + Math.random() * 2600);
        }
        function roundWin(p) {
          if (p === 1) w1++; else w2++;
          pad.className = "duel-pad wait"; pad.textContent = (p === 1 ? "🟢 P1" : "🩷 P2") + " takes it!  (" + w1 + " - " + w2 + ")"; state = "wait";
          api.tone(p === 1 ? 660 : 440, 0.1);
          if (w1 >= 3 || w2 >= 3) { setTimeout(() => api.win(w1 >= 3 ? 1 : 2, "Best of 5: " + w1 + " — " + w2), 600); }
          else setTimeout(round, 900);
        }
        const kd = (e) => {
          const k = e.key.toLowerCase(); if (k !== "a" && k !== "l") return;
          if (state === "ready") { clearTimeout(timer); const other = k === "a" ? 2 : 1; pad.textContent = (k === "a" ? "🟢 P1" : "🩷 P2") + " jumped early!"; api.tone(160, 0.15, "sawtooth"); state = "wait"; setTimeout(round, 900); }
          else if (state === "go") { roundWin(k === "a" ? 1 : 2); }
        };
        document.addEventListener("keydown", kd);
        api.onClean(() => { clearTimeout(timer); document.removeEventListener("keydown", kd); });
        setTimeout(round, 700);
      }
    },

    // ---------- Light Cycles (Tron) ----------
    {
      key: "tron", name: "Light Cycles", icon: "🏍️", tag: "P1: WASD · P2: arrows",
      play(host, api) {
        const SZ = 10, GW = 44, GH = 30, W = GW * SZ, H = GH * SZ; const c = canvas(host, W, H); const x = c.getContext("2d");
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "Don't crash into the walls or trails! 🟢 P1 = <b>WASD</b> · 🩷 P2 = <b>arrow keys</b>"; host.appendChild(hint);
        let grid, p1, p2, over, raf, acc = 0, last = 0, started = false, cd = 3;
        function reset() { grid = {}; p1 = { x: 6, y: 15, dx: 1, dy: 0, dead: false }; p2 = { x: GW - 7, y: 15, dx: -1, dy: 0, dead: false }; over = false; started = false; cd = 3; }
        reset();
        function stepP(p) { if (p.dead) return; p.x += p.dx; p.y += p.dy; const k = p.x + "," + p.y; if (p.x < 0 || p.y < 0 || p.x >= GW || p.y >= GH || grid[k]) { p.dead = true; return; } grid[k] = p === p1 ? 1 : 2; }
        function tick() {
          stepP(p1); stepP(p2);
          if (p1.dead || p2.dead) { over = true; api.tone(160, 0.2, "sawtooth"); let winner = p1.dead && p2.dead ? 0 : p1.dead ? 2 : 1; setTimeout(() => api.win(winner, winner === 0 ? "Both crashed!" : (winner === 1 ? "Player 1" : "Player 2") + " survived!"), 500); }
        }
        function draw() {
          x.fillStyle = "#070b16"; x.fillRect(0, 0, W, H);
          for (const k in grid) { const parts = k.split(","); x.fillStyle = grid[k] === 1 ? "#3ee08f" : "#ff5fa2"; x.fillRect(parts[0] * SZ, parts[1] * SZ, SZ - 1, SZ - 1); }
          x.fillStyle = "#fff"; x.fillRect(p1.x * SZ, p1.y * SZ, SZ - 1, SZ - 1); x.fillRect(p2.x * SZ, p2.y * SZ, SZ - 1, SZ - 1);
          if (!started) { x.fillStyle = "#fff"; x.font = "bold 40px system-ui"; x.textAlign = "center"; x.fillText(cd > 0 ? cd : "GO!", W / 2, H / 2); }
        }
        function loop(t) { if (!last) last = t; acc += t - last; last = t; if (started && !over && acc > 70) { acc = 0; tick(); } draw(); if (!over) raf = requestAnimationFrame(loop); }
        const ct = setInterval(() => { cd--; if (cd <= 0) { started = true; clearInterval(ct); api.tone(800, 0.1); } else api.tone(400, 0.08); }, 800);
        const kd = (e) => { const k = e.key.toLowerCase(); const set = (p, dx, dy) => { if (p.dx !== -dx || p.dy !== -dy) { p.dx = dx; p.dy = dy; } };
          if (k === "w") set(p1, 0, -1); else if (k === "s") set(p1, 0, 1); else if (k === "a") set(p1, -1, 0); else if (k === "d") set(p1, 1, 0);
          else if (k === "arrowup") set(p2, 0, -1); else if (k === "arrowdown") set(p2, 0, 1); else if (k === "arrowleft") set(p2, -1, 0); else if (k === "arrowright") set(p2, 1, 0);
          if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)) e.preventDefault(); };
        document.addEventListener("keydown", kd);
        api.onClean(() => { cancelAnimationFrame(raf); clearInterval(ct); document.removeEventListener("keydown", kd); });
        raf = requestAnimationFrame(loop);
      }
    },

    // ---------- Catch Duel ----------
    {
      key: "catch", name: "Catch Duel", icon: "🧺", tag: "P1: A/D · P2: ←/→",
      play(host, api) {
        const W = 440, H = 300; const c = canvas(host, W, H); const x = c.getContext("2d");
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "Catch the falling 🐟 on your half! First to <b>12</b>. 🟢 P1 = <b>A/D</b> · 🩷 P2 = <b>←/→</b>"; host.appendChild(hint);
        let b1 = W / 4, b2 = 3 * W / 4, s1 = 0, s2 = 0, items = [], over = false, raf, frame = 0; const keys = {};
        function loop() {
          x.fillStyle = "#0e1526"; x.fillRect(0, 0, W, H); x.strokeStyle = "rgba(255,255,255,0.15)"; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke();
          if (!over) {
            if (keys["a"]) b1 -= 6; if (keys["d"]) b1 += 6; if (keys["arrowleft"]) b2 -= 6; if (keys["arrowright"]) b2 += 6;
            b1 = Math.max(26, Math.min(W / 2 - 26, b1)); b2 = Math.max(W / 2 + 26, Math.min(W - 26, b2));
            frame++; if (frame % 34 === 0) items.push({ x: 20 + Math.random() * (W - 40), y: -20, v: 2.5 + Math.random() * 2 });
            items.forEach((it) => it.y += it.v);
            items = items.filter((it) => {
              if (it.y > H - 42 && it.y < H - 14) { if (it.x < W / 2 && Math.abs(it.x - b1) < 28) { s1++; api.tone(660, 0.05); return false; } if (it.x >= W / 2 && Math.abs(it.x - b2) < 28) { s2++; api.tone(440, 0.05); return false; } }
              return it.y < H + 20;
            });
            if (s1 >= 12 || s2 >= 12) { over = true; cancelAnimationFrame(raf); return api.win(s1 >= 12 ? 1 : 2, "Final: " + s1 + " — " + s2); }
          }
          x.font = "22px system-ui,'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle"; items.forEach((it) => x.fillText("🐟", it.x, it.y));
          x.fillStyle = "#3ee08f"; x.fillRect(b1 - 26, H - 16, 52, 10); x.fillStyle = "#ff5fa2"; x.fillRect(b2 - 26, H - 16, 52, 10);
          x.fillStyle = "#fff"; x.font = "bold 22px system-ui"; x.textBaseline = "alphabetic"; x.textAlign = "left"; x.fillText(s1, 16, 28); x.textAlign = "right"; x.fillText(s2, W - 16, 28);
          raf = requestAnimationFrame(loop);
        }
        const kd = (e) => { const k = e.key.toLowerCase(); if (["a","d","arrowleft","arrowright"].includes(k)) { keys[k] = true; e.preventDefault(); } };
        const ku = (e) => { keys[e.key.toLowerCase()] = false; };
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    },

    // ---------- Box Fill Duel ----------
    {
      key: "fill", name: "Dot Grab", icon: "🟡", tag: "P1: A · P2: L",
      play(host, api) {
        const W = 440, H = 260; const c = canvas(host, W, H); const x = c.getContext("2d");
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "A 🟡 dot appears on a side. If it's on YOUR side, smash your key first! 🟢 P1=<b>A</b> (left) · 🩷 P2=<b>L</b> (right). First to 5."; host.appendChild(hint);
        let s1 = 0, s2 = 0, side = 0, live = false, over = false, raf, nextAt = 0, t = 0, dotx = 0, doty = 0;
        function schedule() { live = false; nextAt = t + 40 + Math.random() * 80; }
        function loop() {
          t++; x.fillStyle = "#0e1526"; x.fillRect(0, 0, W, H);
          x.strokeStyle = "rgba(255,255,255,0.15)"; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke();
          if (!over && !live && t >= nextAt) { live = true; side = Math.random() < 0.5 ? 1 : 2; dotx = side === 1 ? 40 + Math.random() * (W / 2 - 80) : W / 2 + 40 + Math.random() * (W / 2 - 80); doty = 40 + Math.random() * (H - 80); }
          if (live) { x.fillStyle = "#ffd84a"; x.beginPath(); x.arc(dotx, doty, 20, 0, 7); x.fill(); }
          x.fillStyle = "#3ee08f"; x.font = "bold 24px system-ui"; x.textAlign = "left"; x.fillText(s1, 16, 30); x.fillStyle = "#ff5fa2"; x.textAlign = "right"; x.fillText(s2, W - 16, 30);
          raf = requestAnimationFrame(loop);
        }
        function point(p) { if (p === 1) s1++; else s2++; api.tone(p === 1 ? 660 : 440, 0.07); if (s1 >= 5 || s2 >= 5) { over = true; cancelAnimationFrame(raf); api.win(s1 >= 5 ? 1 : 2, "Final: " + s1 + " — " + s2); } else schedule(); }
        const kd = (e) => { if (over) return; const k = e.key.toLowerCase(); if (k !== "a" && k !== "l") return; const presser = k === "a" ? 1 : 2; if (!live) { /* too early: opponent scores */ point(presser === 1 ? 2 : 1); return; } point(side === presser ? presser : (presser === 1 ? 2 : 1)); };
        document.addEventListener("keydown", kd);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); });
        schedule(); loop();
      }
    },

    // ---------- Soccer Duel ----------
    {
      key: "soccer", name: "Soccer Duel", icon: "🥅", tag: "P1: W/S · P2: ↑/↓",
      play(host, api) {
        const W = 460, H = 300; const c = canvas(host, W, H); const x = c.getContext("2d");
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "Knock the ⚽ into your opponent's goal! First to <b>5</b>. 🟢 P1 = <b>W/S</b> · 🩷 P2 = <b>↑/↓</b>"; host.appendChild(hint);
        let l = H / 2, r = H / 2, bx = W / 2, by = H / 2, vx = 3, vy = 1.5, s1 = 0, s2 = 0, over = false, raf; const keys = {}, PH = 70, PW = 12, GH = 110;
        function reset(dir) { bx = W / 2; by = H / 2; vx = 3 * dir; vy = Math.random() * 3 - 1.5; }
        function loop() {
          x.fillStyle = "#123b1e"; x.fillRect(0, 0, W, H); x.strokeStyle = "rgba(255,255,255,.3)"; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke(); x.beginPath(); x.arc(W / 2, H / 2, 40, 0, 7); x.stroke();
          x.strokeStyle = "#3ee08f"; x.lineWidth = 4; x.strokeRect(0, H / 2 - GH / 2, 6, GH); x.strokeStyle = "#ff5fa2"; x.strokeRect(W - 6, H / 2 - GH / 2, 6, GH); x.lineWidth = 1;
          if (!over) {
            if (keys["w"]) l -= 5.5; if (keys["s"]) l += 5.5; if (keys["arrowup"]) r -= 5.5; if (keys["arrowdown"]) r += 5.5;
            l = Math.max(PH / 2, Math.min(H - PH / 2, l)); r = Math.max(PH / 2, Math.min(H - PH / 2, r));
            bx += vx; by += vy; if (by < 8 || by > H - 8) vy *= -1;
            if (bx < 20 + PW && by > l - PH / 2 && by < l + PH / 2) { vx = Math.abs(vx) * 1.05; vy += (by - l) * 0.05; api.tone(400, 0.04); }
            if (bx > W - 20 - PW && by > r - PH / 2 && by < r + PH / 2) { vx = -Math.abs(vx) * 1.05; vy += (by - r) * 0.05; api.tone(600, 0.04); }
            if (bx < 4) { if (by > H / 2 - GH / 2 && by < H / 2 + GH / 2) { s2++; goal(); } else vx = Math.abs(vx); }
            if (bx > W - 4) { if (by > H / 2 - GH / 2 && by < H / 2 + GH / 2) { s1++; goal(); } else vx = -Math.abs(vx); }
          }
          x.fillStyle = "#3ee08f"; x.fillRect(14, l - PH / 2, PW, PH); x.fillStyle = "#ff5fa2"; x.fillRect(W - 14 - PW, r - PH / 2, PW, PH);
          drawMax(x, bx, by, 12);
          x.fillStyle = "#fff"; x.font = "bold 26px system-ui"; x.textBaseline = "alphabetic"; x.fillText(s1 + "   " + s2, W / 2, 30);
          if (!over) raf = requestAnimationFrame(loop);
        }
        function goal() { api.tone(300, 0.15); if (s1 >= 5 || s2 >= 5) { over = true; cancelAnimationFrame(raf); return api.win(s1 >= 5 ? 1 : 2, "Final: " + s1 + " — " + s2); } reset(s1 > s2 ? -1 : 1); }
        const kd = (e) => { const k = e.key.toLowerCase(); if (["w", "s", "arrowup", "arrowdown"].includes(k)) { keys[k] = true; e.preventDefault(); } };
        const ku = (e) => { keys[e.key.toLowerCase()] = false; };
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        reset(Math.random() < 0.5 ? 1 : -1); loop();
      }
    },

    // ---------- Snake Duel ----------
    {
      key: "snakeduel", name: "Snake Duel", icon: "🐍", tag: "P1: WASD · P2: arrows",
      play(host, api) {
        const SZ = 14, GW = 32, GH = 24, W = GW * SZ, H = GH * SZ; const c = canvas(host, W, H); const x = c.getContext("2d");
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "Grab 🐟 to grow. Don't hit walls, yourself, or your rival! 🟢 P1 = <b>WASD</b> · 🩷 P2 = <b>arrows</b>"; host.appendChild(hint);
        let s1, s2, food, over, raf, acc = 0, last = 0, started, cd;
        function reset() { s1 = { b: [{ x: 6, y: 12 }], d: { x: 1, y: 0 }, nd: { x: 1, y: 0 }, dead: false }; s2 = { b: [{ x: GW - 7, y: 12 }], d: { x: -1, y: 0 }, nd: { x: -1, y: 0 }, dead: false }; food = place(); over = false; started = false; cd = 3; }
        function place() { let f; do { f = { x: (Math.random() * GW) | 0, y: (Math.random() * GH) | 0 }; } while (occ(f.x, f.y)); return f; }
        function occ(xx, yy) { return s1.b.concat(s2.b).some((p) => p.x === xx && p.y === yy); }
        function stepSnake(s, other) { if (s.dead) return; s.d = s.nd; const h = { x: s.b[0].x + s.d.x, y: s.b[0].y + s.d.y }; if (h.x < 0 || h.y < 0 || h.x >= GW || h.y >= GH || s.b.some((p) => p.x === h.x && p.y === h.y) || other.b.some((p) => p.x === h.x && p.y === h.y)) { s.dead = true; return; } s.b.unshift(h); if (h.x === food.x && h.y === food.y) { food = place(); api.tone(700, 0.05); } else s.b.pop(); }
        function tick() { stepSnake(s1, s2); stepSnake(s2, s1); if (s1.dead || s2.dead) { over = true; cancelAnimationFrame(raf); api.tone(160, 0.2, "sawtooth"); const w = s1.dead && s2.dead ? 0 : s1.dead ? 2 : 1; setTimeout(() => api.win(w, w === 0 ? "Both crashed!" : "Player " + w + " survived!"), 500); } }
        function draw() {
          x.fillStyle = "#0a1020"; x.fillRect(0, 0, W, H);
          x.font = (SZ) + "px system-ui,'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("🐟", food.x * SZ + SZ / 2, food.y * SZ + SZ / 2);
          s1.b.forEach((p, i) => { if (i === 0) drawMax(x, p.x * SZ + SZ / 2, p.y * SZ + SZ / 2, SZ / 2); else { x.fillStyle = "#3ee08f"; x.fillRect(p.x * SZ + 1, p.y * SZ + 1, SZ - 2, SZ - 2); } });
          s2.b.forEach((p, i) => { if (i === 0) drawMax(x, p.x * SZ + SZ / 2, p.y * SZ + SZ / 2, SZ / 2); else { x.fillStyle = "#ff5fa2"; x.fillRect(p.x * SZ + 1, p.y * SZ + 1, SZ - 2, SZ - 2); } });
          if (!started) { x.fillStyle = "#fff"; x.font = "bold 40px system-ui"; x.textAlign = "center"; x.fillText(cd > 0 ? cd : "GO!", W / 2, H / 2); }
        }
        function loop(t) { if (!last) last = t; acc += t - last; last = t; if (started && !over && acc > 95) { acc = 0; tick(); } if (!over) { draw(); raf = requestAnimationFrame(loop); } }
        const ct = setInterval(() => { cd--; if (cd <= 0) { started = true; clearInterval(ct); api.tone(800, 0.1); } else api.tone(400, 0.08); }, 800);
        const kd = (e) => { const k = e.key.toLowerCase(); const set = (s, dx, dy) => { if (s.d.x !== -dx || s.d.y !== -dy) s.nd = { x: dx, y: dy }; };
          if (k === "w") set(s1, 0, -1); else if (k === "s") set(s1, 0, 1); else if (k === "a") set(s1, -1, 0); else if (k === "d") set(s1, 1, 0);
          else if (k === "arrowup") set(s2, 0, -1); else if (k === "arrowdown") set(s2, 0, 1); else if (k === "arrowleft") set(s2, -1, 0); else if (k === "arrowright") set(s2, 1, 0);
          if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault(); };
        document.addEventListener("keydown", kd);
        api.onClean(() => { cancelAnimationFrame(raf); clearInterval(ct); document.removeEventListener("keydown", kd); });
        reset(); raf = requestAnimationFrame(loop);
      }
    },

    // ---------- Mash Battle ----------
    {
      key: "mash", name: "Mash Battle", icon: "💥", tag: "P1: mash A · P2: mash L",
      play(host, api) {
        const W = 440, H = 220; const c = canvas(host, W, H); const x = c.getContext("2d");
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "MASH to fill your bar first! 🟢 P1 = <b>A</b> · 🩷 P2 = <b>L</b>. Go go go!"; host.appendChild(hint);
        let p1 = 0, p2 = 0, over = false, raf, go = false, cd = 3; const GOAL = 50;
        function loop() {
          x.fillStyle = "#0e1526"; x.fillRect(0, 0, W, H);
          x.fillStyle = "#143322"; x.fillRect(40, 40, 60, H - 80); x.fillStyle = "#331428"; x.fillRect(W - 100, 40, 60, H - 80);
          const h1 = (H - 80) * Math.min(1, p1 / GOAL), h2 = (H - 80) * Math.min(1, p2 / GOAL);
          x.fillStyle = "#3ee08f"; x.fillRect(40, H - 40 - h1, 60, h1); x.fillStyle = "#ff5fa2"; x.fillRect(W - 100, H - 40 - h2, 60, h2);
          x.fillStyle = "#fff"; x.font = "bold 18px system-ui"; x.textAlign = "center"; x.fillText(p1, 70, 30); x.fillText(p2, W - 70, 30);
          if (!go) { x.font = "bold 40px system-ui"; x.fillText(cd > 0 ? cd : "MASH!", W / 2, H / 2); }
          if (!over) raf = requestAnimationFrame(loop);
        }
        const tick = setInterval(() => { cd--; if (cd <= 0) { go = true; clearInterval(tick); api.tone(800, 0.1); } else api.tone(400, 0.08); }, 800);
        function end(p) { over = true; cancelAnimationFrame(raf); clearInterval(tick); api.win(p, "Player " + p + " mashed to victory!"); }
        const kd = (e) => { if (over || !go) return; const k = e.key.toLowerCase(); if (k === "a") { p1++; api.tone(500 + p1 * 4, 0.02); if (p1 >= GOAL) end(1); } else if (k === "l") { p2++; api.tone(620 + p2 * 4, 0.02); if (p2 >= GOAL) end(2); } };
        document.addEventListener("keydown", kd);
        api.onClean(() => { cancelAnimationFrame(raf); clearInterval(tick); document.removeEventListener("keydown", kd); });
        loop();
      }
    },

    // ---------- Quick Math Duel ----------
    {
      key: "qmath", name: "Quick Math", icon: "🧮", tag: "P1: A/S/D · P2: J/K/L",
      play(host, api) {
        const wrap = document.createElement("div"); wrap.className = "qmath-wrap"; host.appendChild(wrap);
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "First to pick the right answer scores! 🟢 P1 = <b>A/S/D</b> · 🩷 P2 = <b>J/K/L</b>. First to <b>5</b>."; host.appendChild(hint);
        let s1 = 0, s2 = 0, ans = 0, opts = [], done = false, locked = false;
        function round() { locked = false; const a = 2 + (Math.random() * 11 | 0), b = 2 + (Math.random() * 11 | 0), op = Math.random() < 0.5 ? "+" : "×"; ans = op === "+" ? a + b : a * b; const set = new Set([ans]); while (set.size < 3) { const w = ans + (Math.random() * 10 | 0) - 5; if (w > 0) set.add(w); } opts = [...set].sort(() => Math.random() - 0.5); wrap.innerHTML = '<div class="qmath-score"><span style="color:#3ee08f">P1: ' + s1 + '</span> &nbsp; <b>' + a + " " + op + " " + b + '</b> &nbsp; <span style="color:#ff5fa2">P2: ' + s2 + '</span></div>'; const row = document.createElement("div"); row.className = "qmath-opts"; const labels = ["A/J", "S/K", "D/L"]; opts.forEach((o, i) => { const d = document.createElement("div"); d.className = "qmath-opt"; d.innerHTML = '<b>' + o + '</b><small>' + labels[i] + '</small>'; row.appendChild(d); }); wrap.appendChild(row); }
        function pick(player, idx) { if (done || locked) return; locked = true; if (opts[idx] === ans) { if (player === 1) s1++; else s2++; api.tone(player === 1 ? 700 : 500, 0.08); } else { if (player === 1) s2++; else s1++; api.tone(180, 0.1, "sawtooth"); } if (s1 >= 5 || s2 >= 5) { done = true; api.win(s1 >= 5 ? 1 : 2, "Final: " + s1 + " — " + s2); } else setTimeout(round, 500); }
        const kd = (e) => { const k = e.key.toLowerCase(); const p1 = { a: 0, s: 1, d: 2 }, p2 = { j: 0, k: 1, l: 2 }; if (k in p1) { e.preventDefault(); pick(1, p1[k]); } else if (k in p2) { e.preventDefault(); pick(2, p2[k]); } };
        document.addEventListener("keydown", kd);
        api.onClean(() => document.removeEventListener("keydown", kd));
        round();
      }
    },

    // ---------- Dodge Duel ----------
    {
      key: "dodgeduel", name: "Dodge Duel", icon: "☄️", tag: "P1: A/D · P2: ←/→",
      play(host, api) {
        const W = 440, H = 320; const c = canvas(host, W, H); const x = c.getContext("2d");
        const hint = document.createElement("p"); hint.className = "ar-hint"; hint.innerHTML = "Last cat un-hit wins! Dodge the ☄️ on your half. 🟢 P1 = <b>A/D</b> · 🩷 P2 = <b>←/→</b>"; host.appendChild(hint);
        let p1 = W / 4, p2 = 3 * W / 4, rocks = [], over = false, raf, frame = 0, d1 = false, d2 = false; const keys = {};
        function loop() {
          x.fillStyle = "#0b1020"; x.fillRect(0, 0, W, H); x.strokeStyle = "rgba(255,255,255,.15)"; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke();
          if (!over) {
            if (keys["a"]) p1 -= 6; if (keys["d"]) p1 += 6; if (keys["arrowleft"]) p2 -= 6; if (keys["arrowright"]) p2 += 6;
            p1 = Math.max(18, Math.min(W / 2 - 18, p1)); p2 = Math.max(W / 2 + 18, Math.min(W - 18, p2));
            frame++; if (frame % 22 === 0) { const left = Math.random() < 0.5; rocks.push({ x: left ? 20 + Math.random() * (W / 2 - 40) : W / 2 + 20 + Math.random() * (W / 2 - 40), y: -20, v: 3 + Math.random() * 2 + frame / 400 }); }
            rocks.forEach((r) => r.y += r.v); rocks = rocks.filter((r) => r.y < H + 20);
            rocks.forEach((r) => { if (r.y > H - 46 && r.y < H - 10) { if (r.x < W / 2 && Math.abs(r.x - p1) < 20 && !d1) { d1 = true; api.boom(); } if (r.x >= W / 2 && Math.abs(r.x - p2) < 20 && !d2) { d2 = true; api.boom(); } } });
            if (d1 || d2) { over = true; cancelAnimationFrame(raf); const w = d1 && d2 ? 0 : d1 ? 2 : 1; return api.win(w, w === 0 ? "Both got hit!" : "Player " + w + " dodged longest!"); }
          }
          x.font = "22px system-ui,'Segoe UI Emoji'"; x.textAlign = "center"; x.textBaseline = "middle"; rocks.forEach((r) => x.fillText("☄️", r.x, r.y));
          if (!d1) x.fillText("🟢", p1, H - 24); if (!d2) x.fillText("🩷", p2, H - 24);
          if (!over) raf = requestAnimationFrame(loop);
        }
        const kd = (e) => { const k = e.key.toLowerCase(); if (["a", "d", "arrowleft", "arrowright"].includes(k)) { keys[k] = true; e.preventDefault(); } };
        const ku = (e) => { keys[e.key.toLowerCase()] = false; };
        document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
        api.onClean(() => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
        loop();
      }
    }
  ];

  window.MG_DUELS = { open, close };
  function wire() { const b = document.getElementById("duelsBtn"); if (b) b.onclick = open; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
