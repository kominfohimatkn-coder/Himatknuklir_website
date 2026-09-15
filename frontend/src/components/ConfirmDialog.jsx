'use client'

import Modal from './Modal'
export default function ConfirmDialog({ open, title = 'Hapus data?', description, busy, onCancel, onConfirm }) {
  return <Modal open={open} title={title} onClose={onCancel} size="max-w-md">
    <p className="text-sm leading-6 text-slate-600">{description || 'Tindakan ini tidak dapat dibatalkan.'}</p>
    <div className="mt-6 flex justify-end gap-3">
      <button className="btn-secondary" onClick={onCancel} disabled={busy}>Batal</button>
      <button className="rounded-lg bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50" onClick={onConfirm} disabled={busy}>{busy ? 'Menghapus…' : 'Hapus'}</button>
    </div>
  </Modal>
}
