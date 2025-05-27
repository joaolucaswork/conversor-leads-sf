import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, CircularProgress, Alert, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { format } from 'date-fns'; // For date formatting

const getLogLevelColor = (level) => {
  switch (level?.toUpperCase()) {
    case 'ERROR':
      return 'error.main';
    case 'WARN':
    case 'WARNING':
      return 'warning.main';
    case 'INFO':
      return 'info.main';
    case 'DEBUG':
      return 'text.secondary';
    default:
      return 'text.primary';
  }
};

const LogViewerModal = ({ open, onClose, logs, isLoading, error, processingId }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle>
        {t('history.logsTitle', { defaultValue: 'Processing Logs for Job ID: {{processingId}}', processingId: processingId || 'N/A' })}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>{t('history.loadingLogs', { defaultValue: 'Loading logs...' })}</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
            {error}
          </Alert>
        )}
        {!isLoading && !error && (!logs || logs.length === 0) && (
          <Typography sx={{ textAlign: 'center', fontStyle: 'italic', mt: 2 }}>
            {t('history.noLogs', { defaultValue: 'No logs available for this processing job.' })}
          </Typography>
        )}
        {!isLoading && !error && logs && logs.length > 0 && (
          <Paper variant="outlined" sx={{ maxHeight: '60vh', overflow: 'auto' }}> {/* Ensure scrollability */}
            <TableContainer>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '200px', fontWeight: 'bold' }}>{t('history.timestamp', { defaultValue: 'Timestamp' })}</TableCell>
                    <TableCell sx={{ width: '100px', fontWeight: 'bold' }}>{t('history.level', { defaultValue: 'Level' })}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('history.message', { defaultValue: 'Message' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow hover key={index}>
                      <TableCell component="th" scope="row">
                        {log.timestamp ? format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" component="span" sx={{ color: getLogLevelColor(log.level), fontWeight: 'bold' }}>
                          {log.level?.toUpperCase() || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogViewerModal;
