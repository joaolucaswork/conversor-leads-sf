// Salesforce API service for uploading leads and managing Salesforce operations
import { isBrowser, isElectron, electronAPI } from "../utils/environment";
import { useAuthStore } from "../store/authStore";

/**
 * Uploads processed lead data to Salesforce
 * @param {string} filePath - Path to the processed CSV file
 * @param {string} salesforceObject - Salesforce object type (Lead, Contact, Account)
 * @param {object} options - Additional upload options
 * @returns {Promise<object>} - Upload result
 */
export const uploadLeadsToSalesforce = async (
  filePath,
  salesforceObject = "Lead",
  options = {}
) => {
  try {
    console.log(
      "SalesforceService - Checking environment and API availability:",
      {
        isElectron: isElectron(),
        isBrowser: isBrowser(),
        hasElectronAPI: !!electronAPI,
      }
    );

    // Note: Authentication validation is now handled by the calling component (SalesforcePage)
    // to prevent recursive validation calls and stack overflow issues.
    console.log(
      "SalesforceService - Proceeding with upload (authentication pre-validated by caller)..."
    );

    console.log("SalesforceService - Uploading to Salesforce:", {
      filePath,
      salesforceObject,
      options,
    });

    console.log(
      "SalesforceService - Calling electronAPI.uploadToSalesforce with:",
      {
        filePath,
        salesforceObject,
        options,
        environment: isElectron() ? "Electron" : "Browser",
      }
    );

    // Use the environment-aware electronAPI which handles both Electron and browser modes
    const result = await electronAPI.uploadToSalesforce({
      filePath,
      salesforceObject,
      processingId: options.processingId,
      fileName: options.fileName,
      ...options,
    });

    console.log("SalesforceService - Raw upload result:", result);

    // Enhanced error analysis
    if (!result) {
      throw new Error("No response received from Salesforce upload API");
    }

    // Check for different types of errors
    if (result.errorType) {
      console.error(`SalesforceService - Error type: ${result.errorType}`);

      switch (result.errorType) {
        case "FILE_NOT_FOUND":
          throw new Error(
            `File not found: ${filePath}. Please ensure the processed file exists.`
          );
        case "CSV_READ_ERROR":
          throw new Error(
            `Failed to read CSV file: ${result.error}. The file may be corrupted or in an invalid format.`
          );
        case "EMPTY_FILE":
          throw new Error(
            `The CSV file is empty. Please ensure the file contains lead data.`
          );
        case "MISSING_REQUIRED_FIELDS":
          let errorMessage = `Missing required fields: ${result.missingFields?.join(
            ", "
          )}`;

          if (result.originalFields && result.mappingInfo) {
            errorMessage += `\n\nField Mapping Details:`;
            errorMessage += `\n• Original fields: ${result.originalFields.join(
              ", "
            )}`;
            errorMessage += `\n• Mapped fields: ${result.availableFields?.join(
              ", "
            )}`;

            if (result.mappingInfo.mapping_details) {
              errorMessage += `\n• Applied mappings:`;
              Object.entries(result.mappingInfo.mapping_details).forEach(
                ([source, target]) => {
                  errorMessage += `\n  - "${source}" → "${target}"`;
                }
              );
            }

            if (result.mappingInfo.unmapped_fields?.length > 0) {
              errorMessage += `\n• Unmapped fields: ${result.mappingInfo.unmapped_fields.join(
                ", "
              )}`;
            }
          } else {
            errorMessage += `. Available fields: ${result.availableFields?.join(
              ", "
            )}`;
          }

          throw new Error(errorMessage);
        case "FIELD_MAPPING_ERROR":
          throw new Error(
            `Field mapping failed: ${result.error}. Please check your processed file format and ensure it contains the expected columns.`
          );
        case "PYTHON_EXECUTION_ERROR":
          throw new Error(
            `Python script execution failed (exit code ${result.exitCode}): ${
              result.stderr || result.error
            }`
          );
        case "PARSE_ERROR":
          throw new Error(
            `Failed to parse response from Python script: ${result.error}. Raw output: ${result.rawOutput}`
          );
        default:
          throw new Error(
            `Upload failed (${result.errorType}): ${result.error}`
          );
      }
    }

    if (result && result.success) {
      // Update last file upload timestamp in auth store
      try {
        const authStore = useAuthStore.getState();
        authStore.updateLastFileUpload();
        console.log("SalesforceService - Updated last file upload timestamp");
      } catch (error) {
        console.warn(
          "SalesforceService - Failed to update last upload timestamp:",
          error
        );
      }

      // Enhanced success response with detailed information
      const enhancedResult = {
        success: true,
        recordsProcessed: result.recordsProcessed || 0,
        recordsSuccessful: result.recordsSuccessful || 0,
        recordsFailed: result.recordsFailed || 0,
        successRate: result.successRate || 0,
        errors: result.errors || [],
        detailedErrors: result.detailedErrors || [],
        jobId: result.jobId,
        message: result.message || "Upload completed successfully",
        csvInfo: result.csvInfo || {},
        // Include duplicate information if present
        hasDuplicates: result.hasDuplicates || false,
        duplicatesDetected: result.duplicatesDetected || [],
      };

      // Even if upload was successful, check if there are duplicates that need user attention
      if (
        result.hasDuplicates &&
        result.duplicatesDetected &&
        result.duplicatesDetected.length > 0
      ) {
        console.log(
          "SalesforceService - Duplicates detected in successful upload:",
          {
            duplicatesCount: result.duplicatesDetected.length,
            duplicates: result.duplicatesDetected,
          }
        );

        // Update the message to indicate duplicates were found
        enhancedResult.message = `Upload completed with ${result.duplicatesDetected.length} duplicates detected: ${result.recordsSuccessful} successful, ${result.recordsFailed} failed`;
      }

      console.log("SalesforceService - Enhanced result:", enhancedResult);
      return enhancedResult;
    } else {
      // Handle cases where success is false but no errorType is set
      const errorMessage = result?.error || "Failed to upload to Salesforce";
      const detailedErrors = result?.detailedErrors || [];

      console.error("SalesforceService - Upload failed:", {
        error: errorMessage,
        detailedErrors,
        fullResult: result,
      });

      // Check if this is a duplicate detection scenario
      const hasDuplicates = result?.hasDuplicates || false;
      const duplicatesDetected = result?.duplicatesDetected || [];

      // If we have duplicates detected, return the result instead of throwing an error
      if (hasDuplicates && duplicatesDetected.length > 0) {
        console.log(
          "SalesforceService - Duplicates detected, returning result for user handling:",
          {
            duplicatesCount: duplicatesDetected.length,
            duplicates: duplicatesDetected,
          }
        );

        // Return a structured result that includes duplicate information
        return {
          success: false,
          hasDuplicates: true,
          duplicatesDetected: duplicatesDetected,
          recordsProcessed: result.recordsProcessed || 0,
          recordsSuccessful: result.recordsSuccessful || 0,
          recordsFailed: result.recordsFailed || 0,
          successRate: result.successRate || 0,
          errors: result.errors || [],
          detailedErrors: detailedErrors,
          message: `Upload partially completed. ${duplicatesDetected.length} duplicate records detected and require user action.`,
          csvInfo: result.csvInfo || {},
        };
      }

      // For non-duplicate errors, create a comprehensive error message and throw
      let fullErrorMessage = errorMessage;
      if (detailedErrors.length > 0) {
        const errorSummary = detailedErrors
          .slice(0, 3)
          .map((err) => {
            if (err.salesforceErrors && err.salesforceErrors.length > 0) {
              return err.salesforceErrors
                .map(
                  (sfErr) =>
                    `${sfErr.statusCode || "ERROR"}: ${
                      sfErr.message || "Unknown error"
                    }`
                )
                .join("; ");
            }
            return err.exception || err.message || "Unknown error";
          })
          .join(" | ");

        fullErrorMessage += `. Detailed errors: ${errorSummary}`;
        if (detailedErrors.length > 3) {
          fullErrorMessage += ` (and ${detailedErrors.length - 3} more errors)`;
        }
      }

      throw new Error(fullErrorMessage);
    }
  } catch (error) {
    console.error("Error uploading to Salesforce:", error);
    throw error;
  }
};

