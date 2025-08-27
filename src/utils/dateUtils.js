// src/utils/dateUtils.js
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  try {
    let date;
    
    // Handle Firestore Timestamp
    if (dateInput && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } 
    // Handle regular Date object or date string
    else {
      date = new Date(dateInput);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format the date
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatTime = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  try {
    let date;
    
    if (dateInput && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};