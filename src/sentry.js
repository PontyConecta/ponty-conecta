import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

if (import.meta.env.PROD && DSN) {
  Sentry.init({
    dsn: DSN,
    environment: 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      if (event.user?.email) {
        event.user.email = event.user.email.replace(/(.{2}).*(@.*)/, '$1***$2');
      }
      return event;
    },
  });
}

export { Sentry };