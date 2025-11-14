// src/components/Tables/OvertimeTable.js
import React, { useMemo, useState } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const OvertimeTable = () => {
  const { data: currentStatus, loading, error } = useRealtimeData('current_status');
  const { data: timeTracking, loading: timeTrackingLoading } = useRealtimeData('time_tracking');

  // Filter states
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter helper functions
  const clearFilters = () => {
    setUserTypeFilter('all');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (userTypeFilter !== 'all') count++;
    if (searchTerm) count++;
    return count;
  };

  const calculateDuration = (timeIn, timeOut) => {
    const now = new Date();
    if (!timeIn) return 'N/A';
    
    try {
      let inTime;
      if (timeIn && typeof timeIn.toDate === 'function') {
        inTime = timeIn.toDate();
      } else {
        inTime = new Date(timeIn);
      }

      let outTime;
      if (!timeOut) {
        outTime = now;
      } else if (timeOut && typeof timeOut.toDate === 'function') {
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

  const currentFlaggedUsers = useMemo(() => {
    if (!currentStatus) return [];

    const now = new Date();
    const currentHour = now.getHours();
    const overtimeStartHour = 18; 
    const durationThresholdMs = 12 * 60 * 60 * 1000; 
    const isAfterHours = currentHour >= overtimeStartHour || currentHour < 5;

    let allInUsers = currentStatus.filter(person => person.status === 'IN');

    // Apply filters
    if (userTypeFilter !== 'all') {
      allInUsers = allInUsers.filter(person => person.user_type === userTypeFilter);
    }

    if (searchTerm) {
      allInUsers = allInUsers.filter(person => {
        const fullName = person.full_name || person.user_name || '';
        const userId = person.user_id || '';
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               userId.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    const flaggedUsers = [];

    allInUsers.forEach(person => {
      let lastActionTime;
      try {
        const timeData = person.last_update || person.last_action_time || person.timestamp;
        if (timeData && typeof timeData.toDate === 'function') {
          lastActionTime = timeData.toDate();
        } else {
          lastActionTime = new Date(timeData);
        }
      } catch (e) {
        lastActionTime = new Date();
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
          entryTime: lastActionTime
        });
      }
    });
    
    return flaggedUsers.sort((a, b) => a.entryTime - b.entryTime);
  }, [currentStatus, userTypeFilter, searchTerm]);

  const recentFlaggedSessions = useMemo(() => {
    if (!timeTracking) return [];

    const todayStr = new Date().toISOString().split('T')[0];
    const durationThresholdMs = 12 * 60 * 60 * 1000;
    
    const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
    const relevantRecords = timeTracking.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return recordDate >= yesterday;
    });

    const sessions = {};
    [...relevantRecords].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(record => {
        const key = record.user_id; 
        if (!sessions[key]) {
            sessions[key] = {
                user_id: record.user_id,
                user_name: record.user_name,
                user_type: record.user_type,
                events: [],
                pairs: []
            };
        }
        sessions[key].events.push(record);
    });

    for (const key in sessions) {
        const userData = sessions[key];
        let lastIn = null;
        userData.events.forEach(event => {
            if (event.action === 'IN') {
                lastIn = event;
            } else if (event.action === 'OUT' && lastIn) {
                userData.pairs.push({ 
                    user_id: userData.user_id,
                    user_name: userData.user_name || event.user_name,
                    user_type: userData.user_type || event.user_type,
                    time_in: lastIn.timestamp, 
                    time_out: event.timestamp, 
                    status: 'OUT' 
                });
                lastIn = null;
            }
        });
    }
    
    let allCompletedSessions = Object.values(sessions).flatMap(s => s.pairs);

    // Apply filters
    if (userTypeFilter !== 'all') {
      allCompletedSessions = allCompletedSessions.filter(session => session.user_type === userTypeFilter);
    }

    if (searchTerm) {
      allCompletedSessions = allCompletedSessions.filter(session => {
        const fullName = session.user_name || '';
        const userId = session.user_id || '';
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               userId.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    const flaggedSessions = allCompletedSessions.filter(session => {
        const outDate = new Date(session.time_out).toISOString().split('T')[0];
        if (outDate !== todayStr) return false;

        const outHour = new Date(session.time_out).getHours();
        const isAfterHours = outHour >= 18 || outHour < 5;
        
        const durationMs = new Date(session.time_out) - new Date(session.time_in);
        const isOverDuration = durationMs > durationThresholdMs;

        if (isAfterHours || isOverDuration) {
            let reason = '';
            if (isAfterHours && isOverDuration) reason = 'After Hours & Long Duration';
            else if (isOverDuration) reason = 'Long Duration (> 12h)';
            else if (isAfterHours) reason = 'Timed Out After 6 PM';
            session.flagReason = reason;
            return true;
        }
        return false;
    });

    return flaggedSessions.sort((a, b) => new Date(b.time_out) - new Date(a.time_out));
  }, [timeTracking, userTypeFilter, searchTerm]);

  if (loading || timeTrackingLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const currentHour = new Date().getHours();
  const isCurrentlyAfterHours = currentHour >= 18 || currentHour < 5;
  const activeFilterCount = getActiveFilterCount();

  const getStatusBadge = (status) => (
    <span className={`status-badge ${status.toLowerCase()}`}>
      {status}
    </span>
  );

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

  const renderNoDataMessage = (isCurrent) => {
    if (activeFilterCount > 0) {
      return (
        <div>
          <h4>No Results Found</h4>
          <p>No users match your current filter criteria.</p>
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Clear Filters
          </button>
        </div>
      );
    }
    
    if (isCurrent) {
      return (
        <div>
          <h4>No Users Currently Flagged</h4>
          {isCurrentlyAfterHours ? (
            <p>No users are currently inside during overtime hours.</p>
          ) : (
            <p>It is not currently overtime hours (6 PM - 5 AM).</p>
          )}
        </div>
      );
    }
    
    return (
      <div>
        <h4>No Recent History</h4>
        <p>No users have been flagged after timing out today.</p>
      </div>
    );
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <div>
          <h2>
            Current Flagged Users ({currentFlaggedUsers.length})
            {activeFilterCount > 0 && (
              <span style={{ 
                fontSize: '0.8rem', 
                background: '#007bff', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '10px',
                marginLeft: '10px'
              }}>
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <p className="table-description">
            Users *currently inside* after 6:00 PM or for more than 12 hours.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 16px',
              background: showFilters ? '#dc3545' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            {showFilters ? '✕' : '🔍'} {showFilters ? 'Hide' : 'Filter'}
          </button>
          
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                padding: '6px 12px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
                User Type Filter
              </label>
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="all">All User Types</option>
                <option value="STUDENT">Students Only</option>
                <option value="STAFF">Staff Only</option>
                <option value="GUEST">Visitors Only</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
                Search Users
              </label>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>
      )}

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
            {currentFlaggedUsers.length > 0 ? (
              currentFlaggedUsers.map((person) => (
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
                      {calculateDuration(person.last_update || person.last_action_time || person.timestamp, null)}
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
                  {renderNoDataMessage(true)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-header" style={{ marginTop: '40px' }}>
        <h2>Recent Flagged History ({recentFlaggedSessions.length})</h2>
        <p className="table-description">
          Users who *timed out today* and were flagged for overtime.
        </p>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>User Type</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Duration</th>
              <th>Flag Reason</th>
            </tr>
          </thead>
          <tbody>
            {recentFlaggedSessions.length > 0 ? (
              recentFlaggedSessions.map((session, index) => (
                <tr key={session.user_id + session.time_out || index}>
                  <td>{session.user_name || 'Unknown'}</td>
                  <td>{getUserTypeBadge(session.user_type || 'Unknown')}</td>
                  <td>{formatDate(session.time_in)}</td>
                  <td>{formatDate(session.time_out)}</td>
                  <td>
                    <span className="duration">
                      {calculateDuration(session.time_in, session.time_out)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#c0392b', fontWeight: '600' }}>
                      {session.flagReason}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  {renderNoDataMessage(false)}
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