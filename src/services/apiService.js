import axios from "axios";
import { useAuthStore } from "../store/authStore"; // Adjust path as needed

// Define the base URL for the backend API.
// Automatically detects production vs development environment
const getApiBaseUrl = () => {
  // In production (Heroku), use relative URLs to the same domain
  if (import.meta.env.PROD) {
    return window.location.origin + "/api/v1";
  }

  // In development, use environment variable or localhost
  return (
    (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000") + "/api/v1"
  );
};

const API_BASE_URL = getApiBaseUrl();

console.log("🔗 API Base URL:", API_BASE_URL);
console.log("🌍 Environment:", import.meta.env.MODE);
console.log("🏭 Production:", import.meta.env.PROD);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  withCredentials: false, // Set to false for CORS
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  async (config) => {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );

    // For backend API requests, we'll use the Salesforce access token
    // In a production environment, you might want to exchange this for a backend-specific token
    const authStore = useAuthStore.getState();

    if (authStore.isAuthenticated && authStore.accessToken) {
      // Use the Salesforce access token for backend authentication
      // The backend will validate this token appropriately
      config.headers["Authorization"] = `Bearer ${authStore.accessToken}`;
      console.log("🔑 Using Salesforce access token");
    } else {
      // For demo purposes, we'll use a placeholder token
      // In production, redirect to login or handle unauthenticated requests
      console.warn(
        "⚠️ No access token available for API request to",
        config.url
      );
      config.headers["Authorization"] = `Bearer demo-token-${Date.now()}`;
      console.log("🔑 Using demo token");
    }

    // Log headers for debugging
    console.log("📋 Request headers:", {
      "Content-Type": config.headers["Content-Type"],
      Authorization: config.headers["Authorization"] ? "Bearer ***" : "None",
      Accept: config.headers["Accept"],
    });

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling errors globally
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Response: ${
        response.status
      } ${response.config.method?.toUpperCase()} ${response.config.url}`
    );
    return response;
  }, // Simply return a successful response
  async (error) => {
    console.error("❌ API Error:", error);

    const customError = {
      message: "An unexpected error occurred.",
      status: null,
      isNetworkError: false,
      isCorsError: false,
      originalError: error, // Keep original error for debugging if needed
    };

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      customError.status = error.response.status;
      const responseData = error.response.data;

      console.log(
        `🔴 Server Error: ${error.response.status} - ${error.response.statusText}`
      );

      if (
        responseData instanceof Blob &&
        responseData.type === "application/json"
      ) {
        // Attempt to parse error from blob (e.g., for download errors)
        try {
          const errorText = await responseData.text();
          const errorJson = JSON.parse(errorText);
          customError.message =
            errorJson.error?.message ||
            errorJson.message ||
            `Server error: ${customError.status}. Could not parse error details from blob.`;
        } catch (parseError) {
          customError.message = `Server error: ${customError.status}. Failed to parse error blob.`;
        }
      } else {
        customError.message =
          responseData?.error?.message ||
          responseData?.message ||
          `Server error: ${customError.status}`;
      }

      // Handle specific status codes globally if needed (e.g., 401 for logout)
      // if (customError.status === 401) {
      //   // Example: useAuthStore.getState().logout();
      //   // window.location.href = '/login'; // Or trigger navigation
      //   // This is a more aggressive approach, ensure it fits the app flow.
      // }
    } else if (error.request) {
      // The request was made but no response was received
      customError.isNetworkError = true;

      console.log("🌐 Network Error Details:", {
        code: error.code,
        message: error.message,
        request: error.request,
      });

      // Check for CORS errors
      if (
        error.message.includes("CORS") ||
        error.message.includes("Access-Control-Allow-Origin") ||
        error.message.includes("Cross-Origin Request Blocked") ||
        (error.code === "ERR_NETWORK" && error.request.status === 0)
      ) {
        customError.isCorsError = true;
        customError.message =
          "CORS Error: The backend server is not allowing requests from this origin. " +
          "Please check that the backend server is running on localhost:8000 and has CORS properly configured for localhost:5173.";
      }
      // Check for specific connection errors
      else if (
        error.code === "ERR_NETWORK" ||
        error.message.includes("ERR_CONNECTION_REFUSED") ||
        error.message.includes("ECONNREFUSED")
      ) {
        customError.message =
          "Backend server is not running. Please start the backend server on localhost:8000 using 'python backend/start_server.py' or run 'start_backend.bat'.";
      } else {
        customError.message =
          "Network error: No response from server. Please check your connection.";
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      customError.message =
        error.message || "An error occurred while setting up the request.";
    }

    // Instead of directly throwing new Error(customError.message),
    // we reject with an object that has a message property,
    // so that individual catch blocks can still use `err.message`.
    // Or, we can throw a custom Error class if preferred.
    return Promise.reject(new Error(customError.message)); // Keep it simple for now
  }
);

/**
 * Uploads a file to the backend.
 * @param {File} file - The file to upload.
 * @param {function(number):void} onUploadProgress - Callback function to update upload progress (0-100).
 * @param {boolean} useAiEnhancement - Whether to use AI enhancement.
 * @param {string|null} aiModelPreference - Preferred AI model.
 * @returns {Promise<object>} - The response data from the backend (e.g., { processingId, statusUrl }).
 */
export const uploadFile = async (
  file,
  onUploadProgress,
  useAiEnhancement = true,
  aiModelPreference = null
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("useAiEnhancement", String(useAiEnhancement));
  if (aiModelPreference) {
    formData.append("aiModelPreference", aiModelPreference);
  }

  console.log(`🤖 Uploading file with AI enhancement: ${useAiEnhancement}`);

  try {
    const response = await apiClient.post("/leads/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        } else {
          // Fallback if total size is not known (less common for uploads)
          // This might require a different progress calculation or just show indeterminate progress.
          // For simplicity, we assume progressEvent.total is available.
          onUploadProgress(0); // Or handle appropriately
        }
      },
    });
    return response.data; // Expected: { processingId, fileName, message, statusUrl, previewUrl }
  } catch (error) {
    console.error("File upload error:", error.originalError || error); // Log original for details if available
    throw error; // Re-throw the error processed by the interceptor
  }
};

/**
 * Fetches Lead Distribution configuration settings.
 * @returns {Promise<object>} - The Lead Distribution settings data.
 */
export const getLeadDistributionSettings = async () => {
  try {
    const response = await apiClient.get("/config/lead-distribution");
    // Expected: { defaultOwner, roundRobinEnabled, rules: [...] }
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching Lead Distribution settings:",
      error.originalError || error
    );
    throw error;
  }
};

/**
 * Updates Lead Distribution configuration settings.
 * @param {object} settingsData - The Lead Distribution settings data to update.
 * @returns {Promise<object>} - The updated Lead Distribution settings data from the backend.
 */
export const updateLeadDistributionSettings = async (settingsData) => {
  try {
    const response = await apiClient.put(
      "/config/lead-distribution",
      settingsData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating Lead Distribution settings:",
      error.originalError || error
    );
    throw error;
  }
};

/**
 * Fetches AI configuration settings.
 * @returns {Promise<object>} - The AI settings data.
 */
export const getAiSettings = async () => {
  try {
    const response = await apiClient.get("/config/ai");
    // Expected: { modelPreference, confidenceThreshold, customMappingRules, ... }
    return response.data;
  } catch (error) {
    console.error("Error fetching AI settings:", error.originalError || error);
    throw error;
  }
};

/**
 * Updates AI configuration settings.
 * @param {object} settingsData - The AI settings data to update.
 * @returns {Promise<object>} - The updated AI settings data from the backend.
 */
export const updateAiSettings = async (settingsData) => {
  try {
    const response = await apiClient.put("/config/ai", settingsData);
    return response.data;
  } catch (error) {
    console.error("Error updating AI settings:", error.originalError || error);
    throw error;
  }
};

/**
 * Fetches detailed logs for a specific processing job.
 * @param {string} processingId - The ID of the processing job.
 * @returns {Promise<Array<object>>} - An array of log objects.
 */
export const getJobLogs = async (processingId) => {
  if (!processingId) {
    throw new Error("Processing ID is required to fetch job logs.");
  }
  try {
    const response = await apiClient.get(`/leads/history/${processingId}/logs`);
    // Expected: { processingId, fileName, logs: [{ timestamp, level, message }] }
    // We are interested in the logs array, but the contract says the response might be an object containing logs.
    // Let's assume the API returns { logs: [...] } or just [...]
    return response.data.logs || response.data; // Adjust if API returns logs directly as an array
  } catch (error) {
    // Fixed typo here: (error)_ to (error)
    console.error(
      `Error fetching logs for job ${processingId}:`,
      error.originalError || error
    );
    throw error;
  }
};

/**
 * Fetches the processing history.
 * @param {number} page - The page number to fetch.
 * @param {number} limit - The number of items per page.
 * @returns {Promise<object>} - The history data including 'history' array and 'pagination' object.
 */
export const getProcessingHistory = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get("/leads/history", {
      params: { page, limit },
    });
    // Expected: { pagination: { page, limit, totalItems, totalPages }, history: [...] }
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching processing history (page: ${page}, limit: ${limit}):`,
      error.originalError || error
    );
    throw error;
  }
};

