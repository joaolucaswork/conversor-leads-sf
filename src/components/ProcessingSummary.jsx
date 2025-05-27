import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Psychology as PsychologyIcon,
  Rule as RuleIcon,
  Cached as CacheIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Compare as CompareIcon
} from '@mui/icons-material';

const ProcessingSummary = ({
  aiStats = {},
  apiUsage = {},
  processingInfo = {},
  previousSession = null
}) => {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState(false);

  // Calculate metrics
  const optimizationScore = calculateOptimizationScore(apiUsage);
  const costEfficiency = calculateCostEfficiency(apiUsage, processingInfo);
  const recommendations = generateRecommendations(apiUsage, aiStats, optimizationScore);

  function calculateOptimizationScore(usage) {
    if (!usage.cache_hit_ratio && !usage.ai_skip_ratio) return 0;

    const cacheScore = (usage.cache_hit_ratio || 0) * 30;
    const aiSkipScore = (usage.ai_skip_ratio || 0) * 25;
    const costScore = Math.max(0, 25 - (usage.estimated_cost || 0) * 500);
    const baseScore = 20;

    return Math.min(100, Math.round(cacheScore + aiSkipScore + costScore + baseScore));
  }

  function calculateCostEfficiency(usage, info) {
    const recordCount = info.recordCount || 1;
    const costPerRecord = (usage.estimated_cost || 0) / recordCount;
    const tokensPerRecord = (usage.total_tokens_used || 0) / recordCount;

    return {
      costPerRecord,
      tokensPerRecord,
      efficiency: costPerRecord < 0.001 ? t('processing.aiSummary.efficiency.excellent') :
                 costPerRecord < 0.005 ? t('processing.aiSummary.efficiency.good') :
                 costPerRecord < 0.01 ? t('processing.aiSummary.efficiency.fair') : t('processing.aiSummary.efficiency.needsImprovement')
    };
  }

  function generateRecommendations(usage, stats, score) {
    const recs = [];

    if ((usage.cache_hit_ratio || 0) < 0.5) {
      recs.push({
        type: 'cache',
        priority: 'high',
        message: t('processing.aiSummary.recommendations.cache'),
        icon: <CacheIcon />
      });
    }

    if ((usage.ai_skip_ratio || 0) < 0.3) {
      recs.push({
        type: 'optimization',
        priority: 'medium',
        message: t('processing.aiSummary.recommendations.optimization'),
        icon: <RuleIcon />
      });
    }

    if ((usage.estimated_cost || 0) > 0.05) {
      recs.push({
        type: 'cost',
        priority: 'high',
        message: t('processing.aiSummary.recommendations.cost'),
        icon: <MoneyIcon />
      });
    }

    if (score >= 80) {
      recs.push({
        type: 'success',
        priority: 'info',
        message: t('processing.aiSummary.recommendations.success'),
        icon: <CheckCircleIcon />
      });
    }

    return recs;
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'info': return 'success';
      default: return 'info';
    }
  };

  // Comparison with previous session
  const ComparisonSection = () => {
    if (!previousSession) return null;

    const costDiff = (apiUsage.estimated_cost || 0) - (previousSession.estimated_cost || 0);
    const tokenDiff = (apiUsage.total_tokens_used || 0) - (previousSession.total_tokens_used || 0);
    const callsDiff = (apiUsage.total_calls || 0) - (previousSession.total_calls || 0);

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
            <CompareIcon sx={{ mr: 1 }} />
            {t('processing.aiSummary.comparisonTitle')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color={costDiff <= 0 ? 'success.main' : 'error.main'}>
                  {costDiff > 0 ? '+' : ''}{costDiff.toFixed(4)}
                </Typography>
                <Typography variant="caption">{t('processing.aiSummary.costDifference')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color={tokenDiff <= 0 ? 'success.main' : 'error.main'}>
                  {tokenDiff > 0 ? '+' : ''}{tokenDiff}
                </Typography>
                <Typography variant="caption">{t('processing.aiSummary.tokenDifference')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color={callsDiff <= 0 ? 'success.main' : 'error.main'}>
                  {callsDiff > 0 ? '+' : ''}{callsDiff}
                </Typography>
                <Typography variant="caption">{t('processing.aiSummary.apiCallsDifference')}</Typography>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Card elevation={3} sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h5" component="h2" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
          {t('processing.aiSummary.title')}
        </Typography>

        {/* Main Metrics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
              <Typography variant="h4" color="primary.contrastText" sx={{ fontWeight: 'bold' }}>
                {optimizationScore}
              </Typography>
              <Typography variant="body2" color="primary.contrastText">
                {t('processing.aiSummary.optimizationScore')}
              </Typography>
              <Chip
                label={optimizationScore >= 80 ? t('processing.aiSummary.excellent') : optimizationScore >= 60 ? t('processing.aiSummary.good') : t('processing.aiSummary.needsWork')}
                size="small"
                color={getScoreColor(optimizationScore)}
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <Typography variant="h4" color="success.contrastText" sx={{ fontWeight: 'bold' }}>
                ${(apiUsage.estimated_cost || 0).toFixed(4)}
              </Typography>
              <Typography variant="body2" color="success.contrastText">
                {t('processing.aiSummary.totalCost')}
              </Typography>
              <Typography variant="caption" color="success.contrastText">
                ${costEfficiency.costPerRecord.toFixed(6)} {t('processing.aiSummary.perRecord')}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
              <Typography variant="h4" color="info.contrastText" sx={{ fontWeight: 'bold' }}>
                {((apiUsage.cache_hit_ratio || 0) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="info.contrastText">
                {t('processing.aiSummary.cacheHitRate')}
              </Typography>
              <Typography variant="caption" color="info.contrastText">
                {apiUsage.cache_hits || 0} {t('processing.aiSummary.cacheHits')}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <Typography variant="h4" color="warning.contrastText" sx={{ fontWeight: 'bold' }}>
                {apiUsage.total_calls || 0}
              </Typography>
              <Typography variant="body2" color="warning.contrastText">
                {t('processing.aiSummary.apiCallsMade')}
              </Typography>
              <Typography variant="caption" color="warning.contrastText">
                {(apiUsage.total_tokens_used || 0).toLocaleString()} {t('processing.aiSummary.tokens')}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('processing.aiSummary.recommendations')}
            </Typography>
            {recommendations.map((rec, index) => (
              <Alert
                key={index}
                severity={getPriorityColor(rec.priority)}
                icon={rec.icon}
                sx={{ mb: 1 }}
              >
                {rec.message}
              </Alert>
            ))}
          </Box>
        )}

        {/* Detailed Breakdown */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{t('processing.aiSummary.detailedBreakdown')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {t('processing.aiSummary.aiProcessingStats')}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>{t('processing.aiSummary.mappingAttempts')}</TableCell>
                        <TableCell align="right">{aiStats.mappings_attempted || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{t('processing.aiSummary.mappingSuccesses')}</TableCell>
                        <TableCell align="right">{aiStats.mappings_successful || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{t('processing.aiSummary.validationAttempts')}</TableCell>
                        <TableCell align="right">{aiStats.validations_attempted || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{t('processing.aiSummary.ruleBasedFallbacks')}</TableCell>
                        <TableCell align="right">{aiStats.fallbacks_to_rules || 0}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {t('processing.aiSummary.apiUsageDetails')}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>{t('processing.aiSummary.mappingApiCalls')}</TableCell>
                        <TableCell align="right">{apiUsage.mapping_calls || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{t('processing.aiSummary.validationApiCalls')}</TableCell>
                        <TableCell align="right">{apiUsage.validation_calls || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{t('processing.aiSummary.cacheMisses')}</TableCell>
                        <TableCell align="right">{apiUsage.cache_misses || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{t('processing.aiSummary.aiOperationsSkipped')}</TableCell>
                        <TableCell align="right">{apiUsage.ai_skipped || 0}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <ComparisonSection />


      </CardContent>
    </Card>
  );
};

export default ProcessingSummary;
