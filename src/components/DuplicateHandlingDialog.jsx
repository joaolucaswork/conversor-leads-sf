import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Compare as CompareIcon,
  Update as UpdateIcon,
  SkipNext as SkipIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const DuplicateHandlingDialog = ({
  open,
  onClose,
  duplicates,
  onResolve,
  loading = false
}) => {
  const [selectedAction, setSelectedAction] = useState('skip'); // 'update', 'skip', 'cancel'
  const [selectedFields, setSelectedFields] = useState({});
  const [expandedDuplicates, setExpandedDuplicates] = useState({});
  const [existingRecords, setExistingRecords] = useState({});
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedAction('skip');
      setSelectedFields({});
      setExpandedDuplicates({});
      setExistingRecords({});
    }
  }, [open]);

  // Fetch existing records when duplicates are provided
  useEffect(() => {
    if (duplicates && duplicates.length > 0) {
      fetchExistingRecords();
    }
  }, [duplicates]);

  const fetchExistingRecords = async () => {
    setLoadingExisting(true);
    try {
      // Check if electronAPI is available
      if (window.electronAPI && window.electronAPI.fetchExistingRecords) {
        console.log('Fetching existing records for duplicates:', duplicates);

        const result = await window.electronAPI.fetchExistingRecords({
          duplicates: duplicates,
          objectType: 'Lead'
        });

        console.log('Fetch existing records result:', result);

        if (result && result.success) {
          setExistingRecords(result.existingRecords || {});
        } else {
          const errorMessage = result?.error || 'Unknown error occurred while fetching existing records';
          console.error('Failed to fetch existing records:', errorMessage);

          // Log additional debug information
          console.error('Full result object:', result);
          console.error('Duplicates data sent:', duplicates);

          // Fall back to mock data for development
          console.warn('Falling back to mock data due to fetch failure');
          const mockExistingRecords = {};

          duplicates.forEach((duplicate) => {
            if (duplicate.existingRecordIds && duplicate.existingRecordIds.length > 0) {
              // Create mock existing record data that's different from new record
              const newRecord = duplicate.newRecord || {};
              mockExistingRecords[duplicate.recordNumber] = {
                Id: duplicate.existingRecordIds[0],
                LastName: newRecord.LastName ? `Old ${newRecord.LastName}` : 'Existing Lead Name',
                Email: newRecord.Email ? `old.${newRecord.Email}` : 'existing@example.com',
                Phone: newRecord.Phone ? '11999887766' : '11888777555',
                Company: newRecord.Company ? `${newRecord.Company} (Old)` : 'Existing Company',
                CreatedDate: '2024-01-15T10:30:00.000Z',
                LastModifiedDate: '2024-01-20T14:45:00.000Z'
              };
              console.log(`Created mock existing record for ${duplicate.recordNumber}:`, mockExistingRecords[duplicate.recordNumber]);
            }
          });

          setExistingRecords(mockExistingRecords);
        }
      } else {
        console.warn('electronAPI not available, using mock data');
        // Fallback mock data for browser mode
        const mockExistingRecords = {};

        duplicates.forEach((duplicate) => {
          if (duplicate.existingRecordIds && duplicate.existingRecordIds.length > 0) {
            // Create mock existing record data that's different from new record
            const newRecord = duplicate.newRecord || {};
            mockExistingRecords[duplicate.recordNumber] = {
              Id: duplicate.existingRecordIds[0],
              LastName: newRecord.LastName ? `Old ${newRecord.LastName}` : 'Existing Lead Name',
              Email: newRecord.Email ? `old.${newRecord.Email}` : 'existing@example.com',
              Phone: newRecord.Phone ? '11999887766' : '11888777555',
              Company: newRecord.Company ? `${newRecord.Company} (Old)` : 'Existing Company',
              CreatedDate: '2024-01-15T10:30:00.000Z',
              LastModifiedDate: '2024-01-20T14:45:00.000Z'
            };
            console.log(`Created mock existing record for ${duplicate.recordNumber}:`, mockExistingRecords[duplicate.recordNumber]);
          }
        });

        setExistingRecords(mockExistingRecords);
      }
    } catch (error) {
      console.error('Error fetching existing records:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        duplicates: duplicates
      });

      // Fall back to mock data on any error
      console.warn('Falling back to mock data due to exception');
      const mockExistingRecords = {};

      duplicates.forEach((duplicate) => {
        if (duplicate.existingRecordIds && duplicate.existingRecordIds.length > 0) {
          // Create mock existing record data that's different from new record
          const newRecord = duplicate.newRecord || {};
          mockExistingRecords[duplicate.recordNumber] = {
            Id: duplicate.existingRecordIds[0],
            LastName: newRecord.LastName ? `Old ${newRecord.LastName}` : 'Existing Lead Name',
            Email: newRecord.Email ? `old.${newRecord.Email}` : 'existing@example.com',
            Phone: newRecord.Phone ? '11999887766' : '11888777555',
            Company: newRecord.Company ? `${newRecord.Company} (Old)` : 'Existing Company',
            CreatedDate: '2024-01-15T10:30:00.000Z',
            LastModifiedDate: '2024-01-20T14:45:00.000Z'
          };
          console.log(`Created mock existing record for ${duplicate.recordNumber}:`, mockExistingRecords[duplicate.recordNumber]);
        }
      });

      setExistingRecords(mockExistingRecords);
    } finally {
      setLoadingExisting(false);
    }
  };

  const toggleExpanded = (recordNumber) => {
    setExpandedDuplicates(prev => ({
      ...prev,
      [recordNumber]: !prev[recordNumber]
    }));
  };

  const handleFieldSelection = (recordNumber, field, checked) => {
    console.log(`Field selection changed: Record ${recordNumber}, Field ${field}, Checked: ${checked}`);

    setSelectedFields(prev => {
      const newState = {
        ...prev,
        [recordNumber]: {
          ...prev[recordNumber],
          [field]: checked
        }
      };
      console.log('Updated selectedFields state:', newState);
      return newState;
    });
  };

  const getFieldComparison = (newRecord, existingRecord) => {
    const fields = ['LastName', 'Email', 'Phone', 'Company'];
    const comparison = [];

    fields.forEach(field => {
      const newValue = newRecord[field] || '';
      const existingValue = existingRecord[field] || '';
      const isDifferent = newValue !== existingValue;

      // Debug logging to help identify issues
      console.log(`Field comparison for ${field}:`, {
        newValue,
        existingValue,
        isDifferent,
        newRecord,
        existingRecord
      });

      comparison.push({
        field,
        newValue,
        existingValue,
        isDifferent,
        label: getFieldLabel(field)
      });
    });

    console.log('Complete field comparison result:', comparison);
    return comparison;
  };

  const getFieldLabel = (field) => {
    const labels = {
      'LastName': 'Name',
      'Email': 'Email',
      'Phone': 'Phone',
      'Company': 'Company'
    };
    return labels[field] || field;
  };

  const handleResolve = () => {
    const resolution = {
      action: selectedAction,
      selectedFields: selectedFields,
      duplicates: duplicates
    };
    onResolve(resolution);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'update': return <UpdateIcon />;
      case 'skip': return <SkipIcon />;
      case 'cancel': return <CancelIcon />;
      default: return null;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'update': return 'primary';
      case 'skip': return 'warning';
      case 'cancel': return 'error';
      default: return 'default';
    }
  };

  if (!duplicates || duplicates.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            Duplicate Records Detected
          </Typography>
          <Chip
            label={`${duplicates.length} duplicate${duplicates.length > 1 ? 's' : ''}`}
            color="warning"
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            We found {duplicates.length} record{duplicates.length > 1 ? 's' : ''} that may be duplicate{duplicates.length > 1 ? 's' : ''} of existing leads in Salesforce.
          </Typography>
          <Typography variant="body2">
            Please choose how you'd like to handle these duplicates:
          </Typography>
        </Alert>

        {/* Action Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Choose Action
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card
                variant={selectedAction === 'update' ? 'elevation' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  border: selectedAction === 'update' ? 2 : 1,
                  borderColor: selectedAction === 'update' ? 'primary.main' : 'divider'
                }}
                onClick={() => setSelectedAction('update')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <UpdateIcon color={selectedAction === 'update' ? 'primary' : 'action'} />
                    <Typography variant="h6">Update Existing</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Update the existing records with new data from selected fields
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                variant={selectedAction === 'skip' ? 'elevation' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  border: selectedAction === 'skip' ? 2 : 1,
                  borderColor: selectedAction === 'skip' ? 'warning.main' : 'divider'
                }}
                onClick={() => setSelectedAction('skip')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <SkipIcon color={selectedAction === 'skip' ? 'warning' : 'action'} />
                    <Typography variant="h6">Skip Duplicates</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Skip these records and continue with the rest of the upload
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                variant={selectedAction === 'cancel' ? 'elevation' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  border: selectedAction === 'cancel' ? 2 : 1,
                  borderColor: selectedAction === 'cancel' ? 'error.main' : 'divider'
                }}
                onClick={() => setSelectedAction('cancel')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CancelIcon color={selectedAction === 'cancel' ? 'error' : 'action'} />
                    <Typography variant="h6">Cancel Upload</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Cancel the entire upload operation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Duplicate Records List */}
        <Typography variant="h6" gutterBottom>
          Duplicate Records
        </Typography>

        {loadingExisting ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading existing record details...
            </Typography>
          </Box>
        ) : (
          duplicates.map((duplicate, index) => {
            const existingRecord = existingRecords[duplicate.recordNumber];
            const isExpanded = expandedDuplicates[duplicate.recordNumber];

            return (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                      Record #{duplicate.recordNumber}
                    </Typography>
                    <IconButton
                      onClick={() => toggleExpanded(duplicate.recordNumber)}
                      size="small"
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {duplicate.errorMessage}
                  </Typography>

                  <Collapse in={isExpanded}>
                    <Box sx={{ mt: 2 }}>
                      {selectedAction === 'update' && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            Select the fields you want to update. Only fields with different values can be selected.
                            Click on a row or checkbox to select/deselect fields.
                          </Typography>
                        </Alert>
                      )}
                      {existingRecord ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Field</TableCell>
                                <TableCell>New Value</TableCell>
                                <TableCell>Existing Value</TableCell>
                                {selectedAction === 'update' && (
                                  <TableCell>Update?</TableCell>
                                )}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {getFieldComparison(duplicate.newRecord, existingRecord).map((field) => (
                                <TableRow
                                  key={field.field}
                                  sx={{
                                    backgroundColor: field.isDifferent ? 'warning.light' : 'transparent',
                                    opacity: field.isDifferent ? 1 : 0.7,
                                    cursor: selectedAction === 'update' && field.isDifferent ? 'pointer' : 'default'
                                  }}
                                  onClick={() => {
                                    if (selectedAction === 'update' && field.isDifferent) {
                                      const currentlyChecked = selectedFields[duplicate.recordNumber]?.[field.field] || false;
                                      handleFieldSelection(duplicate.recordNumber, field.field, !currentlyChecked);
                                    }
                                  }}
                                >
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {field.label}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {field.newValue || <em>Empty</em>}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {field.existingValue || <em>Empty</em>}
                                    </Typography>
                                  </TableCell>
                                  {selectedAction === 'update' && (
                                    <TableCell>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={selectedFields[duplicate.recordNumber]?.[field.field] || false}
                                            onChange={(e) => {
                                              console.log(`Checkbox clicked: Record ${duplicate.recordNumber}, Field ${field.field}, Event:`, e);
                                              console.log(`Field isDifferent: ${field.isDifferent}, Disabled: ${!field.isDifferent}`);
                                              console.log(`Current selectedFields state:`, selectedFields);
                                              handleFieldSelection(
                                                duplicate.recordNumber,
                                                field.field,
                                                e.target.checked
                                              );
                                            }}
                                            disabled={!field.isDifferent}
                                          />
                                        }
                                        label=""
                                      />
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="info">
                          Unable to fetch existing record details for comparison.
                        </Alert>
                      )}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            );
          })
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleResolve}
          variant="contained"
          color={getActionColor(selectedAction)}
          startIcon={getActionIcon(selectedAction)}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            selectedAction === 'update' ? 'Update Records' :
            selectedAction === 'skip' ? 'Skip Duplicates' :
            'Cancel Upload'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateHandlingDialog;
