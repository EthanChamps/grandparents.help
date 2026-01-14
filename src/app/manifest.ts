import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GuardRails - Tech Help for Seniors',
    short_name: 'GuardRails',
    description: 'Get help with technology questions',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1a1a',
    theme_color: '#fbbf24',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
