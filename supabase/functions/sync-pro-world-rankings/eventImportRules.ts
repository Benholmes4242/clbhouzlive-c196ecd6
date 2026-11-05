/** Pure import planning only. Source discovery/authenticated persistence live outside this module.
 * An ambiguous same-week match must fail instead of overwriting an arbitrary member event.
 * Member round rows win any round-number collision; conversion preserves event identity.
 */
export type OwgrEvent = { owgr_event_id: string; event_name: string; tour_name: string | null; start_date: string | null; end_date: string | null; finish: string; owgr_points: number | null; rounds?: { round_no: number; to_par: number }[] };
export type StoredEvent = { id: string; source: string; start_date: string | null; owgr_event_id: string | null };
export type StoredRound = { round_no: number; source: string };
export function eventImportTarget(event: OwgrEvent, existing: StoredEvent[]): StoredEvent | null {
  const linked = existing.find(row => row.owgr_event_id === event.owgr_event_id);
  if (linked) return linked;
  if (!event.start_date) return null; // Undated imports never merge into a member event.
  const start = Date.parse(event.start_date);
  if (!Number.isFinite(start)) throw new Error('Invalid event date');
  const matches = existing.filter(row => row.source === 'pro' && !row.owgr_event_id && row.start_date && Math.abs(Date.parse(row.start_date) - start) <= 3 * 86_400_000);
  if (matches.length > 1) throw new Error('Ambiguous same-week event');
  return matches[0] ?? null;
}
export function importedRounds(event: OwgrEvent, existing: StoredRound[]) {
  const own = new Set(existing.filter(row => row.source === 'pro').map(row => row.round_no));
  return (event.rounds ?? []).filter(row => !own.has(row.round_no)).map(row => ({ ...row, source: 'owgr' as const }));
}
export function shouldImportEvents(proPlayerId: string | null): boolean { return !proPlayerId; }