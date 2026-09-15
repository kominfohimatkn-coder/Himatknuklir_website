'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  Copy,
  MessageCircle,
  Send,
  Share2,
  UsersRound,
} from 'lucide-react'
import { Link, useParams } from '@/lib/react-router-dom-shim'
import Loading from '../../components/Loading'
import { useVisit } from '../../hooks/useVisit'
import { api, mediaUrl } from '../../lib/api'
import { formatDate } from '../../lib/format'

export default function NewsDetailPage({ initialData = null, initialIdentifier = '' }) {
  const params = useParams()
  const identifier = initialIdentifier || params.slug || params.id || ''
  const [data, setData] = useState(initialData)
  const [error, setError] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const shareRef = useRef(null)

  useVisit(`Publikasi ${identifier}`)

  useEffect(() => {
    if (initialData && initialIdentifier === identifier) {
      return undefined
    }

    let active = true
    setData(null)
    setError('')

    api(`/api/public/news/${encodeURIComponent(identifier)}`)
      .then(result => {
        if (active) setData(result)
      })
      .catch(err => {
        if (active) setError(err.message)
      })

    return () => {
      active = false
    }
  }, [identifier, initialData, initialIdentifier])

  useEffect(() => {
    function closeMenu(event) {
      if (
        shareRef.current &&
        !shareRef.current.contains(event.target)
      ) {
        setShareOpen(false)
      }
    }

    function closeWithEscape(event) {
      if (event.key === 'Escape') setShareOpen(false)
    }

    document.addEventListener('pointerdown', closeMenu)
    document.addEventListener('keydown', closeWithEscape)

    return () => {
      document.removeEventListener('pointerdown', closeMenu)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [])

  if (!data && !error) return <Loading full />

  if (error) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-32 text-center">
        <p className="font-mono text-sm font-bold uppercase tracking-widest text-red-700">
          {error}
        </p>
        <Link
          to="/berita"
          className="mt-6 inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:border-primary-800 hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Publikasi
        </Link>
      </main>
    )
  }

  const { berita, berita_lainnya: related = [] } = data
  const tags = berita.tags?.length ? berita.tags : ['Informasi']
  const articleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/berita/${berita.slug}`
    : `/berita/${berita.slug}`
  const shareText = `${berita.judul}\n${articleUrl}`

  function notify(message) {
    setShareMessage(message)
    window.setTimeout(() => setShareMessage(''), 2500)
  }

  function openPlatform(url) {
    window.open(
      url,
      '_blank',
      'noopener,noreferrer,width=720,height=680',
    )
    setShareOpen(false)
  }

  async function copyLink(
    message = 'Tautan artikel berhasil disalin.',
  ) {
    try {
      await navigator.clipboard.writeText(articleUrl)
      notify(message)
      setShareOpen(false)
    } catch {
      notify('Gagal menyalin tautan. Salin alamat dari bilah browser.')
    }
  }

  async function shareNative() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: berita.judul,
          text: berita.judul,
          url: articleUrl,
        })
        setShareOpen(false)
        return
      }

      await copyLink()
    } catch (err) {
      if (err?.name !== 'AbortError') {
        notify('Bagikan artikel melalui menu browser.')
      }
    }
  }

  const shareItems = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      action: () =>
        openPlatform(
          `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        ),
    },
    {
      label: 'Telegram',
      icon: Send,
      action: () =>
        openPlatform(
          `https://t.me/share/url?url=${encodeURIComponent(
            articleUrl,
          )}&text=${encodeURIComponent(berita.judul)}`,
        ),
    },
    {
      label: 'Facebook',
      icon: UsersRound,
      action: () =>
        openPlatform(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            articleUrl,
          )}`,
        ),
    },
    {
      label: 'Instagram',
      icon: Camera,
      action: async () => {
        if (navigator.share) {
          await shareNative()
        } else {
          await copyLink(
            'Tautan disalin. Tempelkan ke Story, bio, atau pesan Instagram.',
          )
        }
      },
    },
    {
      label: 'Salin Tautan',
      icon: Copy,
      action: () => copyLink(),
    },
  ]

  return (
    <main className="flex-grow bg-[#fcfefb] pb-24 pt-32">
      <article className="mx-auto min-w-0 max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <a
            href="/#berita"
            className="group inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-primary-900"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Beranda
          </a>
        </div>

        <header className="mb-12 min-w-0">
          <div className="mb-6 flex min-w-0 flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-widest">
            <span className="max-w-full break-words rounded border border-primary-200 bg-primary-100 px-3 py-1 font-bold text-primary-900 [overflow-wrap:anywhere]">
              {tags[0]}
            </span>
            <time className="font-medium text-slate-500">
              {formatDate(berita.created_at)}
            </time>
          </div>

          <h1 className="mb-8 max-w-full break-words font-serif text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 [overflow-wrap:anywhere] md:text-5xl lg:text-[3.5rem]">
            {berita.judul}
          </h1>

          <div className="flex min-w-0 flex-col gap-4 border-y border-slate-100 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 font-serif font-bold uppercase text-slate-600">
                A
              </div>
              <div className="min-w-0">
                <p className="break-words font-sans font-bold text-slate-900 [overflow-wrap:anywhere]">
                  Admin HIMATKN
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  Tim Publikasi
                </p>
              </div>
            </div>

            <div ref={shareRef} className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShareOpen(value => !value)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 transition hover:bg-slate-100 active:scale-[.98] sm:w-auto"
                aria-haspopup="menu"
                aria-expanded={shareOpen}
              >
                <Share2 className="h-4 w-4" />
                Bagikan
              </button>

              {shareOpen && (
                <div
                  role="menu"
                  className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded border border-slate-200 bg-white p-1.5 shadow-xl sm:left-auto sm:w-56"
                >
                  {shareItems.map(({ label, icon: Icon, action }) => (
                    <button
                      key={label}
                      type="button"
                      role="menuitem"
                      onClick={action}
                      className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-950"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary-800" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {shareMessage && (
            <p className="mt-3 max-w-full break-words rounded border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-900 [overflow-wrap:anywhere]">
              {shareMessage}
            </p>
          )}
        </header>

        {berita.gambar_url && (
          <figure className="group relative mb-16 aspect-[16/9] max-h-[520px] w-full overflow-hidden rounded-md border border-slate-100 bg-slate-50 md:aspect-[21/9]">
            <img
              src={mediaUrl(berita.gambar_url)}
              alt={berita.judul}
              className="h-full w-full object-cover grayscale-[20%] transition-all duration-1000 group-hover:scale-[1.03] group-hover:grayscale-0"
            />
            <figcaption className="absolute bottom-3 right-3 rounded bg-slate-900/80 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-50 backdrop-blur-sm sm:bottom-4 sm:right-6">
              Dokumentasi HIMATKN
            </figcaption>
          </figure>
        )}

        <div
          className="editorial-content mx-auto min-w-0 max-w-3xl break-words whitespace-pre-wrap font-sans text-base leading-8 text-slate-800 [overflow-wrap:anywhere]"
          style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
        >
          {String(berita.konten || '')}
        </div>

        <div className="mx-auto mt-16 flex min-w-0 max-w-3xl flex-col justify-between gap-5 border-t border-slate-200 pt-8 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest">
            <span className="shrink-0 font-bold text-slate-500">Tag:</span>
            {tags.map(tag => (
              <span
                key={tag}
                className="max-w-full break-words rounded border border-slate-100 bg-slate-50 px-3 py-1 font-semibold text-slate-600 [overflow-wrap:anywhere]"
              >
                {tag}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={shareNative}
            className="flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 transition hover:bg-slate-100 active:scale-[.98] sm:w-auto"
          >
            <Share2 className="h-4 w-4" />
            Bagikan Artikel
          </button>
        </div>
      </article>

      {related.length > 0 && (
        <aside className="mx-auto mt-24 min-w-0 max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 border-b border-slate-100 pb-4 text-center font-serif text-3xl font-bold text-slate-900 sm:text-left">
            Baca Juga
          </h2>

          <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
            {related.map(item => (
              <Link
                to={`/berita/${item.slug}`}
                className="group min-w-0"
                key={item.id}
              >
                <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                  {item.gambar_url ? (
                    <img
                      src={mediaUrl(item.gambar_url)}
                      alt={item.judul}
                      className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-xs font-bold text-primary-800">
                      HIMATKN
                    </div>
                  )}
                </div>

                <time className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {formatDate(item.created_at)}
                </time>

                <h3 className="line-clamp-3 max-w-full break-words font-serif text-xl font-bold leading-snug text-slate-900 [overflow-wrap:anywhere]">
                  <span className="hover-underline-animation">
                    {item.judul}
                  </span>
                </h3>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </main>
  )
}
