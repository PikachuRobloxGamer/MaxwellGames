// ===== MaxwellGames live connection setup =====
// Leave this as null to use the free ntfy.sh service (no setup).
// To use Google Firebase instead, follow the steps, then REPLACE the
// line  window.MG_FIREBASE_CONFIG = null;  below with your real config.
//
// SETUP (free, ~5 min):
//  1. console.firebase.google.com -> sign in -> "Add project" (any name, Analytics off).
//  2. Left menu -> Build -> "Realtime Database" -> "Create Database".
//     Pick a location, choose "Start in TEST MODE", click Enable.
//     (IMPORTANT: test mode makes the rules allow read/write. If you picked
//      "locked mode" by mistake, open the "Rules" tab and set it to:
//        { "rules": { ".read": true, ".write": true } }  then Publish.)
//  3. Gear icon -> "Project settings" -> scroll to "Your apps" -> click "</>"
//     -> register a web app -> copy the firebaseConfig values.
//  4. Make sure "databaseURL" is included. If it's not shown, copy it from the
//     Realtime Database page (it looks like
//      https://your-project-default-rtdb.firebaseio.com  OR
//      https://your-project-default-rtdb.<region>.firebasedatabase.app ).
//     Use the EXACT url shown on that page.
//  5. Replace the whole line  window.MG_FIREBASE_CONFIG = null;  with your
//     config (see the example). Upload this file to GitHub and refresh.
//     The admin panel "Live status" should say "connected (Firebase)".
//
// COMMON MISTAKES:
//  - Still shows null because you pasted into the example comment below instead
//    of replacing the "= null;" line above it.
//  - databaseURL missing or slightly wrong -> it never connects.
//  - Rules not in test mode -> status says the rules are blocking it.

window.MG_FIREBASE_CONFIG = null;

/* EXAMPLE — replace the "= null;" line above with your own version of this:
window.MG_FIREBASE_CONFIG = {
  apiKey: "AIzaSy...your-key...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  appId: "1:1234567890:web:abcdef123456"
};
*/
