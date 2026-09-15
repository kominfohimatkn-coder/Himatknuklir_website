'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  ImagePlus,
  Info,
  Link2,
  Mail,
  MapPinned,
  Monitor,
  Network,
  Newspaper,
  Save,
  Settings2,
  Smartphone,
  Tablet,
  Upload,
  Users,
  X,
} from 'lucide-react'
import Dropdown from '../../components/dropdown'
import HeroSection from '../../screens/public/HeroSection'
import Loading from '../../components/Loading'
import { api, mediaUrl } from '../../lib/api'
import { getGoogleMapsEmbedUrl } from '../../lib/maps'
import { allSettingFields, settingGroups } from '../../lib/siteConfig'
import { safeExternalUrl } from '../../lib/safe-url'

const sectionIcons = {
  identity: Building2,
  hero: ImagePlus,
  about: Users,
  programs: CalendarDays,
  news: Newspaper,
  structure: Network,
  contact: Mail,
  footer: MapPinned,
}

const sectionDropdownOptions = settingGroups.map(group => ({
  value: group.id,
  label: group.title,
  description: group.description,
  icon: sectionIcons[group.id] || FileText,
}))

const previewPlatforms = {
  desktop: {
    label: 'Desktop',
    description: 'Layar lebar',
    icon: Monitor,
    width: 1280,
    height: 680,
    safeInset: '8% 11%',
  },
  tablet: {
    label: 'Tablet',
    description: 'Layar sedang',
    icon: Tablet,
    width: 768,
    height: 720,
    safeInset: '9% 9%',
  },
  mobile: {
    label: 'Ponsel',
    description: 'Layar vertikal',
    icon: Smartphone,
    width: 390,
    height: 720,
    safeInset: '8% 6%',
  },
}

const fieldHelp = {
  hero_eyebrow: 'Teks kecil yang muncul tepat di atas judul utama.',
  hero_title: 'Bagian pertama dari judul besar.',
  hero_emphasis:
    'Bagian kedua judul yang tampil miring dan berwarna hijau.',
  hero_description:
    'Gunakan satu atau dua kalimat singkat agar tetap nyaman dibaca di ponsel.',
  brand_subtitle:
    'Biasanya berisi nama institusi atau kampus.',
  period_label: 'Contoh: Kabinet Nexus 2026.',
  contact_email:
    'Alamat ini digunakan oleh tombol kirim email.',
  instagram_url:
    'Tempel tautan profil Instagram lengkap.',
  bank_soal_url:
    'Tempel tautan Google Drive atau halaman Bank Soal.',
  secretariat:
    'Alamat ini juga digunakan sebagai cadangan untuk menampilkan peta.',
  map_embed_url:
    'Tempel tautan Google Maps biasa dari tombol Bagikan. Tidak perlu mencari kode embed.',
}

function fieldType(key) {
  if (key === 'contact_email') return 'email'
  if (key === 'map_embed_url' || key.endsWith('_url')) return 'url'
  return 'text'
}

function Field({ field, value, onChange }) {
  const [key, label, type] = field
  const textarea = type === 'textarea'
  const help = fieldHelp[key]

  return (
    <div className={`min-w-0 max-w-full ${textarea ? 'md:col-span-2' : ''}`}>
      <label
        htmlFor={`setting-${key}`}
        className="mb-1.5 block break-words font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--admin-muted)]"
      >
        {label}
      </label>

      {textarea ? (
        <textarea
          id={`setting-${key}`}
          value={value || ''}
          onChange={event => onChange(key, event.target.value)}
          className="min-h-24 w-full min-w-0 max-w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-input)] px-3.5 py-3 text-sm leading-6 text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-accent-border)] focus:bg-[var(--admin-panel)] focus:ring-2 focus:ring-[var(--admin-accent-soft)]"
        />
      ) : (
        <input
          id={`setting-${key}`}
          type={fieldType(key)}
          value={value || ''}
          onChange={event => onChange(key, event.target.value)}
          className="min-h-11 w-full min-w-0 max-w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-input)] px-3.5 py-2.5 text-sm text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-accent-border)] focus:bg-[var(--admin-panel)] focus:ring-2 focus:ring-[var(--admin-accent-soft)]"
        />
      )}

      {help && (
        <p className="mt-1.5 max-w-full break-words text-[11px] leading-5 text-[var(--admin-muted)]">
          {help}
        </p>
      )}
    </div>
  )
}

