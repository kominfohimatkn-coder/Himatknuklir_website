'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/lib/react-router-dom-shim'
import Dropdown from '../../components/dropdown'
import Loading from '../../components/Loading'
import { useVisit } from '../../hooks/useVisit'
import { api, mediaUrl } from '../../lib/api'
import { truncate } from '../../lib/content'
import { formatDate } from '../../lib/format'

export default function NewsPage({ initialData = null }) {
  const [items, setItems] = useState(initialData?.items || null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [error, setError] = useState('')
  useVisit('Arsip Publikasi')

  useEffect(() => {
    if (initialData?.items) {
      return undefined
    }

    let active = true

    api('/api/public/news?limit=50')
      .then(data => {
        if (active) setItems(data.items)
      })
      .catch(err => {
        if (active) setError(err.message)
      })

    return () => {
      active = false
    }
  }, [initialData])

  const visible = useMemo(() => {
    if (!items) return []
    const needle = query.trim().toLowerCase()
    const filtered = items.filter(item => `${item.judul} ${item.ringkasan || ''} ${(item.tags || []).join(' ')}`.toLowerCase().includes(needle))
    return [...filtered].sort((a, b) => {
      const left = new Date(a.created_at || 0).getTime()
      const right = new Date(b.created_at || 0).getTime()
      return sort === 'oldest' ? left - right : right - left
    })
  }, [items, query, sort])

  if (!items && !error) return <Loading full />

  return (
    <main className="min-h-screen pt-28 pb-24">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <a href="/#berita" className="group inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-primary-900">
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali ke Beranda
          </a>
        </div>

        <div className="mb-12 border-b border-slate-100 pb-10">
          <span className="mb-3 block font-mono text-xs font-bold uppercase tracking-widest text-primary-800">Media & Arsip</span>
          <h1 className="mb-4 font-serif text-4xl font-bold text-slate-900 md:text-5xl">Publikasi HIMATKN</h1>
          <p className="max-w-2xl text-lg text-slate-500">Kumpulan berita, rilis resmi, dan dokumentasi program kerja dari Kabinet Nexus Politeknik Teknologi Nuklir Indonesia.</p>
        </div>

        <div className="mb-10 flex flex-col items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 shadow-sm sm:flex-row">
          <div className="relative w-full sm:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input value={query} onChange={event => setQuery(event.target.value)} className="filter-input pl-9" placeholder="Cari berdasarkan judul atau isi berita..." />
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Urutkan:</span>
            <Dropdown
              value={sort}
              onChange={setSort}
              options={[
                { value: 'newest', label: 'Paling Baru' },
                { value: 'oldest', label: 'Paling Lama' },
              ]}
              variant="public"
              compact
              showDescription={false}
              ariaLabel="Urutkan publikasi"
              className="min-w-44 flex-1 sm:flex-none"
            />
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-center text-sm font-bold text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(item => (
            <Link to={`/berita/${item.slug}`} className="news-card" key={item.id}>
              <div className="news-img-wrap">
                {item.gambar_url ? <img src={mediaUrl(item.gambar_url)} alt={item.judul} className="news-img" /> : <div className="flex h-full items-center justify-center font-mono text-xs font-bold uppercase tracking-widest text-primary-800">HIMATKN</div>}
              </div>
              <div className="news-body">
                <div className="news-meta"><span>{formatDate(item.created_at)}</span><span className="tag">{item.tags?.[0] || 'Informasi'}</span></div>
                <h3 className="news-title">{item.judul}</h3>
                <p className="news-desc">{truncate(item.ringkasan || '', 150)}</p>
                <span className="news-read">Baca Selengkapnya<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></span>
              </div>
            </Link>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-300">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5L18.5 8H20" /></svg>
            </div>
            <h3 className="mb-2 font-serif text-xl font-bold text-slate-800">Publikasi Tidak Ditemukan</h3>
            <p className="font-medium text-slate-500">Coba gunakan kata kunci lain dalam pencarian Anda.</p>
            <button type="button" onClick={() => { setQuery(''); setSort('newest') }} className="mt-6 rounded border border-primary-200 bg-primary-50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-primary-800 transition hover:bg-primary-100">Reset Filter</button>
          </div>
        )}
      </div>
    </main>
  )
}
