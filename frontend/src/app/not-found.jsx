import PublicLayout from '@/layouts/PublicLayout'
import NotFoundPage from '@/screens/public/NotFoundPage'
import { defaultConfig } from '@/lib/defaultConfig'
import { getConfig } from '@/lib/server-api'

export const metadata = {
  title: '404 — Not Found',
  robots: { index: false, follow: false },
}

export default async function NotFound() {
  const config = await getConfig().catch(() => defaultConfig)

  return (
    <PublicLayout initialConfig={{ ...defaultConfig, ...config }}>
      <NotFoundPage />
    </PublicLayout>
  )
}
