// src/components/Tables/VipRecordsTable.js
import React, { useState, useMemo } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const VipRecordsTable = () => {
  const { data: vipRecords, loading, error } = useRealtimeData('vip_records');
  const [sortColumn, setSortColumn] = useState('time_in'); // Default sort column
  const [sortDirection, setSortDirection] = useState('desc'); // Default sort direction

  // Sorting logic
  const sortedVipRecords = useMemo(() => {
    if (!vipRecords) return [];

    const sorted = [...vipRecords].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle date/time sorting
      if (sortColumn === 'time_in' || sortColumn === 'time_out') {
        const aTime = aValue ? (typeof aValue.toDate === 'function' ? aValue.toDate() : new Date(aValue)) : new Date(0);
        const bTime = bValue ? (typeof bValue.toDate === 'function' ? bValue.toDate() : new Date(bValue)) : new Date(0);
        
        if (sortDirection === 'asc') {
          return aTime - bTime;
        } else {
          return bTime - aTime;
        }
      }

      // Handle string sorting for other columns
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return sorted;
  }, [vipRecords, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default to descending for a new column
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return ' ↕';
    if (sortDirection === 'asc') return ' ▲';
    return ' ▼';
  };
  
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
              <th onClick={() => handleSort('plate_number')} style={{cursor: 'pointer'}}>Plate Number{getSortIcon('plate_number')}</th>
              <th onClick={() => handleSort('purpose')} style={{cursor: 'pointer'}}>Purpose{getSortIcon('purpose')}</th>
              <th onClick={() => handleSort('time_in')} style={{cursor: 'pointer'}}>Time In{getSortIcon('time_in')}</th>
              <th onClick={() => handleSort('time_out')} style={{cursor: 'pointer'}}>Time Out{getSortIcon('time_out')}</th>
              <th>Duration</th>
              <th onClick={() => handleSort('status')} style={{cursor: 'pointer'}}>Status{getSortIcon('status')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedVipRecords.map((record) => (
              <tr 
                key={record.id} 
                className={`status-${record.status.toLowerCase()}`}
              >
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
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
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