import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

const UserProfile = ({ variant = 'card', showRefresh = true }) => {
  const { t } = useTranslation();
  const {
    userProfile,
    isLoadingProfile,
    profileError,
    lastFileUpload,
    refreshUserProfile,
  } = useAuthStore((state) => ({
    userProfile: state.userProfile,
    isLoadingProfile: state.isLoadingProfile,
    profileError: state.profileError,
    lastFileUpload: state.lastFileUpload,
    refreshUserProfile: state.refreshUserProfile,
  }));

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return t('profile.never', { defaultValue: 'Never' });
    return new Date(timestamp).toLocaleString();
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

  const handleRefresh = () => {
    refreshUserProfile();
  };

  if (isLoadingProfile) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={2}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          {t('profile.loading')}
        </Typography>
      </Box>
    );
  }

  if (profileError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {t('profile.loadError', { defaultValue: 'Failed to load user profile: {{error}}', error: profileError })}
        {showRefresh && (
          <IconButton size="small" onClick={handleRefresh} sx={{ ml: 1 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        )}
      </Alert>
    );
  }

  if (!userProfile) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('profile.noData', { defaultValue: 'No user profile data available' })}
        {showRefresh && (
          <IconButton size="small" onClick={handleRefresh} sx={{ ml: 1 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        )}
      </Alert>
    );
  }

  const profileContent = (
    <>
      {/* Header with Avatar and Basic Info */}
      <Box display="flex" alignItems="center" mb={2}>
        <Avatar
          src={userProfile.picture}
          sx={{ width: 56, height: 56, mr: 2 }}
        >
          {getInitials(userProfile.name)}
        </Avatar>
        <Box flexGrow={1}>
          <Typography variant="h6" component="div">
            {userProfile.name || t('profile.unknownUser', { defaultValue: 'Unknown User' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userProfile.username || userProfile.email}
          </Typography>
          {userProfile.organization_id && (
            <Chip
              icon={<BusinessIcon />}
              label={userProfile.organization_id}
              size="small"
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>
        {showRefresh && (
          <Tooltip title={t('profile.refreshTooltip', { defaultValue: 'Refresh Profile' })}>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Profile Details Grid */}
      <Grid container spacing={2}>
        {/* Email */}
        {userProfile.email && (
          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {userProfile.email}
              </Typography>
            </Box>
          </Grid>
        )}

        {/* User ID */}
        {userProfile.id && (
          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {userProfile.id}
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Login Timestamp */}
        {userProfile.loginTimestamp && (
          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Logged in: {formatTimestamp(userProfile.loginTimestamp)}
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Last File Upload */}
        <Grid item xs={12}>
          <Box display="flex" alignItems="center">
            <CloudUploadIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              Last upload: {formatTimestamp(lastFileUpload)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Additional Profile Info */}
      {(userProfile.locale || userProfile.zoneinfo) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={1}>
            {userProfile.locale && (
              <Grid item>
                <Chip
                  label={`Locale: ${userProfile.locale}`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            )}
            {userProfile.zoneinfo && (
              <Grid item>
                <Chip
                  label={`Timezone: ${userProfile.zoneinfo}`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            )}
          </Grid>
        </>
      )}
    </>
  );

  if (variant === 'compact') {
    return (
      <Paper elevation={1} sx={{ p: 2 }}>
        {profileContent}
      </Paper>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        {profileContent}
      </CardContent>
    </Card>
  );
};

export default UserProfile;
