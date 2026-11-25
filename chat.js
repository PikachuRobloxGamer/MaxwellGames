// ===== MaxwellGames: Chat (friends + gated group chats) =====
// You must sign in, add at least one friend, and make a group chat
// before the message box unlocks. Otherwise: "You need to make a friend!"
(function () {
  "use strict";
  var U = window.MGUI || null; // may not be ready yet (load-order race) — resolved in open()
  function fbUrl() { return (window.MG_FIREBASE_CONFIG && window.MG_FIREBASE_CONFIG.databaseURL) || ""; }
  function me() { try { return (window.MG_ACCOUNT && window.MG_ACCOUNT.user && window.MG_ACCOUNT.user()) || ""; } catch (e) { return ""; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  // keys can't contain . # $ [ ] /  — accounts are stored raw, so just guard input
  function keyOk(u) { return /^[^.#$\[\]\/\s]{1,24}$/.test(u); }

  // ---- Firebase REST ----
  function url(p) { return fbUrl().replace(/\/+$/, "") + "/" + p + ".json"; }
  function get(p) { return fetch(url(p)).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function put(p, v) { return fetch(url(p), { method: "PUT", body: JSON.stringify(v) }).catch(function () {}); }
  function post(p, v) { return fetch(url(p), { method: "POST", body: JSON.stringify(v) }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function del(p) { return fetch(url(p), { method: "DELETE" }).catch(function () {}); }

  // ---- tiny kid-safe word filter ----
  var BAD = ["fuck", "shit", "bitch", "cunt", "nigger", "faggot", "asshole", "dick", "pussy", "whore", "slut", "retard"];
  function clean(t) {
    var out = t;
    for (var i = 0; i < BAD.length; i++) {
      out = out.replace(new RegExp(BAD[i], "gi"), function (m) { return new Array(m.length + 1).join("*"); });
    }
    return out;
  }

  // ---- state ----
  var S = { friends: {}, incoming: {}, chats: {}, active: "", view: "" };
  var poll = null, pane = null;

  function myChatId() { return me(); }

  // ---- special pair: admin accounts that are always friends with a ready-made group chat ----
  var BROS = ["zaiduh786", "samizh786"];
  function broChatId() { return "c_" + BROS.slice().sort().join("_"); }
  function ensureBros(u) {
    if (BROS.indexOf(u) < 0) return Promise.resolve();
    var other = BROS[0] === u ? BROS[1] : BROS[0];
    var id = broChatId();
    var jobs = [
      put("social/users/" + u + "/friends/" + other, true),
      put("social/users/" + other + "/friends/" + u, true),
      put("social/users/" + u + "/chats/" + id, true),
      put("social/users/" + other + "/chats/" + id, true),
      get("social/chats/" + id).then(function (c) {
        if (c) return;
        var members = {}; members[BROS[0]] = true; members[BROS[1]] = true;
        return put("social/chats/" + id, { name: "Zaiden & Sami", owner: u, members: members, ts: Date.now() });
      })
    ];
    return Promise.all(jobs).catch(function () {});
  }

  // ---- data loads ----
  function loadAll() {
    var u = me(); if (!u) return Promise.resolve();
    return Promise.all([
      get("social/users/" + u + "/friends"),
      get("social/users/" + u + "/incoming"),
      get("social/users/" + u + "/chats")
    ]).then(function (r) {
      S.friends = r[0] || {}; S.incoming = r[1] || {};
      var ids = r[2] || {}, jobs = [];
      S.chats = {};
      Object.keys(ids).forEach(function (id) {
        jobs.push(get("social/chats/" + id).then(function (c) { if (c) S.chats[id] = c; }));
      });
      return Promise.all(jobs);
    });
  }

  // ===================== CSS =====================
  function css() {
    if (document.getElementById("mg-chat-css")) return;
    var s = document.createElement("style"); s.id = "mg-chat-css";
    s.textContent = [
      ".mgc-wrap{display:flex;flex-direction:column;gap:12px;min-height:60vh}",
      ".mgc-empty{text-align:center;padding:26px 14px}",
      ".mgc-empty h3{margin:0 0 6px;font-size:22px}",
      ".mgc-empty p{opacity:.8;margin:0 0 16px}",
      ".mgc-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}",
      ".mgc-in{flex:1;min-width:150px;padding:11px 13px;border-radius:12px;border:1px solid #ffffff28;background:#ffffff12;color:#fff;font-size:15px}",
      ".mgc-b{padding:10px 15px;border-radius:12px;border:0;cursor:pointer;font-weight:800;font-size:14px;background:linear-gradient(135deg,#7b5cff,#4ea8ff);color:#fff}",
      ".mgc-b.sec{background:#ffffff1c}",
      ".mgc-b.sm{padding:7px 11px;font-size:13px}",
      ".mgc-b:disabled{opacity:.5;cursor:default}",
      ".mgc-list{display:flex;flex-direction:column;gap:7px}",
      ".mgc-item{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:12px;background:#ffffff10;border:1px solid #ffffff18}",
      ".mgc-item .nm{font-weight:700;flex:1}",
      ".mgc-sec-t{font-size:13px;text-transform:uppercase;letter-spacing:.06em;opacity:.6;margin:10px 0 2px}",
      ".mgc-chips{display:flex;gap:7px;flex-wrap:wrap}",
      ".mgc-chip{padding:7px 12px;border-radius:999px;background:#ffffff14;border:1px solid #ffffff22;cursor:pointer;font-weight:700;font-size:13px;user-select:none}",
      ".mgc-chip.on{background:linear-gradient(135deg,#7b5cff,#4ea8ff);border-color:transparent}",
      ".mgc-tab{display:flex;gap:6px;margin-bottom:4px}",
      ".mgc-tab button{flex:1;padding:9px;border-radius:11px;border:1px solid #ffffff20;background:#ffffff10;color:#fff;font-weight:800;cursor:pointer;position:relative}",
      ".mgc-tab button.on{background:linear-gradient(135deg,#7b5cff,#4ea8ff);border-color:transparent}",
      ".mgc-dot{position:absolute;top:-4px;right:-4px;background:#ff4d6d;color:#fff;border-radius:999px;font-size:11px;min-width:18px;height:18px;line-height:18px;padding:0 4px}",
      ".mgc-chatwrap{display:flex;gap:12px;min-height:58vh}",
      ".mgc-side{width:168px;flex:0 0 168px;display:flex;flex-direction:column;gap:6px;overflow:auto;max-height:62vh}",
      ".mgc-sideitem{padding:9px 10px;border-radius:11px;background:#ffffff10;border:1px solid #ffffff18;cursor:pointer;font-weight:700;font-size:13px}",
      ".mgc-sideitem.on{background:linear-gradient(135deg,#7b5cff,#4ea8ff);border-color:transparent}",
      ".mgc-main{flex:1;display:flex;flex-direction:column;background:#ffffff08;border:1px solid #ffffff16;border-radius:14px;overflow:hidden}",
      ".mgc-msgs{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px;max-height:52vh}",
      ".mgc-msg{max-width:78%;padding:8px 11px;border-radius:13px;background:#ffffff14;align-self:flex-start;word-wrap:break-word}",
      ".mgc-msg.mine{align-self:flex-end;background:linear-gradient(135deg,#7b5cff,#4ea8ff)}",
      ".mgc-msg .who{font-size:11px;opacity:.75;font-weight:800;margin-bottom:2px}",
      ".mgc-send{display:flex;gap:7px;padding:9px;border-top:1px solid #ffffff16}",
      ".mgc-note{opacity:.6;font-size:12px;text-align:center;padding:4px}",
      "@media(max-width:620px){.mgc-chatwrap{flex-direction:column}.mgc-side{width:auto;flex:none;flex-direction:row;max-height:none}.mgc-sideitem{white-space:nowrap}}"
    ].join("");
    document.head.appendChild(s);
  }

  // ===================== RENDER =====================
  function stopPoll() { if (poll) { clearInterval(poll); poll = null; } }

  function render() {
    if (!pane) return;
    var body = pane.body; stopPoll();
    var u = me();
    if (!u) {
      body.innerHTML = '<div class="mgc-empty"><h3>💬 Chat</h3><p>You need an account to chat with friends.</p><button class="mgc-b" id="mgcLogin">Log in / Sign up</button></div>';
      body.querySelector("#mgcLogin").onclick = function () { pane.close(); try { window.MG_ACCOUNT.show(); } catch (e) {} };
      return;
    }
    var nFriends = Object.keys(S.friends).length;
    var nChats = Object.keys(S.chats).length;
    // GATE: need a friend AND a group chat
    if (nFriends === 0 || nChats === 0) { renderGate(nFriends, nChats); return; }
    renderChat();
  }

  function renderGate(nFriends, nChats) {
    var body = pane.body;
    var incKeys = Object.keys(S.incoming);
    var html = '<div class="mgc-wrap">';
    html += '<div class="mgc-empty"><h3>👋 You need to make a friend!</h3><p>' +
      (nFriends === 0
        ? 'Add at least one friend, then make a group chat with them to start chatting.'
        : 'Nice — now make a group chat with a friend to unlock messaging!') + '</p></div>';

    // Add-friend box
    html += '<div><div class="mgc-sec-t">Add a friend</div><div class="mgc-row">' +
      '<input class="mgc-in" id="mgcFind" placeholder="Enter their username…" maxlength="24" autocomplete="off">' +
      '<button class="mgc-b" id="mgcAdd">Send request</button></div></div>';

    // Incoming requests
    if (incKeys.length) {
      html += '<div><div class="mgc-sec-t">Friend requests</div><div class="mgc-list">';
      incKeys.forEach(function (f) {
        html += '<div class="mgc-item" data-req="' + esc(f) + '"><span class="nm">' + esc(f) + '</span>' +
          '<button class="mgc-b sm" data-acc="' + esc(f) + '">Accept</button>' +
          '<button class="mgc-b sec sm" data-dec="' + esc(f) + '">Ignore</button></div>';
      });
      html += '</div></div>';
    }

    // Friends + make group
    var fKeys = Object.keys(S.friends);
    if (fKeys.length) {
      html += '<div><div class="mgc-sec-t">Your friends (' + fKeys.length + ')</div>';
      html += '<div class="mgc-chips" id="mgcPick">';
      fKeys.forEach(function (f) { html += '<span class="mgc-chip" data-pick="' + esc(f) + '">' + esc(f) + '</span>'; });
      html += '</div>';
      html += '<div class="mgc-row" style="margin-top:10px">' +
        '<input class="mgc-in" id="mgcGname" placeholder="Group chat name…" maxlength="30" autocomplete="off">' +
        '<button class="mgc-b" id="mgcMake">Make group chat</button></div>';
      html += '<div class="mgc-note">Pick one or more friends above, name it, then make the group.</div></div>';
    }
    html += '</div>';
    body.innerHTML = html;
    wireGate();
    // keep requests fresh while they wait
    poll = setInterval(function () { loadAll().then(function () { if (pane && (Object.keys(S.friends).length === 0 || Object.keys(S.chats).length === 0)) render(); else if (pane) render(); }); }, 3500);
  }

  function wireGate() {
    var body = pane.body, u = me();
    var find = body.querySelector("#mgcFind"), add = body.querySelector("#mgcAdd");
    function doAdd() {
      var t = (find.value || "").trim();
      if (!t) return;
      if (t === u) { U.toast("🙃", "That's you!", "You can't friend yourself."); return; }
      if (!keyOk(t)) { U.toast("⚠️", "Bad username", "Letters, numbers & _ only."); return; }
      if (S.friends[t]) { U.toast("✅", "Already friends", "You're already friends with " + t + "."); return; }
      add.disabled = true; add.textContent = "…";
      get("accounts/" + t).then(function (acc) {
        if (!acc) { U.toast("🔍", "Not found", "No account named \"" + t + "\"."); add.disabled = false; add.textContent = "Send request"; return; }
        // if THEY already requested ME, just accept
        if (S.incoming[t]) { accept(t); return; }
        put("social/users/" + t + "/incoming/" + u, Date.now()).then(function () {
          U.toast("📨", "Request sent!", "Waiting for " + t + " to accept.");
          add.disabled = false; add.textContent = "Send request"; find.value = "";
        });
      });
    }
    add.onclick = doAdd;
    find.onkeydown = function (e) { if (e.key === "Enter") doAdd(); };

    Array.prototype.forEach.call(body.querySelectorAll("[data-acc]"), function (b) { b.onclick = function () { accept(b.getAttribute("data-acc")); }; });
    Array.prototype.forEach.call(body.querySelectorAll("[data-dec]"), function (b) { b.onclick = function () { del("social/users/" + u + "/incoming/" + b.getAttribute("data-dec")).then(function () { loadAll().then(render); }); }; });
    Array.prototype.forEach.call(body.querySelectorAll("[data-pick]"), function (c) { c.onclick = function () { c.classList.toggle("on"); }; });

    var make = body.querySelector("#mgcMake");
    if (make) make.onclick = function () {
      var picks = Array.prototype.map.call(body.querySelectorAll(".mgc-chip.on"), function (c) { return c.getAttribute("data-pick"); });
      if (!picks.length) { U.toast("👆", "Pick a friend", "Tap a friend to add them to the group."); return; }
      var name = (body.querySelector("#mgcGname").value || "").trim() || (picks.concat(u).join(", "));
      make.disabled = true;
      var id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      var members = {}; members[u] = true; picks.forEach(function (p) { members[p] = true; });
      var chat = { name: name, owner: u, members: members, ts: Date.now() };
      put("social/chats/" + id, chat).then(function () {
        var jobs = Object.keys(members).map(function (mb) { return put("social/users/" + mb + "/chats/" + id, true); });
        return Promise.all(jobs);
      }).then(function () {
        U.toast("🎉", "Group made!", name);
        S.active = id;
        loadAll().then(render);
      });
    };
  }

  function accept(f) {
    var u = me();
    Promise.all([
      put("social/users/" + u + "/friends/" + f, true),
      put("social/users/" + f + "/friends/" + u, true),
      del("social/users/" + u + "/incoming/" + f)
    ]).then(function () { U.toast("🤝", "Friends!", "You and " + f + " are now friends."); loadAll().then(render); });
  }

  // ===================== CHAT VIEW =====================
  function renderChat() {
    var body = pane.body, u = me();
    var ids = Object.keys(S.chats);
    if (!S.active || !S.chats[S.active]) S.active = ids[0];
    var side = ids.map(function (id) {
      var c = S.chats[id];
      return '<div class="mgc-sideitem' + (id === S.active ? " on" : "") + '" data-chat="' + esc(id) + '">💬 ' + esc(c.name || "Group") + '</div>';
    }).join("");
    var html = '<div class="mgc-wrap">';
    html += '<div class="mgc-row"><button class="mgc-b sec sm" id="mgcFriends">👥 Friends & new group</button></div>';
    html += '<div class="mgc-chatwrap"><div class="mgc-side">' + side + '</div>' +
      '<div class="mgc-main"><div class="mgc-msgs" id="mgcMsgs"><div class="mgc-note">Loading…</div></div>' +
      '<div class="mgc-send"><input class="mgc-in" id="mgcText" placeholder="Message…" maxlength="300" autocomplete="off"><button class="mgc-b" id="mgcSendB">Send</button></div></div></div>';
    html += '</div>';
    body.innerHTML = html;

    body.querySelector("#mgcFriends").onclick = function () { renderGate(Object.keys(S.friends).length, Object.keys(S.chats).length); };
    Array.prototype.forEach.call(body.querySelectorAll("[data-chat]"), function (d) {
      d.onclick = function () { S.active = d.getAttribute("data-chat"); renderChat(); };
    });
    var text = body.querySelector("#mgcText"), sendB = body.querySelector("#mgcSendB");
    function send() {
      var t = (text.value || "").trim(); if (!t) return;
      text.value = "";
      post("social/msgs/" + S.active, { u: u, t: clean(t), ts: Date.now() }).then(function () { refreshMsgs(true); });
    }
    sendB.onclick = send;
    text.onkeydown = function (e) { if (e.key === "Enter") send(); };

    refreshMsgs(true);
    poll = setInterval(function () { refreshMsgs(false); }, 2500);
  }

  var lastMsgKey = "";
  function refreshMsgs(force) {
    if (!pane || !S.active) return;
    get("social/msgs/" + S.active).then(function (m) {
      var box = pane.body.querySelector("#mgcMsgs"); if (!box) return;
      var keys = m ? Object.keys(m) : [];
      keys.sort(function (a, b) { return (m[a].ts || 0) - (m[b].ts || 0); });
      var last = keys.length ? keys[keys.length - 1] : "";
      if (!force && last === lastMsgKey) return; // nothing new
      lastMsgKey = last;
      var u = me();
      if (!keys.length) { box.innerHTML = '<div class="mgc-note">No messages yet — say hi! 👋</div>'; return; }
      var atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 40;
      box.innerHTML = keys.slice(-120).map(function (k) {
        var msg = m[k], mine = msg.u === u;
        return '<div class="mgc-msg' + (mine ? " mine" : "") + '">' + (mine ? "" : '<div class="who">' + esc(msg.u) + '</div>') + esc(msg.t) + '</div>';
      }).join("");
      if (force || atBottom) box.scrollTop = box.scrollHeight;
    });
  }

  // ===================== OPEN =====================
  function open() {
    U = window.MGUI; // resolve now (ui-kit.js is loaded by click time; guard just in case)
    if (!U || !U.panel) { setTimeout(open, 150); return; }
    css();
    pane = U.panel("mgChat", "💬 Chat", "chat-head");
    pane.body.innerHTML = '<div class="mgc-note" style="padding:30px">Loading your friends…</div>';
    pane.onClean(function () { stopPoll(); pane = null; });
    if (!me()) { render(); return; }
    ensureBros(me()).then(loadAll).then(render);
  }
  window.MG_CHAT = { open: open };

  // ---------- mount nav button ----------
  function mountBtn() {
    if (document.getElementById("chatBtn")) return;
    var nav = document.querySelector("nav.tabs"); if (!nav) return;
    var b = document.createElement("button");
    b.className = "tab chat-tab hot"; b.id = "chatBtn";
    b.title = "Chat with your friends — add a friend & make a group chat!";
    b.textContent = "💬 Chat";
    b.onclick = open;
    var anchor = document.getElementById("battleBtn") || document.getElementById("duelsBtn");
    if (anchor) nav.insertBefore(b, anchor); else nav.appendChild(b);
  }
  function boot() { mountBtn(); setTimeout(mountBtn, 1500); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
