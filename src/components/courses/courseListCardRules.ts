/** V2 list leads are display-only: server ordering and eligibility stay authoritative.
 * Positions are taken from the full loaded list before name filtering. */
import type { StatBrowseRow, StatLens } from './useStatBrowse';
import { fmtCount, fmtToPar } from './browse/format';

export function courseListLead(lens: StatLens, row: StatBrowseRow, fallbackToRounds?: true): { value: string; label: string; tone: string };
export function courseListLead(lens: StatLens, row: StatBrowseRow, fallbackToRounds: false): { value: string; label: string; tone: string } | null;
export function courseListLead(lens: StatLens, row: StatBrowseRow, fallbackToRounds = true) {
  const rounds = { value: fmtCount(row.rounds), label: row.rounds === 1 ? 'round' : 'rounds', tone: 'ink' };
  const missing = fallbackToRounds ? rounds : null;
  switch (lens) {
    case 'rated':
      return row.community_rating == null ? missing : { value: row.community_rating.toFixed(1), label: `from ${fmtCount(row.review_count)} ${row.review_count === 1 ? 'rating' : 'ratings'}`, tone: 'ink' };
    case 'toughest':
    case 'scoreable': {
      const par = fmtToPar(row.avg_to_par);
      return par == null ? missing : { value: par === 'level' ? 'Level' : par, label: 'on average', tone: par.startsWith('−') ? 'under' : 'ink' };
    }
    case 'lowest':
      return row.course_record == null ? missing : { value: String(row.course_record), label: 'course record', tone: 'record' };
    case 'longest':
      return row.total_yards == null ? missing : { value: fmtCount(row.total_yards), label: 'yards', tone: 'ink' };
    case 'chase':
      return row.open_crowns == null ? missing : { value: fmtCount(row.open_crowns), label: 'open crowns', tone: 'ink' };
    default: return rounds;
  }
}

export const courseListPositions = (rows: readonly StatBrowseRow[]) =>
  new Map(rows.map((row, index) => [row.course_id, index + 1]));
export const courseListColumnLabel = (lens: StatLens) => ({ played:'ROUNDS', rated:'RATING', toughest:'AVG', scoreable:'AVG', lowest:'RECORD', longest:'YARDS', chase:'CROWNS' }[lens]);
