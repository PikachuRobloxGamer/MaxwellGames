// ===== MaxwellGames: flavor tabs — My Maxwell (tamagotchi), Garden, Daily Riddle, Score Card, Quiz Maker =====
(function () {
  var U = window.MGUI;
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lss(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k, d) { try { var v = JSON.parse(ls(k) || "null"); return v || d; } catch (e) { return d; } }
  function save(k, v) { lss(k, JSON.stringify(v)); }
  function clamp(n) { return Math.max(0, Math.min(100, n)); }
  function img() { return (document.querySelector(".logo-img") || {}).src || "maxwell.png"; }
  function fbUrl() { return (window.MG_FIREBASE_CONFIG && window.MG_FIREBASE_CONFIG.databaseURL) || ""; }

  function css() {
    if (document.getElementById("mg-flavor-css")) return;
    var s = document.createElement("style"); s.id = "mg-flavor-css";
    s.textContent = ".fl-bar{height:16px;background:#0d1020;border-radius:8px;overflow:hidden;margin:4px 0}.fl-bar>span{display:block;height:100%;transition:width .4s}"
      + ".fl-pet{font-size:90px;text-align:center;line-height:1;margin:6px 0}.fl-pet img{width:110px;height:110px;border-radius:50%;object-fit:cover}"
      + ".garden{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.plot{aspect-ratio:1;border-radius:12px;background:#2a1f12;border:2px solid #4a3a22;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;font-size:.8rem;font-weight:700;color:#e8d8b8}.plot .pem{font-size:2rem}"
      + ".sc-wrap{text-align:center}.sc-wrap canvas{max-width:100%;border-radius:12px;margin:8px 0}";
    document.head.appendChild(s);
  }

  // ---------- My Maxwell (tamagotchi) ----------
  function openPet() {
    css(); var p = U.panel("petOv", "🐱 My Maxwell", "pet-head");
    var s = load("mg-petcare", { hunger: 70, happy: 70, ts: Date.now(), name: "" });
    var hrs = (Date.now() - (s.ts || Date.now())) / 3600000;
    s.hunger = clamp(s.hunger - hrs * 9); s.happy = clamp(s.happy - hrs * 7); s.ts = Date.now(); save("mg-petcare", s);
    function mood() { var a = (s.hunger + s.happy) / 2; if (s.hunger < 25) return "🙀"; if (a > 75) return "😸"; if (a > 45) return "😺"; if (a > 25) return "😿"; return "🙀"; }
    function render() {
      p.body.innerHTML = '<p class="ar-hint">Take care of your very own Maxwell! Feed and play with him so he stays happy. 🐾</p>'
        + '<div class="fl-pet"><img src="' + img() + '" alt=""></div><div style="text-align:center;font-size:2rem">' + mood() + '</div>'
        + '<div>🍖 Hunger<div class="fl-bar"><span style="width:' + s.hunger + '%;background:' + (s.hunger < 30 ? "#ff6b6b" : "#ffb04d") + '"></span></div></div>'
        + '<div>😻 Happiness<div class="fl-bar"><span style="width:' + s.happy + '%;background:#3ee08f"></span></div></div>'
        + '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn asc-btn" id="petFeed">🐟 Feed (10 🐟)</button><button class="btn" id="petPlay">🎾 Play</button><button class="btn" id="petPet">🫳 Pet</button></div>';
      p.body.querySelector("#petFeed").onclick = function () { if (U.spend(10)) { s.hunger = clamp(s.hunger + 25); save("mg-petcare", s); U.tone(600, 0.06); render(); } else U.toast && U.toast("🔒", "Need 10 🐟", ""); };
      p.body.querySelector("#petPlay").onclick = function () { s.happy = clamp(s.happy + 18); s.hunger = clamp(s.hunger - 4); save("mg-petcare", s); U.tone(700, 0.05); render(); };
      p.body.querySelector("#petPet").onclick = function () { s.happy = clamp(s.happy + 6); save("mg-petcare", s); try { window.MG.meow(); } catch (e) {} render(); };
    }
    render();
  }

  // ---------- Garden ----------
  function openGarden() {
    css(); var p = U.panel("gardenOv", "🌱 Maxwell Garden", "garden-head");
    var GROW = 180000; // 3 min
    var g = load("mg-garden", { plots: [0, 0, 0, 0, 0, 0] });
    function render() {
      var html = '<p class="ar-hint">Plant treat-fish for 5 🐟 each. They grow in 3 minutes — harvest for 20 🐟! 🐟</p><div class="garden">';
      g.plots.forEach(function (ts, i) {
        var st = ts === 0 ? "empty" : (Date.now() - ts >= GROW ? "ready" : "growing");
        var inner = st === "empty" ? '<span class="pem">🟫</span>Plant' : st === "ready" ? '<span class="pem">🐟</span>Harvest!' : '<span class="pem">🌱</span>' + Math.ceil((GROW - (Date.now() - ts)) / 1000) + "s";
        html += '<button class="plot" data-i="' + i + '">' + inner + '</button>';
      });
      html += '</div>';
      p.body.innerHTML = html;
      p.body.querySelectorAll(".plot").forEach(function (b) {
        b.onclick = function () { var i = +b.dataset.i, ts = g.plots[i];
          if (ts === 0) { if (U.spend(5)) { g.plots[i] = Date.now(); save("mg-garden", g); U.tone(500, 0.05); render(); } }
          else if (Date.now() - ts >= GROW) { U.give(20); g.plots[i] = 0; save("mg-garden", g); U.tone(820, 0.1); render(); }
        };
      });
    }
    render(); var iv = setInterval(render, 1000); p.onClean(function () { clearInterval(iv); });
  }

  // ---------- Daily Riddle ----------
  var RIDDLES = [
    { q: "I have whiskers and say meow, I'm the star of this site right now. Who am I?", a: ["maxwell", "a cat", "cat", "maxwell the cat"] },
    { q: "The more you take, the more you leave behind. What am I?", a: ["footsteps", "steps", "footprint", "footprints"] },
    { q: "What has keys but can't open locks?", a: ["piano", "keyboard", "a piano", "a keyboard"] },
    { q: "What gets wetter the more it dries?", a: ["towel", "a towel"] },
    { q: "I'm full of holes but still hold water. What am I?", a: ["sponge", "a sponge"] },
    { q: "What has to be broken before you can use it?", a: ["egg", "an egg"] },
    { q: "What goes up but never comes down?", a: ["your age", "age"] },
    { q: "What has hands but can't clap?", a: ["clock", "a clock"] }
  ];
  function openRiddle() {
    var p = U.panel("riddleOv", "🧩 Daily Riddle", "riddle-head");
    var DAY = 86400000, last = parseInt(ls("mg-riddle-last") || "0", 10) || 0;
    if (Date.now() - last < DAY) {
      var left = DAY - (Date.now() - last);
      p.body.innerHTML = '<div style="text-align:center;padding:20px"><div style="font-size:54px">🧩✅</div><h2>Solved for today!</h2><p class="ar-hint">Come back for a new riddle in</p><div id="rdCd" style="font-size:2rem;font-weight:900;color:#3ee08f"></div></div>';
      var cd = p.body.querySelector("#rdCd");
      function upd() { var l = DAY - (Date.now() - last); if (l <= 0) { openRiddle(); return; } var s = Math.ceil(l / 1000); cd.textContent = String(Math.floor(s / 3600)).padStart(2, "0") + ":" + String(Math.floor(s % 3600 / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
      upd(); var iv = setInterval(upd, 1000); p.onClean(function () { clearInterval(iv); }); return;
    }
    var day = Math.floor(Date.now() / DAY); var r = RIDDLES[day % RIDDLES.length];
    p.body.innerHTML = '<p class="ar-hint">Solve the riddle for 🐟 treats! One a day.</p><div style="background:var(--panel-hover);border-radius:14px;padding:16px;font-size:1.1rem;text-align:center">' + r.q + '</div><input id="rdAns" class="sball-input" style="width:100%;margin-top:10px" placeholder="Your answer…"><button class="btn asc-btn" id="rdGo" style="margin-top:6px;width:100%">Submit</button><p class="ar-hint" id="rdMsg"></p>';
    p.body.querySelector("#rdGo").onclick = function () {
      var v = (p.body.querySelector("#rdAns").value || "").trim().toLowerCase();
      if (!v) return;
      if (r.a.indexOf(v) >= 0) { lss("mg-riddle-last", String(Date.now())); U.give(60); U.tone(880, 0.2); openRiddle(); }
      else { p.body.querySelector("#rdMsg").textContent = "🙀 Not quite — try again!"; U.tone(180, 0.1); }
    };
  }

  // ---------- Score Card (shareable image) ----------
  function openCard() {
    css(); var p = U.panel("cardOv", "📸 Score Card", "card-head");
    p.body.innerHTML = '<p class="ar-hint">Make a shareable card of your stats to show your friends! 📸</p><div class="sc-wrap"><canvas id="scCanvas" width="600" height="340"></canvas><br><button class="btn asc-btn" id="scDl">⬇️ Download</button></div>';
    var cv = p.body.querySelector("#scCanvas"), x = cv.getContext("2d");
    var s = window.MG.save; var nick = ls("mg-nick") || (ls("mg-auth") || "Player");
    var lvl = (function () { try { return s.xp ? Math.floor(Math.sqrt(s.xp / 15)) + 1 : 1; } catch (e) { return 1; } })();
    var im = new Image(); im.crossOrigin = "anonymous"; im.src = img();
    function draw() {
      var g = x.createLinearGradient(0, 0, 600, 340); g.addColorStop(0, "#6c5ce7"); g.addColorStop(1, "#c0392b"); x.fillStyle = g; x.fillRect(0, 0, 600, 340);
      x.fillStyle = "rgba(255,255,255,.1)"; for (var i = 0; i < 600; i += 30) x.fillRect(i, 0, 15, 340);
      x.fillStyle = "#fff"; x.font = "900 34px system-ui"; x.textAlign = "left"; x.fillText("MaxwellGames", 150, 54);
      x.font = "800 20px system-ui"; x.fillStyle = "#ffd84a"; x.fillText("@" + nick, 150, 84);
      try { x.save(); x.beginPath(); x.arc(78, 70, 48, 0, 7); x.clip(); x.drawImage(im, 30, 22, 96, 96); x.restore(); } catch (e) {}
      x.strokeStyle = "#fff"; x.lineWidth = 4; x.beginPath(); x.arc(78, 70, 48, 0, 7); x.stroke();
      var rows = [["⭐ Level", lvl], ["🐟 Treats", (s.treats || 0).toLocaleString()], ["🏆 Achievements", (s.ach || []).length], ["👹 Bosses beaten", (s.bossBeaten || []).length]];
      x.textAlign = "left"; rows.forEach(function (r, i) { var y = 150 + i * 44; x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(30, y - 26, 540, 36); x.fillStyle = "#fff"; x.font = "800 22px system-ui"; x.fillText(r[0], 46, y); x.textAlign = "right"; x.fillText("" + r[1], 554, y); x.textAlign = "left"; });
    }
    im.onload = draw; draw();
    p.body.querySelector("#scDl").onclick = function () { try { var a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = "maxwellgames-card.png"; a.click(); } catch (e) { U.toast && U.toast("😿", "Couldn't save", "Try a screenshot instead!"); } };
  }

  // ---------- Quiz Maker ----------
  function openQuiz() {
    var p = U.panel("quizOv", "📝 Quiz Maker", "quiz-head");
    function menu() {
      p.body.innerHTML = '<p class="ar-hint">Make your own quiz and share it with a code, or play a friend\'s quiz! 🧠</p>'
        + '<button class="btn asc-btn" id="qzMake" style="width:100%;margin:4px 0">✏️ Make a quiz</button>'
        + '<div style="display:flex;gap:6px;margin-top:6px"><input id="qzCode" class="sball-input" placeholder="Enter a quiz code…" style="flex:1;text-transform:uppercase"><button class="btn" id="qzLoad">▶ Play</button></div><p class="ar-hint" id="qzMsg"></p>';
      p.body.querySelector("#qzMake").onclick = makeView;
      p.body.querySelector("#qzLoad").onclick = function () { var code = (p.body.querySelector("#qzCode").value || "").trim().toUpperCase(); if (!code) return; if (!fbUrl()) { p.body.querySelector("#qzMsg").textContent = "Can't reach the quiz server."; return; } fetch(fbUrl() + "/quizzes/" + code + ".json").then(function (r) { return r.json(); }).then(function (q) { if (q && q.items) play(q); else p.body.querySelector("#qzMsg").textContent = "No quiz with that code. 😿"; }).catch(function () { p.body.querySelector("#qzMsg").textContent = "Couldn't load."; }); };
    }
    function makeView() {
      p.body.innerHTML = '<p class="ar-hint">One question per line, like:<br><code>Question | correct | wrong | wrong | wrong</code></p>'
        + '<textarea id="qzText" class="sball-input" style="width:100%;height:160px" placeholder="What color is Maxwell? | orange | blue | green | pink\nHow many legs? | four | two | six | eight"></textarea>'
        + '<div style="display:flex;gap:6px;margin-top:6px"><button class="btn asc-btn" id="qzSave">🔗 Get share code</button><button class="btn" id="qzBack">← Back</button></div><p class="ar-hint" id="qzMsg2"></p>';
      p.body.querySelector("#qzBack").onclick = menu;
      p.body.querySelector("#qzSave").onclick = function () {
        var lines = (p.body.querySelector("#qzText").value || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
        var items = lines.map(function (l) { var parts = l.split("|").map(function (x) { return x.trim(); }); if (parts.length < 2) return null; return { q: parts[0], correct: parts[1], wrong: parts.slice(2) }; }).filter(Boolean);
        if (!items.length) { p.body.querySelector("#qzMsg2").textContent = "Add at least one question!"; return; }
        if (!fbUrl()) { p.body.querySelector("#qzMsg2").textContent = "Can't reach the quiz server."; return; }
        var code = Math.random().toString(36).slice(2, 7).toUpperCase();
        fetch(fbUrl() + "/quizzes/" + code + ".json", { method: "PUT", body: JSON.stringify({ items: items, at: Date.now() }) }).then(function () { p.body.querySelector("#qzMsg2").innerHTML = "✅ Share this code: <b style='font-size:1.3rem'>" + code + "</b>"; }).catch(function () { p.body.querySelector("#qzMsg2").textContent = "Couldn't save."; });
      };
    }
    function play(q) {
      var i = 0, score = 0;
      function q1() {
        if (i >= q.items.length) { p.body.innerHTML = '<div style="text-align:center;padding:20px"><h2>🎉 ' + score + " / " + q.items.length + '</h2><button class="btn asc-btn" id="qzDone">Done</button></div>'; p.body.querySelector("#qzDone").onclick = menu; if (score === q.items.length) { try { U.give(30); } catch (e) {} } return; }
        var it = q.items[i]; var opts = [it.correct].concat(it.wrong || []); for (var j = opts.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = opts[j]; opts[j] = opts[k]; opts[k] = t; }
        p.body.innerHTML = '<p class="ar-hint">Question ' + (i + 1) + " / " + q.items.length + '</p><div style="background:var(--panel-hover);border-radius:14px;padding:14px;font-weight:700;text-align:center">' + esc(it.q) + '</div><div id="qzOpts" style="display:grid;gap:8px;margin-top:10px"></div>';
        opts.forEach(function (o) { var b = document.createElement("button"); b.className = "btn"; b.textContent = o; b.onclick = function () { if (o === it.correct) { score++; U.tone(800, 0.08); } else { U.tone(180, 0.1); } i++; q1(); }; p.body.querySelector("#qzOpts").appendChild(b); });
      }
      q1();
    }
    function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
    menu();
  }

  if (U && U.wire) { U.wire("petBtn2", openPet); U.wire("gardenBtn", openGarden); U.wire("riddleBtn", openRiddle); U.wire("cardBtn", openCard); U.wire("quizBtn", openQuiz); }
  window.MG_FLAVOR = { pet: openPet, garden: openGarden, riddle: openRiddle, card: openCard, quiz: openQuiz };
})();
