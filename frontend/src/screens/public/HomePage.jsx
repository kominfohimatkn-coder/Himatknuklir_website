'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Mail,
  UsersRound,
} from 'lucide-react'
import { Link } from '@/lib/react-router-dom-shim'

import { useVisit } from '../../hooks/useVisit'
import { api, mediaUrl } from '../../lib/api'
import { truncate } from '../../lib/content'
import { formatDate, statusLabel } from '../../lib/format'
import { safeExternalUrl } from '../../lib/safe-url'

const HOME_CACHE_KEY = 'himatkn-home-cache-v4'

function readHomeCache() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(HOME_CACHE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)

    return parsed?.data ?? null
  } catch {
    return null
  }
}

function writeHomeCache(data) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      HOME_CACHE_KEY,
      JSON.stringify({
        data,
        savedAt: Date.now(),
      }),
    )
  } catch {
    // Aplikasi tetap berjalan jika localStorage tidak tersedia.
  }
}

function statusClass(status) {
  const classes = {
    planned: 'status-planned',
    ongoing: 'status-ongoing',
    done: 'status-done',
    postponed: 'status-postponed',
    cancelled: 'status-cancelled',
  }

  return classes[status] || 'status-planned'
}

function SkeletonBlock({
  className = '',
  opacity = 0.1,
}) {
  return (
    <div
      className={`animate-pulse rounded-sm ${className}`}
      style={{
        backgroundColor: `rgba(10, 61, 45, ${opacity})`,
      }}
    />
  )
}

