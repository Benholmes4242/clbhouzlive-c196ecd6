/**
 * Analytics funnels (C3).
 *
 * SEQUENTIAL UNIQUE-USER model. A user counts in step N only if they also
 * fired step N-1 EARLIER in the selected period. Computation is client-side
 * from one bounded `analytics_events` query per funnel.
 *
 * Callsite audit (recorded here so nobody has to re-run the grep):
 *
 * SIGNUP funnel:
 *   - `signup_initiated` and `signup_success` are exported from
 *     src/lib/authAnalytics.ts (trackSignupInitiated/trackSignupSuccess)
 *     but as of this commit have ZERO callsites in src/. Numbers will read
 *     as 0/0/0 until those trackers are wired at the signup entry point
 *     and the post-signup success side effect. Onboarded uses
 *     user_profiles.has_completed_onboarding on the step-2 user ids.
 *
 * RATING funnel:
 *   - No callsites for rating_modal_opened / rating_slider_changed /
 *     rating_submitted / rating_confirmation_viewed in the current tree
 *     (only ratings.review_shared is fired, in useShareReview.ts:97).
 *     Steps rendered per spec so wiring lights them up automatically.
 *
 * AUTH funnel:
 *   - `auth_method_selected` fires FIRST in AuthForm.tsx (email:111,
 *     apple:308, google:410), before the user commits.
 *   - `auth_initiated` fires on Send/Continue (email:136, apple:243,
 *     google:341).
 *   - `auth_complete` is exported (trackAuthComplete) but has no callsite;
 *     wire it in the post-sign-in redirect to light up the final step.
 *   Order used below reflects the actual firing order:
 *     auth_method_selected -> auth_initiated -> auth_complete.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type AnalyticsPeriod, periodToDays } from './useAnalytics';

const EVENT_QUERY_LIMIT = 50000;

export interface FunnelStepView {
  key: string;
  label: string;
  count: number;
  convFromPrev: number | null; // % vs previous step
  dropFromPrev: number;        // absolute drop from previous step
}

export interface FunnelView {
  id: 'signup' | 'rating' | 'auth';
  title: string;
  subtitle: string;
  steps: FunnelStepView[];
  isEmpty: boolean;
}

interface EventRow { name: string; user_id: string | null; created_at: string; }

async function fetchEventsByNames(
  names: readonly string[],
  sinceISO: string,
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('name, user_id, created_at')
    .in('name', names as unknown as string[])
    .gte('created_at', sinceISO)
    .not('user_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(EVENT_QUERY_LIMIT);
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

/**
 * Sequential unique-user reduce: for each ordered step, keep the set of
 * users who fired the previous step earlier than their first occurrence
 * of this step. The set for step 0 is simply everyone who fired step 0.
 */
function sequentialUniqueUsers(
  rows: EventRow[],
  orderedStepNames: readonly string[],
): number[] {
  // first-occurrence timestamp per (user, step)
  const firstAt = new Map<string, number[]>(); // user_id -> ts per step index
  const stepIndex = new Map<string, number>();
  orderedStepNames.forEach((n, i) => stepIndex.set(n, i));

  for (const r of rows) {
    const i = stepIndex.get(r.name);
    if (i === undefined || !r.user_id) continue;
    const ts = new Date(r.created_at).getTime();
    let arr = firstAt.get(r.user_id);
    if (!arr) { arr = new Array(orderedStepNames.length).fill(Number.POSITIVE_INFINITY); firstAt.set(r.user_id, arr); }
    if (ts < arr[i]) arr[i] = ts;
  }

  const counts = new Array(orderedStepNames.length).fill(0);
  firstAt.forEach((arr) => {
    let prev = -Infinity;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === Number.POSITIVE_INFINITY) break;
      if (i > 0 && !(prev < arr[i])) break; // must have fired earlier
      counts[i] += 1;
      prev = arr[i];
    }
  });
  return counts;
}

function toStepView(labels: string[], keys: string[], counts: number[]): FunnelStepView[] {
  return labels.map((label, i) => {
    const count = counts[i] ?? 0;
    const prev = i === 0 ? null : (counts[i - 1] ?? 0);
    const convFromPrev = prev === null ? null : (prev === 0 ? 0 : Math.round((count / prev) * 1000) / 10);
    const dropFromPrev = prev === null ? 0 : Math.max(0, prev - count);
    return { key: keys[i], label, count, convFromPrev, dropFromPrev };
  });
}

