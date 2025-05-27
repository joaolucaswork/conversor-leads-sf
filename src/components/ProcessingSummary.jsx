import React, { useState } from 'react';
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
  onViewDetails,
  previousSession = null
}) => {
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
      efficiency: costPerRecord < 0.001 ? 'Excellent' :
                 costPerRecord < 0.005 ? 'Good' :
                 costPerRecord < 0.01 ? 'Fair' : 'Needs Improvement'
    };
  }

  function generateRecommendations(usage, stats, score) {
    const recs = [];

    if ((usage.cache_hit_ratio || 0) < 0.5) {
      recs.push({
        type: 'cache',
        priority: 'high',
        message: 'Process similar file structures to improve cache effectiveness',
        icon: <CacheIcon />
      });
    }

    if ((usage.ai_skip_ratio || 0) < 0.3) {
      recs.push({
        type: 'optimization',
        priority: 'medium',
        message: 'Consider enhancing rule-based patterns to reduce AI dependency',
        icon: <RuleIcon />
      });
    }

    if ((usage.estimated_cost || 0) > 0.05) {
      recs.push({
        type: 'cost',
        priority: 'high',
        message: 'High cost per file - consider using smaller sample sizes',
        icon: <MoneyIcon />
      });
    }

    if (score >= 80) {
      recs.push({
        type: 'success',
        priority: 'info',
        message: 'Excellent optimization! Current settings are well-tuned for cost efficiency',
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
            Comparison with Previous Session
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color={costDiff <= 0 ? 'success.main' : 'error.main'}>
                  {costDiff > 0 ? '+' : ''}{costDiff.toFixed(4)}
                </Typography>
                <Typography variant="caption">Cost Difference</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color={tokenDiff <= 0 ? 'success.main' : 'error.main'}>
                  {tokenDiff > 0 ? '+' : ''}{tokenDiff}
                </Typography>
                <Typography variant="caption">Token Difference</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color={callsDiff <= 0 ? 'success.main' : 'error.main'}>
                  {callsDiff > 0 ? '+' : ''}{callsDiff}
                </Typography>
                <Typography variant="caption">API Calls Difference</Typography>
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
          Processing Complete - AI Optimization Summary
        </Typography>

        {/* Main Metrics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
              <Typography variant="h4" color="primary.contrastText" sx={{ fontWeight: 'bold' }}>
                {optimizationScore}
              </Typography>
              <Typography variant="body2" color="primary.contrastText">
                Optimization Score
              </Typography>
              <Chip
                label={optimizationScore >= 80 ? 'Excellent' : optimizationScore >= 60 ? 'Good' : 'Needs Work'}
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
                Total Cost
              </Typography>
              <Typography variant="caption" color="success.contrastText">
                ${costEfficiency.costPerRecord.toFixed(6)} per record
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
              <Typography variant="h4" color="info.contrastText" sx={{ fontWeight: 'bold' }}>
                {((apiUsage.cache_hit_ratio || 0) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="info.contrastText">
                Cache Hit Rate
              </Typography>
              <Typography variant="caption" color="info.contrastText">
                {apiUsage.cache_hits || 0} cache hits
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <Typography variant="h4" color="warning.contrastText" sx={{ fontWeight: 'bold' }}>
                {apiUsage.total_calls || 0}
              </Typography>
              <Typography variant="body2" color="warning.contrastText">
                API Calls Made
              </Typography>
              <Typography variant="caption" color="warning.contrastText">
                {(apiUsage.total_tokens_used || 0).toLocaleString()} tokens
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Optimization Recommendations
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
            <Typography variant="subtitle1">Detailed Processing Breakdown</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  AI Processing Statistics
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Mapping Attempts</TableCell>
                        <TableCell align="right">{aiStats.mappings_attempted || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Mapping Successes</TableCell>
                        <TableCell align="right">{aiStats.mappings_successful || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Validation Attempts</TableCell>
                        <TableCell align="right">{aiStats.validations_attempted || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Rule-based Fallbacks</TableCell>
                        <TableCell align="right">{aiStats.fallbacks_to_rules || 0}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  API Usage Details
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Mapping API Calls</TableCell>
                        <TableCell align="right">{apiUsage.mapping_calls || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Validation API Calls</TableCell>
                        <TableCell align="right">{apiUsage.validation_calls || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Cache Misses</TableCell>
                        <TableCell align="right">{apiUsage.cache_misses || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>AI Operations Skipped</TableCell>
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

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onViewDetails && (
            <Button variant="outlined" onClick={onViewDetails}>
              View Detailed Report
            </Button>
          )}
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
          >
            Processing Complete
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProcessingSummary;
