// ===== MaxwellGames extra tabs: Catdle (Wordle), Maxwell AI =====
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
  // Real AI chatbot — bring-your-own Google Gemini key (stored only in this browser).
  const AI_KEY = "mg-sball-key";
  function getKey() { try { return localStorage.getItem(AI_KEY) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { if (k) localStorage.setItem(AI_KEY, k); else localStorage.removeItem(AI_KEY); } catch (e) {} }
  const PERSONAS = [
    { id: "maxwell", emoji: "😺", name: "Maxwell", sys: "You are Maxwell, a silly, friendly tuxedo cat and the mascot of a kids' games website called MaxwellGames. You love treats (called 🐟 fish), games, and being playful. Occasionally meow or use cat puns and cute emoji." },
    { id: "prof", emoji: "🎓", name: "Professor", sys: "You are Professor Maxwell, a wise and encouraging cat tutor on a kids' games website. Explain things clearly and simply like you're helping a curious student. Stay warm and a little playful, with occasional cat flair." },
    { id: "coach", emoji: "💪", name: "Coach", sys: "You are Coach Maxwell, a high-energy hype-cat on a kids' games website. Pump the user up, be encouraging and fun, use lots of energy and exclamation. Keep it positive." },
    { id: "spooky", emoji: "👻", name: "Spooky", sys: "You are Spooky Maxwell, a goofy not-actually-scary ghost cat on a kids' games website. Be mysteriously silly and fun, never genuinely frightening — this is for kids." }
  ];
  function openAI() {
    const p = U.panel("aiOv", "🤖 Maxwell AI", "ai2-head");
    let persona = PERSONAS[0];
    const history = []; // {role:'user'|'model', text}
    p.body.innerHTML = '<div class="ai2-personas" id="ai2Personas"></div><div class="ai2-msgs" id="ai2Msgs"></div><form class="ai2-form" id="ai2Form"><input class="sball-input" id="ai2In" placeholder="Chat with Maxwell..." autocomplete="off"><button class="btn asc-btn" type="submit">Send</button><button class="btn ai2-gear" id="ai2Gear" type="button" title="AI settings">⚙️</button></form>';
    const msgs = p.body.querySelector("#ai2Msgs");
    const pbar = p.body.querySelector("#ai2Personas");
    PERSONAS.forEach((pr) => { const b = document.createElement("button"); b.className = "ai2-chip" + (pr === persona ? " on" : ""); b.innerHTML = pr.emoji + " " + pr.name; b.onclick = () => { persona = pr; pbar.querySelectorAll(".ai2-chip").forEach((c) => c.classList.remove("on")); b.classList.add("on"); bubble(pr.emoji + " " + pr.name + " Maxwell is here! What's up?", "ai"); }; pbar.appendChild(b); });
    function bubble(t, who) { const d = document.createElement("div"); d.className = "ai2-msg " + who; d.textContent = t; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; }
    function typing() { const d = document.createElement("div"); d.className = "ai2-msg ai ai2-typing"; d.innerHTML = '<span></span><span></span><span></span>'; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; }
    const hasKey = !!getKey();
    bubble(hasKey ? "Meow! 😺 I'm a real AI now — ask me anything! Pick a personality up top. 🐾" : "Meow! 😺 I'm Maxwell. I can chat for fun right now — tap ⚙️ to add a free Google AI key and I become a REAL smart AI! 🧠", "ai");

    function askGemini(text) {
      const key = getKey();
      const contents = [];
      history.slice(-10).forEach((h) => contents.push({ role: h.role, parts: [{ text: h.text }] }));
      contents.push({ role: "user", parts: [{ text: text }] });
      const body = { systemInstruction: { parts: [{ text: persona.sys + " Keep replies short (1-3 sentences), upbeat, and always safe and appropriate for children. Never discuss anything violent, scary, adult, or unsafe." }] }, contents: contents, generationConfig: { temperature: 0.9, maxOutputTokens: 300 } };
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const to = setTimeout(() => { if (ctrl) ctrl.abort(); }, 15000);
      return fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + encodeURIComponent(key), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
        .then((r) => r.json()).then((j) => { clearTimeout(to); const c = j && j.candidates && j.candidates[0]; const txt = c && c.content && c.content.parts && c.content.parts[0] && c.content.parts[0].text; if (!txt) throw new Error("no reply"); return txt.trim(); }).catch((e) => { clearTimeout(to); throw e; });
    }

    p.body.querySelector("#ai2Gear").onclick = () => keyDialog();
    function keyDialog() {
      const has = !!getKey();
      const d = document.createElement("div"); d.className = "ai2-keybox";
      d.innerHTML = '<p>Paste a free <b>Google Gemini</b> API key to make Maxwell a real AI. It is stored <b>only in your browser</b> — never uploaded or shared.</p><input class="sball-input" id="ai2Key" placeholder="AIza..." value="' + (has ? "" : "") + '"><div class="ai2-keybtns"><a class="btn" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get a free key</a><button class="btn asc-btn" id="ai2Save">Save</button>' + (has ? '<button class="btn" id="ai2Clear">Remove key</button>' : '') + '</div>';
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
      d.querySelector("#ai2Save").onclick = () => { const v = d.querySelector("#ai2Key").value.trim(); setKey(v); d.remove(); bubble(v ? "🔑 Key saved! I'm a real AI now — ask me anything! 🧠" : "Okay, I'll keep chatting for fun! 😸", "ai"); };
      if (has) d.querySelector("#ai2Clear").onclick = () => { setKey(""); d.remove(); bubble("Key removed. Back to fun mode! 😺", "ai"); };
    }

    p.body.querySelector("#ai2Form").onsubmit = (e) => {
      e.preventDefault(); const inp = p.body.querySelector("#ai2In"); const v = inp.value.trim(); if (!v) return;
      bubble(v, "me"); inp.value = ""; U.tone(500, 0.04);
      if (getKey()) {
        const t = typing();
        askGemini(v).then((reply) => { t.remove(); bubble(reply, "ai"); U.tone(700, 0.05); history.push({ role: "user", text: v }); history.push({ role: "model", text: reply }); })
          .catch(() => { t.remove(); bubble(aiReply(v) + " (⚠️ couldn't reach the AI — check your key/connection.)", "ai"); });
      } else { setTimeout(() => { bubble(aiReply(v), "ai"); U.tone(700, 0.05); }, 350); }
    };
  }

  U.wire("catdleBtn", openCatdle);
  U.wire("aiBtn", openAI);
})();
