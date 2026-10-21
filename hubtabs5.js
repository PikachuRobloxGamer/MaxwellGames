// ===== MaxwellGames extra tabs: Fishing, Boosts, Profile =====
(function () {
  const U = window.MGUI;

  // ---------------- FISHING ----------------
  const FISH = [
    { e: "🐟", n: "Common Fish", v: 5, w: 50 }, { e: "🐠", n: "Tropical Fish", v: 12, w: 25 },
    { e: "🐡", n: "Pufferfish", v: 20, w: 12 }, { e: "🦈", n: "Shark", v: 60, w: 6 },
    { e: "🐙", n: "Octopus", v: 40, w: 5 }, { e: "🦑", n: "Giant Squid", v: 120, w: 2 },
    { e: "🥾", n: "Old Boot", v: 1, w: 15 }, { e: "👑", n: "GOLDEN CROWN", v: 500, w: 1 }
  ];
  function openFishing() {
    const p = U.panel("fishOv", "🎣 Fishing", "fish-head");
    const s = window.MG.save; if (!s.fishStats) s.fishStats = { caught: 0, best: 0 };
    let state = "idle", timer = null, biteAt = 0;
    p.body.innerHTML = '<p class="ar-hint">Cast your line, wait for a <b>❗ BITE</b>, then REEL fast! Caught: <b id="fishN">' + s.fishStats.caught + '</b> · Best: <b id="fishBest">' + s.fishStats.best + ' 🐟</b></p><div class="fish-pond" id="fishPond">🎣</div><button class="btn asc-btn" id="fishBtn">🎣 Cast</button><p class="fish-msg" id="fishMsg"></p>';
    const pond = p.body.querySelector("#fishPond"), btn = p.body.querySelector("#fishBtn"), msg = p.body.querySelector("#fishMsg");
    btn.onclick = () => {
      if (state === "idle") { state = "wait"; btn.textContent = "…waiting…"; pond.textContent = "🌊"; msg.textContent = "Wait for it..."; timer = setTimeout(() => { state = "bite"; pond.textContent = "❗"; pond.classList.add("bite"); btn.textContent = "🎣 REEL!"; msg.textContent = "REEL NOW!"; U.tone(800, 0.1); biteAt = Date.now(); timer = setTimeout(() => { if (state === "bite") { state = "idle"; pond.textContent = "🎣"; pond.classList.remove("bite"); btn.textContent = "🎣 Cast"; msg.textContent = "It got away! 🐟💨"; } }, 1200); }, 1200 + Math.random() * 2600); }
      else if (state === "wait") { clearTimeout(timer); state = "idle"; pond.textContent = "🎣"; btn.textContent = "🎣 Cast"; msg.textContent = "Too early! Wait for the ❗"; }
      else if (state === "bite") {
        clearTimeout(timer); state = "idle"; pond.classList.remove("bite");
        const pool = []; FISH.forEach((f) => { for (let i = 0; i < f.w; i++) pool.push(f); }); const fish = pool[Math.random() * pool.length | 0];
        s.fishStats.caught++; if (fish.v > s.fishStats.best) s.fishStats.best = fish.v; window.MG.addTreats(fish.v); window.MG.persist();
        pond.textContent = fish.e; btn.textContent = "🎣 Cast Again"; msg.innerHTML = "You caught a <b>" + fish.n + "</b>! +" + fish.v + " 🐟"; U.tone(700, 0.12);
        p.body.querySelector("#fishN").textContent = s.fishStats.caught; p.body.querySelector("#fishBest").textContent = s.fishStats.best + " 🐟";
      }
    };
    p.onClean(() => clearTimeout(timer));
  }

  // ---------------- BOOSTS (real timed treat multipliers) ----------------
  const BOOSTS = [{ name: "2× Treats", mult: 2, mins: 5, cost: 300 }, { name: "3× Treats", mult: 3, mins: 5, cost: 800 }, { name: "5× Treats", mult: 5, mins: 3, cost: 2000 }];
  let boostEnd = 0, boostMult = 1, boostTimer = null;
  function openBoosts() {
    const p = U.panel("boostOv", "💪 Boosts", "boost-head");
    function render() {
      const active = boostEnd > Date.now();
      let html = '<p class="ar-hint">Buy a temporary <b>treat multiplier</b> — everything you earn is multiplied! 🐟 <b id="boT">' + U.treats() + '</b></p>';
      html += '<div class="boost-active" id="boActive">' + (active ? "⚡ <b>" + boostMult + "× ACTIVE</b> — <span id='boCount'></span>" : "No boost active") + '</div>';
      html += '<div class="boost-list">';
      BOOSTS.forEach((bo, i) => { html += '<button class="btn asc-btn boost-buy" data-i="' + i + '">' + bo.name + '<br><small>' + bo.mins + ' min · ' + bo.cost + ' 🐟</small></button>'; });
      html += '</div>';
      p.body.innerHTML = html;
      p.body.querySelectorAll(".boost-buy").forEach((b) => b.onclick = () => { const bo = BOOSTS[+b.dataset.i]; if (!U.spend(bo.cost)) { U.toast("😿", "Not enough treats", "Need " + bo.cost + " 🐟"); return; } startBoost(bo.mult, bo.mins); render(); });
      tick();
    }
    function tick() { const el = p.body.querySelector("#boCount"); if (el && boostEnd > Date.now()) { const s = Math.ceil((boostEnd - Date.now()) / 1000); el.textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2) + " left"; } }
    const iv = setInterval(() => { if (document.getElementById("boostOv")) tick(); else clearInterval(iv); }, 1000);
    p.onClean(() => clearInterval(iv));
    render();
  }
  function startBoost(mult, mins) {
    boostMult = mult; boostEnd = Date.now() + mins * 60000;
    try { window.MG.setEventMult(mult); } catch (e) {}
    U.toast("⚡", mult + "× Treats active!", "For " + mins + " minutes!");
    if (boostTimer) clearTimeout(boostTimer);
    boostTimer = setTimeout(() => { boostMult = 1; boostEnd = 0; try { window.MG.setEventMult(1); } catch (e) {} U.toast("⏱️", "Boost ended", "Back to normal."); }, mins * 60000);
  }

  // ---------------- PROFILE ----------------
  const TITLES = [[0, "Newbie 🐣"], [5, "Gamer 🎮"], [15, "Pro 😎"], [30, "Veteran 🏅"], [45, "Legend 👑"], [60, "MAXWELL GOD 🌟"]];
  function openProfile() {
    const p = U.panel("profileTabOv", "🪪 My Profile", "prof-head");
    const s = window.MG.save;
    let name = ""; try { name = localStorage.getItem("mg-lb-name") || ""; } catch (e) {}
    const achN = (s.ach || []).length; let title = TITLES[0][1]; TITLES.forEach((t) => { if (achN >= t[0]) title = t[1]; });
    const pets = s.pets || []; const fav = (s.petEquipped && s.petEquipped[0]) || pets[0];
    const PETMAP = { p1: "🐱", p2: "🐈", p3: "🐭", p4: "🐹", p5: "🐰", p6: "🐸", p7: "🐶", p8: "🐷", p9: "🦊", p10: "🐺", p11: "🐻", p12: "🐼", p13: "🐨", p14: "🦁", p15: "🐯", p16: "🐙", p17: "🦖", p18: "🦄", p19: "🐲", p20: "👾", p21: "🤖", p22: "👻", p23: "🐉", p24: "🌈" };
    const favE = PETMAP[fav] || "🐱";
    p.body.innerHTML = `
      <div class="prof-card">
        <div class="prof-avatar">${favE}</div>
        <input class="sball-input prof-name" id="profName" maxlength="16" placeholder="Your name" value="${name.replace(/"/g, "&quot;")}">
        <div class="prof-title">${title}</div>
        <div class="prof-stats">
          <div>🏆 <b>${achN}</b> achievements</div>
          <div>🐾 <b>${pets.length}</b> pets</div>
          <div>✨ Ascension <b>${s.asc || 0}</b></div>
          <div>♾️ <b>${s.rebirths || 0}</b> rebirths</div>
        </div>
        <button class="btn asc-btn" id="profSave">Save Name</button>
      </div>
      <p class="ar-hint">Your title levels up as you earn more achievements! Equip a pet (Pets tab) to change your avatar.</p>`;
    p.body.querySelector("#profSave").onclick = () => { const v = p.body.querySelector("#profName").value.trim() || "Player"; try { localStorage.setItem("mg-lb-name", v); } catch (e) {} U.toast("🪪", "Saved!", "Your name is now " + v); U.tone(700, 0.08); };
  }

  U.wire("fishBtn2", openFishing);
  U.wire("boostBtn", openBoosts);
  U.wire("profBtn", openProfile);
})();
