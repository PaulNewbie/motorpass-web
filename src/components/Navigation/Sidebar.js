import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTable, setActiveTable }) => {
  const [isUsersOpen, setIsUsersOpen] = React.useState(false);
  const [isReportsOpen, setIsReportsOpen] = React.useState(false);

  const menuItems = [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      type: 'single'
    },
    {
      key: 'users',
      label: 'Users',
      icon: '👥',
      type: 'dropdown',
      isOpen: isUsersOpen,
      setIsOpen: setIsUsersOpen,
      children: [
        { key: 'students', label: 'Students', icon: '👨‍🎓' },
        { key: 'staff', label: 'Staff', icon: '👔' },
        { key: 'guests', label: 'Guests', icon: '🧑‍💼' }
      ]
    },
    { 
      key: 'current_status', 
      label: 'Current Status', 
      icon: '📍',
      type: 'single'
    },
    { 
      key: 'vip_records', 
      label: 'VIP Records', 
      icon: '⭐',
      type: 'single'
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: '📈',
      type: 'dropdown',
      isOpen: isReportsOpen,
      setIsOpen: setIsReportsOpen,
      children: [
        { key: 'daily_reports', label: 'Daily Reports', icon: '📋' },
        { key: 'time_reports', label: 'Time Reports', icon: '⏰' },
        { key: 'user_reports', label: 'User Reports', icon: '👥' }
      ]
    }
  ];

  const handleItemClick = (item) => {
    if (item.type === 'dropdown') {
      item.setIsOpen(!item.isOpen);
    } else {
      setActiveTable(item.key);
    }
  };

  const handleChildClick = (childKey) => {
    setActiveTable(childKey);
  };

  const isActiveItem = (itemKey) => {
    if (itemKey === 'users') {
      return ['students', 'staff', 'guests'].includes(activeTable);
    }
    if (itemKey === 'reports') {
      return ['daily_reports', 'time_reports', 'user_reports'].includes(activeTable);
    }
    return activeTable === itemKey;
  };

  return (
    <div className="sidebar">
      <div className="real-time-indicator"></div>
      
      <div className="sidebar-header">
        <h2>MotorPass System</h2>
        <p className="subtitle">Real-time Monitoring</p>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <div key={item.key} className="nav-group">
            <button
              className={`nav-item ${isActiveItem(item.key) ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.type === 'dropdown' && (
                <span className="nav-arrow">
                  {item.isOpen ? '▼' : '▶'}
                </span>
              )}
            </button>
            
            {item.type === 'dropdown' && item.isOpen && (
              <div className="nav-dropdown">
                {item.children.map(child => (
                  <button
                    key={child.key}
                    className={`nav-child ${activeTable === child.key ? 'active' : ''}`}
                    onClick={() => handleChildClick(child.key)}
                  >
                    <span className="nav-icon">{child.icon}</span>
                    <span className="nav-label">{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;