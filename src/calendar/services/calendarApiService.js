// Service for interacting with the backend calendar API
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

// Define the base URL for the calendar API.
// Automatically detects production vs development environment
const getApiBaseUrl = () => {
  // In production (Heroku), use relative URLs to the same domain
  if (import.meta.env.PROD) {
    return window.location.origin + "/api/v1/calendar";
  }

  // In development, use relative URLs to leverage Vite's proxy
  // This avoids CORS issues by routing through the Vite dev server
  return "/api/v1/calendar";
};

const API_BASE_URL = getApiBaseUrl();

console.log("🗓️ Calendar API Base URL:", API_BASE_URL);
console.log("🌍 Environment:", import.meta.env.MODE);
console.log("🏭 Production:", import.meta.env.PROD);

// Create axios instance with default config
const calendarApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication
calendarApi.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore.getState();

    if (authStore.isAuthenticated && authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
calendarApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or refresh token
      const authStore = useAuthStore.getState();
      if (authStore.isAuthenticated) {
        console.warn(
          "Calendar API: Unauthorized request, token may be expired"
        );
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to get auth data
const getAuthData = () => {
  const authStore = useAuthStore.getState();

  console.log("🔐 CalendarAPI: Checking authentication state:", {
    isAuthenticated: authStore.isAuthenticated,
    hasAccessToken: !!authStore.accessToken,
    hasInstanceUrl: !!authStore.instanceUrl,
    accessTokenLength: authStore.accessToken?.length,
    instanceUrl: authStore.instanceUrl,
  });

  if (
    !authStore.isAuthenticated ||
    !authStore.accessToken ||
    !authStore.instanceUrl
  ) {
    console.error("❌ CalendarAPI: Not authenticated with Salesforce", {
      isAuthenticated: authStore.isAuthenticated,
      hasAccessToken: !!authStore.accessToken,
      hasInstanceUrl: !!authStore.instanceUrl,
    });
    throw new Error("Not authenticated with Salesforce");
  }

  return {
    access_token: authStore.accessToken,
    instance_url: authStore.instanceUrl,
  };
};

// Helper function to format date for API
const formatDateForApi = (date) => {
  if (date instanceof Date) {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  }
  return date;
};

/**
 * Transform frontend event type to backend expected format
 * @param {string} frontendType - Frontend event type (lowercase)
 * @returns {string} Backend event type (capitalized)
 */
const transformEventType = (frontendType) => {
  const typeMap = {
    event: "Event",
    meeting: "Meeting",
    call: "Call",
    email: "Email",
    task: "Task",
  };
  return typeMap[frontendType] || "Event";
};

/**
 * Transform frontend status to backend expected format
 * @param {string} frontendStatus - Frontend status (lowercase with underscores)
 * @returns {string} Backend status (capitalized with spaces)
 */
const transformEventStatus = (frontendStatus) => {
  const statusMap = {
    planned: "Planned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    not_started: "Not Started",
  };
  return statusMap[frontendStatus] || "Planned";
};

/**
 * Transform frontend event data to backend expected format
 * @param {Object} eventData - Frontend event data
 * @returns {Object} Backend-compatible event data
 */
const transformEventDataForBackend = (eventData) => {
  return {
    ...eventData,
    event_type: transformEventType(eventData.event_type),
    status: transformEventStatus(eventData.status),
  };
};

/**
 * Fetch calendar events for a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} Events response
 */
export async function fetchEvents(startDate, endDate, filters = {}) {
  try {
    const authData = getAuthData();

    // Create the request body with both query and auth as separate top-level objects
    // This matches the FastAPI endpoint signature: get_events(query: EventsQueryRequest, auth: CalendarAuthRequest)
    const requestBody = {
      query: {
        start_date: formatDateForApi(startDate),
        end_date: formatDateForApi(endDate),
        include_events: filters.includeEvents ?? true,
        include_tasks: false, // Tasks permanently excluded from calendar
        include_recurring: filters.includeRecurring ?? true,
        event_types: filters.eventTypes || [],
        statuses: filters.statuses || [],
        owner_ids: filters.ownerIds || [],
        account_ids: filters.accountIds || [],
        search_term: filters.searchTerm || "",
        limit: filters.limit || 1000,
        offset: filters.offset || 0,
      },
      auth: {
        access_token: authData.access_token,
        instance_url: authData.instance_url,
      },
    };

    console.log("📅 Fetching calendar events:", {
      startDate: formatDateForApi(startDate),
      endDate: formatDateForApi(endDate),
      filters,
      authPresent: !!authData.access_token,
    });

    const response = await calendarApi.post("/events", requestBody);

    console.log("✅ Calendar events fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching calendar events:", error);
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to fetch calendar events"
    );
  }
}

/**
 * Get a single calendar event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event data
 */
export async function getEvent(eventId) {
  try {
    const authData = getAuthData();

    // For GET requests with auth, we need to send auth data in request body
    const requestBody = {
      auth: {
        access_token: authData.access_token,
        instance_url: authData.instance_url,
      },
    };

    // Note: GET with body is not standard, but FastAPI expects it this way
    const response = await calendarApi.request({
      method: "GET",
      url: `/events/${eventId}`,
      data: requestBody,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching calendar event:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to fetch calendar event"
    );
  }
}

/**
 * Create a new calendar event
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Creation response
 */
export async function createEvent(eventData) {
  try {
    const authData = getAuthData();

    // Transform frontend data to backend expected format
    const transformedData = transformEventDataForBackend(eventData);

    // Create the request body matching FastAPI endpoint signature: create_event(request: EventCreateRequest, auth: CalendarAuthRequest)
    const requestBody = {
      request: transformedData,
      auth: {
        access_token: authData.access_token,
        instance_url: authData.instance_url,
      },
    };

    console.log("📅 Creating calendar event:", {
      eventData: transformedData,
      authPresent: !!authData.access_token,
    });

    const response = await calendarApi.post("/events/create", requestBody);

    console.log("✅ Calendar event created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating calendar event:", error);

    // Enhanced error handling for better debugging
    let errorMessage = "Failed to create calendar event";

    if (error.response?.data) {
      // Handle FastAPI validation errors
      if (error.response.data.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          const validationErrors = error.response.data.detail
            .map((err) => `${err.loc?.join(".")} - ${err.msg}`)
            .join("; ");
          errorMessage = `Validation error: ${validationErrors}`;
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Update an existing calendar event
 * @param {string} eventId - Event ID
 * @param {Object} eventData - Updated event data
 * @returns {Promise<Object>} Update response
 */
export async function updateEvent(eventId, eventData) {
  try {
    const authData = getAuthData();

    const response = await calendarApi.put(`/events/${eventId}`, eventData, {
      params: authData,
    });

    return response.data;
  } catch (error) {
    console.error("Error updating calendar event:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to update calendar event"
    );
  }
}

/**
 * Delete a calendar event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Deletion response
 */
export async function deleteEvent(eventId) {
  try {
    const authData = getAuthData();

    const response = await calendarApi.delete(`/events/${eventId}`, {
      params: authData,
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to delete calendar event"
    );
  }
}

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} Creation response
 */
export async function createTask(taskData) {
  try {
    const authData = getAuthData();

    // Transform frontend data to backend expected format
    const transformedData = transformEventDataForBackend(taskData);

    // Create the request body matching FastAPI endpoint signature: create_task(request: TaskCreateRequest, auth: CalendarAuthRequest)
    const requestBody = {
      request: transformedData,
      auth: {
        access_token: authData.access_token,
        instance_url: authData.instance_url,
      },
    };

    console.log("📋 Creating task:", {
      taskData: transformedData,
      authPresent: !!authData.access_token,
    });

    const response = await calendarApi.post("/tasks/create", requestBody);

    console.log("✅ Task created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating task:", error);

    // Enhanced error handling for better debugging
    let errorMessage = "Failed to create task";

    if (error.response?.data) {
      // Handle FastAPI validation errors
      if (error.response.data.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          const validationErrors = error.response.data.detail
            .map((err) => `${err.loc?.join(".")} - ${err.msg}`)
            .join("; ");
          errorMessage = `Validation error: ${validationErrors}`;
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Update an existing task
 * @param {string} taskId - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Promise<Object>} Update response
 */
export async function updateTask(taskId, taskData) {
  try {
    const authData = getAuthData();

    const response = await calendarApi.put(`/tasks/${taskId}`, taskData, {
      params: authData,
    });

    return response.data;
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error(
      error.response?.data?.detail || error.message || "Failed to update task"
    );
  }
}

/**
 * Get calendar statistics
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Object>} Statistics response
 */
export async function getCalendarStats(startDate, endDate) {
  try {
    const authData = getAuthData();

    const response = await calendarApi.post("/stats", null, {
      params: {
        ...authData,
        start_date: formatDateForApi(startDate),
        end_date: formatDateForApi(endDate),
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching calendar stats:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to fetch calendar statistics"
    );
  }
}

/**
 * Check calendar API health
 * @returns {Promise<Object>} Health status
 */
export async function checkCalendarHealth() {
  try {
    const response = await calendarApi.get("/health");
    return response.data;
  } catch (error) {
    console.error("Error checking calendar health:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to check calendar health"
    );
  }
}
