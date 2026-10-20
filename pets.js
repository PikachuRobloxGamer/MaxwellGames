// ===== MaxwellGames: PETS — collect creatures by hatching eggs =====
(function () {
  let AC;
  function tone(f, d, ty, v) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = ty || "sine"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v || 0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} }

  const PETS = [
    { id: "p1", e: "🐱", n: "Classic Cat", r: "common" }, { id: "p2", e: "🐈", n: "Tabby", r: "common" },
    { id: "p3", e: "🐭", n: "Mouse", r: "common" }, { id: "p4", e: "🐹", n: "Hamster", r: "common" },
    { id: "p5", e: "🐰", n: "Bunny", r: "common" }, { id: "p6", e: "🐸", n: "Froggo", r: "common" },
    { id: "p7", e: "🐶", n: "Puppy", r: "common" }, { id: "p8", e: "🐷", n: "Piggy", r: "common" },
    { id: "p9", e: "🦊", n: "Foxxo", r: "rare" }, { id: "p10", e: "🐺", n: "Wolf", r: "rare" },
    { id: "p11", e: "🐻", n: "Bear", r: "rare" }, { id: "p12", e: "🐼", n: "Panda", r: "rare" },
    { id: "p13", e: "🐨", n: "Koala", r: "rare" }, { id: "p14", e: "🦁", n: "Lion", r: "rare" },
    { id: "p15", e: "🐯", n: "Tiger", r: "rare" }, { id: "p16", e: "🐙", n: "Octo", r: "epic" },
    { id: "p17", e: "🦖", n: "Rexy", r: "epic" }, { id: "p18", e: "🦄", n: "Unicorn", r: "epic" },
    { id: "p19", e: "🐲", n: "Dragon", r: "epic" }, { id: "p20", e: "👾", n: "Alien", r: "epic" },
    { id: "p21", e: "🤖", n: "Robo-Max", r: "legendary" }, { id: "p22", e: "👻", n: "Ghost Max", r: "legendary" },
    { id: "p23", e: "🐉", n: "Elder Dragon", r: "legendary" }, { id: "p24", e: "🌈", n: "Rainbow Max", r: "legendary" }
  ];
  const RCOL = { common: "#9aa0b5", rare: "#4fb3ff", epic: "#b77bff", legendary: "#ffd84a" };
  const RNAME = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };

  function owned() { try { const s = window.MG.save; if (!s.pets) s.pets = []; return s.pets; } catch (e) { return []; } }
  function has(id) { return owned().indexOf(id) >= 0; }
  function addPet(id) { const o = owned(); if (o.indexOf(id) < 0) { o.push(id); window.MG.save.pets = o; window.MG.persist(); try { window.MG.checkAch(); } catch (e) {} return true; } return false; }

  function pick(golden) {
    const w = golden ? { common: 20, rare: 40, epic: 30, legendary: 10 } : { common: 60, rare: 28, epic: 10, legendary: 2 };
    const pool = []; PETS.forEach((p) => { for (let i = 0; i < w[p.r]; i++) pool.push(p); });
    return pool[(Math.random() * pool.length) | 0];
  }

  function close() { const o = document.getElementById("petsOv"); if (o) { document.removeEventListener("keydown", o._esc); o.remove(); } }

  function open() {
    if (!window.MG) return; close();
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = "petsOv";
    ov.innerHTML = '<div class="arcade-box pets-box"><div class="arcade-head pets-head"><h2>🐾 Maxwell Pets</h2><span class="ar-treats">🐟 <b id="petsTreats">0</b></span><button class="btn ar-x" id="petsClose">✕</button></div><div class="arcade-body pets-body" id="petsBody"></div></div>';
    document.body.appendChild(ov);
    document.getElementById("petsClose").onclick = close;
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    const esc = (e) => { if (e.key === "Escape") close(); }; document.addEventListener("keydown", esc); ov._esc = esc;
    render();
  }

  function treats() { const el = document.getElementById("petsTreats"); if (el) el.textContent = window.MG.save.treats; }

  function render() {
    const body = document.getElementById("petsBody"); if (!body) return;
    treats();
    const o = owned(); const total = PETS.length;
    body.innerHTML = `
      <div class="pets-eggs">
        <button class="btn asc-btn" id="egg1">🥚 Hatch Egg<small>100 🐟</small></button>
        <button class="btn asc-btn pets-golden" id="egg2">🌟 Golden Egg<small>500 🐟</small></button>
      </div>
      <p class="pets-prog">Collected <b>${o.length}</b> / ${total} pets — ${bonusText()}</p>
      <div class="pets-grid" id="petsGrid"></div>`;
    const grid = body.querySelector("#petsGrid");
    PETS.forEach((p) => {
      const got = has(p.id);
      const d = document.createElement("div"); d.className = "pet-cell" + (got ? " got" : ""); d.style.setProperty("--rc", RCOL[p.r]);
      d.innerHTML = `<span class="pet-emoji">${got ? p.e : "❓"}</span><span class="pet-name">${got ? p.n : "???"}</span><span class="pet-rar">${RNAME[p.r]}</span>`;
      grid.appendChild(d);
    });
    document.getElementById("egg1").onclick = () => hatch(false);
    document.getElementById("egg2").onclick = () => hatch(true);
  }

  function bonusText() {
    const o = owned(); const rar = ["common", "rare", "epic", "legendary"];
    const done = rar.filter((r) => PETS.filter((p) => p.r === r).every((p) => has(p.id)));
    if (done.length === 4) return "🏆 FULL DEX COMPLETE!";
    const next = rar.find((r) => !PETS.filter((p) => p.r === r).every((p) => has(p.id)));
    const have = PETS.filter((p) => p.r === next && has(p.id)).length, need = PETS.filter((p) => p.r === next).length;
    return `complete all ${RNAME[next]} (${have}/${need}) for a treat bonus!`;
  }

  function checkSetBonus() {
    const s = window.MG.save; if (!s.petBonus) s.petBonus = [];
    const rewards = { common: 100, rare: 250, epic: 500, legendary: 1500, full: 5000 };
    const rar = ["common", "rare", "epic", "legendary"];
    rar.forEach((r) => { if (s.petBonus.indexOf(r) < 0 && PETS.filter((p) => p.r === r).every((p) => has(p.id))) { s.petBonus.push(r); window.MG.addTreats(rewards[r]); window.MG.toast("🏆", RNAME[r] + " set complete!", "+" + rewards[r] + " 🐟 bonus!"); } });
    if (s.petBonus.indexOf("full") < 0 && PETS.every((p) => has(p.id))) { s.petBonus.push("full"); window.MG.addTreats(rewards.full); window.MG.toast("🌈", "FULL DEX COMPLETE!", "+" + rewards.full + " 🐟!!!"); }
    window.MG.persist();
  }

  function hatch(golden) {
    if (!window.MG.spend(golden ? 500 : 100)) { window.MG.toast("😿", "Not enough treats", "You need " + (golden ? 500 : 100) + " 🐟."); return; }
    treats();
    const pet = pick(golden);
    const ov = document.createElement("div"); ov.className = "egg-overlay"; ov.innerHTML = `<div class="egg-stage"><div class="egg" id="eggShake">🥚</div></div>`;
    document.getElementById("petsOv").appendChild(ov);
    const egg = ov.querySelector("#eggShake");
    let shakes = 0; const si = setInterval(() => { shakes++; egg.style.transform = "rotate(" + (shakes % 2 ? 12 : -12) + "deg)"; tone(300 + shakes * 20, 0.05); if (shakes >= 6) { clearInterval(si); reveal(); } }, 240);
    function reveal() {
      const isNew = !has(pet.id);
      addPet(pet.id);
      egg.style.transform = ""; tone(880, 0.2); try { window.MG.boomSound(0.1); } catch (e) {}
      ov.querySelector(".egg-stage").innerHTML = `<div class="egg-reveal" style="--rc:${RCOL[pet.r]}"><div class="egg-rays"></div><span class="egg-pet">${pet.e}</span><b class="egg-pname">${pet.n}</b><span class="egg-prar">${RNAME[pet.r]}${isNew ? " ✨ NEW!" : " (duplicate +20 🐟)"}</span><button class="btn asc-btn" id="eggOk">Nice!</button></div>`;
      if (!isNew) { window.MG.addTreats(20); }
      checkSetBonus(); treats();
      ov.querySelector("#eggOk").onclick = () => { ov.remove(); render(); };
    }
  }

  window.MG_PETS = { open, close };
  function wire() { const b = document.getElementById("petsBtn"); if (b) b.onclick = open; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
