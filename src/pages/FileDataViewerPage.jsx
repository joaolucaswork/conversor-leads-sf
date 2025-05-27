import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
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
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Fab,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';
import { getProcessedFileData } from '../services/apiService';

const FileDataViewerPage = () => {
  const { processingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get fileName from location state if available
  const fileName = location.state?.fileName || 'Unknown File';
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1); // API is 1-based
  const [rowsPerPage] = useState(20); // Fixed for mobile

  // Fetch data when component mounts or page changes
  useEffect(() => {
    if (processingId) {
      fetchData(page, rowsPerPage);
    }
  }, [processingId, page, rowsPerPage]);

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

  const handleBack = () => {
    navigate(-1);
  };

  const handlePreviousPage = () => {
    if (data?.pagination?.has_previous) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (data?.pagination?.has_next) {
      setPage(page + 1);
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
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: 'background.default',
      pb: { xs: 10, sm: 4 } // Extra padding for mobile FAB
    }}>
      {/* App Bar */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label={t('history.dataViewer.backToList')}
            sx={{ mr: 2 }}
          >
            <BackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" noWrap>
              {t('history.dataViewer.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
              {fileName}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2, px: { xs: 1, sm: 2 } }}>
        {/* File Info */}
        {data?.file_info && (
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('history.dataViewer.recordCount', { count: data.file_info.record_count })}
            </Typography>
            {data.pagination && (
              <Typography variant="body2" color="text.secondary">
                {t('history.dataViewer.page', { 
                  current: data.pagination.page, 
                  total: data.pagination.total_pages 
                })}
              </Typography>
            )}
          </Paper>
        )}

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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data && (
          <>
            {data.records && data.records.length > 0 ? (
              <>
                {isMobile ? (
                  // Mobile Card View
                  <Grid container spacing={2}>
                    {data.records.map((record, index) => (
                      <Grid item xs={12} key={index}>
                        <Card elevation={1}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            {data.columns.map((column) => (
                              record[column] && (
                                <Box key={column} sx={{ mb: 1 }}>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ fontWeight: 'bold' }}
                                  >
                                    {getFieldDisplayName(column)}:
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      wordBreak: 'break-word',
                                      mt: 0.5
                                    }}
                                  >
                                    {record[column]}
                                  </Typography>
                                </Box>
                              )
                            ))}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  // Desktop Table View
                  <TableContainer component={Paper} elevation={1}>
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
                )}
              </>
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
      </Container>

      {/* Pagination FABs for Mobile */}
      {isMobile && data?.pagination && (data.pagination.has_previous || data.pagination.has_next) && (
        <Box sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          display: 'flex', 
          gap: 1 
        }}>
          {data.pagination.has_previous && (
            <Fab 
              size="small" 
              color="primary" 
              onClick={handlePreviousPage}
              aria-label={t('history.dataViewer.previousPage')}
            >
              <PrevIcon />
            </Fab>
          )}
          {data.pagination.has_next && (
            <Fab 
              size="small" 
              color="primary" 
              onClick={handleNextPage}
              aria-label={t('history.dataViewer.nextPage')}
            >
              <NextIcon />
            </Fab>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FileDataViewerPage;
