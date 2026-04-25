import { Wall } from './Wall.js';
import { materialCoeff } from '../data/materialCoeff.js';

const SCALE = 1 / 40;

function hitungLuasPolygon(points) {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2) * (SCALE * SCALE);
}

function buildWalls(points, isClosed, tinggi, tebal) {
  const walls = [];
  for (let i = 0; i < points.length - 1; i++) {
    const w = new Wall(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, SCALE);
    w.tinggi = tinggi;
    w.tebal = tebal;
    walls.push(w);
  }
  if (isClosed && points.length >= 3) {
    const last = points[points.length - 1];
    const w = new Wall(last.x, last.y, points[0].x, points[0].y, SCALE);
    w.tinggi = tinggi;
    w.tebal = tebal;
    walls.push(w);
  }
  return walls;
}

function hitungBoQ(coeff, totalLuas, totalLuasPlesteran) {
  const items = [];

  for (const [key, item] of Object.entries(coeff.pasangan)) {
    items.push({
      key: `pasangan_${key}`,
      label: item.label,
      kuantitas: +(totalLuas * item.jumlah).toFixed(2),
      satuan: item.satuan,
      kategori: 'Pasangan',
    });
  }
  for (const [key, item] of Object.entries(coeff.plesteran)) {
    items.push({
      key: `plesteran_${key}`,
      label: item.label,
      kuantitas: +(totalLuasPlesteran * item.jumlah).toFixed(2),
      satuan: item.satuan,
      kategori: 'Plesteran',
    });
  }
  for (const [key, item] of Object.entries(coeff.acian)) {
    items.push({
      key: `acian_${key}`,
      label: item.label,
      kuantitas: +(totalLuasPlesteran * item.jumlah).toFixed(2),
      satuan: item.satuan,
      kategori: 'Acian',
    });
  }
  // Cat diterapkan ke seluruh permukaan acian
  for (const [key, item] of Object.entries(coeff.pengecatan)) {
    items.push({
      key: `pengecatan_${key}`,
      label: item.label,
      kuantitas: +(totalLuasPlesteran * item.jumlah).toFixed(2),
      satuan: item.satuan,
      kategori: 'Pengecatan',
    });
  }

  return items;
}

export class VolumeEngine {
  static compute(points, isClosed, { tinggi, tebal, material }) {
    const walls = buildWalls(points, isClosed, tinggi, tebal);

    const wallResults = walls.map(w => ({
      id: w.id,
      panjang: +w.panjang.toFixed(3),
      tinggi: w.tinggi,
      tebal: w.tebal,
      luas: +(w.panjang * w.tinggi).toFixed(3),
      volume: +(w.panjang * w.tinggi * w.tebal).toFixed(3),
    }));

    const totalLuas           = +wallResults.reduce((s, w) => s + w.luas, 0).toFixed(2);
    const totalVolume         = +wallResults.reduce((s, w) => s + w.volume, 0).toFixed(3);
    const totalLuasPlesteran  = +(totalLuas * 2).toFixed(2);
    const totalLuasLantai     = isClosed ? +hitungLuasPolygon(points).toFixed(2) : 0;

    const boq = hitungBoQ(materialCoeff[material], totalLuas, totalLuasPlesteran);

    return { wallResults, totalLuas, totalVolume, totalLuasPlesteran, totalLuasLantai, boq };
  }
}
