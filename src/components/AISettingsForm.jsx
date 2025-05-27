import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField, Button, Typography, Box, CircularProgress, Alert,
  Paper, Slider, FormLabel, Grid, Switch, FormControlLabel
} from '@mui/material';
import { isElectron } from '../utils/environment';

const AISettingsForm = () => {
  const [settings, setSettings] = useState({
    aiEnabled: true,
    defaultModelPreference: 'gpt-3.5-turbo',
    confidenceThresholdForAutoMapping: 80,
    useAiForMapping: true,
    useAiForValidation: true,
    useAiForDataConversion: true,
    fallbackToRules: true,
    maxRetries: 3,
    apiTimeout: 30,
    temperature: 0.1,
    maxTokens: 2000
  });
  const [initialSettings, setInitialSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState(null); // For API call errors
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // For field-specific validation

  const validateField = (name, value) => {
    let newFieldErrors = { ...fieldErrors };
    if (name === 'defaultModelPreference') {
      if (!value.trim()) {
        newFieldErrors.defaultModelPreference = 'AI Model Preference cannot be empty.';
      } else {
        delete newFieldErrors.defaultModelPreference;
      }
    }
    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0; // Return true if no errors
  };

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setGeneralError(null);
    setSuccess('');
    setFieldErrors({});
    try {
      let storedSettings = null;

      if (isElectron() && window.electronAPI) {
        // Load from Electron store
        storedSettings = await window.electronAPI.getStoreValue('ai_settings');
      } else {
        // Browser fallback - use localStorage
        const stored = localStorage.getItem('ai_settings');
        if (stored) {
          storedSettings = JSON.parse(stored);
        }
      }

      // Merge with defaults
      const fullData = {
        aiEnabled: storedSettings?.aiEnabled !== undefined ? storedSettings.aiEnabled : true,
        defaultModelPreference: storedSettings?.defaultModelPreference || 'gpt-3.5-turbo',
        confidenceThresholdForAutoMapping: storedSettings?.confidenceThresholdForAutoMapping !== undefined ? storedSettings.confidenceThresholdForAutoMapping : 80,
        useAiForMapping: storedSettings?.useAiForMapping !== undefined ? storedSettings.useAiForMapping : true,
        useAiForValidation: storedSettings?.useAiForValidation !== undefined ? storedSettings.useAiForValidation : true,
        useAiForDataConversion: storedSettings?.useAiForDataConversion !== undefined ? storedSettings.useAiForDataConversion : true,
        fallbackToRules: storedSettings?.fallbackToRules !== undefined ? storedSettings.fallbackToRules : true,
        maxRetries: storedSettings?.maxRetries || 3,
        apiTimeout: storedSettings?.apiTimeout || 30,
        temperature: storedSettings?.temperature || 0.1,
        maxTokens: storedSettings?.maxTokens || 2000,
        customMappingRules: storedSettings?.customMappingRules || [],
        aiProvider: storedSettings?.aiProvider || 'openai',
        availableModels: ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]
      };

      setSettings(fullData);
      setInitialSettings(JSON.parse(JSON.stringify(fullData)));
    } catch (err) {
      console.error('Error loading AI settings:', err);
      setGeneralError('Failed to load AI settings. Using defaults.');
      // Use default settings
      setInitialSettings(JSON.parse(JSON.stringify(settings)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value);

    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (name === 'defaultModelPreference') {
      validateField(name, newValue);
    }
    setSuccess('');
    setGeneralError(null); // Clear general error on field change
  };

  const handleSliderChange = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    setSuccess('');
    setGeneralError(null);
  };

  const handleReset = () => {
    if (initialSettings) {
      setSettings(JSON.parse(JSON.stringify(initialSettings)));
    }
    setFieldErrors({});
    setGeneralError(null);
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Perform final validation for all relevant fields before submitting
    const isModelPrefValid = validateField('defaultModelPreference', settings.defaultModelPreference);
    if (!isModelPrefValid) {
      return; // Stop submission if validation fails
    }

    setIsSaving(true);
    setGeneralError(null);
    setSuccess('');
    try {
      // Save to local storage
      if (isElectron() && window.electronAPI) {
        // Save to Electron store
        await window.electronAPI.setStoreValue('ai_settings', settings);
      } else {
        // Browser fallback - use localStorage
        localStorage.setItem('ai_settings', JSON.stringify(settings));
      }

      setInitialSettings(JSON.parse(JSON.stringify(settings)));
      setFieldErrors({}); // Clear field errors on successful save
      setSuccess('AI settings saved successfully!');
    } catch (err) {
      console.error('Error saving AI settings:', err);
      setGeneralError(err.message || 'Failed to save AI settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const isChanged = JSON.stringify(settings) !== JSON.stringify(initialSettings);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading AI settings...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom component="div">
        AI Configuration
      </Typography>
      <form onSubmit={handleSubmit}>
        {generalError && <Alert severity="error" sx={{ mb: 2 }}>{generalError}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3}>
          {/* AI Enabled Switch */}
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={settings.aiEnabled} onChange={handleChange} name="aiEnabled" />}
              label="Enable AI Processing"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Default AI Model"
              name="defaultModelPreference"
              value={settings.defaultModelPreference}
              onChange={handleChange}
              error={!!fieldErrors.defaultModelPreference}
              helperText={fieldErrors.defaultModelPreference || "Select the OpenAI model to use for AI processing"}
              margin="normal"
              select
              SelectProps={{ native: true }}
              required
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Recommended)</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom sx={{ mt: 2 }}>
              Confidence Threshold: {settings.confidenceThresholdForAutoMapping}%
            </Typography>
            <Slider
              name="confidenceThresholdForAutoMapping"
              value={settings.confidenceThresholdForAutoMapping}
              onChange={(e, val) => handleSliderChange('confidenceThresholdForAutoMapping', val)}
              aria-labelledby="confidence-threshold-slider"
              valueLabelDisplay="auto"
              step={1}
              marks={[
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 90, label: '90%' },
              ]}
              min={50}
              max={100}
              sx={{mt:1}}
            />
          </Grid>

          {/* AI Feature Toggles */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={settings.useAiForMapping} onChange={handleChange} name="useAiForMapping" />}
              label="Use AI for Field Mapping"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={settings.useAiForValidation} onChange={handleChange} name="useAiForValidation" />}
              label="Use AI for Data Validation"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={settings.fallbackToRules} onChange={handleChange} name="fallbackToRules" />}
              label="Fallback to Rule-based Processing"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Retries"
              name="maxRetries"
              type="number"
              value={settings.maxRetries}
              onChange={handleChange}
              helperText="Maximum number of retry attempts for AI processing"
              margin="normal"
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormLabel component="legend" sx={{ mt: 2 }}>Custom Mapping Rules (Read-only)</FormLabel>
            <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: 200, overflow: 'auto', backgroundColor: 'action.disabledBackground' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.875rem' }}>
                {settings.customMappingRules.length > 0 ? JSON.stringify(settings.customMappingRules, null, 2) : 'No custom rules defined.'}
              </pre>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
           <Button
            type="button"
            onClick={handleReset}
            disabled={isSaving || !isChanged || hasFieldErrors}
          >
            Reset Changes
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving || !isChanged || hasFieldErrors}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSaving ? 'Saving...' : 'Save AI Settings'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default AISettingsForm;
