import { useEffect, useRef } from 'react';
import { GRID_SIZE, SCALE } from '../hooks/useDrawing';

// Keyboard shortcut Ctrl+Z — sesuai spek §3.3
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

export function DrawingCanvas({ points, previewPos, isClosed, onAddPoint, onUpdatePreview, onUndo }) {
  const canvasRef = useRef(null);
  useUndoShortcut(onUndo);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Dot grid
      ctx.fillStyle = '#D1D5DB';
      for (let x = GRID_SIZE; x < W; x += GRID_SIZE) {
        for (let y = GRID_SIZE; y < H; y += GRID_SIZE) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (points.length === 0) return;

      // Fill area tertutup
      if (isClosed && points.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = 'rgba(47, 162, 79, 0.12)';
        ctx.fill();
      }

      // Segmen dinding yang sudah dikonfirmasi
      for (let i = 0; i < points.length - 1; i++) {
        drawSegment(ctx, points[i], points[i + 1]);
      }
      if (isClosed) {
        drawSegment(ctx, points[points.length - 1], points[0]);
      }

      // Label dimensi pada segmen yang sudah dikonfirmasi
      for (let i = 0; i < points.length - 1; i++) {
        drawDimensionLabel(ctx, points[i], points[i + 1]);
      }
      if (isClosed) {
        drawDimensionLabel(ctx, points[points.length - 1], points[0]);
      }

      // Garis preview (putus-putus)
      if (!isClosed && previewPos && points.length > 0) {
        const last = points[points.length - 1];
        drawSegment(ctx, last, previewPos, true);
        drawDimensionLabel(ctx, last, previewPos);
      }

      // Lingkaran snap di titik pertama (saat polygon bisa ditutup)
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

      // Titik vertex
      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === 0 ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#166B3D' : '#2FA24F';
        ctx.fill();
        // Lubang putih di titik pertama agar mudah dikenali
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
  }, [points, previewPos, isClosed]);

  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleClick = (e) => {
    if (isClosed) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    onAddPoint(x, y, 20);
  };

  const handleMouseMove = (e) => {
    if (isClosed || points.length === 0) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    onUpdatePreview(x, y);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (isClosed) return;
    const touch = e.touches[0];
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
    onAddPoint(x, y, 30);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full bg-white rounded-xl border border-gray-200 cursor-crosshair touch-none"
      style={{ height: '60vh', display: 'block' }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
    />
  );
}
