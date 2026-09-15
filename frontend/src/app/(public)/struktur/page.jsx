import StructurePage from '@/screens/public/StructurePage'
import { getStructure } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Struktur Kepengurusan',
  description: 'Susunan kepengurusan HIMA Teknokimia Nuklir.',
  alternates: { canonical: '/struktur' },
}

export default async function Page() {
  const data = await getStructure().catch(() => null)
  return <StructurePage initialData={data} />
}
