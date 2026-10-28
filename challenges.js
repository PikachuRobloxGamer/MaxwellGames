// ===== MaxwellGames: 🏅 Daily & Weekly Challenges — rotating goals, treat rewards, streak =====
(function () {
  var U = window.MGUI;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function save() { try { return window.MG.save; } catch (e) { return {}; } }

  // ---- cumulative "treats earned" tracker (survives spending) ----
  function earnedTotal() { return parseInt(ls("mg-earned-total") || "0", 10) || 0; }
  (function trackEarned() {
    var last = -1;
    setInterval(function () {
      var t = 0; try { t = save().treats || 0; } catch (e) {}
      if (last < 0) { last = t; return; }
      if (t > last) { ls("mg-earned-total", String(earnedTotal() + (t - last))); }
      last = t;
    }, 500);
  })();

  // ---- stat getters ----
  function stat(k) {
    var s = save();
    if (k === "opened") return (s.opened || []).length;
    if (k === "arcade") return s.arcadePlays || 0;
    if (k === "bosses") return (s.bossBeaten || []).length;
    if (k === "earned") return earnedTotal();
    if (k === "slots") return s.slotPlays || 0;
    if (k === "spins") return s.spins || 0;
    return 0;
  }
  var STAT_KEYS = ["opened", "arcade", "bosses", "earned", "slots", "spins"];

  var DAILY = [
    { id: "open3", label: "Open 3 different games", stat: "opened", target: 3, reward: 40 },
    { id: "arcade5", label: "Play 5 arcade rounds", stat: "arcade", target: 5, reward: 40 },
    { id: "earn150", label: "Earn 150 treats", stat: "earned", target: 150, reward: 50 },
    { id: "boss1", label: "Beat a boss", stat: "bosses", target: 1, reward: 60 },
    { id: "earn300", label: "Earn 300 treats", stat: "earned", target: 300, reward: 70 },
    { id: "arcade10", label: "Play 10 arcade rounds", stat: "arcade", target: 10, reward: 60 },
    { id: "open5", label: "Open 5 games", stat: "opened", target: 5, reward: 50 },
    { id: "slots3", label: "Spin the slots 3 times", stat: "slots", target: 3, reward: 40 }
  ];
  var WEEKLY = [
    { id: "wearn2000", label: "Earn 2,000 treats this week", stat: "earned", target: 2000, reward: 300 },
    { id: "wboss5", label: "Beat 5 bosses this week", stat: "bosses", target: 5, reward: 250 },
    { id: "warcade40", label: "Play 40 arcade rounds this week", stat: "arcade", target: 40, reward: 250 },
    { id: "wopen12", label: "Open 12 games this week", stat: "opened", target: 12, reward: 200 }
  ];

  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function seedFrom(str) { var h = 0; for (var i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }
  function pick(pool, n, seedStr) { var r = mulberry(seedFrom(seedStr)), a = pool.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a.slice(0, n); }

  function dayKey() { return new Date().toDateString(); }
  function weekKey() { var d = new Date(); var on = new Date(d.getFullYear(), 0, 1); var wk = Math.ceil((((d - on) / 86400000) + on.getDay() + 1) / 7); return d.getFullYear() + "-W" + wk; }

  // baseline snapshot per period, so progress counts only what you do during it
  function baseline(prefix, key) {
    var k = "mg-ch-base-" + prefix + "-" + key;
    var raw = ls(k);
    if (raw) { try { return JSON.parse(raw); } catch (e) {} }
    var snap = {}; STAT_KEYS.forEach(function (s) { snap[s] = stat(s); }); ls(k, JSON.stringify(snap)); return snap;
  }
  function progress(ch, base) { return Math.max(0, stat(ch.stat) - (base[ch.stat] || 0)); }

  function claimedList(prefix, key) { try { return JSON.parse(ls("mg-ch-claim-" + prefix + "-" + key) || "[]"); } catch (e) { return []; } }
  function addClaim(prefix, key, id) { var a = claimedList(prefix, key); if (a.indexOf(id) < 0) a.push(id); ls("mg-ch-claim-" + prefix + "-" + key, JSON.stringify(a)); }

  function bumpStreak() {
    var today = dayKey(), last = ls("mg-ch-lastday");
    if (last === today) return;
    var y = new Date(); y.setDate(y.getDate() - 1);
    var streak = parseInt(ls("mg-ch-streak") || "0", 10) || 0;
    streak = (last === y.toDateString()) ? streak + 1 : 1;
    ls("mg-ch-streak", String(streak)); ls("mg-ch-lastday", today);
  }

  function open() {
    var p = U.panel("challOv", "🏅 Challenges", "chall-head");
    var dkey = dayKey(), wkey = weekKey();
    var daily = pick(DAILY, 3, "d" + dkey), weekly = pick(WEEKLY, 2, "w" + wkey);
    var dBase = baseline("d", dkey), wBase = baseline("w", wkey);

    function row(ch, prefix, key, base) {
      var prog = Math.min(ch.target, progress(ch, base)), done = prog >= ch.target;
      var claimed = claimedList(prefix, key).indexOf(ch.id) >= 0;
      var pct = Math.round(prog / ch.target * 100);
      var btn = claimed ? '<span class="chall-done">✅ Claimed</span>'
        : done ? '<button class="btn asc-btn chall-claim" data-p="' + prefix + '" data-k="' + key + '" data-id="' + ch.id + '" data-rw="' + ch.reward + '">Claim ' + ch.reward + ' 🐟</button>'
          : '<span class="chall-rw">' + ch.reward + ' 🐟</span>';
      return '<div class="chall-item"><div class="chall-top"><span class="chall-lbl">' + ch.label + '</span>' + btn + '</div>'
        + '<div class="chall-bar"><span style="width:' + pct + '%"></span></div><div class="chall-prog">' + prog + ' / ' + ch.target + '</div></div>';
    }
    var streak = parseInt(ls("mg-ch-streak") || "0", 10) || 0;
    var html = '<p class="ar-hint">Finish challenges for 🐟 treats! They refresh every day. Keep a daily streak going! 🔥</p>';
    html += '<div class="chall-streak">🔥 Daily streak: <b>' + streak + '</b> day' + (streak === 1 ? "" : "s") + '</div>';
    html += '<h3 class="chall-h">📅 Today</h3>' + daily.map(function (c) { return row(c, "d", dkey, dBase); }).join("");
    html += '<h3 class="chall-h">🗓️ This Week</h3>' + weekly.map(function (c) { return row(c, "w", wkey, wBase); }).join("");
    p.body.innerHTML = html;
    p.body.querySelectorAll(".chall-claim").forEach(function (b) {
      b.onclick = function () {
        var rw = +b.dataset.rw;
        try { window.MG.give(rw); } catch (e) {}
        addClaim(b.dataset.p, b.dataset.k, b.dataset.id);
        if (b.dataset.p === "d") bumpStreak();
        U.toast && U.toast("🏅", "Challenge complete!", "+" + rw + " 🐟");
        open(); // re-render in place
      };
    });
  }

  function css() {
    if (document.getElementById("mg-chall-css")) return;
    var s = document.createElement("style"); s.id = "mg-chall-css";
    s.textContent = ".chall-streak{text-align:center;font-weight:800;background:var(--panel-hover);border-radius:12px;padding:8px;margin-bottom:6px}"
      + ".chall-h{margin:14px 0 6px;font-size:1rem}"
      + ".chall-item{background:var(--panel-hover);border-radius:12px;padding:10px 12px;margin-bottom:8px}"
      + ".chall-top{display:flex;align-items:center;justify-content:space-between;gap:10px}"
      + ".chall-lbl{font-weight:700;font-size:.9rem}.chall-rw{font-size:.8rem;color:var(--muted);white-space:nowrap}"
      + ".chall-done{color:#3ee08f;font-weight:800;font-size:.85rem;white-space:nowrap}"
      + ".chall-claim{padding:6px 12px;font-size:.85rem;white-space:nowrap}"
      + ".chall-bar{height:9px;background:#0d1020;border-radius:6px;overflow:hidden;margin:7px 0 3px}"
      + ".chall-bar>span{display:block;height:100%;background:linear-gradient(90deg,#6c5ce7,#3ee08f);transition:width .4s}"
      + ".chall-prog{font-size:.72rem;color:var(--muted);text-align:right}";
    document.head.appendChild(s);
  }
  css();
  if (U && U.wire) U.wire("challBtn", open);
  window.MG_CHALLENGES = { open: open };
})();
