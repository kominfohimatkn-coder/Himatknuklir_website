'use client'

import { X } from 'lucide-react'
export default function Modal({ open, title, children, onClose, size = 'max-w-2xl' }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className={`max-h-[92vh] w-full ${size} overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
}
