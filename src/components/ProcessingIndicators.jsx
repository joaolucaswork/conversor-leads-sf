import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Fade
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Gavel as RuleIcon,
  Storage as StorageIcon,
  Code as ApiIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Autorenew as AutorenewIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useTranslation } from 'react-i18next';

// Pulse animation for active indicators
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const ProcessingIndicators = ({
  currentStage = '',
  apiUsage = {},
  isProcessing = false,
  progress = 0
}) => {
  const { t } = useTranslation();

  // Define processing stages with their indicators
  const stages = [
    {
      key: 'file_uploaded',
      label: t('processing.stages.file_uploaded'),
      description: t('processing.indicators.fileReceived'),
      icon: <CheckCircleIcon />,
      color: 'success'
    },
    {
      key: 'preprocessing',
      label: t('processing.stages.preprocessing'),
      description: t('processing.indicators.analyzingStructure'),
      icon: <AutorenewIcon />,
      color: 'info'
    },
    {
      key: 'data_validation',
      label: t('processing.stages.data_validation'),
      description: t('processing.indicators.validatingIntegrity'),
      icon: <CheckCircleIcon />,
      color: 'info'
    },
    {
      key: 'ai_processing',
      label: t('processing.stages.ai_processing'),
      description: t('processing.indicators.intelligentMapping'),
      icon: <PsychologyIcon />,
      color: 'primary'
    },
    {
      key: 'traditional_processing',
      label: t('fileUpload.ruleBased'),
      description: t('processing.indicators.traditionalMapping'),
      icon: <RuleIcon />,
      color: 'secondary'
    },
    {
      key: 'completed',
      label: t('processing.stages.completed'),
      description: t('processing.indicators.processingFinished'),
      icon: <CheckCircleIcon />,
      color: 'success'
    }
  ];

  // Get current stage index
  const currentStageIndex = stages.findIndex(stage => stage.key === currentStage);
  const activeStage = stages[currentStageIndex] || stages[0];

  // Real-time processing indicators
  const ProcessingTypeIndicator = () => {
    if (!isProcessing) return null;

    const isAiProcessing = currentStage === 'ai_processing';
    const isRuleBasedProcessing = currentStage === 'traditional_processing';

    return (
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={isAiProcessing ? <PsychologyIcon /> : <RuleIcon />}
          label={isAiProcessing ? t('processing.indicators.aiEnhanced') : t('processing.indicators.ruleBased')}
          color={isAiProcessing ? 'primary' : 'secondary'}
          variant={isProcessing ? 'filled' : 'outlined'}
          sx={{
            animation: isProcessing ? `${pulse} 2s infinite` : 'none'
          }}
        />

        {apiUsage.cache_hits > 0 && (
          <Chip
            icon={<StorageIcon />}
            label={`${t('processing.indicators.cache')}: ${apiUsage.cache_hits} ${t('processing.indicators.hits')}`}
            color="info"
            size="small"
            variant="outlined"
          />
        )}

        {apiUsage.total_calls > 0 && (
          <Chip
            icon={<ApiIcon />}
            label={`${t('processing.indicators.api')}: ${apiUsage.total_calls} ${t('processing.indicators.calls')}`}
            color="warning"
            size="small"
            variant="outlined"
          />
        )}

        {apiUsage.ai_skipped > 0 && (
          <Chip
            icon={<RuleIcon />}
            label={`${t('processing.indicators.optimized')}: ${apiUsage.ai_skipped} ${t('processing.indicators.skipped')}`}
            color="success"
            size="small"
            variant="outlined"
          />
        )}
      </Box>
    );
  };

  // Cost accumulation indicator
  const CostIndicator = () => {
    if (!apiUsage.estimated_cost || apiUsage.estimated_cost === 0) return null;

    return (
      <Fade in={true}>
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: 'success.light',
            color: 'success.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {t('processing.indicators.processingCost')}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            ${apiUsage.estimated_cost.toFixed(4)}
            {isProcessing && (
              <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
                {t('processing.indicators.accumulating')}
              </Typography>
            )}
          </Typography>
        </Paper>
      </Fade>
    );
  };

  // Optimization efficiency indicator
  const EfficiencyIndicator = () => {
    const cacheHitRatio = apiUsage.cache_hit_ratio || 0;
    const aiSkipRatio = apiUsage.ai_skip_ratio || 0;

    if (cacheHitRatio === 0 && aiSkipRatio === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
          {t('processing.indicators.optimizationEfficiency')}
        </Typography>

        {cacheHitRatio > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">{t('processing.indicators.cacheHitRate')}</Typography>
              <Typography variant="caption">{(cacheHitRatio * 100).toFixed(1)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={cacheHitRatio * 100}
              color="info"
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {aiSkipRatio > 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">{t('processing.indicators.aiSkipRate')}</Typography>
              <Typography variant="caption">{(aiSkipRatio * 100).toFixed(1)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={aiSkipRatio * 100}
              color="success"
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </Box>
    );
  };

  // Processing stage stepper
  const StageIndicator = () => {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
          {t('processing.indicators.processingStage')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: `${activeStage.color}.main`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              animation: isProcessing ? `${pulse} 2s infinite` : 'none'
            }}
          >
            {React.cloneElement(activeStage.icon, { sx: { fontSize: 16 } })}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {activeStage.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activeStage.description}
            </Typography>
          </Box>

          {isProcessing && (
            <AutorenewIcon
              sx={{
                color: 'primary.main',
                animation: `${pulse} 1s infinite`
              }}
            />
          )}
        </Box>

        {isProcessing && progress > 0 && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 1, height: 4, borderRadius: 2 }}
            color={activeStage.color}
          />
        )}
      </Box>
    );
  };

  return (
    <Box>
      <StageIndicator />
      <ProcessingTypeIndicator />
      <CostIndicator />
      <EfficiencyIndicator />
    </Box>
  );
};

export default ProcessingIndicators;
