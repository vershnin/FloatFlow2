import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to detect network connectivity with periodic checks
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const start = Date.now();
        // Try to fetch a small resource to test connection
        await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const end = Date.now();
        const duration = end - start;

        // Reaching the server at all means the browser is online.
        setIsOnline(true);
        setIsSlowConnection(duration > 2000); // Consider >2s as slow
      } catch {
        setIsOnline(false);
        setIsSlowConnection(false);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsSlowConnection(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    // Periodic checks every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, isSlowConnection };
}