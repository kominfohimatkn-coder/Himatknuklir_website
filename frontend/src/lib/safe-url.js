const ALLOWED_HOSTS = new Set([
  'instagram.com',
  'www.instagram.com',
  'drive.google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
])

export function safeExternalUrl(value, fallback = '#') {
  const raw = String(value || '').trim()
  if (!raw) return fallback
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) return fallback
    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return fallback
    return url.href
  } catch {
    return fallback
  }
}
