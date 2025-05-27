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
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  const checkForKeyPresence = async () => {
    try {
      // Use the dedicated OpenAI API key function if available, fallback to general store
      const storedKey = window.electronAPI.getOpenAIApiKey
        ? await window.electronAPI.getOpenAIApiKey()
        : await window.electronAPI.getStoreValue('openai_api_key');
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
      // Check if we're in browser mode
      if (!window.electronAPI || (!window.electronAPI.setOpenAIApiKey && !window.electronAPI.setStoreValue)) {
        throw new Error('API key storage is not available in browser mode. Please use the Electron desktop application.');
      }

      // Use the dedicated OpenAI API key function if available, fallback to general store
      if (window.electronAPI.setOpenAIApiKey) {
        await window.electronAPI.setOpenAIApiKey(apiKey.trim());
      } else {
        await window.electronAPI.setStoreValue('openai_api_key', apiKey.trim());
      }

      setSuccess('OpenAI API Key saved successfully!');
      setApiKey(''); // Clear the input field
      setFieldError(''); // Clear field error on successful save
      setIsKeySet(true);
      if (onKeySaved) {
        onKeySaved();
      }
    } catch (err) {
      console.error('Error saving OpenAI API key:', err);
      setGeneralError(err.message || 'Failed to save API Key. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearKey = async () => {
    setGeneralError('');
    setFieldError('');
    setSuccess('');
    setTestResult('');
    setIsLoading(true);
    try {
      // Use the dedicated OpenAI API key function if available, fallback to general store
      if (window.electronAPI.setOpenAIApiKey) {
        await window.electronAPI.setOpenAIApiKey(null);
      } else {
        await window.electronAPI.setStoreValue('openai_api_key', null);
      }
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

  const handleTestApiKey = async () => {
    setIsTesting(true);
    setTestResult('');
    setGeneralError('');

    try {
      // Check if we're in browser mode
      if (!window.electronAPI || !window.electronAPI.executePythonScript) {
        throw new Error('API key testing is not available in browser mode. Please use the Electron desktop application.');
      }

      // Execute a simple Python script to test the OpenAI API key
      const result = await window.electronAPI.executePythonScript(
        'tests/test_openai_connection.py',
        [],
        {}
      );

      if (result.success) {
        if (result.stdout.includes('[SUCCESS] OpenAI API connection successful')) {
          setTestResult('✅ OpenAI API Key is working correctly!');
        } else if (result.stdout.includes('[WARNING] OpenAI API key not found')) {
          setTestResult('⚠️ No API key found. Please save your API key first.');
        } else if (result.stdout.includes('[ERROR] OpenAI package not installed')) {
          setTestResult('❌ OpenAI package not installed. Please run: pip install openai');
        } else if (result.stdout.includes('[ERROR] OpenAI API authentication failed')) {
          setTestResult('❌ API key is invalid. Please check your OpenAI API key.');
        } else if (result.stdout.includes('[WARNING] OpenAI API rate limit exceeded')) {
          setTestResult('⚠️ API key is valid but rate limited. Try again later.');
        } else {
          setTestResult('⚠️ API key test completed but with unexpected results. Check console for details.');
          console.log('Test output:', result.stdout);
          console.log('Test stderr:', result.stderr);
        }
      } else {
        // Handle failed test cases
        if (result.stdout && result.stdout.includes('❌')) {
          // Extract the error message from stdout
          const lines = result.stdout.split('\n');
          const errorLine = lines.find(line => line.includes('❌'));
          setTestResult(errorLine || '❌ API key test failed');
        } else if (result.error && result.error.includes('Python script not found')) {
          setTestResult('❌ Test script not found. Please ensure the application is properly installed.');
        } else if (result.error && result.error.includes('Python interpreter not found')) {
          setTestResult('❌ Python not found. Please install Python and ensure it\'s in your PATH.');
        } else {
          setTestResult('❌ API key test failed. Check console for details.');
          console.log('Test failed:', result);
        }
      }
    } catch (err) {
      console.error('Error testing OpenAI API key:', err);
      setGeneralError(err.message || 'Failed to test API Key. Check console for details.');
    } finally {
      setIsTesting(false);
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1, flexWrap: 'wrap' }}>
        {isKeySet && (
          <>
            <Button
              onClick={handleClearKey}
              disabled={isLoading}
              color="warning"
            >
              Clear Stored Key
            </Button>
            <Button
              onClick={handleTestApiKey}
              disabled={isTesting || isLoading}
              color="info"
              variant="outlined"
            >
              {isTesting ? 'Testing...' : 'Test Key'}
            </Button>
          </>
        )}
        <Button
          onClick={handleSaveKey}
          variant="contained"
          disabled={isLoading || !!fieldError || !apiKey.trim()} // Disable if field error or empty
        >
          {isLoading ? 'Saving...' : 'Save API Key'}
        </Button>
      </Box>

      {/* Test Result Display */}
      {testResult && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={testResult.includes('✅') ? 'success' : 'warning'}>
            {testResult}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default OpenAIApiKeyForm;
