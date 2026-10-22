// ===== MaxwellGames: SATISFYING SIMS hub (Ball vs Ball + more) =====
(function () {
  const SW = 405, SH = 720;
  let AC, recDest = null;
  function actx() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (!recDest && AC.createMediaStreamDestination) recDest = AC.createMediaStreamDestination(); return AC; } catch (e) { return null; } }
  function tone(f, d, ty, v) { const a = actx(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.type = ty || "sine"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v || 0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(a.destination); if (recDest) g.connect(recDest); o.start(t); o.stop(t + d); }

  let raf = null, cleanupFns = [];
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; cleanupFns.forEach((f) => { try { f(); } catch (e) {} }); cleanupFns = []; }
  function close() { stop(); const o = document.getElementById("simsOv"); if (o) { document.removeEventListener("keydown", o._esc); o.remove(); } }

  function open() {
    close();
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = "simsOv";
    ov.innerHTML = '<div class="arcade-box"><div class="arcade-head sims-head"><button class="btn ar-back hidden" id="simBack">← Sims</button><h2 id="simTitle" style="flex:1;text-align:center;margin:0">🌀 Satisfying Sims</h2><button class="btn ar-x" id="simClose">✕</button></div><div class="arcade-body" id="simBody"></div></div>';
    document.body.appendChild(ov);
    document.getElementById("simClose").onclick = close;
    document.getElementById("simBack").onclick = hub;
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    const esc = (e) => { if (e.key === "Escape") { if (!document.getElementById("simBack").classList.contains("hidden")) hub(); else close(); } }; document.addEventListener("keydown", esc); ov._esc = esc;
    hub();
  }

  function hub() {
    stop(); document.getElementById("simBack").classList.add("hidden"); document.getElementById("simTitle").textContent = "🌀 Satisfying Sims";
    const body = document.getElementById("simBody"); body.className = "arcade-body menu"; body.innerHTML = '<p class="ar-hint">Hypnotic simulations you can watch & record as shorts! 🎬</p><div class="ar-grid" id="simGrid"></div>';
    const grid = body.querySelector("#simGrid");
    SIMS.forEach((s) => { const t = document.createElement("button"); t.className = "ar-tile is-new"; t.innerHTML = '<span class="ar-ic">' + s.icon + '</span><span class="ar-name">' + s.name + '</span><span class="ar-best">' + s.tag + '</span>'; t.onclick = () => launch(s); grid.appendChild(t); });
  }

  function launch(sim) {
    stop(); document.getElementById("simBack").classList.remove("hidden"); document.getElementById("simTitle").textContent = sim.icon + " " + sim.name;
    const body = document.getElementById("simBody"); body.className = "arcade-body game"; body.innerHTML = "";
    if (sim.setup) sim.setup(body, (opts) => runSim(sim, opts)); else runSim(sim, {});
  }

  function runSim(sim, opts) {
    const body = document.getElementById("simBody"); body.className = "arcade-body game"; body.innerHTML = "";
    const stage = document.createElement("div"); stage.className = "sim-stage"; body.appendChild(stage);
    const c = document.createElement("canvas"); c.width = SW; c.height = SH; c.className = "sim-canvas"; stage.appendChild(c);
    const x = c.getContext("2d");
    const bar = document.createElement("div"); bar.className = "sim-bar";
    bar.innerHTML = '<button class="btn sim-rec" id="simRec">● Record 12s</button><button class="btn" id="simFull">⛶ Fullscreen</button><button class="btn" id="simReplay">↻ Replay</button>';
    stage.appendChild(bar);
    const api = { tone: tone, img: (document.querySelector(".logo-img") || {}).src || "maxwell.png", W: SW, H: SH };
    try { const a = actx(); if (a && a.resume) a.resume(); } catch (e) {}
    let st = sim.init(x, opts, api);
    function loop() { sim.step(st); sim.draw(x, st); raf = requestAnimationFrame(loop); }
    loop();
    document.getElementById("simReplay").onclick = () => { st = sim.init(x, opts, api); };
    document.getElementById("simFull").onclick = () => { const fn = stage.requestFullscreen || stage.webkitRequestFullscreen; if (fn) try { fn.call(stage); } catch (e) {} else stage.classList.add("fake-full"); };
    // record
    const recBtn = document.getElementById("simRec");
    recBtn.onclick = () => {
      if (recBtn.disabled) return;
      if (!window.MediaRecorder) { recBtn.textContent = "No record support"; return; }
      let stream; try { stream = c.captureStream(60); } catch (e) { recBtn.textContent = "Can't record"; return; }
      try { const a = actx(); if (a && a.resume) a.resume(); if (recDest) { const tr = recDest.stream.getAudioTracks()[0]; if (tr) stream.addTrack(tr); } } catch (e) {}
      const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
      let rec; try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); } catch (e) { recBtn.textContent = "Can't record"; return; }
      const chunks = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => { const blob = new Blob(chunks, { type: "video/webm" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "maxwell-sim-" + Date.now() + ".webm"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); recBtn.textContent = "✅ Saved!"; try { window.MG.addTreats(15); } catch (e) {} setTimeout(() => { recBtn.textContent = "● Record 12s"; recBtn.disabled = false; }, 2500); };
      rec.start(); recBtn.disabled = true; let left = 12; recBtn.textContent = "● Rec " + left + "s"; const iv = setInterval(() => { left--; recBtn.textContent = "● Rec " + left + "s"; if (left <= 0) { clearInterval(iv); try { rec.stop(); } catch (e) {} } }, 1000); cleanupFns.push(() => { clearInterval(iv); try { if (rec.state !== "inactive") rec.stop(); } catch (e) {} });
    };
    cleanupFns.push(() => { if (document.fullscreenElement) try { document.exitFullscreen(); } catch (e) {} });
  }

  // ---------- shared draw helpers ----------
  function drawBallImg(x, b) {
    if (b.img && b.img.complete && b.img.naturalWidth) { x.save(); x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.clip(); x.drawImage(b.img, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); x.restore(); x.strokeStyle = "rgba(255,255,255,.5)"; x.lineWidth = 2; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.stroke(); }
    else if (b.emoji) { x.font = (b.r * 1.9 | 0) + "px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(b.emoji, b.x, b.y); }
    else { const g = x.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r); g.addColorStop(0, "hsl(" + b.hue + " 100% 75%)"); g.addColorStop(1, "hsl(" + b.hue + " 90% 48%)"); x.fillStyle = g; x.shadowColor = "hsl(" + b.hue + " 95% 60%)"; x.shadowBlur = 20; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); x.shadowBlur = 0; }
  }

  // picker builder for ball config
  function ballPicker(host, label, defHue) {
    const wrap = document.createElement("div"); wrap.className = "bvb-picker";
    wrap.innerHTML = '<div class="bvb-label">' + label + '</div><div class="bvb-prev"></div><input class="sball-input bvb-emoji" placeholder="emoji e.g. 🔥" maxlength="4"><div class="bvb-colors"></div><button class="btn bvb-up">🖼️ Picture</button>';
    host.appendChild(wrap);
    const cfg = { hue: defHue, emoji: null, img: null };
    const prev = wrap.querySelector(".bvb-prev");
    function upd() { prev.style.background = cfg.img ? "#222" : "hsl(" + cfg.hue + " 90% 55%)"; prev.textContent = cfg.emoji || (cfg.img ? "🖼️" : ""); }
    ["0", "40", "120", "200", "280", "320"].forEach((h) => { const b = document.createElement("button"); b.className = "bvb-sw"; b.style.background = "hsl(" + h + " 90% 55%)"; b.onclick = () => { cfg.hue = +h; cfg.img = null; cfg.emoji = null; wrap.querySelector(".bvb-emoji").value = ""; upd(); }; wrap.querySelector(".bvb-colors").appendChild(b); });
    wrap.querySelector(".bvb-emoji").oninput = (e) => { cfg.emoji = e.target.value.trim() || null; cfg.img = null; upd(); };
    const fi = document.createElement("input"); fi.type = "file"; fi.accept = "image/*"; fi.style.display = "none"; wrap.appendChild(fi);
    wrap.querySelector(".bvb-up").onclick = () => fi.click();
    fi.onchange = () => { const f = fi.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { cfg.img = im; cfg.emoji = null; upd(); }; im.src = rd.result; }; rd.readAsDataURL(f); };
    upd();
    return cfg;
  }

  const SIMS = [
    // ---------- BALL vs BALL ----------
    {
      key: "bvb", name: "Ball vs Ball", icon: "⚔️", tag: "pick 2 balls!",
      setup(host, start) {
        const intro = document.createElement("p"); intro.className = "ar-hint"; intro.innerHTML = "Set up <b>Ball 1</b> and <b>Ball 2</b> (color, emoji, or your own picture), then battle! First to <b>30 bounces</b> wins. 🏆"; host.appendChild(intro);
        const row = document.createElement("div"); row.className = "bvb-row"; host.appendChild(row);
        const c1 = ballPicker(row, "🟢 Ball 1", 120), c2 = ballPicker(row, "🩷 Ball 2", 330);
        const go = document.createElement("button"); go.className = "btn asc-btn"; go.textContent = "⚔️ START BATTLE"; go.style.marginTop = "10px"; host.appendChild(go);
        go.onclick = () => start({ b1: c1, b2: c2 });
      },
      init(x, opts) {
        const mk = (cfg, side) => ({ x: side < 0 ? SW * 0.3 : SW * 0.7, y: SH * 0.4, vx: (Math.random() * 2 - 1) * 4 + side * 2, vy: -3, r: 26, hue: cfg.hue, emoji: cfg.emoji, img: cfg.img, score: 0 });
        return { b1: mk(opts.b1 || { hue: 120 }, -1), b2: mk(opts.b2 || { hue: 330 }, 1), target: 30, winner: 0, parts: [], t: 0 };
      },
      step(s) {
        s.t++;
        const arena = { l: 16, r: SW - 16, t: 120, b: SH - 40 };
        [s.b1, s.b2].forEach((b) => {
          if (s.winner) return;
          b.vy += 0.26; b.x += b.vx; b.y += b.vy;
          let hit = false;
          if (b.x - b.r < arena.l) { b.x = arena.l + b.r; b.vx = Math.abs(b.vx); hit = true; }
          else if (b.x + b.r > arena.r) { b.x = arena.r - b.r; b.vx = -Math.abs(b.vx); hit = true; }
          if (b.y - b.r < arena.t) { b.y = arena.t + b.r; b.vy = Math.abs(b.vy); hit = true; }
          else if (b.y + b.r > arena.b) { b.y = arena.b - b.r; b.vy = -Math.abs(b.vy); hit = true; }
          const sp = Math.hypot(b.vx, b.vy); if (sp < 5) { const k = 5 / (sp || 1); b.vx *= k; b.vy *= k; } else if (sp > 15) { const k = 15 / sp; b.vx *= k; b.vy *= k; }
          if (hit) { b.score++; b.r = Math.min(46, b.r + 0.6); tone(300 + b.score * 10, 0.05); for (let i = 0; i < 4; i++) s.parts.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 24, hue: b.hue }); if (b.score >= s.target) { s.winner = b === s.b1 ? 1 : 2; for (let i = 0; i < 60; i++) s.parts.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9, life: 50, hue: Math.random() * 360 }); try { window.MG.boomSound(0.12); } catch (e) {} } }
        });
        // ball-ball collision
        const a = s.b1, b = s.b2, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001, md = a.r + b.r;
        if (d < md && !s.winner) { const nx = dx / d, ny = dy / d, ov = (md - d) / 2; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov; const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rel < 0) { a.vx += rel * nx; a.vy += rel * ny; b.vx -= rel * nx; b.vy -= rel * ny; } tone(500, 0.04); }
        s.parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--; }); s.parts = s.parts.filter((p) => p.life > 0);
      },
      draw(x, s) {
        const g = x.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, "#0b1030"); g.addColorStop(1, "#04050c"); x.fillStyle = g; x.fillRect(0, 0, SW, SH);
        // scoreboard
        x.fillStyle = "#fff"; x.font = "900 34px system-ui"; x.textAlign = "center"; x.fillText("BALL 1   VS   BALL 2", SW / 2, 44);
        const bw = SW * 0.4;
        x.fillStyle = "#222"; x.fillRect(16, 60, bw, 18); x.fillStyle = "#222"; x.fillRect(SW - 16 - bw, 60, bw, 18);
        x.fillStyle = "hsl(" + s.b1.hue + " 90% 55%)"; x.fillRect(16, 60, bw * Math.min(1, s.b1.score / s.target), 18);
        x.fillStyle = "hsl(" + s.b2.hue + " 90% 55%)"; x.fillRect(SW - 16 - bw * Math.min(1, s.b2.score / s.target), 60, bw * Math.min(1, s.b2.score / s.target), 18);
        x.font = "800 22px system-ui"; x.textAlign = "left"; x.fillStyle = "#fff"; x.fillText(s.b1.score, 16, 98); x.textAlign = "right"; x.fillText(s.b2.score, SW - 16, 98);
        // arena
        x.strokeStyle = "rgba(255,255,255,.25)"; x.lineWidth = 3; x.strokeRect(16, 120, SW - 32, SH - 160);
        s.parts.forEach((p) => { x.globalAlpha = Math.max(0, p.life / 40); x.fillStyle = "hsl(" + p.hue + " 90% 60%)"; x.fillRect(p.x - 2, p.y - 2, 4, 4); x.globalAlpha = 1; });
        drawBallImg(x, s.b1); drawBallImg(x, s.b2);
        if (s.winner) { x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(0, SH / 2 - 60, SW, 120); x.fillStyle = "#ffd84a"; x.font = "900 46px system-ui"; x.textAlign = "center"; x.fillText("BALL " + s.winner + " WINS!", SW / 2, SH / 2 + 16); }
        x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, SH - 14);
      }
    },

    // ---------- PLINKO ----------
    {
      key: "plinko", name: "Plinko Drop", icon: "🔵", tag: "watch & record",
      init() { const pegs = []; const rows = 11; for (let r = 0; r < rows; r++) { const n = r + 3; const y = 130 + r * 44; for (let i = 0; i < n; i++) { const x = SW / 2 + (i - (n - 1) / 2) * 42; pegs.push({ x, y }); } } const slots = new Array(10).fill(0); return { pegs, slots, balls: [], t: 0 }; },
      step(s) { s.t++; if (s.t % 16 === 0 && s.balls.length < 40) s.balls.push({ x: SW / 2 + (Math.random() - 0.5) * 30, y: 90, vx: 0, vy: 0, r: 8, hue: (s.t * 7) % 360 }); s.balls.forEach((b) => { b.vy += 0.3; b.x += b.vx; b.y += b.vy; s.pegs.forEach((p) => { const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy); if (d < b.r + 6) { const nx = dx / d, ny = dy / d; b.x = p.x + nx * (b.r + 6); b.y = p.y + ny * (b.r + 6); const dot = b.vx * nx + b.vy * ny; b.vx = (b.vx - 2 * dot * nx) * 0.7 + (Math.random() - 0.5); b.vy = (b.vy - 2 * dot * ny) * 0.7; tone(600 + b.hue, 0.02, "square", 0.03); } }); if (b.x < 10) { b.x = 10; b.vx = Math.abs(b.vx); } if (b.x > SW - 10) { b.x = SW - 10; b.vx = -Math.abs(b.vx); } }); s.balls = s.balls.filter((b) => { if (b.y > SH - 50) { const si = Math.max(0, Math.min(9, Math.floor(b.x / (SW / 10)))); s.slots[si]++; return false; } return true; }); },
      draw(x, s) { x.fillStyle = "#0a0e1c"; x.fillRect(0, 0, SW, SH); s.pegs.forEach((p) => { x.fillStyle = "#4a5578"; x.beginPath(); x.arc(p.x, p.y, 5, 0, 7); x.fill(); }); const sw = SW / 10; for (let i = 0; i < 10; i++) { x.fillStyle = "hsl(" + (i * 36) + " 70% 40%)"; x.fillRect(i * sw + 1, SH - 46, sw - 2, 46); x.fillStyle = "#fff"; x.font = "bold 14px system-ui"; x.textAlign = "center"; x.fillText(s.slots[i], i * sw + sw / 2, SH - 20); } s.balls.forEach((b) => { x.fillStyle = "hsl(" + b.hue + " 90% 60%)"; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); }); x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, 30); }
    },

    // ---------- FALLING SAND ----------
    {
      key: "sand", name: "Falling Sand", icon: "⏳", tag: "oddly satisfying",
      init() { const CELL = 6, GW = Math.floor(SW / CELL), GH = Math.floor(SH / CELL); const grid = new Array(GW * GH).fill(0); return { CELL, GW, GH, grid, t: 0 }; },
      step(s) { s.t++; const { GW, GH, grid } = s; for (let k = 0; k < 4; k++) { const gx = (GW / 2 + Math.floor((Math.random() - 0.5) * GW * 0.5)) | 0; if (gx >= 0 && gx < GW && !grid[gx]) grid[gx] = 1 + ((s.t) % 360); } for (let y = GH - 2; y >= 0; y--) for (let xx = 0; xx < GW; xx++) { const i = y * GW + xx; if (!grid[i]) continue; const below = (y + 1) * GW + xx; if (!grid[below]) { grid[below] = grid[i]; grid[i] = 0; } else { const dir = Math.random() < 0.5 ? -1 : 1; const dl = (y + 1) * GW + xx + dir; if (xx + dir >= 0 && xx + dir < GW && !grid[dl]) { grid[dl] = grid[i]; grid[i] = 0; } } } },
      draw(x, s) { x.fillStyle = "#07080f"; x.fillRect(0, 0, SW, SH); const { CELL, GW, GH, grid } = s; for (let y = 0; y < GH; y++) for (let xx = 0; xx < GW; xx++) { const v = grid[y * GW + xx]; if (v) { x.fillStyle = "hsl(" + ((v - 1)) + " 85% 55%)"; x.fillRect(xx * CELL, y * CELL, CELL, CELL); } } x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, 30); }
    },

    // ---------- FIREWORKS ----------
    {
      key: "fireworks", name: "Fireworks", icon: "🎆", tag: "boom!",
      init() { return { rockets: [], parts: [], t: 0 }; },
      step(s) { s.t++; if (s.t % 26 === 0) s.rockets.push({ x: 60 + Math.random() * (SW - 120), y: SH, vy: -(9 + Math.random() * 3), ty: 120 + Math.random() * 240, hue: Math.random() * 360 }); s.rockets = s.rockets.filter((r) => { r.y += r.vy; if (r.y <= r.ty) { for (let i = 0; i < 60; i++) { const a = Math.random() * 7, sp = 1 + Math.random() * 5; s.parts.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 60, hue: r.hue }); } tone(120, 0.3, "triangle", 0.05); return false; } return true; }); s.parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= 0.99; p.life--; }); s.parts = s.parts.filter((p) => p.life > 0); },
      draw(x, s) { x.fillStyle = "rgba(4,4,14,0.25)"; x.fillRect(0, 0, SW, SH); s.rockets.forEach((r) => { x.fillStyle = "hsl(" + r.hue + " 90% 70%)"; x.fillRect(r.x - 2, r.y - 6, 4, 10); }); s.parts.forEach((p) => { x.globalAlpha = Math.max(0, p.life / 60); x.fillStyle = "hsl(" + p.hue + " 90% 65%)"; x.beginPath(); x.arc(p.x, p.y, 2.5, 0, 7); x.fill(); x.globalAlpha = 1; }); x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, SH - 14); }
    },

    // ---------- LAVA LAMP ----------
    {
      key: "lava", name: "Lava Lamp", icon: "🫧", tag: "chill vibes",
      init() { const blobs = []; for (let i = 0; i < 7; i++) blobs.push({ x: Math.random() * SW, y: Math.random() * SH, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, r: 40 + Math.random() * 50, hue: 300 + Math.random() * 60 }); return { blobs, t: 0 }; },
      step(s) { s.t++; s.blobs.forEach((b) => { b.x += b.vx; b.y += b.vy; if (b.x < 0 || b.x > SW) b.vx *= -1; if (b.y < 0 || b.y > SH) b.vy *= -1; }); },
      draw(x, s) { const g = x.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, "#2a0540"); g.addColorStop(1, "#4a0820"); x.fillStyle = g; x.fillRect(0, 0, SW, SH); x.globalCompositeOperation = "lighter"; s.blobs.forEach((b) => { const rg = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); rg.addColorStop(0, "hsla(" + b.hue + ",90%,60%,0.9)"); rg.addColorStop(1, "hsla(" + b.hue + ",90%,60%,0)"); x.fillStyle = rg; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); }); x.globalCompositeOperation = "source-over"; x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, 30); }
    },

    // ---------- HYPNO SPIRAL ----------
    {
      key: "spiral", name: "Hypno Spiral", icon: "🌀", tag: "mesmerizing",
      init() { return { t: 0 }; },
      step(s) { s.t++; },
      draw(x, s) { x.fillStyle = "#05060f"; x.fillRect(0, 0, SW, SH); const cx = SW / 2, cy = SH / 2; for (let i = 0; i < 220; i++) { const a = i * 0.3 + s.t * 0.02, r = i * 1.7; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; x.fillStyle = "hsl(" + ((i * 2 + s.t * 2) % 360) + " 90% 60%)"; x.beginPath(); x.arc(px, py, 3 + (i % 5), 0, 7); x.fill(); } x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, SH - 14); }
    },

    // ---------- DVD BOUNCE ----------
    {
      key: "dvd", name: "Corner Hit?", icon: "📀", tag: "will it hit?",
      init(x, o, api) { const im = new Image(); im.src = api ? api.img : "maxwell.png"; return { x: 60, y: 60, vx: 2.4, vy: 2.0, w: 90, h: 90, hue: 0, corners: 0, flash: 0, img: im }; },
      step(s) { s.x += s.vx; s.y += s.vy; let hit = false, corner = 0; if (s.x < 0) { s.x = 0; s.vx = Math.abs(s.vx); hit = true; corner++; } if (s.x + s.w > SW) { s.x = SW - s.w; s.vx = -Math.abs(s.vx); hit = true; corner++; } if (s.y < 90) { s.y = 90; s.vy = Math.abs(s.vy); hit = true; corner++; } if (s.y + s.h > SH) { s.y = SH - s.h; s.vy = -Math.abs(s.vy); hit = true; corner++; } if (hit) { s.hue = (s.hue + 47) % 360; tone(400, 0.05); } if (corner >= 2) { s.corners++; s.flash = 40; try { window.MG.boomSound(0.12); } catch (e) {} } if (s.flash > 0) s.flash--; },
      draw(x, s) { x.fillStyle = s.flash > 0 ? "hsl(" + s.hue + " 60% 20%)" : "#06070f"; x.fillRect(0, 0, SW, SH); x.fillStyle = "#fff"; x.font = "900 26px system-ui"; x.textAlign = "center"; x.fillText("CORNER HITS: " + s.corners, SW / 2, 50); x.save(); x.beginPath(); x.rect(s.x, s.y, s.w, s.h); x.clip(); if (s.img.complete) { x.globalAlpha = 1; x.drawImage(s.img, s.x, s.y, s.w, s.h); } x.restore(); x.fillStyle = "hsla(" + s.hue + ",90%,60%,0.35)"; x.fillRect(s.x, s.y, s.w, s.h); x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.fillText("MaxwellGames", SW / 2, SH - 14); }
    },

    // ---------- Game of Life ----------
    {
      key: "life", name: "Game of Life", icon: "🦠", tag: "cells evolve",
      init() { const CELL = 9, GW = Math.floor(SW / CELL), GH = Math.floor(SH / CELL); const g = new Array(GW * GH); for (let i = 0; i < g.length; i++) g[i] = Math.random() < 0.28 ? 1 : 0; return { CELL, GW, GH, g, t: 0, gen: 0 }; },
      step(s) { s.t++; if (s.t % 4) return; const { GW, GH, g } = s; const n = new Array(GW * GH); let live = 0; for (let y = 0; y < GH; y++) for (let xx = 0; xx < GW; xx++) { let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const ny = y + dy, nx = xx + dx; if (nx >= 0 && nx < GW && ny >= 0 && ny < GH && g[ny * GW + nx]) c++; } const i = y * GW + xx; n[i] = g[i] ? (c === 2 || c === 3 ? 1 : 0) : (c === 3 ? 1 : 0); if (n[i]) live++; } s.g = n; s.gen++; if (live < 12) for (let i = 0; i < s.g.length; i++) if (Math.random() < 0.28) s.g[i] = 1; },
      draw(x, s) { x.fillStyle = "#05070f"; x.fillRect(0, 0, SW, SH); const { CELL, GW, GH, g } = s; for (let y = 0; y < GH; y++) for (let xx = 0; xx < GW; xx++) if (g[y * GW + xx]) { x.fillStyle = "hsl(" + ((xx + y + s.gen) * 3 % 360) + " 80% 58%)"; x.fillRect(xx * CELL, y * CELL, CELL - 1, CELL - 1); } x.fillStyle = "rgba(255,255,255,.55)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("Gen " + s.gen, SW / 2, 28); x.fillText("MaxwellGames", SW / 2, SH - 14); }
    },

    // ---------- Solar System ----------
    {
      key: "solar", name: "Solar System", icon: "🪐", tag: "orbits",
      init() { const planets = []; for (let i = 0; i < 6; i++) planets.push({ r: 55 + i * 48, a: Math.random() * 7, sp: 0.02 - i * 0.0026, size: 6 + Math.random() * 10, hue: Math.random() * 360, trail: [] }); return { planets, t: 0 }; },
      step(s) { s.t++; s.planets.forEach((p) => { p.a += p.sp; const cx = SW / 2 + Math.cos(p.a) * p.r, cy = SH / 2 + Math.sin(p.a) * p.r; p.trail.push([cx, cy]); if (p.trail.length > 40) p.trail.shift(); }); },
      draw(x, s) { x.fillStyle = "#03040c"; x.fillRect(0, 0, SW, SH); for (let i = 0; i < 60; i++) { x.fillStyle = "rgba(255,255,255," + (0.1 + (i % 5) * 0.12) + ")"; x.fillRect((i * 97) % SW, (i * 53) % SH, 2, 2); } const sun = x.createRadialGradient(SW / 2, SH / 2, 4, SW / 2, SH / 2, 34); sun.addColorStop(0, "#fff3b0"); sun.addColorStop(1, "#ff8a00"); x.fillStyle = sun; x.beginPath(); x.arc(SW / 2, SH / 2, 30, 0, 7); x.fill(); s.planets.forEach((p) => { x.strokeStyle = "rgba(255,255,255,.07)"; x.beginPath(); x.arc(SW / 2, SH / 2, p.r, 0, 7); x.stroke(); p.trail.forEach((pt, i) => { x.globalAlpha = i / p.trail.length * 0.5; x.fillStyle = "hsl(" + p.hue + " 80% 60%)"; x.beginPath(); x.arc(pt[0], pt[1], p.size * 0.5, 0, 7); x.fill(); }); x.globalAlpha = 1; const cx = SW / 2 + Math.cos(p.a) * p.r, cy = SH / 2 + Math.sin(p.a) * p.r; x.fillStyle = "hsl(" + p.hue + " 85% 62%)"; x.shadowColor = "hsl(" + p.hue + " 85% 62%)"; x.shadowBlur = 12; x.beginPath(); x.arc(cx, cy, p.size, 0, 7); x.fill(); x.shadowBlur = 0; }); x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, SH - 14); }
    },

    // ---------- Pendulum Wave ----------
    {
      key: "pendulum", name: "Pendulum Wave", icon: "🎯", tag: "hypnotic",
      init() { const N = 18, p = []; for (let i = 0; i < N; i++) p.push({ len: 120 + i * 24, a: 1.0, sp: 0 }); return { p, t: 0 }; },
      step(s) { s.t += 0.016; s.p.forEach((pn, i) => { const g = 0.00024 * (1 + i * 0.05); pn.a = Math.cos(s.t * Math.sqrt(9.8 / (pn.len / 120)) * 0.6) * 1.0; }); },
      draw(x, s) { x.fillStyle = "#070a14"; x.fillRect(0, 0, SW, SH); const ox = SW / 2, oy = 70; s.p.forEach((pn, i) => { const px = ox + Math.sin(pn.a) * pn.len, py = oy + Math.cos(pn.a) * pn.len; x.strokeStyle = "rgba(255,255,255,.12)"; x.beginPath(); x.moveTo(ox, oy); x.lineTo(px, py); x.stroke(); x.fillStyle = "hsl(" + (i / s.p.length * 300) + " 85% 60%)"; x.shadowColor = x.fillStyle; x.shadowBlur = 14; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill(); x.shadowBlur = 0; }); x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, SH - 14); }
    },

    // ---------- Boids (flocking) ----------
    {
      key: "boids", name: "Flocking", icon: "🐦", tag: "swarm",
      init() { const b = []; for (let i = 0; i < 60; i++) b.push({ x: Math.random() * SW, y: Math.random() * SH, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1 }); return { b, t: 0 }; },
      step(s) { const b = s.b; b.forEach((p) => { let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0; b.forEach((o) => { if (o === p) return; const dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy); if (d < 70 && d > 0) { ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; if (d < 26) { sx -= dx / d; sy -= dy / d; } n++; } }); if (n) { p.vx += (ax / n - p.vx) * 0.04 + (cx / n - p.x) * 0.0012 + sx * 0.06; p.vy += (ay / n - p.vy) * 0.04 + (cy / n - p.y) * 0.0012 + sy * 0.06; } const sp = Math.hypot(p.vx, p.vy); if (sp > 3) { p.vx *= 3 / sp; p.vy *= 3 / sp; } p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x += SW; if (p.x > SW) p.x -= SW; if (p.y < 0) p.y += SH; if (p.y > SH) p.y -= SH; }); s.t++; },
      draw(x, s) { x.fillStyle = "rgba(6,10,22,0.35)"; x.fillRect(0, 0, SW, SH); s.b.forEach((p) => { const ang = Math.atan2(p.vy, p.vx); x.save(); x.translate(p.x, p.y); x.rotate(ang); x.fillStyle = "hsl(" + ((s.t + p.x) % 360) + " 85% 65%)"; x.beginPath(); x.moveTo(8, 0); x.lineTo(-6, 4); x.lineTo(-6, -4); x.closePath(); x.fill(); x.restore(); }); x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, SH - 14); }
    },

    // ---------- Kaleidoscope ----------
    {
      key: "kaleido", name: "Kaleidoscope", icon: "🔷", tag: "symmetry",
      init() { const dots = []; for (let i = 0; i < 14; i++) dots.push({ a: Math.random() * 7, r: Math.random() * 180, da: (Math.random() - 0.5) * 0.03, dr: (Math.random() - 0.5) * 1.2, hue: Math.random() * 360, sz: 6 + Math.random() * 16 }); return { dots, t: 0 }; },
      step(s) { s.t++; s.dots.forEach((d) => { d.a += d.da; d.r += d.dr; if (d.r < 10 || d.r > 190) d.dr *= -1; }); },
      draw(x, s) { x.fillStyle = "rgba(4,4,12,0.2)"; x.fillRect(0, 0, SW, SH); const cx = SW / 2, cy = SH / 2, SEG = 10; for (let seg = 0; seg < SEG; seg++) { x.save(); x.translate(cx, cy); x.rotate(seg / SEG * Math.PI * 2); if (seg % 2) x.scale(1, -1); s.dots.forEach((d) => { const px = Math.cos(d.a) * d.r, py = Math.sin(d.a) * d.r; x.fillStyle = "hsla(" + ((d.hue + s.t) % 360) + ",85%,62%,0.85)"; x.beginPath(); x.arc(px, py, d.sz, 0, 7); x.fill(); }); x.restore(); } x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, SH - 14); }
    },

    // ---------- Rain Ripples ----------
    {
      key: "rain", name: "Rain Ripples", icon: "🌧️", tag: "calming",
      init() { return { drops: [], ripples: [], t: 0 }; },
      step(s) { s.t++; if (s.t % 3 === 0) s.drops.push({ x: Math.random() * SW, y: -10, v: 9 + Math.random() * 5 }); s.drops.forEach((d) => d.y += d.v); s.drops = s.drops.filter((d) => { if (d.y >= SH - 60 - Math.random() * 40) { s.ripples.push({ x: d.x, y: d.y, r: 2, max: 20 + Math.random() * 40, hue: 190 + Math.random() * 40 }); tone(300 + Math.random() * 300, 0.03, "sine", 0.02); return false; } return true; }); s.ripples.forEach((rp) => rp.r += 1.3); s.ripples = s.ripples.filter((rp) => rp.r < rp.max); },
      draw(x, s) { const g = x.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, "#0a1830"); g.addColorStop(1, "#061020"); x.fillStyle = g; x.fillRect(0, 0, SW, SH); x.strokeStyle = "rgba(150,200,255,0.4)"; x.lineWidth = 2; s.drops.forEach((d) => { x.beginPath(); x.moveTo(d.x, d.y); x.lineTo(d.x, d.y - 12); x.stroke(); }); s.ripples.forEach((rp) => { x.globalAlpha = Math.max(0, 1 - rp.r / rp.max); x.strokeStyle = "hsl(" + rp.hue + " 80% 70%)"; x.lineWidth = 2; x.beginPath(); x.ellipse(rp.x, rp.y, rp.r, rp.r * 0.4, 0, 0, 7); x.stroke(); }); x.globalAlpha = 1; x.fillStyle = "rgba(255,255,255,.5)"; x.font = "800 20px system-ui"; x.textAlign = "center"; x.fillText("MaxwellGames", SW / 2, 28); }
    }
  ];

  window.MG_SIMS = { open: open, close: close };
  function wire() { const b = document.getElementById("simsBtn"); if (b) b.onclick = open; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
