'use client'

import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from '@/lib/react-router-dom-shim'
import { getGoogleMapsEmbedUrl } from '../lib/maps'
import { safeExternalUrl } from '../lib/safe-url'

const defaultConfig = {
  brand_name: 'HIMA TEKNOKIMIA NUKLIR',
  brand_subtitle: 'POLITEKNIK TEKNOLOGI NUKLIR',
  bank_soal_url: 'https://drive.google.com/drive/folders/1cURykHoJWo6xkeHE99uZE_wG0-WbGqi_',
  footer_copyright: '© 2026 HIMA TEKNOKIMIA NUKLIR — Kabinet Nexus',
  footer_institution: 'Politeknik Teknologi Nuklir Indonesia, BRIN',
  map_embed_url: '',
}

export default function PublicLayout({ children, initialConfig = defaultConfig }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const config = { ...defaultConfig, ...initialConfig }
  const headerRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 1)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    setOpen(false)
  }, [location.hash])

  useEffect(() => {
    const close = event => {
      if (headerRef.current && !headerRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const isStructure = location.pathname === '/struktur' || location.pathname === '/structure'
  const isNews = location.pathname.startsWith('/berita') || location.pathname.startsWith('/news')
  const bankSoalUrl = safeExternalUrl(config.bank_soal_url)
  const mapLinkUrl = safeExternalUrl(config.map_embed_url)
  const mapEmbedUrl = getGoogleMapsEmbedUrl(config.map_embed_url, config.secretariat)

  return (
    <div className="public-site">
      <header ref={headerRef} className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="wrap">
          <Link to="/" className="brand" aria-label="Beranda HIMATKN">
            <img src="/icon.png" alt="Logo HIMATKN" className="h-8 w-8 shrink-0 object-contain" />
            <span className="brand-text min-w-0">
              <strong className="truncate">{config.brand_name}</strong>
              <span className="truncate">{config.brand_subtitle}</span>
            </span>
          </Link>

          <nav className="nav-links" aria-label="Navigasi utama">
            <a href="/#beranda">Beranda</a>
            <a href="/#tentang">Tentang</a>
            <a href="/#kegiatan">Kegiatan</a>
            <a href="/#berita" className={isNews ? 'active' : ''}>Publikasi</a>
            <a href={bankSoalUrl} target="_blank" rel="noopener noreferrer">Bank Soal</a>
            <Link to="/struktur" className={isStructure ? 'active' : ''}>Struktur</Link>
          </nav>

          <button
            className="nav-toggle"
            type="button"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            onClick={() => setOpen(value => !value)}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
              <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        <nav className={`nav-drawer ${open ? 'open' : ''}`} aria-label="Navigasi mobile">
          <a href="/#beranda">Beranda</a>
          <a href="/#tentang">Tentang</a>
          <a href="/#kegiatan">Kegiatan</a>
          <a href="/#berita">Publikasi</a>
          <a href={bankSoalUrl} target="_blank" rel="noopener noreferrer">Bank Soal</a>
          <Link to="/struktur">Struktur</Link>
        </nav>
      </header>

      {children}

      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-top">
            <Link to="/" className="brand">
              <span className="brand-text">
                <strong>{config.brand_name}</strong>
                <span>{config.brand_subtitle}</span>
              </span>
            </Link>
            <nav className="footer-nav" aria-label="Navigasi footer">
              <a href="/#beranda">Beranda</a>
              <a href="/#tentang">Tentang</a>
              <a href="/#kegiatan">Kegiatan</a>
              <Link to="/berita">Berita</Link>
              <Link to="/struktur">Struktur</Link>
            </nav>
          </div>

          {mapEmbedUrl && (
            <div className="footer-map-section">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="footer-map-label !mb-0">Lokasi Kami</p>
                {config.map_embed_url && (
                  <a
                    href={mapLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-200 underline underline-offset-4 transition hover:text-white"
                  >
                    Buka Google Maps ↗
                  </a>
                )}
              </div>
              <div className="footer-map-container">
                <iframe
                  src={mapEmbedUrl}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokasi Politeknik Teknologi Nuklir Indonesia"
                />
              </div>
            </div>
          )}

          <div className="footer-bottom">
            <span>{config.footer_copyright}</span>
            <span>{config.footer_institution}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}