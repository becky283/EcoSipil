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

  const { points, previewPos, isClosed, addPoint, undo, clear, updatePreview } = useDrawing();
  const totalPanjang = useMemo(() => calcTotalPanjang(points, isClosed), [points, isClosed]);

  const handleFinishSketsa = () => setPhase('parameter');

  const handleHitung = (p) => {
    const volumeResult = VolumeEngine.compute(points, isClosed, p);
    const rabResult    = RABGenerator.generate(volumeResult, p.material, p.lokasi);
    const carbonResult = CarbonEngine.compute(volumeResult.boq, p.material);
    setParams(p);
    setHasil({ volumeResult, rabResult, carbonResult });
    setPhase('output');
  };

  const handleBackToParam  = () => setPhase('parameter');
  const handleBackToSketsa = () => setPhase('sketsa');
  const handleMulaiUlang   = () => { clear(); setParams(null); setHasil(null); setPhase('sketsa'); };

  const hintText = () => {
    if (points.length === 0) return 'Klik di kanvas untuk mulai menggambar dinding pertama';
    if (isClosed) return '✅ Ruangan tertutup — tekan "Selesai Menggambar" untuk lanjut';
    if (points.length >= 3) return 'Klik titik pertama (lingkaran hijau tua) untuk menutup ruangan';
    return 'Klik titik berikutnya untuk melanjutkan dinding';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 shadow-md print:hidden">
        <span className="text-xl font-bold tracking-tight">EcoSipil</span>
        <span className="text-green-300 text-sm font-medium">{PHASE_LABEL[phase]}</span>
      </header>

      <main className="p-4 md:p-6">

        {phase === 'sketsa' && (
          <>
            <ToolBar
              onUndo={undo}
              onClear={clear}
              onFinish={handleFinishSketsa}
              isClosed={isClosed}
              hasPoints={points.length > 0}
            />
            <DrawingCanvas
              points={points}
              previewPos={previewPos}
              isClosed={isClosed}
              onAddPoint={addPoint}
              onUpdatePreview={updatePreview}
              onUndo={undo}
            />
            <p className="mt-3 text-sm text-gray-500 text-center">{hintText()}</p>
          </>
        )}

        {phase === 'parameter' && (
          <ParamPanel
            totalPanjang={totalPanjang}
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
