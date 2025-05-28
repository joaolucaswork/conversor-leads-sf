import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, CircularProgress, Alert, Button, Pagination, IconButton, Tooltip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // For navigation links
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';

import {
  getProcessingHistory as getHistoryService,
  downloadProcessedFile as downloadFileService,
  getJobLogs as getJobLogsService // Import the new service
} from '../services/apiService';
import { useNotifications } from '../hooks/useNotifications';
import LogViewerModal from '../components/LogViewerModal'; // Import the modal

const ProcessingHistoryPage = () => {
  const { t } = useTranslation();
  const { showDownloadError } = useNotifications();
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For history list
  const [error, setError] = useState(null); // For history list
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });

  // State for individual item actions
  const [downloading, setDownloading] = useState({});
  const [downloadError, setDownloadError] = useState({});

  // State for Log Viewer Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedProcessingIdForLogs, setSelectedProcessingIdForLogs] = useState(null);
  const [currentLogs, setCurrentLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logError, setLogError] = useState(null);

  const fetchHistory = useCallback(async (pageToFetch) => {
    setIsLoading(true); // Loading for the main history list
    setError(null); // Error for the main history list
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
      setIsLoading(false); // Loading for the main history list
    }
  }, [pagination.limit, t]);

  useEffect(() => {
    fetchHistory(pagination.page);
  }, [fetchHistory, pagination.page]);

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDownload = async (resultUrl, processingId, defaultFileName) => {
    if (!processingId) return;
    setDownloading(prev => ({ ...prev, [processingId]: true }));
    setDownloadError(prev => ({ ...prev, [processingId]: null }));
    try {
      await downloadFileService(processingId);
    } catch (err) {
      console.error('Download error:', err);
      const filename = defaultFileName || `planilha_processada_${processingId}.csv`;
      const errorMessage = err.message || 'Download failed';
      showDownloadError(filename, errorMessage);
      setDownloadError(prev => ({ ...prev, [processingId]: errorMessage }));
    } finally {
      setDownloading(prev => ({ ...prev, [processingId]: false }));
    }
  };

  const fetchLogsForJob = async (pId) => {
    if (!pId) return;
    setIsLoadingLogs(true);
    setLogError(null);
    setCurrentLogs([]);
    try {
      const logsData = await getJobLogsService(pId);
      setCurrentLogs(logsData || []);
    } catch (err) {
      console.error(`Error fetching logs for job ${pId}:`, err);
      setLogError(err.message || t('history.fetchLogsError', { defaultValue: 'Failed to fetch logs.' }));
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleOpenLogModal = (pId) => {
    setSelectedProcessingIdForLogs(pId);
    setIsLogModalOpen(true);
    fetchLogsForJob(pId);
  };

  const handleCloseLogModal = () => {
    setIsLogModalOpen(false);
    setSelectedProcessingIdForLogs(null);
    setCurrentLogs([]);
    setLogError(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('history.title')}
      </Typography>

      {/* Main history list loading/error indicators */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t('history.loading', { defaultValue: 'Loading history...' })}</Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>
      )}

      {!isLoading && !error && historyItems.length === 0 && (
        <Typography sx={{ mt: 2, textAlign: 'center' }}>{t('history.noHistory')}</Typography>
      )}

      {!isLoading && !error && historyItems.length > 0 && (
        <>
          <Paper elevation={3} sx={{ mt: 2 }}>
            <TableContainer>
              <Table stickyHeader aria-label="processing history table">
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
                      <TableCell component="th" scope="row">{item.fileName}</TableCell>
                      <TableCell>{item.uploadedAt ? format(new Date(item.uploadedAt), 'Pp') : 'N/A'}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={
                            item.status === 'completed' ? 'success.main' :
                            item.status === 'failed' ? 'error.main' : 'text.secondary'
                          }
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {item.status ? item.status.replace(/_/g, ' ') : 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.recordCount || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title={t('history.viewLogs', { defaultValue: 'View Logs' })}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenLogModal(item.processingId)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {/* ... (Download button logic remains the same) ... */}
                          {item.status === 'completed' && item.resultUrl && (
                            <Tooltip title={t('history.downloadFile', { defaultValue: 'Re-download Processed File' })}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownload(item.resultUrl, item.processingId, item.fileName)}
                                  disabled={downloading[item.processingId]}
                                >
                                  {downloading[item.processingId] ? <CircularProgress size={20} /> : <DownloadIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {downloadError[item.processingId] && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.7rem' }}>
                              {downloadError[item.processingId]}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
      <LogViewerModal
        open={isLogModalOpen}
        onClose={handleCloseLogModal}
        logs={currentLogs}
        isLoading={isLoadingLogs}
        error={logError}
        processingId={selectedProcessingIdForLogs}
      />
    </Box>
  );
};

export default ProcessingHistoryPage;
