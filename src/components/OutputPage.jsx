import { BoQTable } from './BoQTable';
import { RABTable } from './RABTable';
import { ChartSection } from './ChartSection';
import { SensitivityPanel } from './SensitivityPanel';
import { MaterialComparison } from './MaterialComparison';
import { getRegionLabel, getMultiplier } from '../data/priceDatabase.js';

const MATERIAL_LABEL = {
  bata_merah: 'Bata Merah',
  bata_hebel: 'Bata Hebel (AAC)',
  batako: 'Batako',
};

const STAT_CARDS = (v) => [
  { label: 'Luas Dinding Bersih',   val: `${v.totalLuas} m²` },
  { label: 'Volume Pasangan',        val: `${v.totalVolume} m³` },
  { label: 'Total Luas Plesteran',   val: `${v.totalLuasPlesteran} m²` },
  { label: 'Luas Lantai',            val: `${v.totalLuasLantai} m²` },
];

export function OutputPage({ params, volumeResult, rabResult, carbonResult, comparisonData, onBack, onMulaiUlang }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Print-only header (muncul hanya saat print/PDF) ── */}
      <div className="hidden print:flex items-center gap-4 pb-4 mb-2 border-b-2 border-green-800">
        <img src="/logo.png" alt="EcoSipil" className="h-14 w-14 object-contain" />
        <div>
          <p className="text-2xl font-bold text-green-800 leading-none">EcoSipil</p>
          <p className="text-xs text-green-600 leading-none mt-1">Cerdas. Terintegrasi. Berkelanjutan.</p>
        </div>
        <div className="ml-auto text-right text-xs text-gray-400">
          <p>Laporan Estimasi Dinding & RAB</p>
          <p>{new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}</p>
        </div>
      </div>

      {/* ── Header Ringkasan ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* Logo + nama app (screen only) */}
        <div className="print:hidden flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <img src="/logo.png" alt="EcoSipil" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-sm font-bold text-green-800 leading-none">EcoSipil</p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">Hasil Estimasi Dinding & RAB</p>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-green-800">
              {params.namaProyek || 'Proyek EcoSipil'}
            </h1>
            {params.lokasi && (
              <p className="text-sm text-gray-500 mt-0.5">
                {getRegionLabel(params.lokasi)}
                <span className="ml-2 text-xs text-gray-400">
                  (harga ×{getMultiplier(params.lokasi).toFixed(2)})
                </span>
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {MATERIAL_LABEL[params.material]} · Tinggi {params.tinggi} m · Tebal {params.tebal} m
            </p>
          </div>
          <div className="print:hidden flex gap-2 flex-wrap">
            <button
              onClick={onMulaiUlang}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              ↺ Mulai Ulang
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              ← Ubah Parameter
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800"
            >
              🖨 Print / PDF
            </button>
          </div>
        </div>

        {/* Kartu statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {STAT_CARDS(volumeResult).map(card => (
            <div key={card.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
              <p className="text-lg font-bold text-green-800 mt-1">{card.val}</p>
            </div>
          ))}
        </div>

        {volumeResult.totalLuasBukaan > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
            <span className="text-base">🚪</span>
            <span>
              Sudah dikurangi bukaan pintu/jendela:{' '}
              <strong className="text-orange-700">
                {volumeResult.totalLuasBukaan} m²
              </strong>
              {' '}(dari luas kotor{' '}
              <span className="font-mono">{volumeResult.totalLuasKotor} m²</span>)
            </span>
          </div>
        )}
      </div>

      {/* ── Tabel BoQ ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Bill of Quantity (BoQ)</h2>
          <p className="text-xs text-gray-400 mt-0.5">Kebutuhan material keseluruhan proyek</p>
        </div>
        <BoQTable items={volumeResult.boq} />
      </div>

      {/* ── Tabel RAB ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Rencana Anggaran Biaya (RAB)</h2>
          <p className="text-xs text-gray-400 mt-0.5">Estimasi biaya per item pekerjaan</p>
        </div>
        <RABTable items={rabResult.items} grandTotal={rabResult.grandTotal} />
      </div>

      {/* ── Panel Embodied Carbon ── */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌱</span>
          <h2 className="font-semibold text-green-900">Total Embodied Carbon Proyek Ini</h2>
        </div>
        <p className="text-4xl font-bold text-green-800 my-3">
          {carbonResult.total.toLocaleString('id-ID')}{' '}
          <span className="text-2xl font-semibold">kg CO₂e</span>
        </p>
        <p className="text-xs text-green-700 mb-4">
          Emisi gas rumah kaca fase konstruksi (material saja, tidak termasuk transportasi & alat berat)
        </p>
        <div className="space-y-1.5">
          {carbonResult.detail
            .filter(d => d.kgCO2e > 0)
            .map(d => (
              <div key={d.label} className="flex justify-between text-xs text-green-800">
                <span>{d.label}</span>
                <span className="font-mono font-medium">
                  {d.kgCO2e.toLocaleString('id-ID')} kg CO₂e
                </span>
              </div>
            ))}
        </div>
        <p className="text-xs text-green-600 mt-4 pt-3 border-t border-green-200">
          Sumber: Inventory of Carbon and Energy (ICE) v3.0, University of Bath
        </p>
      </div>

      {/* ── Komparasi Material ── */}
      {comparisonData && (
        <MaterialComparison
          comparisonData={comparisonData}
          selectedMaterial={params.material}
        />
      )}

      {/* ── Sensitivity Analysis ── */}
      <SensitivityPanel rabResult={rabResult} />

      {/* ── Chart Visualisasi ── */}
      <ChartSection rabResult={rabResult} carbonResult={carbonResult} />

      {/* ── Tombol Print mobile full-width ── */}
      <div className="print:hidden pb-2">
        <button
          onClick={() => window.print()}
          className="w-full py-4 rounded-xl bg-green-700 text-white text-base font-bold hover:bg-green-800 active:bg-green-900 shadow-sm"
        >
          🖨 Print / Simpan PDF
        </button>
      </div>

      {/* ── Footer branded ── */}
      <div className="pb-8 flex flex-col items-center gap-2 print:pb-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="EcoSipil" className="h-7 w-7 object-contain opacity-70" />
          <span className="text-sm font-bold text-green-800 opacity-70">EcoSipil</span>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Cerdas. Terintegrasi. Berkelanjutan.
        </p>
        <p className="text-xs text-gray-400 text-center">
          Independent project ·{' '}
          <a href="mailto:radithyaalfattan4@gmail.com" className="hover:text-gray-600 underline underline-offset-2">
            Radithya Al Fattan Pratomo
          </a>
          {' '}· Teknik Sipil UI 2024
        </p>
      </div>

    </div>
  );
}
