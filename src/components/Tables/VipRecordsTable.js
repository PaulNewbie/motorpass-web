// src/components/Tables/VipRecordsTable.js
import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const VipRecordsTable = () => {
  const { data: vipRecords, loading, error } = useRealtimeData('vip_records');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status.toLowerCase()}`}>
        {status}
      </span>
    );
  };

  const calculateDuration = (timeIn, timeOut) => {
    if (!timeOut) return 'Active';
    
    try {
      let inTime, outTime;
      
      // Handle Firestore Timestamps
      if (timeIn && typeof timeIn.toDate === 'function') {
        inTime = timeIn.toDate();
      } else {
        inTime = new Date(timeIn);
      }
      
      if (timeOut && typeof timeOut.toDate === 'function') {
        outTime = timeOut.toDate();
      } else {
        outTime = new Date(timeOut);
      }
      
      const diffMs = outTime - inTime;
      
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

  // Sort by time_in (most recent first)
  const sortedVipRecords = [...vipRecords].sort((a, b) => {
    const aTime = a.time_in && typeof a.time_in.toDate === 'function' 
      ? a.time_in.toDate() 
      : new Date(a.time_in);
    const bTime = b.time_in && typeof b.time_in.toDate === 'function' 
      ? b.time_in.toDate() 
      : new Date(b.time_in);
    return bTime - aTime;
  });

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>VIP Records ({vipRecords.length})</h2>
        <p className="table-description">VIP visitor access logs</p>
        <div className="table-stats">
          <span className="stat-item">
            Active: {vipRecords.filter(record => record.status === 'IN').length}
          </span>
          <span className="stat-item">
            Completed: {vipRecords.filter(record => record.status === 'OUT').length}
          </span>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Plate Number</th>
              <th>Purpose</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedVipRecords.map((record) => (
              <tr 
                key={record.id} 
                className={`status-${record.status.toLowerCase()}`}
              >
                <td>{record.id}</td>
                <td>
                  <span className="plate-number">{record.plate_number}</span>
                </td>
                <td>{record.purpose || 'Visit'}</td>
                <td>{formatDate(record.time_in)}</td>
                <td>
                  {record.time_out ? 
                    formatDate(record.time_out) : 
                    <span className="no-data">Still inside</span>
                  }
                </td>
                <td>
                  <span className="duration">
                    {calculateDuration(record.time_in, record.time_out)}
                  </span>
                </td>
                <td>{getStatusBadge(record.status)}</td>
              </tr>
            ))}
            {vipRecords.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  No VIP records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VipRecordsTable;