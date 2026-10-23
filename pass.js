// ===== MaxwellGames: 🎫 BATTLE PASS — reward track (fills as you earn XP) =====
(function () {
  const U = window.MGUI;
  const TIERS = [
    { xp: 50, icon: "🐟", label: "50 🐟", reward: { treats: 50 } },
    { xp: 150, icon: "🐟", label: "100 🐟", reward: { treats: 100 } },
    { xp: 300, icon: "⚡", label: "2× Boost 5m", reward: { boost: [2, 5] } },
    { xp: 600, icon: "💰", label: "250 🐟", reward: { treats: 250 } },
    { xp: 1000, icon: "🏅", label: "Pass Badge", reward: { treats: 150, flag: "pass1" } },
    { xp: 1600, icon: "💰", label: "500 🐟", reward: { treats: 500 } },
    { xp: 2500, icon: "🔥", label: "3× Boost 10m", reward: { boost: [3, 10] } },
    { xp: 4000, icon: "💎", label: "1000 🐟", reward: { treats: 1000 } },
    { xp: 6000, icon: "👑", label: "Royal Badge", reward: { treats: 500, flag: "passroyal" } },
    { xp: 9000, icon: "🏆", label: "2500 🐟", reward: { treats: 2500, flag: "passmax" } }
  ];
  function claimed() { const s = window.MG.save; s.passClaimed = s.passClaimed || []; return s.passClaimed; }

  function open() {
    const p = U.panel("passOv", "🎫 Battle Pass", "pass-head");
    function render() {
      const xp = window.MG.save.xp || 0;
      const nextIdx = TIERS.findIndex((t, i) => xp < t.xp);
      const prevXp = nextIdx <= 0 ? 0 : TIERS[nextIdx - 1].xp;
      const next = nextIdx < 0 ? null : TIERS[nextIdx];
      const pct = next ? Math.min(100, (xp - prevXp) / (next.xp - prevXp) * 100) : 100;
      let html = '<p class="ar-hint">Earn <b>XP</b> just by playing — every 🐟 you earn is XP! Claim rewards as you climb. &nbsp;<b>' + xp + ' XP</b></p>';
      html += '<div class="pass-prog"><div class="pass-prog-fill" style="width:' + pct + '%"></div></div>';
      html += next ? '<p class="ar-hint">' + (next.xp - xp) + ' XP to next reward (' + next.label + ')</p>' : '<p class="ar-hint">🏆 Max tier reached — you legend!</p>';
      html += '<div class="pass-track">';
      TIERS.forEach((t, i) => { const got = xp >= t.xp, done = claimed().includes(i); html += '<div class="pass-tier' + (got ? " reached" : "") + (done ? " claimed" : "") + '"><span class="pass-ic">' + t.icon + '</span><span class="pass-lbl">' + t.label + '</span><span class="pass-xp">' + t.xp + ' XP</span>' + (done ? '<span class="pass-check">✓ Claimed</span>' : got ? '<button class="btn asc-btn pass-claim" data-i="' + i + '">Claim</button>' : '<span class="pass-lock">🔒</span>') + '</div>'; });
      html += "</div>";
      p.body.innerHTML = html;
      p.body.querySelectorAll(".pass-claim").forEach((b) => b.onclick = () => claim(+b.dataset.i, render));
    }
    render();
  }

  function claim(i, render) {
    if (claimed().includes(i)) return;
    if ((window.MG.save.xp || 0) < TIERS[i].xp) return;
    claimed().push(i);
    const rw = TIERS[i].reward;
    if (rw.treats) window.MG.give(rw.treats);
    if (rw.flag) { try { window.MG.flag(rw.flag); } catch (e) {} }
    if (rw.boost) { const [m, mins] = rw.boost; try { window.MG.setEventMult(m); } catch (e) {} U.toast("⚡", m + "× Treats!", "For " + mins + " minutes!"); setTimeout(() => { try { window.MG.setEventMult(1); } catch (e) {} }, mins * 60000); }
    window.MG.persist();
    U.toast("🎫", "Reward claimed!", TIERS[i].label);
    try { window.MG.boomSound(0.1); } catch (e) {}
    render();
  }
  window.MG_PASS = { open: open };
  U.wire("passBtn", open);
})();
