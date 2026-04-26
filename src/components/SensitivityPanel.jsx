import { useMemo, useState } from 'react';

function formatRp(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function formatDelta(n) {
  const sign = n >= 0 ? '+' : '−';
  return sign + 'Rp ' + Math.round(Math.abs(n)).toLocaleString('id-ID');
}

/**
 * Sensitivity analysis engine (Python-style adapted to Vanilla JS).
 *
 * Untuk setiap item RAB dengan toleransi tol_i (%):
 *   best_i  = base_i × (1 − tol_i / 100)
 *   worst_i = base_i × (1 + tol_i / 100)
 *
 * Karena best_i + worst_i = 2 × base_i, maka:
 *   baseTotal = (bestTotal + worstTotal) / 2  → selalu tepat di tengah
 *
 * Sensitivity Index item i = (variance_i / Σ variance) × 100
 * → mengukur seberapa besar kontribusi item i terhadap total ketidakpastian.
 */
function computeSensitivity(items, tolerances) {
  const rows = items.map((item, i) => {
    const tol      = tolerances[i] / 100;
    const variance = item.jumlah * tol;        // setengah lebar interval
    return {
      uraian:   item.uraian,
      base:     item.jumlah,
      best:     item.jumlah * (1 - tol),
      worst:    item.jumlah * (1 + tol),
      variance,
      tol,
    };
  });

  const baseTotal  = rows.reduce((s, r) => s + r.base,  0);
  const bestTotal  = rows.reduce((s, r) => s + r.best,  0);
  const worstTotal = rows.reduce((s, r) => s + r.worst, 0);
  const totalVariance = rows.reduce((s, r) => s + r.variance, 0);

  const withIndex = rows.map(r => ({
    ...r,
    // Kontribusi item ini terhadap total ketidakpastian (%)
    sensitivityIndex: totalVariance > 0
      ? (r.variance / totalVariance) * 100
      : 0,
  }));

  return {
    rows: withIndex,
    baseTotal,
    bestTotal,
    worstTotal,
    range: worstTotal - bestTotal,
    rangePercent: baseTotal > 0
      ? ((worstTotal - bestTotal) / baseTotal) * 100
      : 0,
  };
}

// ── Slider styled component ──────────────────────────────────────────────────
function TolSlider({ value, onChange, label, accent = false }) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 truncate pr-2">{label}</span>
          <span className={`text-xs font-bold w-10 text-right shrink-0 ${accent ? 'text-green-700' : 'text-gray-700'}`}>
            ±{value}%
          </span>
        </div>
      )}
      <input
        type="range"
        min="1"
        max="30"
        step="1"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-green-600"
        style={{ background: `linear-gradient(to right, #16a34a ${((value - 1) / 29) * 100}%, #e5e7eb ${((value - 1) / 29) * 100}%)` }}
      />
    </div>
  );
}

