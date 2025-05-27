import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import StatusDot from './StatusDot';

const StatusLegend = ({ compact = false }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const statusItems = [
    { status: 'completed', label: t('history.completed', { defaultValue: 'Completed' }) },
    { status: 'processing', label: t('history.processing', { defaultValue: 'Processing' }) },
    { status: 'failed', label: t('history.failed', { defaultValue: 'Failed' }) },
  ];

  if (!isSmallMobile && !compact) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 2, sm: 3 },
        flexWrap: 'wrap',
        p: { xs: 1.5, sm: 1 },
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        mb: 2,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontSize: { xs: '0.75rem', sm: '0.6875rem' },
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {t('common.status', { defaultValue: 'Status' })}:
      </Typography>
      {statusItems.map((item) => (
        <Box
          key={item.status}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <StatusDot status={item.status} size={6} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.6875rem' },
            }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default StatusLegend;
