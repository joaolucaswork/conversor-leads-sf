import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField, Button, Typography, Box, CircularProgress, Alert,
  Paper, Switch, FormControlLabel, FormLabel, Grid
} from '@mui/material';
import { 
  getLeadDistributionSettings as getSettingsService, 
  updateLeadDistributionSettings as updateSettingsService 
} from '../services/apiService';

const LeadDistributionSettingsForm = () => {
  const [settings, setSettings] = useState({
    distributionEnabled: true, // Added based on API contract
    defaultAssignee: { type: 'Queue', id: '' }, // Updated to match API contract
    roundRobin: { enabled: true, userPool: [] }, // Updated to match API contract
    rules: [], 
  });
  const [initialSettings, setInitialSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState(null); // For API call errors
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // For field-specific validation

  const validateField = (name, value, currentSettings) => {
    let newFieldErrors = { ...fieldErrors };
    if (name === 'defaultAssignee.id') {
      if (currentSettings.distributionEnabled && !value.trim()) {
        newFieldErrors.defaultAssigneeId = 'Default Assignee ID cannot be empty when distribution is enabled.';
      } else {
        delete newFieldErrors.defaultAssigneeId;
      }
    }
    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0; // Return true if no errors
  };
  
  const validateAllFields = (currentSettings) => {
    let newFieldErrors = {};
    if (currentSettings.distributionEnabled && !currentSettings.defaultAssignee.id.trim()) {
      newFieldErrors.defaultAssigneeId = 'Default Assignee ID cannot be empty when distribution is enabled.';
    }
    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0;
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
        distributionEnabled: data.distributionEnabled !== undefined ? data.distributionEnabled : true,
        defaultAssignee: data.defaultAssignee || { type: 'Queue', id: '' },
        roundRobin: data.roundRobin || { enabled: true, userPool: [] },
        rules: data.rules || [],
      };
      setSettings(fullData);
      setInitialSettings(JSON.parse(JSON.stringify(fullData)));
    } catch (err) {
      console.error('Error fetching Lead Distribution settings:', err);
      setGeneralError(err.message || 'Failed to fetch Lead Distribution settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    let newSettings = { ...settings };

    if (name === 'distributionEnabled') {
      newSettings.distributionEnabled = checked;
      // Re-validate defaultAssignee.id when distributionEnabled changes
      validateField('defaultAssignee.id', newSettings.defaultAssignee.id, newSettings);
    } else if (name === 'roundRobin.enabled') { // Corrected name
      newSettings.roundRobin = { ...newSettings.roundRobin, enabled: checked };
    } else if (name === 'defaultAssignee.id') {
      newSettings.defaultAssignee = { ...newSettings.defaultAssignee, id: value };
      validateField('defaultAssignee.id', value, newSettings);
    } else if (name === 'defaultAssignee.type') {
      newSettings.defaultAssignee = { ...newSettings.defaultAssignee, type: value };
    } else {
      newSettings[name] = type === 'checkbox' ? checked : value;
    }
    
    setSettings(newSettings);
    setSuccess('');
    setGeneralError(null); // Clear general error on field change
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

    if (!validateAllFields(settings)) {
      return; // Stop submission if validation fails
    }

    setIsSaving(true);
    setGeneralError(null);
    setSuccess('');
    try {
      // Construct payload based on what's editable and expected by backend
      // For rules, send the original ones as they are read-only for now
      const payload = {
        distributionEnabled: settings.distributionEnabled,
        defaultAssignee: settings.defaultAssignee,
        roundRobin: settings.roundRobin,
        rules: initialSettings.rules, // Send back original rules
      };
      const updatedData = await updateSettingsService(payload);
      const fullUpdatedData = { // ensure consistency
        distributionEnabled: updatedData.distributionEnabled !== undefined ? updatedData.distributionEnabled : true,
        defaultAssignee: updatedData.defaultAssignee || { type: 'Queue', id: '' },
        roundRobin: updatedData.roundRobin || { enabled: true, userPool: [] },
        rules: updatedData.rules || [],
      };
      setSettings(fullUpdatedData);
      setInitialSettings(JSON.parse(JSON.stringify(fullUpdatedData)));
      setFieldErrors({}); // Clear field errors on successful save
      setSuccess('Lead Distribution settings updated successfully!');
    } catch (err) {
      console.error('Error updating Lead Distribution settings:', err);
      setGeneralError(err.message || 'Failed to update Lead Distribution settings.');
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
        <Typography sx={{ ml: 2 }}>Loading Lead Distribution settings...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom component="div">
        Lead Distribution Configuration
      </Typography>
      <form onSubmit={handleSubmit}>
        {generalError && <Alert severity="error" sx={{ mb: 2 }}>{generalError}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.distributionEnabled} 
                  onChange={handleChange} 
                  name="distributionEnabled" 
                />
              }
              label="Enable Lead Distribution"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Default Assignee ID (User or Queue ID)"
              name="defaultAssignee.id"
              value={settings.defaultAssignee.id}
              onChange={handleChange}
              error={!!fieldErrors.defaultAssigneeId}
              helperText={fieldErrors.defaultAssigneeId || "Salesforce User ID or Queue ID for default assignment."}
              margin="normal"
              disabled={!settings.distributionEnabled}
              required={settings.distributionEnabled} // Visually indicate if enabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
             <TextField
              fullWidth
              label="Default Assignee Type"
              name="defaultAssignee.type"
              value={settings.defaultAssignee.type}
              onChange={handleChange}
              select
              SelectProps={{ native: true }}
              helperText="Type of the default assignee."
              margin="normal"
              disabled={!settings.distributionEnabled}
            >
              <option value="User">User</option>
              <option value="Queue">Queue</option>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.roundRobin.enabled} 
                  onChange={handleChange} 
                  name="roundRobin.enabled" 
                />
              }
              label="Enable Round Robin Assignment"
              disabled={!settings.distributionEnabled}
            />
             <Typography variant="body2" color="text.secondary" sx={{ml: 4, mt: -1}}>
                User Pool for Round Robin (read-only): {settings.roundRobin.userPool.join(', ') || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormLabel component="legend" sx={{ mt: 2 }}>Assignment Rules (Read-only)</FormLabel>
            <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: 200, overflow: 'auto', backgroundColor: 'action.disabledBackground' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.875rem' }}>
                {settings.rules.length > 0 ? JSON.stringify(settings.rules, null, 2) : 'No assignment rules defined.'}
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
            disabled={isSaving || !isChanged || !settings.distributionEnabled || hasFieldErrors}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSaving ? 'Saving...' : 'Save Lead Distribution Settings'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default LeadDistributionSettingsForm;
