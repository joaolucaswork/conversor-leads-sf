// Zustand store for calendar state management
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useCalendarStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    events: [],
    currentView: "dayGridMonth",
    currentDate: new Date(),
    selectedEvent: null,
    isLoading: false,
    error: null,

    // Modal states
    isCreateEventModalOpen: false,
    isEditEventModalOpen: false,
    isEventDetailsModalOpen: false,

    // Filters - Tasks permanently excluded, only Events shown
    filters: {
      includeEvents: true,
      includeTasks: false, // Permanently disabled - Tasks not shown in calendar
      includeRecurring: true,
      eventTypes: [],
      statuses: [],
      ownerIds: [],
      accountIds: [],
      searchTerm: "",
    },

    // Date range for current view
    dateRange: {
      start: null,
      end: null,
    },

    // Statistics
    stats: null,

    // Actions
    setEvents: (events) => {
      console.log("📅 CalendarStore: Setting events:", events);
      console.log("📅 CalendarStore: Events count:", events?.length || 0);

      if (events && events.length > 0) {
        console.log("📅 CalendarStore: First event structure:", events[0]);
        console.log(
          "📅 CalendarStore: Sample event keys:",
          Object.keys(events[0] || {})
        );

        // Check if events have required FullCalendar properties
        const firstEvent = events[0];
        const hasTitle = "title" in firstEvent;
        const hasStart = "start" in firstEvent;
        const hasEnd = "end" in firstEvent;
        const hasId = "id" in firstEvent;

        console.log("📅 CalendarStore: FullCalendar format check:", {
          hasTitle,
          hasStart,
          hasEnd,
          hasId,
          title: firstEvent.title,
          start: firstEvent.start,
          end: firstEvent.end,
          id: firstEvent.id,
        });
      }

      set({ events });
    },

    setCurrentView: (view) => set({ currentView: view }),

    setCurrentDate: (date) => set({ currentDate: date }),

    setDateRange: (start, end) =>
      set({
        dateRange: { start, end },
      }),

    setSelectedEvent: (event) => set({ selectedEvent: event }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    // Modal actions
    openCreateEventModal: () => set({ isCreateEventModalOpen: true }),
    closeCreateEventModal: () => set({ isCreateEventModalOpen: false }),

    openEditEventModal: (event) =>
      set({
        isEditEventModalOpen: true,
        selectedEvent: event,
      }),
    closeEditEventModal: () =>
      set({
        isEditEventModalOpen: false,
        selectedEvent: null,
      }),

    openEventDetailsModal: (event) =>
      set({
        isEventDetailsModalOpen: true,
        selectedEvent: event,
      }),
    closeEventDetailsModal: () =>
      set({
        isEventDetailsModalOpen: false,
        selectedEvent: null,
      }),

    // Filter actions
    setFilters: (filters) =>
      set({
        filters: { ...get().filters, ...filters },
      }),

    resetFilters: () =>
      set({
        filters: {
          includeEvents: true,
          includeTasks: false, // Permanently disabled - Tasks not shown in calendar
          includeRecurring: true,
          eventTypes: [],
          statuses: [],
          ownerIds: [],
          accountIds: [],
          searchTerm: "",
        },
      }),

    // Event management actions
    addEvent: (event) =>
      set((state) => ({
        events: [...state.events, event],
      })),

    updateEvent: (eventId, updatedEvent) =>
      set((state) => ({
        events: state.events.map((event) =>
          event.id === eventId ? { ...event, ...updatedEvent } : event
        ),
      })),

    removeEvent: (eventId) =>
      set((state) => ({
        events: state.events.filter((event) => event.id !== eventId),
      })),

    // Statistics
    setStats: (stats) => set({ stats }),

    // Utility actions
    clearError: () => set({ error: null }),

    reset: () =>
      set({
        events: [],
        selectedEvent: null,
        isLoading: false,
        error: null,
        isCreateEventModalOpen: false,
        isEditEventModalOpen: false,
        isEventDetailsModalOpen: false,
        stats: null,
      }),

    // Computed getters
    getEventById: (eventId) => {
      const state = get();
      return state.events.find((event) => event.id === eventId);
    },

    getFilteredEvents: () => {
      // 🚨 DEBUGGING: Verify store function is executing with latest code
      console.log(
        "🔥 STORE getFilteredEvents EXECUTING - Timestamp:",
        new Date().toISOString(),
        "Random ID:",
        Math.random().toString(36).substr(2, 9)
      );

      const state = get();
      const { events, filters } = state;

      console.log("📅 CalendarStore: getFilteredEvents called", {
        totalEvents: events.length,
        filters,
      });

      // 🚨 DEBUGGING: Log first few events to understand data structure
      if (events.length > 0) {
        console.log(
          "🔍 DEBUGGING: First 3 events in store:",
          events.slice(0, 3)
        );
        console.log("🔍 DEBUGGING: Event types found:", [
          ...new Set(events.map((e) => e.salesforce_type)),
        ]);
        console.log(
          "🔍 DEBUGGING: Event titles sample:",
          events.slice(0, 5).map((e) => e.title)
        );
      }

      let filteredCount = 0;
      let phoneCallsFiltered = 0;
      const filteredEvents = events.filter((event, index) => {
        // Debug first few events
        if (index < 5) {
          console.log(`🔍 CalendarStore: Filtering event ${index}:`, {
            id: event.id,
            title: event.title,
            salesforce_type: event.salesforce_type,
            event_type: event.event_type,
            status: event.status,
            is_recurring: event.is_recurring,
            start: event.start,
          });
        }

        // Include/exclude by type
        if (!filters.includeEvents && event.salesforce_type === "Event") {
          if (index < 5)
            console.log(
              `❌ Event ${index} filtered out: includeEvents=false and salesforce_type=Event`
            );
          return false;
        }

        // ALWAYS exclude Tasks - Calendar only shows Events (appointments/meetings)
        if (event.salesforce_type === "Task") {
          if (index < 5)
            console.log(
              `❌ Event ${index} filtered out: Tasks permanently excluded from calendar`
            );
          return false;
        }
        if (!filters.includeRecurring && event.is_recurring) {
          if (index < 5)
            console.log(
              `❌ Event ${index} filtered out: includeRecurring=false and is_recurring=true`
            );
          return false;
        }

        // Exclude phone call events - Only applies to Events (Tasks already excluded)
        const isPhoneCall =
          // Check if title contains "Chamada" (Portuguese for call)
          (event.title && event.title.toLowerCase().includes("chamada")) ||
          // Check if event type indicates a phone call activity
          (event.event_type &&
            (event.event_type.toLowerCase() === "call" ||
              event.event_type.toLowerCase() === "phone_call" ||
              event.event_type.toLowerCase() === "phone call" ||
              event.event_type.toLowerCase() === "chamada")) ||
          // Check for call-related keywords in description
          (event.description &&
            (event.description.toLowerCase().includes("call") ||
              event.description.toLowerCase().includes("chamada")));

        if (isPhoneCall) {
          phoneCallsFiltered++;
          if (index < 5)
            console.log(
              `❌ Event ${index} filtered out: phone call event detected`,
              {
                title: event.title,
                event_type: event.event_type,
                salesforce_type: event.salesforce_type,
                description: event.description?.substring(0, 50) + "...",
                isPhoneCall: isPhoneCall,
              }
            );
          return false;
        }

        // Filter by event types
        if (
          filters.eventTypes.length > 0 &&
          !filters.eventTypes.includes(event.event_type)
        ) {
          if (index < 5)
            console.log(
              `❌ Event ${index} filtered out: event_type '${event.event_type}' not in eventTypes filter`
            );
          return false;
        }

        // Filter by statuses
        if (
          filters.statuses.length > 0 &&
          !filters.statuses.includes(event.status)
        ) {
          if (index < 5)
            console.log(
              `❌ Event ${index} filtered out: status '${event.status}' not in statuses filter`
            );
          return false;
        }

        // Filter by search term
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const titleMatch = event.title.toLowerCase().includes(searchLower);
          const descMatch =
            event.description?.toLowerCase().includes(searchLower) || false;
          const locationMatch =
            event.location?.toLowerCase().includes(searchLower) || false;

          if (!titleMatch && !descMatch && !locationMatch) {
            if (index < 5)
              console.log(
                `❌ Event ${index} filtered out: search term '${filters.searchTerm}' not found`
              );
            return false;
          }
        }

        if (index < 5) console.log(`✅ Event ${index} passed all filters`);
        filteredCount++;
        return true;
      });

      console.log("📅 CalendarStore: getFilteredEvents result", {
        originalCount: events.length,
        filteredCount: filteredEvents.length,
        phoneCallsFiltered: phoneCallsFiltered,
        otherFiltersApplied:
          events.length - filteredEvents.length - phoneCallsFiltered,
      });

      return filteredEvents;
    },

    getEventsForDate: (date) => {
      const state = get();
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      return state.getFilteredEvents().filter((event) => {
        const eventDate = new Date(event.start);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === targetDate.getTime();
      });
    },

    getUpcomingEvents: (days = 7) => {
      const state = get();
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      return state
        .getFilteredEvents()
        .filter((event) => {
          const eventDate = new Date(event.start);
          return eventDate >= now && eventDate <= futureDate;
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start));
    },
  }))
);

export default useCalendarStore;
