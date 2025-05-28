// Configuration for FullCalendar, including plugins
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";

// Export plugins array
export const calendarPlugins = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  rrulePlugin,
];

// Theme configuration for Material-UI dark theme
export const getCalendarTheme = (theme) => ({
  // Calendar colors
  "--fc-border-color": theme.palette.divider,
  "--fc-button-text-color": theme.palette.primary.contrastText,
  "--fc-button-bg-color": theme.palette.primary.main,
  "--fc-button-border-color": theme.palette.primary.main,
  "--fc-button-hover-bg-color": theme.palette.primary.dark,
  "--fc-button-hover-border-color": theme.palette.primary.dark,
  "--fc-button-active-bg-color": theme.palette.primary.dark,
  "--fc-button-active-border-color": theme.palette.primary.dark,

  // Today highlighting
  "--fc-today-bg-color": theme.palette.action.hover,

  // Event colors
  "--fc-event-bg-color": theme.palette.primary.main,
  "--fc-event-border-color": theme.palette.primary.main,
  "--fc-event-text-color": theme.palette.primary.contrastText,

  // Background colors
  "--fc-page-bg-color": theme.palette.background.default,
  "--fc-neutral-bg-color": theme.palette.background.paper,

  // Text colors
  "--fc-neutral-text-color": theme.palette.text.primary,
  "--fc-list-event-hover-bg-color": theme.palette.action.hover,
});

// Base calendar configuration
export const getCalendarOptions = (theme, callbacks = {}) => ({
  plugins: calendarPlugins,

  // Initial view settings
  initialView: "dayGridMonth",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
  },

  // View-specific settings
  views: {
    dayGridMonth: {
      titleFormat: { year: "numeric", month: "long" },
      dayMaxEvents: 3, // Show max 3 events per day, then "+X more"
      moreLinkClick: "popover",
    },
    timeGridWeek: {
      titleFormat: { year: "numeric", month: "short", day: "numeric" },
      slotMinTime: "06:00:00",
      slotMaxTime: "22:00:00",
      allDaySlot: true,
    },
    timeGridDay: {
      titleFormat: {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      },
      slotMinTime: "06:00:00",
      slotMaxTime: "22:00:00",
      allDaySlot: true,
    },
    listWeek: {
      titleFormat: { year: "numeric", month: "long", day: "numeric" },
      listDayFormat: { weekday: "long", month: "long", day: "numeric" },
    },
  },

  // Internationalization
  locale: "pt-br", // Portuguese (Brazil) - adjust based on user preference
  firstDay: 1, // Monday as first day of week

  // Time settings
  nowIndicator: true,
  scrollTime: "08:00:00",
  slotDuration: "00:30:00",
  snapDuration: "00:15:00",

  // Event settings
  eventDisplay: "block",
  eventTimeFormat: {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  },

  // Interaction settings
  selectable: true,
  selectMirror: true,
  editable: true,
  droppable: false, // Disable external drag-and-drop for now

  // Height and sizing
  height: "auto",
  aspectRatio: 1.35,

  // Event rendering - temporarily disabled for debugging
  /*
  eventContent: (arg) => {
    try {
      console.log(
        "📅 FullCalendar: Rendering event content for:",
        arg.event.id,
        arg.event.title
      );

      const event = arg.event;
      const extendedProps = event.extendedProps;

      // Custom event rendering with icons and styling
      const eventEl = document.createElement("div");
      eventEl.className = "fc-event-content-custom";

      // Add event type icon
      const iconEl = document.createElement("span");
      iconEl.className = "fc-event-icon";

      switch (extendedProps.event_type) {
        case "meeting":
          iconEl.innerHTML = "👥";
          break;
        case "call":
          iconEl.innerHTML = "📞";
          break;
        case "email":
          iconEl.innerHTML = "📧";
          break;
        case "task":
          iconEl.innerHTML = "✓";
          break;
        default:
          iconEl.innerHTML = "📅";
      }

      // Add event title
      const titleEl = document.createElement("span");
      titleEl.className = "fc-event-title-custom";
      titleEl.textContent = event.title;

      // Add time if not all-day
      if (!event.allDay && arg.view.type !== "listWeek") {
        const timeEl = document.createElement("div");
        timeEl.className = "fc-event-time-custom";
        timeEl.textContent = event.start.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        eventEl.appendChild(timeEl);
      }

      eventEl.appendChild(iconEl);
      eventEl.appendChild(titleEl);

      // Task-specific rendering removed - Calendar only shows Events

      return { domNodes: [eventEl] };
    } catch (error) {
      console.error("📅 FullCalendar: Error rendering event content:", error);
      // Return default content on error
      return { html: arg.event.title };
    }
  },
  */

  // Event styling
  eventClassNames: (arg) => {
    const event = arg.event;
    const extendedProps = event.extendedProps;

    const classes = ["fc-event-custom"];

    // Add type-specific classes
    if (extendedProps.event_type) {
      classes.push(`fc-event-type-${extendedProps.event_type}`);
    }

    if (extendedProps.salesforce_type) {
      classes.push(
        `fc-event-sf-${extendedProps.salesforce_type.toLowerCase()}`
      );
    }

    // Add status classes
    if (extendedProps.status) {
      classes.push(`fc-event-status-${extendedProps.status}`);
    }

    // Add priority classes for tasks
    if (extendedProps.priority) {
      classes.push(`fc-event-priority-${extendedProps.priority.toLowerCase()}`);
    }

    return classes;
  },

  // Callbacks
  dateClick: callbacks.onDateClick || (() => {}),
  eventClick: callbacks.onEventClick || (() => {}),
  eventDrop: callbacks.onEventDrop || (() => {}),
  eventResize: callbacks.onEventResize || (() => {}),
  select: callbacks.onSelect || (() => {}),
  unselect: callbacks.onUnselect || (() => {}),
  datesSet: callbacks.onDatesSet || (() => {}),

  // Loading callback
  loading: callbacks.onLoading || (() => {}),

  // Error handling
  eventSourceFailure: callbacks.onEventSourceFailure || (() => {}),
});

