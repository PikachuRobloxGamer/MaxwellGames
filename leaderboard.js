// ===== MaxwellGames: LEADERBOARD — global ranks via Firebase REST (local fallback) =====
(function () {
  function dbURL() { try { const f = window.MG_FIREBASE_CONFIG; return f && f.databaseURL ? f.databaseURL.replace(/\/$/, "") : null; } catch (e) { return null; } }
  function myId() { let id; try { id = localStorage.getItem("mg-lb-id"); } catch (e) {} if (!id) { id = "u" + Math.random().toString(36).slice(2, 10); try { localStorage.setItem("mg-lb-id", id); } catch (e) {} } return id; }
  function myName() { try { return localStorage.getItem("mg-lb-name") || ""; } catch (e) { return ""; } }
  function setName(n) { try { localStorage.setItem("mg-lb-name", n); } catch (e) {} }

  function myStats() {
    const s = (window.MG && window.MG.save) || {};
    const ab = s.arcadeBest || {};
    let abSum = 0; for (const k in ab) abSum += ab[k] || 0;
    const level = window.MG ? (function () { try { return JSON.parse(JSON.stringify(s)) && Math.floor(Math.sqrt((s.xp || 0) / 15)) + 1; } catch (e) { return 1; } })() : 1;
    const score = (level * 100) + ((s.rebirths || 0) * 5000) + (s.treats || 0) + abSum + ((s.ach || []).length * 50) + ((s.asc || 0) * 300);
    return { score: score, level: level, treats: s.treats || 0, rebirths: s.rebirths || 0, asc: s.asc || 0, ach: (s.ach || []).length };
  }

  function fetchJSON(url, opts, ms) {
    return new Promise(function (resolve, reject) {
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const to = setTimeout(function () { if (ctrl) ctrl.abort(); reject(new Error("timeout")); }, ms || 6000);
      fetch(url, Object.assign({ signal: ctrl ? ctrl.signal : undefined }, opts || {})).then(function (r) { clearTimeout(to); return r.ok ? r.json() : Promise.reject(new Error("http " + r.status)); }).then(resolve).catch(function (e) { clearTimeout(to); reject(e); });
    });
  }

  function submit() {
    const name = (myName() || "Player").slice(0, 16);
    const st = myStats();
    const entry = { name: name, score: st.score, level: st.level, rebirths: st.rebirths, asc: st.asc, at: Date.now() };
    try { localStorage.setItem("mg-lb-local", JSON.stringify(entry)); } catch (e) {}
    const url = dbURL();
    if (!url) return Promise.resolve({ ok: false, reason: "nolb" });
    return fetchJSON(url + "/leaderboard/" + myId() + ".json", { method: "PUT", body: JSON.stringify(entry) }).then(function () { return { ok: true }; }).catch(function () { return { ok: false, reason: "net" }; });
  }

  function load() {
    const url = dbURL();
    if (!url) return Promise.resolve(null);
    return fetchJSON(url + "/leaderboard.json").then(function (obj) {
      if (!obj) return [];
      return Object.keys(obj).map(function (k) { return obj[k]; }).filter(function (e) { return e && typeof e.score === "number"; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 30);
    }).catch(function () { return null; });
  }

  function close() { const o = document.getElementById("lbOv"); if (o) { document.removeEventListener("keydown", o._esc); o.remove(); } }

  function open() {
    close();
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = "lbOv";
    ov.innerHTML = '<div class="arcade-box lb-box"><div class="arcade-head lb-head"><h2>🏆 Leaderboard</h2><button class="btn ar-x" id="lbClose">✕</button></div><div class="arcade-body lb-body" id="lbBody"></div></div>';
    document.body.appendChild(ov);
    document.getElementById("lbClose").onclick = close;
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    const esc = function (e) { if (e.key === "Escape") close(); }; document.addEventListener("keydown", esc); ov._esc = esc;
    render();
  }

  function render() {
    const body = document.getElementById("lbBody"); if (!body) return;
    const st = myStats();
    body.innerHTML = "";
    const me = document.createElement("div"); me.className = "lb-me";
    me.innerHTML =
      '<div class="lb-me-row"><input id="lbName" class="sball-input" maxlength="16" placeholder="Your name for the board"><button class="btn asc-btn" id="lbSave">Submit my score</button></div>' +
      '<div class="lb-mystats">⭐ Level <b>' + st.level + '</b> · 🐟 <b>' + st.treats + '</b> · ♾️ <b>' + st.rebirths + '</b> · ✨ Asc <b>' + st.asc + '</b> · 🏅 Power Score <b>' + st.score + '</b></div>' +
      '<p class="lb-status" id="lbStatus"></p>';
    body.appendChild(me);
    const list = document.createElement("div"); list.className = "lb-list"; list.id = "lbList"; list.innerHTML = '<p class="ar-hint">Loading ranks…</p>'; body.appendChild(list);
    document.getElementById("lbName").value = myName();
    document.getElementById("lbSave").onclick = function () {
      const n = document.getElementById("lbName").value.trim() || "Player"; setName(n);
      try { if (window.MG) window.MG.flag("ranked"); } catch (e) {}
      document.getElementById("lbStatus").textContent = "Submitting…";
      submit().then(function (r) {
        document.getElementById("lbStatus").textContent = r.ok ? "✅ Submitted! You're on the global board." : (r.reason === "nolb" ? "Saved locally. (Owner: turn on Firebase so ranks go global.)" : "Couldn't reach the global board — saved locally, try again later.");
        refreshList();
      });
    };
    refreshList();
  }

  function refreshList() {
    const list = document.getElementById("lbList"); if (!list) return;
    load().then(function (rows) {
      if (rows === null) {
        let local = null; try { local = JSON.parse(localStorage.getItem("mg-lb-local") || "null"); } catch (e) {}
        list.innerHTML = '<p class="ar-hint">🌐 Global ranks need the Home (Firebase) connection. Here\'s your saved score:</p>';
        if (local) list.appendChild(rowEl(1, local, true));
        return;
      }
      if (!rows.length) { list.innerHTML = '<p class="ar-hint">No ranks yet — be the first! Hit “Submit my score”.</p>'; return; }
      list.innerHTML = "";
      const myname = myName();
      rows.forEach(function (r, i) { list.appendChild(rowEl(i + 1, r, r.name === myname)); });
    });
  }

  function rowEl(rank, r, mine) {
    const d = document.createElement("div"); d.className = "lb-row" + (mine ? " mine" : "");
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "#" + rank;
    d.innerHTML = '<span class="lb-rank"></span><span class="lb-name"></span><span class="lb-score"></span>';
    d.querySelector(".lb-rank").textContent = medal;
    d.querySelector(".lb-name").textContent = (r.name || "Player") + (r.rebirths ? " ♾️" + r.rebirths : "");
    d.querySelector(".lb-score").textContent = (r.score || 0).toLocaleString() + " 🏅";
    return d;
  }

  window.MG_LB = { open: open, close: close, submit: submit };
  function wire() { const b = document.getElementById("ranksBtn"); if (b) b.onclick = open; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
