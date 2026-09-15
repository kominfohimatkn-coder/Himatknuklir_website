import NewsAdminPage from '@/screens/admin/NewsAdminPage'
import { requireAdminPermission } from '@/lib/adminRouteGuard'
import { PERMISSIONS } from '@/lib/adminPermissions'

export const metadata = { title: 'Manajemen Publikasi', robots: { index: false } }

export default async function Page() {
  await requireAdminPermission(PERMISSIONS.news)
  return <NewsAdminPage />
}
