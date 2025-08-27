import { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';

export const useRealtimeData = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let unsubscribe;

    const handleDataChange = (querySnapshot) => {
      try {
        const dataArray = [];
        querySnapshot.forEach((doc) => {
          dataArray.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setData(dataArray);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Error processing data');
        setLoading(false);
      }
    };

    // Subscribe to the appropriate collection
    try {
      switch (collectionName) {
        case 'students':
          unsubscribe = firebaseService.getStudents(handleDataChange);
          break;
        case 'staff':
          unsubscribe = firebaseService.getStaff(handleDataChange);
          break;
        case 'guests':
          unsubscribe = firebaseService.getGuests(handleDataChange);
          break;
        case 'time_tracking':
          unsubscribe = firebaseService.getTimeTracking(handleDataChange);
          break;
        case 'current_status':
          unsubscribe = firebaseService.getCurrentStatus(handleDataChange);
          break;
        case 'vip_records':
          unsubscribe = firebaseService.getVipRecords(handleDataChange);
          break;
        default:
          setError(`Unknown collection: ${collectionName}`);
          setLoading(false);
          return;
      }
    } catch (err) {
      setError(err.message || 'Subscription error');
      setLoading(false);
      return;
    }

    // Cleanup subscription on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [collectionName]);

  return { data, loading, error };
};