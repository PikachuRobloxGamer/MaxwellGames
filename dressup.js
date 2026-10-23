// ===== MaxwellGames: 👕 DRESS-UP — outfits that show on Maxwell everywhere =====
(function () {
  const U = window.MGUI;
  const SLOTS = {
    hat: [{ id: "none", e: "", cost: 0 }, { id: "cap", e: "🧢", cost: 0 }, { id: "top", e: "🎩", cost: 200 }, { id: "grad", e: "🎓", cost: 400 }, { id: "crown", e: "👑", cost: 1000 }],
    face: [{ id: "none", e: "", cost: 0 }, { id: "cool", e: "😎", cost: 0 }, { id: "shades", e: "🕶️", cost: 150 }, { id: "nerd", e: "🤓", cost: 300 }, { id: "disguise", e: "🥸", cost: 600 }],
    neck: [{ id: "none", e: "", cost: 0 }, { id: "bow", e: "🎀", cost: 100 }, { id: "scarf", e: "🧣", cost: 250 }, { id: "beads", e: "📿", cost: 500 }]
  };
  const LABEL = { hat: "🎩 Hat", face: "🕶️ Face", neck: "🧣 Neck" };
  function O() { const s = window.MG.save; s.outfit = s.outfit || { hat: "none", face: "none", neck: "none" }; s.outfitOwned = s.outfitOwned || []; return s; }
  function find(slot, id) { return SLOTS[slot].find((x) => x.id === id) || SLOTS[slot][0]; }

  function apply() {
    const logo = document.querySelector(".logo"), img = document.querySelector(".logo-img"); if (!logo || !img) return;
    let ov = document.getElementById("mwOutfit"); if (!ov) { ov = document.createElement("span"); ov.id = "mwOutfit"; ov.className = "mw-outfit"; logo.appendChild(ov); }
    ov.style.left = img.offsetLeft + "px"; ov.style.top = img.offsetTop + "px"; ov.style.width = img.offsetWidth + "px"; ov.style.height = img.offsetHeight + "px";
    const s = O().outfit;
    ov.innerHTML = '<span class="mw-hat">' + find("hat", s.hat).e + '</span><span class="mw-face">' + find("face", s.face).e + '</span><span class="mw-neck">' + find("neck", s.neck).e + '</span>';
  }

  function open() {
    const p = U.panel("dressOv", "👕 Dress Up Maxwell", "dress-head");
    function render() {
      const s = O();
      let html = '<div class="dress-preview" id="dressPrev"></div><p class="ar-hint">Unlock &amp; equip outfits — they show on Maxwell across the whole site! 🐟 <b>' + window.MG.save.treats + '</b></p>';
      ["hat", "face", "neck"].forEach((slot) => {
        html += '<div class="dress-slot"><b>' + LABEL[slot] + '</b><div class="dress-row">';
        SLOTS[slot].forEach((it) => { const owned = it.cost === 0 || s.outfitOwned.includes(slot + ":" + it.id); const on = s.outfit[slot] === it.id; html += '<button class="dress-item' + (on ? " on" : "") + (owned ? "" : " locked") + '" data-slot="' + slot + '" data-id="' + it.id + '">' + (it.e || "🚫") + (owned ? "" : '<small>' + it.cost + '</small>') + '</button>'; });
        html += '</div></div>';
      });
      p.body.innerHTML = html; renderPrev();
      p.body.querySelectorAll(".dress-item").forEach((b) => b.onclick = () => pick(b.dataset.slot, b.dataset.id, render));
    }
    function renderPrev() { const prev = document.getElementById("dressPrev"); if (!prev) return; const s = O().outfit; const img = (document.querySelector(".logo-img") || {}).src || "maxwell.png"; prev.innerHTML = '<span class="dp-hat">' + find("hat", s.hat).e + '</span><img src="' + img + '" class="dp-cat" alt="Maxwell"><span class="dp-face">' + find("face", s.face).e + '</span><span class="dp-neck">' + find("neck", s.neck).e + '</span>'; }
    function pick(slot, id, render) { const s = O(); const it = find(slot, id); const key = slot + ":" + id; const owned = it.cost === 0 || s.outfitOwned.includes(key); if (!owned) { if (window.MG.spend(it.cost)) { s.outfitOwned.push(key); U.toast("🔓", "Unlocked!", it.e); } else { U.toast("😿", "Not enough 🐟", "Need " + it.cost + " 🐟"); return; } } s.outfit[slot] = id; window.MG.persist(); U.tone(560, 0.05); apply(); render(); }
    render();
  }

  function init() { apply(); const b = document.getElementById("dressBtn"); if (b) b.onclick = open; window.addEventListener("resize", apply); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.MG_DRESS = { open: open, apply: apply };
})();