// CSS styles for custom event rendering
export const calendarCustomStyles = `
  .fc-event-content-custom {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px;
    font-size: 0.875rem;
    line-height: 1.2;
  }

  .fc-event-icon {
    font-size: 0.75rem;
    flex-shrink: 0;
  }

  .fc-event-title-custom {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fc-event-time-custom {
    font-size: 0.75rem;
    opacity: 0.8;
    margin-bottom: 2px;
  }

  .fc-event-status {
    font-size: 0.75rem;
    margin-left: auto;
    flex-shrink: 0;
  }

  .fc-event-status-completed {
    color: #4caf50;
  }

  .fc-event-status-in_progress {
    color: #ff9800;
  }

  .fc-event-status-not_started {
    color: #9e9e9e;
  }

  .fc-event-type-meeting {
    border-left: 4px solid #1976d2;
  }

  .fc-event-type-call {
    border-left: 4px solid #388e3c;
  }

  .fc-event-type-email {
    border-left: 4px solid #f57c00;
  }

  .fc-event-type-task {
    border-left: 4px solid #9e9e9e;
  }

  .fc-event-sf-task {
    opacity: 0.8;
    font-style: italic;
  }

  .fc-event-priority-high {
    border-left-color: #f44336 !important;
    font-weight: bold;
  }

  .fc-event-priority-low {
    opacity: 0.7;
  }

  /* Dark theme adjustments */
  .fc-theme-standard .fc-scrollgrid {
    border-color: var(--fc-border-color);
  }

  .fc-theme-standard td, .fc-theme-standard th {
    border-color: var(--fc-border-color);
  }

  .fc-col-header-cell {
    background-color: var(--fc-neutral-bg-color);
  }

  .fc-daygrid-day-number {
    color: var(--fc-neutral-text-color);
  }

  .fc-list-event:hover {
    background-color: var(--fc-list-event-hover-bg-color);
  }
`;
