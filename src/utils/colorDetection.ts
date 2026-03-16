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

  // Looser thresholds for better real-time detection
  if (s < 15 || v < 15) return 'none';

  // Red: 0-20 or 340-360
  if ((h >= 0 && h < 20) || (h >= 340 && h <= 360)) return 'red';
  // Blue: 180-260
  if (h >= 180 && h < 260) return 'blue';
  // Green: 70-160
  if (h >= 70 && h < 160) return 'green';
  // Yellow: 35-65
  if (h >= 35 && h < 65) return 'yellow';

  return 'none';
}
