// ===== MaxwellGames: CORE GAMEPLAY — collectibles, gambling, events, upgrades (on the main screen!) =====
(function () {
  function MG() { return window.MG; }
  function ready(fn) { if (window.MG && document.querySelector(".logo-img")) fn(); else setTimeout(() => ready(fn), 200); }

  ready(function () {
    const mg = MG();
    const save = mg.save;
    // lazy fields
    save.collection = save.collection || {};
    if (save.pawPower == null) save.pawPower = 1;
    if (save.clover == null) save.clover = 0;
    if (save.gambleWins == null) save.gambleWins = 0;
    if (save.collectorDone == null) save.collectorDone = false;
    mg.persist();

    const COLLECT = [
      { id: "star", e: "⭐", name: "Star", rar: "common", v: 4 },
      { id: "bone", e: "🦴", name: "Fish Bone", rar: "common", v: 4 },
      { id: "shell", e: "🐚", name: "Shell", rar: "common", v: 5 },
      { id: "candy", e: "🍬", name: "Candy", rar: "common", v: 5 },
      { id: "yarn", e: "🧶", name: "Yarn Ball", rar: "rare", v: 15 },
      { id: "bell", e: "🔔", name: "Bell", rar: "rare", v: 16 },
      { id: "gem", e: "💎", name: "Gem", rar: "rare", v: 22 },
      { id: "bow", e: "🎀", name: "Bow", rar: "epic", v: 45 },
      { id: "crown", e: "👑", name: "Crown", rar: "epic", v: 55 },
      { id: "trophy", e: "🏆", name: "Trophy", rar: "legendary", v: 130 },
      { id: "rainbow", e: "🌈", name: "Rainbow", rar: "legendary", v: 160 }
    ];
    const RARW = { common: 50, rare: 15, epic: 4, legendary: 1 };
    const byId = (id) => COLLECT.find((c) => c.id === id);

    function busy() { const l = document.getElementById("loader"); if (l && !l.classList.contains("gone")) return true; if (document.querySelector(".arcade, .evo")) return true; const p = document.getElementById("panel"); if (p && !p.classList.contains("hidden")) return true; return false; }
    function float(t, x, y, cls) { try { mg.floatText(t, x, y, cls); } catch (e) {} }

    // ---------------- COLLECTIBLES ----------------
    function pickItem() {
      const pool = [];
      COLLECT.forEach((c) => { let w = RARW[c.rar]; if (c.rar !== "common") w += save.clover * (c.rar === "legendary" ? 0.4 : c.rar === "epic" ? 1 : 2); for (let i = 0; i < Math.round(w * 10); i++) pool.push(c); });
      return pool[Math.random() * pool.length | 0];
    }
    function spawnCollectible() {
      if (busy()) return;
      const it = pickItem();
      const el = document.createElement("div");
      el.className = "collectible rar-" + it.rar;
      el.textContent = it.e;
      const x = 8 + Math.random() * 82, y = 20 + Math.random() * 62;
      el.style.left = x + "vw"; el.style.top = y + "vh";
      el.title = it.name;
      document.body.appendChild(el);
      const life = 8500 + save.clover * 600;
      const rm = setTimeout(() => el.classList.add("gone"), life);
      const rm2 = setTimeout(() => el.remove(), life + 500);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        clearTimeout(rm); clearTimeout(rm2);
        const first = !save.collection[it.id];
        save.collection[it.id] = (save.collection[it.id] || 0) + 1;
        const px = ev.clientX, py = ev.clientY;
        mg.addTreats(it.v, px, py);
        try { mg.boomSound(0.06); } catch (e) {}
        el.classList.add("grab");
        setTimeout(() => el.remove(), 350);
        if (first) { mg.toast(it.e, "New collectible!", it.name + " added to your collection"); float("NEW!", px, py - 28, "gold"); checkComplete(); }
        updateBadge();
        mg.persist();
      });
    }
    function uniqueCount() { return COLLECT.filter((c) => save.collection[c.id]).length; }
    function checkComplete() {
      if (!save.collectorDone && uniqueCount() >= COLLECT.length) {
        save.collectorDone = true; mg.give(500); try { mg.flag("collector"); } catch (e) {}
        mg.toast("🏆", "COLLECTION COMPLETE!", "You found every collectible! +500 🐟");
        try { mg.boomSound(0.14); mg.particles.goldenStorm(24); } catch (e) {}
        mg.persist();
      }
    }
    let spawnTimer = null;
    function scheduleSpawn() { const base = Math.max(5000, 13000 - save.clover * 1100); spawnTimer = setTimeout(() => { if (!document.hidden) spawnCollectible(); scheduleSpawn(); }, base + Math.random() * 6000); }

    // ---------------- RANDOM EVENTS ----------------
    function goldenRain() { if (busy()) return; try { mg.particles.goldenStorm(22); } catch (e) {} mg.toast("✨", "GOLDEN RAIN!", "Catch the golden :3s for big treats!"); }
    let feverTimer = null;
    function fever() {
      if (busy()) return;
      try { mg.setEventMult(2); } catch (e) {}
      banner("🔥 FEVER MODE — 2× treats!", 15);
      clearTimeout(feverTimer);
      feverTimer = setTimeout(() => { try { mg.setEventMult(1); } catch (e) {} }, 15000);
    }
    function mysteryBox() {
      if (busy()) return;
      const el = document.createElement("div"); el.className = "collectible mystery"; el.textContent = "📦";
      el.style.left = (12 + Math.random() * 74) + "vw"; el.style.top = (24 + Math.random() * 54) + "vh";
      document.body.appendChild(el);
      const rm = setTimeout(() => el.remove(), 9000);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation(); clearTimeout(rm); el.classList.add("grab"); setTimeout(() => el.remove(), 300);
        const roll = Math.random();
        if (roll < 0.45) { const amt = 25 + (Math.random() * 90 | 0); mg.give(amt); float("+" + amt + " 🐟", ev.clientX, ev.clientY, "gold"); mg.toast("📦", "Mystery Box!", "You found " + amt + " 🐟!"); }
        else if (roll < 0.8) { const it = pickItem(); save.collection[it.id] = (save.collection[it.id] || 0) + 1; mg.toast("📦", "Mystery Box!", "A " + it.name + " " + it.e + "!"); checkComplete(); updateBadge(); mg.persist(); }
        else { fever(); mg.toast("📦", "Mystery Box!", "FEVER MODE unlocked!"); }
        try { mg.boomSound(0.1); } catch (e) {}
      });
    }
    function rareMaxwell() {
      if (busy()) return;
      const el = document.createElement("div"); el.className = "rare-max"; el.textContent = "🐈‍⬛";
      const spark = document.createElement("span"); spark.className = "rare-spark"; spark.textContent = "✨"; el.appendChild(spark);
      const fromLeft = Math.random() < 0.5; const y = 20 + Math.random() * 55;
      el.style.top = y + "vh"; el.style.left = fromLeft ? "-10vw" : "110vw";
      document.body.appendChild(el);
      requestAnimationFrame(() => { el.style.transition = "left 6s linear"; el.style.left = fromLeft ? "110vw" : "-10vw"; });
      const rm = setTimeout(() => el.remove(), 6200);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation(); clearTimeout(rm); el.remove();
        const amt = 60 + (Math.random() * 120 | 0); mg.give(amt); try { mg.meow(); mg.particles.burst(20); } catch (e) {}
        float("RARE! +" + amt + " 🐟", ev.clientX, ev.clientY, "gold");
        mg.toast("🐈‍⬛", "Rare Maxwell caught!", "+" + amt + " 🐟 — lightning reflexes!");
      });
    }
    const EVENTS = [goldenRain, fever, mysteryBox, mysteryBox, rareMaxwell];
    function scheduleEvent() { setTimeout(() => { if (!document.hidden && !busy() && Math.random() < 0.85) EVENTS[Math.random() * EVENTS.length | 0](); scheduleEvent(); }, 26000 + Math.random() * 26000); }

    function banner(txt, secs) {
      let b = document.getElementById("cpBanner");
      if (!b) { b = document.createElement("div"); b.id = "cpBanner"; b.className = "cp-banner"; document.body.appendChild(b); }
      b.textContent = txt; b.classList.add("show");
      clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("show"), secs * 1000);
    }

    // ---------------- PAW POWER (click Maxwell) ----------------
    const logo = document.querySelector(".logo-img");
    if (logo) logo.addEventListener("click", () => { const n = save.pawPower || 1; const r = logo.getBoundingClientRect(); mg.addTreats(n, r.left + r.width / 2, r.top); });

    // ---------------- FLOATING WIDGET (gamble / collection / upgrades) ----------------
    const fab = document.createElement("button"); fab.id = "cpFab"; fab.className = "cp-fab"; fab.title = "Lucky Paw — gamble, collection & upgrades"; fab.textContent = "🐾";
    document.body.appendChild(fab);
    const badge = document.createElement("span"); badge.className = "cp-fab-badge"; fab.appendChild(badge);
    function updateBadge() { const u = uniqueCount(); badge.textContent = u; badge.classList.toggle("full", u >= COLLECT.length); }
    updateBadge();

    const pop = document.createElement("div"); pop.id = "cpPop"; pop.className = "cp-pop hidden";
    document.body.appendChild(pop);
    let tab = "gamble", bet = 10;
    fab.addEventListener("click", (e) => { e.stopPropagation(); pop.classList.toggle("hidden"); if (!pop.classList.contains("hidden")) render(); });
    document.addEventListener("click", (e) => { if (!pop.classList.contains("hidden") && !pop.contains(e.target) && e.target !== fab) pop.classList.add("hidden"); });

    const cost = (lvl, base, mul) => Math.round(base * Math.pow(mul, lvl));
    function render() {
      pop.innerHTML = '<div class="cp-tabs">'
        + '<button data-t="gamble" class="' + (tab === "gamble" ? "on" : "") + '">🎲 Gamble</button>'
        + '<button data-t="collect" class="' + (tab === "collect" ? "on" : "") + '">🎒 Collection</button>'
        + '<button data-t="upg" class="' + (tab === "upg" ? "on" : "") + '">⬆️ Upgrades</button>'
        + '</div><div class="cp-body" id="cpBody"></div>';
      pop.querySelectorAll(".cp-tabs button").forEach((b) => b.onclick = () => { tab = b.dataset.t; render(); });
      const body = pop.querySelector("#cpBody");
      if (tab === "gamble") renderGamble(body);
      else if (tab === "collect") renderCollect(body);
      else renderUpg(body);
    }
    function treats() { return save.treats; }

    function renderGamble(body) {
      body.innerHTML = '<p class="cp-treats">🐟 <b id="cpT">' + treats() + '</b></p>'
        + '<div class="cp-bets" id="cpBets"></div>'
        + '<button class="btn asc-btn cp-wide" id="cpFlip">🪙 Double or Nothing</button>'
        + '<div class="cp-res" id="cpFlipRes"></div>'
        + '<hr class="cp-hr"><div class="cp-slot" id="cpReels">🐟 🐟 🐟</div>'
        + '<button class="btn asc-btn cp-wide" id="cpSpin">🎰 Spin (bet)</button>'
        + '<div class="cp-res" id="cpSpinRes"></div>';
      const bets = [10, 50, 100, 500];
      const bb = body.querySelector("#cpBets");
      bets.forEach((v) => { const b = document.createElement("button"); b.className = "cp-bet" + (bet === v ? " on" : ""); b.textContent = v; b.onclick = () => { bet = v; renderGamble(body); }; bb.appendChild(b); });
      const refreshT = () => { const t = body.querySelector("#cpT"); if (t) t.textContent = treats(); };
      body.querySelector("#cpFlip").onclick = () => {
        if (!mg.spend(bet)) { body.querySelector("#cpFlipRes").textContent = "Not enough 🐟!"; return; }
        const win = Math.random() < 0.5;
        if (win) { mg.give(bet * 2); save.gambleWins++; body.querySelector("#cpFlipRes").innerHTML = "🎉 <b>WON +" + bet + " 🐟!</b>"; try { mg.boomSound(0.1); } catch (e) {} }
        else { body.querySelector("#cpFlipRes").innerHTML = "💀 Lost " + bet + " 🐟. Try again!"; }
        mg.persist(); refreshT();
      };
      body.querySelector("#cpSpin").onclick = () => {
        if (!mg.spend(bet)) { body.querySelector("#cpSpinRes").textContent = "Not enough 🐟!"; return; }
        const S = ["🐟", "⭐", "💎", "🐱", "🔔", "7️⃣"];
        const r = [0, 0, 0].map(() => S[Math.random() * S.length | 0]);
        body.querySelector("#cpReels").textContent = r.join(" ");
        let mult = 0, msg;
        if (r[0] === r[1] && r[1] === r[2]) { mult = r[0] === "7️⃣" ? 20 : r[0] === "💎" ? 12 : 8; msg = "JACKPOT!"; }
        else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) { mult = 1.5; msg = "Pair!"; }
        if (mult) { const won = Math.round(bet * mult); mg.give(won); save.gambleWins++; body.querySelector("#cpSpinRes").innerHTML = "🎉 <b>" + msg + " +" + won + " 🐟</b>"; try { mg.boomSound(0.12); } catch (e) {} }
        else body.querySelector("#cpSpinRes").textContent = "No match — spin again!";
        mg.persist(); refreshT();
      };
    }

    function renderCollect(body) {
      const u = uniqueCount();
      let html = '<p class="cp-sub">Collected <b>' + u + " / " + COLLECT.length + '</b> kinds. Grab items that pop up on screen!</p><div class="cp-grid">';
      COLLECT.forEach((c) => { const n = save.collection[c.id] || 0; html += '<div class="cp-cel rar-' + c.rar + (n ? "" : " locked") + '" title="' + c.name + '"><span class="cp-cel-e">' + (n ? c.e : "❔") + '</span><span class="cp-cel-n">' + (n ? "×" + n : "") + '</span></div>'; });
      html += '</div>' + (save.collectorDone ? '<p class="cp-sub">🏆 Collection complete!</p>' : '<p class="cp-sub">Collect all ' + COLLECT.length + ' for <b>+500 🐟</b>!</p>');
      body.innerHTML = html;
    }

    function renderUpg(body) {
      const pawCost = cost(save.pawPower - 1, 40, 1.55), cloCost = cost(save.clover, 120, 1.7);
      body.innerHTML = '<p class="cp-treats">🐟 <b>' + treats() + '</b></p>'
        + '<div class="cp-upg"><div><b>🐾 Paw Power</b> — Lv ' + save.pawPower + '<br><small>+' + save.pawPower + ' 🐟 each time you pet Maxwell</small></div><button class="btn asc-btn" id="cpPaw">' + pawCost + ' 🐟</button></div>'
        + '<div class="cp-upg"><div><b>🍀 Lucky Clover</b> — Lv ' + save.clover + '<br><small>More collectibles &amp; better rare drops</small></div><button class="btn asc-btn" id="cpClo">' + cloCost + ' 🐟</button></div>'
        + '<p class="cp-sub">Tip: pet Maxwell (top-left logo) to earn 🐟 every click!</p>';
      body.querySelector("#cpPaw").onclick = () => { if (mg.spend(pawCost)) { save.pawPower++; mg.persist(); mg.toast("🐾", "Paw Power up!", "Now +" + save.pawPower + " 🐟 per pet"); renderUpg(body); } else mg.toast("😿", "Not enough 🐟", "Keep collecting!"); };
      body.querySelector("#cpClo").onclick = () => { if (mg.spend(cloCost)) { save.clover++; mg.persist(); mg.toast("🍀", "Lucky Clover up!", "More goodies will appear!"); renderUpg(body); } else mg.toast("😿", "Not enough 🐟", "Keep collecting!"); };
    }

    // ---------------- start loops ----------------
    scheduleSpawn();
    scheduleEvent();
    // a first collectible shortly after load for discoverability
    setTimeout(() => { if (!document.hidden) spawnCollectible(); }, 6000);
  });
})();
