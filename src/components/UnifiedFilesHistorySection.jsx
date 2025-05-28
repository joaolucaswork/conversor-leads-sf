import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Badge,
  Alert,
  CircularProgress,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Upload as UploadIcon,
  RemoveRedEye as DataViewIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { getProcessingHistory, clearProcessingHistory, clearReadyFiles } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import {
  uploadLeadsToSalesforce,
  getSalesforceObjects,
  formatSalesforceResult
} from '../services/salesforceService';
import { useGlobalProcessingEvents } from '../hooks/useProcessingEvents';
import ProcessingHistorySection from './ProcessingHistorySection';
import StatusDot from './StatusDot';
import StatusLegend from './StatusLegend';
import DuplicateHandlingDialog from './DuplicateHandlingDialog';
import FileDataViewerModal from './FileDataViewerModal';
import { useNavigate } from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';

const UnifiedFilesHistorySection = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Language store to ensure re-render when language changes
  const { currentLanguage } = useLanguageStore(state => ({
    currentLanguage: state.currentLanguage,
  }));

  const {
    isAuthenticated,
    accessToken,
    instanceUrl,
    initializeAuth,
    ensureValidToken,
    validateAuthentication,
    fixAuthenticationState
  } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
    instanceUrl: state.instanceUrl,
    initializeAuth: state.initializeAuth,
    ensureValidToken: state.ensureValidToken,
    validateAuthentication: state.validateAuthentication,
    fixAuthenticationState: state.fixAuthenticationState,
  }));
  const { addListener } = useGlobalProcessingEvents();
  const [currentTab, setCurrentTab] = useState(0);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear functionality states
  const [clearFilesDialogOpen, setClearFilesDialogOpen] = useState(false);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [clearingFiles, setClearingFiles] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Upload functionality states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [salesforceObject, setSalesforceObject] = useState('Lead');
  const [salesforceObjects, setSalesforceObjects] = useState([]);

  // Enhanced error handling states
  const [success, setSuccess] = useState(null);
  const [detailedError, setDetailedError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);

  // Duplicate handling states
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicatesDetected, setDuplicatesDetected] = useState([]);
  const [duplicateResolution, setDuplicateResolution] = useState(null);

  // Auto-refresh state
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // File data viewer modal state
  const [fileViewerModalOpen, setFileViewerModalOpen] = useState(false);
  const [selectedFileProcessingId, setSelectedFileProcessingId] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);

  const loadSalesforceObjects = async () => {
    try {
      const objects = await getSalesforceObjects();
      setSalesforceObjects(objects);
    } catch (err) {
      console.error('Error loading Salesforce objects:', err);
      // Use default objects if loading fails
      setSalesforceObjects([
        { name: 'Lead', label: 'Lead', createable: true },
        { name: 'Contact', label: 'Contact', createable: true },
        { name: 'Account', label: 'Account', createable: true }
      ]);
    }
  };

  const loadProcessedFiles = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getProcessingHistory(1, 50); // Get more items to filter
      const history = data.history || [];

      // Filter for completed files that can be uploaded to Salesforce
      const completedFiles = history.filter(item => {
        const hasOutputPath = item.outputPath || item.resultUrl;
        const isCompleted = item.status === 'completed';
        return isCompleted && hasOutputPath;
      });

      setProcessedFiles(completedFiles);
    } catch (err) {
      console.error('Error loading processed files:', err);
      setError('Failed to load processed files. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProcessedFiles();
    loadSalesforceObjects();
  }, [loadProcessedFiles]);

  // Listen for refresh requests from SalesforceStatusBar
  useEffect(() => {
    const handleRefreshRequest = () => {
      console.log('UnifiedFilesHistorySection: Refresh requested from SalesforceStatusBar');
      loadProcessedFiles();
    };

    window.addEventListener('salesforce-refresh-requested', handleRefreshRequest);

    return () => {
      window.removeEventListener('salesforce-refresh-requested', handleRefreshRequest);
    };
  }, [loadProcessedFiles]);

  // Listen for processing completion events to automatically refresh
  useEffect(() => {
    const handleProcessingCompletion = (processingData) => {
      console.log('UnifiedFilesHistorySection: Processing completion detected:', processingData);

      // Only refresh if the processing was successful
      if (processingData.status === 'completed') {
        console.log('Automatically refreshing ready files list due to processing completion');

        // Show auto-refresh indicator
        setIsAutoRefreshing(true);

        // Add a small delay to ensure backend has updated the history
        setTimeout(async () => {
          try {
            await loadProcessedFiles();

            // Show success notification
            setSnackbarMessage(
              t('home.fileAutoAdded', {
                defaultValue: `${processingData.fileName} has been processed and is now ready for upload`,
                fileName: processingData.fileName
              })
            );
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          } catch (error) {
            console.error('Error during auto-refresh:', error);
          } finally {
            setIsAutoRefreshing(false);
          }
        }, 1000);
      }
    };

    // Add listener for processing completion events
    const removeListener = addListener(handleProcessingCompletion);

    // Cleanup listener on unmount
    return removeListener;
  }, [addListener, loadProcessedFiles, t]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleDownloadFile = async (file) => {
    try {
      // Import the download service dynamically to avoid circular dependencies
      const { downloadProcessedFile } = await import('../services/apiService');
      await downloadProcessedFile(file.processingId);
    } catch (error) {
      console.error('Download failed:', error);
      setError(`Download failed: ${error.message}`);
    }
  };

  const handleViewFileData = (processingId, fileName) => {
    if (isMobile) {
      // Navigate to full-screen page on mobile
      navigate(`/file-viewer/${processingId}`, {
        state: { fileName }
      });
    } else {
      // Open modal on desktop
      setSelectedFileProcessingId(processingId);
      setSelectedFileName(fileName);
      setFileViewerModalOpen(true);
    }
  };

  const handleFullScreenFileViewer = (processingId, fileName) => {
    navigate(`/file-viewer/${processingId}`, {
      state: { fileName }
    });
  };

  const handleUploadToSalesforce = (file) => {
    console.log('Upload to Salesforce:', file);
    setSelectedFile(file);
    setUploadError(null);
    setUploadProgress(0);
    setUploadDialogOpen(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !isAuthenticated || !accessToken || !instanceUrl) {
      setUploadError(t('salesforce.uploadError', { defaultValue: 'Authentication required for upload' }));
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setSuccess(null);
      setDetailedError(null);

      // Check authentication state first
      if (!isAuthenticated) {
        setUploadError('Not authenticated with Salesforce. Please log in first.');
        return;
      }

      // Validate authentication with Salesforce before upload
      console.log('UnifiedFilesHistorySection - Validating authentication before upload...');
      const authValidation = await validateAuthentication();
      if (!authValidation.success) {
        setUploadError(`Authentication validation failed: ${authValidation.error}. Please try logging in again.`);
        return;
      }

      // Start progress indicator
      setUploadProgress(10);

      console.log('UnifiedFilesHistorySection - Starting upload with authentication state:', {
        isAuthenticated,
        hasAccessToken: !!accessToken,
        instanceUrl,
        selectedFile: selectedFile.fileName,
        authValidated: true
      });

      // Upload to Salesforce using the service
      const result = await uploadLeadsToSalesforce(
        selectedFile.outputPath || selectedFile.filePath,
        salesforceObject,
        {
          processingId: selectedFile.processingId,
          fileName: selectedFile.fileName
        }
      );

      setUploadProgress(100);

      // Store the full result for debugging
      setUploadResult(result);
      console.log('UnifiedFilesHistorySection - Full upload result:', result);

      // Check for duplicates first
      if (result.hasDuplicates && result.duplicatesDetected && result.duplicatesDetected.length > 0) {
        console.log('UnifiedFilesHistorySection - Duplicates detected:', result.duplicatesDetected);
        setDuplicatesDetected(result.duplicatesDetected);
        setDuplicateDialogOpen(true);
        setUploadDialogOpen(false);
        return; // Don't process other results yet, wait for user decision
      }

      // Format and display results with enhanced error information
      const formattedResult = formatSalesforceResult(result);

      if (formattedResult.hasErrors || result.recordsSuccessful === 0) {
        // Create detailed error information
        const errorDetails = {
          summary: formattedResult.summary,
          recordsProcessed: result.recordsProcessed || 0,
          recordsSuccessful: result.recordsSuccessful || 0,
          recordsFailed: result.recordsFailed || 0,
          successRate: result.successRate || 0,
          errors: result.errors || [],
          detailedErrors: result.detailedErrors || [],
          csvInfo: result.csvInfo || {},
          timestamp: new Date().toISOString()
        };

        setDetailedError(errorDetails);

        // Check if errors are only duplicates
        const onlyDuplicateErrors = result.detailedErrors && result.detailedErrors.every(error =>
          error.salesforceErrors && error.salesforceErrors.some(sfError =>
            sfError.statusCode === 'DUPLICATES_DETECTED'
          )
        );

        if (onlyDuplicateErrors) {
          // All errors are duplicates - show user-friendly message
          setUploadError('Some records were identified as duplicates. Please use the duplicate handling dialog to resolve them.');
        } else {
          // Create comprehensive error message for other errors
          let errorMessage = `Upload completed with errors: ${formattedResult.summary}`;

          if (result.detailedErrors && result.detailedErrors.length > 0) {
            const firstError = result.detailedErrors[0];
            if (firstError.salesforceErrors && firstError.salesforceErrors.length > 0) {
              const sfError = firstError.salesforceErrors[0];
              errorMessage += `\n\nFirst error: ${sfError.statusCode || 'ERROR'}: ${sfError.message || 'Unknown error'}`;
              if (sfError.fields && sfError.fields.length > 0) {
                errorMessage += `\nAffected fields: ${sfError.fields.join(', ')}`;
              }
            }
          }

          errorMessage += '\n\nClick "View Debug Info" for detailed error analysis.';
          setUploadError(errorMessage);
        }
      } else {
        setSuccess(`Successfully uploaded to Salesforce: ${formattedResult.summary}`);
        setDetailedError(null);

        // Show success message in snackbar
        setSnackbarMessage(
          t('salesforce.uploadSuccess', {
            defaultValue: `Successfully uploaded ${selectedFile.fileName} to Salesforce`,
            fileName: selectedFile.fileName,
            recordsCreated: result.recordsCreated || 0,
            recordsUpdated: result.recordsUpdated || 0
          })
        );
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Refresh files list
        await loadProcessedFiles();
      }

      setUploadDialogOpen(false);

    } catch (err) {
      console.error('Error uploading to Salesforce:', err);

      // Provide more specific error messages
      let errorMessage = err.message || 'Failed to upload to Salesforce. Please try again.';

      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Authentication failed')) {
        errorMessage += ' Please try logging out and logging back in.';
      }

      setUploadError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancelUpload = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploading(false);
    setSuccess(null);
    setDetailedError(null);
  };

  const handleDuplicateResolution = async (resolution) => {
    console.log('UnifiedFilesHistorySection - Duplicate resolution:', resolution);
    setDuplicateResolution(resolution);
    setDuplicateDialogOpen(false);

    try {
      setUploading(true);

      if (resolution.action === 'cancel') {
        setUploadError('Upload cancelled due to duplicate records.');
        return;
      }

      if (resolution.action === 'skip') {
        setSuccess(`Upload completed. ${resolution.duplicates.length} duplicate records were skipped.`);
        setSnackbarMessage(`Upload completed. ${resolution.duplicates.length} duplicate records were skipped.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        return;
      }

      if (resolution.action === 'update') {
        // Call the duplicate resolution API
        if (window.electronAPI && window.electronAPI.resolveDuplicates) {
          const result = await window.electronAPI.resolveDuplicates({
            action: 'update',
            duplicates: resolution.duplicates,
            selectedFields: resolution.selectedFields,
            objectType: salesforceObject
          });

          if (result.success) {
            setSuccess(`Successfully updated ${result.successfulUpdates || 0} records. ${result.message}`);
            setSnackbarMessage(`Successfully updated ${result.successfulUpdates || 0} records. ${result.message}`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          } else {
            setUploadError(`Failed to update records: ${result.error}`);
          }
        } else {
          setSuccess(`Update functionality would update ${resolution.duplicates.length} records. (API not available in browser mode)`);
          setSnackbarMessage(`Update functionality would update ${resolution.duplicates.length} records. (API not available in browser mode)`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }
        return;
      }

    } catch (err) {
      console.error('Error handling duplicate resolution:', err);
      setUploadError('Failed to process duplicate resolution. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClearFiles = async () => {
    setClearingFiles(true);
    setError(null); // Clear any existing errors

    try {
      console.log('Clearing ready files...');
      const result = await clearReadyFiles();

      console.log('Clear files result:', result);

      // Show success message with detailed information
      const successMessage = result.clearedCount > 0
        ? t('home.clearFilesSuccess', { count: result.clearedCount })
        : t('home.noFilesToClear', { defaultValue: 'No files were found to clear.' });

      setSnackbarMessage(successMessage);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Immediately update the UI to reflect cleared state
      setProcessedFiles([]);

      // Reload the files list to ensure consistency with backend
      await loadProcessedFiles();

      console.log('Ready files cleared successfully');
    } catch (error) {
      console.error('Error clearing files:', error);
      setSnackbarMessage(t('home.clearFilesError', { error: error.message || 'Unknown error' }));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setError('Failed to clear files. Please try again.');
    } finally {
      setClearingFiles(false);
      setClearFilesDialogOpen(false);
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      const result = await clearProcessingHistory();
      setSnackbarMessage(t('home.clearHistorySuccess', { count: result.clearedCount }));
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      // Reload the files list since history affects ready files too
      await loadProcessedFiles();
    } catch (error) {
      console.error('Error clearing history:', error);
      setSnackbarMessage(t('home.clearHistoryError', { error: error.message }));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setClearingHistory(false);
      setClearHistoryDialogOpen(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const ReadyFilesTab = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t('common.loading')}</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button onClick={loadProcessedFiles} sx={{ ml: 2 }}>
            {t('common.retry')}
          </Button>
        </Alert>
      );
    }

    if (processedFiles.length === 0) {
      return (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
          <Typography variant="body1">
            {t('home.noReadyFiles')}
          </Typography>
          <Typography variant="body2">
            {t('home.noReadyFilesDescription')}
          </Typography>
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 2
        }}>
          <Button
            variant="outlined"
            size={window.innerWidth <= 480 ? "medium" : "small"}
            startIcon={<ClearIcon />}
            onClick={() => setClearFilesDialogOpen(true)}
            disabled={loading || processedFiles.length === 0}
            color="warning"
            sx={{
              minHeight: { xs: 44, sm: 32 },
              fontSize: { xs: '0.875rem', sm: '0.8125rem' },
              px: { xs: 2, sm: 1.5 }
            }}
          >
            {t('home.clearFiles')}
          </Button>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
          {processedFiles.map((file) => (
            <Grid item xs={12} sm={6} md={6} lg={4} key={file.processingId}>
              <Card
                elevation={1}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: { xs: 2, sm: 2 },
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-2px)' },
                    boxShadow: { xs: 1, sm: 2 },
                    borderColor: 'text.secondary'
                  }
                }}
              >
                <CardContent sx={{
                  flexGrow: 1,
                  p: { xs: 2, sm: 2 },
                  pb: { xs: 1, sm: 1 }
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                        fontWeight: { xs: 600, sm: 500 },
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                        mr: 1,
                        color: 'text.primary'
                      }}
                    >
                      {file.fileName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <StatusDot status="completed" size={6} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}
                      >
                        {t('history.ready')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.8125rem', sm: '0.875rem' }
                      }}
                    >
                      {formatDate(file.completedAt)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{
                        fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                        fontWeight: 500
                      }}
                    >
                      {file.recordCount || 0} {t('history.records')}
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.75rem',
                      display: 'block',
                      mb: 1
                    }}
                  >
                    {file.processingMode || t('fileUpload.aiEnhanced')}
                  </Typography>
                  {file.validationIssues && file.validationIssues.length > 0 && (
                    <Alert
                      severity="warning"
                      sx={{
                        mt: 1,
                        fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                        '& .MuiAlert-message': {
                          fontSize: 'inherit'
                        }
                      }}
                    >
                      {file.validationIssues.length} {t('history.validationIssues')}
                    </Alert>
                  )}
                </CardContent>
                <CardActions sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: { xs: 2, sm: 2 },
                  pb: { xs: 2, sm: 2 },
                  pt: { xs: 0, sm: 0 },
                  gap: { xs: 1, sm: 1 }
                }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      onClick={() => handleViewFileData(file.processingId, file.fileName)}
                      variant="text"
                      sx={{
                        minWidth: 'auto',
                        minHeight: { xs: 44, sm: 32 }, // Touch-friendly on mobile
                        p: 1,
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText'
                        }
                      }}
                    >
                      <DataViewIcon fontSize="small" />
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleDownloadFile(file)}
                      variant="text"
                      sx={{
                        minWidth: 'auto',
                        minHeight: { xs: 44, sm: 32 }, // Touch-friendly on mobile
                        p: 1,
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          color: 'text.primary'
                        }
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </Button>
                  </Box>
                  <Button
                    size="medium"
                    variant="contained"
                    onClick={() => handleUploadToSalesforce(file)}
                    disabled={!isAuthenticated}
                    sx={{
                      minHeight: { xs: 44, sm: 36 },
                      fontSize: { xs: '0.875rem', sm: '0.8125rem' },
                      flex: 1,
                      ml: 1,
                      px: { xs: 2, sm: 1.5 },
                      fontWeight: { xs: 600, sm: 500 },
                      backgroundColor: 'text.primary',
                      color: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'text.secondary'
                      },
                      '&:disabled': {
                        backgroundColor: 'action.disabled',
                        color: 'text.disabled'
                      }
                    }}
                  >
                    {t('salesforce.upload')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        mt: { xs: 2, sm: 3 },
        borderRadius: { xs: 2, sm: 2 }
      }}
    >


      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="files and history tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: { xs: 56, sm: 48 },
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              fontWeight: { xs: 500, sm: 400 },
              textTransform: { xs: 'none', sm: 'none' },
              px: { xs: 1, sm: 2 }
            },
            '& .MuiTabs-indicator': {
              height: { xs: 3, sm: 2 }
            }
          }}
        >
          <Tab
            icon={
              <Badge badgeContent={processedFiles.length} color="success" max={99}>
                <CloudUploadIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              </Badge>
            }
            label={t('home.processedFiles', { defaultValue: 'Processed' })}
            id="tab-0"
            aria-controls="tabpanel-0"
            iconPosition="start"
            sx={{
              flexDirection: { xs: 'row', sm: 'column' },
              gap: { xs: 1, sm: 0.5 }
            }}
          />
          <Tab
            icon={<HistoryIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />}
            label={t('navigation.history', { defaultValue: 'History' })}
            id="tab-1"
            aria-controls="tabpanel-1"
            iconPosition="start"
            sx={{
              flexDirection: { xs: 'row', sm: 'column' },
              gap: { xs: 1, sm: 0.5 }
            }}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box role="tabpanel" hidden={currentTab !== 0} id="tabpanel-0" aria-labelledby="tab-0">
        {currentTab === 0 && <ReadyFilesTab />}
      </Box>

      <Box role="tabpanel" hidden={currentTab !== 1} id="tabpanel-1" aria-labelledby="tab-1">
        {currentTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <ProcessingHistorySection
              maxItems={10}
              showPagination={true}
              showClearButton={true}
              onClearHistory={() => setClearHistoryDialogOpen(true)}
              loading={loading}
            />
          </Box>
        )}
      </Box>

      {/* Clear Files Confirmation Dialog */}
      <Dialog
        open={clearFilesDialogOpen}
        onClose={() => setClearFilesDialogOpen(false)}
        aria-labelledby="clear-files-dialog-title"
        aria-describedby="clear-files-dialog-description"
      >
        <DialogTitle id="clear-files-dialog-title">
          {t('home.clearFiles')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-files-dialog-description">
            {t('home.clearFilesConfirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearFilesDialogOpen(false)} disabled={clearingFiles}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleClearFiles}
            color="warning"
            variant="contained"
            disabled={clearingFiles}
          >
            {clearingFiles ? t('common.loading') : t('home.clearFiles')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear History Confirmation Dialog */}
      <Dialog
        open={clearHistoryDialogOpen}
        onClose={() => setClearHistoryDialogOpen(false)}
        aria-labelledby="clear-history-dialog-title"
        aria-describedby="clear-history-dialog-description"
      >
        <DialogTitle id="clear-history-dialog-title">
          {t('home.clearHistory')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-history-dialog-description">
            {t('home.clearHistoryConfirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearHistoryDialogOpen(false)} disabled={clearingHistory}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleClearHistory}
            color="warning"
            variant="contained"
            disabled={clearingHistory}
          >
            {clearingHistory ? t('common.loading') : t('home.clearHistory')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload to Salesforce Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={!uploading ? handleCancelUpload : undefined}
        maxWidth="sm"
        fullWidth
        aria-labelledby="upload-dialog-title"
      >
        <DialogTitle id="upload-dialog-title">
          {t('salesforce.uploadToSalesforce')}
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <>
              <Typography variant="body1" gutterBottom>
                <strong>{t('common.file', { defaultValue: 'File' })}:</strong> {selectedFile.fileName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('common.records', { defaultValue: 'Records' })}: {selectedFile.recordCount || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('common.processed', { defaultValue: 'Processed' })}: {formatDate(selectedFile.completedAt)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Salesforce Object</InputLabel>
                <Select
                  value={salesforceObject}
                  label="Salesforce Object"
                  onChange={(e) => setSalesforceObject(e.target.value)}
                  disabled={uploading}
                >
                  {salesforceObjects.map((obj) => (
                    <MenuItem key={obj.name} value={obj.name} disabled={!obj.createable}>
                      {obj.label || obj.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    {t('salesforce.uploading')} {uploadProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}

              {uploadError && (
                <Alert
                  severity="error"
                  sx={{ mt: 2 }}
                  action={
                    detailedError && (
                      <Button
                        color="inherit"
                        size="small"
                        onClick={() => setDebugDialogOpen(true)}
                        sx={{ ml: 1 }}
                      >
                        {t('salesforce.viewDebugInfo', { defaultValue: 'Ver Informações de Debug' })}
                      </Button>
                    )
                  }
                >
                  <Box sx={{ whiteSpace: 'pre-line' }}>
                    {uploadError}
                  </Box>
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelUpload}
            disabled={uploading}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleConfirmUpload}
            variant="contained"
            disabled={uploading || !isAuthenticated}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploading
              ? t('salesforce.uploading')
              : t('salesforce.upload')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Debug Information Dialog */}
      <Dialog
        open={debugDialogOpen}
        onClose={() => setDebugDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{t('salesforce.debugInfo', { defaultValue: 'Informações de Debug do Envio' })}</Typography>
            <Button
              onClick={() => {
                const debugData = {
                  detailedError,
                  uploadResult,
                  timestamp: new Date().toISOString()
                };
                navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
                setSnackbarMessage('Debug information copied to clipboard');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
              }}
              size="small"
              variant="outlined"
            >
              {t('common.copyToClipboard', { defaultValue: 'Copiar para Área de Transferência' })}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailedError && (
            <Box>
              <Typography variant="h6" gutterBottom color="error">
                {t('salesforce.uploadSummary', { defaultValue: 'Resumo do Envio' })}
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography><strong>Records Processed:</strong> {detailedError.recordsProcessed}</Typography>
                <Typography><strong>Records Successful:</strong> {detailedError.recordsSuccessful}</Typography>
                <Typography><strong>Records Failed:</strong> {detailedError.recordsFailed}</Typography>
                <Typography><strong>Success Rate:</strong> {detailedError.successRate?.toFixed(1)}%</Typography>
                <Typography><strong>Timestamp:</strong> {detailedError.timestamp}</Typography>
              </Box>

              {detailedError.csvInfo && Object.keys(detailedError.csvInfo).length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    CSV File Information
                  </Typography>
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography><strong>File Path:</strong> {detailedError.csvInfo.filePath}</Typography>
                    <Typography><strong>Total Rows:</strong> {detailedError.csvInfo.totalRows}</Typography>
                    <Typography><strong>Columns:</strong> {detailedError.csvInfo.columns?.join(', ')}</Typography>
                  </Box>
                </>
              )}

              {detailedError.errors && detailedError.errors.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom color="error">
                    Basic Errors ({detailedError.errors.length})
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {detailedError.errors.map((error, index) => (
                      <Alert key={index} severity="error" sx={{ mb: 1 }}>
                        <Typography><strong>Row {error.row}:</strong> {error.message}</Typography>
                      </Alert>
                    ))}
                  </Box>
                </>
              )}

              {detailedError.detailedErrors && detailedError.detailedErrors.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom color="error">
                    Detailed Salesforce Errors ({detailedError.detailedErrors.length})
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {detailedError.detailedErrors.slice(0, 5).map((error, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'error.main', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="error">
                          Batch {error.batchNumber}, Record {error.recordNumber}
                        </Typography>

                        {error.originalRecord && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2"><strong>Original Record:</strong></Typography>
                            <Box component="pre" sx={{ fontSize: '0.75rem', bgcolor: 'grey.50', p: 1, borderRadius: 1, overflow: 'auto' }}>
                              {JSON.stringify(error.originalRecord, null, 2)}
                            </Box>
                          </Box>
                        )}

                        {error.salesforceErrors && error.salesforceErrors.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2"><strong>Salesforce Errors:</strong></Typography>
                            {error.salesforceErrors.map((sfError, sfIndex) => (
                              <Alert key={sfIndex} severity="error" sx={{ mt: 1 }}>
                                <Typography><strong>{sfError.statusCode || 'ERROR'}:</strong> {sfError.message}</Typography>
                                {sfError.fields && sfError.fields.length > 0 && (
                                  <Typography variant="body2">Affected fields: {sfError.fields.join(', ')}</Typography>
                                )}
                              </Alert>
                            ))}
                          </Box>
                        )}

                        {error.exception && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            <Typography><strong>Exception:</strong> {error.exception}</Typography>
                          </Alert>
                        )}
                      </Box>
                    ))}
                    {detailedError.detailedErrors.length > 5 && (
                      <Typography variant="body2" color="text.secondary">
                        ... and {detailedError.detailedErrors.length - 5} more errors
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {uploadResult && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Full Upload Result (Technical)
                  </Typography>
                  <Box component="pre" sx={{
                    fontSize: '0.75rem',
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 300
                  }}>
                    {JSON.stringify(uploadResult, null, 2)}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDebugDialogOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Handling Dialog */}
      <DuplicateHandlingDialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
        duplicates={duplicatesDetected}
        onResolve={handleDuplicateResolution}
        loading={uploading}
      />

      {/* File Data Viewer Modal */}
      <FileDataViewerModal
        open={fileViewerModalOpen}
        onClose={() => setFileViewerModalOpen(false)}
        processingId={selectedFileProcessingId}
        fileName={selectedFileName}
        onFullScreen={handleFullScreenFileViewer}
      />
    </Paper>
  );
};

export default UnifiedFilesHistorySection;
