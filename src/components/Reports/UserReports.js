import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import LoadingSpinner from '../Common/LoadingSpinner';

const UserReports = () => {
  const [selectedUserType, setSelectedUserType] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('name');

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
          timeInToday: userActivity.filter(r => 
            new Date(r.timestamp).toDateString() === new Date().toDateString() && r.action === 'IN'
          ).length,
          timeOutToday: userActivity.filter(r => 
            new Date(r.timestamp).toDateString() === new Date().toDateString() && r.action === 'OUT'
          ).length
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
          timeInToday: userActivity.filter(r => 
            new Date(r.timestamp).toDateString() === new Date().toDateString() && r.action === 'IN'
          ).length,
          timeOutToday: userActivity.filter(r => 
            new Date(r.timestamp).toDateString() === new Date().toDateString() && r.action === 'OUT'
          ).length
        };
      });
      allUsers = [...allUsers, ...staffWithActivity];
    }

    if (selectedUserType === 'all' || selectedUserType === 'guests') {
      const guestsWithActivity = guests.map(guest => {
        const guestId = `GUEST_${guest.plate_number}`;
        const userActivity = timeTracking.filter(record => record.user_id === guestId);
        const currentlyInside = currentStatus.find(status => 
          status.user_id === guestId && status.status === 'IN'
        );
        
        return {
          id: guestId,
          name: guest.full_name,
          type: 'GUEST',
          details: guest.office_visiting,
          plateNumber: guest.plate_number,
          totalActivities: userActivity.length,
          lastActivity: userActivity.length > 0 ? 
            userActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp : null,
          currentlyInside: !!currentlyInside,
          timeInToday: userActivity.filter(r => 
            new Date(r.timestamp).toDateString() === new Date().toDateString() && r.action === 'IN'
          ).length,
          timeOutToday: userActivity.filter(r => 
            new Date(r.timestamp).toDateString() === new Date().toDateString() && r.action === 'OUT'
          ).length
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

    // Apply sorting
    allUsers.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'activities':
          return b.totalActivities - a.totalActivities;
        case 'lastActivity':
          if (!a.lastActivity && !b.lastActivity) return 0;
          if (!a.lastActivity) return 1;
          if (!b.lastActivity) return -1;
          return new Date(b.lastActivity) - new Date(a.lastActivity);
        default:
          return 0;
      }
    });

    return allUsers;
  }, [selectedUserType, searchTerm, sortBy, students, staff, guests, timeTracking, currentStatus]);

  const exportUserReport = () => {
    const users = getAllUsers();
    const csvContent = [
      'User Report',
      '',
      'User ID,Name,Type,Details,Plate Number,Total Activities,Currently Inside,Activities Today,Last Activity',
      ...users.map(user => 
        `${user.id},${user.name},${user.type},${user.details},${user.plateNumber},${user.totalActivities},${user.currentlyInside ? 'Yes' : 'No'},${user.timeInToday + user.timeOutToday},${user.lastActivity ? new Date(user.lastActivity).toLocaleString() : 'Never'}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `user_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (studentsLoading || staffLoading || guestsLoading) return <LoadingSpinner />;

  const users = getAllUsers();
  const stats = {
    totalUsers: users.length,
    studentsCount: users.filter(u => u.type === 'STUDENT').length,
    staffCount: users.filter(u => u.type === 'STAFF').length,
    guestsCount: users.filter(u => u.type === 'GUEST').length,
    currentlyInside: users.filter(u => u.currentlyInside).length,
    activeToday: users.filter(u => u.timeInToday > 0 || u.timeOutToday > 0).length
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
          <select
            value={selectedUserType}
            onChange={(e) => setSelectedUserType(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">All Users</option>
            <option value="students">Students Only</option>
            <option value="staff">Staff Only</option>
            <option value="guests">Guests Only</option>
          </select>
        </div>
        <div>
          <label>Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="activities">Total Activities</option>
            <option value="lastActivity">Last Activity</option>
          </select>
        </div>
        <div>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="stat-card">
          <h3>{stats.totalUsers}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h3>{stats.studentsCount}</h3>
          <p>Students</p>
        </div>
        <div className="stat-card">
          <h3>{stats.staffCount}</h3>
          <p>Staff</p>
        </div>
        <div className="stat-card">
          <h3>{stats.guestsCount}</h3>
          <p>Guests</p>
        </div>
        <div className="stat-card">
          <h3>{stats.currentlyInside}</h3>
          <p>Currently Inside</p>
        </div>
        <div className="stat-card">
          <h3>{stats.activeToday}</h3>
          <p>Active Today</p>
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
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Total Activities</th>
                  <th>Today</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} style={{ borderLeft: user.currentlyInside ? '4px solid #28a745' : '4px solid #6c757d' }}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>
                      <span className={`user-type-badge ${user.type.toLowerCase()}-type`}>
                        {user.type}
                      </span>
                    </td>
                    <td>{user.details}</td>
                    <td>
                      <span className={`status-badge ${user.currentlyInside ? 'in' : 'out'}`}>
                        {user.currentlyInside ? 'Inside' : 'Outside'}
                      </span>
                    </td>
                    <td>{user.totalActivities}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', background: '#f8f9fa', padding: '4px 8px', borderRadius: '10px' }}>
                        {user.timeInToday}↑ {user.timeOutToday}↓
                      </span>
                    </td>
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