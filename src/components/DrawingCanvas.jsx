import { useEffect, useRef, useCallback, useState } from 'react';
import { GRID_SIZE, SCALE, snapToGrid } from '../hooks/useDrawing';

function useUndoShortcut(onUndo) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo]);
}

function wallLength(p1, p2) {
  const dx = (p2.x - p1.x) * SCALE;
  const dy = (p2.y - p1.y) * SCALE;
  return Math.sqrt(dx * dx + dy * dy);
}

function drawSegment(ctx, p1, p2, dashed = false) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.strokeStyle = '#166B3D';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([8, 5]);
  ctx.stroke();
  ctx.restore();
}

function drawDimensionLabel(ctx, p1, p2) {
  const len = wallLength(p1, p2);
  if (len < 0.05) return;
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const label = `${len.toFixed(2)} m`;

  ctx.save();
  ctx.font = 'bold 11px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(label).width;
  const pad = 5;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(mx - tw / 2 - pad, my - 10, tw + pad * 2, 20, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0E4D2B';
  ctx.fillText(label, mx, my);
  ctx.restore();
}

function drawOpeningMarker(ctx, p1, p2, count) {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const label = count === 1 ? '🚪' : `🚪×${count}`;
  ctx.save();
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.roundRect(mx - tw / 2 - 4, my + 12, tw + 8, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.fillText(label, mx, my + 21);
  ctx.restore();
}

// Gambar crosshair marker untuk posisi touch saat ini (mobile)
function drawTouchCrosshair(ctx, pos, points) {
  if (!pos) return;
  const snapped = snapToGrid(pos.x, pos.y);
  ctx.save();

  // Lingkaran luar
  ctx.beginPath();
  ctx.arc(snapped.x, snapped.y, 14, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(22,107,61,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.stroke();

  // Titik tengah
  ctx.beginPath();
  ctx.arc(snapped.x, snapped.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#2FA24F';
  ctx.fill();

  // Garis preview ke titik terakhir
  if (points.length > 0) {
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(snapped.x, snapped.y);
    ctx.strokeStyle = '#166B3D';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.stroke();

    const len = wallLength(last, snapped);
    if (len > 0.05) {
      const mx = (last.x + snapped.x) / 2;
      const my = (last.y + snapped.y) / 2;
      const label = `${len.toFixed(2)} m`;
      ctx.font = 'bold 11px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(label).width;
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mx - tw / 2 - 5, my - 10, tw + 10, 20, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0E4D2B';
      ctx.fillText(label, mx, my);
    }
  }

  ctx.restore();
}

export function DrawingCanvas({ points, previewPos, isClosed, openings = [], onAddPoint, onUpdatePreview, onUndo }) {
  const canvasRef      = useRef(null);
  const touchPosRef    = useRef(null);  // posisi jari saat ini (raw, belum snap)
  const [touchSnapped, setTouchSnapped] = useState(null);  // posisi snap untuk render
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  useUndoShortcut(onUndo);

  // ── Render loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Dot grid
      ctx.fillStyle = '#D1D5DB';
      for (let x = GRID_SIZE; x < W; x += GRID_SIZE)
        for (let y = GRID_SIZE; y < H; y += GRID_SIZE) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

      if (points.length === 0) {
        // Mobile hint overlay
        if (isMobile) {
          ctx.save();
          ctx.fillStyle = 'rgba(22,107,61,0.07)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#166B3D';
          ctx.font = 'bold 13px Poppins, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Geser untuk navigasi · Tap "Tandai Titik" untuk mulai', W / 2, H / 2);
          ctx.restore();
        }
        return;
      }

      // Fill polygon tertutup
      if (isClosed && points.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = 'rgba(47, 162, 79, 0.12)';
        ctx.fill();
      }

      // Segmen dinding
      for (let i = 0; i < points.length - 1; i++)
        drawSegment(ctx, points[i], points[i + 1]);
      if (isClosed)
        drawSegment(ctx, points[points.length - 1], points[0]);

      // Label dimensi
      for (let i = 0; i < points.length - 1; i++)
        drawDimensionLabel(ctx, points[i], points[i + 1]);
      if (isClosed)
        drawDimensionLabel(ctx, points[points.length - 1], points[0]);

      // Marker bukaan
      const wCount = isClosed ? points.length : points.length - 1;
      for (let i = 0; i < wCount; i++) {
        const p1 = points[i];
        const p2 = i < points.length - 1 ? points[i + 1] : points[0];
        const count = openings.filter(o => o.wallIndex === i).length;
        if (count > 0) drawOpeningMarker(ctx, p1, p2, count);
      }

      // Preview desktop (mouse)
      if (!isClosed && previewPos && points.length > 0 && !isMobile) {
        const last = points[points.length - 1];
        drawSegment(ctx, last, previewPos, true);
        drawDimensionLabel(ctx, last, previewPos);
      }

      // Preview mobile (touch crosshair)
      if (!isClosed && isMobile && touchSnapped) {
        drawTouchCrosshair(ctx, touchPosRef.current, points);
      }

      // Lingkaran snap di titik pertama
      if (!isClosed && points.length >= 3) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(22, 107, 61, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.restore();
      }

      // Vertex dots
      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === 0 ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#166B3D' : '#2FA24F';
        ctx.fill();
        if (i === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
        }
      });
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [points, previewPos, isClosed, openings, touchSnapped, isMobile]);

  // ── Koordinat canvas ─────────────────────────────────────────────────────────
  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // ── Desktop: mouse events ────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    if (isClosed) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    onAddPoint(x, y, 20);
  }, [isClosed, onAddPoint]);

  const handleMouseMove = useCallback((e) => {
    if (isClosed || points.length === 0) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    onUpdatePreview(x, y);
  }, [isClosed, points.length, onUpdatePreview]);

  // ── Mobile: touch events — hanya tracking posisi, TIDAK menambah titik ──────
  const handleTouchMove = useCallback((e) => {
    // Biarkan scroll/pan terjadi secara alami — jangan preventDefault di sini
    if (isClosed) return;
    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    touchPosRef.current = coords;
    setTouchSnapped(snapToGrid(coords.x, coords.y));
  }, [isClosed]);

  const handleTouchEnd = useCallback(() => {
    // Reset crosshair saat jari diangkat (bukan saat add point)
  }, []);

  // ── Tombol "Tandai Titik" — satu-satunya cara tambah titik di mobile ─────────
  const handleMarkPoint = useCallback(() => {
    if (!touchPosRef.current || isClosed) return;
    const { x, y } = touchPosRef.current;
    onAddPoint(x, y, 22);
  }, [isClosed, onAddPoint]);

  return (
    <div className="space-y-2">
      {/* Canvas — di mobile tidak punya onClick, scroll bebas */}
      <canvas
        ref={canvasRef}
        className="w-full bg-white rounded-xl border border-gray-200 cursor-crosshair"
        style={{
          height: isMobile ? '55vh' : 'calc(100dvh - 180px)',
          minHeight: '320px',
          display: 'block',
          touchAction: isMobile ? 'pan-x pan-y' : 'none',
        }}
        onClick={isMobile ? undefined : handleClick}
        onMouseMove={isMobile ? undefined : handleMouseMove}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      />

      {/* Tombol tambah titik — mobile only */}
      {isMobile && !isClosed && (
        <button
          onPointerDown={(e) => { e.preventDefault(); handleMarkPoint(); }}
          className="md:hidden w-full py-3.5 rounded-xl bg-green-700 text-white text-sm font-bold active:bg-green-900 shadow"
        >
          📍 Tandai Titik di Posisi Ini
        </button>
      )}
    </div>
  );
}
