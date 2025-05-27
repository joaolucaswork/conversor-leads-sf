import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Psychology as PsychologyIcon,
  Gavel as RuleIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const CostTrackingDashboard = ({ recentSessions = [] }) => {
  const [totalStats, setTotalStats] = useState({
    totalCost: 0,
    totalTokens: 0,
    totalCalls: 0,
    avgOptimizationScore: 0,
    avgCacheHitRate: 0,
    totalFilesSaved: 0
  });

  useEffect(() => {
    // Calculate aggregate statistics from recent sessions
    if (recentSessions.length > 0) {
      const stats = recentSessions.reduce((acc, session) => {
        const apiUsage = session.apiUsage || {};
        return {
          totalCost: acc.totalCost + (apiUsage.estimated_cost || 0),
          totalTokens: acc.totalTokens + (apiUsage.total_tokens_used || 0),
          totalCalls: acc.totalCalls + (apiUsage.total_calls || 0),
          totalCacheHits: acc.totalCacheHits + (apiUsage.cache_hits || 0),
          totalAiSkipped: acc.totalAiSkipped + (apiUsage.ai_skipped || 0),
          sessionCount: acc.sessionCount + 1
        };
      }, {
        totalCost: 0,
        totalTokens: 0,
        totalCalls: 0,
        totalCacheHits: 0,
        totalAiSkipped: 0,
        sessionCount: 0
      });

      const avgCacheHitRate = stats.sessionCount > 0 ?
        recentSessions.reduce((sum, s) => sum + (s.apiUsage?.cache_hit_ratio || 0), 0) / stats.sessionCount : 0;

      const avgOptimizationScore = stats.sessionCount > 0 ?
        recentSessions.reduce((sum, s) => {
          const usage = s.apiUsage || {};
          const score = calculateOptimizationScore(usage);
          return sum + score;
        }, 0) / stats.sessionCount : 0;

      setTotalStats({
        ...stats,
        avgCacheHitRate,
        avgOptimizationScore,
        totalFilesSaved: stats.sessionCount
      });
    }
  }, [recentSessions]);

  const calculateOptimizationScore = (apiUsage) => {
    if (!apiUsage.cache_hit_ratio && !apiUsage.ai_skip_ratio) return 0;

    const cacheScore = (apiUsage.cache_hit_ratio || 0) * 30;
    const aiSkipScore = (apiUsage.ai_skip_ratio || 0) * 25;
    const costScore = Math.max(0, 25 - (apiUsage.estimated_cost || 0) * 500);
    const baseScore = 20;

    return Math.min(100, Math.round(cacheScore + aiSkipScore + costScore + baseScore));
  };

  const formatCurrency = (amount) => `$${amount.toFixed(4)}`;
  const formatPercentage = (ratio) => `${(ratio * 100).toFixed(1)}%`;

  // Calculate potential savings
  const potentialSavings = recentSessions.reduce((total, session) => {
    const usage = session.apiUsage || {};
    const cacheHits = usage.cache_hits || 0;
    const aiSkipped = usage.ai_skipped || 0;
    // Estimate $0.0004 per cached call and $0.002 per AI call skipped
    return total + (cacheHits * 0.0004) + (aiSkipped * 0.002);
  }, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AssessmentIcon sx={{ mr: 2, color: 'primary.main' }} />
        AI Cost Optimization Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(totalStats.totalCost)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total API Cost
              </Typography>
              <Typography variant="caption" color="success.main">
                Saved: {formatCurrency(potentialSavings)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {Math.round(totalStats.avgOptimizationScore)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Optimization Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalStats.avgOptimizationScore}
                sx={{ mt: 1 }}
                color={totalStats.avgOptimizationScore >= 80 ? 'success' : 'primary'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <StorageIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                {formatPercentage(totalStats.avgCacheHitRate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Cache Hit Rate
              </Typography>
              <Typography variant="caption" color="info.main">
                {totalStats.totalCacheHits} total hits
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PsychologyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {totalStats.totalCalls}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total API Calls
              </Typography>
              <Typography variant="caption" color="warning.main">
                {totalStats.totalTokens.toLocaleString()} tokens
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Optimization Insights */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Optimization Insights
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Cost Efficiency: {totalStats.avgOptimizationScore >= 80 ? 'Excellent' : totalStats.avgOptimizationScore >= 60 ? 'Good' : 'Needs Improvement'}
                </Typography>
                <Typography variant="caption">
                  Your current settings are {totalStats.avgOptimizationScore >= 80 ? 'well-optimized' : 'performing adequately'} for cost efficiency.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Cache Performance: {totalStats.avgCacheHitRate >= 0.7 ? 'Excellent' : totalStats.avgCacheHitRate >= 0.5 ? 'Good' : 'Needs Improvement'}
                </Typography>
                <Typography variant="caption">
                  {totalStats.avgCacheHitRate >= 0.7 ?
                    'Great cache utilization is saving significant API costs.' :
                    'Consider processing similar file structures to improve cache effectiveness.'
                  }
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Sessions Table */}
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent Processing Sessions
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              variant="outlined"
              size="small"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Box>

          {recentSessions.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell align="center">Processing Mode</TableCell>
                    <TableCell align="right">API Calls</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="right">Cache Hits</TableCell>
                    <TableCell align="center">Optimization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSessions.slice(0, 10).map((session, index) => {
                    const usage = session.apiUsage || {};
                    const optimizationScore = calculateOptimizationScore(usage);

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {session.fileName || `Session ${index + 1}`}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={session.useAiEnhancement ? <PsychologyIcon /> : <RuleIcon />}
                            label={session.useAiEnhancement ? 'AI' : 'Rule-based'}
                            size="small"
                            color={session.useAiEnhancement ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {usage.total_calls || 0}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(usage.estimated_cost || 0)}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={`${formatPercentage(usage.cache_hit_ratio || 0)} hit rate`}>
                            <span>{usage.cache_hits || 0}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${optimizationScore}/100`}
                            size="small"
                            color={optimizationScore >= 80 ? 'success' : optimizationScore >= 60 ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No recent processing sessions found. Upload and process some files to see cost tracking data.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CostTrackingDashboard;
