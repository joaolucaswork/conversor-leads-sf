import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  Storage,
  SmartToy,
  Assessment,
  Build,
  DataUsage,
  Timeline
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';

const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainingSummary, setTrainingSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [fieldPatterns, setFieldPatterns] = useState({ common_mappings: [], problematic_mappings: [] });
  const [generateDatasetDialog, setGenerateDatasetDialog] = useState(false);
  const [datasetName, setDatasetName] = useState('');
  const [minConfidence, setMinConfidence] = useState(80);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load training data summary
      const summaryResponse = await apiService.get('/api/v1/training/summary');
      setTrainingSummary(summaryResponse);

      // Load improvement recommendations
      const recommendationsResponse = await apiService.get('/api/v1/training/recommendations');
      setRecommendations(recommendationsResponse.recommendations || []);

      // Load field mapping patterns
      const patternsResponse = await apiService.get('/api/v1/training/field-patterns');
      setFieldPatterns(patternsResponse);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDataset = async () => {
    try {
      setGenerating(true);
      const response = await apiService.post('/api/v1/training/generate-dataset', {
        dataset_name: datasetName || 'auto_generated',
        min_confidence: minConfidence
      });

      if (response.success) {
        alert(`Dataset "${response.dataset_name}" generated successfully with ${response.total_samples} samples!`);
        setGenerateDatasetDialog(false);
        setDatasetName('');
        loadDashboardData(); // Refresh data
      } else {
        throw new Error(response.message || 'Failed to generate dataset');
      }
    } catch (err) {
      console.error('Failed to generate dataset:', err);
      alert('Failed to generate dataset: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Analytics />
        {t('admin.dashboard.title', 'Fine-Tuning Admin Dashboard')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Storage color="primary" />
                <Box>
                  <Typography variant="h6">{trainingSummary?.total_processing_jobs || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.dashboard.totalJobs', 'Total Processing Jobs')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <DataUsage color="secondary" />
                <Box>
                  <Typography variant="h6">{trainingSummary?.total_field_mappings || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.dashboard.fieldMappings', 'Field Mappings')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="success" />
                <Box>
                  <Typography variant="h6">
                    {trainingSummary?.mapping_accuracy_percent || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.dashboard.accuracy', 'Mapping Accuracy')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Build color="warning" />
                <Box>
                  <Typography variant="h6">{trainingSummary?.total_user_corrections || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.dashboard.corrections', 'User Corrections')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('admin.dashboard.actions', 'Training Actions')}
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<SmartToy />}
                  onClick={() => setGenerateDatasetDialog(true)}
                >
                  {t('admin.dashboard.generateDataset', 'Generate Training Dataset')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={loadDashboardData}
                >
                  {t('admin.dashboard.refresh', 'Refresh Data')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('admin.dashboard.recentActivity', 'Recent Activity')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.dashboard.recentJobs', 'Jobs in last 7 days')}: {trainingSummary?.recent_jobs_7_days || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.dashboard.lastUpdated', 'Last updated')}: {
                  trainingSummary?.last_updated 
                    ? new Date(trainingSummary.last_updated).toLocaleString()
                    : 'Never'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline />
              {t('admin.dashboard.recommendations', 'Improvement Recommendations')}
            </Typography>
            <Grid container spacing={2}>
              {recommendations.map((rec, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle2">{rec.type}</Typography>
                        <Chip 
                          label={rec.priority} 
                          size="small" 
                          color={getPriorityColor(rec.priority)}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {rec.description}
                      </Typography>
                      {rec.field_name && (
                        <Chip 
                          label={`Field: ${rec.field_name}`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Generate Dataset Dialog */}
      <Dialog open={generateDatasetDialog} onClose={() => setGenerateDatasetDialog(false)}>
        <DialogTitle>
          {t('admin.dashboard.generateDatasetTitle', 'Generate Training Dataset')}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('admin.dashboard.datasetName', 'Dataset Name')}
            fullWidth
            variant="outlined"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="auto_generated"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t('admin.dashboard.minConfidence', 'Minimum Confidence (%)')}
            type="number"
            fullWidth
            variant="outlined"
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDatasetDialog(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button 
            onClick={handleGenerateDataset} 
            variant="contained"
            disabled={generating}
          >
            {generating ? <CircularProgress size={20} /> : t('common.generate', 'Generate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboardPage;
