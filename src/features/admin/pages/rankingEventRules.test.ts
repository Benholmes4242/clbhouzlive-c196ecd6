import { describe, expect, it } from 'vitest';
import {
  headerSummary,
  inFilter,
  playedSentence,
  reasonLine,
  type RankingEventRuleRow,
  type RankingEventStatus,
} from './rankingEventRules';

const row = (status: RankingEventStatus): Pick<RankingEventRuleRow, 'status'> => ({ status });

describe('rankingEventRules', () => {
  it('summarises the header in the signed-off status order', () => {
    const rows = [
      ...Array.from({ length: 9 }, () => row('auto')),
      row('ambiguous'),
      ...Array.from({ length: 15 }, () => row('unmatched')),
    ];
    expect(headerSummary(rows)).toBe('25 events · 9 matched automatically · 1 several matches · 15 unmatched');
  });

  it('uses the singular event count', () => {
    expect(headerSummary([row('manual')])).toBe('1 event · 1 matched');
  });

  it("renders Mason's two Lacanau rows oldest first", () => {
    expect(playedSentence([
      { pro: 'Mason Essam', date: '2025-05-25', finish: 'MC' },
      { pro: 'Mason Essam', date: '2026-05-24', finish: 'T26' },
    ])).toBe('Played 25 May 2025 and 24 May 2026. Pros: Mason Essam (MC, T26).');
  });

  it('uses a count word for an ambiguous row', () => {
    expect(reasonLine({ status: 'ambiguous', candidate_count: 2, course_name: null }))
      .toBe("Two courses fit, so it wasn't matched automatically.");
  });

  it('covers all three filters', () => {
    const statuses: RankingEventStatus[] = ['auto', 'manual', 'ambiguous', 'unmatched', 'no_course'];
    expect(statuses.filter((status) => inFilter(status, 'review'))).toEqual(['ambiguous', 'unmatched']);
    expect(statuses.filter((status) => inFilter(status, 'matched'))).toEqual(['auto', 'manual', 'no_course']);
    expect(statuses.filter((status) => inFilter(status, 'all'))).toEqual(statuses);
  });
});
