import NewsPage from '@/screens/public/NewsPage'
import { getNews } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Publikasi',
  description: 'Kumpulan berita, rilis resmi, dan dokumentasi program kerja HIMATKN.',
  alternates: { canonical: '/berita' },
}

export default async function Page() {
  const data = await getNews(50).catch(() => null)
  return <NewsPage initialData={data} />
}
