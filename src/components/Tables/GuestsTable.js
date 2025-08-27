import React, { useState, useMemo, useCallback } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const GuestsTable = () => {
  const { data: guests, loading, error } = useRealtimeData('guests');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Function to get unique guests (latest entry for each name)
  const getUniqueGuests = useCallback(() => {
    if (!guests || guests.length === 0) return [];
    
    // Create a map to store the latest entry for each guest name
    const guestMap = new Map();
    
    guests.forEach(guest => {
      const guestName = guest.full_name?.trim().toUpperCase();
      if (!guestName) return;
      
      const currentDate = new Date(guest.created_date);
      
      // If we haven't seen this guest name before, or if this entry is more recent
      if (!guestMap.has(guestName)) {
        guestMap.set(guestName, guest);
      } else {
        const existingGuest = guestMap.get(guestName);
        const existingDate = new Date(existingGuest.created_date);
        
        // Keep the most recent entry
        if (currentDate > existingDate) {
          guestMap.set(guestName, guest);
        }
      }
    });
    
    // Convert map back to array and sort by most recent created_date
    return Array.from(guestMap.values()).sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  }, [guests]);

  // Apply filters to unique guests
  const filteredGuests = useMemo(() => {
    const uniqueGuests = getUniqueGuests();
    let filtered = [...uniqueGuests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(guest => 
        guest.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.office_visiting.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [getUniqueGuests, searchTerm]);

  const clearFilters = () => {
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    return searchTerm ? 1 : 0;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const uniqueGuests = getUniqueGuests();
  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="table-container">
      <div className="table-header">
        <div>
          <h2>
            Guests ({filteredGuests.length})
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
          <p className="table-description">Unique guest entries (latest information shown)</p>
          <div className="table-stats">
            <span className="stat-item">
              Total Entries: {guests.length}
            </span>
            <span className="stat-item">
              Unique Guests: {uniqueGuests.length}
            </span>
          </div>
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '15px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
                Search Guests
              </label>
              <input
                type="text"
                placeholder="Search by name, plate number, or office..."
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
              {searchTerm && <span style={{ marginLeft: '10px', background: '#ffc107', color: 'black', padding: '2px 6px', borderRadius: '3px', fontSize: '0.8rem' }}>Search: "{searchTerm}"</span>}
            </div>
          )}
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Guest ID</th>
              <th>Full Name</th>
              <th>Plate Number</th>
              <th>Office Visiting</th>
              <th>Latest Visit</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map((guest) => (
              <tr key={guest.guest_id || guest.id}>
                <td>{guest.guest_id || guest.id}</td>
                <td>
                  <span style={{ fontWeight: '600' }}>{guest.full_name}</span>
                </td>
                <td>
                  <span className="plate-number">{guest.plate_number}</span>
                </td>
                <td>{guest.office_visiting}</td>
                <td>{formatDate(guest.created_date)}</td>
              </tr>
            ))}
            {filteredGuests.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                  {activeFilterCount > 0 ? (
                    <div>
                      <h4>No Results Found</h4>
                      <p>No guests match your current search criteria.</p>
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
                      <h4>No Unique Guests Found</h4>
                      <p>No unique guest records found in the system.</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {guests.length !== uniqueGuests.length && (
        <div style={{ 
          padding: '15px', 
          background: '#e7f3ff', 
          borderRadius: '8px', 
          marginTop: '15px',
          border: '1px solid #b3d9ff',
          color: '#0056b3'
        }}>
          <strong>Note:</strong> Showing {filteredGuests.length} unique guests out of {guests.length} total entries. 
          Duplicate names have been filtered to show only the most recent visit information.
        </div>
      )}
    </div>
  );
};

export default GuestsTable;