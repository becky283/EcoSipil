const MATERIAL_META = {
  bata_merah: {
    label:    'Bata Merah',
    emoji:    '🧱',
    desc:     'Material tradisional, kuat, harga terjangkau',
    colorBg:  'bg-orange-50',
    colorBorder: 'border-orange-200',
    colorHead:   'text-orange-800',
    colorBadge:  'bg-orange-100 text-orange-700',
  },
  bata_hebel: {
    label:    'Bata Hebel (AAC)',
    emoji:    '🪨',
    desc:     'Ringan, isolasi termal baik, pasangan cepat',
    colorBg:  'bg-blue-50',
    colorBorder: 'border-blue-200',
    colorHead:   'text-blue-800',
    colorBadge:  'bg-blue-100 text-blue-700',
  },
  batako: {
    label:    'Batako',
    emoji:    '⬜',
    desc:     'Harga paling ekonomis, banyak tersedia',
    colorBg:  'bg-gray-50',
    colorBorder: 'border-gray-200',
    colorHead:   'text-gray-700',
    colorBadge:  'bg-gray-200 text-gray-600',
  },
};

function formatRp(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function DeltaBadge({ delta, invert = false }) {
  if (delta === 0) return <span className="text-xs text-gray-400 font-mono">—</span>;
  // invert=true means lower is better (carbon), invert=false = lower is better (cost) — same logic
  const cheaper = delta < 0;
  return (
    <span className={`text-xs font-bold font-mono ${cheaper ? 'text-green-600' : 'text-red-500'}`}>
      {cheaper ? '▼' : '▲'} {formatRp(Math.abs(delta))}
    </span>
  );
}

function CarbonDelta({ delta }) {
  if (delta === 0) return <span className="text-xs text-gray-400 font-mono">—</span>;
  const lower = delta < 0;
  return (
    <span className={`text-xs font-bold font-mono ${lower ? 'text-green-600' : 'text-red-500'}`}>
      {lower ? '▼' : '▲'} {Math.abs(delta).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg CO₂e
    </span>
  );
}

export function MaterialComparison({ comparisonData, selectedMaterial }) {
  const selected = comparisonData.find(d => d.material === selectedMaterial);
  if (!selected) return null;

  const best = {
    cost:   Math.min(...comparisonData.map(d => d.grandTotal)),
    carbon: Math.min(...comparisonData.map(d => d.carbon)),
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Komparasi Material — Optioneering</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Perbandingan biaya RAB dan jejak karbon untuk geometri yang sama dengan material berbeda
        </p>
      </div>

      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisonData.map(({ material, grandTotal, carbon }) => {
          const meta    = MATERIAL_META[material];
          const isChosen = material === selectedMaterial;
          const costDelta   = grandTotal - selected.grandTotal;
          const carbonDelta = carbon - selected.carbon;
          const isBestCost   = grandTotal === best.cost;
          const isBestCarbon = carbon === best.carbon;

          return (
            <div
              key={material}
              className={`relative rounded-xl border-2 p-4 space-y-3 transition-all ${
                isChosen
                  ? `${meta.colorBg} ${meta.colorBorder} ring-2 ring-offset-1 ring-current`
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className={`text-sm font-bold ${meta.colorHead}`}>{meta.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
                </div>
                {isChosen && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${meta.colorBadge}`}>
                    Dipilih
                  </span>
                )}
              </div>

              {/* Biaya */}
              <div className="space-y-0.5">
                <p className="text-xs text-gray-500 font-medium">Total Biaya RAB</p>
                <p className="text-base font-bold text-gray-800 leading-tight">{formatRp(grandTotal)}</p>
                <div className="flex items-center gap-1.5">
                  {isChosen
                    ? <span className="text-xs text-gray-400">Pilihan saat ini</span>
                    : <DeltaBadge delta={costDelta} />
                  }
                  {isBestCost && (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
                      💰 Termurah
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Carbon */}
              <div className="space-y-0.5">
                <p className="text-xs text-gray-500 font-medium">Embodied Carbon</p>
                <p className="text-base font-bold text-green-800 leading-tight">
                  {carbon.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                  <span className="text-xs font-normal text-green-700 ml-1">kg CO₂e</span>
                </p>
                <div className="flex items-center gap-1.5">
                  {isChosen
                    ? <span className="text-xs text-gray-400">Pilihan saat ini</span>
                    : <CarbonDelta delta={carbonDelta} />
                  }
                  {isBestCarbon && (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
                      🌱 Terendah
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary insight row */}
      <div className="mx-4 md:mx-6 mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1.5">
        <p className="font-semibold text-blue-900">Insight Cepat</p>
        {(() => {
          const sorted = [...comparisonData].sort((a, b) => a.grandTotal - b.grandTotal);
          const cheapest  = sorted[0];
          const priciest  = sorted[sorted.length - 1];
          const costSpread = priciest.grandTotal - cheapest.grandTotal;
          const sortedC = [...comparisonData].sort((a, b) => a.carbon - b.carbon);
          const greenest  = sortedC[0];
          const dirtiest  = sortedC[sortedC.length - 1];
          const co2Spread = dirtiest.carbon - greenest.carbon;
          return (
            <>
              <p>
                💰 Selisih biaya antara material termurah ({MATERIAL_META[cheapest.material].label}) dan termahal ({MATERIAL_META[priciest.material].label}):{' '}
                <strong>{formatRp(costSpread)}</strong>
              </p>
              <p>
                🌱 Selisih karbon antara material terbersih ({MATERIAL_META[greenest.material].label}) dan tertinggi ({MATERIAL_META[dirtiest.material].label}):{' '}
                <strong>{co2Spread.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg CO₂e</strong>
              </p>
            </>
          );
        })()}
      </div>
    </div>
  );
}
