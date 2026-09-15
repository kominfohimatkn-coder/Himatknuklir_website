const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

function getErrorMessage(data, status) {
  if (status === 401) return 'Sesi tidak valid atau sudah berakhir.'
  if (status === 403) return 'Anda tidak memiliki akses.'
  if (status === 404) return 'Data atau endpoint tidak ditemukan.'
  if (status === 409) return 'Permintaan bertentangan dengan data yang ada.'
  if (status === 429) return 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
  if (!data) return `Permintaan gagal (${status})`
  if (Array.isArray(data.detail)) {
    return data.detail.map(item => typeof item === 'string' ? item : item?.msg || 'Data tidak valid').join(', ')
  }
  if (typeof data.detail === 'string') return data.detail
  return `Permintaan gagal (${status})`
}

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
  })

  if (response.status === 204) return undefined

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null

  if (!response.ok) throw new Error(getErrorMessage(data, response.status))
  return data
}

export function mediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path}`
}
