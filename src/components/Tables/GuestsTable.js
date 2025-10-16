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
  const [selectedGuestName, setSelectedGuestName] = useState(null);

  // Function to get unique guests (latest entry for each name)
  const getUniqueGuests = useCallback(() => {
    if (!guests || guests.length === 0) return [];
    
    // Create a map to store the latest entry for each guest name
    const guestMap = new Map();
    
    guests.forEach(guest => {
      const guestName = guest.full_name?.replace(/[\s,]/g, '').toUpperCase();
      if (!guestName) return;
      
      const currentDate = new Date(guest.created_date);
      
      if (!guestMap.has(guestName)) {
        guestMap.set(guestName, guest);
      } else {
        const existingGuest = guestMap.get(guestName);
        const existingDate = new Date(existingGuest.created_date);
        
        if (currentDate > existingDate) {
          guestMap.set(guestName, guest);
        }
      }
    });
    
    return Array.from(guestMap.values()).sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  }, [guests]);

  // Apply filters to unique guests
  const filteredGuests = useMemo(() => {
    let filtered = getUniqueGuests();

    if (searchTerm) {
      filtered = filtered.filter(guest => 
        guest.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.office_visiting.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [getUniqueGuests, searchTerm]);
  
  const handleRowClick = (guestName) => {
    if (selectedGuestName === guestName) {
      setSelectedGuestName(null); // Hide if already showing
    } else {
      setSelectedGuestName(guestName);
    }
  };

  const getDuplicateEntries = (guestName) => {
    if (!guestName) return [];
    return guests.filter(g => g.full_name?.replace(/[\s,]/g, '').toUpperCase() === guestName.replace(/[\s,]/g, '').toUpperCase())
                 .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;


  return (
    <div className="table-container">
      <div className="table-header">
        <div>
          <h2>Visitors ({filteredGuests.length})</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ padding: '8px 16px', background: showFilters ? '#dc3545' : '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '500' }}
          >
            {showFilters ? '✕' : '🔍'} {showFilters ? 'Hide' : 'Filter'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e9ecef' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>Search Visitors</label>
            <input type="text" placeholder="Search by name, plate number, or office..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '0.9rem' }} />
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Plate Number</th>
              <th>Office Visiting</th>
              <th>Latest Visit</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map((guest) => (
              <React.Fragment key={guest.guest_id || guest.id}>
                <tr onClick={() => handleRowClick(guest.full_name)} style={{ cursor: 'pointer' }}>
                  <td><span style={{ fontWeight: '600' }}>{guest.full_name}</span></td>
                  <td><span className="plate-number">{guest.plate_number}</span></td>
                  <td>{guest.office_visiting}</td>
                  <td>{formatDate(guest.created_date)}</td>
                </tr>
                {selectedGuestName === guest.full_name && (
                  <tr>
                    <td colSpan="4" style={{ padding: '0', background: '#f8f9fa' }}>
                      <div style={{ padding: '20px' }}>
                        <h4 style={{ marginBottom: '10px' }}>All Entries for {guest.full_name}</h4>
                        <table className="data-table" style={{ background: 'white' }}>
                          <thead>
                            <tr>
                              <th>Plate Number</th>
                              <th>Office Visiting</th>
                              <th>Visit Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getDuplicateEntries(guest.full_name).map(entry => (
                              <tr key={entry.id}>
                                <td><span className="plate-number">{entry.plate_number}</span></td>
                                <td>{entry.office_visiting}</td>
                                <td>{formatDate(entry.created_date)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredGuests.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                  <h4>No Visitors Found</h4>
                  <p>No visitor records match your current filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestsTable;