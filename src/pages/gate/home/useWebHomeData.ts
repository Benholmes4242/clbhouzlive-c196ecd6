/** Homepage reads are public RPC-only, with one-hour figures and fail-closed responses.
 * An isolated fallback client preserves standalone gate rendering; app providers win.
 */
import { useContext } from 'react';
import { QueryClient, QueryClientContext, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const fallbackClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const HOUR = 3_600_000;
export interface WebFigures { courses_total: number; rounds_total: number; holes_total: number }
export interface WebHole { hole_no: number; avg_to_par: number; stroke_index: number | null }
export interface WebCourse { id: string; name: string; area?: string; region?: string; sub_country?: string; country?: string; rating_avg: number | null; ratings_count: number; quote: string | null; rounds: number; hole_rounds: number; plays_vs_par: number | null; read_available: boolean; hardest_hole: WebHole | null; card_hardest_hole: number | null; top_holes: WebHole[] }
export interface WebHit { id: string; name: string; area?: string; region?: string; sub_country?: string; country?: string }
export async function webRpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const response = await supabase.rpc(name as never, args as never);
  if (!response || response.error || response.data == null) throw response?.error ?? new Error('Homepage read unavailable');
  return response.data as T;
}
export function useWebHomeFigures() {
  const client = useContext(QueryClientContext) ?? fallbackClient;
  return useQuery({ queryKey: ['web-home-figures'], staleTime: HOUR, gcTime: HOUR, retry: false, queryFn: async () => {
    const data = await webRpc<WebFigures | WebFigures[]>('get_web_home_figures');
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !Number.isFinite(Number(row.courses_total))) throw new Error('Homepage figures unavailable');
    return row;
  } }, client);
}
export function useWebCourseCard(id: string | null, enabled = true) {
  const client = useContext(QueryClientContext) ?? fallbackClient;
  return useQuery({ queryKey: ['web-course-card', id], enabled, staleTime: HOUR, retry: false, queryFn: () => webRpc<WebCourse>('get_web_course_card', { p_course_id: id }) }, client);
}
export function useWebCourseHits(query: string) {
  const client = useContext(QueryClientContext) ?? fallbackClient;
  const popular = useQuery({ queryKey: ['web-popular-courses'], staleTime: HOUR, retry: false, queryFn: () => webRpc<WebHit[]>('get_web_popular_courses', { p_limit: 5 }) }, client);
  const search = useQuery({ queryKey: ['web-course-search', query], enabled: query.length >= 2, retry: false, queryFn: () => webRpc<WebHit[]>('search_golf_courses', { search_query: query, limit_count: 5 }) }, client);
  return { popular, hits: query.length >= 2 ? search.data ?? [] : query ? [] : popular.data ?? [] };
}
export function fmt(n: number, locale: string): string { try { return n.toLocaleString(locale); } catch { return n.toLocaleString('en'); } }
export function courseArea(c: WebHit): string { return c.area ?? [c.region, c.sub_country || c.country].filter(Boolean).join(', '); }
export function ordinal(n: number): string { const mod = n % 100; return `${n}${mod >= 11 && mod <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th')}`; }
export function signed(n: number, digits: number): string { return n === 0 ? 'E' : `${n > 0 ? '+' : ''}${n.toFixed(digits)}`; }
