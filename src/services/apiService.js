import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // Adjust path as needed

// Define the base URL for the backend API.
// This should ideally come from an environment variable.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'; // Replace with your actual backend URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Attempt to get the latest valid token.
    // The ensureValidToken method in authStore should handle refresh if necessary.
    const accessToken = await useAuthStore.getState().ensureValidToken();
    
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      // Handle case where no token is available (e.g., redirect to login, or backend handles public routes)
      // For protected routes like file upload, this might result in a 401/403 if token is missing.
      console.warn('No access token available for API request to', config.url);
    }
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling errors globally
apiClient.interceptors.response.use(
  (response) => response, // Simply return a successful response
  async (error) => {
    const customError = {
      message: 'An unexpected error occurred.',
      status: null,
      isNetworkError: false,
      originalError: error, // Keep original error for debugging if needed
    };

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      customError.status = error.response.status;
      const responseData = error.response.data;

      if (responseData instanceof Blob && responseData.type === 'application/json') {
        // Attempt to parse error from blob (e.g., for download errors)
        try {
          const errorText = await responseData.text();
          const errorJson = JSON.parse(errorText);
          customError.message = errorJson.error?.message || errorJson.message || `Server error: ${customError.status}. Could not parse error details from blob.`;
        } catch (parseError) {
          customError.message = `Server error: ${customError.status}. Failed to parse error blob.`;
        }
      } else {
         customError.message = responseData?.error?.message || responseData?.message || `Server error: ${customError.status}`;
      }
      
      // Handle specific status codes globally if needed (e.g., 401 for logout)
      // if (customError.status === 401) {
      //   // Example: useAuthStore.getState().logout();
      //   // window.location.href = '/login'; // Or trigger navigation
      //   // This is a more aggressive approach, ensure it fits the app flow.
      // }

    } else if (error.request) {
      // The request was made but no response was received
      customError.message = 'Network error: No response from server. Please check your connection.';
      customError.isNetworkError = true;
    } else {
      // Something happened in setting up the request that triggered an Error
      customError.message = error.message || 'An error occurred while setting up the request.';
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
export const uploadFile = async (file, onUploadProgress, useAiEnhancement = true, aiModelPreference = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('useAiEnhancement', String(useAiEnhancement));
  if (aiModelPreference) {
    formData.append('aiModelPreference', aiModelPreference);
  }

  try {
    const response = await apiClient.post('/leads/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
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
    console.error('File upload error:', error.originalError || error); // Log original for details if available
    throw error; // Re-throw the error processed by the interceptor
  }
};

/**
 * Fetches Lead Distribution configuration settings.
 * @returns {Promise<object>} - The Lead Distribution settings data.
 */
export const getLeadDistributionSettings = async () => {
  try {
    const response = await apiClient.get('/config/lead-distribution');
    // Expected: { defaultOwner, roundRobinEnabled, rules: [...] }
    return response.data;
  } catch (error) {
    console.error('Error fetching Lead Distribution settings:', error.originalError || error);
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
    const response = await apiClient.put('/config/lead-distribution', settingsData);
    return response.data;
  } catch (error) {
    console.error('Error updating Lead Distribution settings:', error.originalError || error);
    throw error;
  }
};

/**
 * Fetches AI configuration settings.
 * @returns {Promise<object>} - The AI settings data.
 */
export const getAiSettings = async () => {
  try {
    const response = await apiClient.get('/config/ai');
    // Expected: { modelPreference, confidenceThreshold, customMappingRules, ... }
    return response.data;
  } catch (error) {
    console.error('Error fetching AI settings:', error.originalError || error);
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
    const response = await apiClient.put('/config/ai', settingsData);
    return response.data;
  } catch (error) {
    console.error('Error updating AI settings:', error.originalError || error);
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
    throw new Error('Processing ID is required to fetch job logs.');
  }
  try {
    const response = await apiClient.get(`/leads/history/${processingId}/logs`);
    // Expected: { processingId, fileName, logs: [{ timestamp, level, message }] }
    // We are interested in the logs array, but the contract says the response might be an object containing logs.
    // Let's assume the API returns { logs: [...] } or just [...]
    return response.data.logs || response.data; // Adjust if API returns logs directly as an array
  } catch (error) { // Fixed typo here: (error)_ to (error)
    console.error(`Error fetching logs for job ${processingId}:`, error.originalError || error);
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
    const response = await apiClient.get('/leads/history', {
      params: { page, limit },
    });
    // Expected: { pagination: { page, limit, totalItems, totalPages }, history: [...] }
    return response.data; 
  } catch (error) {
    console.error(`Error fetching processing history (page: ${page}, limit: ${limit}):`, error.originalError || error);
    throw error;
  }
};

/**
 * Downloads a processed file.
 * @param {string} downloadUrl - The specific URL to download the file from (e.g., /api/v1/leads/results/some-id/download).
 * @returns {Promise<AxiosResponse<Blob>>} - The Axios response object containing the file blob and headers.
 */
export const downloadProcessedFile = async (downloadUrl) => {
  if (!downloadUrl) {
    throw new Error('Download URL is required.');
  }
  try {
    const response = await apiClient.get(downloadUrl, {
      responseType: 'blob', // Important for handling file data
    });
    return response; // Contains data (blob), headers (content-disposition), etc.
  } catch (error) {
    // The response interceptor already handles parsing blob errors for other requests.
    // For download, the raw response is often more useful to the caller if it's not a JSON error.
    // However, if it IS a JSON error, the interceptor would have processed it.
    // If the interceptor modified the error significantly, this log might be less useful.
    // For now, let's assume the interceptor's standardized error is what we want.
    console.error(`Error downloading file from ${downloadUrl}:`, error.originalError || error);
    throw error; // Re-throw error processed by interceptor
  }
};

/**
 * Confirms the lead processing to proceed.
 * @param {string} processingId - The ID of the processing job.
 * @param {Array} confirmedMappings - For now, an empty array or minimal payload. Future: array of user-confirmed/overridden mappings.
 * @returns {Promise<object>} - The response data from the backend.
 */
export const confirmProcessing = async (processingId, confirmedMappings = []) => {
  if (!processingId) {
    throw new Error('Processing ID is required to confirm processing.');
  }
  try {
    // As per current task, confirmedMappings is an empty array.
    // If backend expects a specific structure even for no overrides, adjust payload.
    const payload = { confirmedMappings }; 
    const response = await apiClient.post(`/leads/process/${processingId}/confirm`, payload);
    // Expected: { processingId, message, statusUrl } or similar
    return response.data; 
  } catch (error) {
    console.error(`Error confirming processing for ${processingId}:`, error.originalError || error);
    throw error;
  }
};

export const getLeadPreview = async (processingId) => {
  if (!processingId) {
    throw new Error('Processing ID is required to fetch lead preview data.');
  }
  try {
    const response = await apiClient.get(`/leads/preview/${processingId}`);
    // Expected: { processingId, fileName, originalHeaders, mappedFields, dataPreview, validationIssues, availableSalesforceFields }
    return response.data; 
  } catch (error) {
    console.error(`Error fetching lead preview for ${processingId}:`, error.originalError || error);
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
    throw new Error('Processing ID is required to fetch status.');
  }
  try {
    const response = await apiClient.get(`/leads/status/${processingId}`);
    return response.data; // Expected: { processingId, fileName, status, progress, currentStage, message, resultUrl, previewUrl }
  } catch (error) {
    console.error(`Error fetching status for ${processingId}:`, error.originalError || error);
    throw error;
  }
};

export default apiClient; // Exporting the configured axios instance can be useful too.
