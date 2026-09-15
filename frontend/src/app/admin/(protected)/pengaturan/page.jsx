import SettingsPage from '@/screens/admin/SettingsPage'
import { requireAdminPermission } from '@/lib/adminRouteGuard'
import { PERMISSIONS } from '@/lib/adminPermissions'

export const metadata = { title: 'Pengaturan Website', robots: { index: false } }

export default async function Page() {
  await requireAdminPermission(PERMISSIONS.settings)
  return <SettingsPage />
}
