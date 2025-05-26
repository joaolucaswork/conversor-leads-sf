import React, { useState, useEffect, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link'; // For linking to status page (future)

import { useAuthStore } from '../store/authStore'; // For logout button and user info
import FileUpload from '../components/FileUpload';
import ProcessingStatus from '../components/ProcessingStatus'; // Import the new component
import { uploadFile as uploadFileService, getProcessingStatus } from '../services/apiService'; // Import getProcessingStatus

const POLLING_INTERVAL = 3000; // 3 seconds

const HomePage = () => {
  const { accessToken, instanceUrl, logout } = useAuthStore(state => ({
    accessToken: state.accessToken,
    instanceUrl: state.instanceUrl,
    logout: state.logout,
  }));

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

  const handleFileUpload = async (file) => {
    resetUploadState(); // Clear messages from previous direct upload attempts
    resetProcessingState(); // Clear status from any previous job

    setIsUploading(true);
    try {
      const response = await uploadFileService(
        file,
        (progress) => setUploadProgress(progress),
        true, 
        null  
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
      setUploadSuccessMessage(`File "${response.fileName || file.name}" uploaded. Initializing processing status...`);
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
      setCurrentProcessingStatus({...statusResult, fileName: statusResult.fileName || fName }); // Ensure fileName is part of statusData
      
      if (statusResult.status === 'completed' || statusResult.status === 'failed') {
        setIsPolling(false); // Stop polling for terminal states
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
  }, []);

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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to the AI-Enhanced Leads Processor
        </Typography>
        <Typography variant="body1" paragraph>
          This application helps you process lead data from Excel or CSV files using AI-powered enhancements and prepares it for Salesforce import.
        </Typography>
        {accessToken && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" variant="outlined">
              Logged in with Salesforce. Instance URL: {instanceUrl}
            </Alert>
          </Box>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Upload Your Lead Data File
        </Typography>
        <FileUpload
          onFileUpload={handleFileUpload}
          isUploading={isUploading} // From upload state
          uploadProgress={uploadProgress} // From upload state
          uploadError={uploadError} // From upload state
          uploadSuccessMessage={uploadSuccessMessage} // From upload state
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
      
      {/* Example of how to reset everything for a new upload if needed, 
          could be tied to the "Upload Another File" button in FileUpload 
          if that button was managed here.
      <Button onClick={() => { resetUploadState(); resetProcessingState(); }}>Start New Upload</Button> 
      */}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button variant="outlined" color="secondary" onClick={logout}>
          Logout from Salesforce
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage;
