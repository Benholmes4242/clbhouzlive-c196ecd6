import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';
import { BoardDaySeparator, BoardHeaderRow, BoardRowView } from '@/components/explore-tab-new/courseled/BoardRows';
import { BOARD_ROW_METRICS } from '@/components/explore-tab-new/courseled/rowMetrics';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';

const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', ns: ['courses'], resources: { en: { courses } } });

const row = {
  pos: 1, is_tie: false, user_id: 'u1', display_name: 'Member', profile_photo_url: null,
  whs_score_id: 's1', play_date: '2026-09-20', course_id: 'c', course_name: 'Course',
  gross_score: 71, course_par: 72, net_score: null, stableford_points: null, delta_index: null,
  birdies: null, holes_in_one: null, albatrosses: null, eagles: null, clean_card: null, beat_par: null,
  sub_80: null, is_competition: null, hcp_at_time: null, sort_value: null, total_count: 1,
  pool_rounds: 1, pool_courses: 1, pool_members: 1,
} as BoardRow;

const el = (n: React.ReactElement) => render(<I18nextProvider i18n={i18n}>{n}</I18nextProvider>).container.firstElementChild as HTMLElement;

describe('CB20 flush board rows', () => {
  it('padX stays 16', () => expect(BOARD_ROW_METRICS.padX).toBe(16));
  it('row: default keeps 16px sides, flush has 0', () => {
    expect(el(<BoardRowView row={row} board="recent" isSelf={false} />).style.paddingLeft).toBe('16px');
    const f = el(<BoardRowView row={row} board="recent" isSelf={false} flush />);
    expect(f.style.paddingLeft).toBe('0px');
    expect(f.style.paddingRight).toBe('0px');
  });
  it('flush keeps vertical padding', () => {
    const a = el(<BoardRowView row={row} board="recent" isSelf={false} />).style;
    const b = el(<BoardRowView row={row} board="recent" isSelf={false} flush />).style;
    expect(b.paddingTop).toBe(a.paddingTop);
    expect(b.paddingBottom).toBe(a.paddingBottom);
  });
  it('header row: default 16, flush 0', () => {
    expect(el(<BoardHeaderRow board="recent" />).style.paddingLeft).toBe('16px');
    expect(el(<BoardHeaderRow board="recent" flush />).style.paddingLeft).toBe('0px');
  });
  it('day separator: default 16, flush 0', () => {
    expect(el(<BoardDaySeparator label="x" />).style.paddingLeft).toBe('16px');
    expect(el(<BoardDaySeparator label="x" flush />).style.paddingLeft).toBe('0px');
  });
});
