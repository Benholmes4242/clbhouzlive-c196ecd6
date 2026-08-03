/** Date and number formatting for the career record. */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/** "AUG 2025" -- month precision is all the record needs. */
export function monthYear(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '';
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "14 AUG 2025" for an evidence round. */
export function dayMonthYear(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function yearOf(iso: string | null | undefined): number | null {
  const d = parse(iso);
  return d ? d.getFullYear() : null;
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
