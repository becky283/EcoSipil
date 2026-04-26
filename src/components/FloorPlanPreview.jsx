import { useEffect, useRef } from 'react';
import { GRID_SIZE, SCALE } from '../hooks/useDrawing';

function wallLength(p1, p2) {
  const dx = (p2.x - p1.x) * SCALE;
  const dy = (p2.y - p1.y) * SCALE;
  return Math.sqrt(dx * dx + dy * dy);
}

export function FloorPlanPreview({ points, isClosed, openings = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length < 2) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // ── Hitung bounding box polygon ─────────────────────────────────────────
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const polyW = maxX - minX;
    const polyH = maxY - minY;
    if (polyW === 0 || polyH === 0) return;

    // ── Scale + center dengan padding ──────────────────────────────────────
    const PAD = 40;
    const scale = Math.min((W - PAD * 2) / polyW, (H - PAD * 2) / polyH);
    const offX  = (W - polyW * scale) / 2 - minX * scale;
    const offY  = (H - polyH * scale) / 2 - minY * scale;

    const tx = (x) => x * scale + offX;
    const ty = (y) => y * scale + offY;

    // ── Dot grid (halus, hanya dalam bounding box) ─────────────────────────
    const gridStep = GRID_SIZE * scale;
    const startX = tx(Math.ceil(minX / GRID_SIZE) * GRID_SIZE);
    const startY = ty(Math.ceil(minY / GRID_SIZE) * GRID_SIZE);
    ctx.fillStyle = '#D1FAE5';
    for (let gx = startX; gx <= tx(maxX); gx += gridStep)
      for (let gy = startY; gy <= ty(maxY); gy += gridStep) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

    // ── Fill polygon ────────────────────────────────────────────────────────
    if (isClosed && points.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(tx(points[0].x), ty(points[0].y));
      points.forEach(p => ctx.lineTo(tx(p.x), ty(p.y)));
      ctx.closePath();
      ctx.fillStyle = 'rgba(47, 162, 79, 0.10)';
      ctx.fill();
    }

    // ── Dinding ─────────────────────────────────────────────────────────────
    const drawWall = (p1, p2, hasOpening) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tx(p1.x), ty(p1.y));
      ctx.lineTo(tx(p2.x), ty(p2.y));
      ctx.strokeStyle = hasOpening ? '#2FA24F' : '#166B3D';
      ctx.lineWidth   = hasOpening ? 2 : 3;
      if (hasOpening) ctx.setLineDash([6, 4]);
      ctx.lineJoin = 'round';
      ctx.lineCap  = 'round';
      ctx.stroke();
      ctx.restore();
    };

    const wallCount = isClosed ? points.length : points.length - 1;
    for (let i = 0; i < wallCount; i++) {
      const p1 = points[i];
      const p2 = i < points.length - 1 ? points[i + 1] : points[0];
      const hasOpening = openings.some(o => o.wallIndex === i);
      drawWall(p1, p2, hasOpening);
    }

    // ── Label panjang dinding ───────────────────────────────────────────────
    const drawLabel = (p1, p2) => {
      const len = wallLength(p1, p2);
      if (len < 0.5) return;
      const mx = (tx(p1.x) + tx(p2.x)) / 2;
      const my = (ty(p1.y) + ty(p2.y)) / 2;
      const label = `${len.toFixed(1)} m`;

      ctx.save();
      ctx.font = 'bold 10px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(label).width + 8;

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mx - tw / 2, my - 9, tw, 18, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0E4D2B';
      ctx.fillText(label, mx, my);
      ctx.restore();
    };

    for (let i = 0; i < wallCount; i++) {
      const p1 = points[i];
      const p2 = i < points.length - 1 ? points[i + 1] : points[0];
      drawLabel(p1, p2);
    }

    // ── Vertex dots ─────────────────────────────────────────────────────────
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(tx(p.x), ty(p.y), i === 0 ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#166B3D' : '#2FA24F';
      ctx.fill();
      if (i === 0) {
        ctx.beginPath();
        ctx.arc(tx(p.x), ty(p.y), 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    });

    // ── Marker bukaan ────────────────────────────────────────────────────────
    openings.forEach(o => {
      const p1 = points[o.wallIndex];
      const p2 = o.wallIndex < points.length - 1 ? points[o.wallIndex + 1] : points[0];
      if (!p1 || !p2) return;
      const mx = (tx(p1.x) + tx(p2.x)) / 2;
      const my = (ty(p1.y) + ty(p2.y)) / 2;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚪', mx, my - 10);
    });

  }, [points, isClosed, openings]);

  if (points.length < 2) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Denah Sketsa</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Preview denah yang digunakan sebagai dasar perhitungan
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-green-800 rounded" />
            Dinding
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-green-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #2FA24F 0, #2FA24F 4px, transparent 4px, transparent 8px)' }} />
            Ada bukaan
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: '280px', display: 'block' }}
      />
    </div>
  );
}
