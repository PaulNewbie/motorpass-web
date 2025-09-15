import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';

const DailyReports = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = React.useState(null);

  const { data: timeTracking, loading } = useRealtimeData('time_tracking');
  const { data: currentStatus } = useRealtimeData('current_status');

  const generateDailyReport = React.useCallback(() => {
    const selectedDateRecords = timeTracking.filter(record => {
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      return recordDate === selectedDate;
    });

    const stats = {
      totalActivities: selectedDateRecords.length,
      studentsIn: selectedDateRecords.filter(r => r.user_type === 'STUDENT' && r.action === 'IN').length,
      studentsOut: selectedDateRecords.filter(r => r.user_type === 'STUDENT' && r.action === 'OUT').length,
      staffIn: selectedDateRecords.filter(r => r.user_type === 'STAFF' && r.action === 'IN').length,
      staffOut: selectedDateRecords.filter(r => r.user_type === 'STAFF' && r.action === 'OUT').length,
      visitorsIn: selectedDateRecords.filter(r => r.user_type === 'GUEST' && r.action === 'IN').length,
      visitorsOut: selectedDateRecords.filter(r => r.user_type === 'GUEST' && r.action === 'OUT').length,
      currentlyInside: currentStatus.filter(person => person.status === 'IN').length,
      activities: selectedDateRecords
    };

    setReportData(stats);
  }, [timeTracking, selectedDate, currentStatus]);

  React.useEffect(() => {
    if (timeTracking.length > 0) {
      generateDailyReport();
    }
  }, [generateDailyReport]);

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      'Daily Report - ' + selectedDate,
      '',
      'Summary Statistics',
      `Total Activities,${reportData.totalActivities}`,
      `Students In,${reportData.studentsIn}`,
      `Students Out,${reportData.studentsOut}`,
      `Staff In,${reportData.staffIn}`,
      `Staff Out,${reportData.staffOut}`,
      `Visitors In,${reportData.visitorsIn}`,
      `Visitors Out,${reportData.visitorsOut}`,
      `Currently Inside,${reportData.currentlyInside}`,
      '',
      'Detailed Activities',
      'Time,User ID,Name,Type,Action',
      ...reportData.activities.map(activity => 
        `${new Date(activity.timestamp).toLocaleString()},${activity.user_id},${activity.user_name},${activity.user_type === 'GUEST' ? 'VISITOR' : activity.user_type},${activity.action}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `daily_report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Daily Reports</h2>
        <div className="header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          {reportData && (
            <button onClick={exportReport} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {reportData ? (
        <div>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="stat-card">
              <h3>{reportData.totalActivities}</h3>
              <p>Total Activities</p>
            </div>
            <div className="stat-card">
              <h3>{reportData.studentsIn + reportData.studentsOut}</h3>
              <p>Student Activities</p>
            </div>
            <div className="stat-card">
              <h3>{reportData.staffIn + reportData.staffOut}</h3>
              <p>Staff Activities</p>
            </div>
            <div className="stat-card">
              <h3>{reportData.visitorsIn + reportData.visitorsOut}</h3>
              <p>Visitor Activities</p>
            </div>
            <div className="stat-card">
              <h3>{reportData.currentlyInside}</h3>
              <p>Currently Inside</p>
            </div>
          </div>

          {/* Activities Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reportData.activities.map((activity, index) => (
                  <tr key={index}>
                    <td>{new Date(activity.timestamp).toLocaleTimeString()}</td>
                    <td>{activity.user_id}</td>
                    <td>{activity.user_name}</td>
                    <td>
                      <span className={`user-type-badge ${(activity.user_type === 'GUEST' ? 'visitor' : activity.user_type).toLowerCase()}-type`}>
                        {activity.user_type === 'GUEST' ? 'VISITOR' : activity.user_type}
                      </span>
                    </td>
                    <td>
                      <span className={`action-badge ${activity.action.toLowerCase()}`}>
                        {activity.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Data Available</h3>
          <p>No activity records found for the selected date.</p>
        </div>
      )}
    </div>
  );
};

export default DailyReports;