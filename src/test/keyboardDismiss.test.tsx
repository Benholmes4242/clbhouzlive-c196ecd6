import React, { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const h = vi.hoisted(() => ({ actor: { type: 'personal', id: 'me', name: 'Me' }, noop: vi.fn(), rpc: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: h.actor, availableActors: [] }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me' } }) }));
vi.mock('@/features/post-v2/hooks/useComposerActor', () => ({ useComposerActor: () => ({ activeActor: h.actor, availableActors: [], selectActor: h.noop, applyDraftActor: h.noop }) }));
vi.mock('@/features/post-v2/hooks/useStageComposer', () => ({ MAX_MEDIA: 10, useStageComposer: () => ({
  state: { media: [], caption: '', courses: [], course: null, activeIndex: 0, scheduledAt: null, dirty: false },
  addFiles: h.noop, removeAt: h.noop, reorder: h.noop, setActiveIndex: h.noop, updateActive: h.noop, setCaption: h.noop, setCourse: h.noop, setCourses: h.noop, setScheduledAt: h.noop, restoreDraft: h.noop, hydrate: h.noop, reset: h.noop, setGolf: h.noop, setVideoData: h.noop,
}) }));
vi.mock('@/features/post-v2/hooks/useDrafts', () => ({ useDrafts: () => ({ drafts: [], save: h.noop, remove: h.noop }) }));
vi.mock('@/hooks/useEditablePost', () => ({ useEditablePost: () => ({ data: null, isFetched: true }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ data: null }) }));
vi.mock('@/features/post-v2/lib/golfPostReads', () => ({ fetchRecentCourses: async () => [], fetchPlayedWithSuggestions: async () => [], firstCaptureDay: async () => null, findRoundCourse: async () => null, readWithCandidates: async () => [], searchMembers: async () => [] }));
vi.mock('@/features/post-v2/lib/composerGolfReads', () => ({ readComposerRounds: async () => [], readClaimedCourse: async () => null, readNearbyCourse: async () => null, readGolfCourse: async () => null, roundIsRecent: () => false }));
vi.mock('@/hooks/useMedianStatusBar', () => ({ setStatusBarStyleColor: h.noop }));
vi.mock('@/lib/routeChrome', () => ({ applyRouteChrome: h.noop, claimOverlayChrome: h.noop, releaseOverlayChrome: h.noop }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.noop, ratings: { modalOpened: h.noop, sliderChanged: h.noop } } }));
vi.mock('@/components/AccessControl', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/features/post-v2/components/CaptionField', () => ({ default: () => <textarea aria-label="Post text" /> }));
vi.mock('@/components/mentions/MentionsComposerInput', () => ({ MentionsComposerInput: () => <textarea aria-label="Review text" />, searchMentionMembers: h.noop }));
vi.mock('@/features/review-v2/hooks/useReviewMediaPipeline', () => ({ useReviewMediaPipeline: () => ({ items: [], count: 0, pickerError: null, pendingMediaCount: () => 0 }) }));
vi.mock('@/features/review-v2/hooks/useReviewHoleTags', () => ({ useReviewHoleTags: () => ({ holes: [], assignments: {}, capture: () => null }) }));
vi.mock('@/features/review-v2/hooks/useReviewHeaderFacts', () => ({ useReviewHeaderFacts: () => ({ avg: null, count: 0 }) }));
vi.mock('@/features/review-v2/hooks/useMyRatedScores', () => ({ useMyRatedScores: () => ({ data: [] }), calibrationRank: () => null }));
vi.mock('@/hooks/top100/useTop100Config', () => ({ useTop100Config: () => ({ subscoreMinRatings: 10 }) }));
vi.mock('@/features/review-v2/components/ReviewComposerHeader', () => ({ ReviewComposerHeader: React.forwardRef<HTMLElement>((_props, ref) => <header ref={ref} />) }));
vi.mock('@/features/review-v2/components/VoiceDictateButton', () => ({ VoiceDictateButton: () => null }));
vi.mock('@/features/review-v2/components/MediaTray', () => ({ MediaTray: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, from: () => {
  const query = { select: () => query, eq: () => query, in: () => query, order: () => query, maybeSingle: async () => ({ data: null, error: null }), then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve) };
  return query;
} } }));

import { useKeyboardDismiss } from '@/lib/keyboard/useKeyboardDismiss';
import { KeyboardDonePill } from '@/lib/keyboard/KeyboardDonePill';
import StageComposer from '@/features/post-v2/StageComposer';
import ReviewComposerV2 from '@/features/review-v2/ReviewComposerV2';