/**
 * Clears all processing history.
 * @returns {Promise<object>} - The result of the clear operation.
 */
export const clearProcessingHistory = async () => {
  try {
    const response = await apiClient.delete("/leads/history/clear");
    return response.data;
  } catch (error) {
    console.error(
      "Error clearing processing history:",
      error.originalError || error
    );
    throw error;
  }
};

/**
 * Clears all ready files (completed processing jobs).
 * @returns {Promise<object>} - The result of the clear operation.
 */
export const clearReadyFiles = async () => {
  try {
    const response = await apiClient.delete("/leads/files/clear");
    return response.data;
  } catch (error) {
    console.error("Error clearing ready files:", error.originalError || error);
    throw error;
  }
};

/**
 * Downloads a processed file.
 * @param {string} downloadUrl - The specific URL to download the file from (e.g., /leads/download/some-id).
 * @returns {Promise<AxiosResponse<Blob>>} - The Axios response object containing the file blob and headers.
 */
export const downloadProcessedFile = async (downloadUrl) => {
  if (!downloadUrl) {
    throw new Error("Download URL is required.");
  }
  try {
    const response = await apiClient.get(downloadUrl, {
      responseType: "blob", // Important for handling file data
    });
    return response; // Contains data (blob), headers (content-disposition), etc.
  } catch (error) {
    // The response interceptor already handles parsing blob errors for other requests.
    // For download, the raw response is often more useful to the caller if it's not a JSON error.
    // However, if it IS a JSON error, the interceptor would have processed it.
    // If the interceptor modified the error significantly, this log might be less useful.
    // For now, let's assume the interceptor's standardized error is what we want.
    console.error(
      `Error downloading file from ${downloadUrl}:`,
      error.originalError || error
    );
    throw error; // Re-throw error processed by interceptor
  }
};

