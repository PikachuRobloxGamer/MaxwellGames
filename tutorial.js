// ===== MaxwellGames: 🐾 fun new-player tutorial + "What's New" popup =====
(function () {
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var maxImg = function () { return (document.querySelector(".logo-img") || {}).src || "maxwell.png"; };

  function css() {
    if (document.getElementById("mg-tut-css")) return;
    var s = document.createElement("style"); s.id = "mg-tut-css";
    s.textContent = ".tut-ov{position:fixed;inset:0;z-index:100060;background:rgba(5,3,15,.72);display:flex;align-items:center;justify-content:center;padding:18px}"
      + ".tut-card{position:relative;width:min(400px,94vw);background:linear-gradient(180deg,#fff,#f3f0ff);border-radius:24px;border:4px solid #ffd84a;box-shadow:0 20px 60px rgba(0,0,0,.5);padding:20px;text-align:center}"
      + ".tut-cat{width:84px;height:84px;border-radius:50%;border:4px solid #6c5ce7;object-fit:cover;background:#fff;margin-top:-56px;animation:tutBob 2s ease-in-out infinite}"
      + "@keyframes tutBob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-8px) rotate(4deg)}}"
      + ".tut-card h2{color:#3a2d80;margin:8px 0 4px;font-size:1.3rem}.tut-card p{color:#4a4560;font-size:.95rem;line-height:1.5;margin:4px 0 12px}"
      + ".tut-dots{display:flex;gap:6px;justify-content:center;margin-bottom:12px}.tut-dot{width:8px;height:8px;border-radius:50%;background:#d8d0f0}.tut-dot.on{background:#6c5ce7}"
      + ".tut-btns{display:flex;gap:8px;justify-content:center}"
      + ".tut-next{background:linear-gradient(90deg,#ff7eb3,#6c5ce7);color:#fff;border:none;border-radius:14px;padding:12px 26px;font-weight:900;font-size:1.05rem;cursor:pointer;box-shadow:0 5px 0 #4a3aa0}.tut-next:active{transform:translateY(4px);box-shadow:0 1px 0 #4a3aa0}"
      + ".tut-skip{background:none;border:none;color:#9b93c0;font-weight:700;cursor:pointer;text-decoration:underline}"
      + ".tut-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:#6c5ce7;color:#fff;font-weight:800;font-size:.72rem;padding:3px 12px;border-radius:999px;white-space:nowrap}";
    document.head.appendChild(s);
  }

  var STEPS = [
    { t: "Hi, I'm Maxwell! 🐱", b: "Welcome to <b>MaxwellGames</b> — the coziest corner of the internet! Let me give you a super quick tour. It'll be fun, promise! 🎉", tip: "Step 1" },
    { t: "60+ games to play! 🎮", b: "This whole page is your <b>game library</b>. Tap any game to play it. Hit the ⭐ star to save your favorites, or 🎲 <b>Random</b> when you can't decide!", tip: "The Library" },
    { t: "Earn treats! 🐟", b: "That little counter up top is your <b>treats</b>. Earn them by playing games, catching the floating :3 cats, and finishing challenges. Spend them on themes & cosmetics!", tip: "Treats" },
    { t: "The Arcade 🕹️", b: "The <b>🕹️ Arcade</b> tab is packed with bite-sized minigames — snake, flappy, a 3D kart racer, and way more. Every round earns treats!", tip: "Arcade" },
    { t: "Daily Challenges 🏅", b: "Check the <b>🏅 Challenges</b> tab every day for goals that pay out treats — and build a 🔥 streak by coming back!", tip: "Challenges" },
    { t: "Make it yours 🌙", b: "In the <b>🌙 Themes</b> tab you can reskin the whole site, turn on your Maxwell buddy, and even set a custom cursor. There's a ⚙️ <b>Settings</b> tab too!", tip: "Themes & Settings" },
    { t: "Take your Maxwell anywhere ✨", b: "Tap the <b>👤 account</b> button to make a free account. Then your treats, level, and Maxwell follow you to <b>any device</b> — even a different computer at school!", tip: "Accounts" },
    { t: "You're all set! 🎉", b: "That's the tour! Boss battles, pets, duels, and tons more are waiting. Here's <b>50 🐟</b> to get you started — now go have fun! 🐾", tip: "Let's play!" }
  ];

  function run() {
    css();
    var i = 0, ov = document.createElement("div"); ov.className = "tut-ov"; document.body.appendChild(ov);
    function render() {
      var s = STEPS[i];
      ov.innerHTML = '<div class="tut-card"><div class="tut-badge">' + s.tip + '</div><img class="tut-cat" src="' + maxImg() + '" alt="Maxwell"><h2>' + s.t + '</h2><p>' + s.b + '</p>'
        + '<div class="tut-dots">' + STEPS.map(function (_, k) { return '<span class="tut-dot' + (k === i ? " on" : "") + '"></span>'; }).join("") + '</div>'
        + '<div class="tut-btns">' + (i < STEPS.length - 1 ? '<button class="tut-skip" id="tutSkip">Skip</button>' : '') + '<button class="tut-next" id="tutNext">' + (i < STEPS.length - 1 ? "Next →" : "🎮 Start playing!") + '</button></div></div>';
      ov.querySelector("#tutNext").onclick = function () { if (i < STEPS.length - 1) { i++; render(); } else finish(); };
      var sk = ov.querySelector("#tutSkip"); if (sk) sk.onclick = finish;
    }
    function finish() {
      ls("mg-tutorial-done", "1");
      try { window.MG.give(50); window.MG.toast && window.MG.toast("🎁", "Welcome gift!", "+50 🐟 — enjoy MaxwellGames!"); } catch (e) {}
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      maybeChangelog();
    }
    render();
  }

  // ---------- "What's New" popup ----------
  var VERSION = "oct2026-big";
  var NEW = ["🎮 10+ brand-new games (Tower Defense, Solitaire, Air Hockey & more)", "🏅 Daily & weekly Challenges with streaks", "🌙 Themes, seasons & a custom cursor", "🐱 A buddy companion that follows you", "⭐ Favorites, 🎲 Random, Recently Played & sorting", "🚨 Daily auto Admin Abuse at 8 & 10 AM", "⚙️ New Settings (sound, motion, contrast)"];
  function maybeChangelog() {
    if (ls("mg-ver") === VERSION) return;
    ls("mg-ver", VERSION);
    css();
    var ov = document.createElement("div"); ov.className = "tut-ov"; document.body.appendChild(ov);
    ov.innerHTML = '<div class="tut-card"><div class="tut-badge">What\'s New</div><img class="tut-cat" src="' + maxImg() + '"><h2>🎉 Big Update!</h2><p style="text-align:left">' + NEW.map(function (n) { return "• " + n; }).join("<br>") + '</p><div class="tut-btns"><button class="tut-next" id="clOk">Awesome!</button></div></div>';
    ov.querySelector("#clOk").onclick = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); };
  }

  function boot() {
    if (ls("mg-tutorial-done") === "1") { maybeChangelog(); return; }
    // wait until the loader is gone and the account overlay (if any) is closed
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var loader = document.getElementById("loader");
      var loaderGone = !loader || loader.classList.contains("gone") || getComputedStyle(loader).display === "none";
      var acct = document.getElementById("mgaOverlay");
      var acctOpen = acct && !acct.classList.contains("hidden");
      if (loaderGone && !acctOpen) { clearInterval(iv); setTimeout(run, 400); }
      if (tries > 120) clearInterval(iv);
    }, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.MG_TUTORIAL = { run: run };
})();
