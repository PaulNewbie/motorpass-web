// src/components/Tables/OvertimeTable.js
import React, { useMemo } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css'; // Reusing the existing table styles

const OvertimeTable = () => {
  const { data: currentStatus, loading, error } = useRealtimeData('current_status');

  // Get current time information
  const now = new Date();
  const currentHour = now.getHours();
  const overtimeStartHour = 18; // 6 PM
  const durationThresholdMs = 12 * 60 * 60 * 1000; // 12 hours
  const isAfterHours = currentHour >= overtimeStartHour;

  // Helper function to calculate duration from entry time until now
  const calculateDuration = (timeIn) => {
    if (!timeIn) return 'N/A';
    
    try {
      let inTime;
      // Handle Firestore Timestamps
      if (timeIn && typeof timeIn.toDate === 'function') {
        inTime = timeIn.toDate();
      } else {
        inTime = new Date(timeIn);
      }
      
      const diffMs = now - inTime;
      
      if (diffMs < 0) return 'Invalid';
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'Error';
    }
  };

  // Filter for users who are "IN" and meet either condition
  const overtimeUsers = useMemo(() => {
    if (!currentStatus) return [];

    const allInUsers = currentStatus.filter(person => person.status === 'IN');

    const flaggedUsers = [];

    allInUsers.forEach(person => {
      let lastActionTime;
      try {
        // Handle Firestore Timestamp
        const timeData = person.last_update || person.last_action_time || person.timestamp;
        if (timeData && typeof timeData.toDate === 'function') {
          lastActionTime = timeData.toDate();
        } else {
          lastActionTime = new Date(timeData);
        }
      } catch (e) {
        lastActionTime = new Date(); // Failsafe
      }
      
      const durationMs = now.getTime() - lastActionTime.getTime();
      const isOverDuration = durationMs > durationThresholdMs;
      
      let flagReason = '';
      if (isAfterHours && isOverDuration) {
          flagReason = 'After Hours & Long Duration';
      } else if (isOverDuration) {
          flagReason = 'Long Duration (> 12h)';
      } else if (isAfterHours) {
          flagReason = 'Inside After 6 PM';
      }

      if (isAfterHours || isOverDuration) {
        flaggedUsers.push({
          ...person,
          flagReason: flagReason,
          entryTime: lastActionTime // for sorting
        });
      }
    });
    
    // Sort by last action time, oldest first (longest duration)
    return flaggedUsers.sort((a, b) => {
        return a.entryTime - b.entryTime; 
    });

  }, [currentStatus, isAfterHours, now, durationThresholdMs]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status.toLowerCase()}`}>
        {status}
      </span>
    );
  };

  const getUserTypeBadge = (userType) => {
    const type = userType || 'Unknown';
    const displayType = type === 'GUEST' ? 'VISITOR' : type;
    const cssClass = type === 'GUEST' ? 'visitor' : type.toLowerCase();
    
    return (
      <span className={`user-type-badge ${cssClass}-type`}>
        {displayType}
      </span>
    );
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Overtime Monitoring</h2>
        <p className="table-description">
          Users currently inside after 6:00 PM or for more than 12 hours.
          ({overtimeUsers.length} users flagged)
        </p>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>User Type</th>
              <th>Status</th>
              <th>Time In (Last Action)</th>
              <th>Duration</th>
              <th>Flag Reason</th>
            </tr>
          </thead>
          <tbody>
            {overtimeUsers.length > 0 ? (
              overtimeUsers.map((person) => (
                <tr 
                  key={person.user_id || person.id}
                  className={`status-${person.status.toLowerCase()}`}
                >
                  <td>{person.user_id}</td>
                  <td>{person.full_name || person.user_name || 'Unknown'}</td>
                  <td>{getUserTypeBadge(person.user_type || 'Unknown')}</td>
                  <td>{getStatusBadge(person.status)}</td>
                  <td>{formatDate(person.last_update || person.last_action_time || person.timestamp)}</td>
                  <td>
                    <span className="duration">
                      {calculateDuration(person.last_update || person.last_action_time || person.timestamp)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#c0392b', fontWeight: '600' }}>
                      {person.flagReason}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <h4>No Users Flagged</h4>
                  {isAfterHours ? (
                    <p>All users have timed out for the day.</p>
                  ) : (
                    <p>No users have exceeded the 12-hour duration limit.</p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OvertimeTable;