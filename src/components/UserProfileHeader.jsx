import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const UserProfileHeader = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const {
    userProfile,
    isLoadingProfile,
    logout,
  } = useAuthStore((state) => ({
    userProfile: state.userProfile,
    isLoadingProfile: state.isLoadingProfile,
    logout: state.logout,
  }));

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
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

  const displayName = userProfile?.name || 'User';
  const displayEmail = userProfile?.username || userProfile?.email || '';

  return (
    <>
      <Box display="flex" alignItems="center">
        {isLoadingProfile ? (
          <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
        ) : (
          <Tooltip title="User Profile">
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar
                src={userProfile?.picture}
                sx={{ width: 32, height: 32 }}
              >
                {getInitials(displayName)}
              </Avatar>
            </IconButton>
          </Tooltip>
        )}

        {userProfile && (
          <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" color="inherit" noWrap>
              {displayName}
            </Typography>
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 280,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Avatar
              src={userProfile?.picture}
              sx={{ width: 40, height: 40, mr: 1.5 }}
            >
              {getInitials(displayName)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {displayEmail}
              </Typography>
            </Box>
          </Box>

          {/* Status Chips */}
          <Box display="flex" gap={1} flexWrap="wrap">
            {userProfile?.organization_id && (
              <Chip
                label={userProfile.organization_id}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </Box>

        <Divider />

        {/* Menu Items */}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserProfileHeader;
