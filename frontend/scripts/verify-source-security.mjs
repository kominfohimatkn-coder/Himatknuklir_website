import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const clientForbidden = ['JWT_SECRET_KEY','DATABASE_URL','MYSQL_URL','DB_PASSWORD','BLOB_READ_WRITE_TOKEN','FASTAPI_BASE_URL','dangerouslySetInnerHTML']

function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);e.isDirectory()?out.push(...walk(p)):out.push(p)}return out}
for(const file of walk(root)){
  const text=fs.readFileSync(file,'utf8')
  if (text.includes('dangerouslySetInnerHTML')) { console.error('Forbidden XSS sink found in frontend source.'); process.exit(1) }
  if (/^['\"]use client['\"];?/m.test(text)) {
    for(const item of clientForbidden.filter(x=>x!=='dangerouslySetInnerHTML')){
      if(text.includes(item)){console.error(`Server-only environment name found in a client module: ${item}`);process.exit(1)}
    }
  }
}
console.log('Frontend source security scan passed.')
