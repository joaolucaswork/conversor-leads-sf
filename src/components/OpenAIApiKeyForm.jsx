import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Simplified OpenAIApiKeyForm that only displays information about the pre-configured API key
 * for Reino Capital organization.
 */
const OpenAIApiKeyForm = ({ onKeySaved }) => {
  // Call onKeySaved to indicate the key is always ready
  React.useEffect(() => {
    if (onKeySaved) {
      onKeySaved();
    }
  }, [onKeySaved]);

  return (
    <Box sx={{ mt: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        OpenAI AI Features
      </Typography>
      
      <Alert 
        icon={<CheckCircleIcon fontSize="inherit" />}
        severity="success" 
        sx={{ mb: 2 }}
      >
        <Typography variant="body1" fontWeight="bold">
          AI features are pre-configured for Reino Capital
        </Typography>
      </Alert>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This application comes with Reino Capital's enterprise OpenAI API integration. 
        No additional configuration is needed to use AI-powered features.
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        All lead processing, field mapping, and data validation features are ready to use.
      </Typography>
    </Box>
  );
};

export default OpenAIApiKeyForm;
