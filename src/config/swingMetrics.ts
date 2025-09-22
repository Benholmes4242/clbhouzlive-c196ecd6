export interface MetricThreshold {
  good?: [number, number];
  warn?: [number, number];
  bad?: [number, number];
}

export interface MetricInfo {
  label: string;
  unit: string;
  good?: [number, number];
  warn?: [number, number];
  bad?: [number, number];
  info?: string;
}

export const METRIC_INFO: Record<string, MetricInfo> = {
  shaftLeanDeg: { 
    label: "Shaft Lean", 
    unit: "°", 
    good: [5, 15], 
    warn: [0, 5], 
    bad: [-30, 0],
    info: "Forward shaft lean at impact creates better ball striking"
  },
  hipOpenDeg: { 
    label: "Hip Open", 
    unit: "°", 
    good: [20, 45], 
    warn: [10, 20], 
    bad: [0, 10],
    info: "Hip rotation drives power and accuracy"
  },
  headStability: { 
    label: "Head Stability", 
    unit: "", 
    good: [0, 2], 
    warn: [2, 4], 
    bad: [4, 10],
    info: "Lower is steadier - excessive head movement affects consistency"
  },
  shoulderTurnDeg: { 
    label: "Shoulder Turn", 
    unit: "°", 
    good: [85, 110], 
    warn: [70, 85], 
    bad: [0, 70],
    info: "Full shoulder turn creates power and width"
  },
  weightTransferPct: { 
    label: "Weight Transfer", 
    unit: "%", 
    good: [60, 80], 
    warn: [45, 60], 
    bad: [0, 45],
    info: "Proper weight shift from back foot to front foot"
  },
  clubFaceAngleDeg: { 
    label: "Club Face", 
    unit: "°", 
    good: [-2, 2], 
    warn: [-5, -2], 
    bad: [-15, -5],
    info: "Club face angle at impact affects ball direction"
  },
  swingPathDeg: { 
    label: "Swing Path", 
    unit: "°", 
    good: [-2, 2], 
    warn: [-5, -2], 
    bad: [-15, -5],
    info: "Swing path relative to target line"
  },
  tempoRatio: { 
    label: "Tempo", 
    unit: ":1", 
    good: [2.8, 3.2], 
    warn: [2.5, 2.8], 
    bad: [1.5, 2.5],
    info: "Backswing to downswing tempo ratio"
  }
} as const;

export type MetricKey = keyof typeof METRIC_INFO;

export function getMetricState(key: MetricKey, value: number): 'good' | 'warn' | 'bad' | 'neutral' {
  const metric = METRIC_INFO[key];
  if (!metric) return 'neutral';

  if (metric.good && value >= metric.good[0] && value <= metric.good[1]) {
    return 'good';
  }
  if (metric.warn && value >= metric.warn[0] && value <= metric.warn[1]) {
    return 'warn';
  }
  if (metric.bad && value >= metric.bad[0] && value <= metric.bad[1]) {
    return 'bad';
  }
  
  return 'neutral';
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (confidence >= 0.4) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
}