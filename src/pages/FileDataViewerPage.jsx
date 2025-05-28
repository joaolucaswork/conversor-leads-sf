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
  const isVerySmallScreen = useMediaQuery('(max-width:420px)');

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
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label={t('history.dataViewer.backToList')}
            sx={{
              mr: { xs: 1, sm: 2 },
              minWidth: 44,
              minHeight: 44
            }}
          >
            <BackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant={isVerySmallScreen ? "subtitle1" : "h6"}
              component="div"
              noWrap
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                fontWeight: 500
              }}
            >
              {t('history.dataViewer.title')}
            </Typography>
            {!isVerySmallScreen && (
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.8,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
                noWrap
              >
                {t('history.dataViewer.fileName', { fileName })}
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: 1, sm: 2 },
          px: { xs: 0.5, sm: 1, md: 2 },
          maxWidth: { xs: '100%', sm: 'xl' }
        }}
      >
        {/* File Info */}
        {data?.file_info && (
          <Paper
            elevation={1}
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: { xs: 1.5, sm: 2 },
              mx: { xs: 0.5, sm: 0 }
            }}
          >
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 0.5, sm: 2 },
              alignItems: { xs: 'flex-start', sm: 'center' }
            }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 500
                }}
              >
                {t('history.dataViewer.recordCount', { count: data.file_info.record_count })}
              </Typography>
              {data.pagination && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {t('history.dataViewer.page', {
                    current: data.pagination.page,
                    total: data.pagination.total_pages
                  })}
                </Typography>
              )}
              {isVerySmallScreen && fileName && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.7rem',
                    fontStyle: 'italic',
                    wordBreak: 'break-word'
                  }}
                >
                  {fileName}
                </Typography>
              )}
            </Box>
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
                  <Grid
                    container
                    spacing={{ xs: 1, sm: 2 }}
                    sx={{ px: { xs: 0.5, sm: 0 } }}
                  >
                    {data.records.map((record, index) => (
                      <Grid item xs={12} key={index}>
                        <Card
                          elevation={1}
                          sx={{
                            borderRadius: { xs: 1, sm: 2 },
                            overflow: 'hidden'
                          }}
                        >
                          <CardContent
                            sx={{
                              p: { xs: 1.5, sm: 2 },
                              '&:last-child': { pb: { xs: 1.5, sm: 2 } }
                            }}
                          >
                            {data.columns.map((column) => (
                              record[column] && (
                                <Box
                                  key={column}
                                  sx={{
                                    mb: { xs: 1, sm: 1.5 },
                                    '&:last-child': { mb: 0 }
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      display: 'block',
                                      mb: 0.25
                                    }}
                                  >
                                    {getFieldDisplayName(column)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      wordBreak: 'break-word',
                                      fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                      lineHeight: 1.4,
                                      color: 'text.primary',
                                      minHeight: { xs: 20, sm: 'auto' },
                                      display: 'flex',
                                      alignItems: 'center'
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
                  // Desktop Table View with horizontal scroll
                  <TableContainer
                    component={Paper}
                    elevation={1}
                    sx={{
                      maxWidth: '100%',
                      overflowX: 'auto',
                      '&::-webkit-scrollbar': {
                        height: 8,
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: 4,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.5)',
                        },
                      },
                    }}
                  >
                    <Table
                      stickyHeader
                      size="small"
                      aria-label="file data table"
                      sx={{ minWidth: 650 }}
                    >
                      <TableHead>
                        <TableRow>
                          {data.columns.map((column) => (
                            <TableCell
                              key={column}
                              sx={{
                                fontWeight: 'bold',
                                backgroundColor: 'background.paper',
                                minWidth: 120,
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap'
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
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.875rem'
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
          bottom: { xs: 20, sm: 16 },
          right: { xs: 16, sm: 16 },
          display: 'flex',
          gap: { xs: 1.5, sm: 1 },
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          zIndex: 1000
        }}>
          {data.pagination.has_previous && (
            <Fab
              size={isVerySmallScreen ? "medium" : "small"}
              color="primary"
              onClick={handlePreviousPage}
              aria-label={t('history.dataViewer.previousPage')}
              sx={{
                minWidth: 44,
                minHeight: 44,
                width: { xs: 48, sm: 40 },
                height: { xs: 48, sm: 40 },
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <PrevIcon sx={{ fontSize: { xs: '1.25rem', sm: '1rem' } }} />
            </Fab>
          )}
          {data.pagination.has_next && (
            <Fab
              size={isVerySmallScreen ? "medium" : "small"}
              color="primary"
              onClick={handleNextPage}
              aria-label={t('history.dataViewer.nextPage')}
              sx={{
                minWidth: 44,
                minHeight: 44,
                width: { xs: 48, sm: 40 },
                height: { xs: 48, sm: 40 },
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <NextIcon sx={{ fontSize: { xs: '1.25rem', sm: '1rem' } }} />
            </Fab>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FileDataViewerPage;
