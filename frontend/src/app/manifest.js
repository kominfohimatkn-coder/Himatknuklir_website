export default function manifest() {
  return {
    name: 'HIMA Teknokimia Nuklir',
    short_name: 'HIMATKN',
    description: 'Website resmi HIMA Teknokimia Nuklir.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f8f5',
    theme_color: '#06261b',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
