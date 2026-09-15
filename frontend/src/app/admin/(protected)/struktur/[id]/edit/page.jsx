import MemberFormPage from '@/screens/admin/MemberFormPage'
import { requireAdminPermission } from '@/lib/adminRouteGuard'
import { PERMISSIONS } from '@/lib/adminPermissions'

export const metadata = { title: 'Edit Fungsionaris', robots: { index: false } }

export default async function Page() {
  await requireAdminPermission(PERMISSIONS.members)
  return <MemberFormPage mode="edit" />
}
