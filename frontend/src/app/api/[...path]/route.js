import { FASTAPI_BASE_URL } from '@/lib/server-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_REQUEST_HEADERS = new Set([
  'accept', 'content-type', 'origin', 'referer', 'user-agent',
  'x-csrf-token', 'x-requested-with',
])

function getAccessCookie(cookieHeader = '') {
  const item = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith('himatkn_access='))
  return item ? item.slice('himatkn_access='.length) : ''
}

const RESPONSE_HEADERS_TO_SKIP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'content-length', 'content-encoding',
  'server',
])

async function proxy(request, context) {
  const { path = [] } = await context.params
  const sourceUrl = new URL(request.url)
  const encodedPath = path.map(segment => encodeURIComponent(segment)).join('/')
  const targetUrl = `${FASTAPI_BASE_URL}/api/${encodedPath}${sourceUrl.search}`

  const requestHeaders = new Headers()
  request.headers.forEach((value, key) => {
    if (ALLOWED_REQUEST_HEADERS.has(key.toLowerCase())) requestHeaders.set(key, value)
  })
  requestHeaders.set('accept-encoding', 'identity')
  const accessCookie = getAccessCookie(request.headers.get('cookie') || '')
  if (accessCookie) requestHeaders.set('cookie', `himatkn_access=${accessCookie}`)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) requestHeaders.set('x-forwarded-for', forwardedFor)
  requestHeaders.set('x-forwarded-host', sourceUrl.host)
  requestHeaders.set('x-forwarded-proto', sourceUrl.protocol.replace(':', ''))

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  let upstreamResponse
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    })
  } catch {
    return Response.json({ detail: 'Backend FastAPI tidak dapat dihubungi' }, { status: 502 })
  }

  const responseHeaders = new Headers()
  upstreamResponse.headers.forEach((value, key) => {
    if (!RESPONSE_HEADERS_TO_SKIP.has(key.toLowerCase())) responseHeaders.append(key, value)
  })

  const setCookies = upstreamResponse.headers.getSetCookie?.() || []
  if (setCookies.length) {
    responseHeaders.delete('set-cookie')
    for (const cookie of setCookies) responseHeaders.append('set-cookie', cookie)
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
