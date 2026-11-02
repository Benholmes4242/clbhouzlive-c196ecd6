import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import courses from '../../public/locales/en/courses.json';
import tourhub from '../../public/locales/en/tourhub.json';

const state = vi.hoisted(() => ({
  meta: null as Record<string, unknown> | null,
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => state.navigate };
});

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = () => {
    const p = Promise.resolve({ data: [], error: null });
    const chain: any = {};
    Object.assign(chain, {
      select: () => chain, eq: () => chain, order: () => chain, limit: () => chain, range: () => chain,
      maybeSingle: () => p, single: () => p,
      then: p.then.bind(p), catch: p.catch.bind(p), finally: p.finally.bind(p),
    });
    return chain;
  };
  return { supabase: { from: () => makeChain(), auth: {}, rpc: () => makeChain() } };
});

vi.mock('@/hooks/useCardOpenGate', () => ({ useCardOpenGate: () => ({ visible: true, capHit: false }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({
  useTournamentMeta: () => ({ data: state.meta, isLoading: false, error: null }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/components/posts/useReviewMedia', () => ({ useReviewMedia: () => ({ data: [] }) }));
vi.mock('@/components/posts/useReviewPost', () => ({ useReviewPost: () => ({ data: undefined }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null }) }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('@/features/courses/_shared/scorecard/ScorecardGlassOverlay', () => ({ ScorecardGlassOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { ScorecardSheet } from '@/features/tourhub/leaderboard/ScorecardSheet';

const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { courses, tourhub } }, interpolation: { escapeValue: false } });

const target = {
  playerId: 'player-1',
  playerName: 'Kris Ventura',
  position: 12,
  total: -3,
  today: -2,
  thru: 14,
};

function mount(node: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <I18nextProvider i18n={i18n}>{node}</I18nextProvider>
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe('Tour scorecard course door', () => {
  it('renders the course door when the tournament is linked and navigates to the course', () => {
    state.navigate.mockClear();
    const onClose = vi.fn();
    state.meta = { name: 'Vidanta Vallarta', golf_course_id: 'course-1' };
    mount(<ScorecardSheet open onClose={onClose} tournamentId="event-1" target={target} />);
    const courseDoor = document.querySelector('[data-sheet-door="course"]');
    expect(courseDoor).not.toBeNull();
    expect(document.querySelector('[data-sheet-door="profile"]')).not.toBeNull();
    fireEvent.click(courseDoor as Element);
    expect(state.navigate).toHaveBeenCalledWith('/courses/course-1');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows Profile alone when the tournament has no linked course', () => {
    state.navigate.mockClear();
    const onClose = vi.fn();
    state.meta = { name: 'Vidanta Vallarta', golf_course_id: null };
    mount(<ScorecardSheet open onClose={onClose} tournamentId="event-1" target={target} />);
    expect(document.querySelector('[data-sheet-door="course"]')).toBeNull();
    expect(document.querySelector('[data-sheet-door="profile"]')).not.toBeNull();
  });
});
