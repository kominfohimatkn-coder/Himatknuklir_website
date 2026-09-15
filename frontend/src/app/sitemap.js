import { getNews, SITE_URL } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const base = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/berita`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/struktur`, changeFrequency: 'monthly', priority: 0.7 },
  ]

  const data = await getNews(1000).catch(() => null)
  const news = (data?.items || []).map(item => ({
    url: `${SITE_URL}/berita/${item.slug}`,
    lastModified: item.updated_at || item.created_at || undefined,
    changeFrequency: 'monthly',
    priority: 0.65,
  }))

  return [...base, ...news]
}
