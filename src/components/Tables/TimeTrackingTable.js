// src/components/Tables/TimeTrackingTable.js
import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const TimeTrackingTable = () => {
  const { data: timeTracking, loading, error } = useRealtimeData('time_tracking');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const getActionBadge = (action) => {
    return (
      <span className={`action-badge ${action.toLowerCase()}`}>
        {action}
      </span>
    );
  };

  const getUserTypeBadge = (userType) => {
    return (
      <span className={`user-type-badge ${userType.toLowerCase()}-type`}>
        {userType}
      </span>
    );
  };

  // Sort by timestamp (most recent first)
  const sortedTimeTracking = [...timeTracking].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Time Tracking ({timeTracking.length})</h2>
        <p className="table-description">Real-time entry and exit logs</p>
        <div className="table-stats">
          <span className="stat-item">
            IN: {timeTracking.filter(record => record.action === 'IN').length}
          </span>
          <span className="stat-item">
            OUT: {timeTracking.filter(record => record.action === 'OUT').length}
          </span>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>User Type</th>
              <th>Action</th>
              <th>Timestamp</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {sortedTimeTracking.map((record) => (
              <tr 
                key={record.id || `${record.user_id}-${record.timestamp}`}
                className={`action-${record.action.toLowerCase()}`}
              >
                <td>{record.user_id}</td>
                <td>{record.full_name}</td>
                <td>{getUserTypeBadge(record.user_type || 'Unknown')}</td>
                <td>{getActionBadge(record.action)}</td>
                <td>{formatDate(record.timestamp)}</td>
                <td>{record.method || 'N/A'}</td>
              </tr>
            ))}
            {timeTracking.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  No time tracking records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeTrackingTable;