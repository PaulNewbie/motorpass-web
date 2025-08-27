import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import LoadingSpinner from '../Common/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const { data: students, loading: studentsLoading } = useRealtimeData('students');
  const { data: staff, loading: staffLoading } = useRealtimeData('staff');
  const { data: currentStatus, loading: statusLoading } = useRealtimeData('current_status');
  const { data: guests, loading: guestsLoading } = useRealtimeData('guests');

  if (studentsLoading || staffLoading || statusLoading || guestsLoading) {
    return <LoadingSpinner />;
  }

  const totalPeopleInside = currentStatus.filter(person => person.status === 'IN').length;
  const totalStudents = students.length;
  const totalStaff = staff.length;
  const totalGuests = guests.length;

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <div className="top-bar">
        <h1>MotorPass Dashboard</h1>
        <div className="user-info">
          <span className="status-indicator"></span>
          <span>Real-time Updates</span>
          <span>|</span>
          <span>System Online</span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>People Inside</h3>
            <span className="stat-number">{totalPeopleInside}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-info">
            <h3>Total Students</h3>
            <span className="stat-number">{totalStudents}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👔</div>
          <div className="stat-info">
            <h3>Total Staff</h3>
            <span className="stat-number">{totalStaff}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🧑‍💼</div>
          <div className="stat-info">
            <h3>Total Guests</h3>
            <span className="stat-number">{totalGuests}</span>
          </div>
        </div>
      </div>

      {/* Current Status Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Current Status Overview</h2>
        </div>
        <div className="status-summary">
          <div className="status-item">
            <span className="badge in">IN</span>
            <span>{currentStatus.filter(p => p.status === 'IN').length} people inside</span>
          </div>
          <div className="status-item">
            <span className="badge out">OUT</span>
            <span>{currentStatus.filter(p => p.status === 'OUT').length} people outside</span>
          </div>
        </div>
      </div>

      {/* People Currently Inside */}
      {totalPeopleInside > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">People Currently Inside</h2>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Last Update</th>
                </tr>
              </thead>
              <tbody>
                {currentStatus
                  .filter(person => person.status === 'IN')
                  .slice(0, 10)
                  .map((person, index) => (
                    <tr key={person.user_id || index}>
                      <td>{person.user_id}</td>
                      <td>{person.full_name}</td>
                      <td>
                        <span className={`badge ${(person.user_type || 'default').toLowerCase()}`}>
                          {person.user_type || 'Unknown'}
                        </span>
                      </td>
                      <td>{new Date(person.last_update || person.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;