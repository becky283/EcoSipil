import { getAdjustedPrices } from '../data/priceDatabase.js';

export class RABGenerator {
  static generate({ totalLuas, totalLuasPlesteran }, material, lokasi) {
    const harga = getAdjustedPrices(material, lokasi);

    const items = [
      {
        uraian: 'Pek. Pasangan Dinding',
        vol: totalLuas,
        sat: 'm²',
        hargaSatuan: harga.pasangan,
        jumlah: +(totalLuas * harga.pasangan),
      },
      {
        uraian: 'Pek. Plesteran 1:4',
        vol: totalLuasPlesteran,
        sat: 'm²',
        hargaSatuan: harga.plesteran,
        jumlah: +(totalLuasPlesteran * harga.plesteran),
      },
      {
        uraian: 'Pek. Acian',
        vol: totalLuasPlesteran,
        sat: 'm²',
        hargaSatuan: harga.acian,
        jumlah: +(totalLuasPlesteran * harga.acian),
      },
      {
        uraian: 'Pek. Pengecatan',
        vol: totalLuasPlesteran,
        sat: 'm²',
        hargaSatuan: harga.pengecatan,
        jumlah: +(totalLuasPlesteran * harga.pengecatan),
      },
    ];

    const grandTotal = items.reduce((s, i) => s + i.jumlah, 0);
    return { items, grandTotal };
  }
}
