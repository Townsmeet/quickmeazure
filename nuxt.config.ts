// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-04-08',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/seo',
    '@pinia/nuxt',
    '@sentry/nuxt/module',
    '@vite-pwa/nuxt',
    '@nuxt/test-utils/module',
  ],

  components: [{ path: '~/components', pathPrefix: false }],

  runtimeConfig: {
    paystackSecretKey: process.env.NUXT_PAYSTACK_SECRET_KEY,
    jwtSecret: process.env.NUXT_JWT_SECRET,

    turso: {
      databaseUrl: process.env.NUXT_TURSO_DATABASE_URL,
      authToken: process.env.NUXT_TURSO_AUTH_TOKEN,
    },

    brevoApiKey: process.env.NUXT_BREVO_API_KEY,

    s3: {
      accessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY,
      region: process.env.NUXT_S3_REGION,
      bucket: process.env.NUXT_S3_BUCKET,
      endpoint: process.env.NUXT_S3_ENDPOINT, // optional for compatible providers
      forcePathStyle: process.env.NUXT_S3_FORCE_PATH_STYLE === 'true',
      publicBaseUrl: process.env.NUXT_S3_PUBLIC_BASE_URL, // optional CDN/public base
    },

    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      s3PublicBaseUrl: process.env.NUXT_S3_PUBLIC_BASE_URL,
      googleClientId: process.env.NUXT_GOOGLE_CLIENT_ID,
      paystackKey: process.env.NUXT_PAYSTACK_PUBLIC_KEY,
    },
  },

  // Sourcemap configuration for Sentry
  sourcemap: {
    client: true,
    server: true,
  },

  nitro: {
    imports: {
      exclude: ['readValidatedBody'],
    },
  },
})
