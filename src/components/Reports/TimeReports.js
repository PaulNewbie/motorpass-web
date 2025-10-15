import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import LoadingSpinner from '../Common/LoadingSpinner';
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

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
  }, [applyFilters, timeTracking.length]);

const exportTimeReportXLSX = (data, dateFrom, dateTo) => {
  if (!Array.isArray(data) || data.length === 0) {
    alert("No records available to export.");
    return;
  }

  const worksheetData = [
    [`Time Report`],
    [`Date Range: ${dateFrom} → ${dateTo}`],
    [`Generated On: ${new Date().toLocaleString()}`],
    [],
    ["Date", "Time", "User ID", "Name", "Type", "Action"],
    ...data.map((record) => {
      const date = new Date(record.timestamp);
      const displayType = record.user_type === "GUEST" ? "VISITOR" : record.user_type;
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        record.user_id,
        record.user_name,
        displayType,
        record.action,
      ];
    }),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 36 },
    { wch: 12 },
    { wch: 10 },
  ];

  const border = {
    top: { style: "thin", color: { rgb: "AAAAAA" } },
    bottom: { style: "thin", color: { rgb: "AAAAAA" } },
    left: { style: "thin", color: { rgb: "AAAAAA" } },
    right: { style: "thin", color: { rgb: "AAAAAA" } },
  };

  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: "1F4E78" } },
    alignment: { horizontal: "center" },
  };

  const metaStyle = {
    font: { italic: true, color: { rgb: "555555" } },
    alignment: { horizontal: "center" },
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center", vertical: "center" },
    border,
  };

  const cellStyle = {
    border,
    alignment: { vertical: "center", horizontal: "center" },
  };

  const altRowStyle = {
    ...cellStyle,
    fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "F9FBFD" } },
  };

const range = XLSX.utils.decode_range(worksheet["!ref"]);

for (let R = range.s.r; R <= range.e.r; R++) {
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
    if (!worksheet[cellRef]) continue;

    // --- Title and metadata rows ---
    if (R === 0) worksheet[cellRef].s = titleStyle;
    else if (R === 1 || R === 2) worksheet[cellRef].s = metaStyle;
    // --- Header row ---
    else if (R === 4) worksheet[cellRef].s = headerStyle;
    // --- Data rows ---
    else {
      const rowDataIndex = R - 5; // Adjust for header offset
      const record = filteredData[rowDataIndex];

      // Alternate row styling
      const baseStyle = R % 2 === 0 ? altRowStyle : cellStyle;

      // Action column coloring (column F = index 5)
      if (C === 5 && record) {
        const actionColor =
          record.action === "IN"
            ? { rgb: "E2F0D9" } // light green background
            : record.action === "OUT"
            ? { rgb: "F8D7DA" } // light red background
            : null;

        worksheet[cellRef].s = {
          ...baseStyle,
          fill: actionColor
            ? { type: "pattern", patternType: "solid", fgColor: actionColor }
            : baseStyle.fill,
          font: {
            ...baseStyle.font,
            bold: true,
            color:
              record.action === "IN"
                ? { rgb: "006100" } // dark green text
                : record.action === "OUT"
                ? { rgb: "9C0006" } // dark red text
                : baseStyle.font?.color,
          },
        };
      } else {
        worksheet[cellRef].s = baseStyle;
      }
    }
  }
}


  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Time Report");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `time_report_${dateFrom}_to_${dateTo}.xlsx`);
};


  if (loading) return <LoadingSpinner />;

  const stats = {
    totalRecords: filteredData.length,
    inRecords: filteredData.filter(r => r.action === 'IN').length,
    outRecords: filteredData.filter(r => r.action === 'OUT').length,
    studentRecords: filteredData.filter(r => r.user_type === 'STUDENT').length,
    staffRecords: filteredData.filter(r => r.user_type === 'STAFF').length,
    visitorRecords: filteredData.filter(r => r.user_type === 'GUEST').length,
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
            <option value="GUEST">Visitors</option>
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
            onClick={() => exportTimeReportXLSX(filteredData, dateFrom, dateTo)}
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
          <h3>{stats.visitorRecords}</h3>
          <p>Visitors</p>
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
                      <span className={`user-type-badge ${(record.user_type === 'GUEST' ? 'visitor' : record.user_type).toLowerCase()}-type`}>
                        {record.user_type === 'GUEST' ? 'VISITOR' : record.user_type}
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