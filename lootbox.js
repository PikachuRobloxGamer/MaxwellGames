// ===== MaxwellGames: 🎁 LOOTBOXES / Mystery Crates =====
(function () {
  const U = window.MGUI;
  const COLL = { star: "⭐", bone: "🦴", shell: "🐚", candy: "🍬", yarn: "🧶", bell: "🔔", gem: "💎", bow: "🎀", crown: "👑", trophy: "🏆", rainbow: "🌈" };
  const CRATES = [
    { id: "common", icon: "📦", name: "Common Crate", cost: 100, pool: [
      { w: 50, type: "treats", min: 40, max: 160 }, { w: 30, type: "coll", ids: ["star", "bone", "shell", "candy"] }, { w: 15, type: "treats", min: 160, max: 300 }, { w: 5, type: "boost", mult: 2, mins: 5 } ] },
    { id: "rare", icon: "🎁", name: "Rare Crate", cost: 500, pool: [
      { w: 40, type: "treats", min: 300, max: 800 }, { w: 30, type: "coll", ids: ["yarn", "bell", "gem"] }, { w: 18, type: "boost", mult: 3, mins: 8 }, { w: 10, type: "coll", ids: ["bow", "crown"] }, { w: 2, type: "treats", min: 1200, max: 2000 } ] },
    { id: "epic", icon: "💎", name: "Epic Crate", cost: 2000, pool: [
      { w: 40, type: "treats", min: 1500, max: 3500 }, { w: 25, type: "coll", ids: ["crown", "bow"] }, { w: 20, type: "boost", mult: 5, mins: 5 }, { w: 12, type: "coll", ids: ["trophy"] }, { w: 3, type: "coll", ids: ["rainbow"] } ] }
  ];
  function roll(pool) { const total = pool.reduce((a, r) => a + r.w, 0); let n = Math.random() * total; for (const r of pool) { if (n < r.w) return r; n -= r.w; } return pool[0]; }

  function open() {
    const p = U.panel("lootOv", "🎁 Mystery Crates", "loot-head");
    menu(p);
  }
  function menu(p) {
    let html = '<p class="ar-hint">Spend 🐟 to open a crate for random loot — treats, collectibles, or boosts! 🐟 <b>' + window.MG.save.treats + '</b></p><div class="loot-grid">';
    CRATES.forEach((c) => { html += '<button class="loot-crate" data-id="' + c.id + '"><span class="loot-ic">' + c.icon + '</span><span class="loot-nm">' + c.name + '</span><span class="loot-cost">' + c.cost + ' 🐟</span></button>'; });
    html += "</div>";
    p.body.innerHTML = html;
    p.body.querySelectorAll(".loot-crate").forEach((b) => b.onclick = () => openCrate(p, CRATES.find((x) => x.id === b.dataset.id)));
  }
  function openCrate(p, crate) {
    if (!window.MG.spend(crate.cost)) { U.toast("😿", "Not enough 🐟", "Need " + crate.cost + " 🐟"); return; }
    p.body.innerHTML = '<div class="loot-open"><div class="loot-box" id="lootBox">' + crate.icon + '</div><p class="ar-hint">Opening…</p></div>';
    const box = p.body.querySelector("#lootBox");
    try { U.tone(300, 0.3, "triangle", 0.08); } catch (e) {}
    setTimeout(() => {
      const r = roll(crate.pool);
      let label, icon;
      if (r.type === "treats") { const amt = r.min + Math.floor(Math.random() * (r.max - r.min)); window.MG.give(amt); label = "+" + amt + " 🐟"; icon = "🐟"; }
      else if (r.type === "coll") { const id = r.ids[Math.random() * r.ids.length | 0]; const s = window.MG.save; s.collection = s.collection || {}; s.collection[id] = (s.collection[id] || 0) + 1; window.MG.persist(); label = "Collectible: " + id; icon = COLL[id]; }
      else { try { window.MG.setEventMult(r.mult); } catch (e) {} setTimeout(() => { try { window.MG.setEventMult(1); } catch (e) {} }, r.mins * 60000); label = r.mult + "× Treats for " + r.mins + "m!"; icon = "⚡"; }
      try { window.MG.boomSound(0.12); } catch (e) {}
      p.body.innerHTML = '<div class="loot-open"><div class="loot-reward">' + icon + '</div><h3 class="loot-label">' + label + '</h3><div class="ar-res-btns"><button class="btn asc-btn" id="lootAgain">🎁 Open another</button><button class="btn" id="lootMenu">Back</button></div></div>';
      p.body.querySelector("#lootAgain").onclick = () => openCrate(p, crate);
      p.body.querySelector("#lootMenu").onclick = () => menu(p);
    }, 1100);
    box.classList.add("shake");
  }
  window.MG_LOOT = { open: open };
  U.wire("lootBtn", open);
})();
