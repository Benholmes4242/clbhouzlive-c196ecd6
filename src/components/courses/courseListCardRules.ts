/** V2 list leads are display-only: server ordering and eligibility stay authoritative.
 * Positions are taken from the full loaded list before name filtering. */
import type { StatBrowseRow, StatLens } from './useStatBrowse';
import { fmtCount, fmtToPar } from './browse/format';

export function courseListLead(lens: StatLens, row: StatBrowseRow) {
  const rounds = { value: fmtCount(row.rounds), label: row.rounds === 1 ? 'round' : 'rounds', tone: 'ink' };
  switch (lens) {
    case 'rated':
      return row.community_rating == null ? rounds : { value: row.community_rating.toFixed(1), label: `from ${fmtCount(row.review_count)} ${row.review_count === 1 ? 'rating' : 'ratings'}`, tone: 'ink' };
    case 'toughest':
    case 'scoreable': {
      const par = fmtToPar(row.avg_to_par);
      return par == null ? rounds : { value: par === 'level' ? 'Level' : par, label: 'on average', tone: par.startsWith('−') ? 'under' : 'ink' };
    }
    case 'lowest':
      return row.course_record == null ? rounds : { value: String(row.course_record), label: 'course record', tone: 'record' };
    case 'longest':
      return row.total_yards == null ? rounds : { value: fmtCount(row.total_yards), label: 'yards', tone: 'ink' };
    case 'chase':
      return row.open_crowns == null ? rounds : { value: fmtCount(row.open_crowns), label: 'open crowns', tone: 'ink' };
    default: return rounds;
  }
}

export const courseListPositions = (rows: readonly StatBrowseRow[]) =>
  new Map(rows.map((row, index) => [row.course_id, index + 1]));