import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import FieldMappingDisplay from '../components/FieldMappingDisplay';
import { getLeadPreview as getLeadPreviewService, confirmProcessing as confirmProcessingService } from '../services/apiService'; // Import confirmProcessing

const MappingPreviewPage = () => {
  const { processingId } = useParams();
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState(null);

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [confirmSuccess, setConfirmSuccess] = useState('');

  useEffect(() => {
    if (!processingId) {
      setPreviewError('No processing ID provided.');
      setIsLoadingPreview(false);
      return;
    }

    const fetchPreviewData = async () => {
      setIsLoadingPreview(true);
      setPreviewError(null);
      try {
        const data = await getLeadPreviewService(processingId);
        setPreviewData(data);
      } catch (err) {
        console.error(`Error fetching lead preview data for ${processingId}:`, err);
        setPreviewError(err.message || 'Failed to fetch mapping preview data.');
      } finally {
        setIsLoadingPreview(false);
      }
    };

    fetchPreviewData();
  }, [processingId]);

  const handleConfirmAndProceed = async () => {
    if (!processingId) {
      setConfirmError('Cannot confirm: No processing ID available.');
      return;
    }
    setIsConfirming(true);
    setConfirmError(null);
    setConfirmSuccess('');
    try {
      // For now, confirmedMappings is an empty array as per task spec.
      // This will need to be updated if user can edit mappings.
      const response = await confirmProcessingService(processingId, []); 
      setConfirmSuccess(response.message || 'Processing confirmed and initiated successfully. Redirecting...');
      
      // Redirect to HomePage after a short delay to show success message
      setTimeout(() => {
        navigate('/'); // Navigate to HomePage where ProcessingStatus component will pick up new status
      }, 2000);

    } catch (err) {
      console.error(`Error confirming processing for ${processingId}:`, err);
      setConfirmError(err.message || 'Failed to confirm processing.');
      setIsConfirming(false); // Re-enable button on error
    }
    // Do not set setIsConfirming(false) on success here because we are redirecting
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
        disabled={isConfirming}
      >
        Back to Home
      </Button>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Field Mapping Preview
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Processing ID: {processingId}
        </Typography>

        {isLoadingPreview && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading preview data...</Typography>
          </Box>
        )}

        {previewError && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {previewError}
          </Alert>
        )}

        {!isLoadingPreview && !previewError && previewData && (
          <>
            <FieldMappingDisplay previewData={previewData} />
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              {/* <Button variant="outlined" sx={{ mr: 2 }} disabled={isConfirming}>
                Edit Mappings (Future)
              </Button> */}
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleConfirmAndProceed}
                disabled={isConfirming || isLoadingPreview || !!previewError} // Disable if loading preview, error in preview, or currently confirming
              >
                {isConfirming ? 'Confirming...' : 'Confirm and Proceed'}
              </Button>
            </Box>
            {isConfirming && <CircularProgress size={24} sx={{ ml: 2, position: 'absolute', right: '20px', bottom: '20px' }} />}
          </>
        )}
        
        {!isLoadingPreview && !previewError && !previewData && (
          <Typography sx={{ mt: 2 }}>No preview data found for this processing ID.</Typography>
        )}

        {confirmError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {confirmError}
          </Alert>
        )}
        {confirmSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {confirmSuccess}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default MappingPreviewPage;
