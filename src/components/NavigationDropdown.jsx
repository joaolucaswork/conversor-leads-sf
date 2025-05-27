import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Cloud as SalesforceIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  Analytics as AdminIcon,
} from '@mui/icons-material';
import HamburgerIcon from './HamburgerIcon';

/**
 * Navigation Dropdown Component
 * Provides navigation menu in a dropdown format similar to UserProfileHeader
 * Replaces the previous sidebar navigation system
 */
const NavigationDropdown = ({ isAuthenticated = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Navigation items for authenticated users
  const authenticatedMenuItems = [
    { text: t('navigation.home'), icon: <HomeIcon />, path: '/', ariaLabel: t('navigation.ariaLabels.home') },
    { text: t('navigation.salesforce'), icon: <SalesforceIcon />, path: '/salesforce', ariaLabel: t('navigation.ariaLabels.salesforce') },
    { text: t('navigation.admin', 'Admin Dashboard'), icon: <AdminIcon />, path: '/admin', ariaLabel: t('navigation.ariaLabels.admin', 'Open admin dashboard') },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/settings', ariaLabel: t('navigation.ariaLabels.settings') },
  ];

  // Navigation items for non-authenticated users
  const publicMenuItems = [
    { text: t('navigation.login'), icon: <LoginIcon />, path: '/login', ariaLabel: t('navigation.ariaLabels.login') },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/settings', ariaLabel: t('navigation.ariaLabels.settings') },
  ];

  const menuItems = isAuthenticated ? authenticatedMenuItems : publicMenuItems;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose(); // Close dropdown after navigation
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <Tooltip title={t('navigation.ariaLabels.openMenu')}>
        <IconButton
          color="inherit"
          aria-label="open navigation menu"
          edge="start"
          onClick={handleClick}
          sx={{ mr: 2, color: 'text.primary' }}
          aria-controls={open ? 'navigation-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <HamburgerIcon isOpen={open} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="navigation-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 200,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {/* Navigation Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="subtitle2"
            component="div"
            sx={{
              fontWeight: 'bold',
              color: 'text.primary',
            }}
          >
            {t('app.navigation')}
          </Typography>
        </Box>

        <Divider />

        {/* Navigation Menu Items */}
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={isCurrentPath(item.path)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
            aria-label={item.ariaLabel}
          >
            <ListItemIcon
              sx={{
                color: isCurrentPath(item.path) ? 'inherit' : 'text.secondary',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: isCurrentPath(item.path) ? 'bold' : 'normal',
                },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default NavigationDropdown;
