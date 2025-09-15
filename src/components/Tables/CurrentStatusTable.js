import React, { useState, useMemo } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const CurrentStatusTable = () => {
  const { data: currentStatus, loading, error } = useRealtimeData('current_status');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters to data
  const filteredData = useMemo(() => {
    // First deduplicate by user name, keeping the most recent activity
    const userMap = new Map();
    
    currentStatus.forEach(person => {
      const userName = person.full_name || person.user_name || person.user_id;
      const existingPerson = userMap.get(userName);
      const currentTime = new Date(person.last_update || person.last_action_time || person.timestamp || 0);
      const existingTime = existingPerson ? new Date(existingPerson.last_update || existingPerson.last_action_time || existingPerson.timestamp || 0) : new Date(0);
      
      if (!existingPerson || currentTime > existingTime) {
        userMap.set(userName, person);
      }
    });
    
    let filtered = Array.from(userMap.values());

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(person => person.status === statusFilter);
    }

    // User type filter
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(person => person.user_type === userTypeFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(person => {
        const fullName = person.full_name || person.user_name || '';
        const userId = person.user_id || '';
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               userId.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  }, [currentStatus, statusFilter, userTypeFilter, searchTerm]);

  const clearFilters = () => {
    setStatusFilter('all');
    setUserTypeFilter('all');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (userTypeFilter !== 'all') count++;
    if (searchTerm) count++;
    return count;
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

  const peopleInside = filteredData.filter(person => person.status === 'IN');
  const peopleOutside = filteredData.filter(person => person.status === 'OUT');
  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="table-container">
      <div className="table-header">
        <div>
          <h2>
            Current Status ({filteredData.length})
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
          <p className="table-description">Real-time presence status (showing latest activity per person)</p>
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

      {/* Integrated Filter Panel */}
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
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="all">All Status</option>
                <option value="IN">Inside Campus</option>
                <option value="OUT">Outside Campus</option>
              </select>
            </div>
            
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
          
          {activeFilterCount > 0 && (
            <div style={{ marginTop: '15px', padding: '10px', background: '#d4edda', borderRadius: '4px', fontSize: '0.9rem' }}>
              <strong>Active Filters:</strong>
              {statusFilter !== 'all' && <span style={{ marginLeft: '10px', background: '#28a745', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '0.8rem' }}>Status: {statusFilter === 'IN' ? 'Inside' : 'Outside'}</span>}
              {userTypeFilter !== 'all' && <span style={{ marginLeft: '10px', background: '#17a2b8', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '0.8rem' }}>Type: {userTypeFilter === 'GUEST' ? 'Visitors' : userTypeFilter}</span>}
              {searchTerm && <span style={{ marginLeft: '10px', background: '#ffc107', color: 'black', padding: '2px 6px', borderRadius: '3px', fontSize: '0.8rem' }}>Search: "{searchTerm}"</span>}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="table-stats" style={{ marginBottom: '20px' }}>
        <span className="stat-item">
          Total: {filteredData.length}
        </span>
        <span className="stat-item">
          Inside: {peopleInside.length}
        </span>
        <span className="stat-item">
          Outside: {peopleOutside.length}
        </span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>User Type</th>
              <th>Status</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((person) => (
              <tr 
                key={person.user_id || person.id}
                className={`status-${person.status.toLowerCase()}`}
              >
                <td>{person.user_id}</td>
                <td>{person.full_name || person.user_name || 'Unknown'}</td>
                <td>{getUserTypeBadge(person.user_type || 'Unknown')}</td>
                <td>{getStatusBadge(person.status)}</td>
                <td>{formatDate(person.last_update || person.last_action_time || person.timestamp)}</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  {activeFilterCount > 0 ? (
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
                  ) : (
                    <div>
                      <h4>No Status Records</h4>
                      <p>No status records found in the system.</p>
                    </div>
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

export default CurrentStatusTable;