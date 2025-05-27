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
  MenuItem
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { getProcessingHistory, clearProcessingHistory, clearReadyFiles } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { uploadLeadsToSalesforce } from '../services/salesforceService';
import { useGlobalProcessingEvents } from '../hooks/useProcessingEvents';
import ProcessingHistorySection from './ProcessingHistorySection';

const UnifiedFilesHistorySection = () => {
  const { t } = useTranslation();
  const { isAuthenticated, accessToken, instanceUrl } = useAuthStore();
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

  // Auto-refresh state
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

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

    setUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      console.log('Starting Salesforce upload for file:', selectedFile.fileName);

      // Start progress indicator
      setUploadProgress(30);

      // Upload to Salesforce using the service
      const result = await uploadLeadsToSalesforce(
        selectedFile.outputPath || selectedFile.filePath,
        salesforceObject,
        {
          processingId: selectedFile.processingId,
          fileName: selectedFile.fileName
        }
      );

      setUploadProgress(90);

      if (result && result.success) {
        setUploadProgress(100);

        // Show success message
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

        // Close dialog and refresh files list
        setUploadDialogOpen(false);
        await loadProcessedFiles();

        console.log('Upload completed successfully:', result);
      } else {
        throw new Error(result?.error || t('salesforce.uploadFailed', { defaultValue: 'Upload failed' }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || t('salesforce.uploadError', { defaultValue: 'An error occurred during upload' }));
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploading(false);
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
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            {processedFiles.length} file(s) ready for upload
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={() => setClearFilesDialogOpen(true)}
              disabled={loading || processedFiles.length === 0}
              color="warning"
            >
              {t('home.clearFiles')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={isAutoRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={loadProcessedFiles}
              disabled={loading || isAutoRefreshing}
            >
              {isAutoRefreshing
                ? t('home.autoRefreshing', { defaultValue: 'Auto-refreshing...' })
                : t('common.refresh')
              }
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {processedFiles.map((file) => (
            <Grid item xs={12} md={6} lg={4} key={file.processingId}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '2px solid',
                  borderColor: 'success.main',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom noWrap>
                    {file.fileName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('history.processed')} {formatDate(file.completedAt)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={file.processingMode || t('fileUpload.aiEnhanced')}
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label={`${file.recordCount || 0} ${t('history.records')}`}
                      color="secondary"
                      size="small"
                    />
                    <Chip
                      label={t('history.ready')}
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  {file.validationIssues && file.validationIssues.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {file.validationIssues.length} {t('history.validationIssues')}
                    </Alert>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadFile(file)}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => handleUploadToSalesforce(file)}
                    disabled={!isAuthenticated}
                    color="success"
                  >
                    Upload to SF
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
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {t('home.filesAndHistory', { defaultValue: 'Files & Processing History' })}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="files and history tabs">
          <Tab
            icon={
              <Badge badgeContent={processedFiles.length} color="success" max={99}>
                <CloudUploadIcon />
              </Badge>
            }
            label={t('home.readyFiles', { defaultValue: 'Ready for Upload' })}
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab
            icon={<HistoryIcon />}
            label={t('navigation.history', { defaultValue: 'History' })}
            id="tab-1"
            aria-controls="tabpanel-1"
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
          {t('salesforce.uploadToSalesforce', { defaultValue: 'Upload to Salesforce' })}
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

              <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                <InputLabel id="salesforce-object-label">
                  {t('salesforce.objectType', { defaultValue: 'Salesforce Object' })}
                </InputLabel>
                <Select
                  labelId="salesforce-object-label"
                  value={salesforceObject}
                  label={t('salesforce.objectType', { defaultValue: 'Salesforce Object' })}
                  onChange={(e) => setSalesforceObject(e.target.value)}
                  disabled={uploading}
                >
                  <MenuItem value="Lead">{t('salesforce.lead', { defaultValue: 'Lead' })}</MenuItem>
                  <MenuItem value="Contact">{t('salesforce.contact', { defaultValue: 'Contact' })}</MenuItem>
                  <MenuItem value="Account">{t('salesforce.account', { defaultValue: 'Account' })}</MenuItem>
                </Select>
              </FormControl>

              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    {t('salesforce.uploading', { defaultValue: 'Uploading...' })} {uploadProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}

              {uploadError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {uploadError}
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
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {uploading
              ? t('salesforce.uploading', { defaultValue: 'Uploading...' })
              : t('salesforce.upload', { defaultValue: 'Upload' })
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
    </Paper>
  );
};

export default UnifiedFilesHistorySection;
