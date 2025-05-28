// Date utility functions for calendar operations
import { format, parse, isValid, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, isSameDay, isSameWeek, isSameMonth, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Format date for display in different contexts
 */
export const formatDate = (date, formatString = 'dd/MM/yyyy', locale = ptBR) => {
  if (!date || !isValid(new Date(date))) {
    return '';
  }
  
  return format(new Date(date), formatString, { locale });
};

/**
 * Format date and time for display
 */
export const formatDateTime = (date, formatString = 'dd/MM/yyyy HH:mm', locale = ptBR) => {
  if (!date || !isValid(new Date(date))) {
    return '';
  }
  
  return format(new Date(date), formatString, { locale });
};

/**
 * Format time only
 */
export const formatTime = (date, formatString = 'HH:mm', locale = ptBR) => {
  if (!date || !isValid(new Date(date))) {
    return '';
  }
  
  return format(new Date(date), formatString, { locale });
};

/**
 * Format date range for display
 */
export const formatDateRange = (startDate, endDate, allDay = false, locale = ptBR) => {
  if (!startDate || !isValid(new Date(startDate))) {
    return '';
  }

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (allDay) {
    if (!end || isSameDay(start, end)) {
      return format(start, 'dd/MM/yyyy', { locale });
    }
    return `${format(start, 'dd/MM/yyyy', { locale })} - ${format(end, 'dd/MM/yyyy', { locale })}`;
  }

  if (!end) {
    return format(start, 'dd/MM/yyyy HH:mm', { locale });
  }

  if (isSameDay(start, end)) {
    return `${format(start, 'dd/MM/yyyy', { locale })} • ${format(start, 'HH:mm', { locale })} - ${format(end, 'HH:mm', { locale })}`;
  }

  return `${format(start, 'dd/MM/yyyy HH:mm', { locale })} - ${format(end, 'dd/MM/yyyy HH:mm', { locale })}`;
};

/**
 * Get relative time description (e.g., "hoje", "amanhã", "ontem")
 */
export const getRelativeTimeDescription = (date, locale = ptBR) => {
  if (!date || !isValid(new Date(date))) {
    return '';
  }

  const targetDate = new Date(date);
  const today = new Date();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);

  if (isSameDay(targetDate, today)) {
    return 'Hoje';
  }
  
  if (isSameDay(targetDate, yesterday)) {
    return 'Ontem';
  }
  
  if (isSameDay(targetDate, tomorrow)) {
    return 'Amanhã';
  }

  const daysDiff = differenceInDays(targetDate, today);
  
  if (daysDiff > 0 && daysDiff <= 7) {
    return `Em ${daysDiff} dia${daysDiff > 1 ? 's' : ''}`;
  }
  
  if (daysDiff < 0 && daysDiff >= -7) {
    return `${Math.abs(daysDiff)} dia${Math.abs(daysDiff) > 1 ? 's' : ''} atrás`;
  }

  return format(targetDate, 'dd/MM/yyyy', { locale });
};

/**
 * Calculate duration between two dates
 */
export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate || !isValid(new Date(startDate)) || !isValid(new Date(endDate))) {
    return { hours: 0, minutes: 0, text: '' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const totalMinutes = differenceInMinutes(end, start);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let text = '';
  if (hours > 0) {
    text += `${hours}h`;
    if (minutes > 0) {
      text += ` ${minutes}min`;
    }
  } else if (minutes > 0) {
    text = `${minutes}min`;
  } else {
    text = '0min';
  }

  return { hours, minutes, totalMinutes, text };
};

/**
 * Get date range for calendar view
 */
export const getDateRangeForView = (view, currentDate) => {
  const date = new Date(currentDate);
  let start, end;

  switch (view) {
    case 'dayGridMonth':
      // Get first day of month, then go to start of week
      start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 }); // Monday start
      end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
      break;

    case 'timeGridWeek':
    case 'listWeek':
      start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
      end = endOfWeek(date, { weekStartsOn: 1 });
      break;

    case 'timeGridDay':
      start = startOfDay(date);
      end = endOfDay(date);
      break;

    default:
      // Default to current month
      start = startOfMonth(date);
      end = endOfMonth(date);
  }

  return { start, end };
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date) => {
  if (!date || !isValid(new Date(date))) {
    return false;
  }
  
  return new Date(date) < new Date();
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  if (!date || !isValid(new Date(date))) {
    return false;
  }
  
  return isSameDay(new Date(date), new Date());
};

/**
 * Check if date is this week
 */
export const isThisWeek = (date) => {
  if (!date || !isValid(new Date(date))) {
    return false;
  }
  
  return isSameWeek(new Date(date), new Date(), { weekStartsOn: 1 });
};

/**
 * Check if date is this month
 */
export const isThisMonth = (date) => {
  if (!date || !isValid(new Date(date))) {
    return false;
  }
  
  return isSameMonth(new Date(date), new Date());
};

/**
 * Get business days between two dates (excluding weekends)
 */
export const getBusinessDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate || !isValid(new Date(startDate)) || !isValid(new Date(endDate))) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  let businessDays = 0;
  let currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      businessDays++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return businessDays;
};

/**
 * Parse date string in various formats
 */
export const parseDate = (dateString, formatString = 'dd/MM/yyyy') => {
  if (!dateString) {
    return null;
  }

  // Try parsing with the provided format first
  try {
    const parsed = parse(dateString, formatString, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  } catch (error) {
    // Continue to other parsing methods
  }

  // Try parsing as ISO string
  try {
    const parsed = new Date(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  } catch (error) {
    // Continue to other parsing methods
  }

  // Try common Brazilian date formats
  const commonFormats = [
    'dd/MM/yyyy',
    'dd/MM/yyyy HH:mm',
    'dd/MM/yyyy HH:mm:ss',
    'yyyy-MM-dd',
    'yyyy-MM-dd HH:mm',
    'yyyy-MM-dd HH:mm:ss'
  ];

  for (const format of commonFormats) {
    try {
      const parsed = parse(dateString, format, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
};

/**
 * Get time slots for a day (useful for time grid views)
 */
export const getTimeSlots = (startHour = 0, endHour = 24, intervalMinutes = 30) => {
  const slots = [];
  const startDate = new Date();
  startDate.setHours(startHour, 0, 0, 0);

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const slotTime = new Date(startDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      slots.push({
        time: slotTime,
        label: format(slotTime, 'HH:mm'),
        value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      });
    }
  }

  return slots;
};

/**
 * Convert date to ISO string for API calls
 */
export const toISOString = (date) => {
  if (!date || !isValid(new Date(date))) {
    return null;
  }
  
  return new Date(date).toISOString();
};

/**
 * Convert date to local date string (YYYY-MM-DD)
 */
export const toLocalDateString = (date) => {
  if (!date || !isValid(new Date(date))) {
    return null;
  }
  
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

/**
 * Get week number of the year
 */
export const getWeekNumber = (date) => {
  if (!date || !isValid(new Date(date))) {
    return null;
  }
  
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
  
  return weekNumber;
};

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatDateRange,
  getRelativeTimeDescription,
  calculateDuration,
  getDateRangeForView,
  isPastDate,
  isToday,
  isThisWeek,
  isThisMonth,
  getBusinessDaysBetween,
  parseDate,
  getTimeSlots,
  toISOString,
  toLocalDateString,
  getWeekNumber
};
