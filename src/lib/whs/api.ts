import { supabase } from '@/integrations/supabase/client';
import type {
  WhsConnection,
  WhsHandicapTrend,
  WhsScore,
  WhsCounterScore,
  ConnectWhsResponse,
  SyncWhsResponse,
} from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchWhsConnection(userId: string): Promise<WhsConnection | null> {
  const { data, error } = await supabase
    .from('whs_connections' as any)
    .select(
      'id, passport_id, membership_number, last_synced_at, last_sync_status, initial_sync_complete, created_at'
    )
    .eq('user_id', userId)
    .eq('provider', 'england_golf')
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as WhsConnection) ?? null;
}

export async function fetchHandicapTrend(connectionId: string): Promise<WhsHandicapTrend> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

  const { data: latest } = await supabase
    .from('whs_handicap_snapshots' as any)
    .select('handicap_index, observed_at')
    .eq('connection_id', connectionId)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: previous } = await supabase
    .from('whs_handicap_snapshots' as any)
    .select('handicap_index, observed_at')
    .eq('connection_id', connectionId)
    .lte('observed_at', thirtyDaysAgo)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const l = latest as any;
  const p = previous as any;
  if (!l) return { current: null, delta: null, hasHistory: false };
  if (!p) return { current: Number(l.handicap_index), delta: null, hasHistory: false };
  return {
    current: Number(l.handicap_index),
    delta: Number(l.handicap_index) - Number(p.handicap_index),
    hasHistory: true,
  };
}

const SCORE_SELECT = `
  id, play_date, adjusted_gross, stableford_points,
  handicap_differential, course_rating, slope_rating, marker_name,
  is_counter,
  course:whs_courses(name, country_name)
`;

export async function fetchLastRound(connectionId: string): Promise<WhsScore | null> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select(SCORE_SELECT)
    .eq('connection_id', connectionId)
    .order('play_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as WhsScore) ?? null;
}

export async function fetchCounters(connectionId: string): Promise<WhsCounterScore[]> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select(`id, play_date, adjusted_gross, handicap_differential, course:whs_courses(name)`)
    .eq('connection_id', connectionId)
    .eq('is_counter', true)
    .order('play_date', { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data as unknown as WhsCounterScore[]) ?? [];
}

export async function fetchRecentRounds(connectionId: string): Promise<WhsScore[]> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select(`
      id, play_date, adjusted_gross, stableford_points,
      handicap_differential, is_counter,
      course:whs_courses(name)
    `)
    .eq('connection_id', connectionId)
    .order('play_date', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data as unknown as WhsScore[]) ?? [];
}

export async function callConnectWhs(membership_number: string, password: string): Promise<ConnectWhsResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/connect-whs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ membership_number, password }),
  });
  try {
    return (await res.json()) as ConnectWhsResponse;
  } catch {
    return { ok: false, error_code: 'internal_error', message: 'Unexpected response from server.' };
  }
}

export async function callSyncWhsOne(): Promise<SyncWhsResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-whs-one`, {
    method: 'POST',
    headers,
  });
  try {
    return (await res.json()) as SyncWhsResponse;
  } catch {
    return { ok: false, message: 'Unexpected response from server.' };
  }
}
