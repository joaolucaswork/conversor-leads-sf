// Main calendar application component
import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';

import CalendarPage from './pages/CalendarPage';
import CalendarErrorBoundary from './components/CalendarErrorBoundary';

function CalendarApp() {
  return (
    <CalendarErrorBoundary>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <CalendarPage />
      </LocalizationProvider>
    </CalendarErrorBoundary>
  );
}

export default CalendarApp;
