import React, { useState, useMemo } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const StaffTable = () => {
  const { data: staff, loading, error } = useRealtimeData('staff');
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(staff.map(member => member.staff_role))].filter(Boolean);
    return roles.sort();
  }, [staff]);

  // Apply filters to staff data
  const filteredStaff = useMemo(() => {
    let filtered = [...staff];

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.staff_role === roleFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.staff_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.staff_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.license_number && member.license_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.plate_number && member.plate_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [staff, roleFilter, searchTerm]);

  const clearFilters = () => {
    setRoleFilter('all');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (roleFilter !== 'all') count++;
    if (searchTerm) count++;
    return count;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="table-container">
      <div className="table-header">
        <div>
          <h2>
            Staff ({filteredStaff.length})
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
          {staff.length !== filteredStaff.length && (
            <p className="table-description">Showing {filteredStaff.length} of {staff.length} staff members</p>
          )}
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
                Role Filter
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
                Search Staff
              </label>
              <input
                type="text"
                placeholder="Search by name, staff no, role, license, or plate..."
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
              {roleFilter !== 'all' && <span style={{ marginLeft: '10px', background: '#6f42c1', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '0.8rem' }}>Role: {roleFilter}</span>}
              {searchTerm && <span style={{ marginLeft: '10px', background: '#ffc107', color: 'black', padding: '2px 6px', borderRadius: '3px', fontSize: '0.8rem' }}>Search: "{searchTerm}"</span>}
            </div>
          )}
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Staff No</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>License Number</th>
              <th>License Expiration</th>
              <th>Plate Number</th>
              <th>Enrolled Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => (
              <tr key={member.staff_no}>
                <td>{member.staff_no}</td>
                <td><strong>{member.full_name}</strong></td>
                <td>
                  <span className="role-badge" style={{ 
                    background: '#f3e5f5', 
                    color: '#6f42c1', 
                    padding: '4px 8px', 
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {member.staff_role}
                  </span>
                </td>
                <td>{member.license_number || 'N/A'}</td>
                <td>{member.license_expiration || 'N/A'}</td>
                <td>
                  {member.plate_number ? (
                    <span className="plate-number">{member.plate_number}</span>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{formatDate(member.enrolled_date)}</td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  {activeFilterCount > 0 ? (
                    <div>
                      <h4>No Results Found</h4>
                      <p>No staff members match your current filter criteria.</p>
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
                      <h4>No Staff Found</h4>
                      <p>No staff records found in the system.</p>
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

export default StaffTable;