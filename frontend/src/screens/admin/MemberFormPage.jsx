'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ImagePlus, Save, Trash2, UserRound } from 'lucide-react'
import { useNavigate, useParams } from '@/lib/react-router-dom-shim'
import ConfirmDialog from '../../components/ConfirmDialog'
import Dropdown from '../../components/dropdown'
import Loading from '../../components/Loading'
import { api, mediaUrl } from '../../lib/api'
import { divisions, periodOptions, positionsForDivision } from '../../lib/members'

const emptyForm = {
  nama: '',
  jabatan: 'Ketua Himpunan',
  divisi: 'Badan Pengurus Harian (BPH)',
  periode: '2025/2026',
  foto_url: '',
  foto: null,
}

export default function MemberFormPage({ mode = 'edit' }) {
  const { id } = useParams()
  const editing = mode === 'edit'
  const [form, setForm] = useState(editing ? null : emptyForm)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!editing) return
    api(`/api/admin/members/${id}`)
      .then(member => setForm({ ...member, foto: null }))
      .catch(err => setError(err.message))
  }, [editing, id])

  useEffect(() => {
    if (!form?.foto) {
      setPreview('')
      return undefined
    }
    const url = URL.createObjectURL(form.foto)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form?.foto])

  const basePositions = form ? positionsForDivision(form.divisi) : []
  const positionOptions = form?.jabatan && !basePositions.includes(form.jabatan)
    ? [form.jabatan, ...basePositions]
    : basePositions
  const basePeriods = periodOptions()
  const periods = form?.periode && !basePeriods.includes(form.periode)
    ? [form.periode, ...basePeriods]
    : basePeriods

  function changeDivision(value) {
    const positions = positionsForDivision(value)
    setForm(current => ({ ...current, divisi: value, jabatan: positions[0] }))
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const body = new FormData()
    body.append('nama', form.nama.trim())
    body.append('jabatan', form.jabatan)
    body.append('divisi', form.divisi)
    body.append('periode', form.periode)
    if (form.foto) body.append('foto', form.foto)

    try {
      await api(editing ? `/api/admin/members/${id}` : '/api/admin/members', {
        method: editing ? 'PUT' : 'POST',
        body,
      })
      navigate('/admin/struktur', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    setError('')
    try {
      await api(`/api/admin/members/${id}`, { method: 'DELETE' })
      navigate('/admin/struktur', { replace: true })
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    } finally {
      setBusy(false)
    }
  }

  if (!form && !error) return <Loading />

  return (
    <div className="mx-auto max-w-3xl">
      <button type="button" onClick={() => navigate('/admin/struktur')} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
      </button>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-7">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary-800">Manajemen Pengurus</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{editing ? 'Edit Data Fungsionaris' : 'Tambah Fungsionaris Baru'}</h2>
          <p className="mt-1 text-sm text-slate-500">{editing ? 'Perbarui identitas, jabatan, divisi, periode, atau foto pengurus.' : 'Isi data pengurus baru. Foto bersifat opsional.'}</p>
        </div>

        {form && (
          <form onSubmit={submit} className="space-y-6 p-5 sm:p-7">
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="member-name" className="label">Nama Lengkap</label>
                <input id="member-name" value={form.nama} onChange={event => setForm({ ...form, nama: event.target.value })} required minLength={2} maxLength={255} className="field min-h-11 bg-slate-50" placeholder="Nama lengkap pengurus" />
              </div>
              <div>
                <label className="label">Periode</label>
                <Dropdown
                  value={form.periode}
                  onChange={value => setForm(current => ({ ...current, periode: value }))}
                  options={periods.map(period => ({ value: period, label: period }))}
                  variant="admin"
                  showDescription={false}
                  ariaLabel="Pilih periode kepengurusan"
                />
              </div>

              <div>
                <label className="label">Divisi</label>
                <Dropdown
                  value={form.divisi}
                  onChange={changeDivision}
                  options={divisions.map(division => ({ value: division, label: division }))}
                  variant="admin"
                  showDescription={false}
                  ariaLabel="Pilih divisi pengurus"
                />
              </div>

              <div>
                <label className="label">Jabatan</label>
                <Dropdown
                  value={form.jabatan}
                  onChange={value => setForm(current => ({ ...current, jabatan: value }))}
                  options={positionOptions.map(position => ({ value: position, label: position }))}
                  variant="admin"
                  showDescription={false}
                  ariaLabel="Pilih jabatan pengurus"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-white sm:mx-0">
                  {preview || form.foto_url ? (
                    <img src={preview || mediaUrl(form.foto_url)} alt="Preview foto pengurus" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center"><UserRound className="h-8 w-8 text-slate-300" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <label htmlFor="member-photo" className="label">{editing ? 'Ganti Foto (Opsional)' : 'Foto (Opsional)'}</label>
                  <label htmlFor="member-photo" className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-primary-800 hover:text-primary-900 sm:justify-start">
                    <ImagePlus className="h-5 w-5" />
                    <span className="truncate">{form.foto?.name || 'Pilih JPG, PNG, atau WebP'}</span>
                  </label>
                  <input id="member-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => setForm({ ...form, foto: event.target.files?.[0] || null })} />
                  <p className="mt-2 text-xs leading-5 text-slate-400">{editing ? 'Kosongkan jika foto saat ini tidak ingin diubah.' : 'Gunakan foto potret dengan wajah berada di tengah.'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {editing ? (
                <button type="button" onClick={() => setDeleting(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100">
                  <Trash2 className="h-4 w-4" /> Hapus Pengurus
                </button>
              ) : <span />}
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" onClick={() => navigate('/admin/struktur')} className="btn-secondary min-h-11">Batal</button>
                <button type="submit" disabled={busy} className="btn-primary min-h-11">
                  <Save className="h-4 w-4" /> {busy ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Simpan Data'}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      <ConfirmDialog
        open={deleting}
        title="Hapus pengurus?"
        description={`Data “${form?.nama || ''}” dan foto terkait akan dihapus permanen.`}
        busy={busy}
        onCancel={() => setDeleting(false)}
        onConfirm={remove}
      />
    </div>
  )
}
