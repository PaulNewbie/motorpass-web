import React, { useState, useMemo } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './Tables.css';

const StudentsTable = () => {
  const { data: students, loading, error } = useRealtimeData('students');
  
  // Filter states
  const [courseFilter, setCourseFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique courses for filter dropdown
  const uniqueCourses = useMemo(() => {
    const courses = [...new Set(students.map(student => student.course))].filter(Boolean);
    return courses.sort();
  }, [students]);

  // Apply filters to students data
  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(student => student.course === courseFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.license_number && student.license_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.plate_number && student.plate_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [students, courseFilter, searchTerm]);

  const clearFilters = () => {
    setCourseFilter('all');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (courseFilter !== 'all') count++;
    if (searchTerm) count++;
    return count;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="table-container">
      <div className="table-header">
        <div>
          <h2>
            Students ({filteredStudents.length})
            {activeFilterCount > 0 && (
              <span style={{ 
                fontSize: '0.8rem', 
                background: '#007bff', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '10px',
                marginLeft: '10px'
              }}>
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          {students.length !== filteredStudents.length && (
            <p className="table-description">Showing {filteredStudents.length} of {students.length} students</p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 16px',
              background: showFilters ? '#dc3545' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            {showFilters ? '✕' : '🔍'} {showFilters ? 'Hide' : 'Filter'}
          </button>
          
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                padding: '6px 12px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Integrated Filter Panel */}
      {showFilters && (
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
                Course Filter
              </label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
                Search Students
              </label>
              <input
                type="text"
                placeholder="Search by name, ID, course, license, or plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
          
          {activeFilterCount > 0 && (
            <div style={{ marginTop: '15px', padding: '10px', background: '#d4edda', borderRadius: '4px', fontSize: '0.9rem' }}>
              <strong>Active Filters:</strong>
              {courseFilter !== 'all' && <span style={{ marginLeft: '10px', background: '#17a2b8', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '0.8rem' }}>Course: {courseFilter}</span>}
              {searchTerm && <span style={{ marginLeft: '10px', background: '#ffc107', color: 'black', padding: '2px 6px', borderRadius: '3px', fontSize: '0.8rem' }}>Search: "{searchTerm}"</span>}
            </div>
          )}
        </div>
      )}

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
              <th>Enrolled Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.student_id || student.id}>
                <td>{student.student_id}</td>
                <td><strong>{student.full_name}</strong></td>
                <td>
                  <span className="course-badge" style={{ 
                    background: '#e7f3ff', 
                    color: '#0056b3', 
                    padding: '4px 8px', 
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {student.course}
                  </span>
                </td>
                <td>{student.license_number || 'N/A'}</td>
                <td>{student.license_expiration || 'N/A'}</td>
                <td>
                  {student.plate_number ? (
                    <span className="plate-number">{student.plate_number}</span>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{formatDate(student.enrolled_date)}</td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  {activeFilterCount > 0 ? (
                    <div>
                      <h4>No Results Found</h4>
                      <p>No students match your current filter criteria.</p>
                      <button
                        onClick={clearFilters}
                        style={{
                          padding: '8px 16px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginTop: '10px'
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h4>No Students Found</h4>
                      <p>No student records found in the system.</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;