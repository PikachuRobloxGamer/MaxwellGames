// ===== MaxwellGames: PETS — collect, multi-open, equip & follow your cursor =====
(function () {
  let AC;
  function tone(f, d, ty, v) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = ty || "sine"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} }

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
  const PETMAP = {}; PETS.forEach((p) => PETMAP[p.id] = p);
  const RCOL = { common: "#9aa0b5", rare: "#4fb3ff", epic: "#b77bff", legendary: "#ffd84a" };
  const RNAME = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };
  const RORDER = ["legendary", "epic", "rare", "common"];
  function desc(p) { return "A " + RNAME[p.r].toLowerCase() + "-tier " + p.n + " that trots along behind you when equipped. " + (p.r === "legendary" ? "Super rare — show it off!" : p.r === "epic" ? "A real head-turner!" : p.r === "rare" ? "Not bad at all!" : "A loyal little buddy."); }

  function owned() { try { const s = window.MG.save; if (!s.pets) s.pets = []; return s.pets; } catch (e) { return []; } }
  function has(id) { return owned().indexOf(id) >= 0; }
  function equipped() { try { const s = window.MG.save; if (!s.petEquipped) s.petEquipped = []; return s.petEquipped; } catch (e) { return []; } }
  function addPet(id) { const o = owned(); const isNew = o.indexOf(id) < 0; if (isNew) { o.push(id); window.MG.save.pets = o; } return isNew; }
  function persist() { try { window.MG.persist(); window.MG.checkAch(); } catch (e) {} }

  // ---------- cursor followers ----------
  const FOLLOW = (function () {
    let list = [], followers = [], raf = null; const hist = [];
    document.addEventListener("mousemove", (e) => { hist.unshift({ x: e.clientX, y: e.clientY }); if (hist.length > 600) hist.pop(); });
    document.addEventListener("touchmove", (e) => { if (e.touches[0]) { hist.unshift({ x: e.touches[0].clientX, y: e.touches[0].clientY }); if (hist.length > 600) hist.pop(); } }, { passive: true });
    function build() {
      let cont = document.getElementById("petFollowers");
      followers.forEach((f) => f.el.remove()); followers = [];
      if (!list.length) { if (cont) cont.remove(); if (raf) { cancelAnimationFrame(raf); raf = null; } return; }
      if (!cont) { cont = document.createElement("div"); cont.id = "petFollowers"; document.body.appendChild(cont); }
      list.forEach((id, i) => { const p = PETMAP[id]; if (!p) return; const el = document.createElement("div"); el.className = "pet-follower"; el.textContent = p.e; cont.appendChild(el); followers.push({ el: el, gap: (i + 1) * 7 }); });
      if (!raf) loop();
    }
    function loop() { followers.forEach((f) => { const p = hist[Math.min(hist.length - 1, f.gap)] || hist[0]; if (p) { f.el.style.left = p.x + "px"; f.el.style.top = p.y + "px"; } }); raf = requestAnimationFrame(loop); }
    function set(ids) { list = (ids || []).slice(); build(); }
    return { set: set };
  })();

  function pick(golden) {
    const w = golden ? { common: 20, rare: 40, epic: 30, legendary: 10 } : { common: 60, rare: 28, epic: 10, legendary: 2 };
    const pool = []; PETS.forEach((p) => { for (let i = 0; i < w[p.r]; i++) pool.push(p); });
    return pool[(Math.random() * pool.length) | 0];
  }

  function close() { const o = document.getElementById("petsOv"); if (o) { document.removeEventListener("keydown", o._esc); if (o._auto) clearInterval(o._auto); o.remove(); } }

  function open() {
    if (!window.MG) return; close();
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = "petsOv";
    ov.innerHTML = '<div class="arcade-box pets-box"><div class="arcade-head pets-head"><h2 style="flex:1;text-align:center;margin:0">🐾 Maxwell Pets</h2><span class="ar-treats">🐟 <b id="petsTreats">0</b></span><button class="btn ar-x" id="petsClose">✕</button></div><div class="pets-layout"><div class="pets-main" id="petsMain"></div><div class="pets-side" id="petsSide"></div></div></div>';
    document.body.appendChild(ov);
    document.getElementById("petsClose").onclick = close;
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    const esc = (e) => { if (e.key === "Escape") close(); }; document.addEventListener("keydown", esc); ov._esc = esc;
    render();
  }

  function treats() { const el = document.getElementById("petsTreats"); if (el) el.textContent = window.MG.save.treats; }

  function render() {
    const main = document.getElementById("petsMain"); if (!main) return; treats();
    const o = owned();
    main.innerHTML = `
      <div class="pets-eggs">
        <button class="btn asc-btn egg-btn" data-n="1" data-g="0">🥚 Open ×1<small>100 🐟</small></button>
        <button class="btn asc-btn egg-btn" data-n="10" data-g="0">🥚 Open ×10<small>900 🐟</small></button>
        <button class="btn asc-btn egg-btn" data-n="100" data-g="0">🥚 Open ×100<small>8,000 🐟</small></button>
        <button class="btn asc-btn egg-btn pets-golden" data-n="1" data-g="1">🌟 Golden ×1<small>500 🐟</small></button>
        <button class="btn asc-btn egg-btn pets-golden" data-n="10" data-g="1">🌟 Golden ×10<small>4,500 🐟</small></button>
      </div>
      <label class="auto-open"><span>⚙️ Auto Open</span><span class="switch"><input type="checkbox" id="autoOpen"><span class="slider"></span></span><span class="auto-note" id="autoNote"></span></label>
      <p class="pets-prog">Collected <b>${o.length}</b> / ${PETS.length} · ${bonusText()}</p>
      <div id="petsSections"></div>`;
    main.querySelectorAll(".egg-btn").forEach((b) => b.onclick = () => openMany(+b.dataset.n, b.dataset.g === "1"));
    const chk = main.querySelector("#autoOpen"); chk.checked = !!(document.getElementById("petsOv")._autoOn);
    chk.onchange = () => toggleAuto(chk.checked);
    renderSections();
    renderSide(null);
  }

  function cost(n, golden) { const each = golden ? 500 : 100; const disc = n >= 100 ? 0.8 : n >= 10 ? 0.9 : 1; return Math.round(each * n * disc); }

  function openMany(n, golden) {
    const c = cost(n, golden);
    if (!window.MG.spend(c)) { window.MG.toast("😿", "Not enough treats", "You need " + c + " 🐟 for that."); return null; }
    treats();
    const results = []; for (let i = 0; i < n; i++) { const p = pick(golden); const isNew = addPet(p.id); results.push({ p: p, isNew: isNew }); }
    persist(); treats();
    showReveal(results);
    return results;
  }

  function showReveal(results) {
    const ov = document.getElementById("petsOv"); if (!ov) return;
    const rv = document.createElement("div"); rv.className = "egg-overlay"; ov.appendChild(rv);
    const newCount = results.filter((r) => r.isNew).length;
    let grid = '<div class="reveal-grid">';
    results.forEach((r, i) => { grid += '<div class="reveal-cell" style="--rc:' + RCOL[r.p.r] + ';animation-delay:' + Math.min(1.2, i * 0.015) + 's">' + (r.isNew ? '<span class="reveal-new">NEW</span>' : '') + '<span class="reveal-e">' + r.p.e + '</span></div>'; });
    grid += '</div>';
    rv.innerHTML = '<div class="reveal-box"><h2>' + (results.length === 1 ? results[0].p.n + "!" : results.length + " eggs opened!") + '</h2><p class="ar-hint">' + newCount + ' new · ' + (results.length - newCount) + ' dupes (+' + (results.length - newCount) * 20 + ' 🐟)</p>' + grid + '<button class="btn asc-btn" id="revOk">Awesome!</button></div>';
    const dupes = results.length - newCount; if (dupes) window.MG.addTreats(dupes * 20);
    checkSetBonus(); treats();
    tone(880, 0.15); try { window.MG.boomSound(0.1); } catch (e) {}
    rv.querySelector("#revOk").onclick = () => { rv.remove(); render(); };
  }

  function toggleAuto(on) {
    const ov = document.getElementById("petsOv"); if (!ov) return;
    ov._autoOn = on; const note = document.getElementById("autoNote");
    if (ov._auto) { clearInterval(ov._auto); ov._auto = null; }
    if (on) {
      note.textContent = "Auto-opening…";
      ov._auto = setInterval(() => {
        if (window.MG.save.treats < 100) { note.textContent = "Out of treats — stopped."; const c = document.getElementById("autoOpen"); if (c) c.checked = false; ov._autoOn = false; clearInterval(ov._auto); ov._auto = null; return; }
        const r = openMany(1, false); // reveal auto-closes quickly
        const rv = ov.querySelector(".egg-overlay"); if (rv) setTimeout(() => { if (rv.parentNode) { rv.remove(); render(); const cc = document.getElementById("autoOpen"); if (cc) cc.checked = true; document.getElementById("autoNote").textContent = "Auto-opening…"; } }, 450);
      }, 850);
    } else note.textContent = "";
  }

  function renderSections() {
    const wrap = document.getElementById("petsSections"); if (!wrap) return; wrap.innerHTML = "";
    const eq = equipped();
    // Equipped section
    const es = document.createElement("div"); es.className = "pet-section";
    es.innerHTML = '<h3>⭐ Equipped (' + eq.length + ') — they follow your cursor!</h3>';
    const eg = document.createElement("div"); eg.className = "pets-grid";
    if (!eq.length) eg.innerHTML = '<p class="ar-hint" style="grid-column:1/-1">No pets equipped. Click a pet below and press "Equip Pet"!</p>';
    eq.forEach((id) => eg.appendChild(cell(PETMAP[id], true)));
    es.appendChild(eg); wrap.appendChild(es);
    // Collection by rarity
    RORDER.forEach((r) => {
      const list = PETS.filter((p) => p.r === r); const have = list.filter((p) => has(p.id)).length;
      const sec = document.createElement("div"); sec.className = "pet-section";
      sec.innerHTML = '<h3 style="color:' + RCOL[r] + '">' + RNAME[r] + ' (' + have + '/' + list.length + ')</h3>';
      const g = document.createElement("div"); g.className = "pets-grid";
      list.forEach((p) => g.appendChild(cell(p, false)));
      sec.appendChild(g); wrap.appendChild(sec);
    });
  }

  function cell(p, isEquipRow) {
    const got = has(p.id); const d = document.createElement("div");
    d.className = "pet-cell" + (got ? " got" : "") + (equipped().indexOf(p.id) >= 0 ? " equipped" : ""); d.style.setProperty("--rc", RCOL[p.r]);
    d.innerHTML = '<span class="pet-emoji">' + (got ? p.e : "❓") + '</span><span class="pet-name">' + (got ? p.n : "???") + '</span>';
    d.onclick = () => renderSide(p);
    return d;
  }

  function renderSide(p) {
    const side = document.getElementById("petsSide"); if (!side) return;
    if (!p) { side.innerHTML = '<div class="pet-profile empty"><p>👈 Click any pet to see its card, then equip it to make it follow your cursor!</p></div>'; return; }
    const got = has(p.id); const eq = equipped().indexOf(p.id) >= 0;
    side.innerHTML =
      '<div class="pet-profile" style="--rc:' + RCOL[p.r] + '">' +
      '<div class="pp-emoji">' + (got ? p.e : "❓") + '</div>' +
      '<div class="pp-name">' + (got ? p.n : "???") + '</div>' +
      '<div class="pp-rar">' + RNAME[p.r] + '</div>' +
      '<p class="pp-desc">' + (got ? desc(p) : "You haven\'t unlocked this pet yet. Hatch more eggs!") + '</p>' +
      '<div class="pp-btns">' +
      '<button class="btn asc-btn" id="ppEquip"' + (!got || eq ? " disabled" : "") + '>Equip Pet</button>' +
      '<button class="btn" id="ppUnequip"' + (!eq ? " disabled" : "") + '>Unequip Pet</button>' +
      '</div></div>';
    const e = side.querySelector("#ppEquip"); if (e) e.onclick = () => { const q = equipped(); if (q.indexOf(p.id) < 0) { q.push(p.id); persist(); FOLLOW.set(q); tone(700, 0.08); window.MG.toast(p.e, p.n + " equipped!", "It now follows your cursor."); renderSections(); renderSide(p); } };
    const u = side.querySelector("#ppUnequip"); if (u) u.onclick = () => { let q = equipped(); q = q.filter((x) => x !== p.id); window.MG.save.petEquipped = q; persist(); FOLLOW.set(q); tone(300, 0.08); renderSections(); renderSide(p); };
  }

  function bonusText() {
    const done = RORDER.filter((r) => PETS.filter((p) => p.r === r).every((p) => has(p.id)));
    if (done.length === 4) return "🏆 FULL DEX COMPLETE!";
    return "complete rarity sets for big 🐟 bonuses!";
  }
  function checkSetBonus() {
    const s = window.MG.save; if (!s.petBonus) s.petBonus = [];
    const rewards = { common: 100, rare: 250, epic: 500, legendary: 1500, full: 5000 };
    ["common", "rare", "epic", "legendary"].forEach((r) => { if (s.petBonus.indexOf(r) < 0 && PETS.filter((p) => p.r === r).every((p) => has(p.id))) { s.petBonus.push(r); window.MG.addTreats(rewards[r]); window.MG.toast("🏆", RNAME[r] + " set complete!", "+" + rewards[r] + " 🐟 bonus!"); } });
    if (s.petBonus.indexOf("full") < 0 && PETS.every((p) => has(p.id))) { s.petBonus.push("full"); window.MG.addTreats(rewards.full); window.MG.toast("🌈", "FULL DEX COMPLETE!", "+" + rewards.full + " 🐟!!!"); }
    window.MG.persist();
  }

  // init followers on load (if any equipped from a previous visit)
  function initFollow() { try { if (window.MG && window.MG.save) FOLLOW.set(window.MG.save.petEquipped || []); } catch (e) {} }
  window.MG_PETS = { open: open, close: close };
  function wire() { const b = document.getElementById("petsBtn"); if (b) b.onclick = open; initFollow(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
