import React from 'react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/routeChrome', () => ({
  claimOverlayChrome: vi.fn(),
  releaseOverlayChrome: vi.fn(),
  applyRouteChrome: vi.fn(),
  reassertRouteChrome: vi.fn(),
}));
vi.mock('@/components/AccessControl', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'player' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/features/review-v2/hooks/useReviewMediaPipeline', () => ({ useReviewMediaPipeline: () => ({ items: [], count: 0, pickerError: null }) }));
vi.mock('@/features/review-v2/hooks/useReviewSubmit', () => ({ useReviewSubmit: () => ({ submitting: false }) }));
vi.mock('@/features/review-v2/hooks/useReviewHoleTags', () => ({ useReviewHoleTags: () => ({ holes: [], assignments: {} }) }));
vi.mock('@/features/review-v2/hooks/useReviewHeaderFacts', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/review-v2/hooks/useReviewHeaderFacts')>()), useReviewHeaderFacts: () => ({ data: { avg: null, count: 0, rank: null } }) }));
vi.mock('@/features/review-v2/hooks/useMyRatedScores', () => ({ useMyRatedScores: () => ({ data: [] }), calibrationRank: () => null }));
vi.mock('@/hooks/top100/useTop100Config', () => ({ useTop100Config: () => ({ subscoreMinRatings: 10 }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn(), ratings: { modalOpened: vi.fn(), sliderChanged: vi.fn() } } }));
vi.mock('@/components/mentions/MentionsComposerInput', () => ({ MentionsComposerInput: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <textarea aria-label="Review" value={value} onChange={e => onChange(e.target.value)} /> }));
vi.mock('@/features/review-v2/components/VoiceDictateButton', () => ({ VoiceDictateButton: () => null }));

import ReviewComposerV2 from '@/features/review-v2/ReviewComposerV2';
import { RV2 } from '@/features/review-v2/tokens';
import { claimOverlayChrome, releaseOverlayChrome } from '@/lib/routeChrome';
import { DRAFT_VERSION, writeDraft } from '@/features/review-v2/hooks/useReviewComposer';

beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });
afterEach(cleanup);

const canvasClaim = { id: 'review-composer', statusBarStyle: 'light', statusBarColor: 'FF16161A', shieldColor: RV2.canvas };
const photoClaim = { ...canvasClaim, statusBarColor: '00000000', shieldColor: 'transparent' };

function mount({ overlay = false, edit = false } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  qc.setQueryData(['rv2-course', 'course'], { id: 'course', name: 'Kingsbarns', thumbnail_image: '/course.jpg' });
  qc.setQueryData(['rv2-existing', 'course', 'player'], edit ? { id: 'rating', rating: 8, design_score: 8, condition_score: 8, clubhouse_score: 8, facilities_score: 8, review: '', share_to_feed: true } : null);
  qc.setQueryData(['rv2-existing-media', 'rating'], []);
  qc.setQueryData(['rv2-me', 'player'], { display_name: 'Player' });
  qc.setQueryData(['rv2-rating-count', 'course'], 0);
  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={[{ pathname: '/courses/course/rate', state: overlay ? { backgroundLocation: { pathname: '/clubhouse' } } : null }]}><Routes><Route path="/courses/:courseId/rate" element={<ReviewComposerV2 />} /></Routes></MemoryRouter></QueryClientProvider>);
}

function expectOneRelease(unmount: () => void) {
  expect(releaseOverlayChrome).not.toHaveBeenCalled();
  unmount();
  expect(releaseOverlayChrome).toHaveBeenCalledTimes(1);
  expect(releaseOverlayChrome).toHaveBeenCalledWith('review-composer');
}

it.each([false, true])('claims transparent photo then canvas after folding, overlay=%s, with one unmount release', overlay => {
  const view = mount({ overlay });
  expect(view.container.querySelector('header')).toHaveAttribute('data-header-form', 'photo');
  expect(claimOverlayChrome).toHaveBeenLastCalledWith(photoClaim);
  const initialCalls = vi.mocked(claimOverlayChrome).mock.calls.length;
  fireEvent.change(view.getByRole('textbox', { name: 'Review' }), { target: { value: 'A' } });
  expect(view.container.querySelector('header')).toHaveAttribute('data-header-form', 'compact');
  expect(claimOverlayChrome).toHaveBeenLastCalledWith(canvasClaim);
  expect(claimOverlayChrome).toHaveBeenCalledTimes(initialCalls + 1);
  fireEvent.change(view.getByRole('textbox', { name: 'Review' }), { target: { value: '' } });
  expect(claimOverlayChrome).toHaveBeenCalledTimes(initialCalls + 1);
  expectOneRelease(view.unmount);
});

it('claims canvas on step 2 and releases once', () => {
  writeDraft('course', { v: DRAFT_VERSION, step: 3, savedAt: Date.now(), overall: null, scores: { design: null, condition: null, clubhouse: null, facilities: null }, reviewText: '', shareToFeed: true, teeLabel: null });
  const view = mount();
  expect(view.container.querySelector('header')).toHaveAttribute('data-header-form', 'compact');
  expect(claimOverlayChrome).toHaveBeenLastCalledWith(canvasClaim);
  expect(vi.mocked(claimOverlayChrome).mock.calls.some(([claim]) => claim.shieldColor === 'transparent')).toBe(false);
  expectOneRelease(view.unmount);
});

it('claims canvas in edit mode and releases once', () => {
  const view = mount({ edit: true });
  expect(view.container.querySelector('header')).toHaveAttribute('data-header-form', 'compact');
  expect(claimOverlayChrome).toHaveBeenLastCalledWith(canvasClaim);
  expect(vi.mocked(claimOverlayChrome).mock.calls.some(([claim]) => claim.shieldColor === 'transparent')).toBe(false);
  expectOneRelease(view.unmount);
});