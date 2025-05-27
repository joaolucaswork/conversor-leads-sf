import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  Cloud as SalesforceIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

/**
 * Collapsible Sidebar Navigation Component
 * Provides navigation menu with responsive behavior and accessibility support
 */
const SidebarNavigation = ({
  isOpen,
  onClose,
  isAuthenticated = false,
  variant = 'temporary' // 'temporary' for mobile, 'persistent' for desktop
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Navigation items for authenticated users
  const authenticatedMenuItems = [
    { text: t('navigation.home'), icon: <HomeIcon />, path: '/', ariaLabel: t('navigation.ariaLabels.home') },
    { text: t('navigation.salesforce'), icon: <SalesforceIcon />, path: '/salesforce', ariaLabel: t('navigation.ariaLabels.salesforce') },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/settings', ariaLabel: t('navigation.ariaLabels.settings') },
  ];

  // Navigation items for non-authenticated users
  const publicMenuItems = [
    { text: t('navigation.login'), icon: <LoginIcon />, path: '/login', ariaLabel: t('navigation.ariaLabels.login') },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/settings', ariaLabel: t('navigation.ariaLabels.settings') },
  ];

  const menuItems = isAuthenticated ? authenticatedMenuItems : publicMenuItems;

  const handleNavigation = (path) => {
    navigate(path);
    // Close sidebar after navigation
    if (onClose) {
      onClose();
    }
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="navigation"
      aria-label="Main navigation menu"
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.text.primary,
          }}
        >
          {t('app.navigation')}
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isCurrentPath(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '30',
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
              aria-label={item.ariaLabel}
            >
              <ListItemIcon
                sx={{
                  color: isCurrentPath(item.path)
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
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
                    color: isCurrentPath(item.path)
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center' }}
        >
          Salesforce Leads App
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      anchor="left"
      open={isOpen}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: 280,
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
      // Accessibility props
      aria-label="Navigation sidebar"
      role="complementary"
    >
      {drawerContent}
    </Drawer>
  );
};

export default SidebarNavigation;
