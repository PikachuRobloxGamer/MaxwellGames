// ===== MaxwellGames: 🧪 AI LAB — a bunch of AI makers (bring-your-own Gemini key) =====
(function () {
  const U = window.MGUI;
  const KEY = "mg-sball-key";
  function getKey() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { if (k) localStorage.setItem(KEY, k); else localStorage.removeItem(KEY); } catch (e) {} }

  function ask(sys, userText, history) {
    const key = getKey();
    const contents = [];
    (history || []).forEach((h) => contents.push({ role: h.role, parts: [{ text: h.text }] }));
    contents.push({ role: "user", parts: [{ text: userText }] });
    const body = { systemInstruction: { parts: [{ text: sys + " Keep everything 100% safe, friendly, and appropriate for children. Never include anything violent, scary, adult, mean, or unsafe." }] }, contents: contents, generationConfig: { temperature: 1, maxOutputTokens: 600 } };
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const to = setTimeout(() => { if (ctrl) ctrl.abort(); }, 18000);
    return fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + encodeURIComponent(key), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then((r) => r.json()).then((j) => { clearTimeout(to); const c = j && j.candidates && j.candidates[0]; const txt = c && c.content && c.content.parts && c.content.parts[0] && c.content.parts[0].text; if (!txt) throw new Error("no reply"); return txt.trim(); }).catch((e) => { clearTimeout(to); throw e; });
  }

  const R = (a) => a[Math.random() * a.length | 0];
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "Maxwell";

  const TOOLS = [
    { id: "story", icon: "📖", name: "Story Maker", tag: "write a tale", ph: "a cat astronaut who finds a planet of fish",
      sys: "You are a children's story writer. Write a fun, vivid short story (about 150-220 words) based on the user's idea. Give it a title.",
      fb: (p) => "✨ " + cap(p || "Maxwell's Adventure") + " ✨\n\nOnce upon a time, " + (p || "a brave little cat named Maxwell") + " set off on an amazing adventure. Along the way they met silly friends, solved a tricky puzzle, and found a giant pile of treats 🐟. With a happy meow, they knew today was the best day ever!\n\n(Add a free AI key with ⚙️ for longer, smarter stories!)" },
    { id: "adventure", icon: "🎮", name: "Text Adventure", tag: "you decide!", chat: true, ph: "Type what you do next...",
      sys: "You run a kid-friendly choose-your-own text adventure starring the player as a hero cat named Maxwell. Describe the scene in 2-4 sentences, then offer 2-3 choices. Keep it exciting but safe. React to whatever the player types.",
      intro: "🌟 You are Maxwell, a brave adventurer cat! You stand at the edge of the Whisker Woods. A sparkly path leads left, a cave glows ahead, and you hear a splash to the right.\n\nWhat do you do?",
      fb: (p) => "You " + (p || "look around") + ". Suddenly, a friendly firefly appears and shows you a shortcut to a treasure chest full of 🐟! Do you open it, keep exploring, or make a wish?\n\n(Add a free AI key with ⚙️ for a smarter adventure!)" },
    { id: "rap", icon: "🎤", name: "Rap & Song", tag: "drop a beat", ph: "about winning at video games",
      sys: "You are a playful kids' rapper. Write a short, clean, rhyming rap or song (2 verses) about the user's topic. Make it fun and bouncy.",
      fb: (p) => "🎤 Yo! This one's " + (p ? "about " + p : "for Maxwell") + "!\n\nI'm the coolest cat, yeah I'm on a roll,\nStacking up the fish, that's my only goal,\nMeow meow, watch me go,\nMaxwellGames champion, now you know!\n\n(Add a free AI key with ⚙️ for custom bars!)" },
    { id: "names", icon: "🏷️", name: "Name Generator", tag: "gamertags & more", ph: "a cool gamertag with 'shadow'",
      sys: "You are a creative name generator. Give the user a list of 8 awesome, creative names based on their request (gamertags, pet names, usernames, team names, etc.). Number them.",
      fb: (p) => { const adj = ["Shadow", "Turbo", "Mega", "Pixel", "Cosmic", "Neon", "Frost", "Blaze", "Ghost", "Golden"], noun = ["Claw", "Whisker", "Fang", "Paw", "Striker", "Pouncer", "Byte", "Comet", "Ninja", "Legend"]; let o = "Here are some ideas" + (p ? " for '" + p + "'" : "") + ":\n"; for (let i = 1; i <= 8; i++) o += i + ". " + R(adj) + R(noun) + (Math.random() < 0.5 ? (Math.random() * 90 + 10 | 0) : "") + "\n"; return o + "\n(Add a free AI key with ⚙️ for smarter names!)"; } },
    { id: "creature", icon: "🐾", name: "Creature Creator", tag: "invent a monster", ph: "a fire-and-ice dragon cat",
      sys: "You are a creature designer for a kids' game. Invent an original creature from the user's idea. Give it a NAME, a TYPE, 3 stats (HP, Attack, Speed out of 100), a special move, and a one-line description. Format it nicely with emoji.",
      fb: (p) => { const t = p || "Mystery Beast"; return "✨ " + cap(t.split(" ")[0]) + "mon ✨\nType: " + (p || "Normal") + "\n❤️ HP: " + (50 + (Math.random() * 50 | 0)) + "\n⚔️ Attack: " + (50 + (Math.random() * 50 | 0)) + "\n💨 Speed: " + (50 + (Math.random() * 50 | 0)) + "\n🌟 Special Move: Mega " + cap(R(["Pounce", "Blast", "Storm", "Slash", "Beam"])) + "\nA legendary creature that loves treats and adventure!\n\n(Add a free AI key with ⚙️ for wilder creatures!)"; } },
    { id: "riddle", icon: "🧩", name: "Riddle Maker", tag: "brain teaser", ph: "an easy riddle about cats",
      sys: "You are a riddle master. Create ONE fun, kid-friendly riddle based on the request. Put the answer at the very end after the label 'Answer:' so it can be hidden.",
      fb: () => R(["I have whiskers and I purr, I chase a mouse and have soft fur. What am I?\nAnswer: A cat!", "The more you take, the more you leave behind. What am I?\nAnswer: Footsteps!", "I'm full of keys but can't open a door. What am I?\nAnswer: A piano!"]) + "\n\n(Add a free AI key with ⚙️ for endless riddles!)" },
    { id: "wyr", icon: "🤔", name: "Would You Rather", tag: "tough choices", ph: "silly food choices",
      sys: "You generate fun, kid-friendly 'Would You Rather' questions. Give 3 of them based on the theme, each as 'Would you rather A or B?'.",
      fb: () => "1. Would you rather have cat ears or a cat tail?\n2. Would you rather eat only pizza or only ice cream forever?\n3. Would you rather be able to fly or be invisible?\n\n(Add a free AI key with ⚙️ for custom ones!)" },
    { id: "trivia", icon: "❓", name: "Trivia Maker", tag: "quiz anyone", ph: "space facts",
      sys: "You make trivia. Create 3 multiple-choice trivia questions on the topic, each with 3 options (A/B/C) and the correct answer labeled after. Keep it kid-friendly and educational.",
      fb: (p) => "Topic: " + (p || "cats") + "\n\n1. How many hours a day do cats sleep?\nA) 2  B) 12-16  C) 24\nAnswer: B\n\n2. A group of cats is called a...?\nA) Clowder  B) Pack  C) Herd\nAnswer: A\n\n(Add a free AI key with ⚙️ for any topic!)" },
    { id: "joke", icon: "😹", name: "Joke Machine", tag: "custom jokes", ph: "a joke about dinosaurs",
      sys: "You are a kids' comedian. Tell 2 short, clean, funny jokes about the user's topic. Use emoji.",
      fb: (p) => "Why did the " + (p || "cat") + " sit on the computer? 🖱️\nTo keep an eye on the mouse!\n\nWhat do you call a sleepy " + (p || "cat") + "? A purr-illow! 😴\n\n(Add a free AI key with ⚙️ for fresh jokes!)" },
    { id: "pep", icon: "💬", name: "Pep Talk Cat", tag: "get hyped", ph: "I have a big test tomorrow",
      sys: "You are an encouraging, warm cat coach. Give the user a short, genuine, uplifting pep talk (2-3 sentences) about what they shared. Be kind and motivating, never over-the-top.",
      fb: () => R(["You've got this! 🐾 Every champion started exactly where you are now. Take a deep breath and go show them what you can do!", "Paws up! 😺 You're braver and smarter than you think. One step at a time and you'll get there!"]) + "\n\n(Add a free AI key with ⚙️ for personal pep talks!)" }
  ];

  function open() {
    const p = U.panel("ailabOv", "🧪 Maxwell AI Lab", "ailab-head");
    hub(p);
  }

  function hub(p) {
    p.body.className = "arcade-body mgui-body menu";
    p.body.innerHTML = '<p class="ar-hint">AI tools to <b>make stuff</b>! Add a free Google AI key (⚙️) to power them up — they also work in fun mode without one. <button class="btn ai2-gear" id="labGear" style="padding:4px 10px">⚙️ AI Key</button></p><div class="ar-grid" id="labGrid"></div>';
    const grid = p.body.querySelector("#labGrid");
    TOOLS.forEach((t) => { const b = document.createElement("button"); b.className = "ar-tile is-new"; b.innerHTML = '<span class="ar-ic">' + t.icon + '</span><span class="ar-name">' + t.name + '</span><span class="ar-best">' + t.tag + '</span>'; b.onclick = () => tool(p, t); grid.appendChild(b); });
    p.body.querySelector("#labGear").onclick = () => keyDialog(p.body);
  }

  function keyDialog(host) {
    const has = !!getKey();
    const d = document.createElement("div"); d.className = "ai2-keybox"; d.style.marginTop = "10px";
    d.innerHTML = '<p>Paste a free <b>Google Gemini</b> API key to power up every AI tool. Stored <b>only in your browser</b>.</p><input class="sball-input" id="labKey" placeholder="AIza..."><div class="ai2-keybtns"><a class="btn" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get a free key</a><button class="btn asc-btn" id="labSave">Save</button>' + (has ? '<button class="btn" id="labClear">Remove</button>' : '') + '</div>';
    host.appendChild(d); d.scrollIntoView();
    d.querySelector("#labSave").onclick = () => { setKey(d.querySelector("#labKey").value.trim()); d.remove(); U.toast("🔑", "Saved!", "AI tools powered up!"); };
    if (has) d.querySelector("#labClear").onclick = () => { setKey(""); d.remove(); U.toast("🔑", "Removed", "Back to fun mode."); };
  }

  function tool(p, t) {
    p.body.className = "arcade-body mgui-body";
    p.body.innerHTML = '<button class="btn ar-back" id="labBack">← AI Lab</button><h3 class="lab-title">' + t.icon + ' ' + t.name + '</h3>'
      + (t.chat ? '<div class="ai2-msgs" id="labChat"></div>' : '<div class="lab-out" id="labOut">' + (getKey() ? "Type an idea and hit Make it! ✨" : "Fun mode — type an idea and hit Make it!") + '</div>')
      + '<form class="ai2-form" id="labForm"><input class="sball-input" id="labIn" placeholder="' + t.ph + '" autocomplete="off"><button class="btn asc-btn" type="submit" id="labGo">' + (t.chat ? "Send" : "Make it!") + '</button></form>'
      + (t.chat ? '' : '<button class="btn" id="labCopy" style="margin-top:8px;display:none">📋 Copy</button>');
    p.body.querySelector("#labBack").onclick = () => hub(p);
    const inp = p.body.querySelector("#labIn");
    const history = [];

    if (t.chat) {
      const chat = p.body.querySelector("#labChat");
      const bubble = (txt, who) => { const d = document.createElement("div"); d.className = "ai2-msg " + who; d.textContent = txt; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d; };
      bubble(t.intro, "ai"); history.push({ role: "model", text: t.intro });
      p.body.querySelector("#labForm").onsubmit = (e) => {
        e.preventDefault(); const v = inp.value.trim(); if (!v) return; bubble(v, "me"); inp.value = ""; U.tone(500, 0.04);
        if (getKey()) { const typ = bubble("…", "ai"); typ.classList.add("ai2-typing"); typ.innerHTML = "<span></span><span></span><span></span>"; ask(t.sys, v, history).then((r) => { typ.remove(); bubble(r, "ai"); history.push({ role: "user", text: v }); history.push({ role: "model", text: r }); U.tone(700, 0.05); }).catch(() => { typ.remove(); bubble(t.fb(v), "ai"); }); }
        else { setTimeout(() => bubble(t.fb(v), "ai"), 300); }
      };
    } else {
      const out = p.body.querySelector("#labOut"), copy = p.body.querySelector("#labCopy");
      copy.onclick = () => { try { navigator.clipboard.writeText(out.textContent); U.toast("📋", "Copied!", ""); } catch (e) {} };
      p.body.querySelector("#labForm").onsubmit = (e) => {
        e.preventDefault(); const v = inp.value.trim(); U.tone(500, 0.04);
        const go = p.body.querySelector("#labGo");
        if (getKey()) { out.textContent = "Making it… ✨"; go.disabled = true; ask(t.sys, v || "surprise me", history).then((r) => { out.textContent = r; copy.style.display = "inline-block"; go.disabled = false; U.tone(760, 0.06); }).catch(() => { out.textContent = t.fb(v); copy.style.display = "inline-block"; go.disabled = false; }); }
        else { out.textContent = t.fb(v); copy.style.display = "inline-block"; U.tone(760, 0.06); }
      };
    }
    inp.focus();
  }

  window.MG_AILAB = { open: open };
  U.wire("ailabBtn", open);
})();
