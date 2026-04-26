import { useEffect, useRef, useCallback } from 'react';
import { GRID_SIZE, SCALE, snapToGrid } from '../hooks/useDrawing';

const CANVAS_MOBILE_PX = 30 * GRID_SIZE; // 1200px — mobile scrollable

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

// Fungsi render utama — dipakai oleh desktop (resize) maupun mobile (fixed)
function renderCanvas(canvas, W, H, { points, previewPos, isClosed, openings, isMobile }) {
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, W, H);

  // Dot grid
  ctx.fillStyle = '#D1D5DB';
  for (let x = GRID_SIZE; x < W; x += GRID_SIZE)
    for (let y = GRID_SIZE; y < H; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

  if (points.length === 0) return;

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
    const cnt = openings.filter(o => o.wallIndex === i).length;
    if (cnt > 0) drawOpeningMarker(ctx, p1, p2, cnt);
  }

  // Preview desktop (mouse)
  if (!isClosed && previewPos && points.length > 0 && !isMobile) {
    const last = points[points.length - 1];
    drawSegment(ctx, last, previewPos, true);
    drawDimensionLabel(ctx, last, previewPos);
  }

  // Lingkaran snap titik pertama
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
}

export function DrawingCanvas({ points, previewPos, isClosed, openings = [], onAddPoint, onUpdatePreview, onUndo }) {
  const canvasRef  = useRef(null);
  const wrapperRef = useRef(null);
  const lastTapRef = useRef(0);
  const isMobile   = useRef(
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  ).current;

  useUndoShortcut(onUndo);

  const renderArgs = { points, previewPos, isClosed, openings, isMobile };

  // ── Desktop: canvas mengisi wrapper, re-render saat resize ───────────────────
  useEffect(() => {
    if (isMobile) return;
    const canvas  = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const render = () => renderCanvas(canvas, wrapper.offsetWidth, wrapper.offsetHeight, renderArgs);
    render();
    const ro = new ResizeObserver(render);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [points, previewPos, isClosed, openings, isMobile]);

  // ── Mobile: canvas fixed 1200×1200px, tidak perlu resize ─────────────────────
  useEffect(() => {
    if (!isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCanvas(canvas, CANVAS_MOBILE_PX, CANVAS_MOBILE_PX, renderArgs);
  }, [points, previewPos, isClosed, openings, isMobile]);

  // ── Desktop mouse ────────────────────────────────────────────────────────────
  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

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

  // ── Mobile: double-tap pada wrapper ─────────────────────────────────────────
  const handleWrapperTouchEnd = useCallback((e) => {
    if (isClosed) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      const touch = e.changedTouches[0];
      const rect  = canvasRef.current.getBoundingClientRect();
      onAddPoint(touch.clientX - rect.left, touch.clientY - rect.top, 22);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [isClosed, onAddPoint]);

  // ── Mobile render ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        ref={wrapperRef}
        className="w-full rounded-xl border border-gray-200 bg-white overflow-auto"
        style={{ height: '55vh', minHeight: '320px' }}
        onTouchEnd={handleWrapperTouchEnd}
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_MOBILE_PX, height: CANVAS_MOBILE_PX, display: 'block' }}
        />
      </div>
    );
  }

  // ── Desktop render ────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      className="w-full rounded-xl border border-gray-200 bg-white"
      style={{ height: 'calc(100dvh - 180px)', minHeight: '320px' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}
