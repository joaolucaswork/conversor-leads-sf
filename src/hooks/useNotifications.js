import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../store/notificationStore';

/**
 * Hook that provides internationalized notification functions
 * Combines the notification store with translation capabilities
 */
export const useNotifications = () => {
  const { t } = useTranslation();
  const { addNotification, removeNotification, clearAllNotifications } = useNotificationStore();

  const showSuccess = (message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options
    });
  };

  const showError = (message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      autoHideDuration: 8000,
      ...options
    });
  };

  const showWarning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      ...options
    });
  };

  const showInfo = (message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options
    });
  };

  // Specialized download notification functions with translations
  const showDownloadSuccess = (filename, options = {}) => {
    const message = t('notifications.download.success', { filename });
    return addNotification({
      type: 'success',
      message,
      icon: 'download',
      autoHideDuration: 4000, // Shorter for success
      ...options
    });
  };

  const showDownloadError = (filename, error, options = {}) => {
    const message = t('notifications.download.error', { filename, error });
    return addNotification({
      type: 'error',
      message,
      icon: 'error',
      autoHideDuration: 10000, // Longer for errors
      ...options
    });
  };

  const showDownloadStarting = (filename, options = {}) => {
    const message = t('notifications.download.starting', { filename });
    return addNotification({
      type: 'info',
      message,
      icon: 'download',
      autoHideDuration: 2000, // Very short for starting message
      ...options
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDownloadSuccess,
    showDownloadError,
    showDownloadStarting,
    removeNotification,
    clearAllNotifications
  };
};
