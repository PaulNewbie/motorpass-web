import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import LoadingSpinner from '../Common/LoadingSpinner';

const TimeReports = () => {
  const [dateFrom, setDateFrom] = React.useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = React.useState(new Date().toISOString().split('T')[0]);
  const [userTypeFilter, setUserTypeFilter] = React.useState('all');
  const [actionFilter, setActionFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredData, setFilteredData] = React.useState([]);

  const { data: timeTracking, loading } = useRealtimeData('time_tracking');

  const applyFilters = React.useCallback(() => {
    let filtered = timeTracking.filter(record => {
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      return recordDate >= dateFrom && recordDate <= dateTo;
    });

    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(record => record.user_type === userTypeFilter);
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(record => record.action === actionFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }, [timeTracking, dateFrom, dateTo, userTypeFilter, actionFilter, searchTerm]);

  React.useEffect(() => {
    if (timeTracking.length > 0) {
      applyFilters();
    }
  }, [applyFilters]);

  const exportTimeReport = () => {
    const csvContent = [
      `Time Report - ${dateFrom} to ${dateTo}`,
      '',
      'Date,Time,User ID,Name,Type,Action',
      ...filteredData.map(record => {
        const date = new Date(record.timestamp);
        return `${date.toLocaleDateString()},${date.toLocaleTimeString()},${record.user_id},${record.user_name},${record.user_type},${record.action}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time_report_${dateFrom}_to_${dateTo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSpinner />;

  const stats = {
    totalRecords: filteredData.length,
    inRecords: filteredData.filter(r => r.action === 'IN').length,
    outRecords: filteredData.filter(r => r.action === 'OUT').length,
    studentRecords: filteredData.filter(r => r.user_type === 'STUDENT').length,
    staffRecords: filteredData.filter(r => r.user_type === 'STAFF').length,
    guestRecords: filteredData.filter(r => r.user_type === 'GUEST').length,
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Time Reports</h2>
        <p>Detailed time tracking analysis and filtering</p>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
        <div>
          <label>Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label>Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label>User Type</label>
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">All Types</option>
            <option value="STUDENT">Students</option>
            <option value="STAFF">Staff</option>
            <option value="GUEST">Guests</option>
          </select>
        </div>
        <div>
          <label>Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">All Actions</option>
            <option value="IN">Time In</option>
            <option value="OUT">Time Out</option>
          </select>
        </div>
        <div>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label>&nbsp;</label>
          <button 
            onClick={exportTimeReport} 
            disabled={filteredData.length === 0}
            style={{ width: '100%', padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="stat-card">
          <h3>{stats.totalRecords}</h3>
          <p>Total Records</p>
        </div>
        <div className="stat-card">
          <h3>{stats.inRecords}</h3>
          <p>Time In</p>
        </div>
        <div className="stat-card">
          <h3>{stats.outRecords}</h3>
          <p>Time Out</p>
        </div>
        <div className="stat-card">
          <h3>{stats.studentRecords}</h3>
          <p>Students</p>
        </div>
        <div className="stat-card">
          <h3>{stats.staffRecords}</h3>
          <p>Staff</p>
        </div>
        <div className="stat-card">
          <h3>{stats.guestRecords}</h3>
          <p>Guests</p>
        </div>
      </div>

      {/* Records Table */}
      <div>
        <h3>Time Records ({filteredData.length} records found)</h3>
        {filteredData.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 50).map((record, index) => (
                  <tr key={index}>
                    <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                    <td>{new Date(record.timestamp).toLocaleTimeString()}</td>
                    <td>{record.user_id}</td>
                    <td>{record.user_name}</td>
                    <td>
                      <span className={`user-type-badge ${record.user_type.toLowerCase()}-type`}>
                        {record.user_type}
                      </span>
                    </td>
                    <td>
                      <span className={`action-badge ${record.action.toLowerCase()}`}>
                        {record.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length > 50 && (
              <div style={{ padding: '15px', background: '#fff3cd', textAlign: 'center' }}>
                Showing first 50 records. Export for complete data.
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No Records Found</h3>
            <p>No time records match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeReports;