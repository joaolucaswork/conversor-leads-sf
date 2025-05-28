// Toolbar component for calendar controls and filters
import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  FormControlLabel,
  Switch,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewModule as ViewModuleIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewList as ViewListIcon,
  Today as TodayIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import useCalendarStore from '../store/calendarStore';

// View options
const VIEW_OPTIONS = [
  { value: 'dayGridMonth', label: 'Mês', icon: ViewModuleIcon },
  { value: 'timeGridWeek', label: 'Semana', icon: ViewWeekIcon },
  { value: 'timeGridDay', label: 'Dia', icon: ViewDayIcon },
  { value: 'listWeek', label: 'Lista', icon: ViewListIcon }
];

// Event type options for filtering
const EVENT_TYPE_OPTIONS = [
  { value: 'event', label: 'Eventos' },
  { value: 'meeting', label: 'Reuniões' },
  { value: 'call', label: 'Ligações' },
  { value: 'email', label: 'Emails' },
  { value: 'task', label: 'Tarefas' }
];

// Status options for filtering
const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planejado' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'not_started', label: 'Não Iniciado' }
];

function CalendarToolbar() {
  const { t } = useTranslation();

  const {
    currentView,
    currentDate,
    filters,
    isLoading,
    setCurrentView,
    setCurrentDate,
    setFilters,
    resetFilters,
    openCreateEventModal,
    getFilteredEvents
  } = useCalendarStore();

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState(null);

  // Get current view option
  const currentViewOption = VIEW_OPTIONS.find(option => option.value === currentView);

  // Count active filters (Tasks permanently excluded, so not counted)
  const activeFiltersCount = [
    filters.eventTypes.length > 0,
    filters.statuses.length > 0,
    filters.searchTerm,
    !filters.includeEvents,
    !filters.includeRecurring
  ].filter(Boolean).length;

  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case 'dayGridMonth':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'timeGridWeek':
      case 'listWeek':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'timeGridDay':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }

    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case 'dayGridMonth':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'timeGridWeek':
      case 'listWeek':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'timeGridDay':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }

    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // View change handler
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Search handlers
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = () => {
    setFilters({ searchTerm });
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Filter menu handlers
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleFilterToggle = (filterType, value) => {
    const currentValues = filters[filterType] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    setFilters({ [filterType]: newValues });
  };

  const handleIncludeToggle = (filterType) => {
    setFilters({ [filterType]: !filters[filterType] });
  };

  // Settings menu handlers
  const handleSettingsMenuOpen = (event) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null);
  };

  // Format current date for display
  const formatCurrentDate = () => {
    switch (currentView) {
      case 'dayGridMonth':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'timeGridWeek':
      case 'listWeek':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${format(weekStart, 'dd MMM', { locale: ptBR })} - ${format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}`;
      case 'timeGridDay':
        return format(currentDate, 'dd MMMM yyyy', { locale: ptBR });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Toolbar
        sx={{
          px: 0,
          minHeight: '64px !important',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        {/* Left section - Navigation and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 300 }}>
          {/* Navigation buttons */}
          <IconButton onClick={handlePrevious} disabled={isLoading}>
            <ChevronLeftIcon />
          </IconButton>

          <Button
            onClick={handleToday}
            variant="outlined"
            size="small"
            startIcon={<TodayIcon />}
            disabled={isLoading}
          >
            Hoje
          </Button>

          <IconButton onClick={handleNext} disabled={isLoading}>
            <ChevronRightIcon />
          </IconButton>

          {/* Current date/period */}
          <Typography variant="h6" sx={{ ml: 2, fontWeight: 500 }}>
            {formatCurrentDate()}
          </Typography>
        </Box>

        {/* Center section - Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    ×
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 250 }}
          />
        </Box>

        {/* Right section - Actions and View Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Filter button */}
          <Tooltip title="Filtros">
            <IconButton onClick={handleFilterMenuOpen}>
              <Badge badgeContent={activeFiltersCount} color="primary">
                <FilterIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Refresh button */}
          <Tooltip title="Atualizar">
            <IconButton disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {/* View selector */}
          <ButtonGroup variant="outlined" size="small">
            {VIEW_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              return (
                <Tooltip key={option.value} title={option.label}>
                  <Button
                    onClick={() => handleViewChange(option.value)}
                    variant={currentView === option.value ? 'contained' : 'outlined'}
                    sx={{ minWidth: 40, px: 1 }}
                  >
                    <IconComponent fontSize="small" />
                  </Button>
                </Tooltip>
              );
            })}
          </ButtonGroup>

          {/* Add event button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateEventModal}
            disabled={isLoading}
          >
            Novo Evento
          </Button>

          {/* Settings button */}
          <Tooltip title="Configurações">
            <IconButton onClick={handleSettingsMenuOpen}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
        PaperProps={{
          sx: { minWidth: 300, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Incluir
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={filters.includeEvents}
                onChange={() => handleIncludeToggle('includeEvents')}
                size="small"
              />
            }
            label="Eventos"
          />

          {/* Tasks toggle removed - Tasks permanently excluded from calendar */}

          <FormControlLabel
            control={
              <Switch
                checked={filters.includeRecurring}
                onChange={() => handleIncludeToggle('includeRecurring')}
                size="small"
              />
            }
            label="Eventos Recorrentes"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Tipos de Evento
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                size="small"
                clickable
                color={filters.eventTypes.includes(option.value) ? 'primary' : 'default'}
                onClick={() => handleFilterToggle('eventTypes', option.value)}
              />
            ))}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Status
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {STATUS_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                size="small"
                clickable
                color={filters.statuses.includes(option.value) ? 'primary' : 'default'}
                onClick={() => handleFilterToggle('statuses', option.value)}
              />
            ))}
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              resetFilters();
              setSearchTerm('');
              handleFilterMenuClose();
            }}
          >
            Limpar Filtros
          </Button>
        </Box>
      </Menu>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={handleSettingsMenuClose}
      >
        <MenuItem onClick={handleSettingsMenuClose}>
          Configurações do Calendário
        </MenuItem>
        <MenuItem onClick={handleSettingsMenuClose}>
          Preferências de Visualização
        </MenuItem>
        <MenuItem onClick={handleSettingsMenuClose}>
          Exportar Calendário
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default CalendarToolbar;
