// Error boundary component for calendar module
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Paper,
  Stack
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

class CalendarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to a logging service
    console.error('Calendar Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    // Reset the error boundary state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <CalendarErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

// Fallback component to display when error occurs
function CalendarErrorFallback({ error, errorInfo, onRetry, onGoHome }) {
  const { t } = useTranslation();

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        p: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center'
        }}
      >
        <Stack spacing={3} alignItems="center">
          {/* Error Icon */}
          <ErrorIcon
            sx={{
              fontSize: 64,
              color: 'error.main'
            }}
          />

          {/* Error Title */}
          <Typography variant="h4" component="h1" gutterBottom>
            Oops! Algo deu errado
          </Typography>

          {/* Error Description */}
          <Typography variant="body1" color="text.secondary" paragraph>
            Ocorreu um erro inesperado no módulo do calendário. 
            Tente recarregar a página ou volte para a página inicial.
          </Typography>

          {/* Error Alert */}
          <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
            <AlertTitle>Detalhes do Erro</AlertTitle>
            {error?.message || 'Erro desconhecido no calendário'}
          </Alert>

          {/* Development Error Details */}
          {isDevelopment && error && (
            <Alert severity="info" sx={{ width: '100%', textAlign: 'left' }}>
              <AlertTitle>Informações de Debug (Desenvolvimento)</AlertTitle>
              <Typography variant="body2" component="pre" sx={{ 
                whiteSpace: 'pre-wrap',
                fontSize: '0.75rem',
                maxHeight: 200,
                overflow: 'auto'
              }}>
                {error.stack}
              </Typography>
              {errorInfo && (
                <Typography variant="body2" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.75rem',
                  maxHeight: 200,
                  overflow: 'auto',
                  mt: 1
                }}>
                  {errorInfo.componentStack}
                </Typography>
              )}
            </Alert>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              color="primary"
            >
              Tentar Novamente
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={onGoHome}
              color="secondary"
            >
              Voltar ao Início
            </Button>
          </Stack>

          {/* Additional Help */}
          <Typography variant="caption" color="text.secondary">
            Se o problema persistir, entre em contato com o suporte técnico.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

export default CalendarErrorBoundary;
