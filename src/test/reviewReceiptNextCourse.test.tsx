import React from 'react';
import { beforeAll, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';
import composerFlow from '../../public/locales/en/composerFlow.json';

const h = vi.hoisted(() => ({ submit: vi.fn(), state: null as any }));
vi.mock('@/lib/routeChrome', () => ({ claimOverlayChrome: vi.fn(), releaseOverlayChrome: vi.fn() }));
vi.mock('@/components/AccessControl', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'player' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/features/review-v2/hooks/useReviewMediaPipeline', () => ({ useReviewMediaPipeline: () => ({ items: [], count: 0, pickerError: null, pendingMediaCount: () => 0, writeUploadedHolePhotos: vi.fn(), attachToReview: async () => ({ failed: 0, held: 0 }) }) }));
vi.mock('@/features/review-v2/hooks/useReviewSubmit', () => ({ useReviewSubmit: () => ({ submitting: false, submit: h.submit }) }));
vi.mock('@/features/review-v2/hooks/useReviewHoleTags', () => ({ useReviewHoleTags: () => ({ holes: [], assignments: {}, capture: () => null }) }));
vi.mock('@/features/review-v2/hooks/useReviewHeaderFacts', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/review-v2/hooks/useReviewHeaderFacts')>()), useReviewHeaderFacts: () => ({ avg: null, count: 0, rank: null }) }));
vi.mock('@/features/review-v2/hooks/useMyRatedScores', () => ({ useMyRatedScores: () => ({ data: [] }), calibrationRank: () => null, CALIBRATION_MIN_PEERS: 5 }));
vi.mock('@/hooks/top100/useTop100Config', () => ({ useTop100Config: () => ({ subscoreMinRatings: 10 }) }));
vi.mock('@/hooks/useCourseTop100Standing', () => ({ useCourseTop100Standing: () => ({ data: null }) }));
vi.mock('@/components/courses/course-detail/about/useHeroReferenceLine', () => ({ TEE_CHANGED_EVENT: 'clb:course-tee-changed', useHeroReferenceLine: () => null }));
vi.mock('@/utils/invalidateCourseRatingCaches', () => ({ invalidateCourseRatingCaches: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn(), ratings: { modalOpened: vi.fn(), sliderChanged: vi.fn(), submitted: vi.fn() } } }));
vi.mock('@/components/mentions/MentionsComposerInput', () => ({ MentionsComposerInput: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => <textarea aria-label="Review" value={value} onChange={e => onChange(e.target.value)} /> }));
vi.mock('@/features/review-v2/components/VoiceDictateButton', () => ({ VoiceDictateButton: () => null }));
vi.mock('@/features/review-v2/components/OverallScrubber', () => ({ OverallScrubber: ({ value }: { value: number | null }) => <output data-testid="overall">{JSON.stringify(value)}</output> }));
vi.mock('@/features/review-v2/components/CategoryGrid', () => ({ CategoryGrid: ({ values }: { values: unknown }) => <output data-testid="scores">{JSON.stringify(values)}</output> }));
vi.mock('@/features/review-v2/components/SubmitBar', () => ({ SubmitBar: ({ onPress }: { onPress: () => void }) => <button onClick={onPress} data-testid="primary">Continue</button> }));
vi.mock('@/features/review-v2/hooks/useReviewReceipt', () => ({ useReviewReceipt: () => ({ data: null }) }));
vi.mock('@/features/composer-flow/hooks/useReviewCourseSearch', () => {
  const row = { id: 'b', name: 'Course B', country: 'Scotland', subCountry: null, region: 'Fife', thumbnail: null, avg: 8, count: 2, mine: null, rank: null };
  return { useReviewCourseIdle: () => ({ data: { recent: [row], threshold: [], popular: [] }, isSuccess: true }), useReviewCourseResults: (_open: boolean, _user: string, q: string) => ({ data: [row], term: q, isSuccess: true }) };
});
// Observe the actual state hook without replacing its empty/edit/draft rules.
vi.mock('@/features/review-v2/hooks/useReviewComposer', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/review-v2/hooks/useReviewComposer')>();
  return { ...actual, useReviewComposer: (...args: Parameters<typeof actual.useReviewComposer>) => { const result = actual.useReviewComposer(...args); h.state = result.state; return result; } };
});

import ReviewComposerV2 from '@/features/review-v2/ReviewComposerV2';
import { DRAFT_VERSION, writeDraft } from '@/features/review-v2/hooks/useReviewComposer';

const i18n = createInstance();
beforeAll(async () => { await i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { courses, composerFlow } }, interpolation: { escapeValue: false } }); });
beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); h.submit.mockResolvedValue({ ratingId: 'rating-a' }); });
afterEach(cleanup);
const emptyScores = { design: null, condition: null, clubhouse: null, facilities: null };
function Navigation() { const navigate = useNavigate(); return <button data-testid="external-course-change" onClick={() => navigate('/courses/b/rate')}>Change course</button>; }
function mount(edit = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  for (const id of ['a', 'b']) {
    client.setQueryData(['rv2-course', id], { id, name: `Course ${id.toUpperCase()}`, thumbnail_image: '/course.jpg', country: 'Scotland', region: 'Fife' });
    client.setQueryData(['rv2-existing', id, 'player'], id === 'b' && edit ? { id: 'rating-b', rating: 7, design_score: 6, condition_score: 7, clubhouse_score: 8, facilities_score: 9, review: 'Existing B', share_to_feed: true } : null);
    client.setQueryData(['rv2-rating-count', id], 0);
  }
  client.setQueryData(['rv2-existing-media', 'rating-b'], []);
  client.setQueryData(['rv2-me', 'player'], { display_name: 'Player' });
  writeDraft('a', { v: DRAFT_VERSION, step: 3, savedAt: Date.now(), overall: 9, scores: { design: 9, condition: 8, clubhouse: 7, facilities: 6 }, reviewText: 'Review A', shareToFeed: true, teeLabel: null });
  return render(<QueryClientProvider client={client}><I18nextProvider i18n={i18n}><MemoryRouter initialEntries={['/courses/a/rate']}><Navigation /><Routes><Route path="/courses/:courseId/rate" element={<ReviewComposerV2 />} /></Routes></MemoryRouter></I18nextProvider></QueryClientProvider>);
}
async function receiptA() { fireEvent.click(screen.getByTestId('primary')); await screen.findByTestId('receipt-score-card'); expect(h.submit).toHaveBeenCalledWith(expect.objectContaining({ courseId: 'a' })); }
function expectNewB() {
  expect(screen.queryByTestId('receipt-status')).toBeNull();
  expect(Array.from(document.querySelectorAll('header [data-photo-header] div')).some((d) => d.textContent === 'Course B')).toBe(true);
  expect(document.querySelector('[data-step1-words]')).not.toBeNull();
  expect(h.state.overall).toBeNull(); expect(h.state.scores).toEqual(emptyScores); expect(h.state.reviewText).toBe('');
}
it('Review another opens course B at the first step with empty scores and text', async () => {
  mount(); await receiptA(); fireEvent.click(document.querySelector('.receipt-next [data-course="b"]') as HTMLElement);
  await waitFor(expectNewB);
});
it('Find another course search pick opens the same empty course B wizard', async () => {
  mount(); await receiptA(); fireEvent.click(document.querySelector('.receipt-find') as HTMLElement);
  const sheet = screen.getByTestId('review-course-search'); fireEvent.change(within(sheet).getByRole('searchbox'), { target: { value: 'Course B' } });
  fireEvent.click(sheet.querySelector('[data-course="b"]') as HTMLElement);
  await waitFor(expectNewB); expect(screen.queryByTestId('review-course-search')).toBeNull();
});
it('an external route course change never renders the course A receipt for B', async () => {
  mount(); await receiptA(); fireEvent.click(screen.getByTestId('external-course-change')); await waitFor(expectNewB);
});
it('Review another resolves the next course existing review for editing', async () => {
  mount(true); await receiptA(); fireEvent.click(document.querySelector('.receipt-next [data-course="b"]') as HTMLElement);
  await waitFor(() => expect(h.state.overall).toBe(7));
  expect(screen.queryByTestId('receipt-status')).toBeNull(); expect(screen.getByRole('textbox', { name: 'Review' })).toHaveValue('Existing B');
  expect(h.state.scores).toEqual({ design: 6, condition: 7, clubhouse: 8, facilities: 9 });
});