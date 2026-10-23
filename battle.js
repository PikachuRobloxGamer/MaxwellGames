// ===== MaxwellGames: ONLINE BATTLE — play friends cross-country (Firebase rooms) =====
(function () {
  let AC;
  function tone(f, d, ty, v) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = ty || "square"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} }
  function dbURL() { try { const f = window.MG_FIREBASE_CONFIG; return f && f.databaseURL ? f.databaseURL.replace(/\/$/, "") : null; } catch (e) { return null; } }
  function fetchJSON(url, opts, ms) { return new Promise(function (res, rej) { const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null; const to = setTimeout(function () { if (ctrl) ctrl.abort(); rej(new Error("timeout")); }, ms || 6000); fetch(url, Object.assign({ signal: ctrl ? ctrl.signal : undefined }, opts || {})).then(function (r) { clearTimeout(to); return r.ok ? r.json() : Promise.reject(); }).then(res).catch(function (e) { clearTimeout(to); rej(e); }); }); }

  // ---- active timers cleanup ----
  let polls = [];
  function addPoll(iv) { polls.push(iv); return iv; }
  function stopPoll() { polls.forEach((iv) => clearInterval(iv)); polls = []; }
  let duelClean = [];
  function duelCleanup() { duelClean.forEach((fn) => { try { fn(); } catch (e) {} }); duelClean = []; }
  function close() { stopPoll(); duelCleanup(); const o = document.getElementById("battleOv"); if (o) { if (o._clean2) try { o._clean2(); } catch (e) {} document.removeEventListener("keydown", o._esc); o.remove(); } }

  function open() {
    close();
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = "battleOv";
    ov.innerHTML = '<div class="arcade-box battle-box"><div class="arcade-head battle-head"><button class="btn ar-back hidden" id="bBack">← Back</button><h2 id="bTitle">🌐 Maxwell Battle</h2><button class="btn ar-x" id="bClose">✕</button></div><div class="arcade-body battle-body" id="bBody"></div></div>';
    document.body.appendChild(ov);
    document.getElementById("bClose").onclick = close;
    document.getElementById("bBack").onclick = menu;
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    const esc = (e) => { if (e.key === "Escape") { if (!document.getElementById("bBack").classList.contains("hidden")) menu(); else close(); } }; document.addEventListener("keydown", esc); ov._esc = esc;
    menu();
  }

  const B = () => document.getElementById("bBody");
  function maxwellMascot(container) { if (!container || container.querySelector(".game-maxwell")) return; const im = document.createElement("img"); im.className = "game-maxwell"; im.src = (document.querySelector(".logo-img") || {}).src || "maxwell.png"; im.alt = "Maxwell"; container.appendChild(im); }
  function setTitle(t) { document.getElementById("bTitle").textContent = t; }
  function back(show) { document.getElementById("bBack").classList.toggle("hidden", !show); }
  function reward(won) { try { if (won && window.MG) { window.MG.addTreats(40); window.MG.flag("battle"); } else if (window.MG) window.MG.addTreats(10); } catch (e) {} }

  // ======================================================
  // MENU
  // ======================================================
  function menu() {
    stopPoll(); duelCleanup(); back(false); setTitle("🌐 Maxwell Battle");
    const body = B(); body.className = "arcade-body battle-body";
    body.innerHTML = '<p class="ar-hint">Play a friend <b>🌐 Online</b> with a room code, or beat the <b>🤖 CPU</b>. Winners get 🐟! <small>(Every duel is also here online — the local 2-player version lives in the ⚔️ Duels tab.)</small></p><div class="ar-grid" id="bGames"></div>';
    const grid = body.querySelector("#bGames");
    GAMES.forEach((g) => { const t = document.createElement("button"); t.className = "ar-tile is-new"; t.innerHTML = '<span class="ar-ic">' + g.icon + '</span><span class="ar-name">' + g.name + '</span><span class="ar-best">' + g.tag + '</span>'; t.onclick = () => gameMenu(g); grid.appendChild(t); });
  }

  function gameMenu(g) {
    stopPoll(); duelCleanup(); back(true); setTitle(g.icon + " " + g.name);
    const online = dbURL();
    const body = B(); body.className = "arcade-body battle-body";
    body.innerHTML = '<p class="ar-hint">' + g.desc + '</p><div class="battle-menu">'
      + '<button class="btn asc-btn" id="bOnline">🌐 Create Online Room</button>'
      + '<button class="btn asc-btn" id="bJoin">🔑 Join with Code</button>'
      + (g.duel ? '' : '<button class="btn" id="bPass">👥 Pass &amp; Play</button>')
      + '<button class="btn" id="bCpu">🤖 vs CPU</button>'
      + '</div><p class="ar-hint" id="bNote">' + (g.duel ? "👥 The local 2-player version is in the ⚔️ Duels tab." : "") + '</p>';
    body.querySelector("#bCpu").onclick = () => g.start("cpu");
    if (!g.duel) body.querySelector("#bPass").onclick = () => g.start("local");
    body.querySelector("#bOnline").onclick = () => createRoom(g);
    body.querySelector("#bJoin").onclick = () => joinPrompt(g);
    if (!online) { const n = body.querySelector("#bNote"); n.textContent = "ℹ️ Online needs the Home (Firebase) connection. CPU works anywhere!"; }
  }

  // ---- generic score-duel runner (online version of every real-time duel) ----
  function runDuelSolo(g, mode, ctx) {
    back(true); setTitle(g.icon + " " + g.name);
    duelCleanup();
    const body = B(); body.className = "arcade-body battle-body"; body.innerHTML = "";
    const info = document.createElement("p"); info.className = "ar-hint"; info.textContent = mode === "net" ? "🌐 Play your run — your friend plays theirs. Higher score wins!" : "Beat the CPU's score!";
    body.appendChild(info);
    const host = document.createElement("div"); host.className = "duel-solo-host"; body.appendChild(host);
    maxwellMascot(body);
    const solo = (window.MG_DUELSOLO || {})[g.solo];
    if (!solo) { info.textContent = "This duel couldn't load — go back and try again."; return; }
    const api = { tone: tone, onClean: (fn) => duelClean.push(fn), img: (document.querySelector(".logo-img") || {}).src || "maxwell.png" };
    solo(host, api, (score) => {
      duelCleanup();
      if (mode === "net") { info.textContent = "✅ Your score: " + score + ". Waiting for opponent…"; submitScore(ctx.room, ctx.slot, score, (me, them) => { const won = me > them; reward(won); endScreen(won ? "🎉 You win!" : me === them ? "Tie!" : "😿 You lost", "You " + me + " — " + them + " opponent", () => g.start(mode, ctx)); }); }
      else { const cpu = g.cpuScore(); const won = score >= cpu; reward(won); endScreen(won ? "🎉 You win!" : "😼 Maxwell wins", "You " + score + " — " + cpu + " Maxwell", () => g.start(mode, ctx)); }
    });
  }

  // ======================================================
  // ONLINE ROOM PLUMBING
  // ======================================================
  function code4() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 4; i++) s += c[(Math.random() * c.length) | 0]; return s; }
  function createRoom(g) {
    const url = dbURL(); if (!url) { gameMenu(g); setTimeout(() => { const n = document.getElementById("bNote"); if (n) n.textContent = "Online isn't available right now — try Pass & Play!"; }, 30); return; }
    const room = code4(); back(true); setTitle("🌐 Room " + room);
    const body = B(); body.className = "arcade-body battle-body";
    body.innerHTML = '<div class="battle-wait"><h3>Room Code</h3><div class="battle-code">' + room + '</div><p class="ar-hint">Share this code with your friend. Waiting for them to join…</p><div class="sball-typing"><span></span><span></span><span></span></div><button class="btn" id="bCancel">Cancel</button></div>';
    body.querySelector("#bCancel").onclick = () => gameMenu(g);
    fetchJSON(url + "/battles/" + room + ".json", { method: "PUT", body: JSON.stringify({ host: 1, game: g.key, created: Date.now() }) }).catch(() => {});
    addPoll(setInterval(() => { fetchJSON(url + "/battles/" + room + ".json").then((d) => { if (d && d.guest) { stopPoll(); g.start("net", { room: room, slot: "a" }); } }).catch(() => {}); }, 1300));
  }
  function joinPrompt(g) {
    back(true); setTitle("🔑 Join Room");
    const body = B(); body.className = "arcade-body battle-body";
    body.innerHTML = '<div class="battle-wait"><h3>Enter Room Code</h3><input id="bCode" class="sball-input" maxlength="4" placeholder="ABCD" style="text-transform:uppercase;text-align:center;font-size:1.4rem;letter-spacing:4px"><button class="btn asc-btn" id="bJoinGo">Join</button><p class="ar-hint" id="bJoinNote"></p></div>';
    body.querySelector("#bJoinGo").onclick = () => {
      const url = dbURL(); const room = (document.getElementById("bCode").value || "").trim().toUpperCase();
      if (room.length !== 4) { document.getElementById("bJoinNote").textContent = "Enter the 4-letter code."; return; }
      document.getElementById("bJoinNote").textContent = "Joining…";
      fetchJSON(url + "/battles/" + room + ".json").then((d) => {
        if (!d) { document.getElementById("bJoinNote").textContent = "No room with that code."; return; }
        const game = GAMES.find((x) => x.key === d.game) || g;
        fetchJSON(url + "/battles/" + room + "/guest.json", { method: "PUT", body: "1" }).then(() => game.start("net", { room: room, slot: "b" })).catch(() => { document.getElementById("bJoinNote").textContent = "Couldn't join — try again."; });
      }).catch(() => { document.getElementById("bJoinNote").textContent = "Couldn't reach the room. Check the code / connection."; });
    };
  }
  // simultaneous-reveal round: both write myVal, resolve with both values
  function reveal(room, slot, roundId, myVal, cb) {
    const url = dbURL(), mine = slot, theirs = slot === "a" ? "b" : "a"; let resolved = false;
    fetchJSON(url + "/battles/" + room + "/r/" + roundId + "/" + mine + ".json", { method: "PUT", body: JSON.stringify(myVal) }).catch(() => {});
    addPoll(setInterval(() => { if (resolved) return; fetchJSON(url + "/battles/" + room + "/r/" + roundId + ".json").then((d) => { if (d && d[mine] != null && d[theirs] != null) { resolved = true; cb(JSON.parse(d[mine]), JSON.parse(d[theirs])); } }).catch(() => {}); }, 1100));
  }
  // shared board: push full state, poll for changes
  function pushBoard(room, obj) { const url = dbURL(); fetchJSON(url + "/battles/" + room + "/board.json", { method: "PUT", body: JSON.stringify(obj) }).catch(() => {}); }
  function pollBoard(room, cb) { const url = dbURL(); let last = ""; addPoll(setInterval(() => { fetchJSON(url + "/battles/" + room + "/board.json").then((d) => { if (!d) return; const s = JSON.stringify(d); if (s !== last) { last = s; cb(d); } }).catch(() => {}); }, 1000)); }
  // submit-and-compare final score
  function submitScore(room, slot, score, cb) {
    const url = dbURL(), mine = slot, theirs = slot === "a" ? "b" : "a"; let resolved = false;
    fetchJSON(url + "/battles/" + room + "/score/" + mine + ".json", { method: "PUT", body: String(score) }).catch(() => {});
    addPoll(setInterval(() => { if (resolved) return; fetchJSON(url + "/battles/" + room + "/score.json").then((d) => { if (d && d[mine] != null && d[theirs] != null) { resolved = true; cb(+d[mine], +d[theirs]); } }).catch(() => {}); }, 1100));
  }

  function endScreen(result, line, onAgain) {
    const body = B(); body.className = "arcade-body battle-body";
    body.innerHTML = '<div class="ar-result"><h2 class="ar-res-title">' + result + '</h2><p class="ar-score">' + (line || "") + '</p><div class="ar-res-btns"><button class="btn asc-btn" id="bAgain">↻ Again</button><button class="btn" id="bToMenu">🌐 Battle</button></div></div>';
    body.querySelector("#bAgain").onclick = onAgain; body.querySelector("#bToMenu").onclick = menu;
    try { window.MG.boomSound(0.1); } catch (e) {}
  }
  function names(mode) { return mode === "cpu" ? ["You", "Maxwell"] : mode === "local" ? ["🟢 P1", "🩷 P2"] : ["You", "Opponent"]; }

  // ======================================================
  // GAMES
  // ======================================================
  const RPS = [["✊", "Rock"], ["✋", "Paper"], ["✌️", "Scissors"]];
  function rpsBeats(a, b) { return (a === 0 && b === 2) || (a === 1 && b === 0) || (a === 2 && b === 1); }

  const GAMES = [
    // ---------- Rock Paper Meow ----------
    {
      key: "rps", name: "Rock Paper Meow", icon: "✊", tag: "Online • first to 3", desc: "Best of 5 — rock beats scissors, scissors beats paper, paper beats rock.",
      start(mode, ctx) {
        back(true); setTitle("✊ Rock Paper Meow"); const nm = names(mode);
        const body = B(); body.className = "arcade-body battle-body";
        body.innerHTML = '<div class="battle-score"><span class="bs-you">' + nm[0] + ' <b id="bY">0</b></span><span class="bs-vs">vs</span><span class="bs-opp"><b id="bO">0</b> ' + nm[1] + '</span></div><div class="battle-show" id="bShow">Pick!</div><p class="ar-hint" id="bMsg">Round 1 — pick your move!</p><div class="rps-btns" id="bBtns"></div>';
        maxwellMascot(body);
        let you = 0, opp = 0, round = 1, done = false, p1turn = true, p1pick = null;
        const btns = body.querySelector("#bBtns");
        RPS.forEach((o, i) => { const b = document.createElement("button"); b.className = "btn rps-b"; b.innerHTML = o[0] + "<small>" + o[1] + "</small>"; b.dataset.i = i; btns.appendChild(b); });
        function score(me, them) {
          body.querySelector("#bShow").textContent = RPS[me][0] + "  vs  " + RPS[them][0];
          if (me !== them) { if (rpsBeats(me, them)) { you++; tone(760, 0.08); } else { opp++; tone(240, 0.1, "sawtooth"); } } else tone(440, 0.05);
          body.querySelector("#bY").textContent = you; body.querySelector("#bO").textContent = opp;
          if (you >= 3 || opp >= 3) { done = true; stopPoll(); const won = you >= 3; if (mode !== "local") reward(won); return endScreen(won ? "🎉 " + nm[0] + " win!" : "😿 " + nm[1] + " win", "Final " + you + " — " + opp, () => this.start(mode, ctx)); }
          round++; setTimeout(() => { body.querySelector("#bMsg").textContent = "Round " + round + (mode === "local" ? " — 🟢 P1 pick (P2 look away!)" : " — pick your move!"); p1turn = true; p1pick = null; }, 900);
        }
        const self = this;
        btns.querySelectorAll(".rps-b").forEach((b) => b.onclick = () => {
          if (done) return; const pick = +b.dataset.i;
          if (mode === "cpu") { score(pick, (Math.random() * 3) | 0); }
          else if (mode === "local") { if (p1turn) { p1pick = pick; p1turn = false; body.querySelector("#bMsg").textContent = "🩷 P2 — pick your move!"; tone(500, 0.04); } else { score.call(self, p1pick, pick); } }
          else { body.querySelector("#bMsg").textContent = "Waiting for opponent…"; tone(500, 0.04); reveal(ctx.room, ctx.slot, round, pick, (mine, theirs) => score(mine, theirs)); }
        });
        if (mode === "net") body.querySelector("#bMsg").textContent = "Round 1 — pick your move!";
      }
    },

    // ---------- Tic-Tac-Toe ----------
    {
      key: "ttt", name: "Tic-Tac-Toe", icon: "⭕", tag: "Online • 3 in a row", desc: "Classic 3-in-a-row. You're 🐈, opponent is 👑.",
      start(mode, ctx) {
        back(true); setTitle("⭕ Tic-Tac-Toe"); const body = B(); body.className = "arcade-body battle-body";
        body.innerHTML = '<p class="ar-hint" id="bMsg"></p><div class="ttt-grid" id="bTtt"></div>';
        maxwellMascot(body);
        const WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        const cells = []; const grid = body.querySelector("#bTtt"); const msg = body.querySelector("#bMsg");
        for (let i = 0; i < 9; i++) { const d = document.createElement("button"); d.className = "ttt-cell"; d.onclick = () => clickCell(i); grid.appendChild(d); cells.push(d); }
        let bd = Array(9).fill(""), done = false;
        const mySym = mode === "net" ? (ctx.slot === "a" ? "X" : "O") : "X";
        let turn = "X";
        function winner(b) { for (const w of WIN) if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) return b[w[0]]; return b.indexOf("") < 0 ? "draw" : null; }
        function rend() { cells.forEach((c, i) => c.textContent = bd[i] === "X" ? "🐈" : bd[i] === "O" ? "👑" : ""); }
        function cpuMove() { function best(b, who) { const w = winner(b); if (w === "O") return { s: 10 }; if (w === "X") return { s: -10 }; if (w === "draw") return { s: 0 }; let mv = []; b.forEach((v, i) => { if (!v) { const nb = b.slice(); nb[i] = who; mv.push({ i: i, s: best(nb, who === "O" ? "X" : "O").s }); } }); return who === "O" ? mv.reduce((a, m) => m.s > a.s ? m : a, { s: -99 }) : mv.reduce((a, m) => m.s < a.s ? m : a, { s: 99 }); } const m = best(bd, "O").i; if (m != null) { bd[m] = "O"; tone(400, 0.05); } }
        const self = this;
        function finishGame(w) { done = true; stopPoll(); let title, won = false; if (w === "draw") title = "Draw!"; else if (mode === "net") { won = w === mySym; title = won ? "🎉 You win!" : "😿 You lost"; } else if (mode === "local") title = w === "X" ? "🟢 P1 (🐈) wins!" : "🩷 P2 (👑) wins!"; else { won = w === "X"; title = won ? "🎉 You win!" : "😼 Maxwell wins"; } if (mode !== "local") reward(won); setTimeout(() => endScreen(title, "", () => self.start(mode, ctx)), 400); }
        function clickCell(i) {
          if (done || bd[i]) return;
          if (mode === "cpu") { bd[i] = "X"; tone(520, 0.05); rend(); let w = winner(bd); if (w) return finishGame(w); cpuMove(); rend(); w = winner(bd); if (w) finishGame(w); else msg.textContent = "Your move"; }
          else if (mode === "local") { bd[i] = turn; tone(turn === "X" ? 520 : 440, 0.05); rend(); const w = winner(bd); if (w) return finishGame(w); turn = turn === "X" ? "O" : "X"; msg.textContent = turn === "X" ? "🟢 P1 (🐈) turn" : "🩷 P2 (👑) turn"; }
          else { if (turn !== mySym) { msg.textContent = "Wait for your turn…"; return; } bd[i] = mySym; tone(520, 0.05); rend(); const w = winner(bd); turn = mySym === "X" ? "O" : "X"; pushBoard(ctx.room, { bd: bd, turn: turn, w: w }); if (w) finishGame(w); else msg.textContent = "Waiting for opponent…"; }
        }
        rend();
        if (mode === "cpu") msg.textContent = "Your move (you're 🐈)";
        else if (mode === "local") msg.textContent = "🟢 P1 (🐈) turn";
        else { msg.textContent = mySym === "X" ? "Your move (🐈)" : "Waiting for opponent…"; if (ctx.slot === "a") pushBoard(ctx.room, { bd: bd, turn: "X", w: null }); pollBoard(ctx.room, (d) => { bd = d.bd || bd; turn = d.turn; rend(); if (d.w && !done) finishGame(d.w); else if (!done) msg.textContent = turn === mySym ? "Your move" : "Waiting for opponent…"; }); }
      }
    },

    // ---------- Connect Four ----------
    {
      key: "c4", name: "Connect Four", icon: "🔴", tag: "Online • 4 in a row", desc: "Drop discs and connect four in a row — across, down, or diagonal.",
      start(mode, ctx) {
        back(true); setTitle("🔴 Connect Four"); const body = B(); body.className = "arcade-body battle-body";
        const C = 7, R = 6, SZ = 46;
        body.innerHTML = '<p class="ar-hint" id="bMsg"></p><canvas id="c4cv" width="' + C * SZ + '" height="' + R * SZ + '" class="ar-canvas"></canvas>';
        maxwellMascot(body);
        const cv = body.querySelector("#c4cv"), x = cv.getContext("2d"), msg = body.querySelector("#bMsg");
        let bd = new Array(C * R).fill(0), done = false, turn = 1;
        const myNum = mode === "net" ? (ctx.slot === "a" ? 1 : 2) : 1;
        const idx = (c, r) => r * C + c;
        function drop(col, who) { for (let r = R - 1; r >= 0; r--) if (!bd[idx(col, r)]) { bd[idx(col, r)] = who; return r; } return -1; }
        function wins(who) { const D = [[1,0],[0,1],[1,1],[1,-1]]; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const d of D) { let ok = true; for (let k = 0; k < 4; k++) { const nr = r + d[1] * k, nc = c + d[0] * k; if (nr < 0 || nr >= R || nc < 0 || nc >= C || bd[idx(nc, nr)] !== who) { ok = false; break; } } if (ok) return true; } return false; }
        function full() { return bd.every((v) => v); }
        function draw() { x.fillStyle = "#1b3a8f"; x.fillRect(0, 0, C * SZ, R * SZ); for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const v = bd[idx(c, r)]; x.fillStyle = v === 1 ? "#ff5a6e" : v === 2 ? "#ffd84a" : "#0d1428"; x.beginPath(); x.arc(c * SZ + SZ / 2, r * SZ + SZ / 2, SZ / 2 - 4, 0, 7); x.fill(); } }
        const self = this;
        function finishGame(who) { done = true; stopPoll(); let title, won = false; if (who === 0) title = "Draw!"; else if (mode === "net") { won = who === myNum; title = won ? "🎉 You win!" : "😿 You lost"; } else if (mode === "local") title = who === 1 ? "🟢 P1 (red) wins!" : "🩷 P2 (yellow) wins!"; else { won = who === 1; title = won ? "🎉 You win!" : "😼 Maxwell wins"; } if (mode !== "local") reward(won); draw(); setTimeout(() => endScreen(title, "", () => self.start(mode, ctx)), 400); }
        function cpuMove() { const valid = []; for (let c = 0; c < C; c++) if (!bd[idx(c, 0)]) valid.push(c); for (const c of valid) { const r = drop(c, 2); if (wins(2)) return; bd[idx(c, r)] = 0; } for (const c of valid) { const r = drop(c, 1); const bad = wins(1); bd[idx(c, r)] = 0; if (bad) { drop(c, 2); return; } } drop(valid[Math.random() * valid.length | 0], 2); }
        function place(col) {
          if (done || bd[idx(col, 0)]) return;
          if (mode === "cpu") { drop(col, 1); tone(500, 0.05); if (wins(1)) return finishGame(1); if (full()) return finishGame(0); cpuMove(); draw(); if (wins(2)) return finishGame(2); if (full()) return finishGame(0); msg.textContent = "Your turn (red)"; }
          else if (mode === "local") { drop(col, turn); tone(turn === 1 ? 500 : 420, 0.05); if (wins(turn)) return finishGame(turn); if (full()) return finishGame(0); turn = turn === 1 ? 2 : 1; msg.textContent = turn === 1 ? "🟢 P1 (red)" : "🩷 P2 (yellow)"; }
          else { if (turn !== myNum) { msg.textContent = "Wait for your turn…"; return; } drop(col, myNum); tone(500, 0.05); const w = wins(myNum) ? myNum : full() ? 0 : null; turn = myNum === 1 ? 2 : 1; pushBoard(ctx.room, { bd: bd, turn: turn, w: w }); if (w !== null) finishGame(w); else msg.textContent = "Waiting for opponent…"; }
          draw();
        }
        cv.addEventListener("pointerdown", (e) => { const rect = cv.getBoundingClientRect(); const col = ((e.clientX - rect.left) * (C * SZ / rect.width) / SZ) | 0; place(Math.max(0, Math.min(C - 1, col))); });
        draw();
        if (mode === "cpu") msg.textContent = "Your turn (red)";
        else if (mode === "local") msg.textContent = "🟢 P1 (red)";
        else { msg.textContent = myNum === 1 ? "Your turn (red)" : "Waiting for opponent…"; if (ctx.slot === "a") pushBoard(ctx.room, { bd: bd, turn: 1, w: null }); pollBoard(ctx.room, (d) => { bd = d.bd || bd; turn = d.turn; draw(); if (d.w !== null && d.w !== undefined && !done) finishGame(d.w); else if (!done) msg.textContent = turn === myNum ? "Your turn" : "Waiting for opponent…"; }); }
      }
    },

    // ---------- Dice War ----------
    {
      key: "dice", name: "Dice War", icon: "🎲", tag: "Online • first to 3", desc: "Each roll, higher die wins the round. First to 3 round-wins.",
      start(mode, ctx) {
        back(true); setTitle("🎲 Dice War"); const nm = names(mode); const body = B(); body.className = "arcade-body battle-body";
        body.innerHTML = '<div class="battle-score"><span class="bs-you">' + nm[0] + ' <b id="bY">0</b></span><span class="bs-vs">vs</span><span class="bs-opp"><b id="bO">0</b> ' + nm[1] + '</span></div><div class="battle-show" id="bShow">🎲 vs 🎲</div><button class="btn asc-btn" id="bRoll">🎲 Roll</button><p class="ar-hint" id="bMsg"></p>';
        maxwellMascot(body);
        let you = 0, opp = 0, round = 1, done = false; const self = this;
        function resolve(a, b) {
          body.querySelector("#bShow").textContent = "🎲 " + a + "  vs  " + b + " 🎲";
          if (a > b) { you++; tone(760, 0.08); } else if (b > a) { opp++; tone(240, 0.1, "sawtooth"); } else tone(440, 0.05);
          body.querySelector("#bY").textContent = you; body.querySelector("#bO").textContent = opp;
          if (you >= 3 || opp >= 3) { done = true; stopPoll(); const won = you >= 3; if (mode !== "local") reward(won); return endScreen(won ? "🎉 " + nm[0] + " win!" : "😿 " + nm[1] + " win", "Final " + you + " — " + opp, () => self.start(mode, ctx)); }
          round++; body.querySelector("#bRoll").disabled = false; body.querySelector("#bMsg").textContent = "Round " + round;
        }
        body.querySelector("#bRoll").onclick = function () {
          if (done) return; const mine = 1 + (Math.random() * 6 | 0);
          if (mode === "net") { this.disabled = true; body.querySelector("#bMsg").textContent = "Waiting for opponent…"; reveal(ctx.room, ctx.slot, round, mine, (m, t) => resolve(m, t)); }
          else { const theirs = 1 + (Math.random() * 6 | 0); resolve(mine, theirs); }
        };
      }
    },

    // ---------- Odd or Even ----------
    {
      key: "oddeven", name: "Odd or Even", icon: "🤜", tag: "Online • mind games", desc: "Throw 0–5 fingers. If the total is ODD, P1 scores; EVEN, P2 scores. First to 3.",
      start(mode, ctx) {
        back(true); setTitle("🤜 Odd or Even"); const nm = names(mode); const body = B(); body.className = "arcade-body battle-body";
        const youIsOdd = mode === "net" ? ctx.slot === "a" : true;
        body.innerHTML = '<p class="ar-hint">' + (mode === "net" ? (youIsOdd ? "You score on ODD totals." : "You score on EVEN totals.") : "🟢 P1 = ODD · 🩷 P2 = EVEN") + '</p><div class="battle-score"><span class="bs-you">' + (mode === "net" ? "You" : "ODD") + ' <b id="bY">0</b></span><span class="bs-vs">vs</span><span class="bs-opp"><b id="bO">0</b> ' + (mode === "net" ? "Opp" : "EVEN") + '</span></div><div class="battle-show" id="bShow">?</div><p class="ar-hint" id="bMsg">Throw your fingers (0–5)!</p><div class="rps-btns" id="bBtns"></div>';
        maxwellMascot(body);
        let odd = 0, even = 0, round = 1, done = false, p1pick = null, p1turn = true; const self = this; const btns = body.querySelector("#bBtns");
        for (let i = 0; i <= 5; i++) { const b = document.createElement("button"); b.className = "btn rps-b"; b.textContent = i; b.dataset.i = i; btns.appendChild(b); }
        function resolve(a, b) {
          const sum = a + b; const isOdd = sum % 2 === 1; body.querySelector("#bShow").textContent = a + " + " + b + " = " + sum + (isOdd ? " (ODD)" : " (EVEN)");
          if (isOdd) { odd++; tone(700, 0.08); } else { even++; tone(500, 0.08); }
          body.querySelector("#bY").textContent = odd; body.querySelector("#bO").textContent = even;
          const target = 3;
          if (odd >= target || even >= target) { done = true; stopPoll(); const oddWon = odd >= target; let won; if (mode === "net") won = youIsOdd ? oddWon : !oddWon; else won = oddWon; const title = mode === "net" ? (won ? "🎉 You win!" : "😿 You lost") : (oddWon ? "🟢 ODD (P1) wins!" : "🩷 EVEN (P2) wins!"); if (mode !== "local") reward(won); return endScreen(title, "ODD " + odd + " — " + even + " EVEN", () => self.start(mode, ctx)); }
          round++; setTimeout(() => { body.querySelector("#bMsg").textContent = "Round " + round + (mode === "local" ? " — 🟢 P1 throw!" : " — throw 0–5!"); p1turn = true; p1pick = null; }, 800);
        }
        btns.querySelectorAll(".rps-b").forEach((b) => b.onclick = () => {
          if (done) return; const v = +b.dataset.i;
          if (mode === "cpu") resolve(v, (Math.random() * 6) | 0);
          else if (mode === "local") { if (p1turn) { p1pick = v; p1turn = false; body.querySelector("#bMsg").textContent = "🩷 P2 throw!"; tone(500, 0.04); } else resolve(p1pick, v); }
          else { body.querySelector("#bMsg").textContent = "Waiting for opponent…"; tone(500, 0.04); reveal(ctx.room, ctx.slot, round, v, (m, t) => resolve(youIsOdd ? m : t, youIsOdd ? t : m)); }
        });
      }
    },

    // ---------- Math Race ----------
    {
      key: "mathrace", name: "Math Race", icon: "➗", tag: "Online • 20s sprint", desc: "Answer as many as you can in 20 seconds. Highest score wins!",
      start(mode, ctx) {
        back(true); setTitle("➗ Math Race"); const nm = names(mode); const body = B(); body.className = "arcade-body battle-body";
        body.innerHTML = '<div class="battle-score"><span class="bs-you">' + nm[0] + ' <b id="bY">0</b></span><span class="bs-vs">·</span><span class="bs-opp">⏱️ <b id="bT">20</b>s</span></div><h3 class="md-q" id="bQ"></h3><div class="trivia-opts" id="bOpts"></div><p class="ar-hint" id="bMsg"></p>';
        maxwellMascot(body);
        let score = 0, time = 20, done = false; const self = this;
        function q() { if (done) return; const a = 2 + (Math.random() * 11 | 0), b = 2 + (Math.random() * 11 | 0), op = Math.random() < 0.5 ? "+" : "×"; const ans = op === "+" ? a + b : a * b; body.querySelector("#bQ").textContent = a + " " + op + " " + b + " = ?"; const set = new Set([ans]); while (set.size < 3) { const w = ans + (Math.random() * 10 | 0) - 5; if (w > 0) set.add(w); } const opts = [...set].sort(() => Math.random() - 0.5); const wrap = body.querySelector("#bOpts"); wrap.innerHTML = ""; opts.forEach((o) => { const bn = document.createElement("button"); bn.className = "btn trivia-opt"; bn.textContent = o; bn.onclick = () => { if (done) return; if (o === ans) { score++; tone(800, 0.06); body.querySelector("#bY").textContent = score; } else tone(180, 0.1, "sawtooth"); q(); }; wrap.appendChild(bn); }); }
        q();
        const iv = addPoll(setInterval(() => { if (done) { clearInterval(iv); return; } time--; const tEl = body.querySelector("#bT"); if (tEl) tEl.textContent = time; if (time <= 0) { done = true; clearInterval(iv); finishRace(); } }, 1000));
        function finishRace() {
          if (mode === "cpu") { const cpu = 5 + (Math.random() * 6 | 0); compare(score, cpu); }
          else if (mode === "local") { body.querySelector("#bQ").textContent = "🟢 P1 scored " + score + "!"; body.querySelector("#bOpts").innerHTML = ""; body.querySelector("#bMsg").innerHTML = '<button class="btn asc-btn" id="bP2">🩷 P2 go!</button>'; const p1 = score; body.querySelector("#bP2").onclick = () => { score = 0; time = 20; done = false; body.querySelector("#bY").textContent = 0; body.querySelector("#bT").textContent = 20; q(); const iv2 = addPoll(setInterval(() => { if (done) { clearInterval(iv2); return; } time--; const tEl = body.querySelector("#bT"); if (tEl) tEl.textContent = time; if (time <= 0) { done = true; clearInterval(iv2); compareLocal(p1, score); } }, 1000)); }; }
          else { body.querySelector("#bMsg").textContent = "Waiting for opponent to finish…"; submitScore(ctx.room, ctx.slot, score, (me, them) => compare(me, them)); }
        }
        function compare(me, them) { stopPoll(); const won = me > them; if (mode !== "local") reward(won); endScreen(won ? "🎉 " + nm[0] + " win!" : me === them ? "Tie!" : "😿 " + nm[1] + " win", nm[0] + " " + me + " — " + them + " " + nm[1], () => self.start(mode, ctx)); }
        function compareLocal(p1, p2) { stopPoll(); endScreen(p1 > p2 ? "🟢 P1 wins!" : p1 === p2 ? "Tie!" : "🩷 P2 wins!", "P1 " + p1 + " — " + p2 + " P2", () => self.start(mode, ctx)); }
      }
    }
  ];

  // ---- Online versions of every Duel (score duels) ----
  const DUEL_DEFS = [
    { key: "d_pong", name: "Pong Duel", icon: "🏓", solo: "pong", cpu: () => 6 + (Math.random() * 5 | 0), desc: "Keep the ball alive — most hits wins!" },
    { key: "d_tug", name: "Tug Mash", icon: "🪢", solo: "tug", cpu: () => 32 + (Math.random() * 18 | 0), desc: "Mash as fast as you can for 8 seconds!" },
    { key: "d_react", name: "Reaction Duel", icon: "⚡", solo: "react", cpu: () => 850 + (Math.random() * 450 | 0), desc: "Fastest reflexes win — 3 rounds." },
    { key: "d_tron", name: "Light Cycles", icon: "🏍️", solo: "tron", cpu: () => 8 + (Math.random() * 9 | 0), desc: "Survive the longest without crashing!" },
    { key: "d_catch", name: "Catch Duel", icon: "🧺", solo: "catch", cpu: () => 9 + (Math.random() * 7 | 0), desc: "Catch the most fish in 20 seconds!" },
    { key: "d_fill", name: "Dot Grab", icon: "🟡", solo: "fill", cpu: () => 13 + (Math.random() * 9 | 0), desc: "Tap the most dots in 20 seconds!" },
    { key: "d_soccer", name: "Soccer Duel", icon: "🥅", solo: "soccer", cpu: () => 5 + (Math.random() * 5 | 0), desc: "Score the most goals past the goalie!" },
    { key: "d_snake", name: "Snake Duel", icon: "🐍", solo: "snakeduel", cpu: () => 6 + (Math.random() * 7 | 0), desc: "Eat the most fish before you crash!" },
    { key: "d_mash", name: "Mash Battle", icon: "💥", solo: "mash", cpu: () => 42 + (Math.random() * 22 | 0), desc: "Most mashes in 10 seconds wins!" },
    { key: "d_qmath", name: "Quick Math", icon: "🧮", solo: "qmath", cpu: () => 7 + (Math.random() * 5 | 0), desc: "Most correct answers in 20 seconds!" },
    { key: "d_dodge", name: "Dodge Duel", icon: "☄️", solo: "dodgeduel", cpu: () => 10 + (Math.random() * 9 | 0), desc: "Survive the falling comets the longest!" }
  ];
  DUEL_DEFS.forEach((d) => {
    GAMES.push({ key: d.key, name: d.name, icon: d.icon, tag: "Online • score duel", desc: d.desc, duel: true, solo: d.solo, cpuScore: d.cpu, start(mode, ctx) { runDuelSolo(this, mode, ctx); } });
  });

  window.MG_BATTLE = { open, close };
  function wire() { const b = document.getElementById("battleBtn"); if (b) b.onclick = open; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
