import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Fetch data inside useEffect is intentional for the client-side admin CRUD managers.
      'react-hooks/set-state-in-effect': 'off',
      // Upload media berasal dari backend/storage yang domain akhirnya belum ditetapkan.
      // Setelah domain storage final, migrasikan ke next/image dan hapus pengecualian ini.
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
