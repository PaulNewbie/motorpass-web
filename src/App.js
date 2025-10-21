import React, { useState, useEffect } from 'react';
import Sidebar from './components/Navigation/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import StudentsTable from './components/Tables/StudentsTable';
import StaffTable from './components/Tables/StaffTable';
import GuestsTable from './components/Tables/GuestsTable';
import TimeTrackingTable from './components/Tables/TimeTrackingTable';
import CurrentStatusTable from './components/Tables/CurrentStatusTable';
import VipRecordsTable from './components/Tables/VipRecordsTable';
import TimeReports from './components/Reports/TimeReports';
import UserReports from './components/Reports/UserReports';
import Login from './components/Login/Login';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css';

function App() {
  const [activeTable, setActiveTable] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeTable) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentsTable />;
      case 'staff':
        return <StaffTable />;
      case 'guests':
        return <GuestsTable />;
      case 'time_tracking':
        return <TimeTrackingTable />;
      case 'current_status':
        return <CurrentStatusTable />;
      case 'vip_records':
        return <VipRecordsTable />;
      case 'time_reports':
        return <TimeReports />;
      case 'user_reports':
        return <UserReports />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Login setUser={setUser} />;
  }

  return (
    <div className="app">
      <Sidebar activeTable={activeTable} setActiveTable={setActiveTable} setUser={setUser} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;