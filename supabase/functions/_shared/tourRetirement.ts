/** Single retirement policy shared by the UI registry and function dispatch.
 * Historical parsers retain support; only active execution is refused. */
export const RETIRED_TOURS = { liv: true } as const;
export function isRetiredTourName(value: string | null | undefined): boolean {
  const name = (value ?? '').toLowerCase().trim();
  return Object.keys(RETIRED_TOURS).some(slug => name === slug || name === `${slug} golf` || name === `${slug}-golf` || name === `${slug}pts`);
}
export function activeSyncTours<T extends string>(tours: readonly T[]): T[] {
  return tours.filter(tour => !isRetiredTourName(tour));
}
export async function activeTournamentRows<T extends { season_id: string }>(supabase: any, rows: T[]): Promise<T[]> {
  if (!rows.length) return rows;
  const ids = [...new Set(rows.map(row => row.season_id).filter(Boolean))];
  const { data, error } = await supabase.from('sr_seasons').select('id,tour_name').in('id', ids);
  if (error) throw error;
  const retiredIds = new Set((data ?? []).filter((row: any) => isRetiredTourName(row.tour_name)).map((row: any) => row.id));
  return rows.filter(row => !retiredIds.has(row.season_id));
}