// Harga satuan pekerjaan per m² — harga dasar (referensi Depok/Bekasi Kota = 1.00)
// Multiplier per wilayah berdasarkan HSPK 2024 Jabodetabek

export const basePrices = {
  bata_merah: {
    pasangan:    185_000,
    plesteran:    65_000,
    acian:        45_000,
    pengecatan:   55_000,
  },
  bata_hebel: {
    pasangan:    220_000,
    plesteran:    55_000,
    acian:        45_000,
    pengecatan:   55_000,
  },
  batako: {
    pasangan:    150_000,
    plesteran:    65_000,
    acian:        45_000,
    pengecatan:   55_000,
  },
};

export const jabodetabekRegions = [
  // Jakarta
  { value: 'jakarta_pusat',     label: 'Jakarta Pusat',     multiplier: 1.15 },
  { value: 'jakarta_selatan',   label: 'Jakarta Selatan',   multiplier: 1.12 },
  { value: 'jakarta_utara',     label: 'Jakarta Utara',     multiplier: 1.10 },
  { value: 'jakarta_barat',     label: 'Jakarta Barat',     multiplier: 1.08 },
  { value: 'jakarta_timur',     label: 'Jakarta Timur',     multiplier: 1.08 },
  // Bogor
  { value: 'bogor_kota',        label: 'Kota Bogor',        multiplier: 0.95 },
  { value: 'bogor_kab',         label: 'Kab. Bogor',        multiplier: 0.87 },
  // Depok
  { value: 'depok',             label: 'Depok',             multiplier: 1.00 },
  // Tangerang
  { value: 'tangerang_selatan', label: 'Tangerang Selatan', multiplier: 1.05 },
  { value: 'tangerang_kota',    label: 'Kota Tangerang',    multiplier: 1.00 },
  { value: 'tangerang_kab',     label: 'Kab. Tangerang',    multiplier: 0.93 },
  // Bekasi
  { value: 'bekasi_kota',       label: 'Kota Bekasi',       multiplier: 0.98 },
  { value: 'bekasi_kab',        label: 'Kab. Bekasi',       multiplier: 0.90 },
];

export function getRegionLabel(value) {
  return jabodetabekRegions.find(r => r.value === value)?.label ?? value;
}

export function getMultiplier(lokasi) {
  return jabodetabekRegions.find(r => r.value === lokasi)?.multiplier ?? 1.0;
}

// Hitung harga final per m² setelah multiplier, dibulatkan ke ribuan
export function getAdjustedPrices(material, lokasi) {
  const base   = basePrices[material];
  const multi  = getMultiplier(lokasi);
  const round  = (n) => Math.round((n * multi) / 1000) * 1000;
  return {
    pasangan:   round(base.pasangan),
    plesteran:  round(base.plesteran),
    acian:      round(base.acian),
    pengecatan: round(base.pengecatan),
  };
}
