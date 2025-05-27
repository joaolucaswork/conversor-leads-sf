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
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm')); // ≤480px
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

      // Trigger refresh of files and history by dispatching a custom event
      // This allows other components to listen and refresh their data
      window.dispatchEvent(new CustomEvent('salesforce-refresh-requested', {
        detail: { timestamp: new Date().toISOString() }
      }));
    } catch (error) {
      console.error('Failed to refresh Salesforce connection:', error);
    }
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
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
        color: 'default',
        label: t('salesforce.connectionError', { defaultValue: 'Connection Error' }),
      };
    }

    if (isAuthenticated && accessToken) {
      return {
        status: 'connected',
        icon: <CheckCircleIcon />,
        color: 'default',
        label: t('salesforce.connected', { defaultValue: 'Connected' }),
      };
    }

    return {
      status: 'disconnected',
      icon: <CloudOffIcon />,
      color: 'default',
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
          alignItems: isSmallMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isSmallMobile ? 'column' : 'row',
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.5, sm: 1 },
          minHeight: { xs: 'auto', sm: 48 },
          cursor: 'pointer',
          gap: isSmallMobile ? 1 : 0,
        }}
        onClick={handleToggleExpanded}
      >
        {/* Left Section - Connection Status */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 1 },
          width: isSmallMobile ? '100%' : 'auto',
          justifyContent: isSmallMobile ? 'space-between' : 'flex-start'
        }}>
          <Chip
            icon={connectionStatus.icon}
            label={connectionStatus.label}
            color={connectionStatus.color}
            size={isSmallMobile ? "medium" : "small"}
            variant="outlined"
            sx={{
              minHeight: { xs: 32, sm: 24 },
              fontSize: { xs: '0.875rem', sm: '0.8125rem' },
              '& .MuiChip-label': {
                fontSize: { xs: '0.875rem', sm: '0.8125rem' },
                px: { xs: 1.5, sm: 1 }
              }
            }}
          />

          {isAuthenticated && instanceUrl && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.75rem' },
                fontWeight: { xs: 500, sm: 400 }
              }}
            >
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
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 1 },
          width: isSmallMobile ? '100%' : 'auto',
          justifyContent: isSmallMobile ? 'space-between' : 'flex-end',
          flexDirection: isSmallMobile ? 'row' : 'row'
        }}>
          {/* Last Sync Info - Stack on mobile */}
          {lastSyncTime && (
            <Box sx={{
              display: 'flex',
              flexDirection: isSmallMobile ? 'column' : 'row',
              alignItems: isSmallMobile ? 'flex-start' : 'center',
              gap: isSmallMobile ? 0 : 1,
              flex: isSmallMobile ? 1 : 'none'
            }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.75rem' },
                  fontWeight: { xs: 500, sm: 400 },
                  lineHeight: { xs: 1.2, sm: 1 }
                }}
              >
                {isSmallMobile
                  ? `${t('salesforce.lastSync', { defaultValue: 'Last sync:' })}`
                  : `${t('salesforce.lastSync', { defaultValue: 'Last sync:' })} ${formatLastSync()}`
                }
              </Typography>
              {isSmallMobile && (
                <Typography
                  variant="caption"
                  color="text.primary"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {formatLastSync()}
                </Typography>
              )}
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={t('salesforce.refresh', { defaultValue: 'Refresh Connection' })}>
              <IconButton
                size={isSmallMobile ? "medium" : "small"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}
                disabled={isLoading}
                sx={{
                  minHeight: { xs: 44, sm: 32 },
                  minWidth: { xs: 44, sm: 32 }
                }}
              >
                <RefreshIcon fontSize={isSmallMobile ? "medium" : "small"} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t('navigation.settings', { defaultValue: 'Settings' })}>
              <IconButton
                size={isSmallMobile ? "medium" : "small"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateToSettings();
                }}
                sx={{
                  minHeight: { xs: 44, sm: 32 },
                  minWidth: { xs: 44, sm: 32 }
                }}
              >
                <SettingsIcon fontSize={isSmallMobile ? "medium" : "small"} />
              </IconButton>
            </Tooltip>

            <IconButton
              size={isSmallMobile ? "medium" : "small"}
              sx={{
                minHeight: { xs: 44, sm: 32 },
                minWidth: { xs: 44, sm: 32 }
              }}
            >
              {isExpanded ?
                <ExpandLessIcon fontSize={isSmallMobile ? "medium" : "small"} /> :
                <ExpandMoreIcon fontSize={isSmallMobile ? "medium" : "small"} />
              }
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Expanded Details */}
      <Collapse in={isExpanded}>
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            pb: { xs: 1.5, sm: 2 },
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: { xs: 1.5, sm: 2 },
            mt: { xs: 1, sm: 1 }
          }}>
            {/* Connection Details */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontSize: { xs: '0.9375rem', sm: '0.875rem' },
                  fontWeight: { xs: 600, sm: 500 },
                  mb: { xs: 1, sm: 0.5 }
                }}
              >
                {t('salesforce.connectionDetails', { defaultValue: 'Connection Details' })}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.75rem' },
                  lineHeight: { xs: 1.4, sm: 1.2 },
                  mb: { xs: 0.5, sm: 0.25 }
                }}
              >
                {t('salesforce.status')}: {connectionStatus.label}
              </Typography>
              {instanceUrl && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '0.75rem' },
                    lineHeight: { xs: 1.4, sm: 1.2 },
                    mb: { xs: 0.5, sm: 0.25 },
                    wordBreak: 'break-all'
                  }}
                >
                  {t('salesforce.instanceUrl')}: {instanceUrl}
                </Typography>
              )}
              {isAuthenticated && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '0.75rem' },
                    lineHeight: { xs: 1.4, sm: 1.2 },
                    mb: { xs: 0.5, sm: 0.25 }
                  }}
                >
                  {t('salesforce.apiVersion')}: v58.0
                </Typography>
              )}

              {/* Activity Timestamps */}
              {isAuthenticated && (
                <>
                  {lastSyncTime && (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1, sm: 0.5 },
                      mt: { xs: 1, sm: 1 }
                    }}>
                      <ScheduleIcon sx={{
                        fontSize: { xs: 16, sm: 14 },
                        color: 'text.secondary'
                      }} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '0.75rem' },
                          lineHeight: { xs: 1.4, sm: 1.2 }
                        }}
                      >
                        {t('profile.loginTime', { defaultValue: 'Login time' })}: {formatTimestamp(lastSyncTime)}
                      </Typography>
                    </Box>
                  )}

                  {lastFileUpload && (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1, sm: 0.5 },
                      mt: { xs: 0.75, sm: 0.5 }
                    }}>
                      <CloudUploadIcon sx={{
                        fontSize: { xs: 16, sm: 14 },
                        color: 'text.secondary'
                      }} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '0.75rem' },
                          lineHeight: { xs: 1.4, sm: 1.2 }
                        }}
                      >
                        {t('profile.lastUpload', { defaultValue: 'Last upload' })}: {formatTimestamp(lastFileUpload)}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>



            {/* Actions */}
            <Box sx={{
              flex: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 1.5, sm: 1 },
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button
                size={isSmallMobile ? "medium" : "small"}
                variant="outlined"
                onClick={handleNavigateToSettings}
                startIcon={<SettingsIcon />}
                sx={{
                  minHeight: { xs: 44, sm: 32 },
                  fontSize: { xs: '0.875rem', sm: '0.8125rem' },
                  fontWeight: { xs: 500, sm: 400 },
                  px: { xs: 2, sm: 1.5 }
                }}
              >
                {t('navigation.settings', { defaultValue: 'Settings' })}
              </Button>
              {!isAuthenticated && (
                <Button
                  size={isSmallMobile ? "medium" : "small"}
                  variant="contained"
                  onClick={handleNavigateToSettings}
                  startIcon={<CloudIcon />}
                  sx={{
                    minHeight: { xs: 44, sm: 32 },
                    fontSize: { xs: '0.875rem', sm: '0.8125rem' },
                    fontWeight: { xs: 600, sm: 500 },
                    px: { xs: 2, sm: 1.5 }
                  }}
                >
                  {t('salesforce.connect', { defaultValue: 'Connect' })}
                </Button>
              )}
            </Box>
          </Box>

          {/* Error Display */}
          {error && (
            <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant="caption"
                color="error"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.75rem' },
                  lineHeight: { xs: 1.4, sm: 1.2 },
                  wordBreak: 'break-word'
                }}
              >
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
