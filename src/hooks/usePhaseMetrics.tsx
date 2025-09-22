import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MetricKey } from "@/config/swingMetrics";
import { METRIC_INFO, gradeMetric } from "@/config/swingMetrics";

type PhaseName = "setup"|"takeaway"|"backswing"|"top"|"downswing"|"impact"|"followThrough";
type PhaseMetrics = Partial<Record<MetricKey, number>>;

export interface PhaseData {
  status: "idle"|"queued"|"running"|"done"|"error";
  usedFrameIndex?: number;
  metrics?: PhaseMetrics;
  tips?: string[];
  conf?: number; // from metrics.conf or separate
  error?: string;
}

export type UsePhaseMetricsResult = Record<PhaseName, PhaseData>;

export function usePhaseMetrics(sessionId?: string) {
  const [data, setData] = useState<UsePhaseMetricsResult>({} as any);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setData({} as any);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: rows, error: queryError } = await supabase
          .from("swing_phase_results")
          .select("phase, used_frame_index, metrics, tips, status, finished_at, error, confidence")
          .eq("session_id", sessionId)
          .order("finished_at", { ascending: true, nullsFirst: false });

        if (queryError) {
          console.error('Error fetching phase results:', queryError);
          setError(queryError.message);
          return;
        }

        const next: UsePhaseMetricsResult = {} as any;
        
        // Initialize all phases with idle status
        const allPhases: PhaseName[] = ["setup", "takeaway", "backswing", "top", "downswing", "impact", "followThrough"];
        allPhases.forEach(phase => {
          next[phase] = { status: "idle" };
        });

        // Update with actual data from database
        rows?.forEach((r: any) => {
          // Normalize metrics keys to MetricKey if needed
          const metrics = r.metrics as Record<string, number> | null;
          const normalized: PhaseMetrics = {};
          
          if (metrics) {
            Object.keys(metrics).forEach(k => {
              if (k in METRIC_INFO) {
                normalized[k as MetricKey] = metrics[k];
              }
            });
          }

          const phase = r.phase as PhaseName;
          if (phase in next) {
            next[phase] = {
              status: r.status || "idle",
              usedFrameIndex: r.used_frame_index ?? undefined,
              metrics: normalized,
              tips: Array.isArray(r.tips) ? r.tips : (r.tips ? [r.tips] : []),
              conf: r.confidence ?? metrics?.conf ?? undefined,
              error: r.error ?? undefined,
            };
          }
        });

        setData(next);
      } catch (err) {
        console.error('Error in usePhaseMetrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
    
    // Light polling to keep data fresh (SSE handles real-time updates, this keeps History in sync)
    const pollInterval = setInterval(load, 5000);
    return () => clearInterval(pollInterval);
  }, [sessionId]);

  // Helper functions for UI
  const grade = (k: MetricKey, v?: number) => gradeMetric(k, v);
  const info = METRIC_INFO;

  return { 
    data, 
    loading, 
    error, 
    grade, 
    info,
    refetch: () => {
      if (sessionId) {
        // Trigger a manual refetch
        setData({} as any);
      }
    }
  };
}