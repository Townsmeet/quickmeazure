import * as Sentry from '@sentry/nuxt'

// Only initialize Sentry in production mode
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://examplePublicKey@o0.ingest.sentry.io/0',
    tracesSampleRate: 1.0,
    environment: 'production',
  })
} else {
  console.log('Sentry disabled in development mode')
}
