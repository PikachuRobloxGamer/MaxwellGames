// ===== MaxwellGames: MAXWELL TV — promote the YouTube channels big time =====
(function () {
  const CH = [
    { name: "Pikachu Roblox Gamer", handle: "@PikachuRobloxGamer", url: "https://www.youtube.com/channel/UCXcZ2HP_B3NLLbvnd3QT75A", color: "#ff5a6e", avatar: "maxwell.png", blurb: "Roblox, gaming & Maxwell madness. The creator of MaxwellGames!" },
    { name: "Games On", handle: "@GamesOn-786", url: "https://www.youtube.com/@GamesOn-786", color: "#4fb3ff", avatar: "images/maxwell-pikachu.png", blurb: "Sami's channel — Pokémon, gaming and more. Smash subscribe!" }
  ];
  const SPOTS = [
    "🔥 New videos drop on both channels — don't miss out!",
    "🎮 Subscribing is FREE and helps the channels blow up!",
    "🐱 The more subs, the more MaxwellGames updates!",
    "⭐ Hit the bell so you never miss an upload!"
  ];

  function close() { const o = document.getElementById("tvOv"); if (o) { document.removeEventListener("keydown", o._esc); o.remove(); } clearInterval(window._tvSpin); }

  function open() {
    close();
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = "tvOv";
    ov.innerHTML = `
      <div class="arcade-box tv-box">
        <div class="arcade-head tv-head">
          <h2>📺 Maxwell TV</h2>
          <button class="btn ar-x" id="tvClose" aria-label="Close">✕</button>
        </div>
        <div class="arcade-body tv-body" id="tvBody"></div>
      </div>`;
    document.body.appendChild(ov);
    document.getElementById("tvClose").onclick = close;
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    const esc = (e) => { if (e.key === "Escape") close(); }; document.addEventListener("keydown", esc); ov._esc = esc;

    const body = document.getElementById("tvBody");
    const spot = document.createElement("div"); spot.className = "tv-spotlight"; spot.textContent = SPOTS[0]; body.appendChild(spot);
    let si = 0; window._tvSpin = setInterval(() => { si = (si + 1) % SPOTS.length; spot.style.opacity = 0; setTimeout(() => { spot.textContent = SPOTS[si]; spot.style.opacity = 1; }, 250); }, 3500);

    CH.forEach((ch) => {
      const card = document.createElement("div"); card.className = "tv-card"; card.style.setProperty("--ch", ch.color);
      card.innerHTML = `
        <div class="tv-banner"></div>
        <img class="tv-avatar" src="${ch.avatar}" alt="">
        <div class="tv-info">
          <div class="tv-name"></div>
          <div class="tv-handle"></div>
          <div class="tv-blurb"></div>
          <a class="btn tv-sub yt-link" target="_blank" rel="noopener noreferrer" href="${ch.url}">▶ SUBSCRIBE</a>
        </div>`;
      card.querySelector(".tv-name").textContent = ch.name;
      card.querySelector(".tv-handle").textContent = ch.handle;
      card.querySelector(".tv-blurb").textContent = ch.blurb;
      body.appendChild(card);
    });

    const foot = document.createElement("p"); foot.className = "ar-hint"; foot.innerHTML = "Tap <b>Subscribe</b> to open a channel in a new tab — first visit gives you <b>+50 🐟</b>! Share MaxwellGames with your friends to help it take over the school 😼";
    body.appendChild(foot);
  }

  window.MG_TV = { open, close };
  function wire() { const b = document.getElementById("tvBtn"); if (b) b.onclick = open; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
