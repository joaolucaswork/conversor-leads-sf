import React from 'react';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import Link from '@mui/material/Link'; // For download button

// Define the base URL for the backend API for constructing download URLs.
// This should ideally come from an environment variable or be consistent with apiService.
import { Link as RouterLink } from 'react-router-dom'; // For navigation

// Define the base URL for the backend API for constructing download URLs.
import { downloadProcessedFile as downloadFileService } from '../services/apiService'; // Import the download service
import CircularProgress from '@mui/material/CircularProgress'; // For loading indicator on button

// This should ideally come from an environment variable or be consistent with apiService.
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
// No longer needed here if downloadUrl from backend is absolute, or apiService handles base URL.

const ProcessingStatus = ({ statusData, processingId, error }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState(null);

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 3, borderColor: 'error.main', borderLeft: '5px solid' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" color="error">
            Error Fetching Status
          </Typography>
        </Box>
        <Typography color="text.secondary">{error}</Typography>
      </Paper>
    );
  }

  if (!statusData || !processingId) {
    return null; // Or a loading/placeholder if preferred, but HomePage handles initial loading
  }

  const {
    status,
    progress,
    currentStage,
    message, // General message from backend
    resultUrl, // e.g., /api/v1/leads/results/unique_processing_job_id_string (relative)
    previewUrl, // e.g., /api/v1/leads/preview/unique_processing_job_id_string (relative) - new assumption
    fileName, // Added for context
  } = statusData;

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isProcessing = !isCompleted && !isFailed;
  const canPreview = isProcessing && previewUrl; // Show preview button if processing and previewUrl exists

  let statusIcon = <HourglassEmptyIcon color="info" sx={{ mr: 1 }} />;
  let statusColor = 'info'; // Default for ongoing statuses

  if (isCompleted) {
    statusIcon = <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />;
    statusColor = 'success';
  } else if (isFailed) {
    statusIcon = <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />;
    statusColor = 'error';
  }

  // const fullDownloadUrl = resultUrl; // Assuming resultUrl is absolute or handled by apiService

  const handleDownload = async () => {
    if (!resultUrl) {
      setDownloadError('No download URL available.');
      return;
    }
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await downloadFileService(resultUrl); // resultUrl is e.g., /api/v1/leads/results/{id}/download
      
      let filename = `processed_leads_${processingId}.csv`; // Default filename
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Download error:', err);
      setDownloadError(err.message || 'Failed to download file.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3, borderColor: `${statusColor}.main`, borderLeft: '5px solid' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {statusIcon}
        <Typography variant="h6" component="div" color={`${statusColor}.main`}>
          Processing Status: {status ? status.replace(/_/g, ' ').toUpperCase() : 'Loading...'}
        </Typography>
      </Box>
      
      {fileName && <Typography variant="subtitle1" color="text.secondary" gutterBottom>File: {fileName}</Typography>}
      
      {currentStage && (
        <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Current Stage: {currentStage.replace(/_/g, ' ')}
        </Typography>
      )}

      {message && (
        <Typography variant="body2" sx={{ my: 1 }}>
          {message}
        </Typography>
      )}

      {isProcessing && progress !== undefined && (
        <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
          <LinearProgress variant="determinate" value={progress} color={statusColor} />
          <Typography variant="caption" display="block" textAlign="right" sx={{ mt: 0.5 }}>
            {progress.toFixed(0)}%
          </Typography>
        </Box>
      )}

      {isCompleted && resultUrl && (
        <Button
          variant="contained"
          color="success"
          onClick={handleDownload}
          disabled={isDownloading}
          sx={{ mt: 2 }}
          startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isDownloading ? 'Downloading...' : 'Download Processed File'}
        </Button>
      )}

      {canPreview && (
         <Button
          variant="outlined"
          color="info"
          component={RouterLink}
          to={`/preview/${processingId}`} // Navigate to the preview page
          sx={{ mt: 2, mr: isCompleted ? 1 : 0 }} // Add margin if download button is also present
        >
          View AI Mappings / Preview
        </Button>
      )}
      
      {isFailed && (
        <Typography color="error.main" sx={{ mt: 1 }}>
          Processing failed. Please check logs or try again.
          {/* Optionally, add a link to logs if available:
              <Link href={`/api/v1/leads/history/${processingId}/logs`} target="_blank" component={RouterLink}>View Logs</Link> 
          */}
        </Typography>
      )}
    </Paper>
  );
};

export default ProcessingStatus;
