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
  function close() { stopPoll(); const o = document.getElementById("battleOv"); if (o) { document.removeEventListener("keydown", o._esc); o.remove(); } }

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

  function menu() {
    stopPoll(); back(false); setTitle("🌐 Maxwell Battle");
    const body = document.getElementById("bBody"); body.className = "arcade-body battle-body"; body.innerHTML = `
      <p class="ar-hint">Battle a friend in <b>Rock Paper Meow</b> — first to 3 wins! Play online with a room code, or practice vs the computer.</p>
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
