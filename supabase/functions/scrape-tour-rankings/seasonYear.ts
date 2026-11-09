/** Server mirror of src/features/tourhub/_shared/currentSeason.ts.
 * Stroke/team events only; source season year wins, never a November rollover.
 */
export interface SeasonYearEvent {
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  event_type: string | null;
  season: { year: number | null } | null;
}

export function pickSeasonYear(rows: SeasonYearEvent[], today: string): number | null {
  const eligible = rows.filter((r) => r.season && r.end_date &&
    ['stroke', 'team'].includes(r.event_type ?? '') &&
    !['cancelled', 'canceled'].includes((r.status ?? '').toLowerCase()));
  const pending = eligible.filter((r) => (r.end_date ?? '') >= today)
    .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '') || (a.end_date ?? '').localeCompare(b.end_date ?? ''));
  const last = eligible.filter((r) => (r.end_date ?? '') < today)
    .sort((a, b) => (b.end_date ?? '').localeCompare(a.end_date ?? ''));
  return (pending[0] ?? last[0])?.season?.year ?? null;
}