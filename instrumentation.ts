import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (!process.env.SENTRY_DSN) {
    return
  }

  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enabled: true,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    })
  }
}

export const onRequestError = Sentry.captureRequestError
