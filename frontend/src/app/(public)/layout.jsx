import PublicLayout from '@/layouts/PublicLayout'
import { defaultConfig } from '@/lib/defaultConfig'
import { getConfig } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export default async function Layout({ children }) {
  const config = await getConfig().catch(() => defaultConfig)

  return (
    <PublicLayout initialConfig={{ ...defaultConfig, ...config }}>
      {children}
    </PublicLayout>
  )
}
