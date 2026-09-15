import { redirect } from 'next/navigation'
import AdminLayout from '@/layouts/AdminLayout'
import { AuthProvider } from '@/context/AuthContext'
import { getCurrentAdmin } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export default async function Layout({ children }) {
  const user = await getCurrentAdmin().catch(() => null)
  if (!user) redirect('/admin/login')

  return (
    <AuthProvider initialUser={user}>
      <AdminLayout>{children}</AdminLayout>
    </AuthProvider>
  )
}
