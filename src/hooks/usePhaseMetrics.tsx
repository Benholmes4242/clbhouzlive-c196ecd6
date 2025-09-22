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
            spineAngleDeg: 36.2,
            shoulderTiltDeg: 12.5,
            pelvisSwayCm: 2.1,
            headStabilityCm: 1.8
          },
          tips: {
            primary: "Excellent setup position with proper spine angle",
            secondary: ["Maintain shoulder tilt at address", "Keep minimal lateral movement"]
          },
          confidence: 0.85,
          status: 'done',
          frameIndex: 2
        },
        takeaway: {
          phase: 'takeaway',
          metrics: {
            handPathDepthCm: 15.8,
            tempoRatio: 3.1,
            headStabilityCm: 2.1,
            clubFaceDeg: 1.5
          },
          tips: {
            primary: "Smooth one-piece takeaway with good depth",
            secondary: ["Maintain tempo ratio", "Keep club on plane"]
          },
          confidence: 0.78,
          status: 'done',
          frameIndex: 5
        },
        backswing: {
          phase: 'backswing',
          metrics: {
            swingPlaneDeg: 45.3,
            handPathDepthCm: 18.2,
            headStabilityCm: 2.8,
            tempoRatio: 3.0
          },
          tips: {
            primary: "Good swing plane and hand depth at top",
            secondary: ["Complete the shoulder turn", "Maintain posture"]
          },
          confidence: 0.82,
          status: 'done',
          frameIndex: 8
        },
        top: {
          phase: 'top',
          metrics: {
            handPathDepthCm: 19.5,
            tempoRatio: 3.1,
            headStabilityCm: 3.2,
            swingPlaneDeg: 44.8
          },
          tips: {
            primary: "Excellent position at the top of backswing",
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
            clubFaceDeg: 0.8,
            headStabilityCm: 2.5
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
            headStabilityCm: 2.5,
            pelvisSwayCm: 1.8,
            tempoRatio: 3.0
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