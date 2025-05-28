// Event utility functions for calendar operations
import { formatDate, formatDateTime, formatTime, calculateDuration, isPastDate, isToday } from './dateUtils';

/**
 * Event type configurations
 */
export const EVENT_TYPES = {
  event: {
    label: 'Evento',
    icon: '📅',
    color: '#7b1fa2',
    description: 'Evento geral'
  },
  meeting: {
    label: 'Reunião',
    icon: '👥',
    color: '#1976d2',
    description: 'Reunião com participantes'
  },
  call: {
    label: 'Ligação',
    icon: '📞',
    color: '#388e3c',
    description: 'Ligação telefônica'
  },
  email: {
    label: 'Email',
    icon: '📧',
    color: '#f57c00',
    description: 'Comunicação por email'
  },
  task: {
    label: 'Tarefa',
    icon: '✓',
    color: '#9e9e9e',
    description: 'Tarefa a ser realizada'
  }
};

/**
 * Event status configurations
 */
export const EVENT_STATUSES = {
  planned: {
    label: 'Planejado',
    color: '#1976d2',
    description: 'Evento planejado'
  },
  in_progress: {
    label: 'Em Andamento',
    color: '#ff9800',
    description: 'Evento em andamento'
  },
  completed: {
    label: 'Concluído',
    color: '#4caf50',
    description: 'Evento concluído'
  },
  cancelled: {
    label: 'Cancelado',
    color: '#f44336',
    description: 'Evento cancelado'
  },
  not_started: {
    label: 'Não Iniciado',
    color: '#9e9e9e',
    description: 'Tarefa não iniciada'
  }
};

/**
 * Priority levels for tasks
 */
export const PRIORITY_LEVELS = {
  Low: {
    label: 'Baixa',
    color: '#9e9e9e',
    weight: 1
  },
  Normal: {
    label: 'Normal',
    color: '#1976d2',
    weight: 2
  },
  High: {
    label: 'Alta',
    color: '#f44336',
    weight: 3
  }
};

/**
 * Get event type configuration
 */
export const getEventTypeConfig = (eventType) => {
  return EVENT_TYPES[eventType] || EVENT_TYPES.event;
};

/**
 * Get event status configuration
 */
export const getEventStatusConfig = (status) => {
  return EVENT_STATUSES[status] || EVENT_STATUSES.planned;
};

/**
 * Get priority configuration
 */
export const getPriorityConfig = (priority) => {
  return PRIORITY_LEVELS[priority] || PRIORITY_LEVELS.Normal;
};

/**
 * Format event for display
 */
export const formatEventForDisplay = (event) => {
  if (!event) return null;

  const typeConfig = getEventTypeConfig(event.event_type);
  const statusConfig = getEventStatusConfig(event.status);
  const duration = calculateDuration(event.start, event.end);

  return {
    ...event,
    typeConfig,
    statusConfig,
    duration,
    formattedDate: formatDateTime(event.start),
    formattedTime: event.all_day ? 'Dia inteiro' : formatTime(event.start),
    formattedDuration: duration.text,
    isPast: isPastDate(event.start),
    isToday: isToday(event.start)
  };
};

/**
 * Convert event to FullCalendar format
 */
export const convertToFullCalendarEvent = (event) => {
  if (!event) return null;

  const typeConfig = getEventTypeConfig(event.event_type);
  const statusConfig = getEventStatusConfig(event.status);

  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.all_day,
    backgroundColor: event.color || typeConfig.color,
    borderColor: event.border_color || typeConfig.color,
    textColor: event.text_color || '#ffffff',
    editable: event.editable !== false,
    startEditable: event.start_editable !== false,
    durationEditable: event.duration_editable !== false,
    resourceEditable: event.resource_editable !== false,
    extendedProps: {
      description: event.description,
      location: event.location,
      status: event.status,
      event_type: event.event_type,
      salesforce_id: event.salesforce_id,
      salesforce_type: event.salesforce_type,
      owner_name: event.owner_name,
      related_to: event.related_to,
      related_person: event.related_person,
      is_recurring: event.is_recurring,
      has_reminder: event.has_reminder,
      reminder_minutes: event.reminder_minutes,
      priority: event.priority,
      typeConfig,
      statusConfig
    }
  };
};

/**
 * Filter events by criteria
 */