class Viewport extends EventTarget { height = 500; offsetTop = 0; }
let viewport: Viewport;
const originalViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport');
const originalHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
beforeEach(() => {
  sessionStorage.clear(); vi.clearAllMocks(); h.rpc.mockResolvedValue({ data: [], error: null });
  viewport = new Viewport();
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
});
afterEach(() => {
  cleanup();
  if (originalViewport) Object.defineProperty(window, 'visualViewport', originalViewport); else Reflect.deleteProperty(window, 'visualViewport');
  if (originalHeight) Object.defineProperty(window, 'innerHeight', originalHeight);
});
function Harness() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const keyboard = useKeyboardDismiss(scrollRef);
  return <div ref={scrollRef} data-testid="wizard-scroll"><textarea aria-label="Review text" /><div data-testid="media-tray" /><div data-keyboard-keep-open="mentions" data-testid="mentions" /><div className="pf4-with-results" data-testid="with-results" /><input type="checkbox" aria-label="Checkbox" /><div contentEditable suppressContentEditableWarning aria-label="Editable text" /><KeyboardDonePill {...keyboard} /></div>;
}
function focusText() { const field = screen.getByRole('textbox', { name: 'Review text' }); act(() => field.focus()); return field; }
function drag(target: Element, x: number, y: number) {
  fireEvent.touchStart(target, { touches: [{ clientX: 40, clientY: 40 }] });
  fireEvent.touchMove(target, { touches: [{ clientX: 40 + x, clientY: 40 + y }] });
}
function wizard(kind: 'post' | 'review') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(['rv2-course', 'course'], { id: 'course', name: 'Sundridge Park' });
  client.setQueryData(['rv2-existing', 'course', 'me'], null);
  client.setQueryData(['rv2-me', 'me'], { display_name: 'Me' });
  client.setQueryData(['rv2-rating-count', 'course'], 0);
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/courses/course/rate']}><Routes><Route path="/courses/:courseId/rate" element={kind === 'post' ? <StageComposer onClose={h.noop} /> : <ReviewComposerV2 />} /></Routes></MemoryRouter></QueryClientProvider>);
}
describe('wizard keyboard dismissal', () => {
  it('(a) shrunk viewport and focused review show Done ten pixels above keyboard; tap blurs and removes it', () => {
    render(<Harness />); const field = focusText();
    expect(screen.getByRole('button', { name: 'Close keyboard' }).style.bottom).toBe('310px');
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Close keyboard' }));
    expect(document.activeElement).not.toBe(field); expect(screen.queryByRole('button', { name: 'Close keyboard' })).toBeNull();
  });
  it('(b) twenty-pixel vertical page drag blurs the field', () => {
    render(<Harness />); const field = focusText(); drag(screen.getByTestId('wizard-scroll'), 0, 20);
    expect(document.activeElement).not.toBe(field);
  });
  it('(c) a drag inside a scrollable focused textarea preserves focus', () => {
    render(<Harness />); const field = focusText(); Object.defineProperties(field, { scrollHeight: { value: 500 }, clientHeight: { value: 100 } });
    drag(field, 0, 20); expect(document.activeElement).toBe(field);
  });
  it('(d) horizontal media-tray swipe preserves focus', () => {
    render(<Harness />); const field = focusText(); drag(screen.getByTestId('media-tray'), 30, 20); expect(document.activeElement).toBe(field);
  });
  it('(e) no focused field means no pill and drags do nothing', () => {
    render(<Harness />); const active = document.activeElement; drag(screen.getByTestId('wizard-scroll'), 0, 20);
    expect(document.activeElement).toBe(active); expect(screen.queryByRole('button', { name: 'Close keyboard' })).toBeNull();
  });
  it('(f) both real wizard shells show the shared pill while typing', async () => {
    for (const kind of ['post', 'review'] as const) {
      const view = wizard(kind); const field = await screen.findByRole('textbox', { name: kind === 'post' ? 'Post text' : 'Review text' });
      act(() => field.focus()); expect(screen.getByRole('button', { name: 'Close keyboard' })).not.toBeNull();
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Close keyboard' })); expect(document.activeElement).not.toBe(field);
      view.unmount();
    }
  });
  it('mention and Played with result-list drags preserve focus', () => {
    render(<Harness />); const field = focusText();
    for (const list of ['mentions', 'with-results']) { drag(screen.getByTestId(list), 0, 20); expect(document.activeElement).toBe(field); }
  });
  it('keyboard requires more than 120 pixels of viewport shrink and follows resize and scroll', () => {
    viewport.height = 680; render(<Harness />); focusText(); expect(screen.queryByRole('button', { name: 'Close keyboard' })).toBeNull();
    act(() => { viewport.height = 679; viewport.dispatchEvent(new Event('resize')); });
    expect(screen.getByRole('button', { name: 'Close keyboard' }).style.bottom).toBe('131px');
    act(() => { viewport.offsetTop = 20; viewport.dispatchEvent(new Event('scroll')); });
    expect(screen.getByRole('button', { name: 'Close keyboard' }).style.bottom).toBe('111px');
  });
  it('a twelve-pixel drag keeps focus; thirteen pixels dismisses', () => {
    render(<Harness />); const field = focusText(); const scroll = screen.getByTestId('wizard-scroll');
    drag(scroll, 0, 12); expect(document.activeElement).toBe(field); drag(scroll, 0, 13); expect(document.activeElement).not.toBe(field);
  });
  it('without visualViewport focus alone opens the pill; non-text controls do not', () => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined }); render(<Harness />);
    const field = focusText(); expect(screen.getByRole('button', { name: 'Close keyboard' }).style.bottom).toBe('10px');
    act(() => { field.blur(); screen.getByRole('checkbox').focus(); }); expect(screen.queryByRole('button', { name: 'Close keyboard' })).toBeNull();
  });
  it('unmount removes passive viewport and touch listeners', () => {
    const add = vi.spyOn(viewport, 'addEventListener'); const remove = vi.spyOn(viewport, 'removeEventListener');
    const view = render(<Harness />); const scroll = screen.getByTestId('wizard-scroll'); const removeTouch = vi.spyOn(scroll, 'removeEventListener');
    expect(add).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
    view.unmount(); expect(remove).toHaveBeenCalledWith('resize', expect.any(Function)); expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    for (const event of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) expect(removeTouch).toHaveBeenCalledWith(event, expect.any(Function));
    vi.restoreAllMocks();
  });
});