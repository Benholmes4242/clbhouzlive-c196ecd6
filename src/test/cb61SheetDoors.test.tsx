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
import { RoundPagePreview } from '@/features/courses/_shared/scorecard/RoundPagePreview';

const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { courses } }, interpolation: { escapeValue: false } });
function mount(node: React.ReactNode) {
  return render(<MemoryRouter><I18nextProvider i18n={i18n}>{node}</I18nextProvider></MemoryRouter>);
}
const round = { open: true, onClose: vi.fn(), eyebrowText: '', courseName: 'Course', playerName: 'Christopher Montgomerie-Smith', playerUserId: 'member', holes: [], presentation: 'page' as const };
afterEach(cleanup);

describe('CB61 player-row doors', () => {
  it('member scorecard: course name and player row are the doors (no pills) and retain their handlers', () => {
    const course = vi.fn(); const profile = vi.fn();
    mount(<CardScorecardSheet {...round} onViewCourse={course} onViewProfile={profile} />);
    expect(document.querySelector('[data-sheet-door]')).toBeNull();
    fireEvent.click(document.querySelector('button[data-scorecard-course-name]')!);
    fireEvent.click(document.querySelector('button[data-scorecard-player-row]')!);
    expect(course).toHaveBeenCalledOnce(); expect(profile).toHaveBeenCalledOnce();
  });
  it('member scorecard course name is plain text when its handler is absent', () => {
    mount(<CardScorecardSheet {...round} onViewProfile={vi.fn()} />);
    expect(document.querySelector('button[data-scorecard-course-name]')).toBeNull();
    expect(document.querySelector('button[data-scorecard-player-row]')).not.toBeNull();
  });
  it('member scorecard has no exit container or interactive foot without Share', () => {
    mount(<CardScorecardSheet {...round} onViewCourse={vi.fn()} onViewProfile={vi.fn()} />);
    expect(document.querySelector('[data-scorecard-exit-links]')).toBeNull();
    expect(document.querySelector('[data-scorecard-interactive]')).toBeNull();
  });
  it('member scorecard footer row carries Share with its original handler, and no door', () => {
    const share = vi.fn();
    mount(<CardScorecardSheet {...round} onViewCourse={vi.fn()} onViewProfile={vi.fn()} onShareRound={share} />);
    const foot = document.querySelector('[data-scorecard-footer]');
    expect(foot?.querySelector('[data-sheet-door]')).toBeNull();
    fireEvent.click(foot!.querySelector('[data-scorecard-share]')!);
    expect(share).toHaveBeenCalledOnce();
  });
  it('tour uses the same course-name and player-row doors and no foot actions', () => {
    mount(<CardScorecardSheet {...round} surface="tour" onViewCourse={vi.fn()} onViewProfile={vi.fn()} />);
    expect(document.querySelector('[data-scorecard-exit-links]')).toBeNull();
    expect(document.querySelector('[data-sheet-door]')).toBeNull();
    expect(document.querySelector('button[data-scorecard-course-name]')).not.toBeNull();
    expect(document.querySelector('button[data-scorecard-player-row]')).not.toBeNull();
  });
  it('swipe preview draws the same header inert: no buttons, links or focus targets', () => {
    mount(<RoundPagePreview seed={{ scoreId: 'round', courseName: 'Course', playerName: round.playerName, gross: 78, toPar: 6, holes: [] }} />);
    const preview = document.querySelector('[data-round-page-preview]');
    expect(preview?.querySelector('[data-scorecard-player-row]')).not.toBeNull();
    expect(preview?.querySelector('[data-sheet-door]')).toBeNull();
    expect(preview?.querySelector('button, a, [tabindex]')).toBeNull();
  });
});
