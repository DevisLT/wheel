import { GameColor } from '../types';

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, v * 100];
}

export function detectColor(r: number, g: number, b: number): GameColor {
  const [h, s, v] = rgbToHsv(r, g, b);

  // Basic HSV thresholds for the game colors
  // These might need calibration depending on screen brightness/camera
  if (s < 20 || v < 20) return 'none';

  if ((h >= 0 && h < 15) || (h >= 345 && h <= 360)) return 'red';
  if (h >= 190 && h < 250) return 'blue';
  if (h >= 80 && h < 160) return 'green';
  if (h >= 40 && h < 70) return 'yellow';

  return 'none';
}
