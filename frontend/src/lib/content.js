export function stripHtml(value = '') {
  if (!value) return ''

  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncate(value = '', length = 160) {
  const clean = stripHtml(value)
  return clean.length > length ? `${clean.slice(0, length).trimEnd()}...` : clean
}

export function memberTier(jabatan = '') {
  const text = jabatan.toLowerCase()
  if ((text.includes('ketua') || text.includes('kepala') || text.includes('pembimbing') || text.includes('dosen')) && !text.includes('wakil')) return 1
  if (text.includes('wakil')) return 2
  return 3
}

export function memberBadge(jabatan = '') {
  const text = jabatan.toLowerCase()
  if (text.includes('pembimbing') || text.includes('dosen')) return 'badge-pembimbing'
  if ((text.includes('ketua') || text.includes('kepala')) && !text.includes('wakil')) return 'badge-ketua'
  if (text.includes('wakil')) return 'badge-wakil'
  if (text.includes('sekretaris')) return 'badge-sekretaris'
  if (text.includes('bendahara')) return 'badge-bendahara'
  return 'badge-default'
}
