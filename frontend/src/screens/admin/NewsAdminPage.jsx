'use client'

import { useEffect, useState } from 'react'
import { Edit3, Plus, Tags, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import { api, mediaUrl } from '../../lib/api'
import { formatDate } from '../../lib/format'

const emptyForm = {
  judul: '',
  konten: '',
  tags: 'Informasi',
  gambar: null,
}

function tagsToInput(tags) {
  return Array.isArray(tags) && tags.length
    ? tags.join(', ')
    : 'Informasi'
}

export default function NewsAdminPage() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await api('/api/admin/news')
      setItems(data.items || [])
    } catch (err) {
      setError(err.message)
      setItems([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  function start(item = null) {
    setEditing(item)
    setForm(
      item
        ? {
            judul: item.judul,
            konten: item.konten,
            tags: tagsToInput(item.tags),
            gambar: null,
          }
        : emptyForm,
    )
    setError('')
    setOpen(true)
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const body = new FormData()
    body.append('judul', form.judul.trim())
    body.append('konten', form.konten.trim())
    body.append('tags', form.tags.trim())
    if (form.gambar) body.append('gambar', form.gambar)

    try {
      await api(
        editing
          ? `/api/admin/news/${editing.id}`
          : '/api/admin/news',
        {
          method: editing ? 'PUT' : 'POST',
          body,
        },
      )
      setOpen(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!deleting) return

    setBusy(true)
    setError('')

    try {
      await api(`/api/admin/news/${deleting.id}`, {
        method: 'DELETE',
      })
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!items) return <Loading />

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Manajemen Konten</p>
          <h1 className="admin-title mt-2">Publikasi</h1>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => start()}
        >
          <Plus className="h-4 w-4" />
          Tambah Publikasi
        </button>
      </div>

      {error && !open && (
        <p className="mt-5 rounded-md border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        {items.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map(item => (
              <article key={item.id} className="card overflow-hidden">
                <div className="aspect-[16/9] bg-slate-100">
                  {item.gambar_url ? (
                    <img
                      src={mediaUrl(item.gambar_url)}
                      className="h-full w-full object-cover"
                      alt={item.judul}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
                      HIMATKN
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="font-mono text-[10px] uppercase text-slate-400">
                    {formatDate(item.created_at)}
                  </p>

                  <h2 className="mt-2 line-clamp-2 font-serif text-xl font-bold">
                    {item.judul}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(item.tags?.length ? item.tags : ['Informasi']).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded border border-primary-200 bg-primary-50 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-primary-900"
                      >
                        <Tags className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                    {item.konten}
                  </p>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary flex-1 py-2"
                      onClick={() => start(item)}
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="rounded-md border border-rose-200 px-3 text-rose-600 transition hover:bg-rose-50"
                      onClick={() => setDeleting(item)}
                      aria-label={`Hapus ${item.judul}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada publikasi" />
        )}
      </div>

      <Modal
        open={open}
        title={editing ? 'Edit Publikasi' : 'Tambah Publikasi'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-5">
          {error && (
            <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div>
            <label className="label" htmlFor="news-title">
              Judul
            </label>
            <input
              id="news-title"
              className="field"
              value={form.judul}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  judul: event.target.value,
                }))
              }
              required
              minLength={2}
              maxLength={255}
            />
          </div>

          <div>
            <label className="label" htmlFor="news-tags">
              Tag Publikasi
            </label>
            <input
              id="news-tags"
              className="field"
              value={form.tags}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  tags: event.target.value,
                }))
              }
              placeholder="Contoh: Akademik, Kegiatan, Informasi"
              maxLength={500}
            />
            <p className="mt-1.5 text-xs leading-5 text-slate-400">
              Pisahkan beberapa tag menggunakan koma. Maksimal 8 tag.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="news-content">
              Konten
            </label>
            <textarea
              id="news-content"
              className="field min-h-52"
              value={form.konten}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  konten: event.target.value,
                }))
              }
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="label" htmlFor="news-image">
              Gambar{' '}
              {editing && '(opsional, kosongkan untuk mempertahankan)'}
            </label>
            <input
              id="news-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="field"
              onChange={event =>
                setForm(current => ({
                  ...current,
                  gambar: event.target.files?.[0] || null,
                }))
              }
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOpen(false)}
            >
              Batal
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        description={`Publikasi “${deleting?.judul || ''}” akan dihapus permanen.`}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  )
}
