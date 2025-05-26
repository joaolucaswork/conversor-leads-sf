import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';

// For this component, we'll directly use window.electronAPI for simplicity.
// A settingsService.js could be created for larger applications.

const OpenAIApiKeyForm = ({ onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [fieldError, setFieldError] = useState(''); // For field-specific validation
  const [generalError, setGeneralError] = useState(''); // For API call errors
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeySet, setIsKeySet] = useState(false);

  const checkForKeyPresence = async () => {
    try {
      const storedKey = await window.electronAPI.getStoreValue('openai_api_key');
      setIsKeySet(!!storedKey);
    } catch (err) {
      console.error('Error checking for OpenAI API key presence:', err);
      // Don't set a visible error for this check, just log it
    }
  };

  useEffect(() => {
    checkForKeyPresence();
  }, []);

  const validateApiKey = (key) => {
    if (!key.trim()) {
      setFieldError('API Key cannot be empty.');
      return false;
    }
    // Optional: Basic pattern check if desired, e.g., starts with 'sk-'
    // if (!key.startsWith('sk-')) {
    //   setFieldError('API Key should typically start with "sk-".');
    //   return false;
    // }
    setFieldError('');
    return true;
  };

  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    validateApiKey(newKey); // Validate on change
    setGeneralError(''); // Clear general errors when user types
    setSuccess('');
  };


  const handleSaveKey = async () => {
    if (!validateApiKey(apiKey)) { // Re-validate before save, though button should be disabled
      return;
    }
    setGeneralError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await window.electronAPI.setStoreValue('openai_api_key', apiKey.trim());
      setSuccess('OpenAI API Key saved successfully!');
      setApiKey(''); // Clear the input field
      setFieldError(''); // Clear field error on successful save
      setIsKeySet(true);
      if (onKeySaved) {
        onKeySaved();
      }
    } catch (err) {
      console.error('Error saving OpenAI API key:', err);
      setGeneralError('Failed to save API Key. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearKey = async () => {
    setGeneralError('');
    setFieldError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await window.electronAPI.setStoreValue('openai_api_key', null); // Or deleteStoreValue if implemented
      setSuccess('OpenAI API Key cleared successfully!');
      setIsKeySet(false);
      setApiKey('');
    } catch (err) {
      console.error('Error clearing OpenAI API key:', err);
      setGeneralError('Failed to clear API Key. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        OpenAI API Key Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        To enable AI-powered features, please enter your OpenAI API Key. You can find your API key at{' '}
        <Link href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener">
          https://platform.openai.com/account/api-keys
        </Link>.
      </Typography>

      {isKeySet && !success && ( // Show this only if key is set and no immediate success/error message
        <Alert severity="info" sx={{ mb: 2 }}>
          An OpenAI API Key is currently stored. You can enter a new key to replace it or clear the existing one.
        </Alert>
      )}

      {generalError && <Alert severity="error" sx={{ mb: 2 }}>{generalError}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TextField
        margin="normal"
        fullWidth
        id="openai-api-key"
        label="OpenAI API Key"
        name="openai-api-key"
        type="password"
        value={apiKey}
        onChange={handleApiKeyChange}
        error={!!fieldError}
        helperText={fieldError || "Your API key is stored securely and used only for OpenAI interactions."}
        autoComplete="off"
        disabled={isLoading}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        {isKeySet && (
          <Button 
            onClick={handleClearKey} 
            disabled={isLoading} 
            color="warning"
            sx={{ mr: 1 }}
          >
            Clear Stored Key
          </Button>
        )}
        <Button 
          onClick={handleSaveKey} 
          variant="contained" 
          disabled={isLoading || !!fieldError || !apiKey.trim()} // Disable if field error or empty
        >
          {isLoading ? 'Saving...' : 'Save API Key'}
        </Button>
      </Box>
    </Box>
  );
};

export default OpenAIApiKeyForm;
