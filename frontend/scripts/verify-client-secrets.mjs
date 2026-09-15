import fs from 'node:fs'
import path from 'node:path'

const forbidden = [
  'JWT_SECRET_KEY',
  'DATABASE_URL',
  'MYSQL_URL',
  'DB_PASSWORD',
  'BLOB_READ_WRITE_TOKEN',
  'FASTAPI_BASE_URL',
]

const root = path.resolve('.next/static')
if (!fs.existsSync(root)) {
  console.error('Production build directory .next/static does not exist; run npm run build first.')
  process.exit(2)
}

function walk(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(full))
    else result.push(full)
  }
  return result
}

for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8')
  for (const secretName of forbidden) {
    if (text.includes(secretName)) {
      console.error(`Forbidden server-only environment name found in client static bundle: ${secretName}`)
      process.exit(1)
    }
  }
}
console.log('Client static bundle contains no forbidden server-only environment names.')
