// ===== MaxwellGames: Safety & Privacy tab (honest, kid-friendly) =====
(function () {
  const U = window.MGUI;
  function open() {
    const p = U.panel("safetyOv", "🛡️ Safety & Privacy", "safety-head");
    p.body.innerHTML = `
      <div class="safety-wrap">
        <div class="safety-card good">
          <h3>✅ What MaxwellGames does NOT collect</h3>
          <ul>
            <li>❌ No names, emails, phone numbers, or passwords</li>
            <li>❌ No IP addresses or location tracking</li>
            <li>❌ No ads, no trackers, no spyware</li>
          </ul>
          <p>Your game progress is saved <b>only on your own device</b>. The only thing that can leave your device is a nickname + score if <b>you choose</b> to submit to the Leaderboard.</p>
        </div>

        <div class="safety-card">
          <h3>🌐 The honest truth about IP addresses</h3>
          <p><b>No website can hide your IP address</b> from the servers it connects to — that's just how the internet works. When you open a <b>game, proxy, or YouTube video</b> here, your browser talks directly to those other companies' servers, and they can see your device's internet address, exactly like if you visited them yourself.</p>
          <p>MaxwellGames itself never sees or stores it. If you want to hide your IP from everything, that needs a <b>VPN on your device</b> — a website can't do it for you.</p>
        </div>

        <div class="safety-card tips">
          <h3>😼 Stay safe online (anywhere, not just here)</h3>
          <ul>
            <li>🔒 Never share your real full name, address, school, phone, or passwords — not in games, chats, or forms.</li>
            <li>🙅 Don't click weird links or download random files.</li>
            <li>🧑‍🤝‍🧑 Tell a trusted adult if anything online makes you uncomfortable.</li>
            <li>💡 Keep suggestions fun — don't put personal info in the Suggestions form.</li>
          </ul>
        </div>

        <p class="ar-hint">MaxwellGames is just for fun. Play safe, be kind, and look out for your friends! 🐾</p>
      </div>`;
  }
  U.wire("safetyBtn", open);
})();
