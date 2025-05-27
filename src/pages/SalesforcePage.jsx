import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { getProcessingHistory } from '../services/apiService';
import {
  uploadLeadsToSalesforce,
  getSalesforceObjects,
  downloadProcessedFile,
  formatSalesforceResult
} from '../services/salesforceService';
import DuplicateHandlingDialog from '../components/DuplicateHandlingDialog';

const SalesforcePage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, accessToken, instanceUrl, initializeAuth, ensureValidToken, validateAuthentication, fixAuthenticationState } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
    instanceUrl: state.instanceUrl,
    initializeAuth: state.initializeAuth,
    ensureValidToken: state.ensureValidToken,
    validateAuthentication: state.validateAuthentication,
    fixAuthenticationState: state.fixAuthenticationState,
  }));

  // Debug logging for authentication state
  console.log('SalesforcePage - Auth State:', {
    isAuthenticated,
    accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
    instanceUrl
  });

  // Add a test function to window for debugging
  React.useEffect(() => {
    window.testSalesforceAuth = async () => {
      console.log('Testing Salesforce authentication...');

      // Test setting auth data
      const testAuthData = {
        accessToken: 'test-access-token-12345',
        instanceUrl: 'https://test.salesforce.com',
        refreshToken: 'test-refresh-token-67890',
        issuedAt: Math.floor(Date.now() / 1000),
        expiresIn: 7200
      };

      if (window.electronAPI && window.electronAPI.setStoreValue) {
        await window.electronAPI.setStoreValue('salesforceAuth', testAuthData);
        console.log('Test auth data set, reinitializing auth store...');

        // Reinitialize auth store
        const authStore = useAuthStore.getState();
        await authStore.initializeAuth();

        console.log('Auth store reinitialized');
      } else {
        console.log('electronAPI not available');
      }
    };

    window.clearSalesforceAuth = async () => {
      if (window.electronAPI && window.electronAPI.setStoreValue) {
        await window.electronAPI.setStoreValue('salesforceAuth', null);
        console.log('Auth data cleared, reinitializing auth store...');

        const authStore = useAuthStore.getState();
        await authStore.initializeAuth();

        console.log('Auth store reinitialized');
      }
    };
  }, []);

  const [processedFiles, setProcessedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [salesforceObject, setSalesforceObject] = useState('Lead');
  const [salesforceObjects, setSalesforceObjects] = useState([]);

  // Enhanced error state for detailed debugging
  const [detailedError, setDetailedError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);

  // Duplicate handling state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicatesDetected, setDuplicatesDetected] = useState([]);
  const [duplicateResolution, setDuplicateResolution] = useState(null);

  // Check for inconsistent authentication state on component mount
  useEffect(() => {
    const checkAuthState = async () => {
      // Check if we have an inconsistent authentication state
      if (isAuthenticated && (!accessToken || !instanceUrl)) {
        console.warn('SalesforcePage - Detected inconsistent authentication state on mount:', {
          isAuthenticated,
          hasAccessToken: !!accessToken,
          hasInstanceUrl: !!instanceUrl
        });

        try {
          const fixResult = await fixAuthenticationState();
          console.log('SalesforcePage - Auto-fix result:', fixResult);

          if (fixResult.message.includes('cleared')) {
            setError('Authentication state was inconsistent and has been cleared. Please log in again.');
          }
        } catch (error) {
          console.error('SalesforcePage - Error auto-fixing auth state:', error);
        }
      }
    };

    checkAuthState();
  }, [isAuthenticated, accessToken, instanceUrl, fixAuthenticationState]);

  // Load processed files and Salesforce objects on component mount
  useEffect(() => {
    loadProcessedFiles();
    loadSalesforceObjects();
  }, []);

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

  const loadProcessedFiles = async () => {
    try {
      setLoading(true);
      console.log('SalesforcePage - Loading processed files...');
      const response = await getProcessingHistory();
      console.log('SalesforcePage - API Response:', response);

      // Extract the history array from the response object
      const history = response.history || [];
      console.log('SalesforcePage - History array:', history);

      // Filter for completed files that can be uploaded to Salesforce
      const completedFiles = history.filter(item => {
        const hasOutputPath = item.outputPath || item.resultUrl;
        const isCompleted = item.status === 'completed';
        console.log(`SalesforcePage - File ${item.fileName}: status=${item.status}, hasOutputPath=${!!hasOutputPath}, isCompleted=${isCompleted}`);
        return isCompleted && hasOutputPath;
      });

      console.log('SalesforcePage - Completed files:', completedFiles);
      setProcessedFiles(completedFiles);
    } catch (err) {
      console.error('Error loading processed files:', err);
      setError('Failed to load processed files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setUploadDialogOpen(true);
  };

  const handleUploadToSalesforce = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setUploadProgress(0);
      setError(null);

      // Check authentication state first
      if (!isAuthenticated) {
        setError('Not authenticated with Salesforce. Please log in first.');
        return;
      }

      // Validate authentication with Salesforce before upload
      console.log('SalesforcePage - Validating authentication before upload...');
      const authValidation = await validateAuthentication();
      if (!authValidation.success) {
        setError(`Authentication validation failed: ${authValidation.error}. Please try logging in again.`);
        return;
      }

      // Start progress indicator
      setUploadProgress(10);

      console.log('SalesforcePage - Starting upload with authentication state:', {
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
      console.log('SalesforcePage - Full upload result:', result);

      // Check for duplicates first
      if (result.hasDuplicates && result.duplicatesDetected && result.duplicatesDetected.length > 0) {
        console.log('SalesforcePage - Duplicates detected:', result.duplicatesDetected);
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
          setError('Some records were identified as duplicates. Please use the duplicate handling dialog to resolve them.');
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
          setError(errorMessage);
        }
      } else {
        setSuccess(`Successfully uploaded to Salesforce: ${formattedResult.summary}`);
        setDetailedError(null);
      }

      setUploadDialogOpen(false);

    } catch (err) {
      console.error('Error uploading to Salesforce:', err);

      // Provide more specific error messages
      let errorMessage = err.message || 'Failed to upload to Salesforce. Please try again.';

      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Authentication failed')) {
        errorMessage += ' Please try logging out and logging back in.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      setLoading(true);
      const blob = await downloadProcessedFile(file.processingId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName || `processed_leads_${file.processingId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`Downloaded ${file.fileName} successfully.`);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err.message || 'Failed to download file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDuplicateResolution = async (resolution) => {
    console.log('SalesforcePage - Duplicate resolution:', resolution);
    setDuplicateResolution(resolution);
    setDuplicateDialogOpen(false);

    try {
      setLoading(true);

      if (resolution.action === 'cancel') {
        setError('Upload cancelled due to duplicate records.');
        return;
      }

      if (resolution.action === 'skip') {
        setSuccess(`Upload completed. ${resolution.duplicates.length} duplicate records were skipped.`);
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
          } else {
            setError(`Failed to update records: ${result.error}`);
          }
        } else {
          setSuccess(`Update functionality would update ${resolution.duplicates.length} records. (API not available in browser mode)`);
        }
        return;
      }

    } catch (err) {
      console.error('Error handling duplicate resolution:', err);
      setError('Failed to process duplicate resolution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 1 }}>
      {/* Connection Status */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('salesforce.title')}
        </Typography>

        {isAuthenticated && accessToken ? (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1">
                  <strong>{t('salesforce.connectedToSalesforce', { defaultValue: 'Connected to Salesforce' })}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('salesforce.instance', { defaultValue: 'Instance: {{instanceUrl}}', instanceUrl })}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={async () => {
                  try {
                    setLoading(true);
                    await ensureValidToken();
                    setSuccess(t('salesforce.authRefreshSuccess', { defaultValue: 'Authentication refreshed successfully' }));
                  } catch (error) {
                    setError(t('salesforce.authRefreshError', { defaultValue: 'Failed to refresh authentication. Please try logging in again.' }));
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {t('salesforce.refresh')}
              </Button>
            </Box>
          </Alert>
        ) : (
          <Alert severity="warning" icon={<ErrorIcon />} sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1">
                  <strong>{t('salesforce.notConnected', { defaultValue: 'Not connected to Salesforce' })}</strong>
                </Typography>
                <Typography variant="body2">
                  {t('salesforce.loginPrompt', { defaultValue: 'Please log in to Salesforce to upload processed lead data.' })}
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={async () => {
                    try {
                      setLoading(true);

                      // First fix any inconsistent authentication state
                      console.log('SalesforcePage - Fixing authentication state...');
                      const fixResult = await fixAuthenticationState();
                      console.log('SalesforcePage - Fix result:', fixResult);

                      // Then reinitialize authentication
                      await initializeAuth();

                      // Finally validate the authentication
                      const validation = await validateAuthentication();
                      if (validation.success) {
                        setSuccess('Authentication found and validated successfully');
                      } else {
                        setError(`Authentication check completed but validation failed: ${validation.error}`);
                      }
                    } catch (error) {
                      console.error('SalesforcePage - Error during auth check:', error);
                      setError('Failed to refresh authentication state.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  Check Auth
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    console.log('Current auth store state:', useAuthStore.getState());
                    console.log('Window electronAPI available:', !!window.electronAPI);
                    if (window.electronAPI) {
                      console.log('Available electronAPI methods:', Object.keys(window.electronAPI));
                    }
                  }}
                >
                  Debug
                </Button>
              </Box>
            </Box>
          </Alert>
        )}

        <Typography variant="body1" paragraph>
          Upload your processed lead files directly to Salesforce. Select a processed file below and configure the upload settings.
        </Typography>
      </Paper>

      {/* Error/Success Messages */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => {
            setError(null);
            setDetailedError(null);
          }}
          action={
            detailedError && (
              <Button
                color="inherit"
                size="small"
                onClick={() => setDebugDialogOpen(true)}
                sx={{ ml: 1 }}
              >
                View Debug Info
              </Button>
            )
          }
        >
          <Box sx={{ whiteSpace: 'pre-line' }}>
            {error}
          </Box>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Processed Files List */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Processed Files Ready for Upload
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadProcessedFiles}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {processedFiles.length === 0 ? (
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="body1">
              No processed files available for upload.
            </Typography>
            <Typography variant="body2">
              Process some lead files first on the Home page, then return here to upload them to Salesforce.
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {processedFiles.map((file) => (
              <Grid item xs={12} md={6} lg={4} key={file.processingId}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom noWrap>
                      {file.fileName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Processed: {formatDate(file.completedAt)}
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <Chip
                        label={file.processingMode || 'AI-Enhanced'}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={`${file.recordCount || 0} records`}
                        color="secondary"
                        size="small"
                      />
                    </Box>
                    {file.validationIssues && file.validationIssues.length > 0 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        {file.validationIssues.length} validation issue(s) found
                      </Alert>
                    )}
                  </CardContent>
                  <CardActions>
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
                      onClick={() => handleFileSelect(file)}
                      disabled={!isAuthenticated || loading}
                    >
                      Upload to SF
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Upload Configuration Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload to Salesforce</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <>
              <Typography variant="body1" gutterBottom>
                <strong>File:</strong> {selectedFile.fileName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Records: {selectedFile.recordCount || 'Unknown'}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Salesforce Object</InputLabel>
                <Select
                  value={salesforceObject}
                  label="Salesforce Object"
                  onChange={(e) => setSalesforceObject(e.target.value)}
                >
                  {salesforceObjects.map((obj) => (
                    <MenuItem key={obj.name} value={obj.name} disabled={!obj.createable}>
                      {obj.label || obj.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Upload Progress: {uploadProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadToSalesforce}
            variant="contained"
            startIcon={<UploadIcon />}
            disabled={loading || !isAuthenticated}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

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
            <Typography variant="h6">Upload Debug Information</Typography>
            <Button
              onClick={() => {
                const debugData = {
                  detailedError,
                  uploadResult,
                  timestamp: new Date().toISOString()
                };
                navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
                setSuccess('Debug information copied to clipboard');
              }}
              size="small"
              variant="outlined"
            >
              Copy to Clipboard
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailedError && (
            <Box>
              <Typography variant="h6" gutterBottom color="error">
                Upload Summary
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
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Handling Dialog */}
      <DuplicateHandlingDialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
        duplicates={duplicatesDetected}
        onResolve={handleDuplicateResolution}
        loading={loading}
      />
    </Container>
  );
};

export default SalesforcePage;
