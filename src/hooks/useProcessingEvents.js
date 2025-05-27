import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing processing events and notifications
 * Provides a way for components to communicate about processing completion
 */
export const useProcessingEvents = () => {
  const [processingCompletions, setProcessingCompletions] = useState([]);
  const listenersRef = useRef(new Set());

  // Add a listener for processing completion events
  const addProcessingCompletionListener = useCallback((listener) => {
    listenersRef.current.add(listener);
    
    // Return cleanup function
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  // Notify all listeners about processing completion
  const notifyProcessingCompletion = useCallback((processingData) => {
    console.log('Processing completion notification:', processingData);
    
    // Add to completions list for tracking
    setProcessingCompletions(prev => [
      ...prev.slice(-9), // Keep last 10 completions
      {
        ...processingData,
        timestamp: Date.now()
      }
    ]);

    // Notify all listeners
    listenersRef.current.forEach(listener => {
      try {
        listener(processingData);
      } catch (error) {
        console.error('Error in processing completion listener:', error);
      }
    });
  }, []);

  // Clear old completions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setProcessingCompletions(prev => 
        prev.filter(completion => completion.timestamp > fiveMinutesAgo)
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    processingCompletions,
    addProcessingCompletionListener,
    notifyProcessingCompletion
  };
};

/**
 * Global processing events manager
 * Singleton pattern to ensure consistent event handling across components
 */
class ProcessingEventsManager {
  constructor() {
    this.listeners = new Set();
    this.completions = [];
  }

  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyCompletion(processingData) {
    console.log('Global processing completion notification:', processingData);
    
    // Add to completions history
    this.completions.push({
      ...processingData,
      timestamp: Date.now()
    });

    // Keep only last 10 completions
    if (this.completions.length > 10) {
      this.completions = this.completions.slice(-10);
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(processingData);
      } catch (error) {
        console.error('Error in global processing completion listener:', error);
      }
    });
  }

  getRecentCompletions() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return this.completions.filter(completion => completion.timestamp > fiveMinutesAgo);
  }
}

// Global instance
const globalProcessingEvents = new ProcessingEventsManager();

/**
 * Hook to use the global processing events manager
 */
export const useGlobalProcessingEvents = () => {
  const [recentCompletions, setRecentCompletions] = useState([]);

  const addListener = useCallback((listener) => {
    return globalProcessingEvents.addListener(listener);
  }, []);

  const notifyCompletion = useCallback((processingData) => {
    globalProcessingEvents.notifyCompletion(processingData);
    setRecentCompletions(globalProcessingEvents.getRecentCompletions());
  }, []);

  useEffect(() => {
    // Update recent completions on mount
    setRecentCompletions(globalProcessingEvents.getRecentCompletions());
  }, []);

  return {
    recentCompletions,
    addListener,
    notifyCompletion
  };
};

export default useProcessingEvents;