/**
 * Confirms the lead processing to proceed.
 * @param {string} processingId - The ID of the processing job.
 * @param {Array} confirmedMappings - For now, an empty array or minimal payload. Future: array of user-confirmed/overridden mappings.
 * @returns {Promise<object>} - The response data from the backend.
 */
export const confirmProcessing = async (
  processingId,
  confirmedMappings = []
) => {
  if (!processingId) {
    throw new Error("Processing ID is required to confirm processing.");
  }
  try {
    // As per current task, confirmedMappings is an empty array.
    // If backend expects a specific structure even for no overrides, adjust payload.
    const payload = { confirmedMappings };
    const response = await apiClient.post(
      `/leads/process/${processingId}/confirm`,
      payload
    );
    // Expected: { processingId, message, statusUrl } or similar
    return response.data;
  } catch (error) {
    console.error(
      `Error confirming processing for ${processingId}:`,
      error.originalError || error
    );
    throw error;
  }
};

export const getLeadPreview = async (processingId) => {
  if (!processingId) {
    throw new Error("Processing ID is required to fetch lead preview data.");
  }
  try {
    const response = await apiClient.get(`/leads/preview/${processingId}`);
    // Expected: { processingId, fileName, originalHeaders, mappedFields, dataPreview, validationIssues, availableSalesforceFields }
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching lead preview for ${processingId}:`,
      error.originalError || error
    );
    throw error;
  }
};

// Example: Add other API service functions here
// export const getProcessingStatus = async (processingId) => {
//   try {
//     const response = await apiClient.get(`/leads/status/${processingId}`);
//     return response.data;
//   } catch (error) {
//     console.error(`Error fetching status for ${processingId}:`, error);
//     throw error.response?.data || error;
//   }
// };

export const getProcessingStatus = async (processingId) => {
  if (!processingId) {
    throw new Error("Processing ID is required to fetch status.");
  }
  try {
    const response = await apiClient.get(`/leads/status/${processingId}`);
    return response.data; // Expected: { processingId, fileName, status, progress, currentStage, message, resultUrl, previewUrl }
  } catch (error) {
    console.error(
      `Error fetching status for ${processingId}:`,
      error.originalError || error
    );
    throw error;
  }
};

export default apiClient; // Exporting the configured axios instance can be useful too.
