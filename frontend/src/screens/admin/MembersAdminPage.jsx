'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChevronRight,
  Plus,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useNavigate } from '@/lib/react-router-dom-shim'

import ConfirmDialog from '../../components/ConfirmDialog'
import Dropdown from '../../components/dropdown'
import EmptyState from '../../components/EmptyState'
import Loading from '../../components/Loading'
import { api, mediaUrl } from '../../lib/api'
import { divisions } from '../../lib/members'

const sorters = {
  newest: (a, b) => b.id - a.id,
  oldest: (a, b) => a.id - b.id,
  az: (a, b) => a.nama.localeCompare(b.nama, 'id'),
  za: (a, b) => b.nama.localeCompare(a.nama, 'id'),
}

const sortOptions = [
  {
    value: 'newest',
    label: 'Terbaru Ditambah',
  },
  {
    value: 'oldest',
    label: 'Terlama Ditambah',
  },
  {
    value: 'az',
    label: 'Nama (A–Z)',
  },
  {
    value: 'za',
    label: 'Nama (Z–A)',
  },
]

export default function MembersAdminPage() {
  const [items, setItems] = useState(null)
  const [query, setQuery] = useState('')
  const [division, setDivision] = useState('')
  const [sort, setSort] = useState('newest')
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  async function load() {
    try {
      setError('')

      const data = await api('/api/admin/members')

      setItems(
        Array.isArray(data?.items)
          ? data.items
          : [],
      )
    } catch (err) {
      setItems([])
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat daftar pengurus.',
      )
    }
  }

  useEffect(() => {
    load()
  }, [])

  const visibleItems = useMemo(() => {
    if (!items) {
      return []
    }

    const needle = query
      .trim()
      .toLocaleLowerCase('id')

    return items
      .filter(item => {
        const searchableText = [
          item.nama,
          item.jabatan,
          item.divisi,
          item.periode,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('id')

        const matchesQuery =
          !needle ||
          searchableText.includes(needle)

        const matchesDivision =
          !division ||
          item.divisi === division

        return matchesQuery && matchesDivision
      })
      .sort(sorters[sort] || sorters.newest)
  }, [items, query, division, sort])

  async function removeMember() {
    if (!deleting) {
      return
    }

    setBusy(true)
    setError('')

    try {
      await api(
        `/api/admin/members/${deleting.id}`,
        {
          method: 'DELETE',
        },
      )

      setDeleting(null)

      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Pengurus gagal dihapus.',
      )
    } finally {
      setBusy(false)
    }
  }

  function openEdit(member) {
    navigate(
      `/admin/struktur/${member.id}/edit`,
    )
  }

  function handleMemberKeyDown(event, member) {
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      openEdit(member)
    }
  }

  if (!items) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-accent)]">
            Struktur Organisasi
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--admin-text)] sm:text-2xl">
            Daftar Fungsionaris
          </h2>

          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Cari nama, lalu klik baris pengurus untuk membuka halaman edit.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate('/admin/struktur/tambah')
          }
          className="
            inline-flex min-h-11 w-full items-center
            justify-center gap-2 rounded-lg
            bg-[var(--admin-accent)] px-5 py-3
            font-mono text-xs font-bold uppercase
            tracking-widest text-white
            transition
            hover:brightness-110
            active:scale-[0.98]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--admin-accent)]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[var(--admin-panel)]
            sm:w-auto
          "
        >
          <Plus className="h-5 w-5" />
          Buat Pengurus
        </button>
      </div>

      {/* Filter */}
      <section className="card p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_190px]">
          <label className="relative block">
            <span className="sr-only">
              Cari nama pengurus
            </span>

            <Search
              className="
                pointer-events-none absolute left-3.5 top-1/2
                h-4 w-4 -translate-y-1/2
                text-[var(--admin-muted)]
              "
            />

            <input
              type="search"
              value={query}
              onChange={event =>
                setQuery(event.target.value)
              }
              placeholder="Cari nama pengurus..."
              autoComplete="off"
              className="field min-h-11 pl-10"
            />
          </label>

          <Dropdown
            value={division}
            onChange={setDivision}
            options={[
              {
                value: '',
                label: 'Semua Divisi',
              },
              ...divisions.map(item => ({
                value: item,
                label: item,
              })),
            ]}
            variant="admin"
            compact
            showDescription={false}
            ariaLabel="Filter divisi pengurus"
          />

          <Dropdown
            value={sort}
            onChange={setSort}
            options={sortOptions}
            variant="admin"
            compact
            showDescription={false}
            ariaLabel="Urutkan daftar pengurus"
          />
        </div>
      </section>

      {/* Error */}
      {error && (
        <p
          role="alert"
          className="
            rounded-lg border border-red-500/25
            bg-red-500/10 p-4
            text-sm font-medium text-red-500
          "
        >
          {error}
        </p>
      )}

      {/* Member list */}
      <section className="card overflow-hidden p-0">
        <div
          className="
            flex items-center justify-between
            border-b border-[var(--admin-border)]
            bg-[var(--admin-panel-muted)]
            px-4 py-4 sm:px-5
          "
        >
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--admin-text)]">
            Daftar Pengurus
          </h3>

          <span className="font-mono text-[11px] font-bold text-[var(--admin-muted)]">
            {visibleItems.length} pengurus
          </span>
        </div>

        {visibleItems.length > 0 ? (
          <div className="divide-y divide-[var(--admin-border)]">
            {visibleItems.map(member => (
              <article
                key={member.id}
                role="button"
                tabIndex={0}
                aria-label={`Edit ${member.nama}`}
                onClick={() => openEdit(member)}
                onKeyDown={event =>
                  handleMemberKeyDown(
                    event,
                    member,
                  )
                }
                className="
                  group cursor-pointer
                  bg-transparent p-4
                  outline-none
                  transition-colors duration-150
                  hover:bg-[var(--admin-hover)]
                  focus-visible:bg-[var(--admin-hover)]
                  focus-visible:ring-2
                  focus-visible:ring-inset
                  focus-visible:ring-[var(--admin-accent)]
                  sm:p-5
                "
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Avatar */}
                  <div
                    className="
                      h-12 w-12 shrink-0 overflow-hidden
                      rounded-full
                      border border-[var(--admin-border)]
                      bg-[var(--admin-panel-muted)]
                      sm:h-14 sm:w-14
                    "
                  >
                    {member.foto_url ? (
                      <img
                        src={mediaUrl(
                          member.foto_url,
                        )}
                        alt={`Foto ${member.nama}`}
                        className="
                          h-full w-full object-cover
                          grayscale
                          transition duration-300
                          group-hover:grayscale-0
                        "
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound className="h-5 w-5 text-[var(--admin-muted)]" />
                      </div>
                    )}
                  </div>

                  {/* Member information */}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-[var(--admin-text)] sm:text-base">
                      {member.nama}
                    </h4>

                    <p
                      className="
                        mt-1 line-clamp-2
                        text-xs font-semibold leading-relaxed
                        text-[var(--admin-accent)]
                        sm:line-clamp-1
                      "
                    >
                      {member.jabatan}
                      {' — '}
                      {member.divisi}
                    </p>

                    <p className="mt-1 font-mono text-[10px] text-[var(--admin-muted)]">
                      Periode: {member.periode}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      aria-label={`Hapus ${member.nama}`}
                      title="Hapus pengurus"
                      onClick={event => {
                        event.stopPropagation()
                        setDeleting(member)
                      }}
                      className="
                        flex h-10 w-10 items-center
                        justify-center rounded-lg
                        border border-red-500/20
                        bg-red-500/10 text-red-500
                        transition-colors
                        hover:border-red-500/40
                        hover:bg-red-500/20
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-red-500/50
                      "
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <ChevronRight
                      className="
                        h-5 w-5
                        text-[var(--admin-muted)]
                        transition
                        group-hover:translate-x-0.5
                        group-hover:text-[var(--admin-accent)]
                      "
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-10">
            <EmptyState
              title={
                query || division
                  ? 'Tidak ada hasil yang cocok'
                  : 'Belum ada pengurus'
              }
              description={
                query || division
                  ? 'Coba ubah kata pencarian atau filter divisi.'
                  : 'Tambahkan data pengurus pertama untuk menampilkan struktur organisasi.'
              }
            />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Hapus pengurus?"
        description={`Data “${
          deleting?.nama || ''
        }” dan foto terkait akan dihapus permanen.`}
        busy={busy}
        onCancel={() => {
          if (!busy) {
            setDeleting(null)
          }
        }}
        onConfirm={removeMember}
      />
    </div>
  )
}