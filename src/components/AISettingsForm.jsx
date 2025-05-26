import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField, Button, Typography, Box, CircularProgress, Alert,
  Paper, Slider, FormLabel, Grid
} from '@mui/material';
import { getAiSettings as getSettingsService, updateAiSettings as updateSettingsService } from '../services/apiService';

const AISettingsForm = () => {
  const [settings, setSettings] = useState({
    aiEnabled: true, // Assuming this might be part of settings
    defaultModelPreference: '', // Changed from modelPreference to match API contract
    confidenceThresholdForAutoMapping: 0.75, // Changed from confidenceThreshold
    customMappingRules: [],
    aiProvider: 'openai' // Assuming this might be part of settings
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

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setGeneralError(null);
    setSuccess('');
    setFieldErrors({});
    try {
      const data = await getSettingsService();
      // Ensure all expected fields are present, provide defaults if not
      const fullData = {
        aiEnabled: data.aiEnabled !== undefined ? data.aiEnabled : true,
        defaultModelPreference: data.defaultModelPreference || '',
        confidenceThresholdForAutoMapping: data.confidenceThresholdForAutoMapping !== undefined ? data.confidenceThresholdForAutoMapping : 0.75,
        customMappingRules: data.customMappingRules || [],
        aiProvider: data.aiProvider || 'openai',
        availableModels: data.availableModels || ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"] // Add availableModels
      };
      setSettings(fullData);
      setInitialSettings(JSON.parse(JSON.stringify(fullData)));
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      setGeneralError(err.message || 'Failed to fetch AI settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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
      // Construct payload based on what's editable and expected by backend
      const payload = {
        aiEnabled: settings.aiEnabled,
        defaultModelPreference: settings.defaultModelPreference,
        confidenceThresholdForAutoMapping: settings.confidenceThresholdForAutoMapping,
        // customMappingRules are read-only for now, so send initial ones or don't send if backend merges
        customMappingRules: initialSettings.customMappingRules, 
        aiProvider: settings.aiProvider, // If this is editable
      };
      const updatedData = await updateSettingsService(payload);
      const fullUpdatedData = { // ensure consistency
        aiEnabled: updatedData.aiEnabled !== undefined ? updatedData.aiEnabled : true,
        defaultModelPreference: updatedData.defaultModelPreference || '',
        confidenceThresholdForAutoMapping: updatedData.confidenceThresholdForAutoMapping !== undefined ? updatedData.confidenceThresholdForAutoMapping : 0.75,
        customMappingRules: updatedData.customMappingRules || [],
        aiProvider: updatedData.aiProvider || 'openai',
        availableModels: updatedData.availableModels || settings.availableModels
      };
      setSettings(fullUpdatedData);
      setInitialSettings(JSON.parse(JSON.stringify(fullUpdatedData)));
      setFieldErrors({}); // Clear field errors on successful save
      setSuccess('AI settings updated successfully!');
    } catch (err) {
      console.error('Error updating AI settings:', err);
      setGeneralError(err.message || 'Failed to update AI settings.');
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
          {/* AI Enabled Switch - Assuming boolean */}
          {/* <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={settings.aiEnabled} onChange={handleChange} name="aiEnabled" />}
              label="Enable AI Processing"
            />
          </Grid> */}
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Default AI Model Preference"
              name="defaultModelPreference"
              value={settings.defaultModelPreference}
              onChange={handleChange}
              error={!!fieldErrors.defaultModelPreference}
              helperText={fieldErrors.defaultModelPreference || "e.g., gpt-4, gpt-3.5-turbo. Check backend for available models."}
              margin="normal"
              required // Visually indicate it's required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom sx={{ mt: 2 }}>
              Confidence Threshold for Auto-Mapping: {(settings.confidenceThresholdForAutoMapping * 100).toFixed(0)}%
            </Typography>
            <Slider
              name="confidenceThresholdForAutoMapping"
              value={settings.confidenceThresholdForAutoMapping}
              onChange={(e, val) => handleSliderChange('confidenceThresholdForAutoMapping', val)}
              aria-labelledby="confidence-threshold-slider"
              valueLabelDisplay="auto"
              step={0.01}
              marks={[
                { value: 0.5, label: '50%' },
                { value: 0.75, label: '75%' },
                { value: 1.0, label: '100%' },
              ]}
              min={0.5}
              max={1.0}
              sx={{mt:1}}
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
