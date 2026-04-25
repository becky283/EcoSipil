// Koefisien material per m² luas dinding (SNI 7394:2008)
// Bata Hebel & Batako: nilai referensi lapangan
// Cat: per m² luas acian (kedua sisi dinding)

const pengecatan = {
  cat_dasar:     { jumlah: 0.10, satuan: 'liter', label: 'Cat Dasar (Primer)' },
  cat_finishing: { jumlah: 0.20, satuan: 'liter', label: 'Cat Tembok Finishing' },
};

export const materialCoeff = {
  bata_merah: {
    pasangan: {
      bata:  { jumlah: 70,    satuan: 'buah', label: 'Bata Merah' },
      semen: { jumlah: 11.5,  satuan: 'kg',   label: 'Semen Portland (pasangan)' },
      pasir: { jumlah: 0.043, satuan: 'm³',   label: 'Pasir Pasang' },
    },
    plesteran: {
      semen: { jumlah: 6.24,  satuan: 'kg',  label: 'Semen Portland (plesteran)' },
      pasir: { jumlah: 0.024, satuan: 'm³',  label: 'Pasir Plesteran' },
    },
    acian: {
      semen: { jumlah: 3.25, satuan: 'kg', label: 'Semen Acian' },
    },
    pengecatan,
  },

  bata_hebel: {
    pasangan: {
      bata:   { jumlah: 8.3, satuan: 'buah', label: 'Bata Hebel (AAC)' },
      mortar: { jumlah: 5.0, satuan: 'kg',   label: 'Mortar Adhesif Hebel' },
    },
    plesteran: {
      semen: { jumlah: 5.0,  satuan: 'kg',  label: 'Semen Plesteran Hebel' },
      pasir: { jumlah: 0.018, satuan: 'm³', label: 'Pasir Plesteran' },
    },
    acian: {
      semen: { jumlah: 3.0, satuan: 'kg', label: 'Semen Acian' },
    },
    pengecatan,
  },

  batako: {
    pasangan: {
      bata:  { jumlah: 12.5,  satuan: 'buah', label: 'Batako' },
      semen: { jumlah: 8.0,   satuan: 'kg',   label: 'Semen Portland (pasangan)' },
      pasir: { jumlah: 0.030, satuan: 'm³',   label: 'Pasir Pasang' },
    },
    plesteran: {
      semen: { jumlah: 6.24,  satuan: 'kg',  label: 'Semen Portland (plesteran)' },
      pasir: { jumlah: 0.024, satuan: 'm³',  label: 'Pasir Plesteran' },
    },
    acian: {
      semen: { jumlah: 3.25, satuan: 'kg', label: 'Semen Acian' },
    },
    pengecatan,
  },
};
