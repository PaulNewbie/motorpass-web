// src/config/firebase.js

// Initialize variables
let db = null;
let firebase = null;

// Shared Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIsC7_7QlWMukgNlrfSqyQJtdwo4jfxEg",
  authDomain: "motorpass-456a0.firebaseapp.com",
  projectId: "motorpass-456a0",
  storageBucket: "motorpass-456a0.firebasestorage.app",
  messagingSenderId: "4996326897",
  appId: "1:4996326897:web:30a3cb29a597649576d050"
};

// ✅ Step 1: Try Firebase v9+ (modular import)
try {
  // Use dynamic `await import()` — works with Netlify’s ESM bundler
  const firebaseAppModule = await import("firebase/app");
  const firestoreModule = await import("firebase/firestore");

  const app = firebaseAppModule.initializeApp(firebaseConfig);
  db = firestoreModule.getFirestore(app);

  console.log("✅ Firebase initialized using v9+ modular SDK");

} catch (error) {
  console.warn("⚠️ Firebase v9+ initialization failed, trying compat SDK:", error);

  // ✅ Step 2: Try Firebase v8 (compat SDK)
  try {
    const firebaseCompat = await import("firebase/compat/app");
    await import("firebase/compat/firestore");

    if (!firebaseCompat.apps.length) {
      firebaseCompat.initializeApp(firebaseConfig);
    }

    firebase = firebaseCompat;
    db = firebase.firestore();

    console.log("✅ Firebase initialized using v8 compat SDK");

  } catch (legacyError) {
    console.warn("⚠️ Firebase compat failed, trying legacy SDK:", legacyError);

    // ✅ Step 3: Try legacy Firebase (pre-compat)
    try {
      const firebaseOld = await import("firebase");

      if (!firebaseOld.apps.length) {
        firebaseOld.initializeApp(firebaseConfig);
      }

      firebase = firebaseOld;
      db = firebase.firestore();

      console.log("✅ Firebase initialized using legacy SDK");

    } catch (oldError) {
      console.error("❌ All Firebase initialization attempts failed:", error, legacyError, oldError);

      // ✅ Step 4: Mock database (non-breaking fallback)
      db = {
        collection: () => ({
          onSnapshot: (callback) => {
            callback({ docs: [] });
            return () => {};
          },
          orderBy: () => ({
            onSnapshot: (callback) => {
              callback({ docs: [] });
              return () => {};
            }
          })
        })
      };
    }
  }
}

export { db };
export default firebase;
