// src/config/firebase.js
let db = null;
let firebase = null;

const firebaseConfig = {
  apiKey: "AIzaSyCIsC7_7QlWMukgNlrfSqyQJtdwo4jfxEg",
  authDomain: "motorpass-456a0.firebaseapp.com",
  projectId: "motorpass-456a0",
  storageBucket: "motorpass-456a0.firebasestorage.app",
  messagingSenderId: "4996326897",
  appId: "1:4996326897:web:30a3cb29a597649576d050"
};

// 🧩 Step 1: Try Firebase v9 Modular (default in your package.json)
try {
  const { initializeApp } = await import("firebase/app");
  const { getFirestore } = await import("firebase/firestore");

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("✅ Firebase initialized using v9+ modular SDK");
}
catch (error) {
  console.warn("⚠️ Firebase v9+ init failed. Trying compat SDK:", error);

  // 🧩 Step 2: Try Firebase v8 compat version (for legacy)
  try {
    const firebaseCompat = await import("firebase/compat/app");
    await import("firebase/compat/firestore");

    if (!firebaseCompat.apps.length) {
      firebaseCompat.initializeApp(firebaseConfig);
    }

    firebase = firebaseCompat;
    db = firebase.firestore();
    console.log("✅ Firebase initialized using v8 compat SDK");
  }
  catch (legacyError) {
    console.error("⚠️ Compat SDK failed. Using mock Firestore.", legacyError);

    // 🧩 Step 3: Mock fallback (so the app doesn’t crash)
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

export { db };
export default firebase;
