/** COURSE_PAGE honours board — pure rules. The RPC owns order and filtering. */
export interface CourseHonour {
  kind: 'ace' | 'albatross';
  whs_score_id: string;
  user_id: string;
  display_name: string;
  play_date: string;
  hole_no: number;
  par: number;
  strokes: number;
  yards: number | null;
  is_competition: boolean;
}

export const HONOURS_PAGE = 4;

/** "1st" / "2nd" / "3rd" / "11th" / "13th" / "21st". */
export function holeOrdinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

/** "14 Aug 2026". */
export function honourDate(iso: string, locale = 'en'): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return '';
  const month = d.toLocaleDateString(locale, { month: 'short' });
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

export function honourPages<T>(rows: readonly T[], size = HONOURS_PAGE): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < rows.length; i += size) pages.push(rows.slice(i, i + size));
  return pages;
}
