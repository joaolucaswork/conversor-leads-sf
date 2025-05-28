// Page component for displaying the main calendar view
import React from 'react';
import CalendarView from '../components/CalendarView';

function CalendarPage() {
  return (
    <div>
      <h1>Calendar</h1>
      <CalendarView />
      {/* Future: Add event creation buttons, filters, etc. */}
    </div>
  );
}

export default CalendarPage;
