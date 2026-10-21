// ===== MaxwellGames: ONLINE BATTLE — Rock Paper Meow vs a friend (Firebase rooms) =====
(function () {
  let AC;
  function tone(f, d, ty, v) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = ty || "square"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} }
  function dbURL() { try { const f = window.MG_FIREBASE_CONFIG; return f && f.databaseURL ? f.databaseURL.replace(/\/$/, "") : null; } catch (e) { return null; } }
  function fetchJSON(url, opts, ms) { return new Promise(function (res, rej) { const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null; const to = setTimeout(function () { if (ctrl) ctrl.abort(); rej(new Error("timeout")); }, ms || 6000); fetch(url, Object.assign({ signal: ctrl ? ctrl.signal : undefined }, opts || {})).then(function (r) { clearTimeout(to); return r.ok ? r.json() : Promise.reject(); }).then(res).catch(function (e) { clearTimeout(to); rej(e); }); }); }
  const OPT = [["✊", "Rock"], ["✋", "Paper"], ["✌️", "Scissors"]];
  function beats(a, b) { return (a === 0 && b === 2) || (a === 1 && b === 0) || (a === 2 && b === 1); }

  let poll = null;
  function stopPoll() { if (poll) { clearInterval(poll); poll = null; } }
  function close() { stopPoll(); const o = document.getElementById("battleOv"); if (o) { if (o._clean2) try { o._clean2(); } catch (e) {} document.removeEventListener("keydown", o._esc); o.remove(); } }

  function open() {
    close();
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = "battleOv";
    ov.innerHTML = '<div class="arcade-box battle-box"><div class="arcade-head battle-head"><button class="btn ar-back hidden" id="bBack">← Back</button><h2 id="bTitle">🌐 Maxwell Battle</h2><button class="btn ar-x" id="bClose">✕</button></div><div class="arcade-body battle-body" id="bBody"></div></div>';
    document.body.appendChild(ov);
    document.getElementById("bClose").onclick = close;
    document.getElementById("bBack").onclick = menu;
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    const esc = (e) => { if (e.key === "Escape") close(); }; document.addEventListener("keydown", esc); ov._esc = esc;
    menu();
  }

  function setTitle(t) { document.getElementById("bTitle").textContent = t; }
  function back(show) { document.getElementById("bBack").classList.toggle("hidden", !show); }

  const MODES = [
    { key: "rps", name: "Rock Paper Meow", icon: "✊", tag: "Online + CPU", fn: () => rpsMenu() },
    { key: "ttt", name: "Tic-Tac-Toe", icon: "⭕", tag: "vs CPU", fn: () => tttBattle() },
    { key: "dice", name: "Dice War", icon: "🎲", tag: "vs CPU", fn: () => diceWar() },
    { key: "math", name: "Math Duel", icon: "➗", tag: "beat the CPU", fn: () => mathDuel() },
    { key: "c4", name: "Connect Four", icon: "🔴", tag: "vs CPU", fn: () => connect4Battle() },
    { key: "coin", name: "Coin War", icon: "🪙", tag: "vs CPU", fn: () => coinWar() }
  ];
  function menu() {
    stopPoll(); back(false); setTitle("🌐 Maxwell Battle");
    const body = document.getElementById("bBody"); body.className = "arcade-body battle-body"; body.innerHTML = `
      <p class="ar-hint">Pick a battle! Beat a friend online or the CPU — winners get 🐟.</p>
      <div class="ar-grid" id="bGames"></div>`;
    const grid = body.querySelector("#bGames");
    MODES.forEach((m) => { const t = document.createElement("button"); t.className = "ar-tile is-new"; t.innerHTML = '<span class="ar-ic">' + m.icon + '</span><span class="ar-name">' + m.name + '</span><span class="ar-best">' + m.tag + '</span>'; t.onclick = m.fn; grid.appendChild(t); });
  }

  function rpsMenu() {
    stopPoll(); back(true); setTitle("✊ Rock Paper Meow");
    const body = document.getElementById("bBody"); body.className = "arcade-body battle-body"; body.innerHTML = `
      <p class="ar-hint">First to 3 wins! Play online with a room code, or practice vs the computer.</p>
      <div class="battle-menu">
        <button class="btn asc-btn" id="bCreate">🌐 Create Online Room</button>
        <button class="btn asc-btn" id="bJoin">🔑 Join with Code</button>
        <button class="btn" id="bCpu">🤖 Practice vs CPU</button>
      </div>
      <p class="ar-hint" id="bNote"></p>`;
    document.getElementById("bCpu").onclick = cpuGame;
    document.getElementById("bCreate").onclick = createRoom;
    document.getElementById("bJoin").onclick = joinPrompt;
    if (!dbURL()) document.getElementById("bNote").textContent = "ℹ️ Online needs the Home (Firebase) connection. Practice vs CPU works offline.";
  }

  function reward(won) { try { if (won && window.MG) { window.MG.addTreats(40); window.MG.flag("battle"); } else if (window.MG) window.MG.addTreats(10); } catch (e) {} }

  // ---------- Tic-Tac-Toe battle ----------
  function tttBattle() {
    back(true); setTitle("⭕ Tic-Tac-Toe"); const body = document.getElementById("bBody"); body.className = "arcade-body battle-body";
    body.innerHTML = '<p class="ar-hint">You are 🐈. Beat Maxwell (👑)!</p><div class="ttt-grid" id="bTtt"></div><p class="ar-hint" id="bTttMsg">Your move</p>';
    let bd = ["", "", "", "", "", "", "", "", ""], done = false; const cells = []; const grid = body.querySelector("#bTtt");
    for (let i = 0; i < 9; i++) { const d = document.createElement("button"); d.className = "ttt-cell"; d.onclick = () => play(i); grid.appendChild(d); cells.push(d); }
    const WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    function win(b) { for (const w of WIN) if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) return b[w[0]]; return b.indexOf("") < 0 ? "draw" : null; }
    function best(b, who) { const w = win(b); if (w === "O") return { s: 10 }; if (w === "X") return { s: -10 }; if (w === "draw") return { s: 0 }; let mv = []; b.forEach((v, i) => { if (!v) { const nb = b.slice(); nb[i] = who; mv.push({ i: i, s: best(nb, who === "O" ? "X" : "O").s }); } }); return who === "O" ? mv.reduce((a, m) => m.s > a.s ? m : a, { s: -99 }) : mv.reduce((a, m) => m.s < a.s ? m : a, { s: 99 }); }
    function rend() { cells.forEach((c, i) => c.textContent = bd[i] === "X" ? "🐈" : bd[i] === "O" ? "👑" : ""); }
    function play(i) { if (done || bd[i]) return; bd[i] = "X"; tone(520, 0.05); rend(); let w = win(bd); if (w) return end(w); const m = best(bd, "O").i; if (m != null) { bd[m] = "O"; tone(400, 0.05); } rend(); w = win(bd); if (w) end(w); }
    function end(w) { done = true; const msg = body.querySelector("#bTttMsg"); const won = w === "X"; msg.textContent = won ? "🎉 You win! +40 🐟" : w === "draw" ? "Draw! +10 🐟" : "Maxwell wins 😼 +10 🐟"; reward(won); }
    rend();
  }

  // ---------- Dice War ----------
  function diceWar() {
    back(true); setTitle("🎲 Dice War"); const body = document.getElementById("bBody"); body.className = "arcade-body battle-body";
    body.innerHTML = '<p class="ar-hint">First to 3 round wins! Roll a higher die than Maxwell.</p><div class="battle-score"><span class="bs-you">You <b id="dwY">0</b></span><span class="bs-vs">vs</span><span class="bs-opp"><b id="dwO">0</b> Maxwell</span></div><div class="battle-show" id="dwShow">🎲 vs 🎲</div><button class="btn asc-btn" id="dwRoll">🎲 Roll</button><p class="ar-hint" id="dwMsg"></p>';
    let you = 0, opp = 0, done = false;
    body.querySelector("#dwRoll").onclick = () => { if (done) return; const a = 1 + (Math.random() * 6 | 0), b = 1 + (Math.random() * 6 | 0); body.querySelector("#dwShow").textContent = "🎲 " + a + "  vs  " + b + " 🎲"; if (a > b) { you++; tone(760, 0.08); } else if (b > a) { opp++; tone(240, 0.1, "sawtooth"); } body.querySelector("#dwY").textContent = you; body.querySelector("#dwO").textContent = opp; if (you >= 3 || opp >= 3) { done = true; const won = you >= 3; body.querySelector("#dwMsg").innerHTML = won ? "🎉 <b>You win! +40 🐟</b>" : "😿 Maxwell wins. +10 🐟"; reward(won); } };
  }

  // ---------- Math Duel ----------
  function mathDuel() {
    back(true); setTitle("➗ Math Duel"); const body = document.getElementById("bBody"); body.className = "arcade-body battle-body";
    const cpuTarget = 6 + (Math.random() * 4 | 0);
    body.innerHTML = '<p class="ar-hint">Answer as many as you can in <b>25s</b>! Beat Maxwell\'s score of <b>' + cpuTarget + '</b>.</p><div class="battle-score"><span class="bs-you">You <b id="mdY">0</b></span><span class="bs-vs">·</span><span class="bs-opp">⏱️ <b id="mdT">25</b>s</span></div><h3 class="md-q" id="mdQ"></h3><div class="trivia-opts" id="mdOpts"></div><p class="ar-hint" id="mdMsg"></p>';
    let score = 0, time = 25, done = false;
    function q() { if (done) return; const a = 2 + (Math.random() * 11 | 0), b = 2 + (Math.random() * 11 | 0), op = Math.random() < 0.5 ? "+" : "×"; const ans = op === "+" ? a + b : a * b; body.querySelector("#mdQ").textContent = a + " " + op + " " + b + " = ?"; const opts = [ans]; while (opts.length < 3) { const w = ans + (Math.random() * 10 | 0) - 5; if (w !== ans && w > 0 && opts.indexOf(w) < 0) opts.push(w); } opts.sort(() => Math.random() - 0.5); const wrap = body.querySelector("#mdOpts"); wrap.innerHTML = ""; opts.forEach((o) => { const bn = document.createElement("button"); bn.className = "btn trivia-opt"; bn.textContent = o; bn.onclick = () => { if (done) return; if (o === ans) { score++; tone(800, 0.06); body.querySelector("#mdY").textContent = score; } else tone(180, 0.1, "sawtooth"); q(); }; wrap.appendChild(bn); }); }
    q();
    const iv = setInterval(() => { const tEl = body.querySelector("#mdT"); if (!tEl || done) { clearInterval(iv); return; } time--; tEl.textContent = time; if (time <= 0) { done = true; clearInterval(iv); const won = score > cpuTarget; body.querySelector("#mdMsg").innerHTML = "Time! You got <b>" + score + "</b>, Maxwell got <b>" + cpuTarget + "</b> — " + (won ? "🎉 YOU WIN! +40 🐟" : "😿 +10 🐟"); reward(won); } }, 1000);
    document.getElementById("battleOv")._clean2 = () => clearInterval(iv);
  }

  // ---------- Connect Four battle ----------
  function connect4Battle() {
    back(true); setTitle("🔴 Connect Four"); const body = document.getElementById("bBody"); body.className = "arcade-body battle-body";
    const C = 7, R = 6, SZ = 46; body.innerHTML = '<p class="ar-hint">Drop discs (red). Get 4 in a row to beat Maxwell!</p><canvas id="c4cv" width="' + C * SZ + '" height="' + R * SZ + '" class="ar-canvas"></canvas><p class="ar-hint" id="c4Msg">Your turn</p>';
    const cv = body.querySelector("#c4cv"), x = cv.getContext("2d"); let b = new Array(C * R).fill(0), turn = 1, over = false;
    const idx = (c, r) => r * C + c;
    function drop(col, who) { for (let r = R - 1; r >= 0; r--) if (!b[idx(col, r)]) { b[idx(col, r)] = who; return r; } return -1; }
    function wins(who) { const D = [[1,0],[0,1],[1,1],[1,-1]]; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const d of D) { let ok = true; for (let k = 0; k < 4; k++) { const nr = r + d[1] * k, nc = c + d[0] * k; if (nr < 0 || nr >= R || nc < 0 || nc >= C || b[idx(nc, nr)] !== who) { ok = false; break; } } if (ok) return true; } return false; }
    function full() { return b.every((v) => v); }
    function ai() { const valid = []; for (let c = 0; c < C; c++) if (!b[idx(c, 0)]) valid.push(c); for (const c of valid) { const r = drop(c, 2); if (wins(2)) { draw(); return; } b[idx(c, r)] = 0; } for (const c of valid) { const r = drop(c, 1); const bad = wins(1); b[idx(c, r)] = 0; if (bad) { drop(c, 2); draw(); return; } } drop(valid[Math.random() * valid.length | 0], 2); draw(); }
    function click(e) { if (over || turn !== 1) return; const rect = cv.getBoundingClientRect(); const col = ((e.clientX - rect.left) * (C * SZ / rect.width) / SZ) | 0; if (b[idx(col, 0)]) return; drop(col, 1); tone(500, 0.05); if (wins(1)) { over = true; body.querySelector("#c4Msg").innerHTML = "🎉 You win! +40 🐟"; reward(true); draw(); return; } if (full()) { over = true; body.querySelector("#c4Msg").textContent = "Draw!"; draw(); return; } turn = 2; draw(); setTimeout(() => { ai(); if (wins(2)) { over = true; body.querySelector("#c4Msg").innerHTML = "Maxwell wins 😼 +10 🐟"; reward(false); } else if (full()) { over = true; body.querySelector("#c4Msg").textContent = "Draw!"; } else { turn = 1; } draw(); }, 350); }
    function draw() { x.fillStyle = "#1b3a8f"; x.fillRect(0, 0, C * SZ, R * SZ); for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const v = b[idx(c, r)]; x.fillStyle = v === 1 ? "#ff5a6e" : v === 2 ? "#ffd84a" : "#0d1428"; x.beginPath(); x.arc(c * SZ + SZ / 2, r * SZ + SZ / 2, SZ / 2 - 4, 0, 7); x.fill(); } }
    cv.addEventListener("pointerdown", click); draw();
  }

  // ---------- Coin War ----------
  function coinWar() {
    back(true); setTitle("🪙 Coin War"); const body = document.getElementById("bBody"); body.className = "arcade-body battle-body";
    body.innerHTML = '<p class="ar-hint">Call it! First to 3 correct calls beats Maxwell.</p><div class="battle-score"><span class="bs-you">You <b id="cwY">0</b></span><span class="bs-vs">vs</span><span class="bs-opp"><b id="cwO">0</b> Maxwell</span></div><div class="battle-show" id="cwShow">🪙</div><div class="battle-menu" style="flex-direction:row;justify-content:center"><button class="btn asc-btn" data-c="h">Heads</button><button class="btn asc-btn" data-c="t">Tails</button></div><p class="ar-hint" id="cwMsg"></p>';
    let you = 0, opp = 0, done = false;
    body.querySelectorAll("[data-c]").forEach((bn) => bn.onclick = () => { if (done) return; const r = Math.random() < 0.5 ? "h" : "t"; body.querySelector("#cwShow").textContent = r === "h" ? "🪙 Heads!" : "🪙 Tails!"; if (bn.dataset.c === r) { you++; tone(760, 0.08); } else { opp++; tone(240, 0.1, "sawtooth"); } body.querySelector("#cwY").textContent = you; body.querySelector("#cwO").textContent = opp; if (you >= 3 || opp >= 3) { done = true; const won = you >= 3; body.querySelector("#cwMsg").innerHTML = won ? "🎉 <b>You win! +40 🐟</b>" : "😿 Maxwell wins. +10 🐟"; reward(won); } });
  }

  // ---------- CPU ----------
  function cpuGame() {
    back(true); setTitle("🤖 vs CPU");
    runLocal((onMove) => { /* cpu picks random each round via onMove */ }, "CPU", true);
  }

  // ---------- shared round UI ----------
  function arena(label, statusId) {
    const body = document.getElementById("bBody"); body.className = "arcade-body battle-body"; body.innerHTML = `
      <div class="battle-score"><span class="bs-you">You <b id="bYou">0</b></span><span class="bs-vs">vs</span><span class="bs-opp"><b id="bOpp">0</b> ${label}</span></div>
      <div class="battle-show" id="bShow">🐈 vs 👑</div>
      <p class="ar-hint" id="${statusId}">Pick your move!</p>
      <div class="rps-btns" id="bBtns"></div>`;
    const btns = document.getElementById("bBtns");
    OPT.forEach((o, i) => { const b = document.createElement("button"); b.className = "btn rps-b"; b.innerHTML = o[0] + "<small>" + o[1] + "</small>"; b.dataset.i = i; btns.appendChild(b); });
  }

  function runLocal(_, label, isCpu) {
    arena(label, "bStatus");
    let you = 0, opp = 0, done = false;
    document.getElementById("bBtns").querySelectorAll(".rps-b").forEach((b) => b.onclick = () => {
      if (done) return; const me = +b.dataset.i, them = (Math.random() * 3) | 0;
      document.getElementById("bShow").textContent = OPT[me][0] + "  vs  " + OPT[them][0];
      if (me !== them) { if (beats(me, them)) { you++; tone(760, 0.08); } else { opp++; tone(240, 0.1, "sawtooth"); } } else tone(440, 0.05);
      document.getElementById("bYou").textContent = you; document.getElementById("bOpp").textContent = opp;
      if (you >= 3 || opp >= 3) { done = true; finish(you >= 3); }
    });
  }

  function finish(won) {
    try { if (won && window.MG) { window.MG.addTreats(40); window.MG.flag("battle"); } else if (window.MG) window.MG.addTreats(10); } catch (e) {}
    const st = document.getElementById("bStatus"); if (st) st.innerHTML = won ? "🎉 <b>You win!</b> +40 🐟 — hit Back for another." : "😿 You lost. +10 🐟 for playing. Hit Back to retry.";
  }

  // ---------- ONLINE ----------
  function code4() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 4; i++) s += c[(Math.random() * c.length) | 0]; return s; }

  function createRoom() {
    const url = dbURL(); if (!url) { document.getElementById("bNote").textContent = "Online isn't available — Firebase not connected. Try Practice vs CPU."; return; }
    const room = code4();
    back(true); setTitle("🌐 Room " + room);
    const body = document.getElementById("bBody"); body.className = "arcade-body battle-body";
    body.innerHTML = `<div class="battle-wait"><h3>Room Code</h3><div class="battle-code">${room}</div><p class="ar-hint">Tell your friend this code. Waiting for them to join…</p><div class="sball-typing"><span></span><span></span><span></span></div></div>`;
    fetchJSON(url + "/battles/" + room + ".json", { method: "PUT", body: JSON.stringify({ host: 1, created: Date.now() }) }).catch(() => {});
    poll = setInterval(() => {
      fetchJSON(url + "/battles/" + room + ".json").then((d) => { if (d && d.guest) { stopPoll(); onlineGame(room, "a"); } }).catch(() => {});
    }, 1300);
  }

  function joinPrompt() {
    back(true); setTitle("🔑 Join Room");
    const body = document.getElementById("bBody"); body.className = "arcade-body battle-body";
    body.innerHTML = `<div class="battle-wait"><h3>Enter Room Code</h3><input id="bCode" class="sball-input" maxlength="4" placeholder="ABCD" style="text-transform:uppercase;text-align:center;font-size:1.4rem;letter-spacing:4px"><button class="btn asc-btn" id="bJoinGo">Join</button><p class="ar-hint" id="bJoinNote"></p></div>`;
    document.getElementById("bJoinGo").onclick = () => {
      const url = dbURL(); const room = (document.getElementById("bCode").value || "").trim().toUpperCase();
      if (room.length !== 4) { document.getElementById("bJoinNote").textContent = "Enter the 4-letter code."; return; }
      document.getElementById("bJoinNote").textContent = "Joining…";
      fetchJSON(url + "/battles/" + room + ".json").then((d) => {
        if (!d) { document.getElementById("bJoinNote").textContent = "No room with that code."; return; }
        fetchJSON(url + "/battles/" + room + "/guest.json", { method: "PUT", body: "1" }).then(() => onlineGame(room, "b")).catch(() => { document.getElementById("bJoinNote").textContent = "Couldn't join — try again."; });
      }).catch(() => { document.getElementById("bJoinNote").textContent = "Couldn't reach the room. Check the code / connection."; });
    };
  }

  function onlineGame(room, slot) {
    const url = dbURL(); const mine = slot, theirs = slot === "a" ? "b" : "a";
    arena("Opponent", "bStatus");
    setTitle("🌐 Room " + room);
    let you = 0, opp = 0, round = 1, myMove = null, resolved = false, done = false;
    const status = document.getElementById("bStatus"); status.textContent = "Round 1 — pick your move!";
    document.getElementById("bBtns").querySelectorAll(".rps-b").forEach((b) => b.onclick = () => {
      if (done || myMove != null) return; myMove = +b.dataset.i; status.textContent = "Waiting for opponent…"; tone(500, 0.05);
      fetchJSON(url + "/battles/" + room + "/r/" + round + "/" + mine + ".json", { method: "PUT", body: String(myMove) }).catch(() => {});
    });
    poll = setInterval(() => {
      if (done) return;
      fetchJSON(url + "/battles/" + room + "/r/" + round + ".json").then((d) => {
        if (!d || d[mine] == null || d[theirs] == null || resolved) return;
        resolved = true; const me = +d[mine], them = +d[theirs];
        document.getElementById("bShow").textContent = OPT[me][0] + "  vs  " + OPT[them][0];
        if (me !== them) { if (beats(me, them)) { you++; tone(760, 0.08); } else { opp++; tone(240, 0.1, "sawtooth"); } } else tone(440, 0.05);
        document.getElementById("bYou").textContent = you; document.getElementById("bOpp").textContent = opp;
        if (you >= 3 || opp >= 3) { done = true; stopPoll(); finish(you >= 3); return; }
        setTimeout(() => { round++; myMove = null; resolved = false; status.textContent = "Round " + round + " — pick your move!"; }, 1100);
      }).catch(() => {});
    }, 1200);
  }

  window.MG_BATTLE = { open, close };
  function wire() { const b = document.getElementById("battleBtn"); if (b) b.onclick = open; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
