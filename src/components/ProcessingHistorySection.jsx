import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Tooltip,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import StatusDot from './StatusDot';
import StatusLegend from './StatusLegend';
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Article as LogsIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import {
  getProcessingHistory as getHistoryService,
  downloadProcessedFile as downloadFileService,
  getJobLogs as getJobLogsService,
} from '../services/apiService';
import { useGlobalProcessingEvents } from '../hooks/useProcessingEvents';
import LogViewerModal from './LogViewerModal';

const ProcessingHistorySection = ({
  maxItems = 5,
  showPagination = false,
  showClearButton = false,
  onClearHistory = null,
  loading: parentLoading = false
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addListener } = useGlobalProcessingEvents();
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: maxItems,
    totalItems: 0,
    totalPages: 0,
  });

  // Log viewer modal state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedJobLogs, setSelectedJobLogs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState(null);

  const fetchHistory = useCallback(async (pageToFetch = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getHistoryService(pageToFetch, pagination.limit);
      setHistoryItems(data.history || []);
      setPagination(prev => ({
        ...prev,
        page: data.pagination.page || 1,
        totalItems: data.pagination.totalItems || 0,
        totalPages: data.pagination.totalPages || 0,
      }));
    } catch (err) {
      console.error('Error fetching processing history:', err);
      setError(err.message || t('history.fetchError', { defaultValue: 'Failed to fetch processing history.' }));
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, t]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  // Listen for refresh requests from SalesforceStatusBar
  useEffect(() => {
    const handleRefreshRequest = () => {
      console.log('ProcessingHistorySection: Refresh requested from SalesforceStatusBar');
      fetchHistory(pagination.page);
    };

    window.addEventListener('salesforce-refresh-requested', handleRefreshRequest);

    return () => {
      window.removeEventListener('salesforce-refresh-requested', handleRefreshRequest);
    };
  }, [fetchHistory, pagination.page]);

  // Listen for processing completion events to automatically refresh history
  useEffect(() => {
    const handleProcessingCompletion = (processingData) => {
      console.log('ProcessingHistorySection: Processing completion detected:', processingData);

      // Refresh history when processing completes (both success and failure)
      if (processingData.status === 'completed' || processingData.status === 'failed') {
        console.log('Automatically refreshing processing history due to processing completion');

        // Add a small delay to ensure backend has updated the history
        setTimeout(() => {
          fetchHistory(pagination.page);
        }, 1000);
      }
    };

    // Add listener for processing completion events
    const removeListener = addListener(handleProcessingCompletion);

    // Cleanup listener on unmount
    return removeListener;
  }, [addListener, fetchHistory, pagination.page]);

  const handlePageChange = (event, newPage) => {
    fetchHistory(newPage + 1); // MUI pagination is 0-based, API is 1-based
  };

  const handleDownloadFile = async (item) => {
    try {
      await downloadFileService(item.processingId);
    } catch (error) {
      console.error('Download failed:', error);
      setError(`Download failed: ${error.message}`);
    }
  };

  const handleViewLogs = async (processingId) => {
    setIsLoadingLogs(true);
    setLogsError(null);
    setSelectedJobId(processingId);
    setLogModalOpen(true);

    try {
      const logs = await getJobLogsService(processingId);
      setSelectedJobLogs(logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setLogsError(err.message || t('history.fetchLogsError', { defaultValue: 'Failed to fetch logs.' }));
      setSelectedJobLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handlePreviewClick = (processingId) => {
    navigate(`/preview/${processingId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'processing': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    return t(`history.${status}`, { defaultValue: status });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('history.loading', { defaultValue: 'Loading history...' })}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
        {error}
        <Button onClick={() => fetchHistory(1)} sx={{ ml: 2 }}>
          {t('common.retry')}
        </Button>
      </Alert>
    );
  }

  if (historyItems.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body1">
          {t('history.noHistory', { defaultValue: 'No processing history found.' })}
        </Typography>
        <Typography variant="body2">
          {t('history.noHistoryDescription', { defaultValue: 'Process some lead files to see them here.' })}
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {showClearButton && historyItems.length > 0 && onClearHistory && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 2
        }}>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<ClearIcon />}
            onClick={onClearHistory}
            disabled={isLoading || parentLoading}
            color="warning"
            sx={{
              minHeight: { xs: 44, sm: 32 },
              fontSize: { xs: '0.875rem', sm: '0.8125rem' },
              px: { xs: 2, sm: 1.5 }
            }}
          >
            {t('home.clearHistory')}
          </Button>
        </Box>
      )}

      {/* Desktop Table View */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={1}>
          <Table size="small" aria-label="processing history table">
            <TableHead>
              <TableRow>
                <TableCell>{t('history.fileName')}</TableCell>
                <TableCell>{t('history.uploadDate')}</TableCell>
                <TableCell>{t('history.status')}</TableCell>
                <TableCell align="right">{t('history.recordsProcessed')}</TableCell>
                <TableCell align="center">{t('history.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyItems.map((item) => (
                <TableRow hover key={item.processingId}>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" noWrap>
                      {item.fileName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.uploadedAt ? format(new Date(item.uploadedAt), 'Pp') : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {item.recordCount || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {item.status === 'completed' && (
                        <>
                          <Tooltip title={t('history.downloadFile')}>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadFile(item)}
                              color="primary"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('history.view')}>
                            <IconButton
                              size="small"
                              onClick={() => handlePreviewClick(item.processingId)}
                              color="primary"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title={t('history.viewLogs')}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewLogs(item.processingId)}
                          color="secondary"
                        >
                          <LogsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {/* Status Legend for Mobile */}
        <StatusLegend />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {historyItems.map((item) => (
            <Card
              key={item.processingId}
              elevation={1}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <CardContent sx={{ p: 1.5, pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography
                    variant="subtitle2"
                    component="h4"
                    sx={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      lineHeight: 1.2,
                      wordBreak: 'break-word',
                      flex: 1,
                      mr: 1,
                      color: 'text.primary'
                    }}
                  >
                    {item.fileName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StatusDot status={item.status} size={8} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'capitalize'
                      }}
                    >
                      {getStatusLabel(item.status)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {item.uploadedAt ? format(new Date(item.uploadedAt), 'dd/MM/yy HH:mm') : 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                    {item.recordCount || 0} registros
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
                {item.status === 'completed' && (
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadFile(item)}
                    variant="outlined"
                    sx={{
                      minHeight: 36,
                      fontSize: '0.8125rem',
                      px: 2,
                      fontWeight: 500,
                      width: '100%',
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'text.secondary',
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    Download
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Box>
      </Box>

      {showPagination && pagination.totalPages > 1 && (
        <TablePagination
          component="div"
          count={pagination.totalItems}
          page={pagination.page - 1} // MUI pagination is 0-based
          onPageChange={handlePageChange}
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={[]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} ${t('common.of')} ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      )}

      {/* Log Viewer Modal */}
      <LogViewerModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        logs={selectedJobLogs}
        processingId={selectedJobId}
        isLoading={isLoadingLogs}
        error={logsError}
      />
    </Box>
  );
};

export default ProcessingHistorySection;
