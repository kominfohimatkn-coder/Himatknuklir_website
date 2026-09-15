export function formatDate(value, withTime = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

export function statusLabel(status) {
  return ({ planned: 'Terencana', ongoing: 'Berjalan', done: 'Selesai', postponed: 'Ditunda', cancelled: 'Batal' })[status] || status
}

export function statusClass(status) {
  return ({
    planned: 'bg-slate-100 text-slate-700', ongoing: 'bg-emerald-100 text-emerald-800',
    done: 'bg-blue-100 text-blue-800', postponed: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-rose-100 text-rose-800',
  })[status] || 'bg-slate-100 text-slate-700'
}
