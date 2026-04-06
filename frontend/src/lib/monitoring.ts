import * as Sentry from "@sentry/react";
import { browserTracingIntegration } from "@sentry/browser";
import { replayIntegration } from "@sentry/replay";

export const initMonitoring = () => {
  // Only initialize Sentry in production or staging
  const environment = import.meta.env.VITE_ENVIRONMENT;
  const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

  if (!enableAnalytics || environment === 'development') {
    console.log('Monitoring disabled for development environment');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment,
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/.*\.floatflow\.com/,
      /^https:\/\/.*\.floatflow-staging\.com/
    ],
    integrations: [
      browserTracingIntegration({
        // You can customize instrumentation behavior as needed
        instrumentPageLoad: true,
        instrumentNavigation: true,
      }),
      replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 0.5, // 10% in prod, 50% in staging
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION,
    // Error filtering
    beforeSend(event) {
      // Filter out network errors that are expected (like offline scenarios)
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes('Network Error') ||
            error?.value?.includes('Failed to fetch')) {
          // Only send if it's not a common network issue
          return event.tags?.severity === 'fatal' ? event : null;
        }
      }
      return event;
    },
  });

  console.log(`Monitoring initialized for ${environment} environment`);
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    tags: {
      component: 'frontend',
    },
    extra: context,
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUser = (user: { id: string; email: string; role: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

export const clearUser = () => {
  Sentry.setUser(null);
};