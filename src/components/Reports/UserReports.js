// paulnewbie/motorpass-web/motorpass-web-main/src/components/Reports/UserReports.js
import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import LoadingSpinner from '../Common/LoadingSpinner';
import * as XLSX from "xlsx-js-style";

const UserReports = () => {
  const [selectedUserType, setSelectedUserType] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('name');
  const [sortDirection, setSortDirection] = React.useState('asc');

  const { data: students, loading: studentsLoading } = useRealtimeData('students');
  const { data: staff, loading: staffLoading } = useRealtimeData('staff');
  const { data: guests, loading: guestsLoading } = useRealtimeData('guests');
  const { data: timeTracking } = useRealtimeData('time_tracking');
  const { data: currentStatus } = useRealtimeData('current_status');

  const getAllUsers = React.useCallback(() => {
    let allUsers = [];

    if (selectedUserType === 'all' || selectedUserType === 'students') {
      const studentsWithActivity = students.map(student => {
        const userActivity = timeTracking.filter(record => record.user_id === student.student_id);
        const currentlyInside = currentStatus.find(status => 
          status.user_id === student.student_id && status.status === 'IN'
        );
        
        return {
          id: student.student_id,
          name: student.full_name,
          type: 'STUDENT',
          details: student.course,
          plateNumber: student.plate_number || 'N/A',
          totalActivities: userActivity.length,
          lastActivity: userActivity.length > 0 ? 
            userActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp : null,
          currentlyInside: !!currentlyInside,
        };
      });
      allUsers = [...allUsers, ...studentsWithActivity];
    }

    if (selectedUserType === 'all' || selectedUserType === 'staff') {
      const staffWithActivity = staff.map(staffMember => {
        const userActivity = timeTracking.filter(record => record.user_id === staffMember.staff_no);
        const currentlyInside = currentStatus.find(status => 
          status.user_id === staffMember.staff_no && status.status === 'IN'
        );
        
        return {
          id: staffMember.staff_no,
          name: staffMember.full_name,
          type: 'STAFF',
          details: staffMember.staff_role,
          plateNumber: staffMember.plate_number || 'N/A',
          totalActivities: userActivity.length,
          lastActivity: userActivity.length > 0 ? 
            userActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp : null,
          currentlyInside: !!currentlyInside,
        };
      });
      allUsers = [...allUsers, ...staffWithActivity];
    }

    if (selectedUserType === 'all' || selectedUserType === 'visitors') {
      const guestsWithActivity = guests.map(guest => {
        const guestId = `GUEST_${guest.plate_number}`;
        const userActivity = timeTracking.filter(record => record.user_id === guestId);
        const currentlyInside = currentStatus.find(status => 
          status.user_id === guestId && status.status === 'IN'
        );
        
        return {
          id: guestId,
          name: guest.full_name,
          type: 'VISITOR',
          details: guest.office_visiting,
          plateNumber: guest.plate_number,
          totalActivities: userActivity.length,
          lastActivity: userActivity.length > 0 ? 
            userActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp : null,
          currentlyInside: !!currentlyInside,
        };
      });
      allUsers = [...allUsers, ...guestsWithActivity];
    }

    // Apply search filter
    if (searchTerm) {
      allUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allUsers;
  }, [selectedUserType, searchTerm, students, staff, guests, timeTracking, currentStatus]);

  const sortedUsers = React.useMemo(() => {
    const users = getAllUsers();
    return [...users].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortBy === 'lastActivity') {
        const aTime = aValue ? new Date(aValue) : new Date(0);
        const bTime = bValue ? new Date(bValue) : new Date(0);
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [getAllUsers, sortBy, sortDirection]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return ' ↕';
    if (sortDirection === 'asc') return ' ▲';
    return ' ▼';
  };

const exportUserReport = () => {
    const users = sortedUsers;
    if (!Array.isArray(users) || users.length === 0) {
      alert("No user data available to export.");
      return;
    }
    
    const title = [["MotorPass System"]];
    const subtitle = [["User Report"]];
    const meta = [
      [`Generated on: ${new Date().toLocaleString()}`],
      [`Total Users: ${users.length}`],
    ];
    const headers = [
      [
        "User ID", "Name", "Type", "Details", "Plate Number",
        "Currently Inside", "Total Activities", "Last Activity",
      ],
    ];

    const data = users.map((user) => [
      user.id, user.name, user.type, user.details, user.plateNumber,
      user.currentlyInside ? "Yes" : "No", user.totalActivities,
      user.lastActivity ? new Date(user.lastActivity).toLocaleString() : "Never",
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([ ...title, ...subtitle, [], ...meta, [], ...headers, ...data ]);

    worksheet["!cols"] = [
      { wch: 20 }, { wch: 36 }, { wch: 12 }, { wch: 25 }, { wch: 16 },
      { wch: 16 }, { wch: 18 }, { wch: 24 },
    ];
    
    const headerColCount = headers[0].length - 1;
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headerColCount } }, // Main title
      { s: { r: 1, c: 0 }, e: { r: 1, c: headerColCount } }, // Subtitle
      { s: { r: 3, c: 0 }, e: { r: 3, c: headerColCount } }, // Meta 1
      { s: { r: 4, c: 0 }, e: { r: 4, c: headerColCount } }, // Meta 2
    ];

    const mainTitleStyle = { font: { bold: true, sz: 18, color: { rgb: "1F4E78" } }, alignment: { horizontal: "center", vertical: "center" } };
    const subtitleStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center", vertical: "center" } };
    const metaStyle = { font: { italic: true, color: { rgb: "555555" } }, alignment: { horizontal: "center" } };
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4472C4" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "center", vertical: "center" } };
    const cellStyle = { border: { top: { style: "thin", color: { rgb: "DDDDDD" } }, bottom: { style: "thin", color: { rgb: "DDDDDD" } }, left: { style: "thin", color: { rgb: "DDDDDD" } }, right: { style: "thin", color: { rgb: "DDDDDD" } } }, alignment: { horizontal: "center", vertical: "center" } };
    const altRowStyle = { ...cellStyle, fill: { fgColor: { rgb: "F9F9F9" } } };

    if(worksheet['A1']) worksheet['A1'].s = mainTitleStyle;
    if(worksheet['A2']) worksheet['A2'].s = subtitleStyle;
    if(worksheet['A4']) worksheet['A4'].s = metaStyle;
    if(worksheet['A5']) worksheet['A5'].s = metaStyle;

    const headerRowIndex = 6;
    const dataStartIndex = headerRowIndex + 1;

    for (let R = headerRowIndex; R < worksheet['!ref'].split(':')[1].replace(/\D/g, ''); R++) {
        for (let C = 0; C <= headerColCount; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cellRef]) continue;

            if (R === headerRowIndex) {
                worksheet[cellRef].s = headerStyle;
            } else {
                const baseStyle = (R - dataStartIndex) % 2 === 1 ? altRowStyle : cellStyle;
                worksheet[cellRef].s = baseStyle;

                const leftAlignCols = [1, 3, 7];
                if (leftAlignCols.includes(C)) {
                    worksheet[cellRef].s.alignment = { ...baseStyle.alignment, horizontal: "left" };
                }
            }
        }
    }

    const rowsPerPage = 40;
    const pageBreaks = [];
    for (let i = rowsPerPage; i < data.length; i += rowsPerPage) {
        pageBreaks.push({ r: dataStartIndex + i - 1 });
    }
    if (pageBreaks.length > 0) {
        worksheet['!pageBreaks'] = pageBreaks;
    }
    
    // Set page setup for A4 landscape
    worksheet['!pageSetup'] = { orientation: "landscape", paper: 9 };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Report");
    XLSX.writeFile(workbook, `User_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (studentsLoading || staffLoading || guestsLoading) return <LoadingSpinner />;

  const users = sortedUsers;
  const stats = {
    totalUsers: users.length,
    studentsCount: users.filter(u => u.type === 'STUDENT').length,
    staffCount: users.filter(u => u.type === 'STAFF').length,
    visitorsCount: users.filter(u => u.type === 'VISITOR').length,
    currentlyInside: users.filter(u => u.currentlyInside).length
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>User Reports</h2>
        <button onClick={exportUserReport} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
        <div>
          <label>User Type</label>
          <select value={selectedUserType} onChange={(e) => setSelectedUserType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <option value="all">All Users</option>
            <option value="students">Students Only</option>
            <option value="staff">Staff Only</option>
            <option value="visitors">Visitors Only</option>
          </select>
        </div>
        <div>
          <label>Sort By</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="totalActivities">Total Activities</option>
            <option value="lastActivity">Last Activity</option>
          </select>
        </div>
        <div>
          <label>Search</label>
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <h3 style={{ marginRight: '8px' }}>{stats.totalUsers}</h3><p>Total Users</p>
        </div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <h3 style={{ marginRight: '8px' }}>{stats.studentsCount}</h3><p>Students</p>
        </div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <h3 style={{ marginRight: '8px' }}>{stats.staffCount}</h3><p>Staff</p>
        </div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <h3 style={{ marginRight: '8px' }}>{stats.visitorsCount}</h3><p>Visitors</p>
        </div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <h3 style={{ marginRight: '8px' }}>{stats.currentlyInside}</h3><p>Currently Inside</p>
        </div>
      </div>

      {/* Users Table */}
      <div>
        <h3>User Details ({users.length} users)</h3>
        {users.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>User ID{getSortIcon('id')}</th>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name{getSortIcon('name')}</th>
                  <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>Type{getSortIcon('type')}</th>
                  <th onClick={() => handleSort('details')} style={{ cursor: 'pointer' }}>Details{getSortIcon('details')}</th>
                  <th onClick={() => handleSort('currentlyInside')} style={{ cursor: 'pointer' }}>Status{getSortIcon('currentlyInside')}</th>
                  <th onClick={() => handleSort('totalActivities')} style={{ cursor: 'pointer' }}>Total Activities{getSortIcon('totalActivities')}</th>
                  <th onClick={() => handleSort('lastActivity')} style={{ cursor: 'pointer' }}>Last Activity{getSortIcon('lastActivity')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} style={{ borderLeft: user.currentlyInside ? '4px solid #28a745' : '4px solid #6c757d' }}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td><span className={`user-type-badge ${user.type.toLowerCase()}-type`}>{user.type}</span></td>
                    <td>{user.details}</td>
                    <td><span className={`status-badge ${user.currentlyInside ? 'in' : 'out'}`}>{user.currentlyInside ? 'Inside' : 'Outside'}</span></td>
                    <td>{user.totalActivities}</td>
                    <td>
                      {user.lastActivity ? (
                        <span style={{ fontSize: '0.8rem' }}>
                          {new Date(user.lastActivity).toLocaleDateString()} {new Date(user.lastActivity).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span style={{ color: '#9e9e9e', fontStyle: 'italic' }}>Never</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No Users Found</h3>
            <p>No users match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReports;