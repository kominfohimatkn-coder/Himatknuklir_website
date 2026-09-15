import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/server-api'
import { getDefaultAdminPath } from '@/lib/adminPermissions'

export default async function Page() {
  const user = await getCurrentAdmin().catch(() => null)
  if (!user) redirect('/admin/login')
  redirect(getDefaultAdminPath(user))
}
