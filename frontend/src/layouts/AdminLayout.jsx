'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ExternalLink,
  FileText,
  Gauge,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  Users,
  X,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from '@/lib/react-router-dom-shim'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatDate } from '../lib/format'
import { PERMISSIONS, getDefaultAdminPath, hasPermission } from '../lib/adminPermissions'

const navigation = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Gauge, permission: PERMISSIONS.dashboard },
  { to: '/admin/berita', label: 'Publikasi', icon: FileText, permission: PERMISSIONS.news },
  { to: '/admin/proker', label: 'Program Kerja', icon: Target, permission: PERMISSIONS.programs },
  { to: '/admin/struktur', label: 'Pengurus', icon: Users, permission: PERMISSIONS.members },
]

const systemNavigation = [
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings, permission: PERMISSIONS.settings },
  { to: '/admin/admins', label: 'Administrator', icon: ShieldCheck, permission: PERMISSIONS.admins },
]

const titles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/berita': 'Manajemen Publikasi',
  '/admin/proker': 'Program Kerja',
  '/admin/struktur': 'Struktur Kepengurusan',
  '/admin/pengaturan': 'Pengaturan Website',
  '/admin/admins': 'Administrator & Role',
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'

  const saved = window.localStorage.getItem('himatkn-admin-theme')
  if (saved === 'dark' || saved === 'light') return saved

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function getPageTitle(pathname) {
  if (pathname === '/admin/struktur/tambah') return 'Tambah Fungsionaris'
  if (/^\/admin\/struktur\/\d+\/edit$/.test(pathname)) return 'Edit Fungsionaris'
  if (pathname === '/admin/berita/tambah') return 'Tambah Publikasi'
  if (/^\/admin\/berita\/\d+\/edit$/.test(pathname)) return 'Edit Publikasi'
  if (pathname === '/admin/proker/tambah') return 'Tambah Program Kerja'
  if (/^\/admin\/proker\/\d+\/edit$/.test(pathname)) return 'Edit Program Kerja'
  return titles[pathname] || 'Admin HIMATKN'
}

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [notifications, setNotifications] = useState([])
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [themeReady, setThemeReady] = useState(false)

  const timer = useRef(null)
  const searchWrapperRef = useRef(null)
  const notificationWrapperRef = useRef(null)

  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const pageTitle = getPageTitle(location.pathname)
  const homePath = getDefaultAdminPath(user)
  const visibleNavigation = navigation.filter(item => hasPermission(user, item.permission))
  const visibleSystemNavigation = systemNavigation.filter(item => hasPermission(user, item.permission))
  const showGlobalTools = hasPermission(user, PERMISSIONS.dashboard)

  useEffect(() => {
    setTheme(getInitialTheme())
    setThemeReady(true)
  }, [])

  useEffect(() => {
    if (!themeReady) return
    window.localStorage.setItem('himatkn-admin-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme, themeReady])

  useEffect(() => {
    setSidebarOpen(false)
    setNotificationOpen(false)
    setResults([])
  }, [location.pathname])

  useEffect(() => {
    if (!sidebarOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function closeWithEscape(event) {
      if (event.key === 'Escape') setSidebarOpen(false)
    }

    document.addEventListener('keydown', closeWithEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [sidebarOpen])

  useEffect(() => {
    api('/api/admin/notifications')
      .then(data => setNotifications(data.items || []))
      .catch(() => setNotifications([]))
  }, [location.pathname])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target)
      ) {
        setResults([])
      }

      if (
        notificationWrapperRef.current &&
        !notificationWrapperRef.current.contains(event.target)
      ) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    return () => document.removeEventListener('pointerdown', handleOutsideClick)
  }, [])

  useEffect(() => {
    window.clearTimeout(timer.current)

    const query = search.trim()
    if (query.length < 2) {
      setResults([])
      return undefined
    }

    timer.current = window.setTimeout(() => {
      api(`/api/admin/search?q=${encodeURIComponent(query)}`)
        .then(data => setResults(data.items || []))
        .catch(() => setResults([]))
    }, 300)

    return () => window.clearTimeout(timer.current)
  }, [search])

  async function doLogout() {
    await logout()
    navigate('/admin/login')
  }

  async function markRead(id) {
    try {
      await api(`/api/admin/notifications/${id}/read`, { method: 'POST' })
      setNotifications(items => items.filter(item => item.id !== id))
    } catch {
      // Pertahankan notifikasi jika request gagal.
    }
  }

  function openResult(item) {
    const target = (item.url || '/admin/dashboard')
      .replace('/admin/news', '/admin/berita')
      .replace('/admin/programs', '/admin/proker')
      .replace('/admin/members', '/admin/struktur')

    navigate(target)
    setSearch('')
    setResults([])
  }

  const sidebar = (
    <aside className="admin-sidebar flex h-full w-[272px] max-w-[86vw] shrink-0 flex-col border-r">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b px-5">
        <Link to={homePath} className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-muted)]">
            <img src="/icon.png" alt="Logo HIMATKN" className="h-7 w-7 object-contain" />
          </div>

          <div className="min-w-0">
            <span className="block truncate text-[15px] font-bold leading-tight">
              Nexus Node
            </span>
            <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              HIMATKN Control
            </span>
          </div>
        </Link>

        <button
          type="button"
          className="rounded-md p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-5">
        {visibleNavigation.length > 0 && (
          <>
            <p className="mb-2 px-5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--admin-accent)]">
              Modul Utama
            </p>

            <nav className="space-y-1 px-3">
              {visibleNavigation.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `admin-nav-link flex items-center gap-3 border px-3 py-2.5 text-sm font-semibold transition ${
                      isActive ? 'is-active' : ''
                    }`
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </>
        )}

        {visibleSystemNavigation.length > 0 && (
          <>
            <p className="mb-2 mt-7 px-5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--admin-accent)]">
              Sistem
            </p>

            <nav className="space-y-1 px-3">
              {visibleSystemNavigation.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `admin-nav-link flex items-center gap-3 border px-3 py-2.5 text-sm font-semibold transition ${
                      isActive ? 'is-active' : ''
                    }`
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="admin-sidebar-action flex w-full items-center justify-center gap-2 border px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest"
        >
          <ExternalLink className="h-4 w-4" />
          Lihat Website
        </a>

        <button
          type="button"
          onClick={doLogout}
          className="admin-danger-button flex w-full items-center justify-center gap-2 border px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div
      data-theme={theme}
      className={`admin-shell ${theme === 'dark' ? 'theme-dark' : 'theme-light'} relative flex h-[100dvh] min-w-0 overflow-hidden font-sans`}
    >
      <div className="hidden h-full md:block">{sidebar}</div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[90] md:hidden" role="dialog" aria-modal="true" aria-label="Navigasi admin">
          <button
            type="button"
            aria-label="Tutup sidebar"
            className="admin-mobile-backdrop absolute inset-0"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="admin-mobile-drawer relative h-full w-fit">{sidebar}</div>
        </div>
      )}

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="admin-topbar z-40 flex shrink-0 flex-wrap items-center justify-between border-b px-4 py-3 sm:min-h-[72px] sm:flex-nowrap sm:px-6 sm:py-0">
          <div className="flex min-w-0 items-center">
            <button
              type="button"
              className="admin-icon-button -ml-1 mr-2 flex h-9 w-9 shrink-0 items-center justify-center border md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka sidebar"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-[var(--admin-text)] sm:text-lg">
                {pageTitle}
              </h1>
              <p className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--admin-muted)] lg:block">
                HIMATKN Administration
              </p>
            </div>
          </div>

          {showGlobalTools && (
            <div
              ref={searchWrapperRef}
              className="order-3 z-50 mt-3 w-full min-w-0 sm:order-2 sm:mx-5 sm:mt-0 sm:max-w-md sm:flex-1"
            >
            <div className="relative min-w-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                autoComplete="off"
                className="admin-search w-full min-w-0 border py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition"
                placeholder="Cari publikasi, program, atau pengurus..."
              />

              {search.trim().length >= 2 && (
                <div className="admin-popover absolute left-0 top-full z-[60] mt-2 w-full min-w-0 overflow-hidden border shadow-xl">
                  <div className="max-h-[60vh] overflow-y-auto p-1.5 no-scrollbar">
                    {results.length ? (
                      results.map(item => (
                        <button
                          key={`${item.entity}-${item.id}`}
                          type="button"
                          onClick={() => openResult(item)}
                          className="group flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[var(--admin-hover)]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-muted)] text-xs font-bold text-[var(--admin-muted)] group-hover:border-[var(--admin-accent-border)] group-hover:text-[var(--admin-accent)]">
                            {item.title?.[0] || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[var(--admin-text)]">{item.title}</p>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-[var(--admin-muted)]">{item.type}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="py-7 text-center text-xs font-bold text-[var(--admin-muted)]">Tidak ditemukan</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          <div className="order-2 flex shrink-0 items-center gap-2 sm:order-3">
            <button
              type="button"
              onClick={() => setTheme(current => (current === 'dark' ? 'light' : 'dark'))}
              className="admin-icon-button flex h-9 w-9 items-center justify-center border"
              aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {showGlobalTools && (
              <div ref={notificationWrapperRef} className="relative">
              <button
                type="button"
                className="admin-icon-button relative flex h-9 w-9 items-center justify-center border"
                onClick={() => setNotificationOpen(value => !value)}
                aria-label="Notifikasi"
              >
                <Bell className="h-[18px] w-[18px]" />
                {notifications.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-[var(--admin-panel)] bg-red-500" />
                )}
              </button>

              {notificationOpen && (
                <div className="admin-popover absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden border shadow-xl">
                  <div className="flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-panel-muted)] px-4 py-3">
                    <h3 className="text-sm font-bold text-[var(--admin-text)]">Notifikasi</h3>
                    <span className="rounded border border-[var(--admin-accent-border)] bg-[var(--admin-accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--admin-accent)]">
                      {notifications.length} baru
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-1.5 no-scrollbar">
                    {notifications.length ? (
                      notifications.map(item => (
                        <div key={item.id} className="group relative flex gap-3 rounded-md border border-transparent p-3 transition hover:border-[var(--admin-border)] hover:bg-[var(--admin-hover)]">
                          <div className="mt-0.5 shrink-0 text-base text-[var(--admin-accent)]">
                            {item.tipe === 'success' ? '✓' : item.tipe === 'warning' ? '!' : 'i'}
                          </div>
                          <div className="min-w-0 flex-1 pr-6">
                            <p className="truncate text-xs font-bold text-[var(--admin-text)]">{item.judul}</p>
                            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--admin-muted)]">{item.pesan}</p>
                            <p className="mt-1.5 text-[9px] font-bold text-[var(--admin-muted)]">{formatDate(item.created_at, true)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => markRead(item.id)}
                            className="absolute right-2 top-2 rounded border border-[var(--admin-border)] bg-[var(--admin-panel)] px-1.5 py-1 text-[10px] text-[var(--admin-muted)] opacity-0 transition group-hover:opacity-100 hover:border-[var(--admin-accent-border)] hover:text-[var(--admin-accent)]"
                            aria-label="Tandai sudah dibaca"
                          >
                            ✓
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="py-7 text-center text-xs font-bold text-[var(--admin-muted)]">Semua sudah dibaca</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            <div className="ml-1 hidden h-8 w-px bg-[var(--admin-border)] sm:block" />
            <div className="ml-1 flex items-center gap-2">
              <div className="hidden text-right lg:block">
                <p className="text-xs font-bold leading-tight text-[var(--admin-text)]">{user?.username || 'Admin'}</p>
                <p className="mt-0.5 text-[10px] capitalize text-[var(--admin-muted)]">{user?.role_label || user?.role || 'Administrator'}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--admin-accent-strong)] text-sm font-bold text-white">
                {(user?.username || 'A')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pb-28 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
