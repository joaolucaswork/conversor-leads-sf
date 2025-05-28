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
  Clear as ClearIcon,
  RemoveRedEye as DataViewIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import {
  getProcessingHistory as getHistoryService,
  downloadProcessedFile as downloadFileService,
} from '../services/apiService';
import { useGlobalProcessingEvents } from '../hooks/useProcessingEvents';
import { useSettingsStore } from '../store/settingsStore';
import FileDataViewerModal from './FileDataViewerModal';
import ProcessingStatisticsModal from './ProcessingStatisticsModal';
import { useTheme, useMediaQuery } from '@mui/material';

const ProcessingHistorySection = ({
  maxItems = 5,
  showPagination = false,
  showClearButton = false,
  onClearHistory = null,
  loading: parentLoading = false
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { addListener } = useGlobalProcessingEvents();

  // Settings store for developer mode
  const { developerMode } = useSettingsStore(state => ({
    developerMode: state.developerMode,
  }));
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: maxItems,
    totalItems: 0,
    totalPages: 0,
  });

  // File data viewer modal state
  const [fileViewerModalOpen, setFileViewerModalOpen] = useState(false);
  const [selectedFileProcessingId, setSelectedFileProcessingId] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);

  // Statistics modal state
  const [statisticsModalOpen, setStatisticsModalOpen] = useState(false);
  const [statisticsProcessingId, setStatisticsProcessingId] = useState(null);
  const [statisticsFileName, setStatisticsFileName] = useState(null);

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

  const handleViewStatistics = (processingId, fileName) => {
    setStatisticsProcessingId(processingId);
    setStatisticsFileName(fileName);
    setStatisticsModalOpen(true);
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
        <TableContainer
          component={Paper}
          elevation={1}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'background.paper'
          }}
        >
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
                <TableRow
                  hover
                  key={item.processingId}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ maxWidth: '200px' }}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={item.fileName} // Tooltip para mostrar nome completo
                    >
                      {item.fileName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem'
                      }}
                    >
                      {item.uploadedAt ? format(new Date(item.uploadedAt), 'Pp') : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StatusDot status={item.status} size={8} />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                          color: 'text.primary'
                        }}
                      >
                        {getStatusLabel(item.status)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
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
                          <Tooltip title={t('history.viewData')}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewFileData(item.processingId, item.fileName)}
                              color="primary"
                            >
                              <DataViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {/* Statistics button - only visible in Developer Mode */}
                          {developerMode && (
                            <Tooltip title={t('statistics.viewStatistics')}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewStatistics(item.processingId, item.fileName)}
                                color="secondary"
                              >
                                <AnalyticsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          {historyItems.map((item) => (
            <Card
              key={item.processingId}
              elevation={1}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                transition: 'box-shadow 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: 2
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 1.5 }, pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography
                    variant="subtitle2"
                    component="h4"
                    sx={{
                      fontSize: { xs: '1rem', sm: '0.9375rem' },
                      fontWeight: 600,
                      lineHeight: 1.3,
                      flex: 1,
                      mr: 1.5,
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: { xs: '200px', sm: '250px' }
                    }}
                    title={item.fileName} // Tooltip para mostrar nome completo
                  >
                    {item.fileName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <StatusDot status={item.status} size={10} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.8125rem', sm: '0.75rem' },
                        fontWeight: 500,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getStatusLabel(item.status)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.8125rem', sm: '0.75rem' },
                      fontWeight: 400
                    }}
                  >
                    {item.uploadedAt ? format(new Date(item.uploadedAt), 'dd/MM/yy HH:mm') : 'N/A'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.8125rem', sm: '0.75rem' },
                      color: 'text.primary'
                    }}
                  >
                    {item.recordCount || 0} registros
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ px: { xs: 2, sm: 1.5 }, pb: { xs: 2, sm: 1.5 }, pt: 0 }}>
                {item.status === 'completed' && (
                  <Box sx={{
                    display: 'flex',
                    gap: { xs: 1.5, sm: 1 },
                    width: '100%',
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    <Button
                      size="small"
                      startIcon={<DataViewIcon />}
                      onClick={() => handleViewFileData(item.processingId, item.fileName)}
                      variant="outlined"
                      sx={{
                        minHeight: { xs: 48, sm: 44 }, // Larger touch target on mobile
                        fontSize: { xs: '0.875rem', sm: '0.8125rem' },
                        px: { xs: 3, sm: 2 },
                        fontWeight: 500,
                        flex: 1,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: 'primary.dark',
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText'
                        }
                      }}
                    >
                      {t('history.viewData')}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadFile(item)}
                      variant="outlined"
                      sx={{
                        minHeight: { xs: 48, sm: 44 }, // Larger touch target on mobile
                        fontSize: { xs: '0.875rem', sm: '0.8125rem' },
                        px: { xs: 3, sm: 2 },
                        fontWeight: 500,
                        flex: 1,
                        borderColor: 'divider',
                        color: 'text.primary',
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: 'text.secondary',
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      {t('common.download')}
                    </Button>
                    {/* Statistics button - only visible in Developer Mode */}
                    {developerMode && (
                      <Button
                        size="small"
                        startIcon={<AnalyticsIcon />}
                        onClick={() => handleViewStatistics(item.processingId, item.fileName)}
                        variant="outlined"
                        sx={{
                          minHeight: { xs: 48, sm: 44 }, // Larger touch target on mobile
                          fontSize: { xs: '0.875rem', sm: '0.8125rem' },
                          px: { xs: 3, sm: 2 },
                          fontWeight: 500,
                          flex: 1,
                          borderColor: 'secondary.main',
                          color: 'secondary.main',
                          borderRadius: 2,
                          '&:hover': {
                            borderColor: 'secondary.dark',
                            backgroundColor: 'secondary.main',
                            color: 'secondary.contrastText'
                          }
                        }}
                      >
                        {t('statistics.viewStatistics')}
                      </Button>
                    )}
                  </Box>
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

      {/* File Data Viewer Modal */}
      <FileDataViewerModal
        open={fileViewerModalOpen}
        onClose={() => setFileViewerModalOpen(false)}
        processingId={selectedFileProcessingId}
        fileName={selectedFileName}
        onFullScreen={handleFullScreenFileViewer}
      />

      {/* Processing Statistics Modal */}
      <ProcessingStatisticsModal
        open={statisticsModalOpen}
        onClose={() => setStatisticsModalOpen(false)}
        processingId={statisticsProcessingId}
        fileName={statisticsFileName}
      />
    </Box>
  );
};

export default ProcessingHistorySection;
