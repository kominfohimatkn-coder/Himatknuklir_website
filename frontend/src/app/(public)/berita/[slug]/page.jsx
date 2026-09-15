import NewsDetailPage from '@/screens/public/NewsDetailPage'
import { getNewsDetail, SITE_URL } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const data = await getNewsDetail(slug).catch(() => null)
  const berita = data?.berita

  if (!berita) {
    return { title: 'Publikasi Tidak Ditemukan', robots: { index: false } }
  }

  const image = berita.gambar_url || '/icon.png'
  const absoluteImage = /^https?:\/\//i.test(image) ? image : `${SITE_URL}${image}`

  return {
    title: berita.judul,
    description: berita.ringkasan || 'Publikasi HIMATKN',
    alternates: { canonical: `/berita/${berita.slug}` },
    openGraph: {
      type: 'article',
      title: berita.judul,
      description: berita.ringkasan || 'Publikasi HIMATKN',
      url: `/berita/${berita.slug}`,
      images: [absoluteImage],
    },
  }
}

export default async function Page({ params }) {
  const { slug } = await params
  const data = await getNewsDetail(slug).catch(() => null)
  return <NewsDetailPage initialData={data} initialIdentifier={slug} />
}
