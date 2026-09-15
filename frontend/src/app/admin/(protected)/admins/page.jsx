import AdminsAdminPage from '@/screens/admin/AdminsAdminPage'
import { requireAdminPermission } from '@/lib/adminRouteGuard'
import { PERMISSIONS } from '@/lib/adminPermissions'

export const metadata = {
  title: 'Administrator & Role',
  robots: { index: false },
}

export default async function Page() {
  await requireAdminPermission(PERMISSIONS.admins)
  return <AdminsAdminPage />
}
