'use client'

import { useEffect, useMemo, useState } from 'react'
import { Edit3, ShieldCheck, Trash2, UserPlus, UsersRound } from 'lucide-react'

import ConfirmDialog from '../../components/ConfirmDialog'
import Dropdown from '../../components/dropdown'
import EmptyState from '../../components/EmptyState'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

const emptyForm = {
  username: '',
  password: '',
  role: 'publication_admin',
}

export default function AdminsAdminPage() {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState({ ...emptyForm })
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setError('')

    try {
      const [adminData, roleData] = await Promise.all([
        api('/api/admin/admins'),
        api('/api/admin/admins/roles'),
      ])

      setItems(Array.isArray(adminData?.items) ? adminData.items : [])
      setRoles(Array.isArray(roleData?.items) ? roleData.items : [])
    } catch (err) {
      setItems([])
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat data administrator.',
      )
    }
  }

  useEffect(() => {
    load()
  }, [])

  const roleOptions = useMemo(
    () =>
      roles.map(role => ({
        value: role.value,
        label: role.label,
        description: role.description,
      })),
    [roles],
  )

  function start(item = null) {
    setEditing(item)
    setError('')

    if (item) {
      setForm({
        username: item.username || '',
        password: '',
        role: item.role === 'admin' ? 'superadmin' : item.role,
      })
    } else {
      setForm({
        ...emptyForm,
        role: roleOptions.some(option => option.value === 'publication_admin')
          ? 'publication_admin'
          : roleOptions[0]?.value || 'publication_admin',
      })
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

    const username = form.username.trim()
    if (!username) {
      setError('Username wajib diisi.')
      return
    }

    if (!editing && form.password.length < 8) {
      setError('Password administrator baru minimal 8 karakter.')
      return
    }

    if (editing && form.password && form.password.length < 8) {
      setError('Password baru minimal 8 karakter.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const payload = {
        username,
        role: form.role,
      }

      if (form.password) {
        payload.password = form.password
      }

      const editingSelf = editing?.id === user?.id

      await api(
        editing
          ? `/api/admin/admins/${editing.id}`
          : '/api/admin/admins',
        {
          method: editing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      if (editingSelf) {
        window.location.reload()
        return
      }

      closeModal()
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Administrator gagal disimpan.',
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
      await api(`/api/admin/admins/${deleting.id}`, {
        method: 'DELETE',
      })
      setDeleting(null)
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Administrator gagal dihapus.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!items) return <Loading />

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Kontrol Akses</p>
          <h1 className="admin-title mt-2">Administrator & Role</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
            Buat akun administrator sesuai tanggung jawabnya. Admin modul hanya
            dapat melihat menu dan mengakses API yang sesuai dengan role tersebut.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => start()}
        >
          <UserPlus className="h-4 w-4" />
          Tambah Admin
        </button>
      </div>

      {error && !open && (
        <p className="mt-5 rounded-md border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {items.length ? (
          items.map(item => {
            const isSelf = item.id === user?.id

            return (
              <article
                key={item.id}
                className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-muted)] text-[var(--admin-accent)]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-all text-base font-bold text-[var(--admin-text)]">
                        {item.username}
                      </h2>
                      {isSelf && (
                        <span className="rounded border border-[var(--admin-accent-border)] bg-[var(--admin-accent-soft)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--admin-accent)]">
                          Akun Anda
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm font-semibold text-[var(--admin-muted)]">
                      {item.role_label || item.role}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[var(--admin-muted)]">
                      {(item.permissions || []).length} izin aktif
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="btn-secondary py-2"
                    onClick={() => start(item)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>

                  {!isSelf && (
                    <button
                      type="button"
                      className="rounded-md border border-rose-200 px-3 text-rose-600 transition hover:bg-rose-50"
                      onClick={() => setDeleting(item)}
                      aria-label={`Hapus ${item.username}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <EmptyState
            title="Belum ada administrator"
            description="Tambahkan administrator pertama untuk membagi pengelolaan website."
            icon={UsersRound}
          />
        )}
      </div>

      <Modal
        open={open}
        title={editing ? 'Edit Administrator' : 'Tambah Administrator'}
        onClose={closeModal}
      >
        <form onSubmit={save} className="space-y-5">
          {error && (
            <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div>
            <label className="label" htmlFor="admin-username">
              Username
            </label>
            <input
              id="admin-username"
              className="field"
              value={form.username}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              minLength={3}
              maxLength={100}
              autoComplete="off"
              disabled={busy}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="admin-password">
              {editing ? 'Password Baru (opsional)' : 'Password'}
            </label>
            <input
              id="admin-password"
              type="password"
              className="field"
              value={form.password}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              minLength={8}
              autoComplete="new-password"
              disabled={busy}
              required={!editing}
            />
            <p className="mt-1.5 text-xs text-[var(--admin-muted)]">
              Minimal 8 karakter. Saat edit, kosongkan untuk mempertahankan password lama.
            </p>
          </div>

          <div>
            <label className="label">Role</label>
            <Dropdown
              value={form.role}
              onChange={value =>
                setForm(current => ({
                  ...current,
                  role: value,
                }))
              }
              options={roleOptions}
              variant="admin"
              ariaLabel="Pilih role administrator"
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
        title="Hapus administrator?"
        description={`Akun “${deleting?.username || ''}” akan dihapus permanen dan tidak dapat login kembali.`}
        busy={busy}
        onCancel={() => {
          if (!busy) setDeleting(null)
        }}
        onConfirm={remove}
      />
    </div>
  )
}
