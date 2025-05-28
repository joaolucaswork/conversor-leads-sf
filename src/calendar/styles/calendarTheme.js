// Enhanced theme configuration for calendar components
import { alpha } from '@mui/material/styles';

/**
 * Get calendar-specific theme overrides
 */
export const getCalendarThemeOverrides = (theme) => ({
  // FullCalendar CSS custom properties
  '--fc-border-color': theme.palette.divider,
  '--fc-button-text-color': theme.palette.primary.contrastText,
  '--fc-button-bg-color': theme.palette.primary.main,
  '--fc-button-border-color': theme.palette.primary.main,
  '--fc-button-hover-bg-color': theme.palette.primary.dark,
  '--fc-button-hover-border-color': theme.palette.primary.dark,
  '--fc-button-active-bg-color': theme.palette.primary.dark,
  '--fc-button-active-border-color': theme.palette.primary.dark,
  
  // Today highlighting
  '--fc-today-bg-color': alpha(theme.palette.primary.main, 0.1),
  
  // Event colors
  '--fc-event-bg-color': theme.palette.primary.main,
  '--fc-event-border-color': theme.palette.primary.main,
  '--fc-event-text-color': theme.palette.primary.contrastText,
  
  // Background colors
  '--fc-page-bg-color': theme.palette.background.default,
  '--fc-neutral-bg-color': theme.palette.background.paper,
  
  // Text colors
  '--fc-neutral-text-color': theme.palette.text.primary,
  '--fc-list-event-hover-bg-color': theme.palette.action.hover,
  
  // More link styling
  '--fc-more-link-bg-color': theme.palette.action.hover,
  '--fc-more-link-text-color': theme.palette.text.secondary,
  
  // Popover styling
  '--fc-popover-bg-color': theme.palette.background.paper,
  '--fc-popover-border-color': theme.palette.divider,
});

/**
 * Calendar component styles
 */
