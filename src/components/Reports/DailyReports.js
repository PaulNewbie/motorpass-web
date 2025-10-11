import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import * as XLSX from 'xlsx-js-style';

import { saveAs } from "file-saver";

const DailyReports = () => {
  const [selectedDate, setSelectedDate] = React.useState(
    new Date().toISOString().split('T')[0]
  );
  const [reportData, setReportData] = React.useState(null);

  const { data: timeTracking, loading, error } = useRealtimeData('time_tracking');
  const { data: currentStatus } = useRealtimeData('current_status');

  // Generate the report summary
  const generateDailyReport = React.useCallback(() => {
    if (!timeTracking || timeTracking.length === 0) return;

    const selectedDateRecords = timeTracking.filter((record) => {
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      return recordDate === selectedDate;
    });

    const stats = {
      totalActivities: selectedDateRecords.length,
      studentsIn: selectedDateRecords.filter(
        (r) => r.user_type === 'STUDENT' && r.action === 'IN'
      ).length,
      studentsOut: selectedDateRecords.filter(
        (r) => r.user_type === 'STUDENT' && r.action === 'OUT'
      ).length,
      staffIn: selectedDateRecords.filter(
        (r) => r.user_type === 'STAFF' && r.action === 'IN'
      ).length,
      staffOut: selectedDateRecords.filter(
        (r) => r.user_type === 'STAFF' && r.action === 'OUT'
      ).length,
      visitorsIn: selectedDateRecords.filter(
        (r) => r.user_type === 'GUEST' && r.action === 'IN'
      ).length,
      visitorsOut: selectedDateRecords.filter(
        (r) => r.user_type === 'GUEST' && r.action === 'OUT'
      ).length,
      currentlyInside: currentStatus
        ? currentStatus.filter((person) => person.status === 'IN').length
        : 0,
      activities: selectedDateRecords,
    };

    setReportData(stats);
  }, [timeTracking, selectedDate, currentStatus]);

  React.useEffect(() => {
    if (timeTracking && timeTracking.length > 0) {
      generateDailyReport();
    }
  }, [generateDailyReport, timeTracking]);

  // --- Export Excel (.xlsx) version ---
const exportReport = () => {
  if (!reportData) return;

  // --- Summary Data ---
  const summaryData = [
    ["Daily Report"],
    [`Date: ${selectedDate}`],
    [`Generated on: ${new Date().toLocaleString()}`],
    [],
    ["Metric", "Value"],
    ["Total Activities", reportData.totalActivities],
    ["Students In", reportData.studentsIn],
    ["Students Out", reportData.studentsOut],
    ["Staff In", reportData.staffIn],
    ["Staff Out", reportData.staffOut],
    ["Visitors In", reportData.visitorsIn],
    ["Visitors Out", reportData.visitorsOut],
    ["Currently Inside", reportData.currentlyInside],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // --- Detailed Activities ---
  const activityData = [
    ["Time", "User ID", "Full Name", "Type", "Action"],
    ...reportData.activities.map((a) => [
      new Date(a.timestamp).toLocaleString(),
      a.user_id,
      a.user_name,
      a.user_type === "GUEST" ? "VISITOR" : a.user_type,
      a.action,
    ]),
  ];
  const activitySheet = XLSX.utils.aoa_to_sheet(activityData);

  // --- Column Widths ---
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 18 }];
  activitySheet["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 34 },
    { wch: 14 },
    { wch: 10 },
  ];

  // --- Style Definitions ---
  const border = {
    top: { style: "thin", color: { rgb: "999999" } },
    bottom: { style: "thin", color: { rgb: "999999" } },
    left: { style: "thin", color: { rgb: "999999" } },
    right: { style: "thin", color: { rgb: "999999" } },
  };

  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: "1F4E78" } },
    alignment: { horizontal: "center" },
  };

  const metaStyle = {
    font: { italic: true, color: { rgb: "555555" } },
    alignment: { horizontal: "left" },
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "4472C4" } },
    border,
    alignment: { horizontal: "center", vertical: "center" },
  };

  const cellStyle = {
    border,
    alignment: { vertical: "center", horizontal: "center" },
  };

  const altRowStyle = {
    ...cellStyle,
    fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "F9F9F9" } },
  };

  // --- Apply Styles: Summary ---
  const sRange = XLSX.utils.decode_range(summarySheet["!ref"]);
  for (let R = sRange.s.r; R <= sRange.e.r; R++) {
    for (let C = sRange.s.c; C <= sRange.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!summarySheet[cellRef]) continue;

      if (R === 0) summarySheet[cellRef].s = titleStyle;
      else if (R === 1 || R === 2) summarySheet[cellRef].s = metaStyle;
      else if (R === 4) summarySheet[cellRef].s = headerStyle;
      else summarySheet[cellRef].s = cellStyle;
    }
  }

  // --- Apply Styles: Activity Sheet ---
  const aRange = XLSX.utils.decode_range(activitySheet["!ref"]);
  for (let R = aRange.s.r; R <= aRange.e.r; R++) {
    for (let C = aRange.s.c; C <= aRange.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!activitySheet[cellRef]) continue;

      // Header row
      if (R === 0) {
        activitySheet[cellRef].s = headerStyle;
      } else {
        const baseStyle = R % 2 === 0 ? altRowStyle : cellStyle;
        const record = reportData.activities[R - 1];

        // Color-code "Action" column (index 4)
        if (C === 4 && record) {
          const isIn = record.action === "IN";
          const isOut = record.action === "OUT";
          if (isIn || isOut) {
            activitySheet[cellRef].s = {
              ...baseStyle,
              fill: {
                type: "pattern",
                patternType: "solid",
                fgColor: { rgb: isIn ? "E2F0D9" : "F8D7DA" },
              },
              font: {
                bold: true,
                color: { rgb: isIn ? "006100" : "9C0006" },
              },
            };
          } else {
            activitySheet[cellRef].s = baseStyle;
          }
        } else {
          activitySheet[cellRef].s = baseStyle;
        }
      }
    }
  }

  // --- Workbook Creation ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, activitySheet, "Detailed Activities");

  XLSX.writeFile(
    wb,
    `daily_report_${selectedDate}.xlsx`
  );
};


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load report data." />;

  // Keep your original UI layout here
  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Daily Reports</h2>
        <div className="header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px',
              marginRight: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
          {reportData && (
            <button
              onClick={exportReport}
              style={{ width: '100%', padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Export Report
            </button>
          )}
        </div>
      </div>

      {reportData ? (
        <div>
          {/* Summary Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
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
                      <span
                        className={`user-type-badge ${
                          (activity.user_type === 'GUEST'
                            ? 'visitor'
                            : activity.user_type
                          ).toLowerCase()}-type`}
                      >
                        {activity.user_type === 'GUEST'
                          ? 'VISITOR'
                          : activity.user_type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`action-badge ${activity.action.toLowerCase()}`}
                      >
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
