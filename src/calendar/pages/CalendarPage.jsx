// Main calendar page component
import React, { useEffect } from 'react';
import { Box, Container, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

// Calendar components
import CalendarView from '../components/CalendarView';
import CalendarToolbar from '../components/CalendarToolbar';
import EventModal from '../components/EventModal';
import EventDetailsModal from '../components/EventDetailsModal';

// Store
import useCalendarStore from '../store/calendarStore';

function CalendarPage() {
  const { t } = useTranslation();

  const {
    currentDate,
    currentView,
    setCurrentDate,
    setDateRange
  } = useCalendarStore();

  // Initialize calendar with current date range
  useEffect(() => {
    const today = new Date();
    setCurrentDate(today);

    // Set initial date range based on current view
    const getInitialDateRange = (view, date) => {
      const currentDate = new Date(date);
      let start, end;

      switch (view) {
        case 'dayGridMonth':
          // Get first day of month, then go to start of week
          start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          start.setDate(start.getDate() - start.getDay());

          // Get last day of month, then go to end of week
          end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          end.setDate(end.getDate() + (6 - end.getDay()));
          break;

        case 'timeGridWeek':
        case 'listWeek':
          // Get start of week (Monday)
          start = new Date(currentDate);
          start.setDate(currentDate.getDate() - currentDate.getDay() + 1);

          // Get end of week (Sunday)
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          break;

        case 'timeGridDay':
          // Same day
          start = new Date(currentDate);
          end = new Date(currentDate);
          break;

        default:
          // Default to current month
          start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      }

      return { start, end };
    };

    const { start, end } = getInitialDateRange(currentView, today);
    setDateRange(start, end);
  }, [setCurrentDate, setDateRange, currentView]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        {/* Calendar Toolbar */}
        <CalendarToolbar />

        {/* Calendar Content */}
        <Paper
          elevation={1}
          sx={{
            flex: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <CalendarView />
        </Paper>

        {/* Modals */}
        <EventModal />
        <EventDetailsModal />
      </Box>
    </Container>
  );
}

export default CalendarPage;
