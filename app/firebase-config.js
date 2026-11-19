/* ============================================================
   STEP 1 OF SETUP: PASTE YOUR FIREBASE KEYS HERE
   Replace the whole block between the curly brackets with the
   "firebaseConfig" block that Firebase shows you (Setup Guide, Part 4).
   Until you do, the app runs in DEMO MODE (data stays on this device).
   ============================================================ */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyChAOpNEwdeodqXcEh49Wk_aUgEuOiYPwM",
  authDomain: "lotus-interview.firebaseapp.com",
  projectId: "lotus-interview",
  storageBucket: "lotus-interview.firebasestorage.app",
  messagingSenderId: "623041105884",
  appId: "1:623041105884:web:b580097128be95e62dc919"
};

/* Settings you can safely change */
const SETTINGS = {
  cooldownDays: 30,          // days before the same post can be attempted again
  durationMin: 20,           // test length in minutes
  showScoreToCandidate: false, // true = candidate sees their score after submitting
  maxCvMB: 2,                // largest CV file accepted
  // posts a fresher (no work experience) may apply for. Remove a post from this list to require experience.
  fresherPosts: ['sales', 'cashier', 'accountant', 'logistics', 'ea', 'hr', 'marketing'],
  demoAdminPassword: "lotus" // admin password in DEMO MODE only
};

export { FIREBASE_CONFIG, SETTINGS };