/**
 * Gets the status of a Salesforce bulk upload job
 * @param {string} jobId - Salesforce job ID
 * @returns {Promise<object>} - Job status
 */
export const getSalesforceJobStatus = async (jobId) => {
  try {
    // Note: getSalesforceJobStatus is not yet implemented in environment.js
    // For now, we'll use window.electronAPI directly with fallback
    const api = isElectron() ? window.electronAPI : null;

    if (!api || typeof api.getSalesforceJobStatus !== "function") {
      throw new Error(
        "Salesforce job status API is not available in current environment."
      );
    }

    const result = await api.getSalesforceJobStatus(jobId);

    if (result && result.success) {
      return {
        success: true,
        jobId: result.jobId,
        state: result.state, // JobComplete, InProgress, Failed, etc.
        recordsProcessed: result.recordsProcessed || 0,
        recordsSuccessful: result.recordsSuccessful || 0,
        recordsFailed: result.recordsFailed || 0,
        createdDate: result.createdDate,
        completedDate: result.completedDate,
        errors: result.errors || [],
      };
    } else {
      throw new Error(result?.error || "Failed to get job status");
    }
  } catch (error) {
    console.error("Error getting Salesforce job status:", error);
    throw error;
  }
};

/**
 * Validates Salesforce connection and permissions
 * @returns {Promise<object>} - Connection validation result
 */
