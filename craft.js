// ===== MaxwellGames: 🔨 CRAFTING — spend your collectibles =====
(function () {
  const U = window.MGUI;
  // collectible metadata (mirrors coreplay.js)
  const ITEM = { star: "⭐", bone: "🦴", shell: "🐚", candy: "🍬", yarn: "🧶", bell: "🔔", gem: "💎", bow: "🎀", crown: "👑", trophy: "🏆", rainbow: "🌈" };
  const RECIPES = [
    { id: "bundle", icon: "🎀", name: "Treat Bundle", inputs: { star: 2, bone: 2 }, reward: { treats: 200 }, desc: "+200 🐟" },
    { id: "polish", icon: "💎", name: "Gem Polish", inputs: { gem: 1, shell: 2 }, reward: { treats: 150 }, desc: "+150 🐟" },
    { id: "charm", icon: "🧶", name: "Lucky Charm", inputs: { yarn: 2, bell: 1 }, reward: { treats: 250 }, desc: "+250 🐟" },
    { id: "boost", icon: "🧪", name: "Mega Boost", inputs: { gem: 2, candy: 2 }, cost: 50, reward: { boost: [3, 10] }, desc: "3× treats for 10 min" },
    { id: "crown", icon: "👑", name: "Royal Decree", inputs: { crown: 1, trophy: 1 }, reward: { treats: 600, flag: "crafter" }, desc: "+600 🐟 & a crafter badge" },
    { id: "relic", icon: "🌈", name: "Rainbow Relic", inputs: { rainbow: 1, bow: 1 }, reward: { treats: 1200, flag: "rainbowcraft" }, desc: "+1200 🐟 (super rare!)" }
  ];
  function col() { const s = window.MG.save; s.collection = s.collection || {}; return s.collection; }
  function can(r) { const c = col(); for (const k in r.inputs) if ((c[k] || 0) < r.inputs[k]) return false; if (r.cost && window.MG.save.treats < r.cost) return false; return true; }

  function open() {
    const p = U.panel("craftOv", "🔨 Crafting", "craft-head");
    function render() {
      let html = '<p class="ar-hint">Turn the collectibles you grab on screen into rewards! Grab items by playing, then craft here. 🐟 <b>' + window.MG.save.treats + '</b></p><div class="craft-list">';
      RECIPES.forEach((r) => {
        const ok = can(r);
        let ins = Object.keys(r.inputs).map((k) => { const have = col()[k] || 0, need = r.inputs[k]; return '<span class="craft-in' + (have >= need ? " ok" : " no") + '">' + ITEM[k] + " " + have + "/" + need + "</span>"; }).join(" ");
        if (r.cost) ins += ' <span class="craft-in' + (window.MG.save.treats >= r.cost ? " ok" : " no") + '">🐟 ' + r.cost + "</span>";
        html += '<div class="craft-card"><div class="craft-top"><b>' + r.icon + " " + r.name + '</b><span class="craft-reward">' + r.desc + '</span></div><div class="craft-ins">' + ins + '</div><button class="btn asc-btn craft-go' + (ok ? "" : " dim") + '" data-id="' + r.id + '"' + (ok ? "" : " disabled") + '>Craft</button></div>';
      });
      html += "</div>";
      p.body.innerHTML = html;
      p.body.querySelectorAll(".craft-go").forEach((b) => b.onclick = () => craft(RECIPES.find((x) => x.id === b.dataset.id), render));
    }
    render();
  }

  function craft(r, render) {
    if (!can(r)) { U.toast("😿", "Can't craft yet", "Collect more items first!"); return; }
    const c = col(); for (const k in r.inputs) c[k] -= r.inputs[k];
    if (r.cost) window.MG.spend(r.cost);
    const rw = r.reward;
    if (rw.treats) window.MG.give(rw.treats);
    if (rw.flag) { try { window.MG.flag(rw.flag); } catch (e) {} }
    if (rw.boost) { const [mult, mins] = rw.boost; try { window.MG.setEventMult(mult); } catch (e) {} U.toast("🧪", mult + "× Treats!", "Active for " + mins + " minutes!"); setTimeout(() => { try { window.MG.setEventMult(1); } catch (e) {} }, mins * 60000); }
    window.MG.persist();
    U.toast(r.icon, "Crafted " + r.name + "!", r.desc);
    try { window.MG.boomSound(0.1); } catch (e) {}
    render();
  }
  window.MG_CRAFT = { open: open };
  U.wire("craftBtn", open);
})();
