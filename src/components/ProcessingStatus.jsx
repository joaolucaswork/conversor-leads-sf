import React, { useState } from 'react';
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

// Import AI statistics components
import AIStatsDisplay from './AIStatsDisplay';
import ProcessingIndicators from './ProcessingIndicators';
import ProcessingSummary from './ProcessingSummary';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from 'react-i18next';

// This should ideally come from an environment variable or be consistent with apiService.
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
// No longer needed here if downloadUrl from backend is absolute, or apiService handles base URL.

const ProcessingStatus = ({ statusData, processingId, error }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState(null);
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  // Get developer mode state
  const { developerMode } = useSettingsStore(state => ({
    developerMode: state.developerMode,
  }));

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" color="error">
            {t('processing.errorFetchingStatus', { defaultValue: 'Error Fetching Status' })}
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
    resultUrl, // e.g., /leads/download/unique_processing_job_id_string (relative)
    previewUrl, // e.g., /api/v1/leads/preview/unique_processing_job_id_string (relative) - new assumption
    fileName, // Added for context
    aiStats, // AI processing statistics
    apiUsage, // API usage statistics
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

  // Function to translate backend messages
  const translateBackendMessage = (message) => {
    if (!message) return '';

    // Common backend message patterns and their translations
    const messagePatterns = {
      'File uploaded successfully, processing started': t('processing.messages.fileUploadedProcessingStarted', { defaultValue: 'Arquivo enviado com sucesso, processamento iniciado' }),
      'File uploaded successfully, processing queued': t('processing.messages.fileUploadedProcessingQueued', { defaultValue: 'Arquivo enviado com sucesso, processamento na fila' }),
      'Starting file processing...': t('processing.messages.startingFileProcessing', { defaultValue: 'Iniciando processamento do arquivo...' }),
      'Processing completed successfully': t('processing.messages.processingCompletedSuccessfully', { defaultValue: 'Processamento concluído com sucesso' }),
      'Starting AI-enhanced processing...': t('processing.messages.startingAiProcessing', { defaultValue: 'Iniciando processamento com IA...' }),
      'Processing failed': t('processing.messages.processingFailed', { defaultValue: 'Processamento falhou' }),
      'File processing not completed': t('processing.messages.fileProcessingNotCompleted', { defaultValue: 'Processamento do arquivo não concluído' }),
      'Processing job not found': t('processing.messages.processingJobNotFound', { defaultValue: 'Trabalho de processamento não encontrado' }),
      'Processed file not found': t('processing.messages.processedFileNotFound', { defaultValue: 'Arquivo processado não encontrado' })
    };

    // Check for exact matches first
    if (messagePatterns[message]) {
      return messagePatterns[message];
    }

    // Check for partial matches for dynamic messages
    for (const [pattern, translation] of Object.entries(messagePatterns)) {
      if (message.includes(pattern)) {
        return translation;
      }
    }

    // If no pattern matches, return the original message
    return message;
  };

  const handleDownload = async () => {
    if (!resultUrl) {
      setDownloadError(t('processing.messages.noDownloadUrl', { defaultValue: 'No download URL available.' }));
      return;
    }
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await downloadFileService(resultUrl); // resultUrl is e.g., /leads/download/{id}

      let filename = `processed_leads_${processingId}.csv`; // Default filename
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Download error:', err);
      setDownloadError(err.message || t('processing.messages.downloadFailed', { defaultValue: 'Failed to download file.' }));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        mt: { xs: 2, sm: 3 },
        borderRadius: { xs: 2, sm: 2 }
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: { xs: 1.5, sm: 1 },
        flexWrap: 'wrap',
        gap: { xs: 0.5, sm: 0 }
      }}>
        {statusIcon}
        <Typography
          variant="h6"
          component="div"
          color={`${statusColor}.main`}
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            fontWeight: { xs: 600, sm: 500 },
            lineHeight: 1.3,
            wordBreak: 'break-word'
          }}
        >
          {t('processing.title')}: {status ? t(`processing.stages.${status}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() }) : t('common.loading')}
        </Typography>
      </Box>

      {fileName && (
        <Typography
          variant="subtitle1"
          color="text.secondary"
          gutterBottom
          sx={{
            fontSize: { xs: '1rem', sm: '1rem' },
            fontWeight: { xs: 500, sm: 400 },
            wordBreak: 'break-word',
            mb: { xs: 1.5, sm: 1 }
          }}
        >
          {t('common.file')}: {fileName}
        </Typography>
      )}

      {currentStage && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontStyle: 'italic',
            fontSize: { xs: '0.9375rem', sm: '1rem' },
            mb: { xs: 1, sm: 0.5 }
          }}
        >
          {t('processing.stage')}: {t(`processing.stages.${currentStage}`, { defaultValue: currentStage.replace(/_/g, ' ') })}
        </Typography>
      )}

      {message && (
        <Typography variant="body2" sx={{ my: 1 }}>
          {translateBackendMessage(message)}
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

      {/* AI Statistics Display - Only show in developer mode */}
      {developerMode && (isProcessing || isCompleted) && (aiStats || apiUsage) && (
        <AIStatsDisplay
          aiStats={aiStats || {}}
          apiUsage={apiUsage || {}}
          isProcessing={isProcessing}
          showDetailed={showDetailedStats}
          onToggleDetailed={() => setShowDetailedStats(!showDetailedStats)}
        />
      )}

      {/* Real-time Processing Indicators - Only show in developer mode */}
      {developerMode && isProcessing && (
        <ProcessingIndicators
          currentStage={currentStage}
          apiUsage={apiUsage || {}}
          isProcessing={isProcessing}
          progress={progress}
        />
      )}

      {/* Post-Processing Summary - Only show in developer mode */}
      {developerMode && isCompleted && (aiStats || apiUsage) && (
        <ProcessingSummary
          aiStats={aiStats || {}}
          apiUsage={apiUsage || {}}
          processingInfo={{ fileName, recordCount: statusData.recordCount }}
        />
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
          {isDownloading ? t('common.loading') : t('processing.download')}
        </Button>
      )}

      {developerMode && canPreview && (
         <Button
          variant="outlined"
          color="info"
          component={RouterLink}
          to={`/preview/${processingId}`} // Navigate to the preview page
          sx={{ mt: 2, mr: isCompleted ? 1 : 0 }} // Add margin if download button is also present
        >
          {t('processing.preview')}
        </Button>
      )}

      {isFailed && (
        <Typography color="error.main" sx={{ mt: 1 }}>
          {t('processing.stages.failed')}. {t('processing.checkLogsOrRetry', { defaultValue: 'Please check logs or try again.' })}
          {/* Optionally, add a link to logs if available:
              <Link href={`/api/v1/leads/history/${processingId}/logs`} target="_blank" component={RouterLink}>View Logs</Link>
          */}
        </Typography>
      )}
    </Paper>
  );
};

export default ProcessingStatus;
