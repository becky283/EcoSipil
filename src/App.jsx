import { useMemo, useState } from 'react';
import './index.css';
import { useDrawing, SCALE } from './hooks/useDrawing';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ToolBar } from './components/ToolBar';
import { ParamPanel } from './components/ParamPanel';
import { OutputPage } from './components/OutputPage';
import { VolumeEngine } from './engine/VolumeEngine';
import { RABGenerator } from './engine/RABGenerator';
import { CarbonEngine } from './engine/CarbonEngine';

function calcTotalPanjang(points, isClosed) {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = (points[i + 1].x - points[i].x) * SCALE;
    const dy = (points[i + 1].y - points[i].y) * SCALE;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  if (isClosed && points.length >= 3) {
    const last = points[points.length - 1];
    const dx = (points[0].x - last.x) * SCALE;
    const dy = (points[0].y - last.y) * SCALE;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

const PHASE_LABEL = {
  sketsa:    'Fase 1 — Sketsa Dinding',
  parameter: 'Fase 2 — Parameter Dinding',
  output:    'Fase 3 — Hasil Estimasi',
};

function App() {
  const [phase, setPhase] = useState('sketsa');
  const [params, setParams] = useState(null);
  const [hasil, setHasil] = useState(null);
  const [openings, setOpenings] = useState([]);

  const { points, previewPos, isClosed, addPoint, undo, clear, updatePreview } = useDrawing();
  const totalPanjang = useMemo(() => calcTotalPanjang(points, isClosed), [points, isClosed]);

  const handleFinishSketsa = () => setPhase('parameter');

  const handleHitung = (p) => {
    const volumeResult = VolumeEngine.compute(points, isClosed, p, openings);
    const rabResult    = RABGenerator.generate(volumeResult, p.material, p.lokasi);
    const carbonResult = CarbonEngine.compute(volumeResult.boq, p.material);

    // Compute the other two materials for comparison (same geometry, same lokasi)
    const ALL_MATERIALS = ['bata_merah', 'bata_hebel', 'batako'];
    const comparisonData = ALL_MATERIALS.map(mat => {
      const vr  = VolumeEngine.compute(points, isClosed, { ...p, material: mat }, openings);
      const rab = RABGenerator.generate(vr, mat, p.lokasi);
      const co2 = CarbonEngine.compute(vr.boq, mat);
      return { material: mat, grandTotal: rab.grandTotal, carbon: co2.total };
    });

    setParams(p);
    setHasil({ volumeResult, rabResult, carbonResult, comparisonData });
    setPhase('output');
  };

  const handleBackToParam  = () => setPhase('parameter');
  const handleBackToSketsa = () => setPhase('sketsa');
  const handleMulaiUlang   = () => {
    clear();
    setParams(null);
    setHasil(null);
    setOpenings([]);
    setPhase('sketsa');
  };

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const hintText = () => {
    if (isClosed) return '✅ Ruangan tertutup — tekan "Selesai Menggambar" untuk lanjut';
    if (isMobile) {
      if (points.length === 0) return 'Geser kanvas untuk navigasi · Tap 2× cepat untuk letakkan titik';
      if (points.length >= 3) return 'Tap 2× cepat di lingkaran hijau untuk menutup ruangan';
      return 'Geser ke posisi dinding berikutnya · Tap 2× untuk lanjut';
    }
    if (points.length === 0) return 'Klik di kanvas untuk mulai menggambar dinding pertama';
    if (points.length >= 3) return 'Klik titik pertama (lingkaran hijau tua) untuk menutup ruangan';
    return 'Klik titik berikutnya untuk melanjutkan dinding';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-4 py-2.5 flex items-center gap-3 shadow-md print:hidden">
        <img src="/logo.png" alt="EcoSipil" className="h-9 w-9 object-contain rounded-sm" />
        <div>
          <span className="text-lg font-bold tracking-tight leading-none">EcoSipil</span>
          <p className="text-green-300 text-xs leading-none mt-0.5">{PHASE_LABEL[phase]}</p>
        </div>
      </header>

      <main className="p-4 md:p-6">

        {phase === 'sketsa' && (
          <>
            {points.length === 0 && (
              <div className="flex flex-col items-center gap-1 mb-4 mt-1">
                <img src="/logo.png" alt="EcoSipil" className="h-20 w-20 object-contain" />
                <p className="text-xs text-gray-400 tracking-wide">Cerdas. Terintegrasi. Berkelanjutan.</p>
              </div>
            )}
            <ToolBar
              onUndo={undo}
              onClear={clear}
              onFinish={handleFinishSketsa}
              isClosed={isClosed}
              hasPoints={points.length > 0}
            />
            {/* ── Legend skala + hint mobile ── */}
            <div className="flex items-center justify-between mb-2 px-0.5">

              {/* Skala 1 meter */}
              <div className="flex items-center gap-2.5 bg-white border border-green-200 rounded-lg px-3 py-1.5 shadow-sm">
                <div className="flex flex-col items-center gap-0.5">
                  {/* Garis skala bergaya peta dengan end-cap */}
                  <div className="flex items-center">
                    <div className="w-px h-3 bg-green-700" />
                    <div className="h-0.5 bg-green-700 rounded-full" style={{ width: 40 }} />
                    <div className="w-px h-3 bg-green-700" />
                  </div>
                  <span className="text-xs font-bold text-green-800 tracking-tight">1 m</span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-green-800 leading-none">1 grid = 1 meter</p>
                  <p className="text-xs text-gray-400 leading-none mt-0.5">snap ke titik grid</p>
                </div>
              </div>

              {/* Hint desktop (tetap di bawah) / kosong di mobile */}
              {!isMobile && (
                <p className="text-xs text-gray-400">{hintText()}</p>
              )}
            </div>

            {/* Hint mobile — di atas canvas, pill hijau */}
            {isMobile && (
              <div className="mb-2 flex justify-center">
                <span className="inline-flex items-center gap-1.5 bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                  <span className="text-base leading-none">
                    {isClosed ? '✅' : points.length === 0 ? '👆' : points.length >= 3 ? '🔵' : '✏️'}
                  </span>
                  {hintText()}
                </span>
              </div>
            )}

            <DrawingCanvas
              points={points}
              previewPos={previewPos}
              isClosed={isClosed}
              openings={openings}
              onAddPoint={addPoint}
              onUpdatePreview={updatePreview}
              onUndo={undo}
            />

            {/* Hint desktop di bawah canvas */}
            {!isMobile && (
              <p className="mt-3 text-sm text-gray-500 text-center">{hintText()}</p>
            )}

            <div className="mt-6 text-center text-xs text-gray-400 space-y-1">
              <p>
                Independent project oleh{' '}
                <span className="text-gray-500 font-medium">Radithya Al Fattan Pratomo</span>
                {' '}· Teknik Sipil UI 2024
              </p>
              <div className="flex justify-center flex-wrap gap-x-4 gap-y-1">
                <a href="mailto:radithyaalfattan4@gmail.com" className="hover:text-gray-600 underline underline-offset-2">
                  radithyaalfattan4@gmail.com
                </a>
                <a href="https://instagram.com/radithya_a_p" target="_blank" rel="noreferrer" className="hover:text-gray-600 underline underline-offset-2">
                  IG: radithya_a_p
                </a>
                <a href="https://id.linkedin.com/in/radithyapratomo" target="_blank" rel="noreferrer" className="hover:text-gray-600 underline underline-offset-2">
                  LinkedIn
                </a>
                <a href="https://github.com/becky283" target="_blank" rel="noreferrer" className="hover:text-gray-600 underline underline-offset-2">
                  GitHub: becky283
                </a>
              </div>
            </div>
          </>
        )}

        {phase === 'parameter' && (
          <ParamPanel
            totalPanjang={totalPanjang}
            points={points}
            isClosed={isClosed}
            openings={openings}
            onOpeningsChange={setOpenings}
            onHitung={handleHitung}
            onBack={handleBackToSketsa}
          />
        )}

        {phase === 'output' && hasil && (
          <OutputPage
            params={params}
            volumeResult={hasil.volumeResult}
            rabResult={hasil.rabResult}
            carbonResult={hasil.carbonResult}
            comparisonData={hasil.comparisonData}
            onBack={handleBackToParam}
            onMulaiUlang={handleMulaiUlang}
          />
        )}

      </main>

      <div className="h-20 md:hidden print:hidden" />
    </div>
  );
}

export default App;
