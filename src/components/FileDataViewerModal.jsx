import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';
import { getProcessedFileData } from '../services/apiService';

const FileDataViewerModal = ({ 
  open, 
  onClose, 
  processingId, 
  fileName,
  onFullScreen = null 
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0); // MUI TablePagination is 0-based
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Fetch data when modal opens or pagination changes
  useEffect(() => {
    if (open && processingId) {
      fetchData(page + 1, rowsPerPage); // API is 1-based
    }
  }, [open, processingId, page, rowsPerPage]);

  const fetchData = async (apiPage, limit) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProcessedFileData(processingId, apiPage, limit);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching file data:', err);
      setError(err.message || t('history.dataViewer.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page
  };

  const handleClose = () => {
    setData(null);
    setError(null);
    setPage(0);
    onClose();
  };

  const handleFullScreen = () => {
    if (onFullScreen) {
      onFullScreen(processingId, fileName);
      handleClose();
    }
  };

  // Field name mapping for better display
  const getFieldDisplayName = (fieldName) => {
    const fieldMappings = {
      'Last Name': t('salesforce.fields.lastName', { defaultValue: 'Last Name' }),
      'Telefone Adcional': t('salesforce.fields.mobilePhone', { defaultValue: 'Mobile Phone' }),
      'Phone': t('salesforce.fields.phone', { defaultValue: 'Phone' }),
      'Email': t('salesforce.fields.email', { defaultValue: 'Email' }),
      'Description': t('salesforce.fields.description', { defaultValue: 'Description' }),
      'Patrimônio Financeiro': t('salesforce.fields.financialAssets', { defaultValue: 'Financial Assets' }),
      'Tipo': t('salesforce.fields.leadSource', { defaultValue: 'Lead Source' }),
      'State/Province': t('salesforce.fields.state', { defaultValue: 'State/Province' }),
      'OwnerId': t('salesforce.fields.owner', { defaultValue: 'Owner' }),
      'maisdeMilhao__c': t('salesforce.fields.millionPlus', { defaultValue: 'Million Plus' })
    };
    return fieldMappings[fieldName] || fieldName;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="xl" 
      fullWidth 
      fullScreen={isMobile}
      scroll="paper"
      PaperProps={{
        sx: {
          height: isMobile ? '100vh' : '90vh',
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box>
          <Typography variant="h6" component="div">
            {t('history.dataViewer.title')}
          </Typography>
          {fileName && (
            <Typography variant="body2" color="text.secondary">
              {t('history.dataViewer.fileName', { fileName })}
            </Typography>
          )}
          {data?.file_info?.record_count && (
            <Typography variant="body2" color="text.secondary">
              {t('history.dataViewer.recordCount', { count: data.file_info.record_count })}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isMobile && onFullScreen && (
            <Tooltip title={t('history.dataViewer.fullScreen')}>
              <IconButton onClick={handleFullScreen} size="small">
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('history.dataViewer.closeViewer')}>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, height: '100%' }}>
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px' 
          }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              {t('history.dataViewer.loading')}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data && (
          <>
            {data.records && data.records.length > 0 ? (
              <TableContainer sx={{ height: '100%' }}>
                <Table stickyHeader size="small" aria-label="file data table">
                  <TableHead>
                    <TableRow>
                      {data.columns.map((column) => (
                        <TableCell 
                          key={column}
                          sx={{ 
                            fontWeight: 'bold',
                            backgroundColor: 'background.paper',
                            minWidth: 120
                          }}
                        >
                          {getFieldDisplayName(column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.records.map((record, index) => (
                      <TableRow hover key={index}>
                        {data.columns.map((column) => (
                          <TableCell 
                            key={column}
                            sx={{ 
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {record[column] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '200px' 
              }}>
                <Typography color="text.secondary">
                  {t('history.dataViewer.noData')}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      {!loading && !error && data?.pagination && (
        <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('history.dataViewer.page', { 
              current: data.pagination.page, 
              total: data.pagination.total_pages 
            })}
          </Typography>
          <TablePagination
            component="div"
            count={data.pagination.total_records}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage={t('history.dataViewer.recordsPerPage')}
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} ${t('common.of')} ${count}`
            }
            showFirstButton
            showLastButton
            sx={{
              '& .MuiTablePagination-toolbar': {
                minHeight: 'auto',
                paddingLeft: 0
              }
            }}
          />
        </DialogActions>
      )}
    </Dialog>
  );
};

export default FileDataViewerModal;
