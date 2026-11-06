import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import en from '../../public/locales/en/courses.json';
import { courseHeadline } from '@/features/explore-magazine/courseHeadline';
import { RecordBookSection } from '@/features/business/clubAnalytics/sections';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const t = ((_k: string, d: string, o?: Record<string, unknown>) =>
  d.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n] ?? ''))) as never;

describe('RC2_WORDING course record', () => {
  it('named record headline', () => {
    expect(courseHeadline(t, { event: 'record', lowGross: 68, lowBy: 'Ann' } as never)).toBe('Course record — Ann shot 68 here.');
  });
  it('joint record headline', () => {
    expect(courseHeadline(t, { event: 'record', lowGross: 68, lowBy: null } as never)).toBe('Course record — 68.');
  });
  it('club analytics record row', () => {
    render(<RecordBookSection data={{ record_book: { lowest_gross: { value: 69, attained_at: null } } } as never} />);
    expect(screen.getByText('Course record')).toBeTruthy();
  });
  it('English locale values match', () => {
    const a = (en as any).amateur;
    expect(a.shelf.recordReason.courseRecordHolder).toBe('Course record here');
    expect(a.stream.callout.courseRecord).toBe('Course record');
  });
});
