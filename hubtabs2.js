// ===== MaxwellGames extra tabs: Catdle (Wordle), Maxwell AI, Jukebox =====
(function () {
  const U = window.MGUI;

  // ---------------- CATDLE ----------------
  const WORDS = ["MEOWS", "CATTY", "PAWSS", "FISHY", "TREAT", "GAMES", "MOUSE", "PURRS", "KITTY", "WHISK", "CLAWS", "TIGER", "LEMON", "PIXEL", "LEVEL", "ROBOT", "GHOST", "SUPER", "MAGIC", "SPACE", "LASER", "CANDY", "BLOCK", "SPEED", "POWER", "LUCKY", "CROWN", "BLAZE", "FROST", "STORM"];
  function wordForToday() { const d = new Date(); const seed = d.getFullYear() * 1000 + (d.getMonth() + 1) * 50 + d.getDate(); return WORDS[seed % WORDS.length]; }
  function openCatdle() {
    const p = U.panel("catdleOv", "🟩 Catdle", "catdle-head");
    const ANS = wordForToday(); const MAXG = 6; let row = 0, cur = "", done = false;
    p.body.innerHTML = '<p class="ar-hint">Guess the 5-letter word! 🟩=right spot, 🟨=wrong spot, ⬛=not in word. One word a day for everyone.</p><div class="cdl-grid" id="cdlGrid"></div><div class="cdl-keys" id="cdlKeys"></div><p class="cdl-msg" id="cdlMsg"></p>';
    const grid = p.body.querySelector("#cdlGrid"); const cells = [];
    for (let r = 0; r < MAXG; r++) { const rowEl = document.createElement("div"); rowEl.className = "cdl-row"; const rc = []; for (let i = 0; i < 5; i++) { const cl = document.createElement("div"); cl.className = "cdl-cell"; rowEl.appendChild(cl); rc.push(cl); } grid.appendChild(rowEl); cells.push(rc); }
    const keyState = {};
    const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]; const keysEl = p.body.querySelector("#cdlKeys");
    rows.forEach((rk, ri) => { const kr = document.createElement("div"); kr.className = "cdl-krow"; if (ri === 2) { const e = document.createElement("button"); e.className = "cdl-key wide"; e.textContent = "ENTER"; e.onclick = submit; kr.appendChild(e); } rk.split("").forEach((ch) => { const k = document.createElement("button"); k.className = "cdl-key"; k.textContent = ch; k.dataset.k = ch; k.onclick = () => press(ch); kr.appendChild(k); }); if (ri === 2) { const b = document.createElement("button"); b.className = "cdl-key wide"; b.textContent = "⌫"; b.onclick = () => back(); kr.appendChild(b); } keysEl.appendChild(kr); });
    function draw() { for (let i = 0; i < 5; i++) cells[row][i].textContent = cur[i] || ""; }
    function press(ch) { if (done || cur.length >= 5) return; cur += ch; draw(); }
    function back() { if (done) return; cur = cur.slice(0, -1); draw(); }
    function submit() {
      if (done || cur.length !== 5) { msg("Need 5 letters!"); return; }
      const guess = cur; const ansArr = ANS.split(""); const res = new Array(5).fill("gray");
      for (let i = 0; i < 5; i++) if (guess[i] === ANS[i]) { res[i] = "green"; ansArr[i] = null; }
      for (let i = 0; i < 5; i++) if (res[i] !== "green") { const idx = ansArr.indexOf(guess[i]); if (idx >= 0) { res[i] = "yellow"; ansArr[idx] = null; } }
      for (let i = 0; i < 5; i++) { cells[row][i].classList.add(res[i]); const kb = keysEl.querySelector('[data-k="' + guess[i] + '"]'); if (kb) { const pr = keyState[guess[i]]; if (res[i] === "green" || (res[i] === "yellow" && pr !== "green") || !pr) { keyState[guess[i]] = res[i]; kb.classList.remove("green", "yellow", "gray"); kb.classList.add(res[i]); } } }
      U.tone(500, 0.05);
      if (guess === ANS) { done = true; const rew = (MAXG - row) * 40 + 40; U.give(rew); msg("🎉 Correct! +" + rew + " 🐟"); U.tone(880, 0.15); return; }
      row++; cur = "";
      if (row >= MAXG) { done = true; msg("The word was " + ANS + ". Try again tomorrow!"); }
    }
    function msg(t) { p.body.querySelector("#cdlMsg").textContent = t; }
    const kd = (e) => { if (done) return; const k = e.key.toUpperCase(); if (k === "ENTER") submit(); else if (k === "BACKSPACE") back(); else if (/^[A-Z]$/.test(k)) press(k); };
    document.addEventListener("keydown", kd); p.onClean(() => document.removeEventListener("keydown", kd));
  }

  // ---------------- MAXWELL AI (just-for-fun chat) ----------------
  const FACTS = ["Cats sleep 12-16 hours a day. Goals.", "A group of cats is called a 'clowder'.", "Maxwell's favorite food is treats 🐟, obviously.", "Cats can make over 100 different sounds.", "A cat's nose print is unique, like a fingerprint!", "Cats can run up to 30 mph in short bursts.", "The richest cat ever inherited $13 million.", "Cats have 32 muscles in each ear."];
  const JOKES = ["Why was the cat sitting on the computer? To keep an eye on the mouse! 🖱️", "What do you call a pile of kittens? A meow-ntain! ⛰️", "Why don't cats play poker in the jungle? Too many cheetahs! 🐆", "What's a cat's favorite color? Purr-ple! 💜"];
  function aiReply(msg) {
    const m = msg.toLowerCase();
    if (/hi|hello|hey|yo|sup/.test(m)) return "Meow! 😺 Welcome to MaxwellGames! Ask me for a joke, a cat fact, or how to earn treats!";
    if (/joke|funny|laugh/.test(m)) return JOKES[Math.random() * JOKES.length | 0];
    if (/fact|cat|learn/.test(m)) return "🐱 " + FACTS[Math.random() * FACTS.length | 0];
    if (/treat|fish|money|coin|earn/.test(m)) return "Catch falling :3s, play the Arcade, do Quests, pet me, and finish achievements to earn 🐟!";
    if (/game|play|arcade/.test(m)) return "Check the Arcade (30+ games!), Duels for 1v1, or try Catdle. So many games! 🎮";
    if (/subscribe|youtube|channel/.test(m)) return "Smash that Subscribe button on Pikachu Roblox Gamer & Games On! ▶️";
    if (/pet|egg/.test(m)) return "Hatch eggs in the Pets tab to collect all 24 creatures! 🥚";
    if (/ascend|rebirth|evolve/.test(m)) return "Get Level 10 + all achievements to ascend your Maxwell into new colors! ✨";
    if (/love|awesome|cool|best|good|great/.test(m)) return "Aww, you're the best! 😻 Tell your friends about MaxwellGames!";
    if (/bye|cya|later/.test(m)) return "Meow bye! Come back soon! 🐾";
    if (/\?$/.test(m)) return "Hmm, good question! I'm just a silly cat 😸 — try the Quests, Casino, or Catdle tabs!";
    const r = ["Meow? 😺", "Purrr... tell me more!", "I'm just a cat, but that sounds pawsome! 🐾", "Have you tried the Arcade yet?", "Meow meow! (That means hi.)"];
    return r[Math.random() * r.length | 0];
  }
  function openAI() {
    const p = U.panel("aiOv", "🤖 Maxwell AI", "ai2-head");
    p.body.innerHTML = '<p class="ar-hint">Chat with Maxwell! (Just for fun — he\'s a cat, not a real AI 😸)</p><div class="ai2-msgs" id="ai2Msgs"></div><form class="ai2-form" id="ai2Form"><input class="sball-input" id="ai2In" placeholder="Say something to Maxwell..." autocomplete="off"><button class="btn asc-btn" type="submit">Send</button></form>';
    const msgs = p.body.querySelector("#ai2Msgs");
    function bubble(t, who) { const d = document.createElement("div"); d.className = "ai2-msg " + who; d.textContent = t; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; }
    bubble("Meow! 😺 I'm Maxwell. Ask me for a joke, a cat fact, or how to earn treats!", "ai");
    p.body.querySelector("#ai2Form").onsubmit = (e) => { e.preventDefault(); const inp = p.body.querySelector("#ai2In"); const v = inp.value.trim(); if (!v) return; bubble(v, "me"); inp.value = ""; U.tone(500, 0.04); setTimeout(() => { bubble(aiReply(v), "ai"); U.tone(700, 0.05); }, 400); };
  }

  // ---------------- JUKEBOX (procedural chiptune) ----------------
  function openJukebox() {
    const p = U.panel("jukeOv", "🎵 Maxwell Jukebox", "juke-head");
    const TRACKS = [
      { name: "🐱 Meow March", notes: [392, 392, 440, 392, 523, 494, 392, 392, 440, 392, 587, 523], tempo: 300, type: "square" },
      { name: "✨ Treat Town", notes: [523, 587, 659, 784, 659, 587, 523, 587, 659, 523], tempo: 260, type: "triangle" },
      { name: "👾 Pixel Party", notes: [330, 392, 494, 392, 330, 294, 330, 392, 494, 587, 494, 392], tempo: 200, type: "square" },
      { name: "🌙 Night Nap", notes: [262, 294, 330, 294, 262, 247, 262, 294, 330, 349, 330], tempo: 420, type: "sine" }
    ];
    let timer = null, playingIdx = -1, step = 0;
    p.body.innerHTML = '<p class="ar-hint">Chill chiptunes made right in your browser 🎶</p><div class="juke-list" id="jukeList"></div><button class="btn" id="jukeStop">⏹ Stop</button>';
    const list = p.body.querySelector("#jukeList");
    TRACKS.forEach((tr, i) => { const b = document.createElement("button"); b.className = "btn juke-track"; b.textContent = tr.name; b.onclick = () => play(i); list.appendChild(b); });
    p.body.querySelector("#jukeStop").onclick = stop;
    function stop() { if (timer) clearInterval(timer); timer = null; playingIdx = -1; list.querySelectorAll(".juke-track").forEach((b) => b.classList.remove("on")); }
    function play(i) { stop(); playingIdx = i; step = 0; list.querySelectorAll(".juke-track")[i].classList.add("on"); const tr = TRACKS[i]; timer = setInterval(() => { U.tone(tr.notes[step % tr.notes.length], tr.tempo / 1000 * 0.9, tr.type, 0.08); step++; }, tr.tempo); }
    p.onClean(stop);
  }

  U.wire("catdleBtn", openCatdle);
  U.wire("aiBtn", openAI);
  U.wire("jukeBtn", openJukebox);
})();
