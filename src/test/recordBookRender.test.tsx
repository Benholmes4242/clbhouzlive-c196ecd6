import { describe, it, vi, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import React from 'react';

vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'me' } }),
}));
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: (p: { children?: unknown }) => p.children ?? null,
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'courseDetail.records.kicker': 'THE RECORD BOOK',
        'courseDetail.records.you': 'You',
        'courseDetail.records.youHold': 'You hold this board',
        'courseDetail.records.youValue': `You ${o?.value}`,
        'courseDetail.records.youBehind': `${o?.gap} behind`,
        'courseDetail.records.youAhead': 'Level with the board',
        'courseDetail.records.youRankOf': `${o?.rank}${o?.suffix} of ${o?.count}`,
        'courseDetail.records.seeAllUnclaimed': `See all boards - ${o?.count} unclaimed`,
        'courseDetail.records.units.gross': 'Gross',
        'courseDetail.records.units.rounds': 'Rounds',
        'courseDetail.records.units.birdies': 'Birdies',
        'courseDetail.records.units.points': 'Points',
        'courseDetail.records.units.diff': 'Diff',
      };
      return map[k] ?? k;
    },
  }),
}));

const mk = (cat: string, uid: string, name: string, value: number, rank = 1, total = 12) => ({
  category: cat,
  rank,
  user_id: uid,
  user_display_name: name,
  user_photo_url: null,
  user_home_club: null,
  value,
  attained_at: new Date().toISOString(),
  is_self: uid === 'me',
  total_count_in_category: total,
});

vi.mock('./useCourseRecordSummaryStub', () => ({}));

vi.mock('@/components/courses/course-detail/useCourseRecordSummary', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    useCourseRecordSummary: () => ({
      isLoading: false,
      holders: new Map(),
      courseRecord: null,
      unclaimedCount: 3,
      hasAnyHolder: true,
      previewRows: [
        { category: 'lowest_gross_all_time', row: mk('lowest_gross_all_time', 'x', 'A. Palmer', 65) },
        { category: 'most_rounds_all_time', row: mk('most_rounds_all_time', 'me', 'Me', 41) },
        { category: 'most_birdies_all_time', row: mk('most_birdies_all_time', 'y', 'J. Rose', 9) },
        { category: 'best_stableford_all_time', row: mk('best_stableford_all_time', 'z', 'K. Lowry', 42) },
      ],
      viewerByCategory: new Map([
        ['lowest_gross_all_time', { row: mk('lowest_gross_all_time', 'me', 'Me', 71, 4, 12), gap: '6', behind: true }],
        ['most_birdies_all_time', { row: mk('most_birdies_all_time', 'me', 'Me', 5, 3, 7), gap: '4', behind: true }],
        // best_stableford: viewer has NO entry -> no track, no gap line
      ]),
    }),
  };
});

describe('record book', () => {
  it('renders', async () => {
    const { CourseRecordBook } = await import('@/components/courses/course-detail/CourseRecordBook');
    const html = renderToStaticMarkup(
      React.createElement('div', { style: { width: 390, background: '#F8FAFC', padding: 12 } },
        React.createElement(CourseRecordBook, { courseId: 'c', courseName: 'Test GC' })),
    );
    fs.writeFileSync('/tmp/browser/recordbook/out.html', `<html><body style="margin:0;font-family:-apple-system,system-ui">${html}</body></html>`);
    expect(html).toContain('You hold this board');
  });
});
