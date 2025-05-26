# Proposed API Contracts: Electron Frontend to Python Backend

This document outlines the proposed API contracts for communication between the Electron frontend application and the Python backend. These contracts cover functionalities such as file upload, processing, status updates, data preview, downloads, history, and configuration management.

## General Considerations

*   **Base URL:** All endpoints are prefixed with `/api/v1`.
*   **Authentication:** All endpoints are expected to be protected and require an `Authorization: Bearer <token>` header. The nature of the `<token>` (e.g., forwarded Salesforce access token, dedicated backend API key) will be defined by the backend's security architecture.
*   **Error Responses:** All error responses (4xx, 5xx) should follow a consistent JSON structure:
    ```json
    {
      "error": {
        "code": "ERROR_CODE_STRING", // e.g., "VALIDATION_ERROR", "UNAUTHENTICATED", "PROCESSING_FAILED"
        "message": "A human-readable error message providing context.",
        "details": {} // Optional: specific field errors, stack trace snippets (in dev), or other relevant context
      }
    }
    ```
*   **Content Type:** Unless otherwise specified (e.g., file uploads/downloads), requests and responses should use `application/json`.

## API Endpoints

### 1. File Upload

*   **Endpoint:** `/leads/upload`
*   **Method:** `POST`
*   **Description:** Uploads an Excel or CSV file containing lead data for processing.
*   **Request:**
    *   `Content-Type: multipart/form-data`
    *   Body:
        *   `file`: The lead data file (e.g., `leads.xlsx`, `contacts.csv`).
        *   `useAiEnhancement` (optional boolean, defaults to true): Specifies if AI processing should be used.
        *   `aiModelPreference` (optional string, e.g., "gpt-4", "gpt-3.5-turbo"): User's preferred AI model if applicable.
*   **Response (Success - 202 Accepted):**
    Indicates the file has been received and processing has been queued.
    ```json
    {
      "processingId": "unique_processing_job_id_string_generated_by_backend",
      "fileName": "uploaded_file_name.xlsx",
      "message": "File uploaded successfully. Processing has started.",
      "statusUrl": "/api/v1/leads/status/unique_processing_job_id_string_generated_by_backend",
      "previewUrl": "/api/v1/leads/preview/unique_processing_job_id_string_generated_by_backend" // URL to check for initial mapping preview
    }
    ```
*   **Response (Error):**
    *   `400 Bad Request`: Missing file, invalid parameters.
    *   `413 Payload Too Large`: File exceeds size limits.
    *   `415 Unsupported Media Type`: File is not a supported type (Excel/CSV).
    *   `500 Internal Server Error`: Backend error during initial acceptance.

### 2. Processing Status

*   **Endpoint:** `/leads/status/{processingId}`
*   **Method:** `GET`
*   **Description:** Fetches the real-time status, progress, and current stage of a specific lead processing job.
*   **Request Parameters:**
    *   `processingId` (in path): The unique ID of the processing job.
*   **Response (Success - 200 OK):**
    ```json
    {
      "processingId": "unique_processing_job_id_string",
      "fileName": "uploaded_file_name.xlsx",
      "status": "processing", // e.g., "queued", "preprocessing", "validating_data", "ai_mapping_fields", "user_review_pending", "generating_output", "completed", "failed", "partial_success"
      "progress": 75, // Overall percentage (0-100)
      "currentStage": "ai_mapping_fields", // More granular stage description
      "message": "Currently mapping fields using AI. 1500 of 2000 rows processed.", // Dynamic message
      "details": { // Optional: context-specific details for the current stage
        "rowsProcessed": 1500,
        "totalRows": 2000,
        "warnings": 5 // Number of non-critical issues found so far
      },
      "resultUrl": "/api/v1/leads/results/unique_processing_job_id_string", // Available when status is "completed" or "partial_success"
      "previewUrl": "/api/v1/leads/preview/unique_processing_job_id_string" // Still available if review is pending or for completed jobs
    }
    ```
*   **Response (Error):**
    *   `404 Not Found`: `processingId` does not exist.
    *   `500 Internal Server Error`.

### 3. AI Field Mapping Visualization / Data Preview

*   **Endpoint:** `/leads/preview/{processingId}`
*   **Method:** `GET`
*   **Description:** Retrieves AI-suggested field mappings, confidence scores, and a preview of the transformed data. This is typically available after an initial processing stage and before final confirmation (if user review is enabled).
*   **Request Parameters:**
    *   `processingId` (in path): The unique ID of the processing job.
*   **Response (Success - 200 OK):**
    ```json
    {
      "processingId": "unique_processing_job_id_string",
      "fileName": "uploaded_file_name.xlsx",
      "originalHeaders": ["nome completo", "email comercial", "empresa", "cargo", "telefone", "Observacoes"],
      "mappedFields": [
        { "originalHeader": "nome completo", "aiSuggestion": "Lead.FullName", "userOverride": null, "confidence": 0.95, "status": "mapped" },
        { "originalHeader": "email comercial", "aiSuggestion": "Lead.Email", "userOverride": null, "confidence": 0.99, "status": "mapped" },
        { "originalHeader": "empresa", "aiSuggestion": "Account.Name", "userOverride": null, "confidence": 0.85, "status": "mapped" },
        { "originalHeader": "cargo", "aiSuggestion": "Lead.Title", "userOverride": null, "confidence": 0.90, "status": "mapped" },
        { "originalHeader": "telefone", "aiSuggestion": "Lead.Phone", "userOverride": null, "confidence": 0.92, "status": "mapped" },
        { "originalHeader": "Observacoes", "aiSuggestion": "Lead.Description", "userOverride": "Lead.CustomNotes__c", "confidence": 0.70, "status": "user_overridden" }, // Example of user override
        { "originalHeader": "data_nascimento", "aiSuggestion": null, "userOverride": null, "confidence": 0.0, "status": "unmapped" } // Example of unmapped field
      ],
      "dataPreview": [ // Array of a few sample rows (e.g., first 5-10) with original and AI-suggested transformed data
        { "original": { "nome completo": "John Doe", "email comercial": "john.doe@example.com", ... }, "preview": { "Lead.FullName": "John Doe", "Lead.Email": "john.doe@example.com", ... } },
        { "original": { "nome completo": "Jane Smith", "email comercial": "jane.smith@example.com", ... }, "preview": { "Lead.FullName": "Jane Smith", "Lead.Email": "jane.smith@example.com", ... } }
      ],
      "validationIssues": [ // Optional: Any validation errors found during preprocessing or initial mapping
        { "rowNumber": 5, "originalHeader": "email comercial", "value": "john.doe", "message": "Invalid email format." },
        { "rowNumber": 12, "originalHeader": "telefone", "value": "ABC-123", "message": "Invalid phone number format." }
      ],
      "availableSalesforceFields": ["Lead.FirstName", "Lead.LastName", "Lead.Email", "Lead.Company", "Lead.Phone", "Lead.Description", "Account.Name", "Lead.CustomNotes__c", "..."] // List of target SF fields
    }
    ```
*   **Response (Error):**
    *   `404 Not Found`: `processingId` does not exist or preview is not yet available.
    *   `500 Internal Server Error`.

### 4. Confirm Processing / Update Mappings

*   **Endpoint:** `/leads/process/{processingId}/confirm`
*   **Method:** `POST`
*   **Description:** Allows the user to confirm or update the AI-suggested field mappings and then proceed with the full data processing.
*   **Request Parameters:**
    *   `processingId` (in path): The unique ID of the processing job.
*   **Request Body:**
    ```json
    {
      "confirmedMappings": [ // Send only fields that are being confirmed or overridden by the user
        { "originalHeader": "nome completo", "mappedTo": "Lead.FullName" }, // Confirming AI suggestion
        { "originalHeader": "Observacoes", "mappedTo": "Lead.CustomNotes__c" }, // User override
        { "originalHeader": "data_nascimento", "mappedTo": null } // Explicitly unmapping a field
        // ... other fields as necessary
      ]
    }
    ```
*   **Response (Success - 200 OK):**
    ```json
    {
      "processingId": "unique_processing_job_id_string",
      "message": "Mappings confirmed. Full processing initiated.",
      "statusUrl": "/api/v1/leads/status/unique_processing_job_id_string"
    }
    ```
*   **Response (Error):**
    *   `400 Bad Request`: Invalid mapping data provided.
    *   `404 Not Found`: `processingId` does not exist.
    *   `409 Conflict`: Processing job is not in a state that allows confirmation (e.g., already completed or failed).
    *   `500 Internal Server Error`.

### 5. Download Processed File

*   **Endpoint:** `/leads/results/{processingId}/download`
*   **Method:** `GET`
*   **Description:** Downloads the processed lead file, typically a CSV ready for Salesforce import.
*   **Request Parameters:**
    *   `processingId` (in path): The unique ID of the processing job.
*   **Response (Success - 200 OK):**
    *   `Content-Type`: `text/csv` (or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` if Excel output is supported)
    *   `Content-Disposition`: `attachment; filename="salesforce_ready_leads_processingId.csv"`
    *   Body: The raw file content.
*   **Response (Error):**
    *   `404 Not Found`: `processingId` does not exist or results are not available.
    *   `410 Gone`: Results may have expired based on retention policy.
    *   `500 Internal Server Error`.

### 6. Processing History

*   **Endpoint:** `/leads/history`
*   **Method:** `GET`
*   **Description:** Fetches a paginated list of past lead processing jobs for the authenticated user.
*   **Request Query Parameters:**
    *   `page` (optional, integer, default: 1): For pagination.
    *   `limit` (optional, integer, default: 10): Number of items per page.
    *   `sortBy` (optional, string, default: `uploadedAt`): Field to sort by (e.g., `uploadedAt`, `fileName`, `status`).
    *   `sortOrder` (optional, string, default: `desc`): `asc` or `desc`.
    *   `statusFilter` (optional, string): Filter by status (e.g., "completed", "failed").
    *   `dateFrom` (optional, string, ISO 8601 format): Filter jobs uploaded from this date.
    *   `dateTo` (optional, string, ISO 8601 format): Filter jobs uploaded up to this date.
*   **Response (Success - 200 OK):**
    ```json
    {
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalItems": 123,
        "totalPages": 13
      },
      "history": [
        {
          "processingId": "job_id_1",
          "fileName": "leads_q1_2023.xlsx",
          "uploadedAt": "2023-10-26T10:00:00Z",
          "status": "completed", // "completed", "failed", "partial_success", "user_review_pending"
          "recordCount": 1500, // Total records in the input file
          "processedCount": 1498, // Records successfully processed
          "errorCount": 2, // Records that had errors
          "resultUrl": "/api/v1/leads/results/job_id_1/download", // If applicable
          "previewUrl": "/api/v1/leads/preview/job_id_1",
          "logsUrl": "/api/v1/leads/history/job_id_1/logs"
        }
        // ... other history items
      ]
    }
    ```
*   **Response (Error):**
    *   `400 Bad Request`: Invalid query parameters.
    *   `500 Internal Server Error`.

### 7. Processing Log Details

*   **Endpoint:** `/leads/history/{processingId}/logs`
*   **Method:** `GET`
*   **Description:** Fetches detailed processing logs for a specific historical job.
*   **Request Parameters:**
    *   `processingId` (in path): The unique ID of the processing job.
*   **Response (Success - 200 OK):**
    ```json
    {
      "processingId": "job_id_1",
      "fileName": "leads_q1_2023.xlsx",
      "logs": [
        { "timestamp": "2023-10-26T10:00:05Z", "level": "INFO", "stage": "preprocessing", "message": "File received, starting preprocessing. 1500 records detected." },
        { "timestamp": "2023-10-26T10:00:15Z", "level": "INFO", "stage": "ai_mapping_fields", "message": "AI field mapping initiated for 5 headers." },
        { "timestamp": "2023-10-26T10:00:30Z", "level": "WARN", "stage": "validation", "message": "Row 53: Column 'zip_code' has invalid format 'ABCDE'. Attempting normalization." },
        { "timestamp": "2023-10-26T10:00:35Z", "level": "ERROR", "stage": "validation", "message": "Row 60: Column 'email' is empty. Record cannot be processed without email." },
        { "timestamp": "2023-10-26T10:01:00Z", "level": "INFO", "stage": "output_generation", "message": "Processing completed. 1498 records successfully processed, 2 records failed." }
      ]
    }
    ```
*   **Response (Error):**
    *   `404 Not Found`: `processingId` does not exist.
    *   `500 Internal Server Error`.

### 8. Configuration Management - Get AI Settings

*   **Endpoint:** `/config/ai`
*   **Method:** `GET`
*   **Description:** Retrieves the current AI processing settings relevant to the user or system defaults.
*   **Response (Success - 200 OK):**
    ```json
    {
      "aiEnabled": true,
      "defaultModelPreference": "gpt-4-turbo", // System default or user's preference
      "availableModels": ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
      "confidenceThresholdForAutoMapping": 0.85, // Threshold above which AI suggestions are applied without forcing review
      "customMappingRules": [ // User-defined or system-wide persistent mapping rules
        { "id": "rule_1", "originalHeaderPattern": "*company_name*", "mappedTo": "Account.Name", "isActive": true },
        { "id": "rule_2", "originalHeaderPattern": "e-mail", "mappedTo": "Lead.Email", "isActive": true }
      ],
      "aiProvider": "openai" // Could be "azure_openai", "local_model" in future
    }
    ```
*   **Response (Error):**
    *   `500 Internal Server Error`.

### 9. Configuration Management - Update AI Settings

*   **Endpoint:** `/config/ai`
*   **Method:** `PUT`
*   **Description:** Updates AI processing settings. The backend should validate these settings.
*   **Request Body:**
    ```json
    {
      "aiEnabled": true,
      "defaultModelPreference": "gpt-4",
      "confidenceThresholdForAutoMapping": 0.90,
      "customMappingRules": [ // User provides the full list or changes to existing rules
        { "originalHeaderPattern": "*company_name*", "mappedTo": "Account.Name", "isActive": true },
        { "originalHeaderPattern": "e-mail", "mappedTo": "Lead.Email", "isActive": true },
        { "originalHeaderPattern": "website", "mappedTo": "Lead.Website", "isActive": false } // New or updated rule
      ]
    }
    ```
*   **Response (Success - 200 OK):**
    The updated AI settings object (same structure as GET `/config/ai`).
    ```json
    {
      "aiEnabled": true,
      "defaultModelPreference": "gpt-4",
      "availableModels": ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
      "confidenceThresholdForAutoMapping": 0.90,
      "customMappingRules": [
        { "id": "rule_1_updated_or_new", "originalHeaderPattern": "*company_name*", "mappedTo": "Account.Name", "isActive": true },
        { "id": "rule_2_updated_or_new", "originalHeaderPattern": "e-mail", "mappedTo": "Lead.Email", "isActive": true },
        { "id": "rule_3_updated_or_new", "originalHeaderPattern": "website", "mappedTo": "Lead.Website", "isActive": false }
      ],
      "aiProvider": "openai"
    }
    ```
*   **Response (Error):**
    *   `400 Bad Request`: Invalid settings values.
    *   `500 Internal Server Error`.

### 10. Configuration Management - Get Lead Distribution Settings

*   **Endpoint:** `/config/lead-distribution`
*   **Method:** `GET`
*   **Description:** Retrieves current lead distribution settings (e.g., rules for assigning leads to Salesforce users/queues).
*   **Response (Success - 200 OK):**
    ```json
    {
      "distributionEnabled": true,
      "defaultAssignee": { // Default if no rules match or round-robin is off
        "type": "Queue", // "Queue" or "User"
        "id": "sales_queue_id_sf"
      },
      "roundRobin": {
        "enabled": true,
        "userPool": ["user_id_1_sf", "user_id_2_sf", "user_id_3_sf"] // Salesforce User IDs
      },
      "rules": [ // Rules are processed in order; first match wins
        { "id": "rule_dist_1", "criteriaField": "Lead.Industry", "operator": "equals", "criteriaValue": "Technology", "assignTo": { "type": "User", "id": "tech_specialist_user_id_sf" }, "isActive": true },
        { "id": "rule_dist_2", "criteriaField": "Lead.AnnualRevenue", "operator": "greater_than", "criteriaValue": 1000000, "assignTo": { "type": "Queue", "id": "key_accounts_queue_id_sf" }, "isActive": true }
      ]
    }
    ```
*   **Response (Error):**
    *   `500 Internal Server Error`.

### 11. Configuration Management - Update Lead Distribution Settings

*   **Endpoint:** `/config/lead-distribution`
*   **Method:** `PUT`
*   **Description:** Updates lead distribution settings.
*   **Request Body:** JSON body similar to the GET response structure for `/config/lead-distribution`.
    ```json
    {
      "distributionEnabled": true,
      "defaultAssignee": { "type": "User", "id": "another_user_id_sf" },
      "roundRobin": { "enabled": false, "userPool": [] },
      "rules": [
        { "criteriaField": "Lead.Industry", "operator": "equals", "criteriaValue": "Finance", "assignTo": { "type": "User", "id": "finance_specialist_id_sf" }, "isActive": true }
      ]
    }
    ```
*   **Response (Success - 200 OK):** The updated lead distribution settings object.
*   **Response (Error):**
    *   `400 Bad Request`: Invalid settings values.
    *   `500 Internal Server Error`.

---

This document provides a foundational set of API contracts. Further details, such as specific error codes for various scenarios or more complex query parameters, can be added as backend capabilities are refined.
