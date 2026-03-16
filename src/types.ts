export type GameColor = 'blue' | 'red' | 'green' | 'yellow' | 'none';

export interface GameResult {
  id: string;
  color: GameColor;
  timestamp: number;
}

export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Prediction {
  blue: number;
  red: number;
  green: number;
  yellow: number;
  mostProbable: GameColor;
}

export interface LiveStatus {
  currentColor: GameColor;
  confidence: number;
  isStable: boolean;
}

export const COLOR_MAP = {
  blue: { label: 'x2', hex: '#3b82f6', hsv: [210, 70, 70] },
  red: { label: 'x3', hex: '#ef4444', hsv: [0, 70, 70] },
  green: { label: 'x5', hex: '#22c55e', hsv: [120, 70, 70] },
  yellow: { label: 'x50', hex: '#eab308', hsv: [50, 70, 70] },
  none: { label: '-', hex: '#6b7280', hsv: [0, 0, 50] }
};
