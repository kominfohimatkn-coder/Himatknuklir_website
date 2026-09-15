import HomePage from '@/screens/public/HomePage'
import { getHome } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Beranda',
  alternates: { canonical: '/' },
}

export default async function Page() {
  const data = await getHome().catch(() => null)
  return <HomePage initialData={data} />
}
