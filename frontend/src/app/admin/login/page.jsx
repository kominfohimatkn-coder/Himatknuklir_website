import LoginPage from '@/screens/admin/LoginPage'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  )
}