// ── Kartu ringkasan skenario ─────────────────────────────────────────────────
function ScenarioCard({ label, amount, delta, colorClass, borderClass, badgeClass }) {
  return (
    <div className={`rounded-xl p-4 text-center border ${borderClass} ${colorClass}`}>
      <p className={`text-xs font-semibold ${badgeClass}`}>{label}</p>
      <p className="text-sm font-bold mt-1 text-gray-800 leading-tight">
        {formatRp(amount)}
      </p>
      {delta !== null && (
        <p className={`text-xs mt-1 font-medium ${badgeClass}`}>
          {formatDelta(delta)}
        </p>
      )}
    </div>
  );
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export function SensitivityPanel({ rabResult }) {
  const [globalTol, setGlobalTol] = useState(10);
  const [isCustom,  setIsCustom]  = useState(false);
  const [perItem,   setPerItem]   = useState(() => rabResult.items.map(() => 10));

  const tolerances = isCustom ? perItem : rabResult.items.map(() => globalTol);

  const result = useMemo(
    () => computeSensitivity(rabResult.items, tolerances),
    [rabResult.items, tolerances],
  );

  const handleGlobal = (val) => {
    setGlobalTol(val);
    if (!isCustom) setPerItem(rabResult.items.map(() => val));
  };

  const handleItem = (i, val) => {
    setPerItem(prev => { const n = [...prev]; n[i] = val; return n; });
  };

  const toggleCustom = () => {
    if (!isCustom) setPerItem(rabResult.items.map(() => globalTol));
    setIsCustom(c => !c);
  };

  // Sorted by variance descending for the sensitivity bar chart
  const sorted = [...result.rows].sort((a, b) => b.variance - a.variance);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Sensitivity Analysis — Fluktuasi Harga</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Simulasi skenario best-case & worst-case dari total biaya akibat fluktuasi harga material
        </p>
      </div>

      <div className="p-6 space-y-7">

        {/* ── 1. Slider Global ─────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Toleransi Fluktuasi Global</p>
            <span className="text-xl font-bold text-green-700">±{globalTol}%</span>
          </div>
          <TolSlider value={globalTol} onChange={handleGlobal} accent />
          <div className="flex justify-between text-xs text-gray-400">
            <span>±1% (sangat stabil)</span>
            <span>±30% (sangat fluktuatif)</span>
          </div>
        </div>

        {/* ── 2. Per-item toggle ───────────────────────────────────── */}
        <div>
          <button
            onClick={toggleCustom}
            className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800"
          >
            <span className="text-base leading-none">{isCustom ? '▲' : '▼'}</span>
            {isCustom ? 'Sembunyikan toleransi per item' : 'Atur toleransi per item'}
          </button>

          {isCustom && (
            <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-4">
              {rabResult.items.map((item, i) => (
                <TolSlider
                  key={item.uraian}
                  value={perItem[i]}
                  onChange={val => handleItem(i, val)}
                  label={item.uraian.replace('Pek. ', '')}
                />
              ))}
              <button
                onClick={() => { setPerItem(rabResult.items.map(() => globalTol)); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
              >
                Reset semua ke ±{globalTol}%
              </button>
            </div>
          )}
        </div>

        {/* ── 3. Tiga Kartu Skenario ───────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <ScenarioCard
            label="Best Case"
            amount={result.bestTotal}
            delta={result.bestTotal - result.baseTotal}
            colorClass="bg-green-50"
            borderClass="border-green-200"
            badgeClass="text-green-700"
          />
          <ScenarioCard
            label="Estimasi Saat Ini"
            amount={result.baseTotal}
            delta={null}
            colorClass="bg-gray-50"
            borderClass="border-gray-200"
            badgeClass="text-gray-500"
          />
          <ScenarioCard
            label="Worst Case"
            amount={result.worstTotal}
            delta={result.worstTotal - result.baseTotal}
            colorClass="bg-red-50"
            borderClass="border-red-200"
            badgeClass="text-red-600"
          />
        </div>

        {/* ── 4. Range Visual Bar ──────────────────────────────────── */}
        <div className="space-y-2">
          <div className="relative h-7 rounded-xl overflow-hidden flex">
            <div className="flex-1 bg-green-100 flex items-center justify-start pl-3">
              <span className="text-xs font-semibold text-green-700 truncate">
                {formatRp(result.bestTotal)}
              </span>
            </div>
            <div className="px-3 bg-yellow-50 flex items-center border-x border-yellow-200">
              <span className="text-xs font-bold text-yellow-700 whitespace-nowrap">
                ±{result.rangePercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex-1 bg-red-100 flex items-center justify-end pr-3">
              <span className="text-xs font-semibold text-red-600 truncate">
                {formatRp(result.worstTotal)}
              </span>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500">
            Rentang total ketidakpastian:{' '}
            <strong className="text-gray-700">{formatRp(result.range)}</strong>
          </p>
        </div>

        {/* ── 5. Sensitivity Index per Item ────────────────────────── */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Indeks Sensitivitas per Item Pekerjaan
          </p>
          <p className="text-xs text-gray-400 -mt-1">
            Seberapa besar kontribusi setiap item terhadap total ketidakpastian biaya
          </p>

          {sorted.map((row) => (
            <div key={row.uraian} className="space-y-1">
              <div className="flex justify-between items-end text-xs">
                <span className="text-gray-700 font-medium">
                  {row.uraian.replace('Pek. ', '')}
                </span>
                <span className="text-gray-500 font-mono">
                  ±{formatRp(row.variance)}
                  <span className="text-gray-400 ml-1.5">
                    ({row.sensitivityIndex.toFixed(1)}%)
                  </span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${row.sensitivityIndex}%`,
                    background: `hsl(${140 - row.sensitivityIndex * 1.1}, 60%, 40%)`,
                  }}
                />
              </div>
              {/* Best / Worst per item */}
              <div className="flex justify-between text-xs text-gray-400 font-mono">
                <span className="text-green-600">{formatRp(row.best)}</span>
                <span className="text-red-500">{formatRp(row.worst)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── 6. Catatan metodologi ────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1">
          <p className="font-semibold">Metodologi Kalkulasi</p>
          <p>
            Best Case = Σ(Biaya_i × (1 − tol_i)) &nbsp;·&nbsp;
            Worst Case = Σ(Biaya_i × (1 + tol_i))
          </p>
          <p>
            Estimasi saat ini selalu tepat di tengah interval karena{' '}
            Best + Worst = 2 × Base (sifat simetri interval).
          </p>
          <p>
            Sensitivity Index mengukur kontribusi relatif setiap item terhadap
            total variance — item dengan indeks tertinggi adalah risiko biaya terbesar.
          </p>
        </div>

      </div>
    </div>
  );
}
