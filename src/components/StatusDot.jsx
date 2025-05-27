import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

const StatusDot = ({ status, size = 8 }) => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
      case 'connected':
        return '#6B7280'; // Neutral gray for completed
      case 'failed':
      case 'error':
        return '#9CA3AF'; // Lighter gray for errors
      case 'processing':
      case 'warning':
      case 'loading':
        return '#D1D5DB'; // Very light gray for processing
      default:
        return '#E5E7EB'; // Lightest gray for default
    }
  };

  const dotSize = isSmallMobile ? size + 2 : size;

  return (
    <Box
      sx={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        backgroundColor: getStatusColor(status),
        flexShrink: 0,
        border: `1px solid ${theme.palette.divider}`,
      }}
    />
  );
};

export default StatusDot;
