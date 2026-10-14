/**
 * BRIEF_CONTENT_DESK — the Content page's server reads.
 *
 * Every figure is used exactly as the RPC returns it (admin accounts are
 * already excluded server-side). Nothing here derives a duration from
 * timestamps. Permission errors pass through so the panel can say
 * "Full admins only".
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Beat = 'tour' | 'amateur';

export interface NewsroomDay {
  date: string;
  tour: number;
  amateur: number;
  tour_scheduled: number;
  amateur_scheduled: number;
}
export interface NewsroomQueueItem {
  kind: Beat;
  id: string;
  slug: string;
  kicker: string | null;
  headline: string;
  categories: string[] | null;
  state: 'draft' | 'scheduled';
  publish_at: string | null;
  updated_at: string | null;
  faults: string[] | null;
  checks: { key: string; label?: string; value?: string | number | null; ok: boolean }[] | null;
}
export interface NewsroomStory {
  kind: Beat;
  id: string;
  slug: string;
  kicker: string | null;
  headline: string;
  categories: string[] | null;
  published_at: string;
  blocks: number | null;
  readers: number | null;
  views: number | null;
  avg_read_secs: number | null;
  est_read_secs: number | null;
  through: number | null;
  faults: string[] | null;
}
export interface Newsroom {
  week_start: string;
  week: NewsroomDay[];
  readers_7d: number | null;
  active_7d: number | null;
  avg_read_secs_30d: number | null;
  avg_through: number | null;
  live: { tour: number; amateur: number };
  queue: NewsroomQueueItem[];
  stories: NewsroomStory[];
}
export interface StoryInsight {
  state: 'draft' | 'scheduled' | 'published' | string;
  published_at: string | null;
  readers: number | null;
  members: number | null;
  views: number | null;
  avg_read_secs: number | null;
  est_read_secs: number | null;
  through: number | null;
  news_avg_through: number | null;
  daily_new_readers: { date: string; readers: number }[] | null;
  sources: { label: string; opens: number }[] | null;
  blocks: Record<string, number> | null;
  checks: { key: string; label: string; value: string | number | null; ok: boolean }[] | null;
}

const STALE = 60_000;
const BASE = ['admin', 'content'] as const;

/** The console's global refresh button re-reads every content query. */
function useAdminRefetch() {
  const qc = useQueryClient();
  useEffect(() => {
    const h = () => qc.invalidateQueries({ queryKey: BASE });
    window.addEventListener('admin-v2:refetch', h);
    return () => window.removeEventListener('admin-v2:refetch', h);
  }, [qc]);
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase.rpc as any)(fn, args ?? {});
  if (error) throw error;
  return data as T;
}

/** True when the error is the server refusing the caller's role. */
export function isPermissionError(e: unknown): boolean {
  const err = e as { code?: string; message?: string } | null;
  if (!err) return false;
  return err.code === '42501' || /permission|not authori[sz]ed|forbidden|admins only/i.test(err.message ?? '');
}

export function useNewsroom() {
  useAdminRefetch();
  return useQuery({
    queryKey: [...BASE, 'newsroom'],
    queryFn: () => rpc<Newsroom>('get_admin_newsroom'),
    staleTime: STALE,
    retry: (n, e) => !isPermissionError(e) && n < 2,
  });
}

export function useStoryInsight(kind: Beat | null, id: string | null) {
  useAdminRefetch();
  return useQuery({
    queryKey: [...BASE, 'story', kind, id],
    queryFn: () => rpc<StoryInsight>('get_admin_story_insight', { p_kind: kind, p_id: id }),
    enabled: !!kind && !!id,
    staleTime: STALE,
    retry: (n, e) => !isPermissionError(e) && n < 2,
  });
}

export function useCourseCoverage() {
  useAdminRefetch();
  return useQuery({
    queryKey: [...BASE, 'courses'],
    queryFn: () => rpc<any>('get_admin_course_coverage', { p_limit: 500 }),
    staleTime: STALE,
    retry: (n, e) => !isPermissionError(e) && n < 2,
  });
}

export function useFeedsHealth() {
  useAdminRefetch();
  return useQuery({
    queryKey: [...BASE, 'feeds'],
    queryFn: () => rpc<any>('get_admin_feeds_health'),
    staleTime: STALE,
    retry: (n, e) => !isPermissionError(e) && n < 2,
  });
}

export function useHelpInsight(days = 30) {
  useAdminRefetch();
  return useQuery({
    queryKey: [...BASE, 'help', days],
    queryFn: () => rpc<any>('get_admin_help_insight', { p_days: days }),
    staleTime: STALE,
    retry: (n, e) => !isPermissionError(e) && n < 2,
  });
}
