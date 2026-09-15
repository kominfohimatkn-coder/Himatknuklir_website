import ProgramsAdminPage from '@/screens/admin/ProgramsAdminPage'
import { requireAdminPermission } from '@/lib/adminRouteGuard'
import { PERMISSIONS } from '@/lib/adminPermissions'

export const metadata = { title: 'Program Kerja Admin', robots: { index: false } }

export default async function Page() {
  await requireAdminPermission(PERMISSIONS.programs)
  return <ProgramsAdminPage />
}
