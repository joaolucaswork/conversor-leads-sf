# Calendar Module

## 🎯 Overview

The Calendar Module provides a comprehensive calendar interface for viewing, creating, and managing Salesforce Events and Tasks. It features a modern, responsive design with full integration to the Salesforce API.

**✅ IMPLEMENTATION COMPLETE** - This module is fully implemented and ready for use.

## 📁 Structure

```
src/calendar/
├── components/           # React components for calendar UI
│   ├── CalendarView.jsx         # Main FullCalendar component
│   ├── CalendarToolbar.jsx      # Navigation and controls
│   ├── EventModal.jsx           # Create/edit event modal
│   ├── EventDetailsModal.jsx    # View event details modal
│   └── CalendarErrorBoundary.jsx # Error handling
├── services/            # API services and configuration
│   ├── calendarApiService.js    # HTTP client for calendar API
│   └── fullCalendarConfig.js    # FullCalendar configuration
├── store/              # State management (Zustand)
│   └── calendarStore.js         # Calendar state and actions
├── hooks/              # Custom React hooks
│   └── useCalendarEvents.js     # Event data management hooks
├── utils/              # Utility functions
│   ├── dateUtils.js             # Date formatting and manipulation
│   └── eventUtils.js            # Event processing utilities
├── styles/             # Styling and theming
│   └── calendarTheme.js         # Calendar-specific theme overrides
├── pages/              # Page-level components
│   └── CalendarPage.jsx         # Main calendar page
├── __tests__/          # Test files
│   └── CalendarModule.test.js   # Comprehensive test suite
└── CalendarApp.jsx     # Main calendar application component
```

## 🚀 Implemented Features

* **Calendar Views:** Month, Week (TimeGrid), Day (TimeGrid), and Agenda/List views.
* **Event Management:**
  * Display events from Salesforce (Event and Task objects).
  * Create, view, edit, and delete events (if CRUD operations are enabled against Salesforce).
  * Support for all-day events.
* **Scheduling:** Setting start/end dates and times for events.
* **Reminders:** Visual notifications for upcoming events based on Salesforce reminder data.
* **Recurring Events:** Display and potentially manage recurring events, translating Salesforce recurrence patterns.
* **Salesforce Integration:**
  * Pull calendar data (events, appointments, tasks, meetings) from Salesforce APIs.
  * Ensure data consistency with Salesforce as the source of truth.
* **UI/UX:**
  * Modern React interface using a specialized calendar library.
  * Adherence to Material Design principles.
  * Responsive design for various screen sizes.
  * Consistent notification patterns.

## Key Libraries Used

* **Frontend:**
  * **React:** Core UI library.
  * **FullCalendar (`@fullcalendar/react` and plugins):** For rendering calendar views and managing event interactions. Plugins used include:
    * `@fullcalendar/core`
    * `@fullcalendar/daygrid` (for Month, DayGrid views)
    * `@fullcalendar/timegrid` (for TimeGrid week/day views)
    * `@fullcalendar/list` (for List view)
    * `@fullcalendar/interaction` (for clicking, selecting, dragging, resizing)
    * `@fullcalendar/rrule` (for recurrence, using `rrule.js`)
  * **rrule.js (`rrule`):** Library for handling recurrence rules.
  * **Zustand:** For frontend state management specific to the calendar module.
  * **Material-UI (or existing equivalent):** For UI components and adherence to Material Design.
* **Backend:**
  * **Python (Flask/FastAPI - based on project stack):** Backend framework.
  * **SQLAlchemy (if models are added):** For database interaction if any non-Salesforce data is stored.
  * **Pydantic/Marshmallow (based on project stack):** For data validation and serialization.
  * **Salesforce Client Library (e.g., `simple-salesforce` or custom via `requests`):** For Salesforce API communication.

## Project Structure

* All frontend code for this module is located within `src/calendar/`.
* All backend code for this module is located within `backend/calendar/`.
* This module is designed to be separate from the existing lead processing system, reusing only the authentication system and AI components (via APIs if applicable) from the current application.

## Getting Started (Development)

* Ensure all dependencies are installed (see main `package.json` and backend `requirements.txt`).
* The main calendar application component is `src/calendar/CalendarApp.jsx`.
* Backend API routes are defined under `backend/calendar/api/`.
* Salesforce integration logic is handled by services in `backend/calendar/services/`.
