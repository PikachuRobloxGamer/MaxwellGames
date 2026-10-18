// ===== MaxwellGames live connection setup =====
// Leave this as null to use the free ntfy.sh service (no setup needed).
// To use Google Firebase instead (works on networks that block ntfy.sh, and
// won't get cut off from normal use), paste your Firebase config below.
//
// HOW TO GET YOUR FIREBASE CONFIG (free, ~5 minutes):
//  1. Go to https://console.firebase.google.com and sign in with a Google account.
//  2. Click "Add project", give it any name, and finish (you can turn Analytics off).
//  3. In the left menu click "Build" -> "Realtime Database" -> "Create Database".
//     Pick a location, then choose "Start in TEST MODE", and enable it.
//  4. Click the gear icon (top left) -> "Project settings".
//  5. Scroll to "Your apps", click the "</>" (web) icon, give it a nickname, click Register.
//  6. It shows a "firebaseConfig = { ... }" block. Copy the values into the object below.
//  7. Make sure "databaseURL" is included (it ends in firebaseio.com or firebasedatabase.app).
//     If you don't see it, come back after step 3 and copy it from the Realtime Database page.
//
// Then upload this file to GitHub and refresh the site. The admin panel's
// "Live status" should say "connected (Firebase)".

window.MG_FIREBASE_CONFIG = null;

/* EXAMPLE (replace every value with your own, then delete the slashes around it):
window.MG_FIREBASE_CONFIG = {
  apiKey: "AIzaSy...your-key...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  appId: "1:1234567890:web:abcdef123456"
};
*/
