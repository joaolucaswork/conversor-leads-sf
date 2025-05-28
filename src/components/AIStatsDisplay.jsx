import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Memory as MemoryIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Gavel as RuleIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const AIStatsDisplay = ({
  aiStats = {},
  apiUsage = {},
  isProcessing = false,
  showDetailed = false,
  onToggleDetailed
}) => {
  // Calculate optimization score
  const calculateOptimizationScore = () => {
    if (!apiUsage.cache_hit_ratio && !apiUsage.ai_skip_ratio) return 0;

    const cacheScore = (apiUsage.cache_hit_ratio || 0) * 30;
    const aiSkipScore = (apiUsage.ai_skip_ratio || 0) * 25;
    const costScore = Math.max(0, 25 - (apiUsage.estimated_cost || 0) * 500);
    const baseScore = 20;

    return Math.min(100, Math.round(cacheScore + aiSkipScore + costScore + baseScore));
  };

  const optimizationScore = calculateOptimizationScore();

  // Get optimization level color
  const getOptimizationColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0.0000';
    return `$${amount.toFixed(4)}`;
  };

  // Format percentage
  const formatPercentage = (ratio) => {
    if (ratio === undefined || ratio === null) return '0%';
    return `${(ratio * 100).toFixed(1)}%`;
  };

  return (
    <Card elevation={1} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" component="h3" sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}>
            <PsychologyIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.25rem' }} />
            Processamento IA
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${optimizationScore}/100`}
              variant="outlined"
              size="small"
              sx={{
                borderColor: optimizationScore >= 80 ? 'success.main' : optimizationScore >= 60 ? 'primary.main' : 'warning.main',
                color: optimizationScore >= 80 ? 'success.main' : optimizationScore >= 60 ? 'primary.main' : 'warning.main'
              }}
            />
            {onToggleDetailed && (
              <IconButton size="small" onClick={onToggleDetailed}>
                {showDetailed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Essential Statistics Only */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{
              textAlign: 'center',
              p: 1.5,
              bgcolor: 'grey.900',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.700'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'common.white' }}>
                {apiUsage.total_calls || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.300' }}>
                Chamadas API
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{
              textAlign: 'center',
              p: 1.5,
              bgcolor: 'grey.900',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.700'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'common.white' }}>
                {formatCurrency(apiUsage.estimated_cost)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.300' }}>
                Custo
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{
              textAlign: 'center',
              p: 1.5,
              bgcolor: 'grey.900',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.700'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'common.white' }}>
                {formatPercentage(apiUsage.cache_hit_ratio)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.300' }}>
                Cache
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Simple Processing Status */}
        {isProcessing && (
          <Box sx={{
            mb: 2,
            p: 2,
            bgcolor: 'grey.900',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.700'
          }}>
            <Typography variant="body2" sx={{ color: 'common.white', textAlign: 'center' }}>
              Processando com IA...
            </Typography>
          </Box>
        )}

        {/* Detailed Statistics */}
        <Collapse in={showDetailed}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Detailed Breakdown
          </Typography>

          <Grid container spacing={2}>
            {/* AI Processing Stats */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                AI Processing
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="caption" display="block">
                  Mapping attempts: {aiStats.mappings_attempted || 0}
                </Typography>
                <Typography variant="caption" display="block">
                  Mapping successes: {aiStats.mappings_successful || 0}
                </Typography>
                <Typography variant="caption" display="block">
                  Validation attempts: {aiStats.validations_attempted || 0}
                </Typography>
                <Typography variant="caption" display="block">
                  Fallbacks to rules: {aiStats.fallbacks_to_rules || 0}
                </Typography>
              </Box>
            </Grid>

            {/* API Usage Details */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                API Usage Details
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="caption" display="block">
                  Mapping calls: {apiUsage.mapping_calls || 0}
                </Typography>
                <Typography variant="caption" display="block">
                  Validation calls: {apiUsage.validation_calls || 0}
                </Typography>
                <Typography variant="caption" display="block">
                  Cache misses: {apiUsage.cache_misses || 0}
                </Typography>
                <Typography variant="caption" display="block">
                  Total tokens: {(apiUsage.total_tokens_used || 0).toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Optimization Recommendations */}
          {optimizationScore < 80 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                <InfoIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Optimization Recommendations
              </Typography>
              <Box sx={{ pl: 2 }}>
                {(apiUsage.cache_hit_ratio || 0) < 0.5 && (
                  <Typography variant="caption" display="block">
                    • Process similar file structures to improve cache effectiveness
                  </Typography>
                )}
                {(apiUsage.ai_skip_ratio || 0) < 0.3 && (
                  <Typography variant="caption" display="block">
                    • Consider enhancing rule-based patterns to reduce AI dependency
                  </Typography>
                )}
                {(apiUsage.estimated_cost || 0) > 0.05 && (
                  <Typography variant="caption" display="block">
                    • High cost per file - consider using smaller sample sizes
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AIStatsDisplay;
