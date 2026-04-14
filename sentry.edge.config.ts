import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN, // graceful no-op if DSN not set
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
