'use client'

import { useEffect, useState } from 'react'
import { Edit3, Plus, Trash2 } from 'lucide-react'

import ConfirmDialog from '../../components/ConfirmDialog'
import Dropdown from '../../components/dropdown'
import EmptyState from '../../components/EmptyState'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import { api } from '../../lib/api'
import { statusClass, statusLabel } from '../../lib/format'

const emptyForm = {
  nama_program: '',
  deskripsi: '',
  status: 'planned',
}

const statusOptions = [
  {
    value: 'planned',
    label: statusLabel('planned'),
    description: 'Belum dimulai',
  },
  {
    value: 'ongoing',
    label: statusLabel('ongoing'),
    description: 'Sedang dilaksanakan',
  },
  {
    value: 'done',
    label: statusLabel('done'),
    description: 'Sudah selesai',
  },
  {
    value: 'postponed',
    label: statusLabel('postponed'),
    description: 'Ditunda sementara',
  },
  {
    value: 'cancelled',
    label: statusLabel('cancelled'),
    description: 'Tidak dilanjutkan',
  },
]

export default function ProgramsAdminPage() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      setError('')

      const data = await api('/api/admin/programs')

      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (err) {
      setItems([])
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat daftar program kerja.',
      )
    }
  }

  useEffect(() => {
    load()
  }, [])

  function start(item = null) {
    setEditing(item)
    setError('')

    if (item) {
      setForm({
        nama_program: item.nama_program ?? '',
        deskripsi: item.deskripsi ?? '',
        status: item.status ?? 'planned',
      })
    } else {
      setForm({ ...emptyForm })
    }

    setOpen(true)
  }

  function closeModal() {
    if (busy) return

    setOpen(false)
    setEditing(null)
    setForm({ ...emptyForm })
    setError('')
  }

  async function save(event) {
    event.preventDefault()

    const payload = {
      nama_program: form.nama_program.trim(),
      deskripsi: form.deskripsi.trim(),
      status: form.status,
    }

    if (!payload.nama_program) {
      setError('Nama program wajib diisi.')
      return
    }

    if (!payload.deskripsi) {
      setError('Deskripsi program wajib diisi.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const endpoint = editing
        ? `/api/admin/programs/${editing.id}`
        : '/api/admin/programs'

      await api(endpoint, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setOpen(false)
      setEditing(null)
      setForm({ ...emptyForm })

      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Program kerja gagal disimpan.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!deleting) return

    setBusy(true)
    setError('')

    try {
      await api(`/api/admin/programs/${deleting.id}`, {
        method: 'DELETE',
      })

      setDeleting(null)

      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Program kerja gagal dihapus.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!items) {
    return <Loading />
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Agenda Organisasi</p>
          <h1 className="admin-title mt-2">Program Kerja</h1>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => start()}
        >
          <Plus className="h-4 w-4" />
          Tambah Program
        </button>
      </div>

      {error && !open && (
        <p className="mt-5 rounded-md border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {items.length > 0 ? (
          items.map(item => (
            <article
              key={item.id}
              className="card grid gap-5 p-5 md:grid-cols-[150px_1fr_auto] md:items-start"
            >
              <span
                className={`w-fit rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase ${statusClass(
                  item.status,
                )}`}
              >
                {statusLabel(item.status)}
              </span>

              <div className="min-w-0">
                <h2 className="break-words font-serif text-xl font-bold [overflow-wrap:anywhere]">
                  {item.nama_program}
                </h2>

                <p className="mt-2 break-words text-sm leading-6 text-slate-500 [overflow-wrap:anywhere]">
                  {item.deskripsi}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
                  onClick={() => start(item)}
                  aria-label={`Edit ${item.nama_program}`}
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  className="rounded-md border border-rose-200 p-2.5 text-rose-600 transition hover:bg-rose-50"
                  onClick={() => {
                    setError('')
                    setDeleting(item)
                  }}
                  aria-label={`Hapus ${item.nama_program}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="Belum ada program kerja" />
        )}
      </div>

      <Modal
        open={open}
        title={
          editing
            ? 'Edit Program Kerja'
            : 'Tambah Program Kerja'
        }
        onClose={closeModal}
      >
        <form onSubmit={save} className="space-y-5">
          {error && (
            <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div>
            <label className="label" htmlFor="program-name">
              Nama Program
            </label>

            <input
              id="program-name"
              className="field"
              value={form.nama_program}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  nama_program: event.target.value,
                }))
              }
              disabled={busy}
              required
            />
          </div>

          <div>
            <label
              className="label"
              htmlFor="program-description"
            >
              Deskripsi
            </label>

            <textarea
              id="program-description"
              className="field min-h-40"
              value={form.deskripsi}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  deskripsi: event.target.value,
                }))
              }
              disabled={busy}
              required
            />
          </div>

          <div>
            <label className="label">Status</label>

            <Dropdown
              value={form.status}
              onChange={value =>
                setForm(current => ({
                  ...current,
                  status: value,
                }))
              }
              options={statusOptions}
              variant="admin"
              ariaLabel="Pilih status program kerja"
              disabled={busy}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={closeModal}
              disabled={busy}
            >
              Batal
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={busy}
            >
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        description={`Program “${
          deleting?.nama_program ?? ''
        }” akan dihapus permanen.`}
        busy={busy}
        onCancel={() => {
          if (!busy) {
            setDeleting(null)
          }
        }}
        onConfirm={remove}
      />
    </div>
  )
}