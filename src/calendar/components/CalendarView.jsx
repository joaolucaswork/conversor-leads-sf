// Component to render the FullCalendar instance
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Alert, CircularProgress, useTheme } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

// Calendar configuration and services
import {
  getCalendarOptions,
  getCalendarTheme,
  calendarCustomStyles
} from '../services/fullCalendarConfig';
import { fetchEvents } from '../services/calendarApiService';
import useCalendarStore from '../store/calendarStore';

// Utility function to calculate date range for current view
const getDateRangeForView = (view, currentDate) => {
  const date = new Date(currentDate);
  let start, end;

  switch (view) {
    case 'dayGridMonth':
      // Get first day of month, then go to start of week
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      start.setDate(start.getDate() - start.getDay());

      // Get last day of month, then go to end of week
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setDate(end.getDate() + (6 - end.getDay()));
      break;

    case 'timeGridWeek':
      // Get start of week (Monday)
      start = new Date(date);
      start.setDate(date.getDate() - date.getDay() + 1);

      // Get end of week (Sunday)
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      break;

    case 'timeGridDay':
      // Same day
      start = new Date(date);
      end = new Date(date);
      break;

    case 'listWeek':
      // Same as timeGridWeek
      start = new Date(date);
      start.setDate(date.getDate() - date.getDay() + 1);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      break;

    default:
      // Default to current month
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  return { start, end };
};

function CalendarView() {
  // 🚨 DEBUGGING: Verify component is rendering with latest code
  console.log('🔥 CalendarView RENDER START - Timestamp:', new Date().toISOString(), 'Random ID:', Math.random().toString(36).substr(2, 9));

  const { t } = useTranslation();
  const theme = useTheme();
  const calendarRef = useRef(null);

  // Calendar store
  const {
    events,
    currentView,
    currentDate,
    isLoading,
    error,
    filters,
    dateRange,
    setEvents,
    setCurrentView,
    setCurrentDate,
    setDateRange,
    setLoading,
    setError,
    openEventDetailsModal,
    openCreateEventModal,
    openEditEventModal,
    getFilteredEvents,
    clearError
  } = useCalendarStore();

  // Load events from API
  const loadEvents = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) {
      console.log('📅 CalendarView: Skipping loadEvents - no date range set');
      return;
    }

    try {
      console.log('📅 CalendarView: Starting to load events...', {
        dateRange: {
          start: dateRange.start?.toISOString(),
          end: dateRange.end?.toISOString()
        },
        filters,
        currentDate: currentDate?.toISOString(),
        currentView,
        authStore: useAuthStore.getState()
      });

      setLoading(true);
      clearError();

      const response = await fetchEvents(
        dateRange.start,
        dateRange.end,
        filters
      );

      console.log('📅 CalendarView: Events loaded successfully:', response);
      setEvents(response.events || []);
    } catch (err) {
      console.error('❌ CalendarView: Error loading calendar events:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        dateRange,
        filters
      });
      setError(err.message || 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters, setEvents, setLoading, setError, clearError]);

  // Event handlers - MUST be declared before useMemo hooks that reference them
  const handleDateClick = useCallback((info) => {
    console.log('Date clicked:', info.dateStr);
    // Open create event modal with selected date
    openCreateEventModal();
  }, [openCreateEventModal]);

  const handleEventClick = useCallback((info) => {
    console.log('Event clicked:', info.event);

    // Convert FullCalendar event to our event format
    const event = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      allDay: info.event.allDay,
      ...info.event.extendedProps
    };

    // Open event details modal
    openEventDetailsModal(event);
  }, [openEventDetailsModal]);

  const handleEventDrop = useCallback((info) => {
    console.log('Event dropped:', info.event);
    // TODO: Implement event update API call
    // For now, just log the change
    console.log('New start:', info.event.start);
    console.log('New end:', info.event.end);
  }, []);

  const handleEventResize = useCallback((info) => {
    console.log('Event resized:', info.event);
    // TODO: Implement event update API call
    // For now, just log the change
    console.log('New end:', info.event.end);
  }, []);

  const handleDateSelect = useCallback((info) => {
    console.log('Date range selected:', info.start, 'to', info.end);
    // Open create event modal with selected date range
    openCreateEventModal();
  }, [openCreateEventModal]);

  const handleDateUnselect = useCallback(() => {
    console.log('Date selection cleared');
  }, []);

  const handleDatesSet = useCallback((info) => {
    console.log('Calendar view changed:', info.view.type, info.start, 'to', info.end);

    // Update current view and date
    setCurrentView(info.view.type);
    setCurrentDate(info.view.currentStart);

    // Update date range for data fetching
    setDateRange(info.start, info.end);
  }, [setCurrentView, setCurrentDate, setDateRange]);

  const handleEventSourceFailure = useCallback((error) => {
    console.error('Calendar event source failure:', error);
    setError('Failed to load calendar events');
  }, [setError]);

  // Memoized calendar options - NOW all handlers are available
  const calendarOptions = useMemo(() => {
    const callbacks = {
      onDateClick: handleDateClick,
      onEventClick: handleEventClick,
      onEventDrop: handleEventDrop,
      onEventResize: handleEventResize,
      onSelect: handleDateSelect,
      onUnselect: handleDateUnselect,
      onDatesSet: handleDatesSet,
      onLoading: setLoading,
      onEventSourceFailure: handleEventSourceFailure
    };

    return getCalendarOptions(theme, callbacks);
  }, [
    theme,
    handleDateClick,
    handleEventClick,
    handleEventDrop,
    handleEventResize,
    handleDateSelect,
    handleDateUnselect,
    handleDatesSet,
    setLoading,
    handleEventSourceFailure
  ]);

  // Memoized theme styles
  const themeStyles = useMemo(() => getCalendarTheme(theme), [theme]);

  // Initialize date range if not set
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) {
      console.log('📅 CalendarView: Initializing date range');
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
      setDateRange(start, end);
    }
  }, [dateRange.start, dateRange.end, setDateRange]);

  // Load events when date range or filters change
  useEffect(() => {
    console.log('📅 CalendarView: useEffect triggered for loadEvents', {
      dateRangeStart: dateRange.start,
      dateRangeEnd: dateRange.end,
      hasDateRange: !!(dateRange.start && dateRange.end),
      filters
    });

    if (dateRange.start && dateRange.end) {
      loadEvents();
    } else {
      console.log('📅 CalendarView: Skipping loadEvents - missing date range');
    }
  }, [dateRange, filters, loadEvents]);

  // Get filtered events for FullCalendar
  const filteredEvents = useMemo(() => {
    try {
      // 🚨 DEBUGGING: Verify useMemo is executing with latest code
      console.log('🔥 FILTERED EVENTS MEMO EXECUTING - Timestamp:', new Date().toISOString(), 'Random ID:', Math.random().toString(36).substr(2, 9));

      // Check store state directly first
      console.log('🔍 CRITICAL DEBUG: Store events array:', events);
      console.log('🔍 CRITICAL DEBUG: Store events count:', events?.length || 0);
      console.log('🔍 CRITICAL DEBUG: Store filters:', filters);
      console.log('🔍 CRITICAL DEBUG: getFilteredEvents function:', getFilteredEvents);
      console.log('🔍 CRITICAL DEBUG: getFilteredEvents type:', typeof getFilteredEvents);

      const rawEvents = getFilteredEvents();
      console.log('🔍 CRITICAL DEBUG: getFilteredEvents() called');
      console.log('🔍 CRITICAL DEBUG: Raw events from store:', rawEvents);
      console.log('🔍 CRITICAL DEBUG: Raw events count:', rawEvents?.length || 0);
      console.log('🔍 CRITICAL DEBUG: Raw events type:', typeof rawEvents);
      console.log('🔍 CRITICAL DEBUG: Raw events is array:', Array.isArray(rawEvents));

      if (rawEvents && rawEvents.length > 0) {
        console.log('🔍 CRITICAL DEBUG: First raw event structure:', rawEvents[0]);
      } else {
        console.log('🔍 CRITICAL DEBUG: No raw events found');
        console.log('🔍 CRITICAL DEBUG: Store has events but getFilteredEvents returned empty');
        console.log('🔍 CRITICAL DEBUG: This suggests filtering is removing all events');

        // If store has events but filtering returns none, let's bypass filtering temporarily
        if (events && events.length > 0) {
          console.log('🔍 CRITICAL DEBUG: BYPASSING FILTERING - using store events directly');
          console.log('🔍 CRITICAL DEBUG: First store event:', events[0]);
          // Use store events directly for debugging
          const directEvents = events.slice(0, 10); // Take first 10 events for testing
          console.log('🔍 CRITICAL DEBUG: Using first 10 store events directly:', directEvents);

          const testTransformed = directEvents.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: event.all_day,
            backgroundColor: '#ff9800',
            borderColor: '#ff9800'
          }));

          console.log('🔍 CRITICAL DEBUG: Direct transformation result:', testTransformed);
          return testTransformed;
        }

        return [];
      }

      // Simple transformation for debugging
      console.log('🔍 CRITICAL DEBUG: Starting transformation of', rawEvents.length, 'events');

      const transformedEvents = rawEvents.map((event, index) => {
        if (index < 3) {
          console.log(`🔍 CRITICAL DEBUG: Transforming event ${index}:`, {
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            all_day: event.all_day
          });
        }

        const transformed = {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.all_day,
          backgroundColor: '#1976d2',
          borderColor: '#1976d2'
        };

        if (index < 3) {
          console.log(`🔍 CRITICAL DEBUG: Transformed event ${index}:`, transformed);
        }

        return transformed;
      }).filter((event, index) => {
        const isValid = event.id && event.title && event.start;
        if (index < 3) {
          console.log(`🔍 CRITICAL DEBUG: Event ${index} validation:`, {
            hasId: !!event.id,
            hasTitle: !!event.title,
            hasStart: !!event.start,
            isValid: isValid
          });
        }
        return isValid;
      });

      console.log('🔍 CRITICAL DEBUG: Transformed events count:', transformedEvents.length);
      console.log('🔍 CRITICAL DEBUG: First 3 transformed events:', transformedEvents.slice(0, 3));

      // Add test event
      const testEvent = {
        id: 'test-event-1',
        title: 'Test Event',
        start: new Date(),
        end: new Date(Date.now() + 60 * 60 * 1000),
        allDay: false,
        backgroundColor: '#ff0000',
        borderColor: '#ff0000'
      };

      const finalEvents = [...transformedEvents, testEvent];
      console.log('🔍 CRITICAL DEBUG: Final events with test:', finalEvents.length);
      console.log('🔍 CRITICAL DEBUG: Final events array:', finalEvents);
      console.log('🔍 CRITICAL DEBUG: About to return events to FullCalendar');

      return finalEvents;
    } catch (error) {
      console.error('🚨 ERROR in filteredEvents useMemo:', error);
      console.error('🚨 Error stack:', error.stack);
      return []; // Return empty array on error
    }
  }, [getFilteredEvents, events, filters]);

  // 🚨 DEBUGGING: Final log before render
  console.log('🔥🔥🔥 CALENDAR VIEW ABOUT TO RENDER - LATEST CODE CONFIRMED 🔥🔥🔥');
  console.log('🔍 CRITICAL DEBUG: filteredEvents value before render:', filteredEvents);
  console.log('🔍 CRITICAL DEBUG: filteredEvents length before render:', filteredEvents?.length || 0);
  console.log('🔍 CRITICAL DEBUG: filteredEvents type before render:', typeof filteredEvents);

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      {/* Inject custom styles */}
      <style>{calendarCustomStyles}</style>

      {/* Error display */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* FullCalendar component */}
      <Box
        sx={{
          '& .fc': {
            ...themeStyles,
            fontFamily: theme.typography.fontFamily,
          },
          '& .fc-toolbar': {
            marginBottom: theme.spacing(2),
          },
          '& .fc-toolbar-title': {
            fontSize: theme.typography.h5.fontSize,
            fontWeight: theme.typography.h5.fontWeight,
            color: theme.palette.text.primary,
          },
          '& .fc-button': {
            textTransform: 'none',
            fontWeight: theme.typography.button.fontWeight,
          },
          '& .fc-today-button': {
            textTransform: 'capitalize',
          }
        }}
      >
        <FullCalendar
          ref={calendarRef}
          {...calendarOptions}
          events={filteredEvents}
          initialView={currentView}
          initialDate={currentDate}
          eventDidMount={(info) => {
            console.log('📅 FullCalendar: Event mounted:', info.event.id, info.event.title);
          }}
          eventsSet={(events) => {
            console.log('📅 FullCalendar: Events set - count:', events.length);
            if (events.length > 0) {
              console.log('📅 FullCalendar: First event in eventsSet:', events[0]);
            } else {
              console.log('📅 FullCalendar: No events in eventsSet callback');
            }
          }}
          eventSourceFailure={(error) => {
            console.error('📅 FullCalendar: Event source failure:', error);
          }}
          eventAdd={(info) => {
            console.log('📅 FullCalendar: Event added:', info.event);
          }}
          eventChange={(info) => {
            console.log('📅 FullCalendar: Event changed:', info.event);
          }}
          eventRemove={(info) => {
            console.log('📅 FullCalendar: Event removed:', info.event);
          }}
        />
      </Box>
    </Box>
  );
}

export default CalendarView;
