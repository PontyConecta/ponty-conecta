import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN || "https://b71fe61294ea4eb54b9efb31d0bd4207@o4511316924563456.ingest.de.sentry.io/4511316939767888";

// Init sempre que houver DSN. Removemos a checagem de PROD porque algumas
// plataformas de hosting não setam import.meta.env.PROD corretamente.
if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE || 'production',

    // Error Monitoring — base
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      // Captura console.error e console.warn como eventos
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],

    // Performance: 20% das transações
    tracesSampleRate: 0.2,

    // Session Replay
    // 10% das sessões normais (sample), 100% das sessões com erro
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Privacidade
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      if (event.user?.email) {
        event.user.email = event.user.email.replace(/(.{2}).*(@.*)/, '$1***$2');
      }
      return event;
    },
  });

  // Marcador para validação manual no console do navegador
  if (typeof window !== 'undefined') {
    window.__pontySentryReady = true;
  }
}

export { Sentry };