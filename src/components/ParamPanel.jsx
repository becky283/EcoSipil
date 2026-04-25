import { useState } from 'react';
import { jabodetabekRegions, getAdjustedPrices, getMultiplier } from '../data/priceDatabase.js';

const TEBAL_PRESETS = [0.10, 0.15, 0.20];

const MATERIAL_OPTIONS = [
  { value: 'bata_merah', label: 'Bata Merah' },
  { value: 'bata_hebel', label: 'Bata Hebel (AAC)' },
  { value: 'batako',     label: 'Batako' },
];

// Kelompokkan wilayah agar dropdown lebih rapi
const REGION_GROUPS = [
  {
    label: 'Jakarta',
    options: jabodetabekRegions.filter(r => r.value.startsWith('jakarta')),
  },
  {
    label: 'Bogor',
    options: jabodetabekRegions.filter(r => r.value.startsWith('bogor')),
  },
  {
    label: 'Depok',
    options: jabodetabekRegions.filter(r => r.value === 'depok'),
  },
  {
    label: 'Tangerang',
    options: jabodetabekRegions.filter(r => r.value.startsWith('tangerang')),
  },
  {
    label: 'Bekasi',
    options: jabodetabekRegions.filter(r => r.value.startsWith('bekasi')),
  },
];

function formatRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function ParamPanel({ totalPanjang, onHitung, onBack }) {
  const [namaProyek, setNamaProyek]   = useState('');
  const [lokasi, setLokasi]           = useState('depok'); // default Depok (multiplier 1.0)
  const [tinggi, setTinggi]           = useState(3.0);
  const [tebalPreset, setTebalPreset] = useState(0.15);
  const [tebalCustom, setTebalCustom] = useState('');
  const [material, setMaterial]       = useState('bata_merah');

  const tebalAktif   = tebalCustom !== '' ? parseFloat(tebalCustom) : tebalPreset;
  const luasEstimasi = (totalPanjang * tinggi).toFixed(2);
  const multiplier   = getMultiplier(lokasi);
  const hargaPreview = lokasi ? getAdjustedPrices(material, lokasi) : null;

  const handleHitung = () => {
    if (!tebalAktif || tebalAktif <= 0 || tinggi < 1 || tinggi > 6) return;
    onHitung({ namaProyek, lokasi, tinggi, tebal: tebalAktif, material });
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

        {/* ── Pengaturan Proyek ── */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-4">Pengaturan Proyek</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Proyek</label>
              <input
                type="text"
                value={namaProyek}
                onChange={e => setNamaProyek(e.target.value)}
                placeholder="Contoh: Rumah Pak Budi"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Dropdown Wilayah Jabodetabek */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Proyek</label>
              <select
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {REGION_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map(r => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Info multiplier harga */}
              {lokasi && (
                <div className={`mt-2 text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                  multiplier > 1.05 ? 'bg-orange-50 text-orange-700' :
                  multiplier < 0.95 ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  <span>
                    {multiplier > 1.05 ? '↑' : multiplier < 0.95 ? '↓' : '●'}
                  </span>
                  <span>
                    Penyesuaian harga wilayah: <strong>×{multiplier.toFixed(2)}</strong>
                    {multiplier > 1 ? ` (+${((multiplier - 1) * 100).toFixed(0)}% dari harga dasar)` :
                     multiplier < 1 ? ` (−${((1 - multiplier) * 100).toFixed(0)}% dari harga dasar)` :
                     ' (harga dasar)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* ── Parameter Dinding ── */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-4">Parameter Dinding</h2>
          <div className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tinggi Dinding (m)</label>
              <input
                type="number"
                min="1.0"
                max="6.0"
                step="0.1"
                value={tinggi}
                onChange={e => setTinggi(parseFloat(e.target.value) || 3)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">Min 1.0 m · Max 6.0 m · Default 3.0 m</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tebal Dinding (m)</label>
              <div className="flex gap-2 mb-2">
                {TEBAL_PRESETS.map(t => (
                  <button
                    key={t}
                    onClick={() => { setTebalPreset(t); setTebalCustom(''); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      tebalPreset === t && tebalCustom === ''
                        ? 'bg-green-700 text-white border-green-700'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-green-400'
                    }`}
                  >
                    {t.toFixed(2)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="0.05"
                max="0.50"
                step="0.01"
                value={tebalCustom}
                onChange={e => setTebalCustom(e.target.value)}
                placeholder="Atau ketik manual, mis: 0.12"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Material</label>
              <select
                value={material}
                onChange={e => setMaterial(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {MATERIAL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Preview Harga Satuan ── */}
        {hargaPreview && (
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700 mb-2">Preview Harga Satuan (sudah disesuaikan wilayah)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span>Pasangan</span>  <span className="font-mono text-right">{formatRp(hargaPreview.pasangan)}/m²</span>
              <span>Plesteran</span> <span className="font-mono text-right">{formatRp(hargaPreview.plesteran)}/m²</span>
              <span>Acian</span>     <span className="font-mono text-right">{formatRp(hargaPreview.acian)}/m²</span>
              <span>Pengecatan</span><span className="font-mono text-right">{formatRp(hargaPreview.pengecatan)}/m²</span>
            </div>
          </div>
        )}

        {/* ── Ringkasan dari Sketsa ── */}
        <div className="bg-green-50 rounded-xl p-4 text-sm text-green-900 space-y-1">
          <p className="font-semibold">Ringkasan dari Sketsa</p>
          <p>Total panjang dinding: <span className="font-bold">{totalPanjang.toFixed(2)} m</span></p>
          <p>Estimasi luas dinding: <span className="font-bold">{luasEstimasi} m²</span></p>
          <p>Tebal aktif: <span className="font-bold">{tebalAktif ? tebalAktif.toFixed(2) : '—'} m</span></p>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col gap-3 pt-1">
          <button
            onClick={handleHitung}
            className="w-full py-4 rounded-xl bg-green-700 text-white text-base font-bold hover:bg-green-800 active:bg-green-900 transition-colors shadow-sm"
          >
            Hitung Estimasi →
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            ← Kembali ke Sketsa
          </button>
        </div>

      </div>
    </div>
  );
}