function HomePageSkeleton() {
  return (
    <main aria-busy="true" aria-label="Memuat halaman utama">
      <section className="relative min-h-[560px] overflow-hidden bg-[var(--g-50)] px-5 pb-16 pt-24 sm:min-h-[640px] sm:pb-28 sm:pt-36">
        <div
          aria-hidden="true"
          className="hero-grid-pattern absolute inset-0"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <SkeletonBlock className="h-3 w-44 sm:w-52" />

          <SkeletonBlock
            className="mt-7 h-11 w-full max-w-xl sm:h-16 sm:max-w-2xl"
            opacity={0.13}
          />

          <SkeletonBlock
            className="mt-3 h-11 w-full max-w-md sm:h-16 sm:max-w-lg"
            opacity={0.13}
          />

          <SkeletonBlock className="mt-7 h-4 w-full max-w-lg" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-sm" />

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <SkeletonBlock
              className="h-11 w-44"
              opacity={0.18}
            />

            <SkeletonBlock
              className="h-11 w-44"
              opacity={0.08}
            />
          </div>
        </div>
      </section>

      <section className="bg-[var(--g-100)] px-5 py-16">
        <div className="mx-auto grid max-w-[var(--wrap)] gap-10 lg:grid-cols-2">
          <div>
            <SkeletonBlock className="h-3 w-28" />

            <SkeletonBlock
              className="mt-5 h-9 w-full max-w-md"
              opacity={0.13}
            />

            <SkeletonBlock
              className="mt-3 h-9 w-full max-w-sm"
              opacity={0.13}
            />
          </div>

          <div className="space-y-4">
            {[1, 2].map(item => (
              <SkeletonBlock
                key={item}
                className="h-24 w-full"
                opacity={0.08}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function HomePageError({ message }) {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-[var(--g-50)] px-5 py-24">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-[var(--g-950)]">
          Gagal memuat halaman
        </h1>

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          {message}
        </p>

        <button
          type="button"
          className="original-btn original-btn-primary mt-7"
          onClick={() => window.location.reload()}
        >
          Coba Lagi
        </button>
      </div>
    </main>
  )
}

function MobileToggleButton({
  expanded,
  onClick,
  showLabel,
  hideLabel = 'Tampilkan Lebih Sedikit',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="
        inline-flex min-h-11 items-center justify-center gap-2
        rounded-sm border border-[var(--line)]
        bg-transparent px-5
        text-xs font-bold uppercase tracking-[0.06em]
        text-[var(--g-900)]
        transition-colors
        hover:border-[var(--g-900)]
        hover:bg-[var(--g-100)]
        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-[var(--g-900)]/10
      "
    >
      {expanded ? hideLabel : showLabel}

      {expanded ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </button>
  )
}

export default function HomePage({ initialData = null }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState('')
  const hadDataInitially = useRef(Boolean(initialData))

  const [showAllFocuses, setShowAllFocuses] = useState(false)
  const [showAllPrograms, setShowAllPrograms] = useState(false)

  useVisit('Beranda (Home)')

  useEffect(() => {
    if (initialData) {
      setData(initialData)
      setLoading(false)
      setError('')
      writeHomeCache(initialData)
      hadDataInitially.current = true

      return undefined
    }

    let active = true

    const cached = readHomeCache()

    if (cached) {
      setData(cached)
      setLoading(false)
      hadDataInitially.current = true
    }

    async function loadHome() {
      try {
        const result = await api('/api/public/home')

        if (!active) {
          return
        }

        setData(result)
        setError('')
        writeHomeCache(result)
        hadDataInitially.current = true
      } catch (err) {
        if (!active) {
          return
        }

        if (!hadDataInitially.current) {
          setError(
            err instanceof Error
              ? err.message
              : 'Data halaman utama tidak dapat dimuat.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadHome()

    return () => {
      active = false
    }
  }, [initialData])

  if (!data && loading) {
    return <HomePageSkeleton />
  }

  if (!data && error) {
    return <HomePageError message={error} />
  }

  const {
    config = {},
    berita_list: news = [],
    proker_list: programs = [],
  } = data || {}

  const heroImage = config.hero_image
    ? mediaUrl(config.hero_image)
    : ''

  /*
   * FIX:
   * instagramUrl harus didefinisikan di dalam HomePage()
   * sebelum digunakan oleh elemen <a>.
   *
   * safeExternalUrl() digunakan agar URL eksternal
   * tidak langsung dipercaya dari data konfigurasi.
   */
  const instagramUrl = safeExternalUrl(
    config.instagram_url,
  )

  const aboutItems = [1, 2, 3]
    .map(index => ({
      tag: config[`about_item_${index}_tag`] || '',
      title: config[`about_item_${index}_title`] || '',
      description:
        config[`about_item_${index}_description`] || '',
    }))
    .filter(
      item =>
        item.tag.trim() ||
        item.title.trim() ||
        item.description.trim(),
    )

  const structureItems = [1, 2, 3, 4, 5, 6]
    .map(index => ({
      kind: config[`structure_item_${index}_kind`] || '',
      title: config[`structure_item_${index}_title`] || '',
      description:
        config[`structure_item_${index}_description`] || '',
    }))
    .filter(
      item =>
        item.kind.trim() ||
        item.title.trim() ||
        item.description.trim(),
    )

  const mobileFocuses = showAllFocuses
    ? aboutItems
    : aboutItems.slice(0, 2)

  const mobilePrograms = showAllPrograms
    ? programs
    : programs.slice(0, 3)

  const mobileNews = news.slice(0, 2)

  return (
    <main>
      {/* HERO */}
      <section
        id="beranda"
        className="
          relative isolate overflow-hidden bg-cover bg-center
          pb-16 pt-20
          sm:pb-28 sm:pt-32
          md:pb-40 md:pt-48
        "
        style={{
          backgroundImage: heroImage
            ? `url("${heroImage}")`
            : 'none',
          backgroundColor: 'var(--g-50)',
        }}
      >
        <div
          aria-hidden="true"
          className="hero-overlay absolute inset-0"
        />

        <div
          aria-hidden="true"
          className="hero-grid-pattern absolute inset-0"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-7 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p
              className="eyebrow justify-center animate-fade-in-up"
              style={{ animationDelay: '50ms' }}
            >
              {config.hero_eyebrow}
            </p>

            <h1
              className="hero-title animate-fade-in-up text-center"
              style={{ animationDelay: '100ms' }}
            >
              {config.hero_title}
              <br />
              <em>{config.hero_emphasis}</em>
            </h1>

            <p
              className="lede mx-auto max-w-[34rem] animate-fade-in-up text-center"
              style={{ animationDelay: '200ms' }}
            >
              {config.hero_description}
            </p>

            <div
              className="
                mt-8 flex flex-col items-center justify-center gap-3
                animate-fade-in-up
                sm:mt-9 sm:flex-row
              "
              style={{ animationDelay: '300ms' }}
            >
              <a
                href="#kegiatan"
                className="original-btn original-btn-primary min-w-[11rem] justify-center"
              >
                {config.hero_primary_label}
              </a>

              <Link
                to="/struktur"
                className="original-btn original-btn-ghost min-w-[11rem] justify-center"
              >
                {config.hero_secondary_label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TENTANG */}
      <section className="about" id="tentang">
        {/* Mobile */}
        <div className="wrap md:hidden">
          <div className="about-text">
            <p className="eyebrow">
              {config.about_eyebrow}
            </p>

            <h2>{config.about_title}</h2>

            <p className="lede mt-4 line-clamp-4">
              {config.about_description}
            </p>
          </div>

          <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {mobileFocuses.map((item, index) => (
              <article
                key={`${item.tag || 'about'}-${index}`}
                className="py-5"
              >
                <span className="about-tag">
                  {item.tag}
                </span>

                <h3 className="mt-2 text-lg text-[var(--g-950)]">
                  {item.title}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          {aboutItems.length > 2 && (
            <div className="flex justify-center pt-6">
              <MobileToggleButton
                expanded={showAllFocuses}
                onClick={() =>
                  setShowAllFocuses(current => !current)
                }
                showLabel="Lihat Fokus Lainnya"
              />
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="wrap about-grid">
            <div className="about-text">
              <p className="eyebrow">
                {config.about_eyebrow}
              </p>

              <h2>{config.about_title}</h2>

              <p className="lede">
                {config.about_description}
              </p>
            </div>

            <div className="about-rows">
              {aboutItems.map((item, index) => (
                <article
                  className="about-row"
                  key={`${item.tag || 'about'}-${index}`}
                >
                  <span className="about-tag">
                    {item.tag}
                  </span>

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM KERJA */}
      <section className="programs" id="kegiatan">
        <div className="wrap">
          <header className="section-head">
            <div>
              <p className="eyebrow">
                {config.program_eyebrow}
              </p>

              <h2>{config.program_title}</h2>
            </div>
          </header>

          {/* Mobile */}
          <div className="md:hidden">
            <div className="space-y-3">
              {mobilePrograms.length > 0 ? (
                mobilePrograms.map(program => (
                  <article
                    key={program.id}
                    className="
                      rounded-[6px] border border-[var(--line)]
                      bg-[var(--paper)] p-4
                    "
                  >
                    <span
                      className={`status-tag ${statusClass(
                        program.status,
                      )}`}
                    >
                      {program.status === 'ongoing' && (
                        <span className="status-dot" />
                      )}

                      {statusLabel(program.status)}
                    </span>

                    <h3 className="mt-4 text-lg leading-snug text-[var(--g-950)]">
                      {program.nama_program}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                      {truncate(
                        program.deskripsi || '',
                        120,
                      )}
                    </p>

                    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                      HIMATKN · {config.period_label}
                    </p>
                  </article>
                ))
              ) : (
                <p className="empty-copy">
                  {config.program_empty_text}
                </p>
              )}
            </div>

            {programs.length > 3 && (
              <div className="flex justify-center pt-6">
                <MobileToggleButton
                  expanded={showAllPrograms}
                  onClick={() =>
                    setShowAllPrograms(current => !current)
                  }
                  showLabel="Lihat Program Lainnya"
                />
              </div>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <div className="program-list">
              {programs.length > 0 ? (
                programs.map(program => (
                  <article
                    className="program-row"
                    key={program.id}
                  >
                    <span
                      className={`status-tag ${statusClass(
                        program.status,
                      )}`}
                    >
                      {program.status === 'ongoing' && (
                        <span className="status-dot" />
                      )}

                      {statusLabel(program.status)}
                    </span>

                    <div>
                      <h3>{program.nama_program}</h3>

                      <p className="line-clamp-2">
                        {truncate(
                          program.deskripsi || '',
                          120,
                        )}
                      </p>
                    </div>

                    <span className="program-meta">
                      HIMATKN
                      <br />
                      {config.period_label}
                    </span>
                  </article>
                ))
              ) : (
                <p className="empty-copy">
                  {config.program_empty_text}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PUBLIKASI */}
      <section
        className="programs"
        id="berita"
        style={{
          borderTop: '1px solid var(--line)',
        }}
      >
        <div className="wrap">
          <header className="section-head">
            <div>
              <p className="eyebrow">
                {config.news_eyebrow}
              </p>

              <h2>{config.news_title}</h2>
            </div>
          </header>

          {/* Mobile */}
          <div className="md:hidden">
            <div className="space-y-4">
              {mobileNews.length > 0 ? (
                mobileNews.map(item => (
                  <Link
                    key={item.id}
                    to={`/berita/${item.slug}`}
                    className="
                      block overflow-hidden rounded-[6px]
                      border border-[var(--line)]
                      bg-[var(--paper)]
                      text-inherit no-underline
                    "
                  >
                    {item.gambar_url ? (
                      <img
                        src={mediaUrl(item.gambar_url)}
                        alt={
                          item.judul ||
                          'Publikasi HIMATKN'
                        }
                        className="aspect-[16/10] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center bg-[var(--g-50)] text-xs font-bold uppercase tracking-widest text-[var(--g-800)]">
                        HIMATKN
                      </div>
                    )}

                    <div className="p-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                        {formatDate(item.created_at)}
                      </p>

                      <h3 className="mt-2 text-xl leading-snug text-[var(--g-950)]">
                        {item.judul}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                        {truncate(
                          item.ringkasan || '',
                          130,
                        )}
                      </p>

                      <span className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.06em] text-[var(--g-800)]">
                        Baca Selengkapnya →
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="empty-copy">
                  {config.news_empty_text}
                </p>
              )}
            </div>

            {news.length > 0 && (
              <div className="flex justify-center pt-6">
                <Link
                  to="/berita"
                  className="original-btn original-btn-ghost justify-center"
                >
                  {config.news_more_label}
                </Link>
              </div>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <div className="program-list">
              {news.length > 0 ? (
                news.map(item => (
                  <Link
                    to={`/berita/${item.slug}`}
                    className="berita-card"
                    key={item.id}
                  >
                    {item.gambar_url ? (
                      <img
                        src={mediaUrl(item.gambar_url)}
                        alt={
                          item.judul ||
                          'Publikasi HIMATKN'
                        }
                        className="berita-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div className="berita-thumb flex items-center justify-center bg-[var(--g-50)] text-xs font-bold uppercase tracking-widest text-[var(--g-800)]">
                        HIMATKN
                      </div>
                    )}

                    <div className="berita-content">
                      <h3>{item.judul}</h3>

                      <p className="berita-desc">
                        {truncate(
                          item.ringkasan || '',
                          160,
                        )}
                      </p>

                      <div className="berita-meta">
                        <span>
                          {formatDate(item.created_at)}
                        </span>

                        <span className="berita-link">
                          Baca Selengkapnya →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="empty-copy">
                  {config.news_empty_text}
                </p>
              )}

              {news.length > 0 && (
                <div className="mt-12 flex justify-center">
                  <Link
                    to="/berita"
                    className="original-btn original-btn-ghost"
                  >
                    {config.news_more_label}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STRUKTUR */}
      <section
        className="struktur-teaser"
        id="struktur-section"
      >
        {/* Mobile */}
        <div className="wrap md:hidden">
          <p className="eyebrow on-dark">
            {config.structure_eyebrow}
          </p>

          <h2 className="text-3xl leading-tight text-[var(--g-50)]">
            {config.structure_title}
          </h2>

          <p className="mt-4 line-clamp-3 text-sm leading-6 text-[rgba(240,253,244,.65)]">
            {config.structure_description}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-[var(--line-on-dark)] bg-[var(--line-on-dark)]">
            <div className="bg-[var(--g-950)] p-5 text-center">
              <strong className="block text-3xl text-[var(--g-50)]">
                {structureItems.length}
              </strong>

              <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--g-200)]">
                Bagian
              </span>
            </div>

            <div className="bg-[var(--g-950)] p-5 text-center">
              <strong className="block text-lg text-[var(--g-50)]">
                {config.period_label || 'Nexus'}
              </strong>

              <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--g-200)]">
                Periode
              </span>
            </div>
          </div>

          <Link
            to="/struktur"
            className="original-btn original-btn-on-dark mt-7 justify-center"
          >
            <UsersRound className="h-4 w-4" />
            {config.structure_button_label}
          </Link>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="wrap">
            <header className="struktur-head">
              <p className="eyebrow on-dark">
                {config.structure_eyebrow}
              </p>

              <h2>{config.structure_title}</h2>

              <p className="lede">
                {config.structure_description}
              </p>
            </header>

            <div className="struktur-grid">
              {structureItems.map((item, index) => (
                <article
                  className="struktur-item"
                  key={`${item.title || 'structure'}-${index}`}
                >
                  <span className="struktur-kind">
                    {item.kind}
                  </span>

                  <h3>{item.title}</h3>

                  <p>{item.description}</p>
                </article>
              ))}
            </div>

            <div className="struktur-note">
              <span>{config.structure_note}</span>

              <Link
                to="/struktur"
                className="original-btn original-btn-on-dark"
              >
                {config.structure_button_label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KONTAK */}
      <section className="kontak" id="kontak">
        {/* Mobile */}
        <div className="wrap md:hidden">
          <div className="rounded-[6px] border border-[var(--line)] bg-[var(--paper)] p-6">
            <p className="eyebrow">
              {config.contact_eyebrow}
            </p>

            <h2>{config.contact_title}</h2>

            <p className="lede mt-4 line-clamp-3">
              {config.contact_description}
            </p>

            <div className="mt-7 flex flex-col items-start gap-3">
              <a
                href={
                  config.contact_email
                    ? `mailto:${config.contact_email}`
                    : '#'
                }
                className="original-btn original-btn-primary justify-center"
                aria-disabled={!config.contact_email}
                onClick={event => {
                  if (!config.contact_email) {
                    event.preventDefault()
                  }
                }}
              >
                <Mail className="h-4 w-4" />
                {config.contact_button_label}
              </a>

              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="original-btn original-btn-ghost justify-center"
                >
                  {config.instagram_label}
                </a>
              )}
            </div>

            <details className="mt-7 border-t border-[var(--line)] pt-5">
              <summary className="cursor-pointer font-mono text-xs font-bold uppercase tracking-[0.06em] text-[var(--g-900)]">
                Informasi Kontak
              </summary>

              <dl className="mt-5 space-y-5">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--g-800)]">
                    Email
                  </dt>

                  <dd className="mt-1 break-all text-sm text-[var(--g-950)]">
                    {config.contact_email}
                  </dd>
                </div>

                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--g-800)]">
                    Sekretariat
                  </dt>

                  <dd className="mt-1 text-sm leading-6 text-[var(--g-950)]">
                    {config.secretariat}
                  </dd>
                </div>
              </dl>
            </details>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="wrap">
            <div className="kontak-box">
              <div>
                <p className="eyebrow">
                  {config.contact_eyebrow}
                </p>

                <h2>{config.contact_title}</h2>

                <p className="lede mt-4">
                  {config.contact_description}
                </p>

                <div className="kontak-actions">
                  <a
                    href={
                      config.contact_email
                        ? `mailto:${config.contact_email}`
                        : '#'
                    }
                    className="original-btn original-btn-primary"
                    aria-disabled={!config.contact_email}
                    onClick={event => {
                      if (!config.contact_email) {
                        event.preventDefault()
                      }
                    }}
                  >
                    {config.contact_button_label}
                  </a>

                  <a
                    href="#beranda"
                    className="original-btn original-btn-ghost"
                  >
                    {config.contact_back_label}
                  </a>
                </div>
              </div>

              <dl className="kontak-plate">
                <div className="plate-row">
                  <dt>Email</dt>

                  <dd>
                    {config.contact_email ? (
                      <a
                        href={`mailto:${config.contact_email}`}
                      >
                        {config.contact_email}
                      </a>
                    ) : (
                      <span>-</span>
                    )}
                  </dd>
                </div>

                <div className="plate-row">
                  <dt>Media Sosial</dt>

                  <dd>
                    {instagramUrl ? (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {config.instagram_label}
                      </a>
                    ) : (
                      <span>{config.instagram_label || '-'}</span>
                    )}
                  </dd>
                </div>

                <div className="plate-row">
                  <dt>Sekretariat</dt>
                  <dd>{config.secretariat}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
