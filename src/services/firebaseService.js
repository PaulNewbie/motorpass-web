// src/services/firebaseService.js
import { db } from '../config/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

// Modular Firestore operations (Firebase v9+)
const firestoreOperations = {
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
      console.error('Firebase operation failed:', error);
      callback({ docs: [] });
      return () => {};
    }
  }
};

export const firebaseService = {
  subscribeToCollection: (collectionName, callback, orderByField = null) =>
    firestoreOperations.subscribe(collectionName, callback, orderByField),

  getStudents: (callback) =>
    firestoreOperations.subscribe('students', callback),

  getStaff: (callback) =>
    firestoreOperations.subscribe('staff', callback),

  getGuests: (callback) =>
    firestoreOperations.subscribe('guests', callback, 'created_date'),

  getTimeTracking: (callback) =>
    firestoreOperations.subscribe('time_tracking', callback, 'timestamp'),

  getCurrentStatus: (callback) =>
    firestoreOperations.subscribe('current_status', callback),

  getVipRecords: (callback) =>
    firestoreOperations.subscribe('vip_records', callback, 'time_in')
};
