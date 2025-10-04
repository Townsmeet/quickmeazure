// Add PWA manifest link to head
export default defineNuxtPlugin(() => {
  useHead({
    link: [
      {
        rel: 'manifest',
        href: '/manifest.webmanifest',
      },
    ],
  })
})
