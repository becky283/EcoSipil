import { useCallback, useState } from 'react';

export const GRID_SIZE = 40; // 1 sel = 1 meter
export const SCALE = 1 / GRID_SIZE; // meter per pixel

export function snapToGrid(x, y) {
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  };
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function useDrawing() {
  const [points, setPoints] = useState([]);
  const [previewPos, setPreviewPos] = useState(null);
  const [isClosed, setIsClosed] = useState(false);

  const addPoint = useCallback((rawX, rawY, snapRadius = 20) => {
    const snapped = snapToGrid(rawX, rawY);
    setPoints(prev => {
      // Minimal 3 titik sebelum bisa menutup polygon
      if (prev.length >= 3 && dist(snapped, prev[0]) <= snapRadius) {
        setIsClosed(true);
        setPreviewPos(null);
        return prev;
      }
      return [...prev, snapped];
    });
  }, []);

  const undo = useCallback(() => {
    setIsClosed(false);
    setPoints(prev => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    setPoints([]);
    setPreviewPos(null);
    setIsClosed(false);
  }, []);

  const updatePreview = useCallback((rawX, rawY) => {
    setPreviewPos(snapToGrid(rawX, rawY));
  }, []);

  return { points, previewPos, isClosed, addPoint, undo, clear, updatePreview };
}
