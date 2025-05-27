import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import LottieFileIcon from './LottieFileIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PsychologyIcon from '@mui/icons-material/Psychology';
import GavelIcon from '@mui/icons-material/Gavel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InfoIcon from '@mui/icons-material/Info';
import { styled } from '@mui/material/styles';
import { useSettingsStore } from '../store/settingsStore';

const StyledDropzonePaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDragActive' && prop !== 'hasError',
})(({ theme, isDragActive, hasError }) => ({
  padding: theme.spacing(4, 3),
  textAlign: 'center',
  border: `2px dashed ${hasError ? theme.palette.error.main : (isDragActive ? theme.palette.primary.main : theme.palette.divider)}`,
  backgroundColor: isDragActive ? theme.palette.action.hover : theme.palette.background.paper,
  transition: 'border .24s ease-in-out, background-color .24s ease-in-out',
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  borderRadius: theme.spacing(2),
  '&:hover': {
    borderColor: isDragActive ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: theme.palette.action.hover,
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: 180,
    padding: theme.spacing(3, 2),
  },
}));

const acceptedFileTypes = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
};
const maxFileSize = 10 * 1024 * 1024; // 10MB

const FileUpload = ({ onFileUpload, isUploading, uploadProgress, uploadError, uploadSuccessMessage }) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [useAiEnhancement, setUseAiEnhancement] = useState(true);

  // Get developer mode state
  const { developerMode } = useSettingsStore(state => ({
    developerMode: state.developerMode,
  }));

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setFileError('');
    setSelectedFile(null); // Clear previous selection

    if (rejectedFiles && rejectedFiles.length > 0) {
      const currentRejectedFile = rejectedFiles[0];
      if (currentRejectedFile.errors) {
        const anError = currentRejectedFile.errors[0];
        if (anError.code === 'file-too-large') {
          setFileError(`File is too large. Max size is ${maxFileSize / (1024*1024)}MB.`);
        } else if (anError.code === 'file-invalid-type') {
          setFileError('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
        } else {
          setFileError(anError.message);
        }
      }
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setFileError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    multiple: false, // Allow only single file upload
    noClick: false, // Enable clicking anywhere in the dropzone to open file dialog
    noKeyboard: false, // Enable keyboard navigation
  });

  const handleUpload = () => {
    if (selectedFile) {
      // In simplified mode (developer mode disabled), always use AI processing for best quality
      // but hide the complexity from the user. In developer mode, respect user's choice.
      const finalUseAi = developerMode ? useAiEnhancement : true;
      onFileUpload(selectedFile, { useAiEnhancement: finalUseAi });
    } else {
      setFileError('Please select a file to upload.');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError('');
    // Also reset any parent component state if needed, e.g. clear uploadError, uploadSuccessMessage
  };

  return (
    <Box sx={{ width: '100%' }}>
      <StyledDropzonePaper {...getRootProps()} isDragActive={isDragActive} hasError={!!fileError}>
        <input {...getInputProps()} />
        <LottieFileIcon
          size={isDragActive ? 80 : 72}
          isDragActive={isDragActive}
          sx={{ mb: { xs: 2, sm: 2.5 } }}
        />
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            fontWeight: { xs: 600, sm: 500 },
            textAlign: 'center',
            px: { xs: 2, sm: 1 },
            mb: { xs: 1, sm: 1.5 },
            color: isDragActive ? 'primary.main' : 'text.primary'
          }}
        >
          {isDragActive ? t('fileUpload.dropHere') : t('fileUpload.selectFile')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            textAlign: 'center',
            px: { xs: 2, sm: 1 },
            lineHeight: 1.5
          }}
        >
          {isDragActive
            ? t('fileUpload.releaseToUpload', { defaultValue: 'Solte o arquivo aqui para fazer upload' })
            : t('fileUpload.dragDropOrClick', { defaultValue: 'Arraste e solte seu arquivo aqui ou clique para selecionar' })
          }
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.75rem' },
            textAlign: 'center',
            mt: { xs: 1.5, sm: 2 },
            opacity: 0.8
          }}
        >
          Excel (.xlsx, .xls) ou CSV • Máx. 10MB
        </Typography>
      </StyledDropzonePaper>

      {fileError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {fileError}
        </Alert>
      )}

      {selectedFile && !uploadSuccessMessage && (
        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1">{t('fileUpload.selectedFile')}</Typography>
          <Typography variant="body2">{t('fileUpload.fileName')} {selectedFile.name}</Typography>
          <Typography variant="body2">{t('fileUpload.fileSize')} {(selectedFile.size / 1024).toFixed(2)} KB</Typography>
          <Typography variant="body2">{t('fileUpload.fileType')} {selectedFile.type || 'N/A'}</Typography>

          <Divider sx={{ my: 2 }} />

          {/* AI Enhancement Options - Only show in developer mode */}
          {developerMode && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <PsychologyIcon sx={{ mr: 1, fontSize: 20 }} />
                Processing Options
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={useAiEnhancement}
                    onChange={(e) => setUseAiEnhancement(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      AI-Enhanced Processing
                    </Typography>
                    <Tooltip title="Uses OpenAI GPT for intelligent field mapping and data validation. More accurate but uses API credits.">
                      <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                }
              />

              {/* Processing Mode Indicators */}
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {useAiEnhancement ? (
                  <>
                    <Chip
                      icon={<PsychologyIcon />}
                      label={t('fileUpload.aiEnhanced')}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<AttachMoneyIcon />}
                      label={t('fileUpload.costEstimate')}
                      color="warning"
                      size="small"
                      variant="outlined"
                    />
                  </>
                ) : (
                  <Chip
                    icon={<GavelIcon />}
                    label={t('fileUpload.ruleBased')}
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Processing Benefits */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {useAiEnhancement ? (
                    "✓ 90-95% mapping accuracy • ✓ Intelligent validation • ✓ Multi-language support"
                  ) : (
                    "✓ Fast processing • ✓ No API costs • ✓ Good for standard formats"
                  )}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Simplified processing info when developer mode is disabled */}
          {!developerMode && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <PsychologyIcon sx={{ mr: 1, fontSize: 20 }} />
                {t('fileUpload.processingMode')}
              </Typography>
              <Chip
                icon={<PsychologyIcon />}
                label={t('fileUpload.standardProcessing')}
                color="primary"
                size="small"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                ✓ {t('fileUpload.intelligentMapping')} • ✓ {t('fileUpload.highAccuracy')} • ✓ {t('fileUpload.optimizedResults')}
              </Typography>
            </Box>
          )}

          {!isUploading && (
            <Box sx={{
              mt: 2,
              display: 'flex',
              gap: { xs: 1.5, sm: 1 },
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={isUploading}
                startIcon={
                  developerMode
                    ? (useAiEnhancement ? <PsychologyIcon /> : <GavelIcon />)
                    : <PsychologyIcon />
                }
                sx={{
                  minHeight: { xs: 48, sm: 36 },
                  fontSize: { xs: '0.9375rem', sm: '0.875rem' },
                  fontWeight: { xs: 600, sm: 500 },
                  px: { xs: 3, sm: 2 },
                  flex: { xs: 1, sm: 'none' }
                }}
              >
                {developerMode
                  ? (useAiEnhancement ? t('fileUpload.processWithAI') : t('fileUpload.processRuleBased'))
                  : t('fileUpload.processLeads')
                }
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleRemoveFile}
                disabled={isUploading}
                sx={{
                  minHeight: { xs: 44, sm: 36 },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  px: { xs: 2, sm: 1.5 },
                  flex: { xs: 1, sm: 'none' }
                }}
              >
                {t('fileUpload.remove')}
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">{t('fileUpload.uploadProgress', { progress: uploadProgress.toFixed(2) })}</Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {uploadError && (
         <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
          {t('fileUpload.uploadError', { error: uploadError })}
        </Alert>
      )}

      {uploadSuccessMessage && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
          {uploadSuccessMessage}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;
