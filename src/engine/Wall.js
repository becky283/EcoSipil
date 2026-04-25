// satu segmen garis = satu dinding
export class Wall {
  constructor(x1, y1, x2, y2, scaleMetersPerPixel = 1 / 40) {
    this.id = crypto.randomUUID();
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.scale = scaleMetersPerPixel; // 0.025 m/px (1 sel grid 40px = 1 meter)
    this.tinggi = 3.0; // meter, default
    this.tebal = 0.15; // meter, default
  }

  get panjang() {
    const dx = (this.x2 - this.x1) * this.scale;
    const dy = (this.y2 - this.y1) * this.scale;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
