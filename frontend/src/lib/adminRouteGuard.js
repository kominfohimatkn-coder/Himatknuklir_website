import { redirect } from 'next/navigation'
import { getCurrentAdmin } from './server-api'
import { getDefaultAdminPath, hasPermission } from './adminPermissions'

export async function requireAdminPermission(permission) {
  const user = await getCurrentAdmin().catch(() => null)

  if (!user) {
    redirect('/admin/login')
  }

  if (!hasPermission(user, permission)) {
    redirect(getDefaultAdminPath(user))
  }

  return user
}
