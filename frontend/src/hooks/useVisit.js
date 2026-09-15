'use client'

import { useEffect } from 'react'
import { api } from '../lib/api'

const recentVisits = new Map()
const DUPLICATE_WINDOW_MS = 1500

export function useVisit(page) {
  useEffect(() => {
    if (!page) return

    const now = Date.now()
    const lastSentAt = recentVisits.get(page) || 0

    // React Strict Mode dapat menjalankan effect dua kali di development.
    // Cegah pencatatan kunjungan ganda yang terjadi dalam waktu sangat dekat.
    if (now - lastSentAt < DUPLICATE_WINDOW_MS) {
      return
    }

    recentVisits.set(page, now)

    api('/api/public/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        halaman: page,
      }),
    }).catch(() => {
      // Statistik kunjungan tidak boleh mengganggu pengalaman pengguna.
    })
  }, [page])
}
