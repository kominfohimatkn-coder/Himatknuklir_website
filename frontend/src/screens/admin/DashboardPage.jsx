'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Globe2,
  Target,
  Users,
} from 'lucide-react'
import { Link } from '@/lib/react-router-dom-shim'
import Dropdown from '../../components/dropdown'
import Loading from '../../components/Loading'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'

const number = new Intl.NumberFormat('id-ID')
const compact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })

const periodOptions = [
  { value: '7', label: '7 Hari', description: 'Satu minggu terakhir' },
  { value: '14', label: '14 Hari', description: 'Dua minggu terakhir' },
  { value: '30', label: '30 Hari', description: 'Satu bulan terakhir' },
]

const statusLabels = {
  planned: 'Direncanakan',
  ongoing: 'Berjalan',
  done: 'Selesai',
  postponed: 'Ditunda',
  cancelled: 'Dibatalkan',
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [periodDays, setPeriodDays] = useState('7')

  useEffect(() => {
    setData(null)
    api(`/api/admin/dashboard?days=${periodDays}`).then(setData)
  }, [periodDays])

  const maxVisit = useMemo(
    () => Math.max(...(data?.visit_trend || []).map(item => item.total), 1),
    [data],
  )

  if (!data) return <Loading />

  const stats = [
    {
      label: 'Kunjungan Hari Ini',
      value: compact.format(data.visitors_today),
      note: `${number.format(data.unique_today)} pengunjung unik`,
      icon: Eye,
    },
    {
      label: 'Publikasi',
      value: number.format(data.total_berita),
      note: `${number.format(data.published_this_month)} terbit bulan ini`,
      icon: FileText,
    },
    {
      label: 'Program Berjalan',
      value: `${number.format(data.proker_ongoing)}/${number.format(data.total_proker)}`,
      note: `${number.format(data.program_status.done)} sudah selesai`,
      icon: Target,
    },
    {
      label: 'Fungsionaris',
      value: number.format(data.total_pengurus),
      note: `${number.format(data.content_total)} total entitas`,
      icon: Users,
    },
  ]

  const growthPositive = data.visitor_growth >= 0
  const GrowthIcon = growthPositive ? ArrowUpRight : ArrowDownRight
  const totalPrograms = Math.max(data.total_proker, 1)

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Executive Overview</p>
          <h1 className="admin-title mt-1.5">Dashboard</h1>
          <p className="mt-1.5 text-sm text-slate-500">Ringkasan operasional konten, program, dan trafik website.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Dropdown
            value={periodDays}
            onChange={setPeriodDays}
            options={periodOptions}
            variant="admin"
            compact
            showDescription={false}
            ariaLabel="Pilih periode trafik dashboard"
            className="w-full sm:w-40"
          />

          <div className="inline-flex min-h-10 w-fit items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Sistem aktif
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <article key={label} className="card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{value}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary-100 bg-primary-50 text-primary-800">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-400">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <article className="card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Trafik {data.period_days || Number(periodDays)} Hari Terakhir</p>
              <p className="mt-1 text-xs text-slate-500">Akumulasi {number.format(data.visitors_period ?? data.visitors_7d)} kunjungan.</p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${growthPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              <GrowthIcon className="h-4 w-4" />
              {Math.abs(data.visitor_growth)}% dari periode sebelumnya
            </div>
          </div>

          <div className="overflow-x-auto px-5 py-5">
            <div
              className="flex h-44 items-end gap-2 sm:gap-3"
              style={{ minWidth: `${Math.max(data.visit_trend.length * 46, 560)}px` }}
            >
              {data.visit_trend.map(item => {
                const height = Math.max((item.total / maxVisit) * 100, item.total ? 8 : 2)
                const date = new Date(`${item.date}T00:00:00`)
                const label = data.visit_trend.length <= 7
                  ? new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date)
                  : new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date)
                return (
                  <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">{item.total}</span>
                    <div className="flex h-28 w-full items-end border-b border-slate-200">
                      <div
                        className="w-full bg-primary-800 transition-[height] duration-500"
                        style={{ height: `${height}%` }}
                        title={`${item.total} kunjungan`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </article>

        <article className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-bold text-slate-900">Status Program Kerja</p>
            <p className="mt-1 text-xs text-slate-500">Distribusi seluruh agenda organisasi.</p>
          </div>
          <div className="space-y-4 p-5">
            {Object.entries(data.program_status).map(([status, total]) => {
              const percentage = Math.round((total / totalPrograms) * 100)
              return (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-600">{statusLabels[status] || status}</span>
                    <span className="font-bold text-slate-900">{total}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden bg-slate-100">
                    <div className="h-full bg-primary-800" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Aktivitas Terbaru</p>
              <p className="mt-1 text-xs text-slate-500">Perubahan terbaru yang dilakukan melalui panel admin.</p>
            </div>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100">
            {data.recent_logs.length ? data.recent_logs.map(log => (
              <div key={log.id} className="flex gap-3 px-5 py-3.5">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-primary-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{log.judul}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{log.admin} · {formatDate(log.created_at, true)}</p>
                </div>
              </div>
            )) : <p className="p-8 text-center text-sm text-slate-400">Belum ada aktivitas.</p>}
          </div>
        </article>

        <article className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Halaman Terpopuler</p>
              <p className="mt-1 text-xs text-slate-500">Berdasarkan seluruh log kunjungan.</p>
            </div>
            <Globe2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100">
            {data.top_pages.length ? data.top_pages.map((item, index) => (
              <div key={item.halaman} className="flex items-center gap-3 px-5 py-3.5">
                <span className="font-mono text-[10px] font-bold text-slate-400">0{index + 1}</span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{item.halaman}</p>
                <span className="text-xs font-bold text-slate-900">{compact.format(item.total)}</span>
              </div>
            )) : <p className="p-8 text-center text-sm text-slate-400">Belum ada data.</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Publikasi Terbaru</p>
              <p className="mt-1 text-xs text-slate-500">Konten yang paling baru diterbitkan.</p>
            </div>
            <Link to="/admin/berita" className="text-xs font-bold text-primary-800 hover:text-primary-950">Kelola</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.latest_news.length ? data.latest_news.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <FileText className="h-4 w-4 shrink-0 text-primary-800" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.judul}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.created_at)}</p>
                </div>
              </div>
            )) : <p className="p-8 text-center text-sm text-slate-400">Belum ada publikasi.</p>}
          </div>
        </article>

        <article className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Kunjungan Terbaru</p>
              <p className="mt-1 text-xs text-slate-500">Aktivitas akses publik paling baru.</p>
            </div>
            <Clock3 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100">
            {data.visitor_logs.length ? data.visitor_logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3.5">
                <Globe2 className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{log.halaman}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">{log.ip_address}</p>
                </div>
                <p className="shrink-0 text-right text-[10px] text-slate-400">{formatDate(log.visited_at, true)}</p>
              </div>
            )) : <p className="p-8 text-center text-sm text-slate-400">Belum ada kunjungan.</p>}
          </div>
        </article>
      </section>
    </div>
  )
}
