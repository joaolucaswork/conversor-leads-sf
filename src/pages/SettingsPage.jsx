import React from 'react';
import { useTranslation } from 'react-i18next';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box'; // For spacing
import OpenAIApiKeyForm from '../components/OpenAIApiKeyForm';
import AISettingsForm from '../components/AISettingsForm'; // Import the new AI Settings form
import LanguageSelector from '../components/LanguageSelector'; // Import the language selector
import DeveloperModeToggle from '../components/DeveloperModeToggle'; // Import the developer mode toggle
import { useSettingsStore } from '../store/settingsStore'; // Import settings store
// import { useSomeOtherSettingsStore } from '../store/someOtherSettingsStore';

const SettingsPage = () => {
  const { t } = useTranslation();
  // const { settings, updateSettings } = useSomeOtherSettingsStore();

  // Get developer mode state
  const { developerMode } = useSettingsStore(state => ({
    developerMode: state.developerMode,
  }));

  const handleApiKeySaved = () => {
    console.log('API Key was saved (callback received in SettingsPage).');
    // Potentially trigger a re-fetch or update in AISettingsForm if AI settings depend on API key status, though not directly the case here.
  };

  return (
    <Container maxWidth="md" sx={{ mt: 1, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('settings.title')}
      </Typography>

      {/* Language Selection Section */}
      <LanguageSelector />

      {/* Developer Mode Toggle */}
      <DeveloperModeToggle />

      {/* AI Configuration Sections - Only show in developer mode */}
      {developerMode && (
        <>
          {/* OpenAI API Key Section */}
          <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
            <OpenAIApiKeyForm onKeySaved={handleApiKeySaved} />
          </Paper>

          {/* AI Configuration Section */}
          {/* AISettingsForm is self-contained for fetching and saving its data */}
          <Box sx={{ mt: 4 }}>
            <AISettingsForm />
          </Box>
        </>
      )}


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
