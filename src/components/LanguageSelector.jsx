import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Chip
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useLanguageStore, LANGUAGES } from '../store/languageStore';

const LanguageSelector = () => {
  const { t } = useTranslation();
  const {
    currentLanguage,
    isLoading,
    error,
    setLanguage,
    getCurrentLanguageInfo,
    clearError
  } = useLanguageStore();

  const [localError, setLocalError] = useState('');

  const handleLanguageChange = async (event) => {
    const newLanguage = event.target.value;
    setLocalError('');
    clearError();

    try {
      await setLanguage(newLanguage);
      // Show success message briefly
      setTimeout(() => {
        // The success message will be shown in the new language
        console.log(t('settings.language.changeSuccess', { 
          language: LANGUAGES[newLanguage].nativeName 
        }));
      }, 100);
    } catch (err) {
      setLocalError(t('settings.language.changeError', { error: err.message }));
    }
  };

  const currentLangInfo = getCurrentLanguageInfo();

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2">
          {t('settings.language.title')}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('settings.language.description')}
      </Typography>

      {/* Current Language Display */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {t('settings.language.current', { language: currentLangInfo.nativeName })}
        </Typography>
        <Chip
          label={`${currentLangInfo.flag} ${currentLangInfo.nativeName}`}
          color="primary"
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Language Selector */}
      <FormControl fullWidth disabled={isLoading}>
        <InputLabel id="language-select-label">
          {t('settings.language.select')}
        </InputLabel>
        <Select
          labelId="language-select-label"
          id="language-select"
          value={currentLanguage}
          label={t('settings.language.select')}
          onChange={handleLanguageChange}
          startAdornment={isLoading && (
            <CircularProgress size={20} sx={{ mr: 1 }} />
          )}
        >
          {Object.values(LANGUAGES).map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
                {lang.code !== lang.nativeName.toLowerCase().slice(0, 2) && (
                  <Typography variant="caption" color="text.secondary">
                    ({lang.name})
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Error Display */}
      {(error || localError) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {localError || error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {t('common.loading')}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default LanguageSelector;