function CollectionEditor({ collection, form, onChange, defaultOpen }) {
  return (
    <details
      open={defaultOpen}
      className="group min-w-0 max-w-full overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-muted)]"
    >
      <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3.5 text-left transition hover:bg-[var(--admin-hover)] sm:px-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold text-[var(--admin-text)]">
            {collection.title}
          </p>
          <p className="mt-0.5 break-words text-xs leading-5 text-[var(--admin-muted)]">
            {collection.description}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--admin-muted)] transition group-open:rotate-180" />
      </summary>

      <div className="grid min-w-0 grid-cols-1 gap-4 border-t border-[var(--admin-border)] bg-[var(--admin-panel)] p-3.5 sm:p-4 md:grid-cols-2">
        {collection.fields.map(field => (
          <Field
            key={field[0]}
            field={field}
            value={form[field[0]]}
            onChange={onChange}
          />
        ))}
      </div>
    </details>
  )
}

function PlatformPreview({ config, heroImage }) {
  const [platform, setPlatform] = useState('mobile')
  const [scale, setScale] = useState(1)
  const stageRef = useRef(null)
  const selected = previewPlatforms[platform]

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined

    function updateScale() {
      const available = Math.max(240, stage.clientWidth - 24)
      setScale(Math.min(1, available / selected.width))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(stage)

    return () => observer.disconnect()
  }, [selected.width])

  const scaledHeight = Math.ceil(selected.height * scale)

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-muted)]">
      <div className="flex min-w-0 flex-col gap-3 border-b border-[var(--admin-border)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--admin-text)]">
            Pratinjau Banner
          </p>
          <p className="mt-0.5 break-words text-[11px] leading-5 text-[var(--admin-muted)]">
            Lihat hasil hero pada ukuran layar yang berbeda sebelum disimpan.
          </p>
        </div>

        <div className="grid w-full min-w-0 grid-cols-3 gap-1 rounded-md border border-[var(--admin-border)] bg-[var(--admin-input)] p-1 sm:w-auto sm:min-w-[310px]">
          {Object.entries(previewPlatforms).map(([key, item]) => {
            const Icon = item.icon
            const active = key === platform

            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlatform(key)}
                className={`flex min-w-0 items-center justify-center gap-1.5 rounded px-2 py-2 text-[10px] font-bold transition sm:text-xs ${
                  active
                    ? 'bg-[var(--admin-accent)] text-white shadow-sm'
                    : 'text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]'
                }`}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2.5 text-[10px] text-[var(--admin-muted)] sm:px-4">
        <span className="truncate font-semibold">{selected.description}</span>
        <span className="shrink-0 font-mono">
          {selected.width} × {selected.height}px
        </span>
      </div>

      <div
        ref={stageRef}
        className="w-full min-w-0 max-w-full overflow-hidden bg-[#111317] p-3 sm:p-4"
      >
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            width: selected.width * scale,
            height: scaledHeight,
          }}
        >
          <div
            className={`absolute left-0 top-0 overflow-hidden bg-[#fcfefb] shadow-2xl ${
              platform === 'mobile'
                ? 'rounded-[28px] border-[7px] border-[#292d33]'
                : platform === 'tablet'
                  ? 'rounded-[18px] border-[8px] border-[#292d33]'
                  : 'rounded-lg border border-[#343941]'
            }`}
            style={{
              width: selected.width,
              height: selected.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {platform === 'desktop' && (
              <div className="flex h-9 items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 h-5 flex-1 rounded bg-white" />
              </div>
            )}

            {platform === 'mobile' && (
              <div className="absolute left-1/2 top-2 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-[#17191d]" />
            )}

            <div className="public-site h-full overflow-hidden">
              <HeroSection
                config={config}
                heroImage={heroImage}
                interactive={false}
                previewMode={platform}
              />
            </div>

            <div
              className="pointer-events-none absolute border border-dashed border-emerald-700/75"
              style={{ inset: selected.safeInset }}
            >
              <span className="absolute left-2 top-2 bg-emerald-900/85 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
                Area aman
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-3 text-[11px] leading-5 text-[var(--admin-muted)] sm:px-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--admin-accent)]" />
        <p className="min-w-0 break-words">
          Pastikan judul dan teks penting tetap berada di dalam garis area aman pada semua perangkat.
        </p>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [form, setForm] = useState(null)
  const [savedForm, setSavedForm] = useState(null)
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeGroupId, setActiveGroupId] = useState('hero')

  useEffect(() => {
    api('/api/admin/settings')
      .then(data => {
        setForm(data.config)
        setSavedForm(data.config)
      })
      .catch(err => setError(err.message))
  }, [])

  const previewImage = useMemo(
    () => (image ? URL.createObjectURL(image) : ''),
    [image],
  )

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage)
    }
  }, [previewImage])

  if (!form) return <Loading />

  const activeGroup =
    settingGroups.find(group => group.id === activeGroupId) || settingGroups[0]
  const formChanged = JSON.stringify(form) !== JSON.stringify(savedForm)
  const dirty = formChanged || Boolean(image)
  const heroImage = previewImage || mediaUrl(form.hero_image)
  const mapEmbedUrl = getGoogleMapsEmbedUrl(
    form.map_embed_url,
    form.secretariat,
  )
  const ActiveIcon = sectionIcons[activeGroup.id] || Settings2

  function updateField(key, value) {
    setForm(current => ({ ...current, [key]: value }))
    setMessage('')
  }

  function discardChanges() {
    setForm(savedForm)
    setImage(null)
    setMessage('Perubahan yang belum disimpan telah dibatalkan.')
    setError('')
  }

  async function save(event) {
    event.preventDefault()
    if (!dirty || busy) return

    setBusy(true)
    setError('')
    setMessage('')

    const body = new FormData()
    allSettingFields.forEach(([key]) => body.append(key, form[key] || ''))
    if (image) body.append('hero_image', image)

    try {
      const data = await api('/api/admin/settings', {
        method: 'PUT',
        body,
      })
      setForm(data.config)
      setSavedForm(data.config)
      setImage(null)
      setMessage('Pengaturan website berhasil disimpan.')
      window.setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={save}
      className="settings-page w-full min-w-0 max-w-full overflow-x-clip pb-24 sm:pb-6"
    >
      <header className="mb-4 flex min-w-0 max-w-full flex-col gap-4 border-b border-[var(--admin-border)] pb-5 sm:mb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-full">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-accent)]">
            Konfigurasi Website
          </p>
          <h1 className="mt-1.5 max-w-full break-words text-2xl font-extrabold tracking-tight text-[var(--admin-text)] sm:text-3xl">
            Pengaturan Landing Page
          </h1>
          <p className="mt-1.5 max-w-2xl break-words text-sm leading-6 text-[var(--admin-muted)]">
            Pilih bagian website, ubah isinya, lalu simpan ketika selesai.
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {dirty && (
            <button
              type="button"
              onClick={discardChanges}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] px-4 text-xs font-bold text-[var(--admin-text-soft)] transition hover:bg-[var(--admin-hover)]"
            >
              <X className="h-4 w-4" />
              Batalkan
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !dirty}
            className="inline-flex min-h-10 min-w-44 items-center justify-center gap-2 rounded-md bg-[var(--admin-accent-strong)] px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Save className="h-4 w-4" />
            {busy ? 'Menyimpan…' : dirty ? 'Simpan Perubahan' : 'Sudah Tersimpan'}
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mb-4 max-w-full break-words rounded-md border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mb-4 flex max-w-full items-start gap-2 rounded-md border border-[var(--admin-accent-border)] bg-[var(--admin-accent-soft)] px-4 py-3 text-sm font-medium text-[var(--admin-accent)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{message}</span>
        </p>
      )}

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="min-w-0 max-w-full lg:sticky lg:top-0 lg:self-start">
          <div className="min-w-0 max-w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-2">
            <p className="mb-1.5 px-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--admin-muted)] lg:hidden">
              Bagian Website
            </p>

            <Dropdown
              value={activeGroupId}
              onChange={setActiveGroupId}
              options={sectionDropdownOptions}
              variant="admin"
              ariaLabel="Pilih bagian pengaturan website"
              className="w-full min-w-0 max-w-full lg:hidden"
            />

            <nav className="hidden space-y-1 lg:block" aria-label="Bagian pengaturan">
              {settingGroups.map(group => {
                const Icon = sectionIcons[group.id] || FileText
                const active = activeGroupId === group.id

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
                    className={`flex min-h-11 w-full min-w-0 items-center gap-3 rounded-md border px-3 text-left text-sm font-semibold transition ${
                      active
                        ? 'border-[var(--admin-accent-border)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'
                        : 'border-transparent text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]'
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px] shrink-0" />
                    <span className="min-w-0 truncate">{group.shortTitle || group.title}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)]">
          <div className="flex min-w-0 items-start gap-3 border-b border-[var(--admin-border)] px-3.5 py-4 sm:px-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--admin-accent-border)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
              <ActiveIcon className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-base font-bold text-[var(--admin-text)]">
                {activeGroup.title}
              </h2>
              <p className="mt-1 break-words text-xs leading-5 text-[var(--admin-muted)] sm:text-sm">
                {activeGroup.description}
              </p>
            </div>
          </div>

          <div className="min-w-0 max-w-full space-y-5 p-3.5 sm:p-5">
            {activeGroup.id === 'hero' && (
              <div className="min-w-0 max-w-full space-y-4">
                <div className="flex min-w-0 max-w-full flex-col gap-3 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-muted)] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold text-[var(--admin-text)]">
                      Gambar Background Hero
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-[var(--admin-muted)]">
                      Gunakan gambar landscape JPG, PNG, atau WebP. Gambar baru langsung muncul pada pratinjau.
                    </p>
                  </div>

                  <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:flex-nowrap">
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage(null)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
                        aria-label="Batalkan gambar baru"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    <label
                      htmlFor="hero-image"
                      className="inline-flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-panel)] px-3.5 text-xs font-bold text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)] sm:flex-none"
                    >
                      <Upload className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 truncate">{image?.name || 'Pilih Gambar'}</span>
                    </label>
                    <input
                      id="hero-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={event => setImage(event.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <PlatformPreview config={form} heroImage={heroImage} />
              </div>
            )}

            {activeGroup.id === 'footer' && (
              <div className="min-w-0 max-w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-muted)] p-3 sm:p-4">
                <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--admin-text)]">Pratinjau Lokasi</p>
                    <p className="mt-1 break-words text-xs leading-5 text-[var(--admin-muted)]">
                      Peta dibuat otomatis dari tautan Google Maps atau alamat sekretariat.
                    </p>
                  </div>
                  {form.map_embed_url && (
                    <a
                      href={safeExternalUrl(form.map_embed_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 text-xs font-bold text-[var(--admin-text-soft)] transition hover:bg-[var(--admin-hover)] sm:w-auto"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka Google Maps
                    </a>
                  )}
                </div>

                {mapEmbedUrl ? (
                  <iframe
                    src={mapEmbedUrl}
                    title="Pratinjau lokasi Google Maps"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-56 w-full min-w-0 max-w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] sm:h-64"
                  />
                ) : (
                  <div className="flex h-44 min-w-0 flex-col items-center justify-center rounded-md border border-dashed border-[var(--admin-border-strong)] px-4 text-center text-[var(--admin-muted)]">
                    <MapPinned className="h-6 w-6" />
                    <p className="mt-2 break-words text-xs font-semibold">
                      Masukkan tautan Google Maps atau alamat sekretariat.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeGroup.fields?.length > 0 && (
              <div className="grid min-w-0 max-w-full grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                {activeGroup.fields.map(field => (
                  <Field
                    key={field[0]}
                    field={field}
                    value={form[field[0]]}
                    onChange={updateField}
                  />
                ))}
              </div>
            )}

            {activeGroup.collections?.length > 0 && (
              <div className="min-w-0 max-w-full space-y-2.5 border-t border-[var(--admin-border)] pt-5">
                <div className="mb-3 min-w-0">
                  <p className="text-sm font-bold text-[var(--admin-text)]">Rincian Konten</p>
                  <p className="mt-1 break-words text-xs leading-5 text-[var(--admin-muted)]">
                    Buka hanya bagian yang ingin diedit agar halaman tetap ringkas.
                  </p>
                </div>

                {activeGroup.collections.map((collection, index) => (
                  <CollectionEditor
                    key={collection.id}
                    collection={collection}
                    form={form}
                    onChange={updateField}
                    defaultOpen={index === 0}
                  />
                ))}
              </div>
            )}

            {activeGroup.id === 'contact' && (
              <div className="flex min-w-0 max-w-full items-start gap-2.5 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-muted)] p-3 text-xs leading-5 text-[var(--admin-muted)]">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--admin-accent)]" />
                <span className="min-w-0 break-words">
                  Pastikan tautan Instagram dan Bank Soal diawali dengan https:// agar dapat dibuka pengunjung.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 max-w-full border-t border-[var(--admin-border)] bg-[var(--admin-panel)]/95 p-3 backdrop-blur sm:hidden">
        <div className="flex min-w-0 gap-2">
          {dirty && (
            <button
              type="button"
              onClick={discardChanges}
              className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-muted)] text-[var(--admin-muted)]"
              aria-label="Batalkan perubahan"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !dirty}
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--admin-accent-strong)] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Save className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {busy ? 'Menyimpan…' : dirty ? 'Simpan Perubahan' : 'Sudah Tersimpan'}
            </span>
          </button>
        </div>
      </div>
    </form>
  )
}
