import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const FallbackOwnerModal = ({
  open,
  onClose,
  onConfirm,
  fallbackInfo,
  userProfile,
  fileName,
  isProcessing = false
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showDetails, setShowDetails] = useState(false);

  if (!fallbackInfo || !userProfile) {
    return null;
  }

  const { count, fallback_owner_id, affected_indices } = fallbackInfo;
  const userName = userProfile.name || userProfile.display_name || userProfile.username || 'Current User';

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={!isProcessing ? onClose : undefined}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown={isProcessing}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6" component="span">
            {t('assign.fallbackModal.title')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>
              {t('assign.fallbackModal.warningMessage', { count, fileName }, { count })}
            </strong>
          </Typography>
          <Typography variant="body2">
            {t('assign.fallbackModal.description')}
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            {t('assign.fallbackModal.fallbackOwnerTitle')}
          </Typography>

          <Box sx={{
            p: 2,
            bgcolor: 'primary.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'primary.200'
          }}>
            <Typography variant="body1" gutterBottom>
              <strong>{t('assign.fallbackModal.assignedTo')}</strong> {userName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('assign.fallbackModal.salesforceUserId')} {fallback_owner_id}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon color="secondary" />
            {t('assign.fallbackModal.impactSummary')}
          </Typography>

          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            <Chip
              label={t('assign.fallbackModal.unassignedLeads', { count }, { count })}
              color="warning"
              variant="outlined"
            />
            <Chip
              label={t('assign.fallbackModal.autoAssignment')}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        {affected_indices && affected_indices.length > 0 && (
          <Accordion
            expanded={showDetails}
            onChange={(e, expanded) => setShowDetails(expanded)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" color="text.secondary">
                {showDetails
                  ? t('assign.fallbackModal.hideDetails')
                  : t('assign.fallbackModal.showDetails')
                } ({affected_indices.length} {t('common.records').toLowerCase()})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom>
                {t('assign.fallbackModal.leadIndices')}
              </Typography>
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {affected_indices.slice(0, 20).map((index, i) => (
                  <ListItem key={i} divider={i < Math.min(affected_indices.length, 20) - 1}>
                    <ListItemText
                      primary={`${t('common.records')} ${index + 1}`}
                      secondary={t('assign.fallbackModal.assignedTo') + ' ' + userName}
                    />
                  </ListItem>
                ))}
                {affected_indices.length > 20 && (
                  <ListItem>
                    <ListItemText
                      primary={`... ${t('common.and')} ${affected_indices.length - 20} ${t('common.more')} ${t('common.records').toLowerCase()}`}
                      secondary={t('assign.fallbackModal.assignedTo') + ' ' + userName}
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>{t('assign.fallbackModal.nextSteps.title')}</strong>
          </Typography>
          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
            • {t('assign.fallbackModal.nextSteps.csvFile')}<br/>
            • {t('assign.fallbackModal.nextSteps.salesforceUpload')}<br/>
            • {t('assign.fallbackModal.nextSteps.reassignment')}
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleCancel}
          disabled={isProcessing}
          color="inherit"
        >
          {t('assign.fallbackModal.buttons.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} /> : <AssignmentIcon />}
        >
          {isProcessing
            ? t('assign.fallbackModal.buttons.processing')
            : t('assign.fallbackModal.buttons.assign', { count }, { count })
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FallbackOwnerModal;
