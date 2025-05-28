// Basic tests for calendar module functionality
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';

// Calendar components
import CalendarApp from '../CalendarApp';
import CalendarView from '../components/CalendarView';
import CalendarToolbar from '../components/CalendarToolbar';
import EventModal from '../components/EventModal';
import EventDetailsModal from '../components/EventDetailsModal';

// Store and utilities
import useCalendarStore from '../store/calendarStore';
import { formatDate, formatDateTime, calculateDuration } from '../utils/dateUtils';
import { getEventTypeConfig, validateEvent, filterEvents } from '../utils/eventUtils';

// Mock dependencies
vi.mock('../services/calendarApiService', () => ({
  fetchEvents: vi.fn(() => Promise.resolve({ events: [] })),
  createEvent: vi.fn(() => Promise.resolve({ success: true, event: {} })),
  updateEvent: vi.fn(() => Promise.resolve({ success: true })),
  deleteEvent: vi.fn(() => Promise.resolve({ success: true })),
  getCalendarStats: vi.fn(() => Promise.resolve({ summary: {} }))
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      isAuthenticated: true,
      accessToken: 'mock-token',
      instanceUrl: 'https://mock.salesforce.com'
    })
  }
}));

// Test wrapper component
const TestWrapper = ({ children }) => {
  const theme = createTheme({ palette: { mode: 'dark' } });
  
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('Calendar Module', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCalendarStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('CalendarApp', () => {
    it('renders without crashing', () => {
      render(
        <TestWrapper>
          <CalendarApp />
        </TestWrapper>
      );
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays calendar toolbar and view', () => {
      render(
        <TestWrapper>
          <CalendarApp />
        </TestWrapper>
      );
      
      // Should have navigation buttons
      expect(screen.getByText('Hoje')).toBeInTheDocument();
      expect(screen.getByText('Novo Evento')).toBeInTheDocument();
    });
  });

  describe('Calendar Store', () => {
    it('initializes with default state', () => {
      const state = useCalendarStore.getState();
      
      expect(state.events).toEqual([]);
      expect(state.currentView).toBe('dayGridMonth');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.filters.includeEvents).toBe(true);
      expect(state.filters.includeTasks).toBe(true);
    });

    it('can add and remove events', () => {
      const store = useCalendarStore.getState();
      
      const testEvent = {
        id: 'test-1',
        title: 'Test Event',
        start: new Date(),
        end: new Date(),
        allDay: false
      };
      
      // Add event
      store.addEvent(testEvent);
      expect(useCalendarStore.getState().events).toHaveLength(1);
      expect(useCalendarStore.getState().events[0]).toEqual(testEvent);
      
      // Remove event
      store.removeEvent('test-1');
      expect(useCalendarStore.getState().events).toHaveLength(0);
    });

    it('can update filters', () => {
      const store = useCalendarStore.getState();
      
      store.setFilters({ includeEvents: false, searchTerm: 'test' });
      
      const state = useCalendarStore.getState();
      expect(state.filters.includeEvents).toBe(false);
      expect(state.filters.searchTerm).toBe('test');
      expect(state.filters.includeTasks).toBe(true); // Should remain unchanged
    });
  });

  describe('Date Utils', () => {
    it('formats dates correctly', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      
      expect(formatDate(testDate)).toBe('15/01/2024');
      expect(formatDateTime(testDate)).toBe('15/01/2024 10:30');
    });

    it('calculates duration correctly', () => {
      const start = new Date('2024-01-15T10:00:00');
      const end = new Date('2024-01-15T11:30:00');
      
      const duration = calculateDuration(start, end);
      
      expect(duration.hours).toBe(1);
      expect(duration.minutes).toBe(30);
      expect(duration.text).toBe('1h 30min');
    });

    it('handles invalid dates gracefully', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid')).toBe('');
      expect(calculateDuration(null, null).text).toBe('');
    });
  });

  describe('Event Utils', () => {
    it('gets event type configuration', () => {
      const meetingConfig = getEventTypeConfig('meeting');
      
      expect(meetingConfig.label).toBe('Reunião');
      expect(meetingConfig.icon).toBe('👥');
      expect(meetingConfig.color).toBe('#1976d2');
    });

    it('validates event data', () => {
      const validEvent = {
        title: 'Test Event',
        start: new Date(),
        end: new Date(Date.now() + 3600000) // 1 hour later
      };
      
      const invalidEvent = {
        title: '',
        start: new Date(),
        end: new Date(Date.now() - 3600000) // 1 hour earlier (invalid)
      };
      
      expect(validateEvent(validEvent).isValid).toBe(true);
      expect(validateEvent(invalidEvent).isValid).toBe(false);
      expect(validateEvent(invalidEvent).errors).toContain('Título é obrigatório');
    });

    it('filters events correctly', () => {
      const events = [
        {
          id: '1',
          title: 'Meeting',
          event_type: 'meeting',
          salesforce_type: 'Event',
          status: 'planned'
        },
        {
          id: '2',
          title: 'Task',
          event_type: 'task',
          salesforce_type: 'Task',
          status: 'completed'
        },
        {
          id: '3',
          title: 'Call',
          event_type: 'call',
          salesforce_type: 'Event',
          status: 'planned'
        }
      ];
      
      // Filter to only include events (not tasks)
      const eventsOnly = filterEvents(events, {
        includeEvents: true,
        includeTasks: false,
        includeRecurring: true
      });
      
      expect(eventsOnly).toHaveLength(2);
      expect(eventsOnly.every(e => e.salesforce_type === 'Event')).toBe(true);
      
      // Filter by event type
      const meetingsOnly = filterEvents(events, {
        includeEvents: true,
        includeTasks: true,
        includeRecurring: true,
        eventTypes: ['meeting']
      });
      
      expect(meetingsOnly).toHaveLength(1);
      expect(meetingsOnly[0].event_type).toBe('meeting');
      
      // Filter by search term
      const searchResults = filterEvents(events, {
        includeEvents: true,
        includeTasks: true,
        includeRecurring: true,
        searchTerm: 'call'
      });
      
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe('Call');
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const { fetchEvents } = await import('../services/calendarApiService');
      fetchEvents.mockRejectedValueOnce(new Error('API Error'));
      
      const store = useCalendarStore.getState();
      
      // This would normally be called by the component
      try {
        await fetchEvents(new Date(), new Date());
      } catch (error) {
        store.setError(error.message);
      }
      
      expect(useCalendarStore.getState().error).toBe('API Error');
    });
  });

  describe('Integration Tests', () => {
    it('can open and close event modal', async () => {
      render(
        <TestWrapper>
          <CalendarApp />
        </TestWrapper>
      );
      
      // Click "Novo Evento" button
      const newEventButton = screen.getByText('Novo Evento');
      fireEvent.click(newEventButton);
      
      // Modal should be open
      await waitFor(() => {
        expect(useCalendarStore.getState().isCreateEventModalOpen).toBe(true);
      });
      
      // Close modal
      useCalendarStore.getState().closeCreateEventModal();
      
      expect(useCalendarStore.getState().isCreateEventModalOpen).toBe(false);
    });

    it('can change calendar view', () => {
      const store = useCalendarStore.getState();
      
      expect(store.currentView).toBe('dayGridMonth');
      
      store.setCurrentView('timeGridWeek');
      
      expect(useCalendarStore.getState().currentView).toBe('timeGridWeek');
    });
  });
});

// Performance tests
describe('Calendar Performance', () => {
  it('handles large number of events efficiently', () => {
    const store = useCalendarStore.getState();
    
    // Generate 1000 test events
    const events = Array.from({ length: 1000 }, (_, i) => ({
      id: `event-${i}`,
      title: `Event ${i}`,
      start: new Date(2024, 0, 1 + (i % 31)),
      end: new Date(2024, 0, 1 + (i % 31)),
      allDay: false,
      event_type: 'event',
      salesforce_type: 'Event'
    }));
    
    const startTime = performance.now();
    
    // Add all events
    events.forEach(event => store.addEvent(event));
    
    // Filter events
    const filtered = store.getFilteredEvents();
    
    const endTime = performance.now();
    
    expect(filtered).toHaveLength(1000);
    expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
  });
});
