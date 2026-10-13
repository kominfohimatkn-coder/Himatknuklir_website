
import HomePage from '@/screens/public/HomePage'
import { getHome } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Beranda',
  alternates: { canonical: '/' },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'HIMATKN',
  alternateName: [
    'Himpunan Mahasiswa Teknokimia Nuklir',
    'HimaTKNuklir',
    'himatknuklir.vercel.app',
  ],
  url: 'https://himatknuklir.vercel.app/',
}

export default async function Page() {
  const data = await getHome().catch(() => null)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(
            /</g,
            '\\u003c',
          ),
        }}
      />

      <HomePage initialData={data} />
    </>
  )
}
