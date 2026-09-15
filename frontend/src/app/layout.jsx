import './globals.css'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'HIMATKN — Himpunan Mahasiswa Teknokimia Nuklir',
    template: '%s | HIMATKN',
  },
  description:
    'Himpunan Mahasiswa Teknokimia Nuklir, Politeknik Teknologi Nuklir Indonesia.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'HIMATKN',
    title: 'HIMATKN — Himpunan Mahasiswa Teknokimia Nuklir',
    description:
      'Website resmi HIMA Teknokimia Nuklir Politeknik Teknologi Nuklir Indonesia.',
    images: ['/icon.png'],
  },
  twitter: {
    card: 'summary',
    title: 'HIMATKN',
    description:
      'Website resmi HIMA Teknokimia Nuklir Politeknik Teknologi Nuklir Indonesia.',
    images: ['/icon.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
