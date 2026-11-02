import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';

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
  it('renders the profile door in the identity row and opens the profile', () => {
    const profile = vi.fn();
    mount(<CardScorecardSheet {...tour} onViewProfile={profile} />);
    const door = document.querySelector('[data-sheet-door="profile"]');
    expect(door).not.toBeNull();
    // The door sits in the player identity row, beside the player name.
    const row = door?.closest('div');
    expect(row?.textContent).toContain('Kris Ventura');
    expect(document.querySelector('[data-scorecard-player-row]')).toBeNull();
    fireEvent.click(door as Element);
    expect(profile).toHaveBeenCalledOnce();
  });

  it('omits the profile door when no profile handler is passed', () => {
    mount(<CardScorecardSheet {...tour} />);
    expect(document.querySelector('[data-sheet-door]')).toBeNull();
  });

  it('a course door, when passed, sits beside Profile in the row, course first', () => {
    const course = vi.fn(); const profile = vi.fn();
    mount(<CardScorecardSheet {...tour} onViewCourse={course} onViewProfile={profile} />);
    const doors = document.querySelectorAll('[data-sheet-door]');
    expect(Array.from(doors).map(n => n.getAttribute('data-sheet-door'))).toEqual(['course', 'profile']);
    for (const door of doors) fireEvent.click(door);
    expect(course).toHaveBeenCalledOnce(); expect(profile).toHaveBeenCalledOnce();
  });

  it('renders no foot block when there is no engagement or Share', () => {
    mount(<CardScorecardSheet {...tour} onViewProfile={vi.fn()} />);
    expect(document.querySelector('[data-scorecard-exit-links]')).toBeNull();
    expect(document.querySelector('[data-scorecard-interactive]')).toBeNull();
  });

  it('keeps Share in its foot slot, alone, when passed', () => {
    const share = vi.fn();
    mount(<CardScorecardSheet {...tour} onViewProfile={vi.fn()} onShareRound={share} />);
    const foot = document.querySelector('[data-scorecard-exit-links]');
    const buttons = foot?.querySelectorAll('button');
    expect(buttons?.length).toBe(1);
    expect(foot?.querySelector('[data-sheet-door]')).toBeNull();
    for (const button of buttons ?? []) fireEvent.click(button);
    expect(share).toHaveBeenCalledOnce();
  });
});

describe('Tour scorecard doors at the right edge', () => {
  it('the doors are the last children of the identity row and the name takes the remaining width', () => {
    mount(<CardScorecardSheet {...tour} onViewProfile={vi.fn()} />);
    const doors = document.querySelector('[data-sheet-doors]') as HTMLElement;
    expect(doors).not.toBeNull();
    const row = doors.parentElement as HTMLElement;
    expect(row.lastElementChild).toBe(doors);
    const nameSpan = row.querySelector('span[title]') as HTMLElement;
    expect(nameSpan.style.flex).toBe('1 1 auto');
    expect(nameSpan.style.minWidth).toBe('0px');
    expect(nameSpan.style.textOverflow).toBe('ellipsis');
  });

  it('a long name truncates without moving or wrapping the doors', () => {
    mount(<CardScorecardSheet {...tour} playerName={'A'.repeat(160)} onViewProfile={vi.fn()} />);
    const doors = document.querySelector('[data-sheet-doors]') as HTMLElement;
    expect(doors).not.toBeNull();
    const row = doors.parentElement as HTMLElement;
    expect(row.lastElementChild).toBe(doors);
    const nameSpan = row.querySelector('span[title]') as HTMLElement;
    expect(nameSpan.style.overflow).toBe('hidden');
    expect(nameSpan.style.whiteSpace).toBe('nowrap');
    expect(nameSpan.style.textOverflow).toBe('ellipsis');
    expect(doors.style.flex).toBe('none');
    expect(doors.style.marginLeft).toBe('10px');
  });
});
