import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HandicapInsights, SuitedCourse } from './types';

const insightsKey = (cid: string) => ['whs-ai-insights', cid] as const;

async function fetchCachedInsights(connectionId: string): Promise<{
  insights: HandicapInsights | null;
  cachedScoreId: string | null;
  latestScoreId: string | null;
}> {
  const [{ data: row }, { data: latest }] = await Promise.all([
    supabase
      .from('whs_ai_insights')
      .select('scoring_profile, rounds_pattern, suited_courses, test_courses, generated_from_score_id, generated_at')
      .eq('connection_id', connectionId)
      .maybeSingle(),
    supabase
      .from('whs_scores')
      .select('id')
      .eq('connection_id', connectionId)
      .order('play_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let insights: HandicapInsights | null = null;
  if (row) {
    insights = {
      scoring_profile: row.scoring_profile,
      rounds_pattern: (row as any).rounds_pattern ?? '',
      suited_courses: (row.suited_courses as SuitedCourse[]) ?? [],
      test_courses: (row.test_courses as SuitedCourse[]) ?? [],
      generated_at: row.generated_at,
    };
  }

  return {
    insights,
    cachedScoreId: (row?.generated_from_score_id as string) ?? null,
    latestScoreId: (latest?.id as string) ?? null,
  };
}

export function useHandicapInsights(connectionId: string | undefined) {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const query = useQuery({
    queryKey: insightsKey(connectionId ?? ''),
    queryFn: () => fetchCachedInsights(connectionId as string),
    enabled: !!connectionId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!connectionId || !query.data) return;
    const { insights, cachedScoreId, latestScoreId } = query.data;
    if (!latestScoreId) return; // no rounds
    const cacheValid = insights && cachedScoreId === latestScoreId;
    if (cacheValid || generating) return;

    let cancelled = false;
    (async () => {
      setGenerating(true);
      setError(null);
      try {
        const { error: fnErr } = await supabase.functions.invoke(
          'generate-handicap-insights',
          { body: { connection_id: connectionId } },
        );
        if (fnErr) throw fnErr;
        if (!cancelled) {
          await qc.invalidateQueries({ queryKey: insightsKey(connectionId) });
        }
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId, query.data?.cachedScoreId, query.data?.latestScoreId]);

  const data = query.data?.insights ?? null;
  const cacheStale =
    !!query.data &&
    query.data.latestScoreId &&
    query.data.cachedScoreId !== query.data.latestScoreId;

  return {
    data: cacheStale ? null : data,
    isLoading: query.isLoading || generating,
    error: error ?? (query.error as Error | null) ?? null,
  };
}
