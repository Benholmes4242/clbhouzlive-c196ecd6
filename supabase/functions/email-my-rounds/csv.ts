/** ST5 export format lives beside its only function; pure for regression tests. */
export interface ExportRound {
  play_date: string | null; course: string | null; country: string | null;
  holes_played: number | null; course_rating: number | null; slope_rating: number | null;
  course_handicap: number | null; index_at_time: number | null; gross: number | null;
  adjusted_gross: number | null; net: number | null; stableford: number | null;
  differential: number | null; counted: boolean | null; competition: boolean | null;
  hole_scores: unknown;
}
export const CSV_HEADERS = ['Date', 'Course', 'Country', 'Holes', 'Par', 'Course rating', 'Slope', 'Course handicap', 'Index at the time', 'Gross', 'Adjusted gross', 'Net', 'Stableford', 'Differential', 'Counting round', 'Competition', ...Array.from({ length: 18 }, (_, i) => `H${i + 1}`)];
function cell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
export function roundsCsv(rounds: ExportRound[]): string {
  const rows = [...rounds].sort((a, b) => (b.play_date ?? '').localeCompare(a.play_date ?? '')).map(r => {
    const holes = Array.isArray(r.hole_scores) ? r.hole_scores.filter((h): h is { hole: number; par?: number | null; score?: number | null } => !!h && typeof h === 'object' && Number.isInteger(h.hole) && h.hole >= 1 && h.hole <= 18) : [];
    const pars = holes.map(h => h.par).filter((p): p is number => typeof p === 'number' && Number.isFinite(p));
    return [r.play_date, r.course, r.country, r.holes_played, pars.length ? pars.reduce((a, b) => a + b, 0) : null, r.course_rating, r.slope_rating, r.course_handicap, r.index_at_time, r.gross, r.adjusted_gross, r.net, r.stableford, r.differential, r.counted ? 'Yes' : 'No', r.competition ? 'Yes' : 'No', ...Array.from({ length: 18 }, (_, i) => holes.find(h => h.hole === i + 1)?.score ?? null)].map(cell).join(',');
  });
  return '\uFEFF' + [CSV_HEADERS.join(','), ...rows].join('\r\n') + '\r\n';
}
export function roundsFilename(date: Date): string { return `clbhouz-rounds-${date.toISOString().slice(0, 10)}.csv`; }
export function utf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
export function sentRecently(requestedAt: string, now: Date): boolean {
  return new Date(requestedAt).getTime() >= now.getTime() - 10 * 60 * 1000;
}