async function fetchSignupFunnel(sinceISO: string): Promise<FunnelView> {
  const STEP_NAMES = ['signup_initiated', 'signup_success'] as const;
  const rows = await fetchEventsByNames(STEP_NAMES, sinceISO);
  const [step1, step2] = sequentialUniqueUsers(rows, STEP_NAMES);

  // Onboarded = step-2 users whose profile has_completed_onboarding = true.
  const step2Ids = new Set<string>();
  {
    const first = new Map<string, [number, number]>();
    const idx = new Map<string, number>(STEP_NAMES.map((n, i) => [n, i]));
    for (const r of rows) {
      const i = idx.get(r.name); if (i === undefined || !r.user_id) continue;
      const ts = new Date(r.created_at).getTime();
      const cur = first.get(r.user_id) ?? [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      if (ts < cur[i]) cur[i] = ts;
      first.set(r.user_id, cur);
    }
    first.forEach((v, uid) => {
      if (v[0] !== Number.POSITIVE_INFINITY && v[1] !== Number.POSITIVE_INFINITY && v[0] < v[1]) {
        step2Ids.add(uid);
      }
    });
  }
  let onboarded = 0;
  if (step2Ids.size > 0) {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, has_completed_onboarding')
      .in('id', Array.from(step2Ids))
      .limit(EVENT_QUERY_LIMIT);
    onboarded = (data ?? []).filter(r => r.has_completed_onboarding === true).length;
  }

  const steps = toStepView(
    ['Sign-up started', 'Sign-up completed', 'Onboarded'],
    ['signup_initiated', 'signup_success', 'onboarded'],
    [step1 ?? 0, step2 ?? 0, onboarded],
  );
  return {
    id: 'signup',
    title: 'Sign-up',
    subtitle: 'Started -> completed -> onboarded (has_completed_onboarding)',
    steps,
    isEmpty: (step1 ?? 0) === 0 && (step2 ?? 0) === 0 && onboarded === 0,
  };
}

async function fetchRatingFunnel(sinceISO: string): Promise<FunnelView> {
  const STEP_NAMES = ['rating_modal_opened', 'rating_slider_changed', 'rating_submitted'] as const;
  const rows = await fetchEventsByNames(STEP_NAMES, sinceISO);
  const counts = sequentialUniqueUsers(rows, STEP_NAMES);
  const steps = toStepView(
    ['Modal opened', 'Slider moved', 'Submitted'],
    [...STEP_NAMES],
    counts,
  );
  const isEmpty = counts.every(c => c === 0);
  return { id: 'rating', title: 'Course rating', subtitle: 'Sequential unique users per period', steps, isEmpty };
}

async function fetchAuthFunnel(sinceISO: string): Promise<FunnelView> {
  // Actual firing order verified in AuthForm.tsx (see file header).
  const STEP_NAMES = ['auth_method_selected', 'auth_initiated', 'auth_complete'] as const;
  const rows = await fetchEventsByNames(STEP_NAMES, sinceISO);
  const counts = sequentialUniqueUsers(rows, STEP_NAMES);
  const steps = toStepView(
    ['Method selected', 'Attempt sent', 'Completed'],
    [...STEP_NAMES],
    counts,
  );
  const isEmpty = counts.every(c => c === 0);
  return { id: 'auth', title: 'Auth flow', subtitle: 'method_selected -> initiated -> complete', steps, isEmpty };
}

export function useFunnels(period: AnalyticsPeriod) {
  const sinceISO = useMemo(
    () => new Date(Date.now() - periodToDays(period) * 86400_000).toISOString(),
    [period],
  );

  const signup = useQuery({
    queryKey: ['admin-v2', 'analytics', 'funnels', 'signup', period],
    queryFn: () => fetchSignupFunnel(sinceISO),
    staleTime: 5 * 60_000,
  });
  const rating = useQuery({
    queryKey: ['admin-v2', 'analytics', 'funnels', 'rating', period],
    queryFn: () => fetchRatingFunnel(sinceISO),
    staleTime: 5 * 60_000,
  });
  const auth = useQuery({
    queryKey: ['admin-v2', 'analytics', 'funnels', 'auth', period],
    queryFn: () => fetchAuthFunnel(sinceISO),
    staleTime: 5 * 60_000,
  });

  return { signup, rating, auth };
}
