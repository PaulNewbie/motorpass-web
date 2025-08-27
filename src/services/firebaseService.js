// src/services/firebaseService.js - Emergency version that works with any Firebase
import { db } from '../config/firebase';

// Detect Firebase version and create appropriate service
let firestoreOperations;

try {
  // Test if this is Firebase v9+ modular
  if (db && typeof db.collection !== 'function') {
    // Firebase v9+ modular - try to import functions
    const { collection, onSnapshot, query, orderBy } = require('firebase/firestore');
    
    firestoreOperations = {
      subscribe: (collectionName, callback, orderByField = null) => {
        try {
          let q;
          if (orderByField) {
            q = query(collection(db, collectionName), orderBy(orderByField, 'desc'));
          } else {
            q = query(collection(db, collectionName));
          }
          
          return onSnapshot(q, callback, (error) => {
            console.error(`Error fetching ${collectionName}:`, error);
          });
        } catch (error) {
          console.error('Firebase v9 operation failed:', error);
          callback({ docs: [] });
          return () => {};
        }
      }
    };
  } else {
    // Firebase v8 legacy or older
    firestoreOperations = {
      subscribe: (collectionName, callback, orderByField = null) => {
        try {
          let query = db.collection(collectionName);
          
          if (orderByField) {
            query = query.orderBy(orderByField, 'desc');
          }
          
          return query.onSnapshot(callback, (error) => {
            console.error(`Error fetching ${collectionName}:`, error);
          });
        } catch (error) {
          console.error('Firebase v8 operation failed:', error);
          callback({ docs: [] });
          return () => {};
        }
      }
    };
  }
} catch (error) {
  console.error('Firebase service initialization failed:', error);
  
  // Create a mock service that returns empty data
  firestoreOperations = {
    subscribe: (collectionName, callback, orderByField = null) => {
      console.warn(`Mock Firebase service: returning empty data for ${collectionName}`);
      setTimeout(() => {
        callback({ docs: [] });
      }, 100);
      return () => {};
    }
  };
}

export const firebaseService = {
  // Subscribe to real-time data updates from Firestore
  subscribeToCollection: (collectionName, callback, orderByField = null) => {
    return firestoreOperations.subscribe(collectionName, callback, orderByField);
  },

  // Get all students
  getStudents: (callback) => {
    return firebaseService.subscribeToCollection('students', callback);
  },

  // Get all staff
  getStaff: (callback) => {
    return firebaseService.subscribeToCollection('staff', callback);
  },

  // Get all guests
  getGuests: (callback) => {
    return firebaseService.subscribeToCollection('guests', callback, 'created_date');
  },

  // Get time tracking records (ordered by timestamp)
  getTimeTracking: (callback) => {
    return firebaseService.subscribeToCollection('time_tracking', callback, 'timestamp');
  },

  // Get current status
  getCurrentStatus: (callback) => {
    return firebaseService.subscribeToCollection('current_status', callback);
  },

  // Get VIP records (ordered by time_in)
  getVipRecords: (callback) => {
    return firebaseService.subscribeToCollection('vip_records', callback, 'time_in');
  }
};