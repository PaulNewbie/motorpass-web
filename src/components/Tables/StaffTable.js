import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const StaffTable = () => {
  const { data: staff, loading, error } = useRealtimeData('staff');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Staff ({staff.length})</h2>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Staff No</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>License Number</th>
              <th>License Expiration</th>
              <th>Plate Number</th>
              <th>Fingerprint Slot</th>
              <th>Enrolled Date</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.staff_no}>
                <td>{member.staff_no}</td>
                <td>{member.full_name}</td>
                <td>{member.staff_role}</td>
                <td>{member.license_number || 'N/A'}</td>
                <td>{member.license_expiration || 'N/A'}</td>
                <td>{member.plate_number || 'N/A'}</td>
                <td>{member.fingerprint_slot || 'N/A'}</td>
                <td>{formatDate(member.enrolled_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffTable;