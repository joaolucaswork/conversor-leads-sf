import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  DeveloperMode as DeveloperModeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useSettingsStore } from '../store/settingsStore';

const DeveloperModeToggle = () => {
  const { t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState(null);

  const {
    developerMode,
    isDeveloperModeLoading,
    setDeveloperMode
  } = useSettingsStore(state => ({
    developerMode: state.developerMode,
    isDeveloperModeLoading: state.isDeveloperModeLoading,
    setDeveloperMode: state.setDeveloperMode,
  }));

  const handleToggle = async (event) => {
    const newValue = event.target.checked;
    setIsChanging(true);
    setError(null);

    try {
      await setDeveloperMode(newValue);
    } catch (err) {
      console.error('Error changing developer mode:', err);
      setError(err.message || 'Failed to save developer mode setting.');
    } finally {
      setIsChanging(false);
    }
  };

  if (isDeveloperModeLoading) {
    return (
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Loading developer mode setting...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DeveloperModeIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h3">
          {t('settings.developerMode.title', { defaultValue: 'Developer Mode' })}
        </Typography>
        <Tooltip title={t('settings.developerMode.tooltip', {
          defaultValue: 'Controls visibility of advanced features, AI options, and analytics'
        })}>
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('settings.developerMode.description', {
          defaultValue: 'When disabled, the interface will be simplified to show only essential features. AI processing continues to run in the background for optimal results, but advanced options and statistics are hidden.'
        })}
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={developerMode}
            onChange={handleToggle}
            disabled={isChanging}
            color="primary"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">
              {developerMode
                ? t('settings.developerMode.enabled', { defaultValue: 'Developer Mode Enabled' })
                : t('settings.developerMode.disabled', { defaultValue: 'Simplified Interface' })
              }
            </Typography>
            {isChanging && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!developerMode && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            {t('settings.developerMode.simplifiedInfo', {
              defaultValue: 'Simplified interface active. AI processing continues to work behind the scenes for best results, while advanced options, statistics, and cost tracking are hidden for a cleaner experience.'
            })}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default DeveloperModeToggle;
