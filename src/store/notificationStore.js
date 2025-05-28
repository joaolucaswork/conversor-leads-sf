import { create } from "zustand";

/**
 * Notification store for managing app-wide notifications
 * Supports different types of notifications with auto-dismiss functionality
 */
export const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],

  // Actions
  addNotification: (notification) => {
    const id = Date.now() + Math.random(); // Simple unique ID
    const newNotification = {
      id,
      type: "info", // 'success', 'error', 'warning', 'info'
      message: "",
      autoHideDuration: 6000, // 6 seconds default
      icon: null,
      ...notification,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-dismiss if duration is set
    if (newNotification.autoHideDuration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.autoHideDuration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  // Convenience methods for different notification types
  showSuccess: (message, options = {}) => {
    return get().addNotification({
      type: "success",
      message,
      ...options,
    });
  },

  showError: (message, options = {}) => {
    return get().addNotification({
      type: "error",
      message,
      autoHideDuration: 8000, // Longer for errors
      ...options,
    });
  },

  showWarning: (message, options = {}) => {
    return get().addNotification({
      type: "warning",
      message,
      ...options,
    });
  },

  showInfo: (message, options = {}) => {
    return get().addNotification({
      type: "info",
      message,
      ...options,
    });
  },

  // Simple method for download notifications (use useNotifications hook for translated versions)
  showDownloadSuccess: (filename, options = {}) => {
    return get().addNotification({
      type: "success",
      message: `✅ ${filename}`,
      icon: "download",
      autoHideDuration: 4000,
      ...options,
    });
  },

  showDownloadError: (filename, error, options = {}) => {
    return get().addNotification({
      type: "error",
      message: `❌ ${filename}: ${error}`,
      icon: "error",
      autoHideDuration: 10000, // Longer for download errors
      ...options,
    });
  },
}));