export const getCalendarStyles = (theme) => ({
  // Main calendar container
  calendarContainer: {
    '& .fc': {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.body2.fontSize,
    },
    
    // Toolbar styling
    '& .fc-toolbar': {
      marginBottom: theme.spacing(2),
      flexWrap: 'wrap',
      gap: theme.spacing(1),
    },
    
    '& .fc-toolbar-title': {
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.h5.fontWeight,
      color: theme.palette.text.primary,
      margin: 0,
    },
    
    '& .fc-button-group': {
      '& .fc-button': {
        textTransform: 'none',
        fontWeight: theme.typography.button.fontWeight,
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(0.5, 1),
        
        '&:not(:last-child)': {
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        },
        
        '&:not(:first-child)': {
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          marginLeft: '-1px',
        },
      },
    },
    
    '& .fc-today-button': {
      textTransform: 'capitalize',
    },
    
    // Grid styling
    '& .fc-scrollgrid': {
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
    },
    
    '& .fc-col-header': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
    
    '& .fc-col-header-cell': {
      padding: theme.spacing(1),
      fontWeight: theme.typography.subtitle2.fontWeight,
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    
    '& .fc-daygrid-day': {
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.5),
      },
    },
    
    '& .fc-daygrid-day-number': {
      color: theme.palette.text.primary,
      padding: theme.spacing(0.5),
      fontWeight: theme.typography.body2.fontWeight,
    },
    
    // Today highlighting
    '& .fc-day-today': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      
      '& .fc-daygrid-day-number': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: theme.spacing(0.25),
      },
    },
    
    // Time grid styling
    '& .fc-timegrid-slot': {
      height: '2em',
      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    },
    
    '& .fc-timegrid-slot-label': {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      padding: theme.spacing(0, 1),
    },
    
    '& .fc-timegrid-now-indicator-line': {
      borderColor: theme.palette.error.main,
      borderWidth: '2px',
    },
    
    '& .fc-timegrid-now-indicator-arrow': {
      borderLeftColor: theme.palette.error.main,
      borderWidth: '6px',
    },
    
    // List view styling
    '& .fc-list': {
      border: 'none',
    },
    
    '& .fc-list-day': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
    
    '& .fc-list-day-text': {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.subtitle2.fontWeight,
    },
    
    '& .fc-list-day-side-text': {
      color: theme.palette.text.secondary,
    },
    
    '& .fc-list-event': {
      borderLeft: `4px solid ${theme.palette.primary.main}`,
      padding: theme.spacing(1),
      
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    
    '& .fc-list-event-time': {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    
    '& .fc-list-event-title': {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.body2.fontWeight,
    },
    
    // More link styling
    '& .fc-more-link': {
      color: theme.palette.primary.main,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.button.fontWeight,
      textDecoration: 'none',
      padding: theme.spacing(0.25, 0.5),
      borderRadius: theme.shape.borderRadius,
      
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        textDecoration: 'none',
      },
    },
    
    // Popover styling
    '& .fc-popover': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[8],
    },
    
    '& .fc-popover-header': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(1),
    },
    
    '& .fc-popover-title': {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.subtitle2.fontWeight,
    },
    
    '& .fc-popover-close': {
      color: theme.palette.text.secondary,
      fontSize: '1.2em',
      
      '&:hover': {
        color: theme.palette.text.primary,
      },
    },
  },
  
  // Custom event styles
  eventStyles: {
    '& .fc-event-custom': {
      borderRadius: theme.shape.borderRadius,
      border: 'none',
      padding: theme.spacing(0.25, 0.5),
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.body2.fontWeight,
      cursor: 'pointer',
      transition: theme.transitions.create(['transform', 'box-shadow'], {
        duration: theme.transitions.duration.short,
      }),
      
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: theme.shadows[4],
      },
    },
    
    // Event type specific styles
    '& .fc-event-type-meeting': {
      backgroundColor: '#1976d2',
      borderLeft: `4px solid #0d47a1`,
    },
    
    '& .fc-event-type-call': {
      backgroundColor: '#388e3c',
      borderLeft: `4px solid #1b5e20`,
    },
    
    '& .fc-event-type-email': {
      backgroundColor: '#f57c00',
      borderLeft: `4px solid #e65100`,
    },
    
    '& .fc-event-type-task': {
      backgroundColor: '#9e9e9e',
      borderLeft: `4px solid #616161`,
      fontStyle: 'italic',
      opacity: 0.9,
    },
    
    // Status specific styles
    '& .fc-event-status-completed': {
      opacity: 0.7,
      textDecoration: 'line-through',
    },
    
    '& .fc-event-status-cancelled': {
      opacity: 0.5,
      backgroundColor: `${theme.palette.error.main} !important`,
    },
    
    '& .fc-event-status-in_progress': {
      animation: 'pulse 2s infinite',
    },
    
    // Priority specific styles
    '& .fc-event-priority-high': {
      fontWeight: 'bold',
      boxShadow: `0 0 0 2px ${theme.palette.error.main}`,
    },
    
    '& .fc-event-priority-low': {
      opacity: 0.8,
    },
    
    // Salesforce type styles
    '& .fc-event-sf-task': {
      '&::before': {
        content: '"✓"',
        marginRight: theme.spacing(0.5),
        fontSize: '0.8em',
      },
    },
    
    '& .fc-event-sf-event': {
      '&::before': {
        content: '"📅"',
        marginRight: theme.spacing(0.5),
        fontSize: '0.8em',
      },
    },
  },
  
  // Loading and error states
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.palette.background.default, 0.8),
    zIndex: 1000,
    borderRadius: theme.shape.borderRadius,
  },
  
  errorState: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  
  emptyState: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    
    '& .empty-icon': {
      fontSize: '3rem',
      marginBottom: theme.spacing(2),
      opacity: 0.5,
    },
    
    '& .empty-title': {
      fontSize: theme.typography.h6.fontSize,
      fontWeight: theme.typography.h6.fontWeight,
      marginBottom: theme.spacing(1),
    },
    
    '& .empty-description': {
      fontSize: theme.typography.body2.fontSize,
      marginBottom: theme.spacing(2),
    },
  },
});

/**
 * Animation keyframes
 */
export const calendarAnimations = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;

/**
 * Responsive breakpoints for calendar
 */
export const calendarBreakpoints = {
  mobile: '@media (max-width: 768px)',
  tablet: '@media (max-width: 1024px)',
  desktop: '@media (min-width: 1025px)',
};

/**
 * Get responsive calendar styles
 */
export const getResponsiveCalendarStyles = (theme) => ({
  [calendarBreakpoints.mobile]: {
    '& .fc-toolbar': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: theme.spacing(1),
    },
    
    '& .fc-toolbar-chunk': {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(0.5),
    },
    
    '& .fc-button': {
      fontSize: theme.typography.caption.fontSize,
      padding: theme.spacing(0.5),
      minWidth: 'auto',
    },
    
    '& .fc-toolbar-title': {
      fontSize: theme.typography.h6.fontSize,
      textAlign: 'center',
      marginBottom: theme.spacing(1),
    },
    
    '& .fc-daygrid-day-number': {
      fontSize: theme.typography.caption.fontSize,
    },
    
    '& .fc-event': {
      fontSize: theme.typography.caption.fontSize,
      padding: theme.spacing(0.25),
    },
  },
  
  [calendarBreakpoints.tablet]: {
    '& .fc-toolbar': {
      flexWrap: 'wrap',
      gap: theme.spacing(1),
    },
    
    '& .fc-button': {
      fontSize: theme.typography.body2.fontSize,
    },
  },
});

export default {
  getCalendarThemeOverrides,
  getCalendarStyles,
  calendarAnimations,
  calendarBreakpoints,
  getResponsiveCalendarStyles,
};
