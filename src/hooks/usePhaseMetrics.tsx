import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PhaseMetrics {
  [key: string]: number;
}

export interface PhaseTips {
  primary?: string;
  secondary?: string[];
}

export interface PhaseData {
  phase: string;
  metrics: PhaseMetrics;
  tips: PhaseTips;
  confidence: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  frameIndex?: number;
}

export interface UsePhaseMetricsReturn {
  phases: Record<string, PhaseData>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePhaseMetrics(sessionId: string | null): UsePhaseMetricsReturn {
  const [phases, setPhases] = useState<Record<string, PhaseData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhaseMetrics = async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      // Mock implementation with realistic swing metrics
      // In production, this would fetch from swing_phase_results table
      const mockPhases: Record<string, PhaseData> = {
        setup: {
          phase: 'setup',
          metrics: {
            shaftLeanDeg: 7.2,
            shoulderTurnDeg: 15.5,
            weightTransferPct: 45.0,
            headStability: 1.8
          },
          tips: {
            primary: "Good setup position with slight forward shaft lean",
            secondary: ["Keep feet shoulder-width apart", "Maintain spine angle"]
          },
          confidence: 0.85,
          status: 'done',
          frameIndex: 2
        },
        takeaway: {
          phase: 'takeaway',
          metrics: {
            shoulderTurnDeg: 32.8,
            weightTransferPct: 48.0,
            headStability: 2.1,
            clubFaceAngleDeg: 1.5
          },
          tips: {
            primary: "Smooth one-piece takeaway maintaining triangle",
            secondary: ["Keep club low and wide", "Avoid early wrist hinge"]
          },
          confidence: 0.78,
          status: 'done',
          frameIndex: 5
        },
        backswing: {
          phase: 'backswing',
          metrics: {
            shoulderTurnDeg: 67.3,
            weightTransferPct: 52.0,
            headStability: 2.8,
            swingPathDeg: -1.2
          },
          tips: {
            primary: "Good shoulder turn creating width and power",
            secondary: ["Complete the hip turn", "Maintain posture"]
          },
          confidence: 0.82,
          status: 'done',
          frameIndex: 8
        },
        top: {
          phase: 'top',
          metrics: {
            shoulderTurnDeg: 95.5,
            weightTransferPct: 60.0,
            headStability: 3.2,
            tempoRatio: 3.1
          },
          tips: {
            primary: "Excellent shoulder turn at the top of backswing",
            secondary: ["Maintain lag angle", "Start downswing with lower body"]
          },
          confidence: 0.91,
          status: 'done',
          frameIndex: 10
        },
        impact: {
          phase: 'impact',
          metrics: {
            shaftLeanDeg: 12.8,
            hipOpenDeg: 35.2,
            weightTransferPct: 75.0,
            clubFaceAngleDeg: 0.8
          },
          tips: {
            primary: "Strong impact position with forward shaft lean",
            secondary: ["Good hip rotation through impact", "Square clubface"]
          },
          confidence: 0.88,
          status: 'done',
          frameIndex: 14
        },
        followThrough: {
          phase: 'followThrough',
          metrics: {
            hipOpenDeg: 85.0,
            shoulderTurnDeg: 110.0,
            weightTransferPct: 90.0,
            headStability: 2.5
          },
          tips: {
            primary: "Complete follow-through with balanced finish",
            secondary: ["Belt buckle facing target", "Weight on front foot"]
          },
          confidence: 0.86,
          status: 'done',
          frameIndex: 18
        }
      };

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPhases(mockPhases);
    } catch (err) {
      console.error('Error fetching phase metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhaseMetrics();
  }, [sessionId]);

  return {
    phases,
    loading,
    error,
    refetch: fetchPhaseMetrics
  };
}