import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '../../src/locales/en/courses.json';

vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/components/posts/useReviewMedia', () => ({ useReviewMedia: () => ({ data: [] }) }));
vi.mock('@/components/posts/useReviewPost', () => ({ useReviewPost: () => ({ data: undefined }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null }) }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('@/features/courses/_shared/scorecard/ScorecardGlassOverlay', () => ({ ScorecardGlassOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { CardScorecardSheet } from '@/features/courses/_shared/scorecard/CardScorecardSheet';

const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { courses } }, interpolation: { escapeValue: false } });
function mount(node: React.ReactNode) {
  return render(<MemoryRouter><I18nextProvider i18n={i18n}>{node}</I18nextProvider></MemoryRouter>);
}
const tour = {
  open: true, onClose: vi.fn(), eyebrowText: 'ROUND 1', courseName: 'Vidanta Vallarta',
  courseLocation: 'Vallarta', playerName: 'Kris Ventura', playerUserId: 'player-1',
  holes: [], presentation: 'page' as const, surface: 'tour' as const,
};
afterEach(cleanup);

describe('Tour scorecard profile door', () => {
  it('the player row is the profile door and opens the profile (no pill)', () => {
    const profile = vi.fn();
    mount(<CardScorecardSheet {...tour} onViewProfile={profile} />);
    const row = document.querySelector('button[data-scorecard-player-row]');
    expect(row?.textContent).toContain('Kris Ventura');
    expect(document.querySelector('[data-sheet-door]')).toBeNull();
    fireEvent.click(row as Element);
    expect(profile).toHaveBeenCalledOnce();
  });

  it('the player row is not a button when no profile handler is passed', () => {
    mount(<CardScorecardSheet {...tour} />);
    expect(document.querySelector('button[data-scorecard-player-row]')).toBeNull();
    expect(document.querySelector('[data-scorecard-player-row]')).not.toBeNull();
  });

  it('a course handler makes the course name the course door, above the player row', () => {
    const course = vi.fn(); const profile = vi.fn();
    mount(<CardScorecardSheet {...tour} onViewCourse={course} onViewProfile={profile} />);
    const name = document.querySelector('button[data-scorecard-course-name]')!;
    const row = document.querySelector('button[data-scorecard-player-row]')!;
    expect(name.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(name); fireEvent.click(row);
    expect(course).toHaveBeenCalledOnce(); expect(profile).toHaveBeenCalledOnce();
  });

  it('renders no foot block when there is no engagement or Share', () => {
    mount(<CardScorecardSheet {...tour} onViewProfile={vi.fn()} />);
    expect(document.querySelector('[data-scorecard-exit-links]')).toBeNull();
    expect(document.querySelector('[data-scorecard-interactive]')).toBeNull();
  });

  it('keeps Share in the one-row footer when passed', () => {
    const share = vi.fn();
    mount(<CardScorecardSheet {...tour} onViewProfile={vi.fn()} onShareRound={share} />);
    const foot = document.querySelector('[data-scorecard-footer]');
    expect(foot?.querySelectorAll('button').length).toBe(1);
    fireEvent.click(foot!.querySelector('[data-scorecard-share]')!);
    expect(share).toHaveBeenCalledOnce();
  });
});

describe('Tour scorecard player row', () => {
  it('the player row follows the course name in the head and ends with the chevron', () => {
    mount(<CardScorecardSheet {...tour} onViewProfile={vi.fn()} />);
    const head = document.querySelector('[data-scorecard-head]')!;
    const row = head.querySelector('[data-scorecard-player-row]') as HTMLElement;
    expect(row).not.toBeNull();
    expect(row.lastElementChild?.getAttribute('data-scorecard-player-chevron')).toBe('true');
  });

  it('a long name truncates with an ellipsis and keeps the chevron last', () => {
    mount(<CardScorecardSheet {...tour} playerName={'A'.repeat(160)} onViewProfile={vi.fn()} />);
    const row = document.querySelector('[data-scorecard-player-row]') as HTMLElement;
    const name = row.querySelector('[data-sheet-player-name]') as HTMLElement;
    expect(name.style.overflow).toBe('hidden');
    expect(name.style.whiteSpace).toBe('nowrap');
    expect(name.style.textOverflow).toBe('ellipsis');
    expect(row.lastElementChild?.getAttribute('data-scorecard-player-chevron')).toBe('true');
  });
});
