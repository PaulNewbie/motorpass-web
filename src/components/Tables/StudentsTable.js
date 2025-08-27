import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const StudentsTable = () => {
  const { data: students, loading, error } = useRealtimeData('students');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Students ({students.length})</h2>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Course</th>
              <th>License Number</th>
              <th>License Expiration</th>
              <th>Plate Number</th>
              <th>Fingerprint Slot</th>
              <th>Enrolled Date</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.student_id || student.id}>
                <td>{student.student_id}</td>
                <td>{student.full_name}</td>
                <td>{student.course}</td>
                <td>{student.license_number || 'N/A'}</td>
                <td>{student.license_expiration || 'N/A'}</td>
                <td>{student.plate_number || 'N/A'}</td>
                <td>{student.fingerprint_slot || 'N/A'}</td>
                <td>{formatDate(student.enrolled_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;