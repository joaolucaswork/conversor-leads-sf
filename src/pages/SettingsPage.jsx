import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box'; // For spacing
import OpenAIApiKeyForm from '../components/OpenAIApiKeyForm'; 
import AISettingsForm from '../components/AISettingsForm'; // Import the new AI Settings form
// import { useSomeOtherSettingsStore } from '../store/someOtherSettingsStore'; 

const SettingsPage = () => {
  // const { settings, updateSettings } = useSomeOtherSettingsStore(); 

  const handleApiKeySaved = () => {
    console.log('API Key was saved (callback received in SettingsPage).');
    // Potentially trigger a re-fetch or update in AISettingsForm if AI settings depend on API key status, though not directly the case here.
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Application Settings
      </Typography>
      
      {/* OpenAI API Key Section */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
        <OpenAIApiKeyForm onKeySaved={handleApiKeySaved} />
      </Paper>

      {/* AI Configuration Section */}
      {/* AISettingsForm is self-contained for fetching and saving its data */}
      <Box sx={{ mt: 4 }}> 
        <AISettingsForm /> 
      </Box>
      

      {/* 
      // Example: Placeholder for other settings sections like Lead Distribution (future)
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Lead Distribution Settings (Future)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configuration for lead assignment rules and round-robin settings will go here.
        </Typography>
      </Paper> 
      */}
    </Container>
  );
};

export default SettingsPage;
