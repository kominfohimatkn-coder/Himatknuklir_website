'use client'

import { Inbox } from 'lucide-react'
export default function EmptyState({ title = 'Belum ada data', description = 'Data akan tampil di sini setelah ditambahkan.' }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
    <Inbox className="mx-auto mb-3 h-8 w-8 text-slate-400" />
    <h3 className="font-bold text-slate-800">{title}</h3>
    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
  </div>
}
