/** Verified identity comes only from get_verified_amateurs, independently of
 * results visibility. Sibling names share a five-minute, miss-caching batch;
 * generation guards prevent pre-invalidation requests restoring old badges. */
import { supabase } from '@/integrations/supabase/client';

export const AMATEUR_MEMBERS_STALE_MS = 300_000;
type Entry = { value: string | null; at: number };
type Deferred = { resolve: (member: string | null) => void; reject: (error: unknown) => void; generation: number };
const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<string | null>>();
const queue = new Map<string, Deferred>();
const listeners = new Set<() => void>();
let scheduled = false;
let generation = 0;

export function subscribeAmateurMembers(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function cachedAmateurMember(id: string): string | null | undefined {
  const entry = cache.get(id);
  return entry && Date.now() - entry.at < AMATEUR_MEMBERS_STALE_MS ? entry.value : undefined;
}
export function invalidateAmateurMembers() {
  generation += 1;
  cache.clear();
  pending.clear();
  for (const deferred of queue.values()) deferred.resolve(null);
  queue.clear();
  listeners.forEach(listener => listener());
}
async function flush() {
  scheduled = false;
  const batch = new Map(queue);
  queue.clear();
  const ids = [...batch.keys()];
  for (let offset = 0; offset < ids.length; offset += 500) {
    const chunk = ids.slice(offset, offset + 500);
    try {
      const { data, error } = await supabase.rpc('get_verified_amateurs', { p_user_ids: chunk });
      if (error) throw error;
      const members = new Set((data ?? []).map(row => row.user_id));
      for (const id of chunk) {
        const deferred = batch.get(id);
        if (!deferred) continue;
        const current = deferred.generation === generation;
        const value = members.has(id) ? id : null;
        if (current) { cache.set(id, { value, at: Date.now() }); pending.delete(id); }
        deferred.resolve(current ? value : null);
      }
    } catch (error) {
      for (const id of chunk) {
        const deferred = batch.get(id);
        if (!deferred) continue;
        if (deferred.generation === generation) pending.delete(id);
        deferred.reject(error);
      }
    }
  }
}
export async function readAmateurMembers(userIds: readonly string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  const values = await Promise.all(ids.map(id => {
    const cached = cachedAmateurMember(id);
    if (cached !== undefined) return Promise.resolve(cached);
    const inFlight = pending.get(id);
    if (inFlight) return inFlight;
    const promise = new Promise<string | null>((resolve, reject) => queue.set(id, { resolve, reject, generation }));
    pending.set(id, promise);
    if (!scheduled) { scheduled = true; queueMicrotask(() => { void flush(); }); }
    return promise;
  }));
  return new Set(values.filter((value): value is string => value !== null));
}