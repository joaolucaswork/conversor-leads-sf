import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { styled } from '@mui/material/styles';

const StyledDropzonePaper = styled(Paper)(({ theme, isDragActive, hasError }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  border: `2px dashed ${hasError ? theme.palette.error.main : (isDragActive ? theme.palette.primary.main : theme.palette.divider)}`,
  backgroundColor: isDragActive ? theme.palette.action.hover : theme.palette.background.paper,
  transition: 'border .24s ease-in-out, background-color .24s ease-in-out',
  minHeight: 150,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}));

const acceptedFileTypes = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
};
const maxFileSize = 10 * 1024 * 1024; // 10MB

const FileUpload = ({ onFileUpload, isUploading, uploadProgress, uploadError, uploadSuccessMessage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

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
    noClick: true, // Disable opening file dialog on click of dropzone, use button instead
    noKeyboard: true,
  });

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
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
        <InsertDriveFileIcon sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
        {isDragActive ? (
          <Typography>Drop the file here ...</Typography>
        ) : (
          <Typography>Drag & drop a file here, or click the button below</Typography>
        )}
        <Button variant="outlined" onClick={open} sx={{ mt: 2 }}>
          Select File
        </Button>
      </StyledDropzonePaper>

      {fileError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {fileError}
        </Alert>
      )}

      {selectedFile && !uploadSuccessMessage && (
        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1">Selected File:</Typography>
          <Typography variant="body2">Name: {selectedFile.name}</Typography>
          <Typography variant="body2">Size: {(selectedFile.size / 1024).toFixed(2)} KB</Typography>
          <Typography variant="body2">Type: {selectedFile.type || 'N/A'}</Typography>
          {!isUploading && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" color="primary" onClick={handleUpload} disabled={isUploading}>
                Upload File
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleRemoveFile} disabled={isUploading}>
                Remove
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">Uploading: {uploadProgress.toFixed(2)}%</Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {uploadError && (
         <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
          Upload Failed: {uploadError}
        </Alert>
      )}

      {uploadSuccessMessage && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
          {uploadSuccessMessage}
          <Button onClick={handleRemoveFile} size="small" sx={{ ml: 2 }}>Upload Another File</Button>
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;
