import { GolfMetric, MetricKey, SwingMetrics } from '@/types/swing';

export const GOLF_METRIC_DEFINITIONS: Record<MetricKey, Omit<GolfMetric, 'value'>> = {
  spineAngleDeg: {
    key: 'spineAngleDeg',
    range: [32, 40],
    unit: '°',
    description: 'Address posture spine angle'
  },
  shoulderTiltDeg: {
    key: 'shoulderTiltDeg', 
    range: [8, 18],
    unit: '°',
    description: 'Setup shoulder angle'
  },
  hipOpenDeg: {
    key: 'hipOpenDeg',
    range: [20, 45], 
    unit: '°',
    description: 'Impact hip rotation'
  },
  pelvisSwayCm: {
    key: 'pelvisSwayCm',
    range: [0, 3],
    unit: 'cm',
    description: 'Lateral stability',
    reverseScore: true
  },
  headStabilityCm: {
    key: 'headStabilityCm',
    range: [0, 2],
    unit: 'cm', 
    description: 'Head movement',
    reverseScore: true
  },
  clubFaceDeg: {
    key: 'clubFaceDeg',
    range: [-2, 2],
    unit: '°',
    description: 'Face angle at P6'
  },
  shaftLeanDeg: {
    key: 'shaftLeanDeg',
    range: [5, 15],
    unit: '°',
    description: 'Forward shaft lean'
  },
  tempoRatio: {
    key: 'tempoRatio',
    range: [2.8, 3.2],
    unit: ':1',
    description: 'Backswing:downswing ratio'
  },
  swingPlaneDeg: {
    key: 'swingPlaneDeg', 
    range: [42, 48],
    unit: '°',
    description: 'Swing plane angle'
  },
  handPathDepthCm: {
    key: 'handPathDepthCm',
    range: [10, 20],
    unit: 'cm',
    description: 'Hand depth at top'
  }
};

export function gradeMetric(metric: GolfMetric): 'good' | 'warn' | 'bad' {
  const { value, range, reverseScore } = metric;
  const [min, max] = range;
  
  const isInRange = value >= min && value <= max;
  const tolerance = (max - min) * 0.2; // 20% tolerance
  const isNearRange = value >= (min - tolerance) && value <= (max + tolerance);
  
  if (reverseScore) {
    // For metrics where lower is better
    if (value <= min) return 'good';
    if (value <= max) return 'warn'; 
    return 'bad';
  } else {
    // For normal metrics
    if (isInRange) return 'good';
    if (isNearRange) return 'warn';
    return 'bad';
  }
}

export function formatMetricValue(metric: GolfMetric): string {
  const { value, unit } = metric;
  
  if (unit === ':1') {
    return `${value.toFixed(1)}${unit}`;
  }
  if (unit === '°') {
    return `${value.toFixed(1)}${unit}`;
  }
  if (unit === 'cm') {
    return `${value.toFixed(1)}${unit}`;
  }
  
  return `${value.toFixed(1)}${unit}`;
}

export function generateMockMetrics(): SwingMetrics {
  const metrics: SwingMetrics = {};
  
  Object.entries(GOLF_METRIC_DEFINITIONS).forEach(([key, definition]) => {
    const [min, max] = definition.range;
    // Generate values slightly outside perfect range for realism
    const variance = (max - min) * 0.3;
    const centerValue = (min + max) / 2;
    const value = centerValue + (Math.random() - 0.5) * variance;
    
    metrics[key] = {
      ...definition,
      value: Math.max(0, value) // Ensure no negative values
    };
  });
  
  return metrics;
}