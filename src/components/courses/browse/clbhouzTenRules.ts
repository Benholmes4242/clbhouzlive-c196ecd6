/** Brief 32: server owns chart ranking/story; these rules only govern presentation. */
export type ChartCohort = 'everyone' | 'pros';
export interface ChartRow {
  rank: number; course_id: string; name: string; region: string | null;
  sub_country: string | null; country: string | null; thumbnail_image: string | null;
  points: number; tens: number; number_ones: number;
  movement: 'up' | 'down' | 'same' | 'new' | 're' | null; delta: number | null;
  story: string | null; weeks_on_chart: number; weeks_at_one: number; best_rank: number;
}
export interface TenChart { week_start: string; cohort: ChartCohort; everyone_voters: number; pros_voters: number; rows: ChartRow[] }
export function chartCardSize(containerWidth: number) {
  const width = Math.floor(0.74 * (containerWidth - 32));
  return { width, height: Math.floor(1.22 * width) };
}
export const chartVisible = (chart?: TenChart | null) => (chart?.rows.length ?? 0) >= 3;
export const prosEligible = (everyone?: TenChart | null, pros?: TenChart | null) => (everyone?.pros_voters ?? 0) >= 5 && chartVisible(pros);
export function movementLabel(row: Pick<ChartRow, 'movement' | 'delta'>, sheet = false): string | null {
  switch (row.movement) {
    case 'up': return `▲${Math.abs(row.delta ?? 0)}`;
    case 'down': return `▼${Math.abs(row.delta ?? 0)}`;
    case 'same': return sheet ? '–' : 'NO CHANGE';
    case 'new': return 'NEW';
    case 're': return 'RE';
    default: return null;
  }
}
export function chartPlace(row: ChartRow) { return [row.region, row.sub_country || row.country].filter(Boolean).join(' · '); }
