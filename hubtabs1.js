// ===== MaxwellGames extra tabs: Quests, Casino, Trivia =====
(function () {
  const U = window.MGUI;

  // ---------------- QUESTS ----------------
  const QUESTS = [
    { id: "q_catch", label: "Catch 25 falling :3s", goal: 25, stat: (s) => s.caught || 0, reward: 50, icon: "😺" },
    { id: "q_arcade", label: "Play 5 Arcade rounds", goal: 5, stat: (s) => s.arcadePlays || 0, reward: 70, icon: "🕹️" },
    { id: "q_pet", label: "Pet Maxwell 20 times", goal: 20, stat: (s) => s.maxwellClicks || 0, reward: 30, icon: "🐈‍⬛" },
    { id: "q_gold", label: "Catch 2 golden :3s", goal: 2, stat: (s) => s.golden || 0, reward: 60, icon: "🌟" },
    { id: "q_hatch", label: "Own 1 more pet", goal: 1, stat: (s) => (s.pets || []).length, reward: 80, icon: "🥚" }
  ];
  function qstate() {
    const s = window.MG.save; const today = new Date().toDateString();
    if (!s.questState || s.questState.date !== today) { const base = {}; QUESTS.forEach((q) => base[q.id] = q.stat(s)); s.questState = { date: today, base: base, claimed: [] }; window.MG.persist(); }
    return s.questState;
  }
  function openQuests() {
    const p = U.panel("questOv", "🎯 Daily Quests", "quest-head"); const s = window.MG.save; const st = qstate();
    const body = p.body; body.innerHTML = '<p class="ar-hint">New quests every day! Finish them for 🐟. Resets at midnight.</p><div class="quest-list" id="questList"></div>';
    function render() {
      const list = body.querySelector("#questList"); list.innerHTML = "";
      QUESTS.forEach((q) => {
        const cur = Math.max(0, q.stat(s) - (st.base[q.id] || 0)); const done = cur >= q.goal; const claimed = st.claimed.indexOf(q.id) >= 0;
        const row = document.createElement("div"); row.className = "quest-row" + (claimed ? " claimed" : done ? " done" : "");
        row.innerHTML = '<span class="quest-ic">' + q.icon + '</span><div class="quest-mid"><div class="quest-label">' + q.label + '</div><div class="quest-bar"><span style="width:' + Math.min(100, cur / q.goal * 100) + '%"></span></div><div class="quest-prog">' + Math.min(cur, q.goal) + ' / ' + q.goal + '</div></div><button class="btn quest-claim">' + (claimed ? "✅ Claimed" : done ? "Claim +" + q.reward + " 🐟" : "+" + q.reward + " 🐟") + '</button>';
        const btn = row.querySelector(".quest-claim"); btn.disabled = !done || claimed;
        btn.onclick = () => { if (done && !claimed) { st.claimed.push(q.id); window.MG.addTreats(q.reward); window.MG.persist(); U.tone(800, 0.1); U.toast(q.icon, "Quest done!", "+" + q.reward + " 🐟"); render(); } };
        list.appendChild(row);
      });
    }
    render();
  }

  // ---------------- CASINO ----------------
  function openCasino() {
    const p = U.panel("casinoOv", "🎰 Maxwell Casino", "casino-head");
    menu();
    function menu() {
      p.body.innerHTML = '<p class="ar-hint">🐟 <b id="casTreats">' + U.treats() + '</b> treats. Bet wisely — the house has 9 lives! 😼</p><div class="casino-menu"><button class="btn asc-btn" data-g="coin">🪙 Coin Flip</button><button class="btn asc-btn" data-g="dice">🎲 Dice Roll</button><button class="btn asc-btn" data-g="roul">🎡 Roulette</button></div>';
      p.body.querySelectorAll("[data-g]").forEach((b) => b.onclick = () => games[b.dataset.g]());
    }
    function betUI(title, controlsHTML, onPlay) {
      p.body.innerHTML = '<button class="btn" id="casBack">← Casino</button><h3 style="text-align:center">' + title + '</h3><p class="ar-hint" style="text-align:center">🐟 <b id="casTreats">' + U.treats() + '</b> · Bet: <input id="casBet" class="sball-input" type="number" value="25" min="1" style="width:90px;display:inline-block"></p><div class="casino-controls">' + controlsHTML + '</div><p class="cas-result" id="casResult"></p>';
      p.body.querySelector("#casBack").onclick = menu;
      p.body.querySelectorAll("[data-pick]").forEach((b) => b.onclick = () => {
        const bet = Math.max(1, Math.floor(+p.body.querySelector("#casBet").value || 0));
        if (!U.spend(bet)) { p.body.querySelector("#casResult").textContent = "Not enough treats!"; return; }
        onPlay(b.dataset.pick, bet, p.body.querySelector("#casResult"));
        p.body.querySelector("#casTreats").textContent = U.treats();
      });
    }
    const games = {
      coin: () => betUI("🪙 Coin Flip", '<button class="btn asc-btn" data-pick="h">Heads</button><button class="btn asc-btn" data-pick="t">Tails</button>', (pick, bet, out) => {
        const r = Math.random() < 0.5 ? "h" : "t"; const win = r === pick; if (win) { U.give(bet * 2); U.tone(800, 0.1); } else U.tone(180, 0.1, "sawtooth");
        out.innerHTML = "It landed <b>" + (r === "h" ? "Heads" : "Tails") + "</b> — " + (win ? "YOU WIN +" + bet * 2 + " 🐟!" : "you lost " + bet + " 🐟.");
      }),
      dice: () => betUI("🎲 Dice Roll", '<button class="btn asc-btn" data-pick="lo">Low (1-3) ×2</button><button class="btn asc-btn" data-pick="hi">High (4-6) ×2</button><button class="btn asc-btn" data-pick="six">Exact 6 ×6</button>', (pick, bet, out) => {
        const r = 1 + (Math.random() * 6 | 0); let win = false, mult = 2; if (pick === "lo") win = r <= 3; else if (pick === "hi") win = r >= 4; else { win = r === 6; mult = 6; }
        if (win) { U.give(bet * mult); U.tone(800, 0.1); } else U.tone(180, 0.1, "sawtooth");
        out.innerHTML = "🎲 Rolled a <b>" + r + "</b> — " + (win ? "YOU WIN +" + bet * mult + " 🐟!" : "you lost " + bet + " 🐟.");
      }),
      roul: () => betUI("🎡 Roulette", '<button class="btn asc-btn" data-pick="r" style="background:#e8303a">Red ×2</button><button class="btn asc-btn" data-pick="b" style="background:#222">Black ×2</button><button class="btn asc-btn" data-pick="g" style="background:#19d39b">Green ×14</button>', (pick, bet, out) => {
        const n = Math.random() * 37 | 0; const col = n === 0 ? "g" : (n % 2 ? "r" : "b"); const win = col === pick; const mult = pick === "g" ? 14 : 2;
        if (win) { U.give(bet * mult); U.tone(800, 0.12); } else U.tone(180, 0.1, "sawtooth");
        out.innerHTML = "🎡 " + n + " (" + (col === "g" ? "Green" : col === "r" ? "Red" : "Black") + ") — " + (win ? "YOU WIN +" + bet * mult + " 🐟!" : "you lost " + bet + " 🐟.");
      })
    };
  }

  // ---------------- TRIVIA ----------------
  const TRIVIA = [
    { q: "What kind of animal is Maxwell?", o: ["Dog", "Cat", "Fish", "Bird"], a: 1 },
    { q: "What do you earn in MaxwellGames?", o: ["Coins", "Gems", "Treats 🐟", "Stars"], a: 2 },
    { q: "Which is NOT a real planet?", o: ["Mars", "Venus", "Krypton", "Saturn"], a: 2 },
    { q: "What sound does a cat make?", o: ["Woof", "Meow", "Moo", "Quack"], a: 1 },
    { q: "How many legs does a spider have?", o: ["6", "8", "10", "4"], a: 1 },
    { q: "What color are emeralds?", o: ["Red", "Blue", "Green", "Yellow"], a: 2 },
    { q: "Which game has you stacking blocks that clear lines?", o: ["Tetris", "Snake", "Pong", "Chess"], a: 0 },
    { q: "What is 7 × 8?", o: ["54", "56", "64", "48"], a: 1 },
    { q: "The sun is a...", o: ["Planet", "Star", "Moon", "Comet"], a: 1 },
    { q: "Which is a Pokémon?", o: ["Pikachu", "Sonic", "Mario", "Kirby"], a: 0 },
    { q: "What do you hatch in the Pets tab?", o: ["Seeds", "Eggs", "Rocks", "Boxes"], a: 1 },
    { q: "How many sides does a hexagon have?", o: ["5", "6", "7", "8"], a: 1 },
    { q: "What's frozen water?", o: ["Steam", "Ice", "Rain", "Fog"], a: 1 },
    { q: "Fastest land animal?", o: ["Cheetah", "Lion", "Horse", "Dog"], a: 0 },
    { q: "Which is a primary color?", o: ["Green", "Orange", "Blue", "Purple"], a: 2 }
  ];
  function openTrivia() {
    const p = U.panel("triviaOv", "🧠 Maxwell Trivia", "trivia-head");
    const qs = TRIVIA.slice().sort(() => Math.random() - 0.5).slice(0, 5);
    let i = 0, score = 0;
    function show() {
      if (i >= qs.length) { const rew = score * 20; U.give(rew); p.body.innerHTML = '<div class="trivia-done"><h2>🧠 ' + score + '/' + qs.length + ' correct!</h2><p class="ar-reward">+' + rew + ' 🐟</p><button class="btn asc-btn" id="trAgain">Play again</button></div>'; p.body.querySelector("#trAgain").onclick = () => openTrivia(); return; }
      const Q = qs[i];
      p.body.innerHTML = '<p class="ar-hint">Question ' + (i + 1) + ' of ' + qs.length + ' · Score ' + score + '</p><h3 class="trivia-q">' + Q.q + '</h3><div class="trivia-opts" id="trOpts"></div>';
      Q.o.forEach((opt, k) => { const b = document.createElement("button"); b.className = "btn trivia-opt"; b.textContent = opt; b.onclick = () => { if (k === Q.a) { score++; U.tone(800, 0.08); b.classList.add("right"); } else { U.tone(180, 0.1, "sawtooth"); b.classList.add("wrong"); p.body.querySelectorAll(".trivia-opt")[Q.a].classList.add("right"); } p.body.querySelectorAll(".trivia-opt").forEach((x) => x.disabled = true); setTimeout(() => { i++; show(); }, 850); }; p.body.querySelector("#trOpts").appendChild(b); });
    }
    show();
  }

  U.wire("questsBtn", openQuests);
  U.wire("casinoBtn", openCasino);
  U.wire("triviaBtn", openTrivia);
})();
