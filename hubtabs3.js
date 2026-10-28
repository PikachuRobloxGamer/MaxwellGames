// ===== MaxwellGames extra tabs: Codes, Updates, Customize, Daily, Cat Facts =====
(function () {
  const U = window.MGUI;

  // ---------------- CODES ----------------
  const CODES = { MEOW: 50, MAXWELL: 100, TREATS: 75, SUBSCRIBE: 150, GAMESON: 100, SCHOOL: 200, PIKACHU: 100, FISH: 60, LEGENDARY: 300, CATDLE: 80 };
  function openCodes() {
    const p = U.panel("codesOv", "🎁 Redeem Codes", "codes-head");
    const s = window.MG.save; if (!s.codesRedeemed) s.codesRedeemed = [];
    p.body.innerHTML = '<p class="ar-hint">Enter secret codes for free 🐟! Codes are shared on the YouTube channels & around school. 😼</p><form class="codes-form" id="codesForm"><input class="sball-input" id="codeIn" placeholder="ENTER CODE" style="text-transform:uppercase;text-align:center;letter-spacing:2px"><button class="btn asc-btn" type="submit">Redeem</button></form><p class="codes-msg" id="codesMsg"></p><p class="ar-hint">You\'ve redeemed <b>' + s.codesRedeemed.length + '</b> codes.</p>';
    p.body.querySelector("#codesForm").onsubmit = (e) => {
      e.preventDefault(); const code = (p.body.querySelector("#codeIn").value || "").trim().toUpperCase(); const msg = p.body.querySelector("#codesMsg");
      if (!code) return;
      if (s.codesRedeemed.indexOf(code) >= 0) { msg.textContent = "⚠️ You already used that code!"; msg.style.color = "#ff9a3c"; return; }
      if (CODES[code]) { s.codesRedeemed.push(code); window.MG.addTreats(CODES[code]); window.MG.persist(); try { window.MG.flag("codes"); } catch (x) {} msg.innerHTML = "✅ <b>+" + CODES[code] + " 🐟!</b> Nice one!"; msg.style.color = "#3ee08f"; U.tone(800, 0.12); p.body.querySelector("#codeIn").value = ""; }
      else { msg.textContent = "❌ Invalid code. Keep looking!"; msg.style.color = "#ff7a7a"; U.tone(180, 0.1, "sawtooth"); }
    };
  }

  // ---------------- UPDATES / CHANGELOG ----------------
  const LOG = [
    ["v52", "💡 Suggestions link added all around the site"],
    ["v50", "🐾 Pets collection, 🌌 more 3D games, 🌐 Online Battle, upgraded evolutions"],
    ["v49", "🏆 Global Leaderboard, 🏎️ Road 3D, 🚁 Copter, 🔪 Fish Ninja & more"],
    ["v48", "✨ New look, ⚔️ Duels, 📺 Maxwell TV, 🧊 3D Maze, 6 new ascensions, 5 new Pokémon"],
    ["v47", "🐱 14 new games in the Games tab, new admin powers"],
    ["v45", "🕹️ 8 new arcade games + categories"],
    ["v44", "🔮 Satisfying Balls rebuilt — AI chat, fullscreen, better physics"],
    ["NEW", "🎯 Quests, 🎰 Casino, 🧠 Trivia, 🟩 Catdle, 🎁 Codes, 🤖 Maxwell AI & more!"]
  ];
  function openUpdates() {
    const p = U.panel("updatesOv", "📰 Updates", "updates-head");
    let html = '<p class="ar-hint">Look how much MaxwellGames has grown! 🚀 New stuff all the time.</p><div class="log-list">';
    LOG.forEach((l) => { html += '<div class="log-row"><span class="log-ver">' + l[0] + '</span><span class="log-txt">' + l[1] + '</span></div>'; });
    html += '</div><p class="ar-hint">Got an idea? Use the 💡 Suggestions link!</p>';
    p.body.innerHTML = html;
  }

  // ---------------- CUSTOMIZE ----------------
  function openCustomize() {
    const p = U.panel("customOv", "🎨 Customize", "custom-head");
    const COLORS = [["Purple", "#6c5ce7"], ["Green", "#3ee08f"], ["Pink", "#ff5fa2"], ["Blue", "#2f8cff"], ["Gold", "#ffd84a"], ["Red", "#e8303a"], ["Cyan", "#00cec9"], ["Orange", "#ff9a3c"]];
    const PARTS = [["p-3", ":3"], ["p-fish", "🐟"], ["p-heart", "❤️"], ["p-star", "⭐"], ["p-paw", "🐾"], ["p-snow", "❄️"], ["p-spark", "🌈"]];
    p.body.innerHTML = '<p class="ar-hint">Quick live customization (preview). Buy permanent ones in the Shop! 🎨</p><h3>Accent color</h3><div class="cust-row" id="custColors"></div><h3>Falling particles</h3><div class="cust-row" id="custParts"></div>';
    const cc = p.body.querySelector("#custColors");
    COLORS.forEach((c) => { const b = document.createElement("button"); b.className = "cust-swatch"; b.style.background = c[1]; b.title = c[0]; b.onclick = () => { document.documentElement.style.setProperty("--accent", c[1]); U.tone(600, 0.05); }; cc.appendChild(b); });
    const cp = p.body.querySelector("#custParts");
    PARTS.forEach((pt) => { const b = document.createElement("button"); b.className = "btn cust-part"; b.textContent = pt[1]; b.onclick = () => { try { window.MG.particles.setStyle(pt[0]); } catch (x) {} U.tone(500, 0.05); }; cp.appendChild(b); });
  }

  // ---------------- DAILY REWARDS ----------------
  function openDaily() {
    const p = U.panel("dailyOv", "🎁 Daily Rewards", "daily-head");
    const s = window.MG.save; const today = new Date().toDateString();
    if (!s.dailyTab) s.dailyTab = { date: "", day: 0 };
    const REWARDS = [25, 50, 75, 100, 150, 200, 500];
    const claimedToday = s.dailyTab.date === today;
    let html = '<p class="ar-hint">Come back every day for a bigger reward! 7-day streak = 500 🐟 jackpot 🎉</p><div class="daily-grid">';
    REWARDS.forEach((r, i) => { const day = i + 1; const got = s.dailyTab.day >= day; const isNext = s.dailyTab.day + 1 === day && !claimedToday; html += '<div class="daily-cell' + (got ? " got" : "") + (isNext ? " next" : "") + '"><div class="daily-day">Day ' + day + '</div><div class="daily-rew">' + r + ' 🐟</div></div>'; });
    html += '</div><button class="btn asc-btn" id="dailyClaim">' + (claimedToday ? "✅ Come back tomorrow!" : "🎁 Claim Day " + (s.dailyTab.day + 1) + "!") + '</button>';
    p.body.innerHTML = html;
    const btn = p.body.querySelector("#dailyClaim"); btn.disabled = claimedToday;
    btn.onclick = () => {
      if (s.dailyTab.date === today) return;
      const yest = new Date(Date.now() - 864e5).toDateString();
      s.dailyTab.day = (s.dailyTab.date === yest && s.dailyTab.day < 7) ? s.dailyTab.day + 1 : 1;
      s.dailyTab.date = today; const r = REWARDS[s.dailyTab.day - 1]; window.MG.addTreats(r); window.MG.persist();
      U.tone(880, 0.15); U.toast("🎁", "Daily Reward!", "+" + r + " 🐟 (Day " + s.dailyTab.day + ")"); openDaily();
    };
  }

  // ---------------- CAT FACTS ----------------
  const CATFACTS = ["🐱 Cats spend ~70% of their lives sleeping.", "😺 A cat can jump up to 6 times its length.", "🐾 Cats have five toes on front paws but four on the back.", "😻 Purring can help cats heal their bones.", "🐈 The oldest cat ever lived to 38 years old.", "😼 Cats can't taste sweetness.", "🙀 A cat's whiskers are as wide as its body.", "😸 Cats 'headbutt' you because they trust you.", "🐾 A house cat shares 95.6% of its DNA with tigers.", "😺 Cats make the 'meow' sound mostly to talk to humans.", "🐱 Maxwell the Cat became a meme in 2022 and never looked back."];
  function openCatFacts() {
    const p = U.panel("factsOv", "😺 Cat Facts", "facts-head");
    p.body.innerHTML = '<div class="facts-wrap"><div class="facts-card" id="factCard">Tap the button for a random cat fact!</div><button class="btn asc-btn" id="factBtn">🎲 New Fact</button><p class="ar-hint">Impress your friends with cat knowledge 😎</p></div>';
    p.body.querySelector("#factBtn").onclick = () => { p.body.querySelector("#factCard").textContent = CATFACTS[Math.random() * CATFACTS.length | 0]; U.tone(600, 0.06); };
  }

  U.wire("codesBtn", openCodes);
  U.wire("updatesBtn", openUpdates);
  U.wire("customBtn", openCustomize);
  U.wire("dailyBtn", openDaily);
  U.wire("factsBtn", openCatFacts);
})();
