// ===== MaxwellGames: 🩸 THE BINDING OF MAXWELL — secret unlockable dungeon roguelike =====
// Original game & art (no copyrighted characters). Unlocked by a secret code + 300K 🐟.
(function () {
  const NEED = 300000;
  let AC;
  function tone(f, d, ty, v) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = ty || "square"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v || 0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} }
  const img = (function () { const i = new Image(); i.src = (document.querySelector(".logo-img") || {}).src || "maxwell.png"; return i; })();
  function S() { return window.MG ? window.MG.save : {}; }

  // ---------- GATE (the switch) ----------
  function openGate() {
    close();
    const ov = document.createElement("div"); ov.id = "bmGate"; ov.className = "bm-overlay";
    document.body.appendChild(ov);
    render();
    function render() {
      const s = S(); const unlocked = !!s.bindMaxwell; const treats = s.treats || 0; const can = unlocked || treats >= NEED;
      ov.innerHTML = '<div class="bm-gate">'
        + '<button class="bm-x" id="bmX">✕</button>'
        + '<h1 class="bm-title">🩸 The Binding of Maxwell</h1>'
        + '<p class="bm-sub">A cursed basement lies beneath MaxwellGames…</p>'
        + '<div class="bm-switch-wrap' + (can ? " live" : " locked") + '"><div class="bm-switch" id="bmSwitch"><div class="bm-knob"></div></div><span class="bm-switch-label">' + (can ? "FLIP TO DESCEND" : "🔒 LOCKED") + '</span></div>'
        + (can ? '<p class="bm-note">' + (unlocked ? "You've unlocked the basement. Flip the switch to enter." : "You have <b>" + fmt(treats) + " 🐟</b> — enough to unlock! Flip the switch.") + '</p>'
          : '<div class="bm-prog"><div class="bm-prog-fill" style="width:' + Math.min(100, treats / NEED * 100) + '%"></div></div><p class="bm-note">Collect <b>300,000 🐟</b> to unlock this switch.<br>You have <b>' + fmt(treats) + '</b> / 300,000 🐟.</p>')
        + '</div>';
      ov.querySelector("#bmX").onclick = close;
      const sw = ov.querySelector("#bmSwitch");
      if (can) sw.onclick = () => { if (!s.bindMaxwell) { s.bindMaxwell = true; try { window.MG.flag("bindmaxwell"); window.MG.persist(); } catch (e) {} } sw.classList.add("on"); tone(200, 0.1); setTimeout(() => tone(500, 0.12), 120); setTimeout(() => cutscene(startGame), 650); };
      else sw.onclick = () => { tone(140, 0.12, "sawtooth"); sw.classList.remove("nope"); void sw.offsetWidth; sw.classList.add("nope"); };
    }
  }
  function fmt(n) { return (n | 0).toLocaleString ? (n | 0).toLocaleString() : "" + (n | 0); }
  function close() { stop(); const o = document.getElementById("bmGate"); if (o) o.remove(); const g = document.getElementById("bmGame"); if (g) { if (g._esc) document.removeEventListener("keydown", g._esc); g.remove(); } }

  // ---------- CUTSCENE (original: Maxwell falls through a trapdoor) ----------
  function cutscene(then) {
    const g = S(); const o = document.getElementById("bmGate"); if (o) o.remove();
    const ov = document.createElement("div"); ov.id = "bmGate"; ov.className = "bm-overlay";
    const c = document.createElement("canvas"); c.width = 480; c.height = 360; c.className = "bm-canvas"; ov.appendChild(c);
    const skip = document.createElement("button"); skip.className = "bm-skip"; skip.textContent = "Skip ⏭"; ov.appendChild(skip);
    document.body.appendChild(ov);
    const x = c.getContext("2d"); let t = 0, raf, done = false;
    function finish() { if (done) return; done = true; cancelAnimationFrame(raf); then(); }
    skip.onclick = finish;
    function loop() {
      t++; x.fillStyle = "#1a1210"; x.fillRect(0, 0, 480, 360);
      // wooden floor
      x.fillStyle = "#4a352410"; for (let i = 0; i < 480; i += 48) { x.fillStyle = i % 96 ? "#3a2a1e" : "#44301f"; x.fillRect(i, 160, 48, 200); }
      const cx = 240, fy = 210;
      // trapdoor opening angle
      const open = Math.max(0, Math.min(1, (t - 50) / 40));
      // hole
      x.fillStyle = "#000"; x.beginPath(); x.ellipse(cx, fy + 20, 70, 22, 0, 0, 7); x.fill();
      // two doors swinging open
      x.fillStyle = "#2a1c12"; x.strokeStyle = "#1a1109"; x.lineWidth = 3;
      x.save(); x.translate(cx - 2, fy); x.rotate(-open * 1.4); x.fillRect(-70, -6, 68, 12); x.strokeRect(-70, -6, 68, 12); x.restore();
      x.save(); x.translate(cx + 2, fy); x.rotate(open * 1.4); x.fillRect(2, -6, 68, 12); x.strokeRect(2, -6, 68, 12); x.restore();
      // Maxwell: sits, then falls after doors open
      let mx = cx, my = fy - 24, sc = 1, rot = 0;
      if (t > 95) { const f = (t - 95); my = fy - 24 + f * f * 0.12; sc = Math.max(0.1, 1 - f * 0.012); rot = f * 0.14; }
      if (my < 420) { x.save(); x.translate(mx, my); x.rotate(rot); x.globalAlpha = Math.max(0, Math.min(1, sc + 0.2)); if (img.complete && img.naturalWidth) { const s = 44 * sc; x.drawImage(img, -s / 2, -s / 2, s, s); } else { x.fillStyle = "#222"; x.fillRect(-16, -16, 32, 32); } x.restore(); }
      if (t === 96) { tone(300, 0.3, "sawtooth"); }
      // fade + title
      if (t > 150) { const a = Math.min(1, (t - 150) / 40); x.fillStyle = "rgba(0,0,0," + a + ")"; x.fillRect(0, 0, 480, 360); if (a > 0.6) { x.fillStyle = "#c0392b"; x.font = "900 34px Georgia,serif"; x.textAlign = "center"; x.fillText("THE BINDING", 240, 165); x.fillText("OF MAXWELL", 240, 205); } }
      if (t > 215) return finish();
      if (!done) raf = requestAnimationFrame(loop);
    }
    loop();
  }

  // ---------- THE GAME (original top-down dungeon roguelike) ----------
  let gameRaf = null, gameClean = [];
  function stop() { if (gameRaf) cancelAnimationFrame(gameRaf); gameRaf = null; gameClean.forEach((f) => { try { f(); } catch (e) {} }); gameClean = []; }
  function startGame() {
    const gate = document.getElementById("bmGate"); if (gate) gate.remove();
    const ov = document.createElement("div"); ov.id = "bmGame"; ov.className = "arcade bm-overlay";
    ov.innerHTML = '<div class="bm-stage"><canvas id="bmCv" width="480" height="360" class="ar-canvas"></canvas><div class="bm-hud" id="bmHud"></div><button class="bm-x" id="bmGX">✕</button><p class="bm-help">Move <b>WASD / arrows</b> · Shoot <b>Space</b> (or the A button) — clear rooms, find the trapdoor, go deeper!</p></div>';
    document.body.appendChild(ov);
    const c = ov.querySelector("#bmCv"), x = c.getContext("2d"); const W = 480, H = 360, WALL = 26;
    ov.querySelector("#bmGX").onclick = close;
    const esc = (e) => { if (e.key === "Escape") close(); }; document.addEventListener("keydown", esc); ov._esc = esc;

    const keys = {};
    const kd = (e) => { const k = e.key.toLowerCase(); if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(k)) { keys[k] = true; e.preventDefault(); } };
    const ku = (e) => { keys[e.key.toLowerCase()] = false; };
    document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
    gameClean.push(() => { document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });

    const P = { x: W / 2, y: H / 2, r: 13, hp: 3, max: 3, fx: 0, fy: 1, inv: 0, cd: 0 };
    let floor = 1, room = 0, roomsPerFloor = 4, enemies = [], shots = [], pickups = [], exit = null, trap = null, over = false, win = false, floorsCleared = 0, roomsCleared = 0, flash = 0;

    function spawnRoom() {
      enemies = []; shots = []; pickups = []; exit = null; trap = null;
      const n = Math.min(9, 2 + floor + (room > 0 ? 1 : 0));
      for (let i = 0; i < n; i++) {
        const type = Math.random() < 0.2 ? "blob" : Math.random() < 0.5 ? "spider" : "fly";
        enemies.push(mkEnemy(type));
      }
    }
    function mkEnemy(type) {
      const e = { type: type, x: WALL + 30 + Math.random() * (W - 2 * WALL - 60), y: WALL + 30 + Math.random() * (H - 2 * WALL - 60) };
      if (type === "fly") { e.r = 11; e.hp = 1; e.spd = 1.1 + floor * 0.08; e.col = "#9b59b6"; }
      else if (type === "spider") { e.r = 13; e.hp = 2; e.spd = 1.5 + floor * 0.1; e.col = "#2c3e50"; }
      else { e.r = 20; e.hp = 4 + floor; e.spd = 0.7; e.col = "#c0392b"; }
      return e;
    }
    spawnRoom();

    function hurt() { if (P.inv > 0) return; P.hp--; P.inv = 70; flash = 12; tone(160, 0.14, "sawtooth"); if (P.hp <= 0) end(false); }
    function end(won) {
      if (over) return; over = true; win = won; cancelAnimationFrame(gameRaf);
      const reward = floorsCleared * 150 + roomsCleared * 25 + 50;
      try { window.MG.give(reward); window.MG.flag("basement"); window.MG.boomSound(0.12); } catch (e) {}
      ov.querySelector(".bm-stage").innerHTML = '<div class="bm-result"><h2>' + (won ? "🏆 You escaped!" : "💀 You died…") + '</h2><p>Reached <b>Floor ' + floor + '</b> · cleared <b>' + roomsCleared + '</b> rooms</p><p class="bm-reward">+' + reward + ' 🐟</p><div class="ar-res-btns"><button class="btn asc-btn" id="bmAgain">↻ Try again</button><button class="btn" id="bmQuit">Leave basement</button></div></div>';
      ov.querySelector("#bmAgain").onclick = startGame;
      ov.querySelector("#bmQuit").onclick = close;
    }

    function step() {
      if (over) return;
      P.cd--; P.inv--;
      let mx = 0, my = 0;
      if (keys.a || keys.arrowleft) mx -= 1; if (keys.d || keys.arrowright) mx += 1;
      if (keys.w || keys.arrowup) my -= 1; if (keys.s || keys.arrowdown) my += 1;
      if (mx || my) { const l = Math.hypot(mx, my); P.fx = mx / l; P.fy = my / l; P.x += mx / l * 3.2; P.y += my / l * 3.2; }
      P.x = Math.max(WALL + P.r, Math.min(W - WALL - P.r, P.x)); P.y = Math.max(WALL + P.r, Math.min(H - WALL - P.r, P.y));
      // shoot
      if (keys[" "] && P.cd <= 0) { shots.push({ x: P.x, y: P.y, vx: P.fx * 6, vy: P.fy * 6, life: 70 }); P.cd = 16; tone(620, 0.04); }
      shots.forEach((s) => { s.x += s.vx; s.y += s.vy; s.life--; if (s.x < WALL || s.x > W - WALL || s.y < WALL || s.y > H - WALL) s.life = 0; });
      // enemies
      enemies.forEach((e) => { const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1; e.x += dx / d * e.spd; e.y += dy / d * e.spd; if (d < e.r + P.r) hurt();
        shots.forEach((s) => { if (s.life > 0 && Math.hypot(s.x - e.x, s.y - e.y) < e.r + 5) { e.hp--; s.life = 0; tone(300, 0.03); if (e.hp <= 0) { e.dead = 1; if (Math.random() < 0.18) pickups.push({ x: e.x, y: e.y, t: Math.random() < 0.5 && P.hp < P.max ? "heart" : "fish" }); } } });
      });
      enemies = enemies.filter((e) => !e.dead);
      shots = shots.filter((s) => s.life > 0);
      pickups.forEach((p) => { if (Math.hypot(p.x - P.x, p.y - P.y) < P.r + 10) { p.got = 1; if (p.t === "heart") { P.hp = Math.min(P.max, P.hp + 1); tone(800, 0.1); } else { try { window.MG.give(25); } catch (e) {} tone(700, 0.06); } } });
      pickups = pickups.filter((p) => !p.got);
      // room cleared?
      if (enemies.length === 0 && !exit && !trap) {
        roomsCleared++;
        if (room + 1 >= roomsPerFloor) { trap = { x: W / 2, y: H / 2 }; }
        else { exit = { x: W - WALL - 2, y: H / 2 }; }
      }
      // exit / trapdoor
      if (exit && P.x > W - WALL - P.r - 6 && Math.abs(P.y - exit.y) < 50) { room++; P.x = WALL + P.r + 10; spawnRoom(); }
      if (trap && Math.hypot(P.x - trap.x, P.y - trap.y) < 26) { floorsCleared++; floor++; room = 0; P.hp = Math.min(P.max, P.hp + 1); tone(300, 0.2, "sawtooth"); flash = 20; spawnRoom(); P.x = W / 2; P.y = H / 2; }
      if (flash > 0) flash--;
    }
    function draw() {
      x.fillStyle = "#1a1512"; x.fillRect(0, 0, W, H);
      // floor tiles
      for (let yy = WALL; yy < H - WALL; yy += 32) for (let xx = WALL; xx < W - WALL; xx += 32) { x.fillStyle = ((xx + yy) / 32) % 2 ? "#2a2420" : "#302a25"; x.fillRect(xx, yy, 32, 32); }
      // walls
      x.fillStyle = "#120d0a"; x.fillRect(0, 0, W, WALL); x.fillRect(0, H - WALL, W, WALL); x.fillRect(0, 0, WALL, H); x.fillRect(W - WALL, 0, WALL, H);
      // exit door
      if (exit) { x.fillStyle = "#6c3"; x.fillRect(W - WALL, exit.y - 28, WALL, 56); x.fillStyle = "#aef"; x.font = "20px serif"; x.textAlign = "center"; x.fillText("➡", W - WALL / 2, exit.y + 7); }
      if (trap) { x.fillStyle = "#000"; x.fillRect(trap.x - 26, trap.y - 20, 52, 40); x.strokeStyle = "#5a3"; x.lineWidth = 3; x.strokeRect(trap.x - 26, trap.y - 20, 52, 40); x.fillStyle = "#6c3"; x.font = "bold 12px system-ui"; x.textAlign = "center"; x.fillText("DOWN", trap.x, trap.y + 4); }
      // pickups
      pickups.forEach((p) => { x.font = "20px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(p.t === "heart" ? "❤️" : "🐟", p.x, p.y); });
      // shots
      x.fillStyle = "#7fd3ff"; shots.forEach((s) => { x.beginPath(); x.arc(s.x, s.y, 5, 0, 7); x.fill(); });
      // enemies
      enemies.forEach((e) => { x.fillStyle = e.col; x.beginPath(); x.arc(e.x, e.y, e.r, 0, 7); x.fill(); x.fillStyle = "#fff"; x.beginPath(); x.arc(e.x - e.r * 0.3, e.y - 2, 3, 0, 7); x.arc(e.x + e.r * 0.3, e.y - 2, 3, 0, 7); x.fill(); x.fillStyle = "#000"; x.beginPath(); x.arc(e.x - e.r * 0.3, e.y - 2, 1.5, 0, 7); x.arc(e.x + e.r * 0.3, e.y - 2, 1.5, 0, 7); x.fill(); });
      // player (Maxwell)
      if (!(P.inv > 0 && P.inv % 8 < 4)) { if (img.complete && img.naturalWidth) { x.save(); x.beginPath(); x.arc(P.x, P.y, P.r, 0, 7); x.clip(); x.drawImage(img, P.x - P.r, P.y - P.r, P.r * 2, P.r * 2); x.restore(); } else { x.fillStyle = "#222"; x.beginPath(); x.arc(P.x, P.y, P.r, 0, 7); x.fill(); } }
      if (flash > 0) { x.fillStyle = "rgba(192,57,43," + (flash / 30) + ")"; x.fillRect(0, 0, W, H); }
      // HUD
      const hud = ov.querySelector("#bmHud"); if (hud) hud.innerHTML = "❤️".repeat(P.hp) + "🖤".repeat(Math.max(0, P.max - P.hp)) + " &nbsp; 🏚️ Floor " + floor + " &nbsp; 🚪 Room " + (room + 1) + "/" + roomsPerFloor;
    }
    function loop() { if (!over) { step(); draw(); } if (!over) gameRaf = requestAnimationFrame(loop); }
    loop();
  }

  window.MG_SECRET = { openGate: openGate };
})();
