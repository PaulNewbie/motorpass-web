// src/components/Tables/CurrentStatusTable.js
import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const CurrentStatusTable = () => {
  const { data: currentStatus, loading, error } = useRealtimeData('current_status');

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
    return (
      <span className={`user-type-badge ${userType.toLowerCase()}-type`}>
        {userType}
      </span>
    );
  };

  // Filter and sort data
  const peopleInside = currentStatus.filter(person => person.status === 'IN');
  const peopleOutside = currentStatus.filter(person => person.status === 'OUT');

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Current Status ({currentStatus.length})</h2>
        <p className="table-description">Real-time presence status</p>
        <div className="table-stats">
          <span className="stat-item">
            Inside: {peopleInside.length}
          </span>
          <span className="stat-item">
            Outside: {peopleOutside.length}
          </span>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>User Type</th>
              <th>Status</th>
              <th>Last Update</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {currentStatus.map((person) => (
              <tr 
                key={person.user_id || person.id}
                className={`status-${person.status.toLowerCase()}`}
              >
                <td>{person.user_id}</td>
                <td>{person.full_name}</td>
                <td>{getUserTypeBadge(person.user_type || 'Unknown')}</td>
                <td>{getStatusBadge(person.status)}</td>
                <td>{formatDate(person.last_update || person.timestamp)}</td>
                <td>{person.location || 'Main Building'}</td>
              </tr>
            ))}
            {currentStatus.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  No status records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrentStatusTable;