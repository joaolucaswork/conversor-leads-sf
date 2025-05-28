import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import FileUpload from '../components/FileUpload';
import ProcessingStatus from '../components/ProcessingStatus'; // Import the new component
import UnifiedFilesHistorySection from '../components/UnifiedFilesHistorySection'; // Import the new unified component
import FallbackOwnerModal from '../components/FallbackOwnerModal';
import { uploadFile as uploadFileService, getProcessingStatus } from '../services/apiService'; // Import getProcessingStatus
import { useGlobalProcessingEvents } from '../hooks/useProcessingEvents';
import { useAuthStore } from '../store/authStore';

const POLLING_INTERVAL = 3000; // 3 seconds

const HomePage = () => {
  const { t } = useTranslation();
  const { notifyCompletion } = useGlobalProcessingEvents();
  const { userProfile } = useAuthStore();

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');

  // Processing State
  const [processingInfo, setProcessingInfo] = useState(null); // Stores { processingId, statusUrl, previewUrl, fileName }
  const [currentProcessingStatus, setCurrentProcessingStatus] = useState(null);
  const [pollingError, setPollingError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  // Fallback Owner Modal State
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [fallbackAssignmentInfo, setFallbackAssignmentInfo] = useState(null);


  const resetUploadState = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccessMessage('');
    // Do not reset processingInfo here if you want to keep showing status for the last job
  };

  const resetProcessingState = () => {
    // Call this when starting a new upload AFTER a previous one finished/failed to clear old status
    setProcessingInfo(null);
    setCurrentProcessingStatus(null);
    setPollingError(null);
    setIsPolling(false);
  };

  // Helper function to determine if processing is completed
  const isProcessingCompleted = () => {
    return currentProcessingStatus?.status === 'completed';
  };

  // Function to handle when a new file is selected - clears previous processing state immediately
  const handleNewFileSelected = useCallback(() => {
    console.log('HomePage: New file selected, clearing previous processing state immediately');
    resetProcessingState();
    resetUploadState();
  }, []);

  const handleFileUpload = async (file, options = {}) => {
    resetUploadState(); // Clear messages from previous direct upload attempts
    resetProcessingState(); // Clear status from any previous job

    setIsUploading(true);
    try {
      // Get fallback owner ID from user profile
      const fallbackOwnerId = userProfile?.user_id || userProfile?.id || null;

      const response = await uploadFileService(
        file,
        (progress) => setUploadProgress(progress),
        options.useAiEnhancement !== undefined ? options.useAiEnhancement : true,
        null, // aiModelPreference
        fallbackOwnerId
      );

      setProcessingInfo({ // Keep original processingInfo
        processingId: response.processingId,
        statusUrl: response.statusUrl, // This might be relative
        previewUrl: response.previewUrl, // This might be relative
        fileName: response.fileName || file.name,
      });
      // Initial status might come from upload response, or fetch immediately
      if (response.initialStatusData) { // Assuming backend might send initial status
        setCurrentProcessingStatus(response.initialStatusData);
      } else {
        // Fetch initial status right away
        fetchStatus(response.processingId, response.fileName || file.name);
      }
      const processingMode = options.useAiEnhancement !== false ? 'AI-enhanced' : 'rule-based';
      setUploadSuccessMessage(`File "${response.fileName || file.name}" uploaded. Starting ${processingMode} processing...`);
      setIsPolling(true); // Start polling if not already started by fetchStatus
    } catch (error) {
      console.error('Upload failed in HomePage:', error);
      setUploadError(error.message || 'An unexpected error occurred during upload.');
      setProcessingInfo(null); // Clear processing info on upload error
    } finally {
      setIsUploading(false); // Finished the direct upload part
    }
  };

  // Function to fetch status
  const fetchStatus = useCallback(async (pId, fName) => {
    if (!pId) return;
    setPollingError(null); // Clear previous polling errors
    try {
      const statusResult = await getProcessingStatus(pId);
      const previousStatus = currentProcessingStatus?.status;
      setCurrentProcessingStatus({...statusResult, fileName: statusResult.fileName || fName }); // Ensure fileName is part of statusData

      // Check for fallback assignment info and show modal if needed
      if (statusResult.fallbackAssignmentInfo && statusResult.fallbackAssignmentInfo.applied && !fallbackAssignmentInfo) {
        setFallbackAssignmentInfo(statusResult.fallbackAssignmentInfo);
        setShowFallbackModal(true);
      }

      if (statusResult.status === 'completed' || statusResult.status === 'failed') {
        setIsPolling(false); // Stop polling for terminal states

        // Notify about processing completion if status changed to completed
        if (statusResult.status === 'completed' && previousStatus !== 'completed') {
          console.log('Processing completed, notifying components:', {
            processingId: pId,
            fileName: fName,
            status: statusResult.status,
            resultUrl: statusResult.resultUrl
          });

          notifyCompletion({
            processingId: pId,
            fileName: fName,
            status: statusResult.status,
            resultUrl: statusResult.resultUrl,
            recordCount: statusResult.recordCount,
            completedAt: new Date().toISOString()
          });
        }
        // setUploadSuccessMessage(''); // Clear initial upload message if desired
      } else {
        setIsPolling(true); // Continue polling
      }
    } catch (err) {
      console.error('Error fetching processing status:', err);
      setPollingError(err.message || 'Could not fetch processing status.');
      // Consider stopping polling on certain types of errors (e.g., 404)
      // For now, it will retry on next interval unless explicitly stopped
      // setIsPolling(false); // Optional: stop polling on any error
    }
  }, [currentProcessingStatus?.status, notifyCompletion, fallbackAssignmentInfo]);

  // Fallback owner modal handlers
  const handleFallbackModalConfirm = () => {
    setShowFallbackModal(false);
    // Processing continues normally - the fallback assignment has already been applied
  };

  const handleFallbackModalClose = () => {
    setShowFallbackModal(false);
    // User acknowledged the fallback assignment
  };

  // Polling useEffect
  useEffect(() => {
    let intervalId = null;

    if (processingInfo?.processingId && isPolling) {
      intervalId = setInterval(() => {
        fetchStatus(processingInfo.processingId, processingInfo.fileName);
      }, POLLING_INTERVAL);
    } else {
      if (intervalId) clearInterval(intervalId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, processingInfo, fetchStatus]);

  return (
    <Container maxWidth="lg" sx={{ mt: 1 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <FileUpload
          onFileUpload={handleFileUpload}
          isUploading={isUploading} // From upload state
          uploadProgress={uploadProgress} // From upload state
          uploadError={uploadError} // From upload state
          uploadSuccessMessage={uploadSuccessMessage} // From upload state
          processingCompleted={isProcessingCompleted()} // Signal when processing is completed
          onNewFileSelected={handleNewFileSelected} // Clear previous processing state when new file is selected
        />
      </Paper>

      {/* Display Processing Status if a processingId exists */}
      {processingInfo?.processingId && (
        <ProcessingStatus
          processingId={processingInfo.processingId}
          statusData={currentProcessingStatus}
          error={pollingError}
        />
      )}

      {/* Unified Files and History Section */}
      <UnifiedFilesHistorySection />

      {/* Fallback Owner Assignment Modal */}
      <FallbackOwnerModal
        open={showFallbackModal}
        onClose={handleFallbackModalClose}
        onConfirm={handleFallbackModalConfirm}
        fallbackInfo={fallbackAssignmentInfo}
        userProfile={userProfile}
        fileName={processingInfo?.fileName}
        isProcessing={false}
      />

      {/* Example of how to reset everything for a new upload if needed,
          could be tied to the "Upload Another File" button in FileUpload
          if that button was managed here.
      <Button onClick={() => { resetUploadState(); resetProcessingState(); }}>Start New Upload</Button>
      */}


    </Container>
  );
};

export default HomePage;
