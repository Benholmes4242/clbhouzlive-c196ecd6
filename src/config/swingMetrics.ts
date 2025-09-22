// Compact, typed config for rendering + thresholds + formatting.
export type MetricKey =
  | "spineAngleDeg"
  | "shoulderTiltDeg"
  | "hipOpenDeg"
  | "pelvisSwayCm"
  | "headStabilityCm"
  | "clubFaceDeg"
  | "shaftLeanDeg"
  | "tempoRatio"        // backswing:downswing (e.g., 3.0)
  | "swingPlaneDeg"
  | "handPathDepthCm";

type Band = { 
  good?: [number, number]; 
  warn?: [number, number]; 
  bad?: [number, number]; 
  reverse?: boolean; 
};
// reverse=true means lower is better (e.g., sway)

export interface MetricInfo {
  key: MetricKey;
  label: string;
  unit?: "°" | "cm" | "";
  bands: Band;
  info?: string;
  fmt?: (v: number) => string;
}

const d = (v: number) => `${Math.round(v)}°`;
const cm = (v: number) => `${Math.round(v)} cm`;
const rat = (v: number) => v.toFixed(2);

export const METRIC_INFO: Record<MetricKey, MetricInfo> = {
  spineAngleDeg:   { 
    key: "spineAngleDeg", 
    label: "Spine Angle", 
    unit: "°", 
    bands: { good:[32,40], warn:[25,31], bad:[0,24] }, 
    info:"Address posture; typical 32–40°", 
    fmt: d
  },
  shoulderTiltDeg: { 
    key: "shoulderTiltDeg", 
    label: "Shoulder Tilt", 
    unit:"°", 
    bands:{ good:[8,18], warn:[5,7], bad:[0,4] }, 
    info:"Lead shoulder slightly down at setup", 
    fmt: d
  },
  hipOpenDeg: { 
    key: "hipOpenDeg", 
    label: "Hip Open (Impact)", 
    unit:"°", 
    bands:{ good:[20,45], warn:[10,19], bad:[-45,9] }, 
    info:"More open improves compression", 
    fmt: d
  },
  pelvisSwayCm: { 
    key: "pelvisSwayCm", 
    label: "Pelvis Sway", 
    unit:"cm", 
    bands:{ good:[0,3], warn:[4,6], bad:[7,50], reverse:true }, 
    info:"Lower is steadier (≤3cm ideal)", 
    fmt: cm
  },
  headStabilityCm: { 
    key: "headStabilityCm", 
    label: "Head Stability", 
    unit:"cm", 
    bands:{ good:[0,2], warn:[3,4], bad:[5,50], reverse:true }, 
    info:"Lower is steadier (≤2cm ideal)", 
    fmt: cm
  },
  clubFaceDeg: { 
    key: "clubFaceDeg", 
    label: "Club Face @ P6", 
    unit:"°", 
    bands:{ good:[-2,2], warn:[-5,-3], bad:[-30,-6] }, 
    info:"Neutral ±2°; negative = closed", 
    fmt: d
  },
  shaftLeanDeg: { 
    key: "shaftLeanDeg", 
    label: "Shaft Lean", 
    unit:"°", 
    bands:{ good:[5,15], warn:[1,4], bad:[-45,0] }, 
    info:"Positive lean = hands ahead", 
    fmt: d
  },
  tempoRatio: { 
    key: "tempoRatio", 
    label: "Tempo Ratio", 
    bands:{ good:[2.8,3.2], warn:[2.5,2.79], bad:[0,2.49] }, 
    info:"Backswing:Downswing ≈ 3:1", 
    fmt: rat
  },
  swingPlaneDeg: { 
    key: "swingPlaneDeg", 
    label: "Swing Plane", 
    unit:"°", 
    bands:{ good:[42,48], warn:[38,41], bad:[0,37] }, 
    info:"Typical neutral 42–48°", 
    fmt: d
  },
  handPathDepthCm: { 
    key: "handPathDepthCm", 
    label: "Hand Depth", 
    unit:"cm", 
    bands:{ good:[10,20], warn:[7,9], bad:[0,6] }, 
    info:"Sufficient depth at top", 
    fmt: cm
  },
};

// Rate helper
export function gradeMetric(key: MetricKey, value?: number): "good"|"warn"|"bad"|undefined {
  if (value == null) return;
  const m = METRIC_INFO[key]; 
  if (!m) return;
  const { good, warn, bad, reverse } = m.bands;
  const inRange = (r?: [number,number]) => r && value >= r[0] && value <= r[1];
  if (!reverse) {
    if (inRange(good)) return "good";
    if (inRange(warn)) return "warn";
    if (inRange(bad))  return "bad";
  } else {
    // lower is better
    if (inRange(good)) return "good";
    if (inRange(warn)) return "warn";
    if (inRange(bad))  return "bad";
  }
  return "warn";
}

// Legacy compatibility functions
export function getMetricState(key: string, value: number): 'good' | 'warn' | 'bad' | 'neutral' {
  const grade = gradeMetric(key as MetricKey, value);
  return grade || 'neutral';
}

// Confidence helper functions
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

// Format a metric value using its configured formatter
export function formatMetricValue(key: MetricKey, value: number): string {
  const metric = METRIC_INFO[key];
  if (!metric) return value.toString();
  
  if (metric.fmt) {
    return metric.fmt(value);
  }
  
  // Fallback formatting based on unit
  if (metric.unit === "°") return `${Math.round(value)}°`;
  if (metric.unit === "cm") return `${Math.round(value)} cm`;
  return value.toFixed(1);
}

// Get all metrics for a specific phase or context
export function getRelevantMetrics(phase?: string): MetricKey[] {
  const phaseMetrics: Record<string, MetricKey[]> = {
    setup: ["spineAngleDeg", "shoulderTiltDeg"],
    takeaway: ["handPathDepthCm", "tempoRatio"],
    backswing: ["swingPlaneDeg", "handPathDepthCm"],
    top: ["handPathDepthCm", "tempoRatio"],
    downswing: ["pelvisSwayCm", "headStabilityCm"],
    impact: ["hipOpenDeg", "clubFaceDeg", "shaftLeanDeg"],
    followThrough: ["hipOpenDeg", "headStabilityCm"]
  };

  return phaseMetrics[phase || ''] || Object.keys(METRIC_INFO) as MetricKey[];
}