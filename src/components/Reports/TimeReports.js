import React, { useState, useMemo } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import LoadingSpinner from '../Common/LoadingSpinner';
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

const TimeReports = () => {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('time_in');
  const [sortDirection, setSortDirection] = useState('desc');

  const { data: timeTracking, loading: timeTrackingLoading } = useRealtimeData('time_tracking');
  const { data: currentStatus, loading: currentStatusLoading } = useRealtimeData('current_status');

  const processedData = useMemo(() => {
    if (!timeTracking || !currentStatus) return [];

    const filtered = timeTracking.filter(record => {
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      const passesDateFilter = recordDate >= dateFrom && recordDate <= dateTo;
      const passesUserTypeFilter = userTypeFilter === 'all' || record.user_type === userTypeFilter;
      const passesSearchFilter = !searchTerm ||
        (record.user_name && record.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.user_id && record.user_id.toLowerCase().includes(searchTerm.toLowerCase()));
        
      return passesDateFilter && passesUserTypeFilter && passesSearchFilter;
    });

    const sessions = {};

    [...filtered].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(record => {
      const key = `${record.user_id}-${new Date(record.timestamp).toISOString().split('T')[0]}`;
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
      const userDay = sessions[key];
      let lastIn = null;
      userDay.events.forEach(event => {
        if (event.action === 'IN') {
          if (lastIn) {
            userDay.pairs.push({ time_in: lastIn.timestamp, time_out: null, status: 'IN' });
          }
          lastIn = event;
        } else if (event.action === 'OUT' && lastIn) {
          userDay.pairs.push({ time_in: lastIn.timestamp, time_out: event.timestamp, status: 'OUT' });
          lastIn = null;
        }
      });
      if (lastIn) {
        userDay.pairs.push({ time_in: lastIn.timestamp, time_out: null, status: 'IN' });
      }
    }
    
    const finalData = Object.values(sessions).flatMap(s => s.pairs.map(p => ({ ...s, ...p })));

    // Sorting
    return finalData.sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      if (sortColumn === 'time_in' || sortColumn === 'time_out') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

  }, [timeTracking, currentStatus, dateFrom, dateTo, userTypeFilter, searchTerm, sortColumn, sortDirection]);
  
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return ' ↕';
    if (sortDirection === 'asc') return ' ▲';
    return ' ▼';
  };
  
  const calculateDuration = (timeIn, timeOut) => {
    if (!timeOut) return 'Active';
    try {
      const diffMs = new Date(timeOut) - new Date(timeIn);
      if (diffMs < 0) return 'Invalid';
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } catch (e) { return 'Error'; }
  };

  const exportTimeReportXLSX = (data) => {
    if (!data || data.length === 0) {
      alert("No records available to export.");
      return;
    }
    
    const worksheetData = [
      ["Time Report"],
      [`Date Range: ${dateFrom} → ${dateTo}`],
      [`Generated On: ${new Date().toLocaleString()}`],
      [],
      ["User ID", "Name", "Type", "Time In", "Time Out", "Duration", "Status"],
      ...data.map((session) => [
        session.user_id,
        session.user_name,
        session.user_type === "GUEST" ? "VISITOR" : session.user_type,
        new Date(session.time_in).toLocaleString(),
        session.time_out ? new Date(session.time_out).toLocaleString() : 'Active',
        calculateDuration(session.time_in, session.time_out),
        session.status,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [{ wch: 15 }, { wch: 36 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 10 }];
    
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4472C4" } }, alignment: { horizontal: "center" } };
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let R = 4; R < 5; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (worksheet[cellRef]) {
                worksheet[cellRef].s = headerStyle;
            }
        }
    }
    for (let R = 5; R <= range.e.r; R++) {
        const statusCellRef = XLSX.utils.encode_cell({ r: R, c: 6 });
        if(worksheet[statusCellRef] && worksheet[statusCellRef].v === 'IN') {
          worksheet[statusCellRef].s = { font: { color: { rgb: '006100' } }, fill: { fgColor: { rgb: 'E2F0D9' } } };
        } else if (worksheet[statusCellRef] && worksheet[statusCellRef].v === 'OUT') {
          worksheet[statusCellRef].s = { font: { color: { rgb: '9C0006' } }, fill: { fgColor: { rgb: 'F8D7DA' } } };
        }
    }
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Time Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `time_report_${dateFrom}_to_${dateTo}.xlsx`);
  };

  if (timeTrackingLoading || currentStatusLoading) return <LoadingSpinner />;

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Time Reports</h2>
        <p>Detailed time tracking analysis and filtering</p>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
        <div>
          <label>Date From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}/>
        </div>
        <div>
          <label>Date To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}/>
        </div>
        <div>
          <label>User Type</label>
          <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <option value="all">All Types</option>
            <option value="STUDENT">Students</option>
            <option value="STAFF">Staff</option>
            <option value="GUEST">Visitors</option>
          </select>
        </div>
        <div>
          <label>Search</label>
          <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}/>
        </div>
        <div>
          <label>&nbsp;</label>
          <button onClick={() => exportTimeReportXLSX(processedData)} disabled={processedData.length === 0} style={{ width: '100%', padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Export Report
          </button>
        </div>
      </div>
      
      <div>
        <h3>Time Records ({processedData.length} sessions found)</h3>
        {processedData.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('user_id')} style={{ cursor: 'pointer' }}>User ID{getSortIcon('user_id')}</th>
                  <th onClick={() => handleSort('user_name')} style={{ cursor: 'pointer' }}>Name{getSortIcon('user_name')}</th>
                  <th onClick={() => handleSort('user_type')} style={{ cursor: 'pointer' }}>Type{getSortIcon('user_type')}</th>
                  <th onClick={() => handleSort('time_in')} style={{ cursor: 'pointer' }}>Time In{getSortIcon('time_in')}</th>
                  <th onClick={() => handleSort('time_out')} style={{ cursor: 'pointer' }}>Time Out{getSortIcon('time_out')}</th>
                  <th>Duration</th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status{getSortIcon('status')}</th>
                </tr>
              </thead>
              <tbody>
                {processedData.slice(0, 100).map((session, index) => (
                  <tr key={index}>
                    <td>{session.user_id}</td>
                    <td>{session.user_name}</td>
                    <td><span className={`user-type-badge ${(session.user_type === 'GUEST' ? 'visitor' : session.user_type).toLowerCase()}-type`}>{session.user_type === 'GUEST' ? 'VISITOR' : session.user_type}</span></td>
                    <td>{new Date(session.time_in).toLocaleString()}</td>
                    <td>{session.time_out ? new Date(session.time_out).toLocaleString() : 'Still inside'}</td>
                    <td><span className="duration">{calculateDuration(session.time_in, session.time_out)}</span></td>
                    <td><span className={`status-badge ${session.status.toLowerCase()}`}>{session.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {processedData.length > 100 && <div style={{ padding: '15px', background: '#fff3cd', textAlign: 'center' }}>Showing first 100 sessions. Export for complete data.</div>}
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