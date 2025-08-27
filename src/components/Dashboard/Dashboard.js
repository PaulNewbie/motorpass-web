import React, { useMemo } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import LoadingSpinner from '../Common/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const { data: students, loading: studentsLoading } = useRealtimeData('students');
  const { data: staff, loading: staffLoading } = useRealtimeData('staff');
  const { data: currentStatus, loading: statusLoading } = useRealtimeData('current_status');
  const { data: guests, loading: guestsLoading } = useRealtimeData('guests');
  const { data: timeTracking } = useRealtimeData('time_tracking');

  // Deduplicate guests by name like in GuestsTable
  const uniqueGuests = useMemo(() => {
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
    
    // Convert map back to array
    return Array.from(guestMap.values());
  }, [guests]);

  // Deduplicate current status by user name, keeping most recent activity
  const uniqueCurrentStatus = useMemo(() => {
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
    return Array.from(userMap.values());
  }, [currentStatus]);

  // Get today's activity
  const todayActivity = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return timeTracking.filter(record => {
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      return recordDate === today;
    });
  }, [timeTracking]);

  if (studentsLoading || staffLoading || statusLoading || guestsLoading) {
    return <LoadingSpinner />;
  }

  const peopleCurrentlyInside = uniqueCurrentStatus.filter(person => person.status === 'IN');
  const todayEntries = todayActivity.filter(record => record.action === 'IN').length;
  const todayExits = todayActivity.filter(record => record.action === 'OUT').length;
  const peakHourData = getPeakHour(todayActivity);

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <div className="top-bar">
        <h1>MotorPass Dashboard</h1>
        <div className="user-info">
          <span className="status-indicator"></span>
          <span>Live Updates</span>
          <span>|</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card highlight-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>Currently Inside</h3>
            <span className="stat-number">{peopleCurrentlyInside.length}</span>
            <small>Active right now</small>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Today's Entries</h3>
            <span className="stat-number">{todayEntries}</span>
            <small>People who entered today</small>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📤</div>
          <div className="stat-info">
            <h3>Today's Exits</h3>
            <span className="stat-number">{todayExits}</span>
            <small>People who left today</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <h3>Peak Hour</h3>
            <span className="stat-number">{peakHourData.hour}</span>
            <small>{peakHourData.count} activities</small>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">System Overview</h2>
        </div>
        <div className="stats-grid">
          <div className="stat-card secondary">
            <div className="stat-icon">👨‍🎓</div>
            <div className="stat-info">
              <h3>Total Students</h3>
              <span className="stat-number">{students.length}</span>
            </div>
          </div>
          
          <div className="stat-card secondary">
            <div className="stat-icon">👔</div>
            <div className="stat-info">
              <h3>Total Staff</h3>
              <span className="stat-number">{staff.length}</span>
            </div>
          </div>
          
          <div className="stat-card secondary">
            <div className="stat-icon">🧑‍💼</div>
            <div className="stat-info">
              <h3>Total Guests</h3>
              <span className="stat-number">{uniqueGuests.length}</span>
            </div>
          </div>

          <div className="stat-card secondary">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Today's Activities</h3>
              <span className="stat-number">{todayActivity.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* People Currently Inside - Enhanced */}
      {peopleCurrentlyInside.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">People Currently Inside ({peopleCurrentlyInside.length})</h2>
            <div className="header-actions">
              <span className="live-indicator">🟢 Live</span>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Entry Time</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {peopleCurrentlyInside
                  .slice(0, 10)
                  .map((person, index) => {
                    const entryTime = new Date(person.last_update || person.last_action_time || person.timestamp);
                    const duration = calculateDuration(entryTime);
                    
                    return (
                      <tr key={person.user_id || index} className="inside-row">
                        <td>{person.user_id}</td>
                        <td>{person.full_name || person.user_name || 'Unknown'}</td>
                        <td>
                          <span className={`badge ${(person.user_type || 'default').toLowerCase()}`}>
                            {person.user_type || 'Unknown'}
                          </span>
                        </td>
                        <td>{entryTime.toLocaleTimeString()}</td>
                        <td>
                          <span className="duration-badge">{duration}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {peopleCurrentlyInside.length > 10 && (
              <div className="table-footer">
                <p>Showing 10 of {peopleCurrentlyInside.length} people inside. View all in Current Status.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats Summary */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Today's Summary</h2>
        </div>
        <div className="summary-stats">
          <div className="summary-item">
            <div className="summary-icon">📈</div>
            <div className="summary-content">
              <h4>Peak Activity</h4>
              <p>{peakHourData.hour} ({peakHourData.count} activities)</p>
            </div>
          </div>
          
          <div className="summary-item">
            <div className="summary-icon">🏢</div>
            <div className="summary-content">
              <h4>Campus Status</h4>
              <p>{peopleCurrentlyInside.length} people currently inside</p>
            </div>
          </div>
          
          <div className="summary-item">
            <div className="summary-icon">🔄</div>
            <div className="summary-content">
              <h4>Activity Ratio</h4>
              <p>{todayEntries} in / {todayExits} out</p>
            </div>
          </div>
        </div>
      </div>

      <div className="last-update">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

// Helper function to calculate duration
const calculateDuration = (entryTime) => {
  const now = new Date();
  const diffMs = now - entryTime;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Helper function to get peak hour
const getPeakHour = (activities) => {
  if (activities.length === 0) return { hour: '--:--', count: 0 };
  
  const hourCounts = {};
  activities.forEach(activity => {
    const hour = new Date(activity.timestamp).getHours();
    const hourKey = `${hour.toString().padStart(2, '0')}:00`;
    hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
  });
  
  let maxCount = 0;
  let peakHour = '--:--';
  
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = hour;
    }
  });
  
  return { hour: peakHour, count: maxCount };
};

export default Dashboard;