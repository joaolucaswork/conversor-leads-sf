// Modal component for viewing event details
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  Grid,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Task as TaskIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Repeat as RepeatIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import useCalendarStore from '../store/calendarStore';

// Helper function to format date and time
const formatEventDateTime = (start, end, allDay, locale = ptBR) => {
  if (allDay) {
    if (start && end && start.toDateString() !== end.toDateString()) {
      return `${format(start, 'dd/MM/yyyy', { locale })} - ${format(end, 'dd/MM/yyyy', { locale })}`;
    }
    return format(start, 'dd/MM/yyyy', { locale });
  }
  
  if (start && end) {
    const startDate = format(start, 'dd/MM/yyyy', { locale });
    const endDate = format(end, 'dd/MM/yyyy', { locale });
    const startTime = format(start, 'HH:mm', { locale });
    const endTime = format(end, 'HH:mm', { locale });
    
    if (startDate === endDate) {
      return `${startDate} • ${startTime} - ${endTime}`;
    }
    return `${startDate} ${startTime} - ${endDate} ${endTime}`;
  }
  
  return format(start, 'dd/MM/yyyy HH:mm', { locale });
};

// Helper function to get event type icon
const getEventTypeIcon = (eventType, salesforceType) => {
  if (salesforceType === 'Task') {
    return <TaskIcon />;
  }
  
  switch (eventType) {
    case 'meeting':
      return <EventIcon />;
    case 'call':
      return <ScheduleIcon />;
    case 'email':
      return <EventIcon />;
    default:
      return <EventIcon />;
  }
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'cancelled':
      return 'error';
    case 'planned':
      return 'primary';
    default:
      return 'default';
  }
};

function EventDetailsModal() {
  const { t } = useTranslation();
  
  const {
    isEventDetailsModalOpen,
    selectedEvent,
    closeEventDetailsModal,
    openEditEventModal
  } = useCalendarStore();

  if (!selectedEvent) {
    return null;
  }

  const handleEdit = () => {
    closeEventDetailsModal();
    openEditEventModal(selectedEvent);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete event:', selectedEvent.id);
    closeEventDetailsModal();
  };

  const handleClose = () => {
    closeEventDetailsModal();
  };

  return (
    <Dialog
      open={isEventDetailsModalOpen}
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
          {getEventTypeIcon(selectedEvent.event_type, selectedEvent.salesforce_type)}
          <Typography variant="h6" component="div">
            {selectedEvent.title}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Main Event Information */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Informações do Evento
                </Typography>
                
                {/* Date and Time */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ScheduleIcon color="action" fontSize="small" />
                  <Typography variant="body1">
                    {formatEventDateTime(
                      new Date(selectedEvent.start),
                      selectedEvent.end ? new Date(selectedEvent.end) : null,
                      selectedEvent.allDay
                    )}
                  </Typography>
                </Box>

                {/* Location */}
                {selectedEvent.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocationIcon color="action" fontSize="small" />
                    <Typography variant="body1">
                      {selectedEvent.location}
                    </Typography>
                  </Box>
                )}

                {/* Description */}
                {selectedEvent.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Descrição:
                    </Typography>
                    <Typography variant="body1">
                      {selectedEvent.description}
                    </Typography>
                  </Box>
                )}

                {/* Status and Type */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    label={selectedEvent.status}
                    color={getStatusColor(selectedEvent.status)}
                    size="small"
                  />
                  <Chip
                    label={selectedEvent.salesforce_type}
                    variant="outlined"
                    size="small"
                  />
                  {selectedEvent.event_type && (
                    <Chip
                      label={selectedEvent.event_type}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>

                {/* Reminder */}
                {selectedEvent.has_reminder && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <NotificationsIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      Lembrete: {selectedEvent.reminder_minutes} minutos antes
                    </Typography>
                  </Box>
                )}

                {/* Recurring */}
                {selectedEvent.is_recurring && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RepeatIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      Evento recorrente
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Related Information */}
          {(selectedEvent.related_to || selectedEvent.related_person || selectedEvent.owner_name) && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Informações Relacionadas
                  </Typography>

                  {/* Owner */}
                  {selectedEvent.owner_name && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Responsável:
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.owner_name}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Related Account/Opportunity */}
                  {selectedEvent.related_to && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <BusinessIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {selectedEvent.related_to.type}:
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.related_to.name}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Related Contact/Lead */}
                  {selectedEvent.related_person && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {selectedEvent.related_person.type}:
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.related_person.name}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Salesforce Information */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Informações do Salesforce
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  ID: {selectedEvent.salesforce_id}
                </Typography>
                
                {selectedEvent.created_at && (
                  <Typography variant="body2" color="text.secondary">
                    Criado em: {format(new Date(selectedEvent.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </Typography>
                )}
                
                {selectedEvent.updated_at && (
                  <Typography variant="body2" color="text.secondary">
                    Atualizado em: {format(new Date(selectedEvent.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleDelete}
          color="error"
          startIcon={<DeleteIcon />}
          disabled={!selectedEvent.editable}
        >
          Excluir
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleClose}>
          Fechar
        </Button>
        <Button
          onClick={handleEdit}
          variant="contained"
          startIcon={<EditIcon />}
          disabled={!selectedEvent.editable}
        >
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EventDetailsModal;
