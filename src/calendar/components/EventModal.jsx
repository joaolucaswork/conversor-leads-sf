// Modal component for creating and editing events
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Box,
  Grid,
  IconButton,
  Typography,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Event as EventIcon,
  Task as TaskIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import useCalendarStore from '../store/calendarStore';
import { createEvent, updateEvent, createTask, updateTask } from '../services/calendarApiService';

// Event types for selection
const EVENT_TYPES = [
  { value: 'event', label: 'Evento' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'call', label: 'Ligação' },
  { value: 'email', label: 'Email' },
  { value: 'task', label: 'Tarefa' }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planejado' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'not_started', label: 'Não Iniciado' }
];

// Priority options for tasks
const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Baixa' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'Alta' }
];

function EventModal() {
  const { t } = useTranslation();

  const {
    isCreateEventModalOpen,
    isEditEventModalOpen,
    selectedEvent,
    closeCreateEventModal,
    closeEditEventModal,
    addEvent,
    updateEvent: updateEventInStore
  } = useCalendarStore();

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    start_datetime: new Date(),
    end_datetime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    is_all_day: false,
    location: '',
    event_type: 'event',
    status: 'planned',
    priority: 'Normal',
    is_reminder_set: false,
    reminder_minutes: 15,
    account_id: '',
    contact_id: '',
    lead_id: '',
    opportunity_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOpen = isCreateEventModalOpen || isEditEventModalOpen;
  const isEditing = isEditEventModalOpen && selectedEvent;

  // Initialize form data when modal opens
  useEffect(() => {
    if (isEditing && selectedEvent) {
      setFormData({
        subject: selectedEvent.title || '',
        description: selectedEvent.description || '',
        start_datetime: new Date(selectedEvent.start),
        end_datetime: selectedEvent.end ? new Date(selectedEvent.end) : new Date(selectedEvent.start),
        is_all_day: selectedEvent.allDay || false,
        location: selectedEvent.location || '',
        event_type: selectedEvent.event_type || 'event',
        status: selectedEvent.status || 'planned',
        priority: 'Normal', // Default priority
        is_reminder_set: selectedEvent.has_reminder || false,
        reminder_minutes: selectedEvent.reminder_minutes || 15,
        account_id: selectedEvent.related_to?.id || '',
        contact_id: selectedEvent.related_person?.type === 'Contact' ? selectedEvent.related_person.id : '',
        lead_id: selectedEvent.related_person?.type === 'Lead' ? selectedEvent.related_person.id : '',
        opportunity_id: selectedEvent.related_to?.type === 'Opportunity' ? selectedEvent.related_to.id : ''
      });
    } else {
      // Reset form for new event
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000);

      setFormData({
        subject: '',
        description: '',
        start_datetime: now,
        end_datetime: endTime,
        is_all_day: false,
        location: '',
        event_type: 'event',
        status: 'planned',
        priority: 'Normal',
        is_reminder_set: false,
        reminder_minutes: 15,
        account_id: '',
        contact_id: '',
        lead_id: '',
        opportunity_id: ''
      });
    }
    setError('');
  }, [isEditing, selectedEvent, isOpen]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleClose = () => {
    if (isCreateEventModalOpen) {
      closeCreateEventModal();
    } else {
      closeEditEventModal();
    }
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.subject.trim()) {
        setError('O título é obrigatório');
        return;
      }

      if (formData.start_datetime >= formData.end_datetime && !formData.is_all_day) {
        setError('A data de fim deve ser posterior à data de início');
        return;
      }

      // Prepare data for API
      const eventData = {
        subject: formData.subject.trim(),
        description: formData.description.trim() || null,
        start_datetime: formData.start_datetime.toISOString(),
        end_datetime: formData.end_datetime.toISOString(),
        is_all_day: formData.is_all_day,
        location: formData.location.trim() || null,
        event_type: formData.event_type,
        status: formData.status,
        is_reminder_set: formData.is_reminder_set,
        reminder_minutes: formData.is_reminder_set ? formData.reminder_minutes : null,
        account_id: formData.account_id || null,
        contact_id: formData.contact_id || null,
        lead_id: formData.lead_id || null,
        opportunity_id: formData.opportunity_id || null
      };

      let response;

      if (isEditing) {
        // Update existing event
        if (selectedEvent.salesforce_type === 'Task') {
          response = await updateTask(selectedEvent.id, {
            ...eventData,
            priority: formData.priority,
            activity_date: formData.start_datetime.toISOString().split('T')[0]
          });
        } else {
          response = await updateEvent(selectedEvent.id, eventData);
        }

        if (response.success) {
          // Update event in store
          updateEventInStore(selectedEvent.id, {
            title: formData.subject,
            start: formData.start_datetime,
            end: formData.end_datetime,
            allDay: formData.is_all_day,
            description: formData.description,
            location: formData.location,
            status: formData.status,
            event_type: formData.event_type
          });
        }
      } else {
        // Create new event
        if (formData.event_type === 'task') {
          response = await createTask({
            ...eventData,
            priority: formData.priority,
            activity_date: formData.start_datetime.toISOString().split('T')[0]
          });
        } else {
          response = await createEvent(eventData);
        }

        if (response.success && response.event) {
          // Add new event to store
          addEvent(response.event);
        }
      }

      if (response.success) {
        handleClose();
      } else {
        setError(response.message || 'Erro ao salvar evento');
      }

    } catch (err) {
      console.error('Error saving event:', err);

      // Enhanced error message handling
      let errorMessage = 'Erro ao salvar evento';

      if (err.message) {
        // Check if it's a validation error with specific field information
        if (err.message.includes('Validation error:')) {
          errorMessage = `Erro de validação: ${err.message.replace('Validation error: ', '')}`;
        } else if (err.message.includes('End datetime must be after start datetime')) {
          errorMessage = 'A data de fim deve ser posterior à data de início';
        } else if (err.message.includes('subject')) {
          errorMessage = 'O título é obrigatório e deve ter entre 1 e 255 caracteres';
        } else if (err.message.includes('Not authenticated')) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente no Salesforce';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {formData.event_type === 'task' ? <TaskIcon /> : <EventIcon />}
            <Typography variant="h6">
              {isEditing ? 'Editar Evento' : 'Novo Evento'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título *"
                value={formData.subject}
                onChange={handleInputChange('subject')}
                error={!formData.subject.trim()}
                helperText={!formData.subject.trim() ? 'Campo obrigatório' : ''}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange('description')}
              />
            </Grid>

            {/* Type and Status */}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.event_type}
                  onChange={handleInputChange('event_type')}
                  label="Tipo"
                >
                  {EVENT_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  label="Status"
                >
                  {STATUS_OPTIONS.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Priority for tasks */}
            {formData.event_type === 'task' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Prioridade</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={handleInputChange('priority')}
                    label="Prioridade"
                  >
                    {PRIORITY_OPTIONS.map(priority => (
                      <MenuItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* All Day Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_all_day}
                    onChange={handleInputChange('is_all_day')}
                  />
                }
                label="Dia inteiro"
              />
            </Grid>

            {/* Date and Time */}
            <Grid item xs={6}>
              <DateTimePicker
                label="Data/Hora de Início *"
                value={formData.start_datetime}
                onChange={handleDateChange('start_datetime')}
                renderInput={(params) => <TextField {...params} fullWidth />}
                ampm={false}
                views={formData.is_all_day ? ['year', 'month', 'day'] : ['year', 'month', 'day', 'hours', 'minutes']}
              />
            </Grid>

            <Grid item xs={6}>
              <DateTimePicker
                label="Data/Hora de Fim *"
                value={formData.end_datetime}
                onChange={handleDateChange('end_datetime')}
                renderInput={(params) => <TextField {...params} fullWidth />}
                ampm={false}
                views={formData.is_all_day ? ['year', 'month', 'day'] : ['year', 'month', 'day', 'hours', 'minutes']}
                disabled={formData.is_all_day}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Local"
                value={formData.location}
                onChange={handleInputChange('location')}
              />
            </Grid>

            {/* Reminder */}
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_reminder_set}
                    onChange={handleInputChange('is_reminder_set')}
                  />
                }
                label="Definir lembrete"
              />
            </Grid>

            {formData.is_reminder_set && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minutos antes"
                  value={formData.reminder_minutes}
                  onChange={handleInputChange('reminder_minutes')}
                  inputProps={{ min: 0, max: 1440 }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || !formData.subject.trim()}
          >
            {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default EventModal;
