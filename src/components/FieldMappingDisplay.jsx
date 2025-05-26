import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, Chip, LinearProgress, Card, CardContent, Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';

const ConfidenceProgress = styled(LinearProgress)(({ theme, value }) => ({
  height: 8,
  borderRadius: 4,
  width: '80%', // Control width of the progress bar itself
  '&.MuiLinearProgress-colorPrimary': {
    backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 700],
  },
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    backgroundColor: value > 85 ? theme.palette.success.main : (value > 60 ? theme.palette.warning.main : theme.palette.error.main),
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.action.hover,
}));

const FieldMappingDisplay = ({ previewData }) => {
  if (!previewData) {
    return <Typography>No preview data available.</Typography>;
  }

  const { mappedFields = [], originalHeaders = [], dataPreview = [], validationIssues = [] } = previewData;

  const mappedOriginalHeaders = new Set(mappedFields.map(mf => mf.originalHeader));
  const unmappedOriginalHeaders = originalHeaders.filter(h => !mappedOriginalHeaders.has(h));

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom component="div" sx={{ mb: 3 }}>
        AI Field Mapping Suggestions
      </Typography>

      {/* Mapped Fields Table */}
      <Paper elevation={2} sx={{ mb: 4 }}>
        <TableContainer>
          <Table stickyHeader aria-label="field mappings table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Original Header</StyledTableCell>
                <StyledTableCell>AI Suggested Salesforce Field</StyledTableCell>
                <StyledTableCell align="right">Confidence</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mappedFields.map((item, index) => (
                <TableRow key={item.originalHeader || index}>
                  <TableCell component="th" scope="row">
                    {item.originalHeader}
                  </TableCell>
                  <TableCell>
                    {item.aiSuggestion || item.mappedTo || <Chip label="Not Mapped by AI" size="small" />}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {(item.confidence * 100).toFixed(0)}%
                      </Typography>
                      <ConfidenceProgress variant="determinate" value={item.confidence * 100} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {mappedFields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography>No fields were automatically mapped by AI.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Unmapped Original Headers */}
      {unmappedOriginalHeaders.length > 0 && (
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Unmapped Original Headers
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {unmappedOriginalHeaders.map((header, index) => (
                <Chip key={index} label={header} />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error.main">
              Initial Validation Issues Found
            </Typography>
            <Grid container spacing={1}>
              {validationIssues.map((issue, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Chip
                    color="error"
                    variant="outlined"
                    label={`Row ${issue.rowNumber || 'N/A'} - ${issue.originalHeader || 'Unknown Field'}: "${issue.value || ''}" - ${issue.message}`}
                    sx={{ width: '100%', justifyContent: 'flex-start', '.MuiChip-label': { overflowWrap: 'break-word', whiteSpace: 'normal', textAlign: 'left' } }}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Data Preview Table */}
      {dataPreview.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2, mt: 4 }}>
            Data Preview (First {dataPreview.length} Rows)
          </Typography>
          <Paper elevation={2}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader aria-label="data preview table">
                <TableHead>
                  <TableRow>
                    {Object.keys(dataPreview[0]?.preview || dataPreview[0]?.original || {}).map((key) => (
                      <StyledTableCell key={key}>{key}</StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataPreview.map((row, index) => (
                    <TableRow key={index}>
                      {Object.entries(row.preview || row.original || {}).map(([key, value]) => (
                        <TableCell key={key}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default FieldMappingDisplay;
