// Custom hook for calendar event data management
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchEvents, getCalendarStats } from "../services/calendarApiService";
import useCalendarStore from "../store/calendarStore";

/**
 * Custom hook for managing calendar events data
 * Provides loading, error handling, and automatic refetching
 */
export const useCalendarEvents = () => {
  const {
    events,
    dateRange,
    filters,
    isLoading,
    error,
    setEvents,
    setLoading,
    setError,
    clearError,
    setStats,
  } = useCalendarStore();

  const [lastFetchParams, setLastFetchParams] = useState(null);
  const abortControllerRef = useRef(null);

  // Load events with debouncing and abort control
  const loadEvents = useCallback(
    async (forceRefresh = false) => {
      if (!dateRange.start || !dateRange.end) {
        return;
      }

      // Create fetch parameters for comparison
      const fetchParams = {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
        filters: JSON.stringify(filters),
      };

      // Skip if same parameters and not forcing refresh
      if (
        !forceRefresh &&
        lastFetchParams &&
        JSON.stringify(fetchParams) === JSON.stringify(lastFetchParams)
      ) {
        return;
      }

      try {
        // Abort previous request if still pending
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setLoading(true);
        clearError();

        const response = await fetchEvents(
          dateRange.start,
          dateRange.end,
          filters
        );

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setEvents(response.events || []);
        setLastFetchParams(fetchParams);
      } catch (err) {
        // Don't set error if request was aborted
        if (err.name !== "AbortError") {
          console.error("Error loading calendar events:", err);
          setError(err.message || "Failed to load calendar events");
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      dateRange,
      filters,
      setEvents,
      setLoading,
      setError,
      clearError,
      lastFetchParams,
    ]
  );

  // Load statistics
  const loadStats = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) {
      return;
    }

    try {
      const response = await getCalendarStats(dateRange.start, dateRange.end);
      setStats(response.summary);
    } catch (err) {
      console.error("Error loading calendar stats:", err);
      // Don't show error for stats as it's not critical
    }
  }, [dateRange, setStats]);

  // Auto-load events when dependencies change
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Load stats when date range changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Refresh function for manual refresh
  const refreshEvents = useCallback(() => {
    loadEvents(true);
    loadStats();
  }, [loadEvents, loadStats]);

  // Check if events are stale (older than 5 minutes)
  const areEventsStale = useCallback(() => {
    if (!lastFetchParams) return true;

    const now = new Date();
    const lastFetch = new Date(lastFetchParams.timestamp || 0);
    const fiveMinutes = 5 * 60 * 1000;

    return now - lastFetch > fiveMinutes;
  }, [lastFetchParams]);

  return {
    events,
    isLoading,
    error,
    loadEvents,
    refreshEvents,
    areEventsStale,
    clearError,
  };
};

/**
 * Custom hook for managing event operations (CRUD)
 */
