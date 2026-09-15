export const divisions = [
  'Badan Pengurus Harian (BPH)',
  'Divisi Internal',
  'Divisi Eksternal',
  'Divisi Keuangan',
  'Divisi Minfo',
  'Divisi Minat dan Bakat',
  'Divisi Reaksi',
  'Divisi Sosmas',
  'Pembimbing',
]

export const positionsByDivision = {
  'Badan Pengurus Harian (BPH)': [
    'Ketua Himpunan',
    'Wakil Ketua Himpunan',
    'Sekretaris I',
    'Sekretaris II',
    'Bendahara I',
    'Bendahara II',
  ],
  Pembimbing: ['Dosen Pembimbing'],
  _default: ['Kepala Divisi', 'Sekretaris Divisi', 'Anggota'],
}

export function positionsForDivision(division) {
  return positionsByDivision[division] || positionsByDivision._default
}

export function periodOptions(currentYear = new Date().getFullYear()) {
  const start = Math.max(2025, currentYear - 1)
  return Array.from({ length: 5 }, (_, index) => {
    const year = start + index
    return `${year}/${year + 1}`
  })
}
