/** OWGR publishes Monday: currentOWGRRank belongs only to this run's UTC
 * Monday, lastOWGRRank only to the preceding Monday if absent. Never use
 * fetch dates, event weekDate or inferred event dates as ranking dates.
 * Gross resultScores are NOT to-par: absent par means no round writes.
 */
type RecordValue = Record<string, unknown>;
const object = (v: unknown): RecordValue | null => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as RecordValue : null;
const positive = (v: unknown): number | null => typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null;
const finite = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;
export function mondayDates(now: Date) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  const current = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() - 7);
  return { current, previous: date.toISOString().slice(0, 10) };
}
export function parseRank(input: unknown, playerId: number) {
  let data = input;
  if (typeof data === 'string') {
    const match = data.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (!match) throw new Error('Page layout changed');
    try { data = JSON.parse(match[1]); } catch { throw new Error('Page layout changed'); }
  }
  const root = object(data);
  const props = object(object(root?.props)?.pageProps);
  const payload = object(object(props?.playerProfileData)?.playerProfileData) ?? root;
  if (!payload || object(payload.player)?.id !== playerId || !Object.prototype.hasOwnProperty.call(payload, 'currentOWGRRank')) throw new Error('Page layout changed');
  const rank = positive(payload.currentOWGRRank);
  if (!rank) {
    if (payload.currentOWGRRank === null || payload.currentOWGRRank === 0) throw new Error('Not ranked');
    throw new Error('Page layout changed');
  }
  return { rank, priorRank: positive(payload.lastOWGRRank), points: finite(payload.pointsTotal) };
}
export function normalizeFinish(value: unknown): string {
  const text = String(value ?? '').trim().toUpperCase();
  if (/^(?:MC|WD|DQ|T?[1-9]\d*)$/.test(text)) return text;
  throw new Error('Page layout changed');
}
export function parseEvents(input: unknown) {
  if (!Array.isArray(input)) throw new Error('Page layout changed');
  return input.map(value => {
    const row = object(value);
    if (!row || !positive(row.id) || !positive(row.year) || !positive(row.week) || Number(row.week) > 53 || typeof row.event !== 'string' || !row.event.trim()) throw new Error('Page layout changed');
    return { owgr_event_id: String(row.id), event_name: row.event, start_date: null as string | null, end_date: null as string | null,
      venue: null as string | null, country: null as string | null, to_par: null as number | null,
      tour_name: Array.isArray(row.tours) ? row.tours.map(t => object(t)?.name).filter(t => typeof t === 'string').join(' / ') || null : null,
      finish: normalizeFinish(row.finish), owgr_points: finite(row.rankPoints), owgr_year: Number(row.year), owgr_week: Number(row.week),
      owgr_rank_before: positive(row.rankBefore), owgr_rank_after: positive(row.rankAfter), rounds: [] as { round_no: number; to_par: number }[] };
  });
}
function actualDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) return null;
  return value.slice(0, 10);
}
export function parseEventDetails(input: unknown, eventId: string, playerId: number) {
  const row = object(input);
  if (!row || String(row.id) !== eventId || !Array.isArray(row.results)) throw new Error('Event layout changed');
  const result = row.results.map(object).find(r => r?.playerId === playerId);
  const grossRounds = Array.isArray(result?.resultScores) ? result.resultScores.flatMap(v => {
    const score = object(v); const round = positive(score?.roundNumber); const gross = finite(score?.score);
    return round && gross !== null ? [{ round_no: round, gross }] : [];
  }) : [];
  return { start_date: actualDate(row.startDate), end_date: actualDate(row.endDate), country: typeof object(row.country)?.name === 'string' ? String(object(row.country)?.name) : null,
    venue: null, to_par: null, rounds: [] as { round_no: number; to_par: number }[], grossRounds };
}