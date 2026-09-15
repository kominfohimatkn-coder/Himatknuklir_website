import { cookies } from 'next/headers'

export const FASTAPI_BASE_URL = (
  process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '')

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '')

function getErrorMessage(data, status) {
  if (!data) return `Permintaan gagal (${status})`
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail
      .map(item => {
        if (typeof item === 'string') return item
        const location = Array.isArray(item.loc) ? item.loc.join(' → ') : ''
        return `${location ? `${location}: ` : ''}${item.msg || 'Data tidak valid'}`
      })
      .join(', ')
  }
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return `Permintaan gagal (${status})`
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    const error = new Error(getErrorMessage(data, response.status))
    error.status = response.status
    throw error
  }

  return data
}

export async function publicFetch(path) {
  const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'identity',
    },
    cache: 'no-store',
  })

  return parseResponse(response)
}

export async function privateFetch(path) {
  const cookieStore = await cookies()
  const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'identity',
      Cookie: cookieStore.get('himatkn_access') ? `himatkn_access=${cookieStore.get('himatkn_access').value}` : '',
    },
    cache: 'no-store',
  })

  if (response.status === 401 || response.status === 403) return null
  return parseResponse(response)
}

export async function getConfig() {
  const data = await publicFetch('/api/public/config')
  return data?.config || {}
}

export function getHome() {
  return publicFetch('/api/public/home')
}

export function getNews(limit = 50) {
  return publicFetch(`/api/public/news?limit=${limit}`)
}

export function getNewsDetail(identifier) {
  return publicFetch(`/api/public/news/${encodeURIComponent(identifier)}`)
}

export function getStructure() {
  return publicFetch('/api/public/structure')
}

export async function getCurrentAdmin() {
  const data = await privateFetch('/api/auth/me')
  return data?.user || data || null
}