export const validateSalesforceConnection = async () => {
  try {
    // Use the unified electronAPI from environment.js which has browser fallbacks
    const result = await electronAPI.validateSalesforceConnection();

    if (result && result.success) {
      return {
        success: true,
        userInfo: result.userInfo || {},
        permissions: result.permissions || [],
        limits: result.limits || {},
        message: result.message || "Connection validated successfully",
      };
    } else {
      throw new Error(
        result?.error || "Failed to validate Salesforce connection"
      );
    }
  } catch (error) {
    console.error("Error validating Salesforce connection:", error);
    throw error;
  }
};

/**
 * Gets available Salesforce objects that can be used for import
 * @returns {Promise<Array>} - List of available Salesforce objects
 */
export const getSalesforceObjects = async () => {
  try {
    // Use the unified electronAPI from environment.js which has browser fallbacks
    const result = await electronAPI.getSalesforceObjects();

    if (result && result.success) {
      return result.objects || [];
    } else {
      throw new Error(result?.error || "Failed to get Salesforce objects");
    }
  } catch (error) {
    console.error("Error getting Salesforce objects:", error);
    // Return default objects on error
    return [
      { name: "Lead", label: "Lead", createable: true },
      { name: "Contact", label: "Contact", createable: true },
      { name: "Account", label: "Account", createable: true },
    ];
  }
};

/**
 * Gets field mapping suggestions for a Salesforce object
 * @param {string} objectName - Salesforce object name
 * @param {Array} csvHeaders - Headers from the CSV file
 * @returns {Promise<object>} - Field mapping suggestions
 */
export const getSalesforceFieldMapping = async (objectName, csvHeaders) => {
  try {
    // Use the unified electronAPI from environment.js which has browser fallbacks
    const result = await electronAPI.getSalesforceFieldMapping({
      objectName,
      csvHeaders,
    });

    if (result && result.success) {
      return {
        success: true,
        mappings: result.mappings || {},
        availableFields: result.availableFields || [],
        requiredFields: result.requiredFields || [],
        suggestions: result.suggestions || {},
      };
    } else {
      throw new Error(result?.error || "Failed to get field mapping");
    }
  } catch (error) {
    console.error("Error getting Salesforce field mapping:", error);
    throw error;
  }
};

/**
 * Downloads a processed file for Salesforce upload
 * @param {string} processingId - Processing ID of the file
 * @returns {Promise<Blob>} - File blob for download
 */
export const downloadProcessedFile = async (processingId) => {
  try {
    if (!processingId) {
      throw new Error("Processing ID is required to download file.");
    }

    // Use the backend API to download the processed file
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(
      `${baseUrl}/api/v1/leads/download/${processingId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("authToken") || "dummy-token"
          }`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          "Processed file not found. The file may have been deleted or the processing ID is invalid."
        );
      }
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Error downloading processed file:", error);
    throw error;
  }
};

/**
 * Utility function to format Salesforce upload results for display
 * @param {object} result - Upload result from Salesforce
 * @returns {object} - Formatted result for UI display
 */
export const formatSalesforceResult = (result) => {
  if (!result) return null;

  const successRate =
    result.recordsProcessed > 0
      ? Math.round((result.recordsSuccessful / result.recordsProcessed) * 100)
      : 0;

  return {
    ...result,
    successRate,
    hasErrors: result.recordsFailed > 0,
    summary: `${result.recordsSuccessful}/${result.recordsProcessed} records uploaded successfully (${successRate}%)`,
  };
};

export default {
  uploadLeadsToSalesforce,
  getSalesforceJobStatus,
  validateSalesforceConnection,
  getSalesforceObjects,
  getSalesforceFieldMapping,
  downloadProcessedFile,
  formatSalesforceResult,
};
