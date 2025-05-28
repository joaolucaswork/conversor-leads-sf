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
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  AttachMoney as CostIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { getProcessingStatistics } from '../services/apiService';

const ProcessingStatisticsModal = ({
  open,
  onClose,
  processingId,
  fileName
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isVerySmallScreen = useMediaQuery('(max-width:420px)');

  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch statistics when modal opens
  useEffect(() => {
    if (open && processingId) {
      fetchStatistics();
    }
  }, [open, processingId]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProcessingStatistics(processingId);
      setStatistics(response);
    } catch (err) {
      console.error('Error fetching processing statistics:', err);
      setError(err.message || t('statistics.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStatistics(null);
    setError(null);
    onClose();
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const renderTechnicalStats = (technicalStats) => {
    const { aiStats, apiUsage, processingTime, recordCount, errorCount, warningCount } = technicalStats;

    return (
      <Box sx={{ mt: 2 }}>
        {/* Processing Overview */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
              <SpeedIcon color="primary" sx={{ fontSize: '2rem', mb: 1 }} />
              <Typography variant="h6" component="div">
                {formatDuration(processingTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('statistics.processingTime')}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
              <AnalyticsIcon color="success" sx={{ fontSize: '2rem', mb: 1 }} />
              <Typography variant="h6" component="div">
                {recordCount.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('statistics.recordsProcessed')}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
              <ErrorIcon color="error" sx={{ fontSize: '2rem', mb: 1 }} />
              <Typography variant="h6" component="div">
                {errorCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('statistics.errors')}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
              <WarningIcon color="warning" sx={{ fontSize: '2rem', mb: 1 }} />
              <Typography variant="h6" component="div">
                {warningCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('statistics.warnings')}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* AI Statistics */}
        {aiStats && Object.keys(aiStats).length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                {t('statistics.aiProcessingStats')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>{t('statistics.mappingAttempts')}</TableCell>
                      <TableCell align="right">{aiStats.mappings_attempted || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('statistics.mappingSuccesses')}</TableCell>
                      <TableCell align="right">{aiStats.mappings_successful || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('statistics.validationAttempts')}</TableCell>
                      <TableCell align="right">{aiStats.validations_attempted || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('statistics.ruleBasedFallbacks')}</TableCell>
                      <TableCell align="right">{aiStats.fallbacks_to_rules || 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        )}

        {/* API Usage Statistics */}
        {apiUsage && Object.keys(apiUsage).length > 0 && (
          <Accordion sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                {t('statistics.apiUsageDetails')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <CostIcon color="primary" sx={{ fontSize: '2rem', mb: 1 }} />
                    <Typography variant="h6" component="div">
                      {formatCurrency(apiUsage.estimated_cost || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('statistics.totalCost')}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                    <MemoryIcon color="secondary" sx={{ fontSize: '2rem', mb: 1 }} />
                    <Typography variant="h6" component="div">
                      {(apiUsage.total_tokens_used || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('statistics.tokensUsed')}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>{t('statistics.totalApiCalls')}</TableCell>
                          <TableCell align="right">{apiUsage.total_calls || 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{t('statistics.cacheHitRate')}</TableCell>
                          <TableCell align="right">
                            {((apiUsage.cache_hit_ratio || 0) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{t('statistics.cacheHits')}</TableCell>
                          <TableCell align="right">{apiUsage.cache_hits || 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{t('statistics.aiOperationsSkipped')}</TableCell>
                          <TableCell align="right">{apiUsage.ai_skipped || 0}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100vh' : '70vh',
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Box>
          <Typography variant="h6" component="div">
            {t('statistics.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {fileName}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size={isVerySmallScreen ? "medium" : "small"}
          sx={{
            minWidth: 44,
            minHeight: 44,
            p: { xs: 1.5, sm: 1 }
          }}
        >
          <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1rem' } }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {loading && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px'
          }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              {t('statistics.loading')}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {statistics && !loading && (
          <Box>
            {/* Human-Readable Summary */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('statistics.humanSummary')}
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {statistics.statistics.humanReadableSummary || t('statistics.noSummaryAvailable')}
                </Typography>
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }} />

            {/* Technical Statistics */}
            <Typography variant="h6" gutterBottom color="primary">
              {t('statistics.technicalDetails')}
            </Typography>
            {renderTechnicalStats(statistics.statistics.technicalStats)}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 2 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            minHeight: 44,
            px: 3
          }}
        >
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProcessingStatisticsModal;
