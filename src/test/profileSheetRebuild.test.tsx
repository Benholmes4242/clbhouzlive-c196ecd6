import { describe, it, expect } from 'vitest';
import { formBars, handicapSentence, isSyncFailing } from '@/features/profile-sheet-v2/sheetState';

describe('retained shared handicap readers', () => {
  it('form uses differential minus index played off, excludes nine-hole, oldest first', () => {
    const out = formBars([
      { id: 'n', play_date: '2026-10-01', handicap_differential: 1, handicap_index_at_time: 2, is_nine_hole: true },
      { id: 'b', play_date: '2026-09-20', handicap_differential: 3.5, handicap_index_at_time: 1.4, is_nine_hole: false },
      { id: 'a', play_date: '2026-09-10', handicap_differential: 0.5, handicap_index_at_time: 1.4, is_nine_hole: false },
    ]);
    expect(out.map((b) => [b.id, b.value])).toEqual([['a', -0.9], ['b', 2.1]]);
  });
  it('handicap sentence drops the high clause when the series has no high above now', () => {
    const rising = [{ t: '2026-08-01', v: 1.0 }, { t: '2026-09-01', v: 1.4 }];
    const text = handicapSentence(rising, 90)!.map((s) => s.text).join('');
    expect(text.startsWith('Up 0.4 in ninety days.')).toBe(true);
    expect(text).not.toContain('high');
    expect(handicapSentence([{ t: '2026-08-01', v: 1 }], 90)).toBeNull();
  });
  it('V.3 sync failure matches the written statuses exactly', () => {
    expect(isSyncFailing({ provider: 'england_golf', last_sync_status: 'timeout' })).toBe(true);
    expect(isSyncFailing({ provider: 'england_golf', last_sync_status: 'partial' })).toBe(false);
    expect(isSyncFailing({ provider: 'england_golf', last_sync_status: 'ok' })).toBe(false);
  });
});
