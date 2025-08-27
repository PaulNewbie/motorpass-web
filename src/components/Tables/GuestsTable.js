import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const GuestsTable = () => {
  const { data: guests, loading, error } = useRealtimeData('guests');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Guests ({guests.length})</h2>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Guest ID</th>
              <th>Full Name</th>
              <th>Plate Number</th>
              <th>Office Visiting</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.guest_id || guest.id}>
                <td>{guest.guest_id || guest.id}</td>
                <td>{guest.full_name}</td>
                <td>{guest.plate_number}</td>
                <td>{guest.office_visiting}</td>
                <td>{formatDate(guest.created_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestsTable;