let db = null;
let firebase = null;

try {
  // Try Firebase v9+ first
  const { initializeApp } = require('firebase/app');
  const { getFirestore } = require('firebase/firestore');
  
  const firebaseConfig = {
    apiKey: "AIzaSyCIsC7_7QlWMukgNlrfSqyQJtdwo4jfxEg",
    authDomain: "motorpass-456a0.firebaseapp.com",
    projectId: "motorpass-456a0",
    storageBucket: "motorpass-456a0.firebasestorage.app",
    messagingSenderId: "4996326897",
    appId: "1:4996326897:web:30a3cb29a597649576d050"
  };

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
} catch (error) {
  try {
    // Try Firebase v8 compat
    firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    
    const firebaseConfig = {
      apiKey: "AIzaSyCIsC7_7QlWMukgNlrfSqyQJtdwo4jfxEg",
      authDomain: "motorpass-456a0.firebaseapp.com",
      projectId: "motorpass-456a0",
      storageBucket: "motorpass-456a0.firebasestorage.app",
      messagingSenderId: "4996326897",
      appId: "1:4996326897:web:30a3cb29a597649576d050"
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    
  } catch (legacyError) {
    try {
      // Try old Firebase syntax
      const firebase = require('firebase');
      
      const firebaseConfig = {
        apiKey: "AIzaSyCIsC7_7QlWMukgNlrfSqyQJtdwo4jfxEg",
        authDomain: "motorpass-456a0.firebaseapp.com",
        projectId: "motorpass-456a0",
        storageBucket: "motorpass-456a0.firebasestorage.app",
        messagingSenderId: "4996326897",
        appId: "1:4996326897:web:30a3cb29a597649576d050"
      };

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      
    } catch (oldError) {
      console.error('All Firebase initialization attempts failed:', error, legacyError, oldError);
      
      // Create a mock database that returns empty data
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