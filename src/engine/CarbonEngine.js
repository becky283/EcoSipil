import { carbonFactors, beratPerBuah } from '../data/carbonFactors.js';

export class CarbonEngine {
  static compute(boq, material) {
    const detail = [];
    let total = 0;

    for (const item of boq) {
      let kgCO2e = 0;

      if (item.satuan === 'buah') {
        // buah → kg → CO₂e
        const berat  = beratPerBuah[material] ?? 2;
        const faktor = carbonFactors[material] ?? carbonFactors.bata_merah;
        kgCO2e = item.kuantitas * berat * faktor;

      } else if (item.satuan === 'kg') {
        const faktor = item.key.includes('mortar')
          ? carbonFactors.mortar
          : carbonFactors.semen;
        kgCO2e = item.kuantitas * faktor;

      } else if (item.satuan === 'm³') {
        // pasir: 1 m³ ≈ 1600 kg
        kgCO2e = item.kuantitas * 1600 * carbonFactors.pasir;

      } else if (item.satuan === 'liter') {
        // cat dasar atau cat finishing
        const faktor = item.key.includes('cat_dasar')
          ? carbonFactors.cat_dasar
          : carbonFactors.cat_finishing;
        kgCO2e = item.kuantitas * faktor;
      }

      kgCO2e = +kgCO2e.toFixed(2);
      total += kgCO2e;
      detail.push({ label: item.label, kgCO2e });
    }

    return { detail, total: +total.toFixed(2) };
  }
}
