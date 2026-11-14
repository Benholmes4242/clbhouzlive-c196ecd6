/** Shared Settings-only date/copy rules; no ranking source is invented. */
export function rankingUpdated(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return 'first update on its way';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return 'first update on its way';
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const age = Math.floor((day(now) - day(date)) / 86400000);
  if (age === 0) return 'updated today';
  if (age > 0 && age <= 6) return `updated ${date.toLocaleDateString('en-GB', { weekday: 'long' })}`;
  return `updated ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}
export function wagrOrdinal(rank: number | null | undefined): string {
  if (rank == null) return '–';
  const suffix = rank % 100 >= 11 && rank % 100 <= 13 ? 'th' : rank % 10 === 1 ? 'st' : rank % 10 === 2 ? 'nd' : rank % 10 === 3 ? 'rd' : 'th';
  return `${rank}${suffix}`;
}
export const wagrCardVisible = (pro: { unknown: boolean; verified: boolean; pending: boolean }) => !pro.unknown && !pro.verified && !pro.pending;
export const tourResultsVisible = (pro: { unknown: boolean; verified: boolean; kind: string | null }) => !pro.unknown && pro.verified && pro.kind === 'tour_pro';
export type WagrLookup = { name: string; country: string | null; rank: number | null; isPro: boolean; slug: string; playerId: number };
export const WAGR_UNAVAILABLE = "We couldn't reach WAGR just now. Try again in a minute.";
export function wagrError(code?: string): string {
  return ({ not_a_wagr_link: "That doesn't look like a WAGR profile link.", already_linked: "You've already linked a WAGR profile.", claimed_by_another: "Another member has already linked that profile. If it's yours, contact us.", caller_is_pro: "Pros can't link a WAGR profile.", wagr_profile_is_pro: 'That WAGR profile is marked as a professional.' } as Record<string, string>)[code ?? ''] ?? WAGR_UNAVAILABLE;
}
export async function invokeWagrError(error: unknown, data?: { code?: string; error?: string } | null): Promise<string> {
  let code = data?.code ?? data?.error;
  const context = (error as { context?: Response } | null)?.context;
  if (context?.json) { try { const body = await context.clone().json(); code = body.code ?? body.error; } catch { /* generic error */ } }
  return wagrError(code);
}