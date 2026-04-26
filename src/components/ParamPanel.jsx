import { useState } from 'react';
import { jabodetabekRegions, getAdjustedPrices, getMultiplier } from '../data/priceDatabase.js';
import { SCALE } from '../hooks/useDrawing.js';

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

const OPENING_TYPES = [
  { value: 'pintu',   label: 'Pintu',    defaultL: 0.9, defaultT: 2.1 },
  { value: 'jendela', label: 'Jendela',  defaultL: 1.2, defaultT: 1.2 },
  { value: 'lainnya', label: 'Lainnya',  defaultL: 1.0, defaultT: 1.0 },
];

function wallLabel(points, isClosed, idx) {
  const p1 = points[idx];
  const p2 = idx < points.length - 1 ? points[idx + 1] : points[0];
  if (!p1 || !p2) return `Dinding ${idx + 1}`;
  const dx = (p2.x - p1.x) * SCALE;
  const dy = (p2.y - p1.y) * SCALE;
  const len = Math.sqrt(dx * dx + dy * dy).toFixed(2);
  return `Dinding ${idx + 1} (${len} m)`;
}

function wallCount(points, isClosed) {
  if (points.length < 2) return 0;
  return isClosed ? points.length : points.length - 1;
}

export function ParamPanel({ totalPanjang, points, isClosed, openings, onOpeningsChange, onHitung, onBack }) {
  const [namaProyek, setNamaProyek]   = useState('');
  const [lokasi, setLokasi]           = useState('depok'); // default Depok (multiplier 1.0)
  const [tinggi, setTinggi]           = useState(3.0);
  const [tebalPreset, setTebalPreset] = useState(0.15);
  const [tebalCustom, setTebalCustom] = useState('');
  const [material, setMaterial]       = useState('bata_merah');

  const [newOpType,  setNewOpType]  = useState('pintu');
  const [newOpWall,  setNewOpWall]  = useState(0);
  const [newOpLebar, setNewOpLebar] = useState(0.9);
  const [newOpTinggi,setNewOpTinggi]= useState(2.1);

  const tebalAktif   = tebalCustom !== '' ? parseFloat(tebalCustom) : tebalPreset;
  const luasEstimasi = (totalPanjang * tinggi).toFixed(2);
  const multiplier   = getMultiplier(lokasi);
  const hargaPreview = lokasi ? getAdjustedPrices(material, lokasi) : null;
  const nWalls       = wallCount(points, isClosed);
  const totalLuasBukaan = openings.reduce((s, o) => s + o.lebar * o.tinggi, 0);

  const handleAddOpening = () => {
    if (nWalls === 0) return;
    onOpeningsChange([...openings, {
      id: Date.now(),
      wallIndex: newOpWall,
      type: newOpType,
      lebar: +newOpLebar,
      tinggi: +newOpTinggi,
    }]);
  };

  const handleRemoveOpening = (id) => {
    onOpeningsChange(openings.filter(o => o.id !== id));
  };

  const handleTypeChange = (val) => {
    setNewOpType(val);
    const preset = OPENING_TYPES.find(t => t.value === val);
    if (preset) { setNewOpLebar(preset.defaultL); setNewOpTinggi(preset.defaultT); }
  };

  const handleHitung = () => {
    if (!tebalAktif || tebalAktif <= 0 || tinggi < 1 || tinggi > 6) return;
    onHitung({ namaProyek, lokasi, tinggi, tebal: tebalAktif, material });
  };

  return (
    <div className="max-w-lg mx-auto">

      {/* ── Logo mini ParamPanel ── */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <img src="/logo.png" alt="EcoSipil" className="h-10 w-10 object-contain" />
        <div>
          <p className="text-sm font-bold text-green-800 leading-none">EcoSipil</p>
          <p className="text-xs text-gray-400 leading-none mt-0.5">Parameter Dinding</p>
        </div>
      </div>

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
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Tinggi Dinding</label>
                <span className="text-lg font-bold text-green-700">{tinggi.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="6.0"
                step="0.1"
                value={tinggi}
                onChange={e => setTinggi(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-green-600"
                style={{ background: `linear-gradient(to right, #16a34a ${((tinggi - 2) / 4) * 100}%, #e5e7eb ${((tinggi - 2) / 4) * 100}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>2.0 m</span>
                <span>3.0 m (standar)</span>
                <span>6.0 m</span>
              </div>
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

        <hr className="border-gray-100" />

        {/* ── Bukaan Pintu & Jendela ── */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Bukaan Pintu &amp; Jendela</h2>
          <p className="text-xs text-gray-400 mb-4">
            Luas bukaan akan dikurangkan dari total luas dinding dan plesteran secara otomatis
          </p>

          {nWalls === 0 ? (
            <p className="text-xs text-gray-400 italic">Selesaikan sketsa dinding terlebih dahulu</p>
          ) : (
            <div className="space-y-3">
              {/* Form tambah bukaan */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipe Bukaan</label>
                    <select
                      value={newOpType}
                      onChange={e => handleTypeChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {OPENING_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pada Dinding</label>
                    <select
                      value={newOpWall}
                      onChange={e => setNewOpWall(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {Array.from({ length: nWalls }, (_, i) => (
                        <option key={i} value={i}>{wallLabel(points, isClosed, i)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Lebar (m)</label>
                    <input
                      type="number" min="0.3" max="5" step="0.05"
                      value={newOpLebar}
                      onChange={e => setNewOpLebar(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tinggi (m)</label>
                    <input
                      type="number" min="0.3" max="4" step="0.05"
                      value={newOpTinggi}
                      onChange={e => setNewOpTinggi(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddOpening}
                  className="w-full py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800"
                >
                  + Tambah Bukaan
                </button>
              </div>

              {/* Daftar bukaan yang sudah ditambahkan */}
              {openings.length > 0 && (
                <div className="space-y-2">
                  {openings.map(o => {
                    const typeLabel = OPENING_TYPES.find(t => t.value === o.type)?.label ?? o.type;
                    return (
                      <div key={o.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">{typeLabel}</span>
                          <span className="text-gray-400 ml-2">
                            {wallLabel(points, isClosed, o.wallIndex)} · {o.lebar} × {o.tinggi} m
                            <span className="ml-1 font-mono text-green-700">
                              = {(o.lebar * o.tinggi).toFixed(2)} m²
                            </span>
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveOpening(o.id)}
                          className="text-red-400 hover:text-red-600 text-base leading-none ml-2 shrink-0"
                          aria-label="Hapus"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  <p className="text-xs text-right text-gray-500">
                    Total bukaan:{' '}
                    <strong className="text-red-600">{totalLuasBukaan.toFixed(2)} m²</strong>
                    {' '}dikurangi dari luas dinding
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Ringkasan dari Sketsa ── */}
        <div className="bg-green-50 rounded-xl p-4 text-sm text-green-900 space-y-1">
          <p className="font-semibold">Ringkasan dari Sketsa</p>
          <p>Total panjang dinding: <span className="font-bold">{totalPanjang.toFixed(2)} m</span></p>
          <p>Luas dinding kotor: <span className="font-bold">{luasEstimasi} m²</span></p>
          {openings.length > 0 && (
            <p>Dikurangi bukaan: <span className="font-bold text-red-600">−{totalLuasBukaan.toFixed(2)} m²</span></p>
          )}
          <p>
            Luas dinding bersih:{' '}
            <span className="font-bold">
              {Math.max(0, parseFloat(luasEstimasi) - totalLuasBukaan).toFixed(2)} m²
            </span>
          </p>
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
