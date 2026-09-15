import DashboardPage from '@/screens/admin/DashboardPage'
import { requireAdminPermission } from '@/lib/adminRouteGuard'
import { PERMISSIONS } from '@/lib/adminPermissions'

export const metadata = { title: 'Dashboard Admin', robots: { index: false } }

export default async function Page() {
  await requireAdminPermission(PERMISSIONS.dashboard)
  return <DashboardPage />
}
