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
import { RoundPagePreview } from '@/features/courses/_shared/scorecard/RoundPagePreview';
import { ReviewBottomSheet } from '@/components/posts/ReviewBottomSheet';

const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { courses } }, interpolation: { escapeValue: false } });
function mount(node: React.ReactNode) {
  return render(<MemoryRouter><I18nextProvider i18n={i18n}>{node}</I18nextProvider></MemoryRouter>);
}
const round = { open: true, onClose: vi.fn(), eyebrowText: '', courseName: 'Course', playerName: 'Christopher Montgomerie-Smith', playerUserId: 'member', holes: [], presentation: 'page' as const };
const review = { isOpen: true, onClose: vi.fn(), courseId: 'course', courseName: 'Course', user: { id: 'member', name: 'Christopher Montgomerie-Smith' }, resolvedMedia: [], resolvedReviewText: 'Review' };
afterEach(cleanup);

describe('CB61 player-row doors', () => {
  it('member scorecard doors stay in the player row and retain their handlers', () => {
    const course = vi.fn(); const profile = vi.fn();
    mount(<CardScorecardSheet {...round} onViewCourse={course} onViewProfile={profile} />);
    const row = document.querySelector('[data-scorecard-player-row]');
    const doors = row?.querySelectorAll('[data-sheet-door]');
    expect(Array.from(doors ?? []).map(n => n.getAttribute('data-sheet-door'))).toEqual(['course', 'profile']);
    for (const door of doors ?? []) fireEvent.click(door);
    expect(course).toHaveBeenCalledOnce(); expect(profile).toHaveBeenCalledOnce();
  });
  it('member scorecard omits Course when its handler is absent', () => {
    mount(<CardScorecardSheet {...round} onViewProfile={vi.fn()} />);
    expect(document.querySelector('[data-sheet-door="course"]')).toBeNull();
    expect(document.querySelector('[data-sheet-door="profile"]')).not.toBeNull();
  });
  it('member scorecard has no exit container or interactive foot without Share', () => {
    mount(<CardScorecardSheet {...round} onViewCourse={vi.fn()} onViewProfile={vi.fn()} />);
    expect(document.querySelector('[data-scorecard-exit-links]')).toBeNull();
    expect(document.querySelector('[data-scorecard-interactive]')).toBeNull();
  });
  it('member scorecard foot retains only Share and its original handler', () => {
    const share = vi.fn();
    mount(<CardScorecardSheet {...round} onViewCourse={vi.fn()} onViewProfile={vi.fn()} onShareRound={share} />);
    const foot = document.querySelector('[data-scorecard-exit-links]');
    const buttons = foot?.querySelectorAll('button');
    expect(buttons?.length).toBe(1);
    expect(foot?.querySelector('[data-sheet-door]')).toBeNull();
    for (const button of buttons ?? []) fireEvent.click(button);
    expect(share).toHaveBeenCalledOnce();
  });
  it('tour retains its existing foot doors and does not gain player-row doors', () => {
    mount(<CardScorecardSheet {...round} surface="tour" onViewCourse={vi.fn()} onViewProfile={vi.fn()} />);
    expect(document.querySelector('[data-scorecard-exit-links]')?.querySelectorAll('button').length).toBe(2);
    expect(document.querySelector('[data-sheet-door]')).toBeNull();
  });
  it('review doors render in the player row with no foot actions', () => {
    mount(<ReviewBottomSheet {...review} />);
    const row = document.querySelector('[data-review-player-row]');
    expect(Array.from(row?.querySelectorAll('[data-sheet-door]') ?? []).map(n => n.getAttribute('data-sheet-door'))).toEqual(['course', 'profile']);
    expect(document.querySelector('[data-review-foot-actions]')).toBeNull();
  });
  it('review omits Course entirely without a course id', () => {
    mount(<ReviewBottomSheet {...review} courseId={undefined} />);
    expect(document.querySelector('[data-sheet-door="course"]')).toBeNull();
    expect(document.querySelector('[data-sheet-door="profile"]')).not.toBeNull();
  });
  it('review omits Profile entirely without a user id', () => {
    mount(<ReviewBottomSheet {...review} user={{ name: 'Member' }} />);
    expect(document.querySelector('[data-sheet-door="profile"]')).toBeNull();
    expect(document.querySelector('[data-sheet-door="course"]')).not.toBeNull();
  });
  it('swipe preview doors are aria-hidden spans without handlers or focus targets', () => {
    mount(<RoundPagePreview seed={{ scoreId: 'round', courseName: 'Course', playerName: round.playerName, gross: 78, toPar: 6, holes: [] }} />);
    const preview = document.querySelector('[data-round-page-preview]');
    const doors = preview?.querySelectorAll('[data-sheet-door]');
    expect(doors?.length).toBe(2);
    for (const door of doors ?? []) {
      expect(door.tagName).toBe('SPAN');
      expect(door.getAttribute('aria-hidden')).toBe('true');
      expect(door.hasAttribute('tabindex')).toBe(false);
      expect(door.hasAttribute('onclick')).toBe(false);
    }
    expect(preview?.querySelector('button, a, [tabindex]')).toBeNull();
  });
});