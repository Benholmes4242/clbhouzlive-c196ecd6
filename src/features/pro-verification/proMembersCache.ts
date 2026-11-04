/** Public verified-only identity cache. Microtask coalescing batches every
 * screen's visible identities, including independent sibling rows; missing
 * identities are cached too. No profile metadata can grant a PRO label. */
import { supabase } from '@/integrations/supabase/client';
import { isProKind, type ProKind } from './proRules';

export interface ProMember {
  user_id: string;
  pro_kind: ProKind;
  pro_tour: string | null;
  pro_tour_code: string | null;
  pro_club: string | null;
  pro_player_id: string | null;
}
export const PRO_MEMBERS_STALE_MS = 300_000;
type Entry = { value: ProMember | null; at: number };
const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<ProMember | null>>();
const queue = new Map<string, { resolve: (row: ProMember | null) => void; reject: (error: unknown) => void }>();
const listeners = new Set<() => void>();
let scheduled = false;
let generation = 0;

export function subscribeProMembers(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function cachedProMember(id: string): ProMember | null | undefined {
  const entry = cache.get(id);
  return entry && Date.now() - entry.at < PRO_MEMBERS_STALE_MS ? entry.value : undefined;
}
export function invalidateProMembers() {
  generation += 1;
  cache.clear();
  pending.clear();
  listeners.forEach(listener => listener());
}
async function flush() {
  scheduled = false;
  const batch = new Map(queue);
  queue.clear();
  const ids = [...batch.keys()];
  const version = generation;
  if (!ids.length) return;
  try {
    const { data, error } = await (supabase.rpc as unknown as (
      name: string, args: { p_user_ids: string[] },
    ) => Promise<{ data: unknown; error: unknown }>)('get_pro_members', { p_user_ids: ids });
    if (error) throw error;
    const rows = new Map<string, ProMember>();
    if (Array.isArray(data)) for (const row of data) {
      if (row && typeof row.user_id === 'string' && isProKind(row.pro_kind)) rows.set(row.user_id, row as ProMember);
    }
    for (const [id, deferred] of batch) {
      const value = rows.get(id) ?? null;
      if (version === generation) { cache.set(id, { value, at: Date.now() }); pending.delete(id); }
      deferred.resolve(version === generation ? value : null);
    }
  } catch (error) {
    for (const [id, deferred] of batch) { if (version === generation) pending.delete(id); deferred.reject(error); }
  }
}
export async function readProMembers(userIds: readonly string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  const values = await Promise.all(ids.map(id => {
    const cached = cachedProMember(id);
    if (cached !== undefined) return Promise.resolve(cached);
    const inFlight = pending.get(id);
    if (inFlight) return inFlight;
    const promise = new Promise<ProMember | null>((resolve, reject) => queue.set(id, { resolve, reject }));
    pending.set(id, promise);
    if (!scheduled) { scheduled = true; queueMicrotask(() => { void flush(); }); }
    return promise;
  }));
  return new Map(ids.map((id, i) => [id, values[i]]));
}