export const filterEvents = (events, filters) => {
  if (!events || !Array.isArray(events)) {
    return [];
  }

  return events.filter(event => {
    // Include/exclude by type
    if (!filters.includeEvents && event.salesforce_type === 'Event') {
      return false;
    }
    if (!filters.includeTasks && event.salesforce_type === 'Task') {
      return false;
    }
    if (!filters.includeRecurring && event.is_recurring) {
      return false;
    }

    // Filter by event types
    if (filters.eventTypes && filters.eventTypes.length > 0 && 
        !filters.eventTypes.includes(event.event_type)) {
      return false;
    }

    // Filter by statuses
    if (filters.statuses && filters.statuses.length > 0 && 
        !filters.statuses.includes(event.status)) {
      return false;
    }

    // Filter by owner
    if (filters.ownerIds && filters.ownerIds.length > 0 && 
        !filters.ownerIds.includes(event.owner_id)) {
      return false;
    }

    // Filter by account
    if (filters.accountIds && filters.accountIds.length > 0 && 
        !filters.accountIds.includes(event.related_to?.id)) {
      return false;
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const titleMatch = event.title?.toLowerCase().includes(searchLower);
      const descMatch = event.description?.toLowerCase().includes(searchLower);
      const locationMatch = event.location?.toLowerCase().includes(searchLower);
      const ownerMatch = event.owner_name?.toLowerCase().includes(searchLower);
      const relatedMatch = event.related_to?.name?.toLowerCase().includes(searchLower);

      if (!titleMatch && !descMatch && !locationMatch && !ownerMatch && !relatedMatch) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort events by date and priority
 */
export const sortEvents = (events, sortBy = 'start', sortOrder = 'asc') => {
  if (!events || !Array.isArray(events)) {
    return [];
  }

  return [...events].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'start':
        aValue = new Date(a.start);
        bValue = new Date(b.start);
        break;
      case 'title':
        aValue = a.title?.toLowerCase() || '';
        bValue = b.title?.toLowerCase() || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'priority':
        const aPriority = getPriorityConfig(a.priority);
        const bPriority = getPriorityConfig(b.priority);
        aValue = aPriority.weight;
        bValue = bPriority.weight;
        break;
      case 'type':
        aValue = a.event_type || '';
        bValue = b.event_type || '';
        break;
      default:
        aValue = new Date(a.start);
        bValue = new Date(b.start);
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Group events by date
 */
export const groupEventsByDate = (events) => {
  if (!events || !Array.isArray(events)) {
    return {};
  }

  return events.reduce((groups, event) => {
    const dateKey = formatDate(event.start);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {});
};

/**
 * Group events by status
 */
export const groupEventsByStatus = (events) => {
  if (!events || !Array.isArray(events)) {
    return {};
  }

  return events.reduce((groups, event) => {
    const status = event.status || 'unknown';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(event);
    return groups;
  }, {});
};

/**
 * Get events for a specific date
 */
export const getEventsForDate = (events, targetDate) => {
  if (!events || !Array.isArray(events) || !targetDate) {
    return [];
  }

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  return events.filter(event => {
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === target.getTime();
  });
};

/**
 * Get upcoming events (next N days)
 */
export const getUpcomingEvents = (events, days = 7) => {
  if (!events || !Array.isArray(events)) {
    return [];
  }

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);

  return events.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate >= now && eventDate <= futureDate;
  }).sort((a, b) => new Date(a.start) - new Date(b.start));
};

/**
 * Get overdue tasks
 */
export const getOverdueTasks = (events) => {
  if (!events || !Array.isArray(events)) {
    return [];
  }

  const now = new Date();

  return events.filter(event => {
    return (
      event.salesforce_type === 'Task' &&
      event.status !== 'completed' &&
      event.status !== 'cancelled' &&
      new Date(event.start) < now
    );
  });
};

/**
 * Calculate event statistics
 */
export const calculateEventStats = (events) => {
  if (!events || !Array.isArray(events)) {
    return {
      total: 0,
      byType: {},
      byStatus: {},
      upcoming: 0,
      overdue: 0,
      today: 0
    };
  }

  const stats = {
    total: events.length,
    byType: {},
    byStatus: {},
    upcoming: 0,
    overdue: 0,
    today: 0
  };

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  events.forEach(event => {
    // Count by type
    const type = event.event_type || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Count by status
    const status = event.status || 'unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

    const eventDate = new Date(event.start);

    // Count today's events
    if (eventDate >= today && eventDate < tomorrow) {
      stats.today++;
    }

    // Count upcoming events
    if (eventDate > now) {
      stats.upcoming++;
    }

    // Count overdue tasks
    if (event.salesforce_type === 'Task' && 
        event.status !== 'completed' && 
        event.status !== 'cancelled' && 
        eventDate < now) {
      stats.overdue++;
    }
  });

  return stats;
};

/**
 * Validate event data
 */
export const validateEvent = (eventData) => {
  const errors = [];

  if (!eventData.title || eventData.title.trim() === '') {
    errors.push('Título é obrigatório');
  }

  if (!eventData.start) {
    errors.push('Data de início é obrigatória');
  }

  if (eventData.start && eventData.end && new Date(eventData.start) >= new Date(eventData.end)) {
    errors.push('Data de fim deve ser posterior à data de início');
  }

  if (eventData.reminder_minutes && (eventData.reminder_minutes < 0 || eventData.reminder_minutes > 1440)) {
    errors.push('Lembrete deve estar entre 0 e 1440 minutos');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  EVENT_TYPES,
  EVENT_STATUSES,
  PRIORITY_LEVELS,
  getEventTypeConfig,
  getEventStatusConfig,
  getPriorityConfig,
  formatEventForDisplay,
  convertToFullCalendarEvent,
  filterEvents,
  sortEvents,
  groupEventsByDate,
  groupEventsByStatus,
  getEventsForDate,
  getUpcomingEvents,
  getOverdueTasks,
  calculateEventStats,
  validateEvent
};
