// ===== MaxwellGames: 👹 BOSS BATTLES =====
(function () {
  const U = window.MGUI;
  const BOSSES = [
    { id: "dog", icon: "🐶", name: "Big Bad Dog", hp: 120, time: 25, reward: 150 },
    { id: "robo", icon: "🤖", name: "Robo-Maxwell", hp: 320, time: 28, reward: 300 },
    { id: "vac", icon: "🧹", name: "The Vacuum", hp: 650, time: 30, reward: 600 },
    { id: "ghost", icon: "👻", name: "Phantom Feline", hp: 1100, time: 30, reward: 1000 },
    { id: "dragon", icon: "🐉", name: "Treat Dragon", hp: 1800, time: 34, reward: 2000 },
    { id: "b6", icon: "🦊", name: "Sly Fox", hp: 1980, time: 34, reward: 2250 },
    { id: "b7", icon: "🐺", name: "Night Wolf", hp: 2160, time: 34, reward: 2500 },
    { id: "b8", icon: "🦁", name: "Lion King Leo", hp: 2340, time: 34, reward: 2700 },
    { id: "b9", icon: "🐯", name: "Tiger Claws", hp: 2520, time: 34, reward: 2950 },
    { id: "b10", icon: "🐻", name: "Grizzly Grumble", hp: 2700, time: 34, reward: 3200 },
    { id: "b11", icon: "🐼", name: "Panda Punch", hp: 2880, time: 34, reward: 3450 },
    { id: "b12", icon: "🦍", name: "Gorilla Smash", hp: 3060, time: 34, reward: 3700 },
    { id: "b13", icon: "🐊", name: "Croc Chomper", hp: 3240, time: 34, reward: 3900 },
    { id: "b14", icon: "🦈", name: "Shark Bait", hp: 3420, time: 34, reward: 4150 },
    { id: "b15", icon: "🐙", name: "Octo-Grabber", hp: 3600, time: 35, reward: 4400 },
    { id: "b16", icon: "🦑", name: "Squid Squirt", hp: 3780, time: 35, reward: 4650 },
    { id: "b17", icon: "🦀", name: "King Crab", hp: 3960, time: 35, reward: 4900 },
    { id: "b18", icon: "🦂", name: "Scorpion Sting", hp: 4140, time: 35, reward: 5100 },
    { id: "b19", icon: "🕷️", name: "Spider Queen", hp: 4320, time: 35, reward: 5350 },
    { id: "b20", icon: "🐍", name: "Snake Supreme", hp: 4500, time: 35, reward: 5600 },
    { id: "b21", icon: "🦖", name: "T-Rex Terror", hp: 4680, time: 35, reward: 5850 },
    { id: "b22", icon: "🦕", name: "Brontosaurus Stomp", hp: 4860, time: 35, reward: 6100 },
    { id: "b23", icon: "🐲", name: "Baby Dragon", hp: 5040, time: 35, reward: 6300 },
    { id: "b24", icon: "🦅", name: "Eagle Eye", hp: 5220, time: 35, reward: 6550 },
    { id: "b25", icon: "🦉", name: "Owl of Doom", hp: 5400, time: 36, reward: 6800 },
    { id: "b26", icon: "🦇", name: "Bat Swarm", hp: 5580, time: 36, reward: 7050 },
    { id: "b27", icon: "🐝", name: "Queen Bee", hp: 5760, time: 36, reward: 7300 },
    { id: "b28", icon: "🦟", name: "Mega Mosquito", hp: 5940, time: 36, reward: 7500 },
    { id: "b29", icon: "🐀", name: "Rat King", hp: 6120, time: 36, reward: 7750 },
    { id: "b30", icon: "🐁", name: "Mouse Mayhem", hp: 6300, time: 36, reward: 8000 },
    { id: "b31", icon: "🦔", name: "Spiky Hedgehog", hp: 6480, time: 36, reward: 8250 },
    { id: "b32", icon: "🦡", name: "Badger Bash", hp: 6660, time: 36, reward: 8500 },
    { id: "b33", icon: "🦏", name: "Rhino Rammer", hp: 6840, time: 36, reward: 8700 },
    { id: "b34", icon: "🐘", name: "Elephant Quake", hp: 7020, time: 36, reward: 8950 },
    { id: "b35", icon: "🦬", name: "Bison Charge", hp: 7200, time: 37, reward: 9200 },
    { id: "b36", icon: "🐗", name: "Wild Boar", hp: 7380, time: 37, reward: 9450 },
    { id: "b37", icon: "🦌", name: "Antler Knight", hp: 7560, time: 37, reward: 9700 },
    { id: "b38", icon: "🐴", name: "Horse Hooves", hp: 7740, time: 37, reward: 9900 },
    { id: "b39", icon: "🦄", name: "Evil Unicorn", hp: 7920, time: 37, reward: 10150 },
    { id: "b40", icon: "🐸", name: "Frog Prince", hp: 8100, time: 37, reward: 10400 },
    { id: "b41", icon: "🐢", name: "Turtle Tank", hp: 8280, time: 37, reward: 10650 },
    { id: "b42", icon: "🦦", name: "Otter Chaos", hp: 8460, time: 37, reward: 10900 },
    { id: "b43", icon: "🦭", name: "Seal Slammer", hp: 8640, time: 37, reward: 11100 },
    { id: "b44", icon: "🐧", name: "Penguin General", hp: 8820, time: 37, reward: 11350 },
    { id: "b45", icon: "🦩", name: "Flamingo Fury", hp: 9000, time: 38, reward: 11600 },
    { id: "b46", icon: "👽", name: "Alien Overlord", hp: 9180, time: 38, reward: 11850 },
    { id: "b47", icon: "🛸", name: "UFO Mothership", hp: 9360, time: 38, reward: 12100 },
    { id: "b48", icon: "👾", name: "Pixel Invader", hp: 9540, time: 38, reward: 12300 },
    { id: "b49", icon: "🤡", name: "Creepy Clown", hp: 9720, time: 38, reward: 12550 },
    { id: "b50", icon: "👹", name: "Oni Brute", hp: 9900, time: 38, reward: 12800 },
    { id: "b51", icon: "👺", name: "Tengu Trickster", hp: 10080, time: 38, reward: 13050 },
    { id: "b52", icon: "💀", name: "Skeleton King", hp: 10260, time: 38, reward: 13300 },
    { id: "b53", icon: "🧟", name: "Zombie Horde", hp: 10440, time: 38, reward: 13500 },
    { id: "b54", icon: "🧛", name: "Count Clawula", hp: 10620, time: 38, reward: 13750 },
    { id: "b55", icon: "🧙", name: "Dark Wizard", hp: 10800, time: 39, reward: 14000 },
    { id: "b56", icon: "🧞", name: "Wild Genie", hp: 10980, time: 39, reward: 14250 },
    { id: "b57", icon: "🧜", name: "Sea Siren", hp: 11160, time: 39, reward: 14500 },
    { id: "b58", icon: "🎃", name: "Pumpkin Lord", hp: 11340, time: 39, reward: 14700 },
    { id: "b59", icon: "☃️", name: "Evil Snowman", hp: 11520, time: 39, reward: 14950 },
    { id: "b60", icon: "🌪️", name: "Tornado Titan", hp: 11700, time: 39, reward: 15200 },
    { id: "b61", icon: "🌋", name: "Volcano Beast", hp: 11880, time: 39, reward: 15450 },
    { id: "b62", icon: "⛈️", name: "Storm Bringer", hp: 12060, time: 39, reward: 15700 },
    { id: "b63", icon: "☄️", name: "Comet Crasher", hp: 12240, time: 39, reward: 15900 },
    { id: "b64", icon: "🌑", name: "Dark Moon", hp: 12420, time: 39, reward: 16150 },
    { id: "b65", icon: "☀️", name: "Solar Flare", hp: 12600, time: 40, reward: 16400 },
    { id: "b66", icon: "🔥", name: "Fire Elemental", hp: 12780, time: 40, reward: 16650 },
    { id: "b67", icon: "💧", name: "Water Elemental", hp: 12960, time: 40, reward: 16900 },
    { id: "b68", icon: "🪨", name: "Rock Golem", hp: 13140, time: 40, reward: 17100 },
    { id: "b69", icon: "🌵", name: "Cactus Knight", hp: 13320, time: 40, reward: 17350 },
    { id: "b70", icon: "🍄", name: "Mushroom Monarch", hp: 13500, time: 40, reward: 17600 },
    { id: "b71", icon: "🌳", name: "Angry Oak", hp: 13680, time: 40, reward: 17850 },
    { id: "b72", icon: "🥦", name: "Broccoli Boss", hp: 13860, time: 40, reward: 18100 },
    { id: "b73", icon: "🍕", name: "Pizza Tyrant", hp: 14040, time: 40, reward: 18300 },
    { id: "b74", icon: "🍔", name: "Burger Brute", hp: 14220, time: 40, reward: 18550 },
    { id: "b75", icon: "🌭", name: "Hot Dog Hero", hp: 14400, time: 41, reward: 18800 },
    { id: "b76", icon: "🍩", name: "Donut Destroyer", hp: 14580, time: 41, reward: 19050 },
    { id: "b77", icon: "🧁", name: "Cupcake Chaos", hp: 14760, time: 41, reward: 19300 },
    { id: "b78", icon: "🍦", name: "Ice Cream Menace", hp: 14940, time: 41, reward: 19500 },
    { id: "b79", icon: "🥒", name: "Pickle Rick-o", hp: 15120, time: 41, reward: 19750 },
    { id: "b80", icon: "🧀", name: "Big Cheese", hp: 15300, time: 41, reward: 20000 },
    { id: "b81", icon: "🥫", name: "Can Opener 3000", hp: 15480, time: 41, reward: 20250 },
    { id: "b82", icon: "🚿", name: "The Bath", hp: 15660, time: 41, reward: 20500 },
    { id: "b83", icon: "💦", name: "Water Spray Bottle", hp: 15840, time: 41, reward: 20700 },
    { id: "b84", icon: "🔔", name: "Collar Bell", hp: 16020, time: 41, reward: 20950 },
    { id: "b85", icon: "🩺", name: "The Vet", hp: 16200, time: 42, reward: 21200 },
    { id: "b86", icon: "✂️", name: "Nail Clipper", hp: 16380, time: 42, reward: 21450 },
    { id: "b87", icon: "🧽", name: "Sponge Scrubber", hp: 16560, time: 42, reward: 21700 },
    { id: "b88", icon: "📦", name: "Empty Box", hp: 16740, time: 42, reward: 21900 },
    { id: "b89", icon: "🪤", name: "Mouse Trap Mk II", hp: 16920, time: 42, reward: 22150 },
    { id: "b90", icon: "🎈", name: "Balloon Popper", hp: 17100, time: 42, reward: 22400 },
    { id: "b91", icon: "🎆", name: "Fireworks Fiend", hp: 17280, time: 42, reward: 22650 },
    { id: "b92", icon: "📱", name: "Phone Addict", hp: 17460, time: 42, reward: 22900 },
    { id: "b93", icon: "💻", name: "Laptop Hog", hp: 17640, time: 42, reward: 23100 },
    { id: "b94", icon: "🎮", name: "Controller Crusher", hp: 17820, time: 42, reward: 23350 },
    { id: "b95", icon: "🕹️", name: "Arcade Overlord", hp: 18000, time: 43, reward: 23600 },
    { id: "b96", icon: "🤖", name: "Robo-Maxwell 2.0", hp: 18180, time: 43, reward: 23850 },
    { id: "b97", icon: "🦾", name: "Cyber Claw", hp: 18360, time: 43, reward: 24100 },
    { id: "b98", icon: "🚀", name: "Rocket Rex", hp: 18540, time: 43, reward: 24300 },
    { id: "b99", icon: "⚡", name: "Thunder Cat", hp: 18720, time: 43, reward: 24550 },
    { id: "b100", icon: "❄️", name: "Frost Feline", hp: 18900, time: 43, reward: 24800 },
    { id: "b101", icon: "🌈", name: "Rainbow Rager", hp: 19080, time: 43, reward: 25050 },
    { id: "b102", icon: "👑", name: "The Cat King", hp: 19260, time: 43, reward: 25300 },
    { id: "b103", icon: "😈", name: "Shadow Maxwell", hp: 19440, time: 43, reward: 25500 },
    { id: "b104", icon: "🌌", name: "Galaxy Devourer", hp: 19620, time: 43, reward: 25750 },
    { id: "b105", icon: "♾️", name: "The Final Meow", hp: 19800, time: 44, reward: 26000 }
  ];
  function beaten() { const s = window.MG.save; s.bossBeaten = s.bossBeaten || []; return s.bossBeaten; }
  function unlocked(i) { return i === 0 || beaten().includes(BOSSES[i - 1].id); }
  function dmgPer() { const s = window.MG.save; const lv = (function () { try { return (s.xp ? Math.floor(Math.sqrt(s.xp / 15)) + 1 : 1); } catch (e) { return 1; } })(); return 4 + (s.pawPower || 1) + Math.floor(lv / 2); }

  function open() { const p = U.panel("bossOv", "👹 Boss Battles", "boss-head"); menu(p); }

  function menu(p) {
    let html = '<p class="ar-hint">Tap <b>ATTACK</b> fast to beat each boss before time runs out! Stronger Paw Power = more damage. Beat one to unlock the next.</p><div class="boss-grid">';
    BOSSES.forEach((b, i) => { const unl = unlocked(i), won = beaten().includes(b.id); html += '<button class="boss-tile' + (unl ? "" : " locked") + (won ? " won" : "") + '" data-i="' + i + '"' + (unl ? "" : " disabled") + '><span class="boss-ic">' + (unl ? b.icon : "🔒") + '</span><span class="boss-nm">' + b.name + '</span><span class="boss-sub">' + (won ? "✅ Beaten" : "❤️ " + b.hp + " HP · " + b.reward + " 🐟") + '</span></button>'; });
    html += "</div>";
    p.body.innerHTML = html;
    p.body.querySelectorAll(".boss-tile").forEach((t) => { if (!t.disabled) t.onclick = () => fight(p, BOSSES[+t.dataset.i]); });
  }

  function fight(p, boss) {
    let hp = boss.hp, time = boss.time, over = false, hits = 0;
    p.body.innerHTML = '<div class="boss-fight"><div class="boss-sprite" id="bossSprite">' + boss.icon + '</div>'
      + '<div class="boss-hpwrap"><div class="boss-hp" id="bossHp"></div></div>'
      + '<p class="boss-stat"><span id="bossHpN">' + hp + "/" + boss.hp + '</span> ❤️ · ⏱️ <b id="bossTime">' + time + '</b>s · 🗡️ ' + dmgPer() + '/hit</p>'
      + '<button class="btn asc-btn boss-attack" id="bossAtk">🗡️ ATTACK!</button><p class="ar-hint" id="bossMsg"></p></div>';
    const hpEl = p.body.querySelector("#bossHp"), hpN = p.body.querySelector("#bossHpN"), sprite = p.body.querySelector("#bossSprite");
    function paint() { hpEl.style.width = Math.max(0, hp / boss.hp * 100) + "%"; hpN.textContent = Math.max(0, hp) + "/" + boss.hp; }
    paint();
    p.body.querySelector("#bossAtk").onclick = () => {
      if (over) return;
      let d = dmgPer(); const crit = Math.random() < 0.15; if (crit) d *= 3;
      hp -= d; hits++; U.tone(crit ? 760 : 420, 0.04);
      sprite.classList.remove("hit"); void sprite.offsetWidth; sprite.classList.add("hit");
      if (crit) { const f = document.createElement("span"); f.className = "boss-crit"; f.textContent = "CRIT " + d + "!"; sprite.parentElement.appendChild(f); setTimeout(() => f.remove(), 600); }
      paint();
      if (hp <= 0) win();
    };
    const iv = setInterval(() => { if (over) { clearInterval(iv); return; } time--; const tEl = p.body.querySelector("#bossTime"); if (tEl) tEl.textContent = time; if (time <= 0) lose(); }, 1000);
    function win() { over = true; clearInterval(iv); const first = !beaten().includes(boss.id); if (first) beaten().push(boss.id); const rw = first ? boss.reward : Math.round(boss.reward / 3); window.MG.give(rw); try { window.MG.flag("bossbeat"); window.MG.boomSound(0.14); window.MG.meow(); } catch (e) {} window.MG.persist(); result(p, boss, "🎉 " + boss.name + " defeated!", "+" + rw + " 🐟" + (first ? " · new boss unlocked!" : "")); }
    function lose() { over = true; clearInterval(iv); window.MG.give(10); result(p, boss, "😿 " + boss.name + " survived!", "It had " + Math.max(0, hp) + " HP left. +10 🐟 for trying!"); }
    p.onClean(() => clearInterval(iv));
  }

  function result(p, boss, title, line) {
    p.body.innerHTML = '<div class="ar-result"><h2 class="ar-res-title">' + title + '</h2><p class="ar-score">' + line + '</p><div class="ar-res-btns"><button class="btn asc-btn" id="bossAgain">↻ Rematch</button><button class="btn" id="bossMenu">👹 Bosses</button></div></div>';
    p.body.querySelector("#bossAgain").onclick = () => fight(p, boss);
    p.body.querySelector("#bossMenu").onclick = () => menu(p);
  }
  window.MG_BOSS = { open: open };
  U.wire("bossBtn", open);
})();
