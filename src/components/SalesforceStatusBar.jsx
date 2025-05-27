import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Paper,
  Button,
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Refresh as RefreshIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import { isElectron } from '../utils/environment';

const SalesforceStatusBar = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const {
    isAuthenticated,
    accessToken,
    instanceUrl,
    userInfo,
    userProfile,
    lastFileUpload,
    isLoading,
    error,
    ensureValidToken,
  } = useAuthStore();

  // Update last sync time when authentication state changes
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      setLastSyncTime(new Date());
    }
  }, [isAuthenticated, accessToken]);

  const handleRefresh = async () => {
    try {
      await ensureValidToken();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Failed to refresh Salesforce connection:', error);
    }
  };

  const handleNavigateToSalesforce = () => {
    navigate('/salesforce');
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getConnectionStatus = () => {
    if (isLoading) {
      return {
        status: 'loading',
        icon: <CloudIcon />,
        color: 'default',
        label: t('salesforce.connecting', { defaultValue: 'Connecting...' }),
      };
    }

    if (error) {
      return {
        status: 'error',
        icon: <ErrorIcon />,
        color: 'error',
        label: t('salesforce.connectionError', { defaultValue: 'Connection Error' }),
      };
    }

    if (isAuthenticated && accessToken) {
      return {
        status: 'connected',
        icon: <CheckCircleIcon />,
        color: 'success',
        label: t('salesforce.connected', { defaultValue: 'Connected' }),
      };
    }

    return {
      status: 'disconnected',
      icon: <CloudOffIcon />,
      color: 'warning',
      label: t('salesforce.disconnected', { defaultValue: 'Not Connected' }),
    };
  };

  const connectionStatus = getConnectionStatus();

  const formatLastSync = () => {
    if (!lastSyncTime) return t('salesforce.neverSynced', { defaultValue: 'Never' });
    try {
      return format(lastSyncTime, 'HH:mm:ss');
    } catch {
      return 'Invalid';
    }
  };

  const getInstanceName = () => {
    if (!instanceUrl) return '';
    try {
      const url = new URL(instanceUrl);
      return url.hostname.split('.')[0];
    } catch {
      return instanceUrl;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return t('profile.never', { defaultValue: 'Never' });
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  const getDisplayName = () => {
    return userProfile?.name || userInfo?.display_name || userInfo?.username || t('profile.unknownUser', { defaultValue: 'Unknown User' });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderRadius: 0,
      }}
    >
      {/* Main Status Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          minHeight: 48,
          cursor: 'pointer',
        }}
        onClick={handleToggleExpanded}
      >
        {/* Left Section - Connection Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={connectionStatus.icon}
            label={connectionStatus.label}
            color={connectionStatus.color}
            size="small"
            variant="outlined"
          />

          {isAuthenticated && instanceUrl && (
            <Typography variant="caption" color="text.secondary">
              {getInstanceName()}
            </Typography>
          )}
        </Box>

        {/* Center Section - User Info (Desktop only) */}
        {!isMobile && isAuthenticated && (userInfo || userProfile) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={userProfile?.picture}
              sx={{ width: 24, height: 24 }}
            >
              {getInitials(getDisplayName())}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {getDisplayName()}
            </Typography>
          </Box>
        )}

        {/* Right Section - Actions and Last Sync */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastSyncTime && (
            <Typography variant="caption" color="text.secondary">
              {t('salesforce.lastSync', { defaultValue: 'Last sync:' })} {formatLastSync()}
            </Typography>
          )}

          <Tooltip title={t('salesforce.refresh', { defaultValue: 'Refresh Connection' })}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={isLoading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('salesforce.settings', { defaultValue: 'Salesforce Settings' })}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToSalesforce();
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <IconButton size="small">
            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded Details */}
      <Collapse in={isExpanded}>
        <Box
          sx={{
            px: 2,
            pb: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mt: 1 }}>
            {/* Connection Details */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('salesforce.connectionDetails', { defaultValue: 'Connection Details' })}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                {t('salesforce.status')}: {connectionStatus.label}
              </Typography>
              {instanceUrl && (
                <Typography variant="caption" display="block" color="text.secondary">
                  {t('salesforce.instanceUrl')}: {instanceUrl}
                </Typography>
              )}
              {isAuthenticated && (
                <Typography variant="caption" display="block" color="text.secondary">
                  {t('salesforce.apiVersion')}: v58.0
                </Typography>
              )}

              {/* Activity Timestamps */}
              {isAuthenticated && (
                <>
                  {lastSyncTime && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {t('profile.loginTime', { defaultValue: 'Login time' })}: {formatTimestamp(lastSyncTime)}
                      </Typography>
                    </Box>
                  )}

                  {lastFileUpload && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <CloudUploadIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {t('profile.lastUpload', { defaultValue: 'Last upload' })}: {formatTimestamp(lastFileUpload)}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>



            {/* Actions */}
            <Box sx={{ flex: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleNavigateToSalesforce}
                startIcon={<SettingsIcon />}
              >
                {t('salesforce.manage', { defaultValue: 'Manage' })}
              </Button>
              {!isAuthenticated && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleNavigateToSalesforce}
                  startIcon={<CloudIcon />}
                >
                  {t('salesforce.connect', { defaultValue: 'Connect' })}
                </Button>
              )}
            </Box>
          </Box>

          {/* Error Display */}
          {error && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="error">
                {t('salesforce.error')}: {typeof error === 'object' ? JSON.stringify(error) : error}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SalesforceStatusBar;
