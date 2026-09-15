export const settingGroups = [
  {
    id: 'identity',
    title: 'Identitas Website',
    shortTitle: 'Identitas',
    description:
      'Nama organisasi, institusi, dan periode yang muncul pada website.',
    fields: [
      ['brand_name', 'Nama Organisasi'],
      ['brand_subtitle', 'Subjudul Organisasi'],
      ['period_label', 'Periode Kepengurusan'],
    ],
  },
  {
    id: 'hero',
    title: 'Hero Landing Page',
    shortTitle: 'Hero',
    description:
      'Bagian pertama yang dilihat pengunjung saat membuka beranda.',
    fields: [
      ['hero_eyebrow', 'Label Kecil di Atas Judul'],
      ['hero_title', 'Judul Utama'],
      ['hero_emphasis', 'Teks Miring / Penekanan'],
      ['hero_description', 'Deskripsi Singkat', 'textarea'],
      ['hero_primary_label', 'Teks Tombol Kegiatan'],
      ['hero_secondary_label', 'Teks Tombol Pengurus'],
    ],
  },
  {
    id: 'about',
    title: 'Tentang Organisasi',
    shortTitle: 'Tentang',
    description:
      'Judul, penjelasan, dan tiga fokus utama organisasi.',
    fields: [
      ['about_eyebrow', 'Label Bagian'],
      ['about_title', 'Judul Tentang', 'textarea'],
      ['about_description', 'Deskripsi Tentang', 'textarea'],
    ],
    collections: [1, 2, 3].map(index => ({
      id: `about-focus-${index}`,
      title: `Fokus Organisasi ${index}`,
      description:
        'Label singkat, judul, dan penjelasan fokus.',
      fields: [
        [`about_item_${index}_tag`, 'Label Fokus'],
        [`about_item_${index}_title`, 'Judul Fokus'],
        [
          `about_item_${index}_description`,
          'Deskripsi Fokus',
          'textarea',
        ],
      ],
    })),
  },
  {
    id: 'programs',
    title: 'Program Kerja',
    shortTitle: 'Program',
    description:
      'Teks pembuka pada bagian daftar program kerja.',
    fields: [
      ['program_eyebrow', 'Label Bagian'],
      ['program_title', 'Judul Bagian', 'textarea'],
      ['program_empty_text', 'Pesan Saat Belum Ada Program'],
    ],
  },
  {
    id: 'news',
    title: 'Publikasi',
    shortTitle: 'Publikasi',
    description:
      'Teks pembuka dan tombol pada bagian publikasi terbaru.',
    fields: [
      ['news_eyebrow', 'Label Bagian'],
      ['news_title', 'Judul Bagian', 'textarea'],
      ['news_empty_text', 'Pesan Saat Belum Ada Publikasi'],
      ['news_more_label', 'Teks Tombol Lihat Semua'],
    ],
  },
  {
    id: 'structure',
    title: 'Struktur Organisasi',
    shortTitle: 'Struktur',
    description:
      'Pengantar struktur dan enam ringkasan kelompok kepengurusan.',
    fields: [
      ['structure_eyebrow', 'Label Bagian'],
      ['structure_title', 'Judul Struktur', 'textarea'],
      ['structure_description', 'Deskripsi Struktur', 'textarea'],
      ['structure_note', 'Catatan di Bawah Daftar'],
      ['structure_button_label', 'Teks Tombol Lihat Struktur'],
    ],
    collections: [1, 2, 3, 4, 5, 6].map(index => ({
      id: `structure-card-${index}`,
      title: `Ringkasan Struktur ${index}`,
      description:
        'Jenis kelompok, nama kelompok, dan deskripsinya.',
      fields: [
        [`structure_item_${index}_kind`, 'Jenis Kelompok'],
        [`structure_item_${index}_title`, 'Nama Kelompok'],
        [
          `structure_item_${index}_description`,
          'Deskripsi',
          'textarea',
        ],
      ],
    })),
  },
  {
    id: 'contact',
    title: 'Kontak dan Tautan',
    shortTitle: 'Kontak',
    description:
      'Kontak resmi, media sosial, Bank Soal, dan alamat sekretariat.',
    fields: [
      ['contact_eyebrow', 'Label Bagian'],
      ['contact_title', 'Judul Kontak', 'textarea'],
      ['contact_description', 'Deskripsi Kontak', 'textarea'],
      ['contact_button_label', 'Teks Tombol Email'],
      ['contact_back_label', 'Teks Tombol Kembali'],
      ['contact_email', 'Email Resmi'],
      ['instagram_url', 'Tautan Instagram'],
      ['instagram_label', 'Nama Instagram yang Ditampilkan'],
      ['bank_soal_url', 'Tautan Bank Soal'],
      ['secretariat', 'Alamat Sekretariat', 'textarea'],
    ],
  },
  {
    id: 'footer',
    title: 'Footer dan Lokasi',
    shortTitle: 'Footer',
    description:
      'Informasi penutup website dan lokasi yang ditampilkan pada peta.',
    fields: [
      ['footer_copyright', 'Teks Hak Cipta'],
      ['footer_institution', 'Nama Institusi'],
      ['map_embed_url', 'Tautan Google Maps'],
    ],
  },
]

function getGroupFields(group) {
  return [
    ...(group.fields || []),
    ...(group.collections || []).flatMap(
      collection => collection.fields || [],
    ),
  ]
}

export const allSettingFields =
  settingGroups.flatMap(getGroupFields)