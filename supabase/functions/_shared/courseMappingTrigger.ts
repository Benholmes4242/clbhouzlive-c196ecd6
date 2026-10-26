// supabase/functions/_shared/courseMappingTrigger.ts
//
// BRIEF_COURSE_MAPPING_ON_SYNC. After a sync upserts whs_courses, ask the
// course-mapping orchestrator to match any WHS course clbhouz has NEVER
// processed (no whs_to_golf_course_map row at all), so a new member's rounds
// are not nameless until the six-hourly cron. Courses with any map row,
// mapped or failed, are left to the cron so known failures are not re-sent
// to Echo on every sync.
//
// FIRE-AND-FORGET: requestCourseMapping returns immediately and never throws.
// A lookup error, network error or non-2xx is logged with the course count
// only; the sync's result is never touched or delayed.
//
// No imports on purpose: the module is unit-tested under vitest.

export const COURSE_MAPPING_MAX_IDS = 25;

type Client = { from: (t: string) => any };
type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; text?: () => Promise<string> }>;
export interface CourseMappingDeps {
  fetch?: Fetch;
  baseUrl?: string;
  secret?: string;
  /** Keeps the background request alive after the response; EdgeRuntime.waitUntil when present. */
  waitUntil?: (p: Promise<unknown>) => void;
}

const env = (k: string): string | undefined => {
  try { return (globalThis as any).Deno?.env?.get(k) ?? undefined; } catch { return undefined; }
};

/** Never-processed ids, most played first (stable on ties), capped at 25. */
export function pickUnprocessed(ids: string[], mapped: Set<string>, roundCounts: Map<string, number>): string[] {
  const unique = [...new Set(ids)].filter((id) => !mapped.has(id));
  return unique
    .map((id, i) => ({ id, i, n: roundCounts.get(id) ?? 0 }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, COURSE_MAPPING_MAX_IDS)
    .map((x) => x.id);
}

export async function runCourseMappingRequest(
  client: Client,
  whsCourseIds: string[],
  roundCounts: Map<string, number> = new Map(),
  deps: CourseMappingDeps = {},
): Promise<{ sent: string[] } | { sent: []; skipped: string }> {
  const ids = [...new Set(whsCourseIds.filter(Boolean))];
  if (ids.length === 0) return { sent: [], skipped: 'no_ids' };
  const { data, error } = await client.from('whs_to_golf_course_map').select('whs_course_id').in('whs_course_id', ids);
  if (error) {
    console.error(JSON.stringify({ event: 'course_mapping_request_failed', stage: 'lookup', course_count: ids.length }));
    return { sent: [], skipped: 'lookup_error' };
  }
  const mapped = new Set<string>(((data ?? []) as { whs_course_id: string }[]).map((r) => r.whs_course_id));
  const send = pickUnprocessed(ids, mapped, roundCounts);
  if (send.length === 0) return { sent: [], skipped: 'none_unprocessed' };

  const base = deps.baseUrl ?? env('SUPABASE_URL') ?? '';
  const secret = deps.secret ?? env('INTERNAL_FN_SECRET') ?? '';
  const doFetch = deps.fetch ?? (globalThis.fetch as unknown as Fetch);
  try {
    const res = await doFetch(`${base}/functions/v1/gam-course-mapping-orchestrator`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify({ mode: 'courses', whs_course_ids: send }),
    });
    try { await res.text?.(); } catch { /* body drained best-effort */ }
    if (!res.ok) console.error(JSON.stringify({ event: 'course_mapping_request_failed', status: res.status, course_count: send.length }));
    else console.log(JSON.stringify({ event: 'course_mapping_requested', course_count: send.length }));
  } catch {
    console.error(JSON.stringify({ event: 'course_mapping_request_failed', stage: 'fetch', course_count: send.length }));
  }
  return { sent: send };
}

/** Fire-and-forget entry point for syncs. Never awaited, never throws. */
export function requestCourseMapping(
  client: Client,
  whsCourseIds: string[],
  roundCounts?: Map<string, number>,
  deps: CourseMappingDeps = {},
): void {
  try {
    const p = runCourseMappingRequest(client, whsCourseIds, roundCounts, deps).catch(() => {
      console.error(JSON.stringify({ event: 'course_mapping_request_failed', stage: 'unexpected', course_count: whsCourseIds.length }));
    });
    const wait = deps.waitUntil ?? (globalThis as any).EdgeRuntime?.waitUntil?.bind((globalThis as any).EdgeRuntime);
    if (wait) wait(p);
  } catch { /* never into the sync */ }
}
