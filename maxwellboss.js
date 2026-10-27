// ===== MaxwellGames: 👑 THE MAXWELL BOSS — fullscreen pseudo-3D sword fight on the dark tower =====
// Original art drawn with canvas. No copyrighted assets. WASD/Arrows move, SPACE swings the sword.
(function () {
  // ---- audio ----
  let AC, recDest = null;
  function actx() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); return AC; } catch (e) { return null; } }
  function tone(f, d, ty, v, slideTo) {
    const a = actx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = ty || "sine"; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + d);
    g.gain.setValueAtTime(v || 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.02);
  }
  function roar() { tone(90, 0.7, "sawtooth", 0.22, 42); tone(140, 0.7, "square", 0.1, 60); }
  function clang() { tone(680, 0.12, "square", 0.16, 300); tone(1200, 0.08, "triangle", 0.08); }
  function whoosh() { tone(380, 0.14, "sine", 0.08, 120); }
  function boom() { try { window.MG.boomSound(0.16); } catch (e) { tone(70, 0.5, "sawtooth", 0.25, 40); } }

  function injectCSS() {
    if (document.getElementById("mxb-style")) return;
    const s = document.createElement("style"); s.id = "mxb-style";
    s.textContent = `
      .mxb-fs{position:fixed;inset:0;z-index:100000;background:#05030a;display:none}
      .mxb-fs.on{display:block}
      .mxb-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
      .mxb-bar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;justify-content:center;padding:10px 12px calc(10px + env(safe-area-inset-bottom));z-index:3}
      .mxb-bar .btn{font-size:.95rem}
      .mxb-hint{position:absolute;left:0;right:0;top:8px;text-align:center;color:#ffd84a;font:700 13px system-ui;text-shadow:0 2px 6px #000;z-index:3;pointer-events:none;opacity:.9}
    `;
    document.head.appendChild(s);
  }

  // onWin / onExit callbacks optional
  function start(opts) {
    opts = opts || {};
    injectCSS();
    const fs = document.createElement("div"); fs.className = "mxb-fs";
    // canvas gets "sim-canvas" so the universal touch pad (touch.js) appears & drives it on phones
    fs.innerHTML = '<canvas class="mxb-canvas sim-canvas"></canvas>'
      + '<div class="mxb-hint">WASD / Arrows to move &nbsp;·&nbsp; SPACE to swing your sword</div>'
      + '<div class="mxb-bar"><button class="btn" id="mxbExit">✕ Exit</button></div>';
    document.body.appendChild(fs);
    const cv = fs.querySelector(".mxb-canvas"); const ctx = cv.getContext("2d");
    let W = 0, H = 0, DPR = 1;
    function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = fs.clientWidth || window.innerWidth; H = fs.clientHeight || window.innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    window.addEventListener("resize", resize);

    const maxImg = new Image(); maxImg.src = (document.querySelector(".logo-img") || {}).src || "maxwell.png";

    // ---- camera / projection ----
    const F = 430, camY = 150, camZ = -175, Cz = 135, AR = 175;
    function horizon() { return H * 0.44; }
    function proj(wx, wy, wz) { const depth = wz - camZ; const s = F / depth; return { x: W / 2 + wx * s, y: horizon() + (camY - wy) * s, s: s, depth: depth }; }

    // ---- entities ----
    const hero = { x: 0, z: Cz - 90, hp: 6, maxHp: 6, face: 1, swing: 0, swingHit: false, iFrames: 0, flash: 0, step: 0 };
    const boss = { x: 0, y: 150, z: Cz, hp: 340, maxHp: 340, state: "intro", st: 0, tx: 0, tz: Cz, flash: 0, wing: 0, enraged: false };
    let shocks = [], claws = [], sparks = [], embers = [], lightning = 0, shakeMag = 0, frameT = 0;
    let countdown = 3.9, running = true, phase = "countdown", raf = null, outcome = null, endT = 0;
    const crowd = [];
    (function buildCrowd() {
      const beaten = (opts.cheerers && opts.cheerers.length ? opts.cheerers : ["🐶", "🤖", "🧹", "👻", "🐉", "🦖", "👹", "🐺", "🦂", "🕷️", "🐙", "🦅", "👽", "🤡", "🐲"]);
      const N = 26;
      for (let i = 0; i < N; i++) { const a = Math.PI + (i / (N - 1)) * Math.PI; const r = AR * (0.92 + Math.random() * 0.12); crowd.push({ x: Math.cos(a) * r, z: Cz + Math.sin(a) * r * 0.78, ic: beaten[i % beaten.length], bob: Math.random() * 6, say: 0 }); }
    })();
    for (let i = 0; i < 46; i++) embers.push({ x: Math.random() * 2 - 1, y: Math.random(), sp: 0.002 + Math.random() * 0.004, sz: 1 + Math.random() * 2, h: Math.random() });

    // ---- input ----
    const keys = {};
    function kd(e) {
      const k = e.key.toLowerCase();
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].indexOf(k) >= 0) { e.preventDefault(); }
      keys[k] = true;
      if (k === " " && phase === "fight" && hero.swing <= 0) { hero.swing = 1; hero.swingHit = false; whoosh(); }
    }
    function ku(e) { keys[e.key.toLowerCase()] = false; }
    window.addEventListener("keydown", kd, { passive: false });
    window.addEventListener("keyup", ku);

    function inArena(x, z) { const dx = x, dz = z - Cz; return (dx * dx + dz * dz) <= AR * AR; }

    // ---- update ----
    function update(dt) {
      frameT++;
      boss.wing += 0.12;
      if (lightning > 0) lightning -= dt * 2.2;
      if (Math.random() < 0.006) lightning = 1;
      shakeMag *= 0.88;
      for (const e of embers) { e.y -= e.sp; if (e.y < 0) { e.y = 1; e.x = Math.random() * 2 - 1; } }

      if (phase === "countdown") {
        countdown -= dt;
        // Maxwell descends from the sky to hover height during the count
        const p = Math.min(1, (3.9 - countdown) / 3.2);
        boss.y = 430 - p * 280; // 430 (high) -> 150 hover
        boss.x = Math.sin(frameT * 0.03) * 40;
        if (countdown <= 0) { phase = "fight"; boss.state = "hover"; boss.st = 0; roar(); shakeMag = 16; }
        return;
      }
      if (phase === "end") { endT += dt; return; }

      // ---- hero movement ----
      const spd = 2.9;
      let mx = 0, mz = 0;
      if (keys["arrowleft"] || keys["a"]) mx -= 1;
      if (keys["arrowright"] || keys["d"]) mx += 1;
      if (keys["arrowup"] || keys["w"]) mz += 1;   // away (into screen)
      if (keys["arrowdown"] || keys["s"]) mz -= 1;  // toward camera
      if (mx || mz) { const L = Math.hypot(mx, mz); const nx = hero.x + mx / L * spd, nz = hero.z + mz / L * spd; if (inArena(nx, hero.z)) hero.x = nx; if (inArena(hero.x, nz)) hero.z = nz; hero.face = mx < 0 ? -1 : (mx > 0 ? 1 : hero.face); hero.step += 0.25; }
      if (hero.swing > 0) hero.swing -= dt * 3.4;
      if (hero.iFrames > 0) hero.iFrames -= dt;
      if (hero.flash > 0) hero.flash -= dt * 2;
      if (boss.flash > 0) boss.flash -= dt * 3;

      // ---- sword hit (active during first part of swing) ----
      if (hero.swing > 0.55 && !hero.swingHit) {
        const dx = boss.x - hero.x, dz = boss.z - hero.z, hd = Math.hypot(dx, dz);
        if (hd < 95 && boss.y < 95) {
          hero.swingHit = true; const dmg = 10 + Math.floor(Math.random() * 7);
          boss.hp -= dmg; boss.flash = 1; clang(); shakeMag = 10;
          for (let i = 0; i < 14; i++) sparks.push({ x: boss.x, y: boss.y, z: boss.z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 6, vz: (Math.random() - 0.5) * 6, life: 1, hue: 45 + Math.random() * 20 });
          // knockback
          const L = hd || 1; boss.x += dx / L * 14; boss.z += dz / L * 14;
          if (boss.hp <= 0 && phase === "fight") winFight();
          if (!boss.enraged && boss.hp <= boss.maxHp * 0.4) { boss.enraged = true; roar(); shakeMag = 20; }
        }
      }

      // ---- boss AI ----
      if (phase === "fight") bossAI(dt);

      // ---- shockwaves ----
      for (const s of shocks) { s.r += s.sp * (dt * 60); s.life -= dt; if (s.r > 40 && s.r < 60 && !s.hit) { /* window */ } const hd = Math.hypot(hero.x - s.x, hero.z - s.z); if (!s.dealt && Math.abs(hd - s.r) < 22 && s.r > 20) { s.dealt = true; hurt(2); } }
      shocks = shocks.filter((s) => s.life > 0 && s.r < 320);
      // ---- claws (projectiles) ----
      for (const c of claws) { c.t += dt; c.x += c.vx; c.z += c.vz; c.y = c.y0 * Math.sin(Math.min(Math.PI, c.t * 2.4)); if (c.t > 0.1 && c.y < 14) { const hd = Math.hypot(hero.x - c.x, hero.z - c.z); if (hd < 40) { hurt(1); } c.dead = true; for (let i = 0; i < 8; i++) sparks.push({ x: c.x, y: 6, z: c.z, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 4, life: 0.7, hue: 0 }); } if (c.t > 2.5) c.dead = true; }
      claws = claws.filter((c) => !c.dead);
      // ---- sparks ----
      for (const s of sparks) { s.x += s.vx; s.y += s.vy; s.z += s.vz; s.vy -= 0.3; s.life -= dt * 1.6; }
      sparks = sparks.filter((s) => s.life > 0);
      for (const c of crowd) { c.bob += 0.1; if (c.say > 0) c.say -= dt; if (Math.random() < 0.004) c.say = 1.4; }
    }

    function hurt(n) {
      if (hero.iFrames > 0 || phase !== "fight") return;
      hero.hp -= n; hero.iFrames = 1.1; hero.flash = 1; shakeMag = 12; boom();
      if (hero.hp <= 0) loseFight();
    }

    function bossAI(dt) {
      boss.st += dt;
      const rage = boss.enraged ? 1.6 : 1;
      if (boss.state === "hover") {
        boss.y = 150 + Math.sin(frameT * 0.05) * 22;
        boss.x = Math.sin(frameT * 0.018) * 120;
        boss.z = Cz + Math.cos(frameT * 0.013) * 30;
        if (frameT % Math.round(70 / rage) === 0) shootClaw();
        if (boss.st > (2.0 / rage)) { boss.state = "telegraph"; boss.st = 0; boss.tx = hero.x; boss.tz = hero.z; }
      } else if (boss.state === "telegraph") {
        boss.y += (110 - boss.y) * 0.1; boss.x += (boss.tx - boss.x) * 0.08; boss.z += (boss.tz - boss.z) * 0.08;
        if (boss.st > 0.6) { boss.state = "slam"; boss.st = 0; whoosh(); }
      } else if (boss.state === "slam") {
        boss.y += (14 - boss.y) * 0.4; boss.x += (boss.tx - boss.x) * 0.35; boss.z += (boss.tz - boss.z) * 0.35;
        if (boss.y < 26 || boss.st > 0.5) { boss.state = "low"; boss.st = 0; shocks.push({ x: boss.x, z: boss.z, r: 6, sp: 5.5, life: 1.2, dealt: false }); boom(); shakeMag = 18; if (boss.enraged) shootClaw(); }
      } else if (boss.state === "low") {
        boss.y = 24 + Math.sin(frameT * 0.3) * 4; // vulnerable window
        if (boss.st > (0.95 / rage)) { boss.state = "retreat"; boss.st = 0; }
      } else if (boss.state === "retreat") {
        boss.y += (150 - boss.y) * 0.12;
        if (boss.st > 0.5) { boss.state = "hover"; boss.st = 0; }
      }
    }
    function shootClaw() {
      const dx = hero.x - boss.x, dz = hero.z - boss.z, L = Math.hypot(dx, dz) || 1; const sp = 3.4;
      claws.push({ x: boss.x, y: boss.y, z: boss.z, y0: Math.max(70, boss.y), vx: dx / L * sp, vz: dz / L * sp, t: 0, dead: false });
      tone(300, 0.2, "sawtooth", 0.08, 120);
    }

    function winFight() {
      phase = "end"; outcome = "win"; endT = 0; boss.hp = 0; shakeMag = 26; boom(); roar();
      for (let i = 0; i < 80; i++) sparks.push({ x: boss.x + (Math.random() - 0.5) * 40, y: boss.y, z: boss.z, vx: (Math.random() - 0.5) * 9, vy: Math.random() * 10, vz: (Math.random() - 0.5) * 9, life: 1.6, hue: Math.random() * 360 });
      for (const c of crowd) c.say = 3;
      try { window.MG.flag("maxwellboss"); window.MG.meow(); } catch (e) {}
    }
    function loseFight() { phase = "end"; outcome = "lose"; endT = 0; shakeMag = 20; }

    // ---- draw ----
    function drawSky() {
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.7);
      g.addColorStop(0, "#1a0526"); g.addColorStop(0.5, "#2a0712"); g.addColorStop(1, "#45110a");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // blood moon / eclipse
      const mx = W * 0.5, my = H * 0.22, mr = Math.min(W, H) * 0.12;
      const mg = ctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 2.4); mg.addColorStop(0, "rgba(255,120,60,0.55)"); mg.addColorStop(1, "rgba(255,120,60,0)"); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 2.4, 0, 7); ctx.fill();
      ctx.fillStyle = "#c23a18"; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
      ctx.fillStyle = "#1a0526"; ctx.beginPath(); ctx.arc(mx - mr * 0.3, my - mr * 0.25, mr * 0.92, 0, 7); ctx.fill();
      // clouds
      ctx.fillStyle = "rgba(10,2,14,0.55)";
      for (let i = 0; i < 5; i++) { const cy = H * (0.1 + i * 0.07), off = ((frameT * (0.2 + i * 0.1)) % (W + 300)) - 150; ctx.beginPath(); ctx.ellipse((off + i * 220) % (W + 200), cy, 150, 22, 0, 0, 7); ctx.fill(); }
      if (lightning > 0.02) { ctx.fillStyle = "rgba(255,230,255," + (lightning * 0.5) + ")"; ctx.fillRect(0, 0, W, H); drawBolt(); }
      // jagged mountains
      ctx.fillStyle = "#0a0310"; ctx.beginPath(); ctx.moveTo(0, H * 0.5);
      for (let x = 0; x <= W; x += 40) { ctx.lineTo(x, H * 0.5 - (Math.sin(x * 0.02) * 0.5 + 0.5) * H * 0.12 - ((x * 37) % 60)); } ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      drawTower();
    }
    function drawBolt() {
      ctx.strokeStyle = "rgba(255,240,255,0.9)"; ctx.lineWidth = 2; ctx.beginPath();
      let x = W * (0.2 + Math.random() * 0.6), y = 0; ctx.moveTo(x, y);
      while (y < H * 0.4) { y += 20 + Math.random() * 30; x += (Math.random() - 0.5) * 50; ctx.lineTo(x, y); } ctx.stroke();
    }
    function drawTower() {
      // the scary dark spire behind the arena (original Barad-dûr-ish silhouette)
      const bx = W * 0.5, baseY = H * 0.56, tw = Math.min(W, H) * 0.19;
      ctx.fillStyle = "#07040d";
      // main body tapering up
      ctx.beginPath(); ctx.moveTo(bx - tw, baseY); ctx.lineTo(bx - tw * 0.42, H * 0.1); ctx.lineTo(bx + tw * 0.42, H * 0.1); ctx.lineTo(bx + tw, baseY); ctx.closePath(); ctx.fill();
      // side spires
      ctx.fillStyle = "#0a0514";
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(bx + sgn * tw * 0.7, baseY); ctx.lineTo(bx + sgn * tw * 0.95, H * 0.2); ctx.lineTo(bx + sgn * tw * 0.5, H * 0.22); ctx.lineTo(bx + sgn * tw * 0.3, baseY); ctx.closePath(); ctx.fill(); }
      // battlement teeth on top
      ctx.fillStyle = "#07040d";
      for (let i = -4; i <= 4; i++) { ctx.fillRect(bx + i * tw * 0.1 - 4, H * 0.08, 8, 26); }
      // crowning jagged peak
      ctx.beginPath(); ctx.moveTo(bx - tw * 0.42, H * 0.1); ctx.lineTo(bx, H * 0.015); ctx.lineTo(bx + tw * 0.42, H * 0.1); ctx.closePath(); ctx.fill();
      // glowing eye-slit at the top (original, menacing)
      const ey = H * 0.11, pulse = 0.6 + 0.4 * Math.sin(frameT * 0.08);
      const eg = ctx.createRadialGradient(bx, ey, 2, bx, ey, 46); eg.addColorStop(0, "rgba(255,210,80," + pulse + ")"); eg.addColorStop(0.5, "rgba(255,90,20," + (pulse * 0.6) + ")"); eg.addColorStop(1, "rgba(255,90,20,0)"); ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(bx, ey, 46, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(20,8,4," + (0.5 + 0.3 * Math.sin(frameT * 0.08)) + ")"; ctx.save(); ctx.translate(bx, ey); ctx.scale(1, 0.5); ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill(); ctx.restore();
      // tiny lit windows
      ctx.fillStyle = "rgba(255,140,40,0.8)";
      for (let i = 0; i < 24; i++) { const yy = H * (0.14 + Math.random() * 0.4); const ww = (bx - tw) + Math.random() * tw * 2; if (Math.random() < 0.5) ctx.fillRect(ww, yy, 2, 3); }
    }

    function drawFloor() {
      // platform disc
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; const p = proj(Math.cos(a) * AR, 0, Cz + Math.sin(a) * AR); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.closePath();
      const fg = ctx.createLinearGradient(0, horizon(), 0, H); fg.addColorStop(0, "#241820"); fg.addColorStop(1, "#0c0710"); ctx.fillStyle = fg; ctx.fill();
      ctx.strokeStyle = "rgba(255,110,40,0.5)"; ctx.lineWidth = 3; ctx.stroke();
      // concentric cracks with lava glow
      for (let ri = 1; ri <= 3; ri++) { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; const rr = AR * (ri / 3.4); const p = proj(Math.cos(a) * rr, 0, Cz + Math.sin(a) * rr); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.closePath(); ctx.strokeStyle = "rgba(255,90,20,0.18)"; ctx.lineWidth = 2; ctx.stroke(); }
      // radial cracks
      ctx.strokeStyle = "rgba(255,70,20,0.22)"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const p0 = proj(0, 0, Cz), p1 = proj(Math.cos(a) * AR, 0, Cz + Math.sin(a) * AR); ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); }
      // edge spikes around the rim
      for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; const base = proj(Math.cos(a) * AR, 0, Cz + Math.sin(a) * AR); const tip = proj(Math.cos(a) * AR, 30 + (i % 3) * 14, Cz + Math.sin(a) * AR); if (base.y < horizon() + 6) continue; ctx.fillStyle = "#0a0510"; ctx.beginPath(); ctx.moveTo(base.x - 6 * base.s * 0.1 - 5, base.y); ctx.lineTo(tip.x, tip.y); ctx.lineTo(base.x + 5, base.y); ctx.closePath(); ctx.fill(); }
    }

    function drawShocks() {
      for (const s of shocks) { ctx.beginPath(); for (let i = 0; i <= 36; i++) { const a = (i / 36) * Math.PI * 2; const p = proj(s.x + Math.cos(a) * s.r, 2, s.z + Math.sin(a) * s.r); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.closePath(); ctx.strokeStyle = "rgba(255,140,40," + Math.max(0, s.life) + ")"; ctx.lineWidth = 5; ctx.stroke(); }
    }
    function drawCrowd() {
      crowd.slice().sort((a, b) => a.z - b.z).forEach((c) => {
        const p = proj(c.x, 10 + Math.sin(c.bob) * 3, c.z); const sz = Math.max(14, 26 * p.s);
        ctx.font = sz + "px system-ui,'Segoe UI Emoji'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.globalAlpha = 0.9; ctx.fillText(c.ic, p.x, p.y); ctx.globalAlpha = 1;
        if (c.say > 0) { ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.font = "700 11px system-ui"; ctx.fillText(outcome === "win" ? "🎉" : "GO!", p.x, p.y - sz * 0.7); }
      });
    }
    function drawHero() {
      const p = proj(hero.x, 0, hero.z); const sz = 54 * p.s;
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, sz * 0.5, sz * 0.2, 0, 0, 7); ctx.fill();
      const bobY = Math.sin(hero.step) * 3 * p.s;
      // body (cat hero)
      ctx.save(); ctx.translate(p.x, p.y - sz * 0.5 - bobY);
      if (hero.iFrames > 0 && Math.floor(frameT / 3) % 2 === 0) ctx.globalAlpha = 0.4;
      if (maxImg.complete && maxImg.naturalWidth) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, sz * 0.5, 0, 7); ctx.clip(); ctx.drawImage(maxImg, -sz * 0.5, -sz * 0.5, sz, sz); ctx.restore(); }
      else { ctx.fillStyle = "#f4a63b"; ctx.beginPath(); ctx.arc(0, 0, sz * 0.5, 0, 7); ctx.fill(); }
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, sz * 0.5, 0, 7); ctx.stroke();
      // sword
      const sw = Math.max(0, hero.swing); const ang = hero.face * (-1.1 + (1 - sw) * 2.2);
      ctx.save(); ctx.translate(hero.face * sz * 0.4, 0); ctx.rotate(ang);
      ctx.fillStyle = "#6b4a2a"; ctx.fillRect(-3, -2, 6, 10); // hilt
      const bl = ctx.createLinearGradient(0, 0, 0, -sz * 1.2); bl.addColorStop(0, "#dfe7ff"); bl.addColorStop(1, "#8aa0d0");
      ctx.fillStyle = bl; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(2, -sz * 1.15); ctx.lineTo(0, -sz * 1.3); ctx.lineTo(-2, -sz * 1.15); ctx.closePath(); ctx.fill();
      if (sw > 0.5) { ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, sz * 1.1, -1.2, 1.2); ctx.stroke(); }
      ctx.restore();
      ctx.restore();
    }
    function drawBoss() {
      const p = proj(boss.x, boss.y, boss.z); const sz = 150 * p.s;
      // floor shadow (smaller when high)
      const sp = proj(boss.x, 0, boss.z); const shF = Math.max(0.15, 1 - boss.y / 240);
      ctx.fillStyle = "rgba(0,0,0," + (0.45 * shF) + ")"; ctx.beginPath(); ctx.ellipse(sp.x, sp.y, sz * 0.5 * shF, sz * 0.18 * shF, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(p.x, p.y);
      // dark aura
      const rage = boss.enraged ? 1 : 0;
      const ag = ctx.createRadialGradient(0, 0, sz * 0.2, 0, 0, sz * 1.1); ag.addColorStop(0, "rgba(" + (rage ? "255,40,30" : "150,40,200") + ",0.5)"); ag.addColorStop(1, "rgba(80,0,60,0)"); ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, 0, sz * 1.1, 0, 7); ctx.fill();
      // wings (behind)
      const flap = Math.sin(boss.wing) * 0.4;
      ctx.fillStyle = rage ? "#2a0406" : "#1a0426";
      for (const sgn of [-1, 1]) { ctx.save(); ctx.scale(sgn, 1); ctx.rotate(flap); ctx.beginPath(); ctx.moveTo(sz * 0.3, -sz * 0.1); ctx.quadraticCurveTo(sz * 1.3, -sz * 0.5, sz * 1.15, sz * 0.25); ctx.quadraticCurveTo(sz * 0.95, sz * 0.1, sz * 0.8, sz * 0.4); ctx.quadraticCurveTo(sz * 0.7, sz * 0.15, sz * 0.55, sz * 0.4); ctx.quadraticCurveTo(sz * 0.45, sz * 0.15, sz * 0.3, sz * 0.3); ctx.closePath(); ctx.fill(); ctx.restore(); }
      // body (big Maxwell)
      if (boss.flash > 0) { ctx.globalAlpha = 1; }
      if (maxImg.complete && maxImg.naturalWidth) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, sz * 0.5, 0, 7); ctx.clip(); ctx.drawImage(maxImg, -sz * 0.5, -sz * 0.5, sz, sz); if (boss.flash > 0) { ctx.fillStyle = "rgba(255,255,255," + boss.flash + ")"; ctx.fillRect(-sz * 0.5, -sz * 0.5, sz, sz); } ctx.restore(); }
      else { ctx.fillStyle = "#b06a2a"; ctx.beginPath(); ctx.arc(0, 0, sz * 0.5, 0, 7); ctx.fill(); }
      // glowing eyes
      ctx.fillStyle = rage ? "#ff2a2a" : "#ff5a30"; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(-sz * 0.17, -sz * 0.05, sz * 0.07, 0, 7); ctx.arc(sz * 0.17, -sz * 0.05, sz * 0.07, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      // crown
      ctx.fillStyle = "#ffd24a"; ctx.beginPath(); ctx.moveTo(-sz * 0.3, -sz * 0.45); ctx.lineTo(-sz * 0.3, -sz * 0.62); ctx.lineTo(-sz * 0.15, -sz * 0.52); ctx.lineTo(0, -sz * 0.68); ctx.lineTo(sz * 0.15, -sz * 0.52); ctx.lineTo(sz * 0.3, -sz * 0.62); ctx.lineTo(sz * 0.3, -sz * 0.45); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function drawClaws() {
      for (const c of claws) { const p = proj(c.x, c.y, c.z); const sz = Math.max(10, 20 * p.s); ctx.font = sz + "px system-ui,'Segoe UI Emoji'"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🔥", p.x, p.y); }
    }
    function drawSparks() {
      for (const s of sparks) { const p = proj(s.x, s.y, s.z); ctx.globalAlpha = Math.max(0, s.life); ctx.fillStyle = "hsl(" + s.hue + " 95% 62%)"; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); ctx.globalAlpha = 1; }
    }
    function drawEmbers() {
      for (const e of embers) { ctx.globalAlpha = 0.5 * (1 - e.y); ctx.fillStyle = "hsl(" + (20 + e.h * 25) + " 95% 60%)"; ctx.fillRect(e.x * W / 2 + W / 2, e.y * H, e.sz, e.sz); } ctx.globalAlpha = 1;
    }

    function drawBossBar() {
      if (phase === "countdown") return;
      const m = 16, bw = Math.min(W - 40, 560), bx = (W - bw) / 2, by = 54, bh = 26;
      const pct = Math.max(0, boss.hp / boss.maxHp);
      ctx.save();
      if (boss.flash > 0) ctx.translate((Math.random() - 0.5) * 6 * boss.flash, (Math.random() - 0.5) * 6 * boss.flash);
      // label
      ctx.textAlign = "center"; ctx.font = "900 20px system-ui"; ctx.fillStyle = "#ffd84a"; ctx.shadowColor = "#000"; ctx.shadowBlur = 6;
      ctx.fillText("👑 THE MAXWELL BOSS 👑", W / 2, by - 8); ctx.shadowBlur = 0;
      // frame
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
      ctx.fillStyle = "#1a0a12"; ctx.fillRect(bx, by, bw, bh);
      // animated gradient fill
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); const o = (frameT * 0.02) % 1;
      const h1 = boss.enraged ? 0 : 320, h2 = boss.enraged ? 40 : 280;
      g.addColorStop(0, "hsl(" + h1 + " 90% 50%)"); g.addColorStop((0.5 + o) % 1 < 0.5 ? 0.3 : 0.5, "hsl(" + h2 + " 95% 62%)"); g.addColorStop(1, "hsl(" + h1 + " 90% 48%)");
      ctx.fillStyle = g; ctx.fillRect(bx, by, bw * pct, bh);
      // shine
      ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(bx, by, bw * pct, bh * 0.4);
      // segment ticks
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(bx + bw * i / 10, by); ctx.lineTo(bx + bw * i / 10, by + bh); ctx.stroke(); }
      // border pulse
      ctx.strokeStyle = "hsl(" + ((frameT * 4) % 360) + " 90% 60%)"; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      // hp text
      ctx.fillStyle = "#fff"; ctx.font = "800 14px system-ui"; ctx.textAlign = "center"; ctx.fillText(Math.max(0, Math.ceil(boss.hp)) + " / " + boss.maxHp, W / 2, by + bh - 7);
      if (boss.enraged) { ctx.fillStyle = "#ff5a3a"; ctx.font = "900 13px system-ui"; ctx.fillText("⚡ ENRAGED ⚡", W / 2, by + bh + 16); }
      ctx.restore();
    }
    function drawHeroHP() {
      ctx.textAlign = "left"; ctx.font = "22px system-ui,'Segoe UI Emoji'";
      let s = ""; for (let i = 0; i < hero.maxHp; i++) s += i < hero.hp ? "❤️" : "🖤";
      ctx.fillText(s, 14, H - (54));
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "700 12px system-ui"; ctx.fillText("YOUR HP", 16, H - 78);
    }
    function drawCountdown() {
      if (phase !== "countdown") return;
      const n = Math.ceil(countdown - 0.9);
      ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.shadowColor = "#000"; ctx.shadowBlur = 20;
      if (countdown > 0.9) { const scl = 1 + (1 - (countdown % 1)) * 0.5; ctx.font = "900 " + (110 * scl) + "px system-ui"; ctx.fillText(n > 0 ? n : "", W / 2, H / 2); }
      else { ctx.font = "900 90px system-ui"; ctx.fillStyle = "#ffd84a"; ctx.fillText("FIGHT!", W / 2, H / 2); }
      ctx.shadowBlur = 0;
      ctx.font = "700 18px system-ui"; ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText("Maxwell descends...", W / 2, H * 0.62);
    }
    function drawEnd() {
      if (phase !== "end") return;
      ctx.fillStyle = "rgba(0,0,0," + Math.min(0.75, endT * 0.5) + ")"; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.shadowColor = "#000"; ctx.shadowBlur = 16;
      if (outcome === "win") { ctx.fillStyle = "#ffd84a"; ctx.font = "900 " + Math.min(56, W * 0.1) + "px system-ui"; ctx.fillText("MAXWELL DEFEATED!", W / 2, H * 0.4); ctx.fillStyle = "#fff"; ctx.font = "700 20px system-ui"; ctx.fillText("👑 You are the champion of the tower! 👑", W / 2, H * 0.4 + 44); ctx.fillText("Tap Exit to claim your reward", W / 2, H * 0.4 + 76); }
      else { ctx.fillStyle = "#ff6a6a"; ctx.font = "900 " + Math.min(52, W * 0.095) + "px system-ui"; ctx.fillText("YOU FELL...", W / 2, H * 0.4); ctx.fillStyle = "#fff"; ctx.font = "700 18px system-ui"; ctx.fillText("Maxwell had " + Math.max(0, Math.ceil(boss.hp)) + " HP left.", W / 2, H * 0.4 + 40); }
      ctx.shadowBlur = 0;
    }

    function render() {
      ctx.save();
      const ox = (Math.random() - 0.5) * shakeMag, oy = (Math.random() - 0.5) * shakeMag; ctx.translate(ox, oy);
      drawSky(); drawEmbers(); drawFloor(); drawShocks(); drawCrowd();
      // depth sort boss vs hero by z
      if (boss.z < hero.z) { drawBoss(); drawClaws(); drawHero(); } else { drawHero(); drawClaws(); drawBoss(); }
      drawSparks();
      ctx.restore();
      drawBossBar(); drawHeroHP(); drawCountdown(); drawEnd();
    }

    let last = performance.now();
    function loop(now) {
      if (!running) return;
      let dt = (now - last) / 1000; if (dt > 0.05) dt = 0.05; last = now;
      update(dt); render();
      raf = requestAnimationFrame(loop);
    }

    // ---- lifecycle ----
    function exit() {
      running = false; if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("resize", resize);
      if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} }
      if (fs.parentNode) fs.parentNode.removeChild(fs);
      if (outcome === "win" && opts.onWin) opts.onWin();
      if (opts.onExit) opts.onExit(outcome);
    }
    fs.querySelector("#mxbExit").onclick = exit;

    fs.classList.add("on"); resize();
    try { const fn = fs.requestFullscreen || fs.webkitRequestFullscreen; if (fn) fn.call(fs); } catch (e) {}
    try { const a = actx(); if (a && a.resume) a.resume(); } catch (e) {}
    last = performance.now(); raf = requestAnimationFrame(loop);

    const api = { exit: exit, _state: () => ({ phase: phase, bossHp: boss.hp, heroHp: hero.hp, outcome: outcome }) };
    try { window.__MXB = api; } catch (e) {}
    return api;
  }

  window.MG_MAXWELLBOSS = { start: start };
})();
