import React from 'react';
import { Snackbar, Alert, Stack, Box, Typography, Paper, Chip } from '@mui/material';
import {
  Download as DownloadIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useNotificationStore } from '../store/notificationStore';

/**
 * Global notification component that displays notifications from the notification store
 * Features horizontal layout, application-consistent styling, and responsive design
 */
const GlobalNotifications = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { notifications, removeNotification } = useNotificationStore();

  const getIcon = (type, iconType) => {
    // If specific icon type is provided, use it
    if (iconType === 'download') {
      return <DownloadIcon fontSize="small" sx={{ color: theme.palette.success.main }} />;
    }
    if (iconType === 'error') {
      return <ErrorIcon fontSize="small" sx={{ color: theme.palette.error.main }} />;
    }

    // Default icons based on notification type
    switch (type) {
      case 'success':
        return <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />;
      case 'error':
        return <ErrorIcon fontSize="small" sx={{ color: theme.palette.error.main }} />;
      case 'warning':
        return <WarningIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />;
      case 'info':
      default:
        return <InfoIcon fontSize="small" sx={{ color: theme.palette.info.main }} />;
    }
  };

  const handleClose = (notificationId) => {
    removeNotification(notificationId);
  };

  const renderNotification = (notification) => {
    const isSuccess = notification.type === 'success';
    const isDownload = notification.icon === 'download';

    if (isSuccess && isDownload) {
      // Compact chip-style notification for successful downloads
      return (
        <Chip
          key={notification.id}
          icon={getIcon(notification.type, notification.icon)}
          label={t('notifications.download.completed')}
          onClick={() => handleClose(notification.id)}
          onDelete={() => handleClose(notification.id)}
          variant="filled"
          sx={{
            backgroundColor: '#424242', // Cinza escuro
            borderColor: 'transparent',
            color: '#ffffff', // Texto branco
            cursor: 'pointer',
            transition: 'all 0.24s ease-in-out',
            border: 'none',
            '& .MuiChip-label': {
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#ffffff', // Texto branco
            },
            '& .MuiChip-deleteIcon': {
              color: '#ffffff', // Ícone de fechar branco
              '&:hover': {
                color: '#e0e0e0', // Cinza claro no hover
              }
            },
            '&:hover': {
              backgroundColor: '#616161', // Cinza um pouco mais claro no hover
            },
            '@media (max-width: 600px)': {
              '& .MuiChip-label': {
                fontSize: '0.8125rem',
              }
            }
          }}
        />
      );
    } else {
      // Standard Alert notification for errors and other types
      return (
        <Alert
          key={notification.id}
          onClose={() => handleClose(notification.id)}
          severity={notification.type}
          icon={getIcon(notification.type, notification.icon)}
          variant="filled"
          sx={{
            minWidth: 280,
            maxWidth: 400,
            backgroundColor: theme.palette[notification.type]?.main,
            color: theme.palette[notification.type]?.contrastText,
            borderRadius: theme.spacing(1),
            boxShadow: theme.shadows[3],
            '& .MuiAlert-message': {
              fontSize: '0.875rem',
              fontWeight: 400,
              wordBreak: 'break-word',
              '@media (max-width: 600px)': {
                fontSize: '0.8125rem',
              }
            },
            '& .MuiAlert-icon': {
              fontSize: '1.25rem',
            },
            '& .MuiAlert-action': {
              paddingTop: 0,
            },
            '@media (max-width: 600px)': {
              minWidth: 240,
              maxWidth: 320,
            }
          }}
        >
          {notification.message}
        </Alert>
      );
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: theme.spacing(3),
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: theme.zIndex.snackbar,
        pointerEvents: 'none',
        maxWidth: '90vw',
        '@media (max-width: 600px)': {
          bottom: theme.spacing(2),
          maxWidth: '95vw',
        }
      }}
    >
      <Stack
        direction="row"
        spacing={theme.spacing(1.5)}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: theme.spacing(1),
          '& > *': {
            pointerEvents: 'auto',
          },
          '@media (max-width: 600px)': {
            gap: theme.spacing(0.75),
            spacing: theme.spacing(1),
          }
        }}
      >
        {notifications.map((notification) => renderNotification(notification))}
      </Stack>
    </Box>
  );
};

export default GlobalNotifications;