export const useEventOperations = () => {
  const { addEvent, updateEvent, removeEvent, setError } = useCalendarStore();

  const [operationLoading, setOperationLoading] = useState(false);

  // Create event operation
  const createEvent = useCallback(
    async (eventData) => {
      try {
        setOperationLoading(true);

        // Import API functions - Only Events supported in calendar
        const { createEvent: createEventAPI } = await import(
          "../services/calendarApiService"
        );

        // Calendar only supports Events, not Tasks
        if (
          eventData.event_type === "task" ||
          eventData.salesforce_type === "Task"
        ) {
          throw new Error(
            "Tasks are not supported in calendar view. Only Events (appointments/meetings) can be created."
          );
        }

        // Call Event API
        const response = await createEventAPI(eventData);

        if (response.success) {
          // Convert API response to calendar event format
          const newEvent = {
            id: response.event_id || response.salesforce_id,
            title: eventData.subject,
            start: new Date(eventData.start_datetime),
            end: new Date(eventData.end_datetime),
            allDay: eventData.is_all_day,
            description: eventData.description,
            location: eventData.location,
            status: eventData.status,
            event_type: eventData.event_type,
            salesforce_id: response.salesforce_id,
            salesforce_type: "Event", // Calendar only supports Events
            editable: true,
          };

          addEvent(newEvent);
          return { success: true, event: newEvent };
        } else {
          throw new Error(response.message || "Failed to create event");
        }
      } catch (err) {
        console.error("Error creating event:", err);
        setError(err.message || "Failed to create event");
        return { success: false, error: err.message };
      } finally {
        setOperationLoading(false);
      }
    },
    [addEvent, setError]
  );

  // Update event operation
  const updateEventData = useCallback(
    async (eventId, eventData) => {
      try {
        setOperationLoading(true);

        // Import API functions - Only Events supported in calendar
        const { updateEvent: updateEventAPI } = await import(
          "../services/calendarApiService"
        );

        // Calendar only supports Events, not Tasks
        if (
          eventData.event_type === "task" ||
          eventData.salesforce_type === "Task"
        ) {
          throw new Error(
            "Tasks are not supported in calendar view. Only Events (appointments/meetings) can be updated."
          );
        }

        // Call Event API
        const response = await updateEventAPI(eventId, eventData);

        if (response.success) {
          updateEvent(eventId, eventData);
          return { success: true };
        } else {
          throw new Error(response.message || "Failed to update event");
        }
      } catch (err) {
        console.error("Error updating event:", err);
        setError(err.message || "Failed to update event");
        return { success: false, error: err.message };
      } finally {
        setOperationLoading(false);
      }
    },
    [updateEvent, setError]
  );

  // Delete event operation
  const deleteEvent = useCallback(
    async (eventId) => {
      try {
        setOperationLoading(true);

        // Import API function
        const { deleteEvent: deleteEventAPI } = await import(
          "../services/calendarApiService"
        );

        // Call the API to delete the event
        const response = await deleteEventAPI(eventId);

        if (response.success) {
          removeEvent(eventId);
          return { success: true };
        } else {
          throw new Error(response.message || "Failed to delete event");
        }
      } catch (err) {
        console.error("Error deleting event:", err);
        setError(err.message || "Failed to delete event");
        return { success: false, error: err.message };
      } finally {
        setOperationLoading(false);
      }
    },
    [removeEvent, setError]
  );

  return {
    createEvent,
    updateEvent: updateEventData,
    deleteEvent,
    operationLoading,
  };
};

/**
 * Custom hook for calendar navigation
 */
export const useCalendarNavigation = () => {
  const {
    currentView,
    currentDate,
    setCurrentView,
    setCurrentDate,
    setDateRange,
  } = useCalendarStore();

  // Navigate to previous period
  const navigatePrevious = useCallback(() => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case "dayGridMonth":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "timeGridWeek":
      case "listWeek":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "timeGridDay":
        newDate.setDate(newDate.getDate() - 1);
        break;
    }

    setCurrentDate(newDate);
  }, [currentView, currentDate, setCurrentDate]);

  // Navigate to next period
  const navigateNext = useCallback(() => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case "dayGridMonth":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "timeGridWeek":
      case "listWeek":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "timeGridDay":
        newDate.setDate(newDate.getDate() + 1);
        break;
    }

    setCurrentDate(newDate);
  }, [currentView, currentDate, setCurrentDate]);

  // Navigate to today
  const navigateToday = useCallback(() => {
    setCurrentDate(new Date());
  }, [setCurrentDate]);

  // Navigate to specific date
  const navigateToDate = useCallback(
    (date) => {
      setCurrentDate(new Date(date));
    },
    [setCurrentDate]
  );

  // Change view and optionally navigate to date
  const changeView = useCallback(
    (view, date = null) => {
      setCurrentView(view);
      if (date) {
        setCurrentDate(new Date(date));
      }
    },
    [setCurrentView, setCurrentDate]
  );

  return {
    currentView,
    currentDate,
    navigatePrevious,
    navigateNext,
    navigateToday,
    navigateToDate,
    changeView,
  };
};

export default useCalendarEvents;
