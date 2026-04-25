// Faktor emisi material (ICE Database v3.0, University of Bath)
// Satuan: kg CO₂e per kg material (kecuali cat: per liter)

export const carbonFactors = {
  bata_merah:    0.24,  // kg CO₂e/kg
  bata_hebel:    0.33,  // AAC block
  batako:        0.10,  // concrete block
  semen:         0.83,  // Portland cement
  pasir:         0.005,
  mortar:        0.78,  // pre-mixed adhesive mortar (approx)
  cat_dasar:     1.20,  // kg CO₂e/liter — water-based primer
  cat_finishing: 1.50,  // kg CO₂e/liter — water-based acrylic
};

// Berat per buah (kg) — untuk konversi buah → kg → CO₂e
export const beratPerBuah = {
  bata_merah:  2.0,
  bata_hebel:  8.0,
  batako:     10.0,
};
