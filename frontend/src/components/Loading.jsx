'use client'

export default function Loading({ label = 'Memuat data…', full = false }) {
  return <div className={`flex items-center justify-center gap-3 text-sm font-semibold text-slate-500 ${full ? 'min-h-[60vh]' : 'py-16'}`}>
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-nuclear-700" /> {label}
  </div>
}
