/** Sequential per-pro isolation; requests spaced across the run, event details
 * cached once per event across pros. Only verified tour pros may be synced.
 */
export type SyncSource = { user_id: string; owgr_url: string; owgr_slug: string };
export type Pro = { id: string; pro_kind: string | null; pro_verified_at: string | null; pro_player_id: string | null };
export function verifiedTourPro(pro: Pro | undefined): boolean { return !!pro?.pro_verified_at && pro.pro_kind === 'tour_pro'; }
export async function syncEach(sources: SyncSource[], profiles: Pro[], sync: (source: SyncSource, pro: Pro) => Promise<void>, failed: (source: SyncSource, error: string) => Promise<void>) {
  const summary = { checked: 0, updated: 0, failed: [] as { user_id: string; error: string }[] };
  for (const source of sources) {
    const pro = profiles.find(p => p.id === source.user_id);
    if (!pro || !verifiedTourPro(pro)) continue;
    summary.checked++;
    try { await sync(source, pro); summary.updated++; }
    catch (e) {
      let error = e instanceof Error ? e.message : 'Sync failed';
      if (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')) error = 'Timed out';
      summary.failed.push({ user_id: source.user_id, error });
      try { await failed(source, error); } catch { /* keep other pros running, report status-write failure */ console.error('OWGR last_error write failed', source.user_id); }
    }
  }
  return summary;
}
export async function authorized(service: boolean, callerValid: boolean, isAdmin: () => Promise<boolean>): Promise<boolean> {
  return service || (callerValid && await isAdmin());
}