/**
 * BRIEF_REVIEW_STEP_ONE — the photo header and its fold, the Speak card's four
 * states, the always-present box, tray hole chips and the step 1 footer.
 * Structure only; translated words are never asserted.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent, act, renderHook, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

// The photo hero's two reads, mocked so the header tests stay about the header.
let mockStanding: { globalRank: number | null; regionalRank: number | null; usaRank: number | null } | null = null;
let mockRefLine: string | null = null;
vi.mock('@/hooks/useCourseTop100Standing', () => ({ useCourseTop100Standing: () => ({ data: mockStanding }) }));
vi.mock('@/components/courses/course-detail/about/useHeroReferenceLine', () => ({
  TEE_CHANGED_EVENT: 'clb:course-tee-changed',
  useHeroReferenceLine: () => mockRefLine,
}));

const rec = {
  isRecording: false, duration: 0, stream: null as MediaStream | null, audioBlob: null as Blob | null,
  startRecording: vi.fn(), stopRecording: vi.fn(), resetRecording: vi.fn(),
};
vi.mock('@/hooks/useVoiceRecorder', () => ({ useVoiceRecorder: () => rec }));
let resolveTranscript: (s: string) => void = () => {};
vi.mock('@/lib/transcribeAudio', () => ({ transcribeAudio: vi.fn(() => new Promise<string>(r => { resolveTranscript = r; })) }));

import { isStepOneEmpty, usePhotoHeaderForm, type StepOneInput } from '@/features/review-v2/lib/stepOneFold';
import { ReviewComposerHeader } from '@/features/review-v2/components/ReviewComposerHeader';
import { VoiceDictateButton } from '@/features/review-v2/components/VoiceDictateButton';
import { MediaTray } from '@/features/review-v2/components/MediaTray';
import { ReviewHoleTags } from '@/features/review-v2/components/ReviewHoleTags';
import { SubmitBar } from '@/features/review-v2/components/SubmitBar';
import { headerScore } from '@/features/review-v2/hooks/useReviewHeaderFacts';
import { courseMastheadKicker } from '@/features/courses/_shared/courseRankLabels';
import { HERO_CANON_WASH } from '@/features/tourhub/_shared/heroGradient';
import type { MediaItem } from '@/features/review-v2/types';

afterEach(cleanup);
beforeEach(() => {
  rec.isRecording = false; rec.audioBlob = null; rec.duration = 0; vi.clearAllMocks();
  mockStanding = null; mockRefLine = null;
});

const base: StepOneInput = { onFirstStep: true, textLength: 0, mediaCount: 0, voiceActive: false, isEditMode: false };

describe('header fold', () => {
  it('empty only on step 1 with nothing in it and not editing', () => {
    expect(isStepOneEmpty(base)).toBe(true);
    expect(isStepOneEmpty({ ...base, textLength: 1 })).toBe(false);
    expect(isStepOneEmpty({ ...base, mediaCount: 1 })).toBe(false);
    expect(isStepOneEmpty({ ...base, voiceActive: true })).toBe(false);
    expect(isStepOneEmpty({ ...base, isEditMode: true })).toBe(false);
    expect(isStepOneEmpty({ ...base, onFirstStep: false })).toBe(false);
  });

  it.each([
    ['speak', { voiceActive: true }],
    ['type', { textLength: 1 }],
    ['pick', { mediaCount: 1 }],
  ])('folds on %s and stays compact after it is undone and after step 2', (_n, change) => {
    const { result, rerender } = renderHook((p: StepOneInput) => usePhotoHeaderForm(p), { initialProps: base });
    expect(result.current).toBe(true);
    rerender({ ...base, ...change });
    expect(result.current).toBe(false);
    rerender(base);
    expect(result.current).toBe(false);
    rerender({ ...base, onFirstStep: false });
    expect(result.current).toBe(false);
  });

  it('edit mode starts compact', () => {
    const { result } = renderHook(() => usePhotoHeaderForm({ ...base, isEditMode: true }));
    expect(result.current).toBe(false);
  });
});

describe('header forms', () => {
  const props = {
    name: 'Kingsbarns', region: 'Fife, Scotland', thumbnail: 'https://x.test/k.jpg',
    courseId: 'course-1', courseRegion: 'Fife', subCountry: null as string | null, country: 'Scotland',
    leadingIsClose: false, onBack: vi.fn(), isEditMode: false, onDelete: vi.fn(),
  };
  it('photo header is one block the photograph covers, with the name block below it gone', () => {
    const { container } = render(<ReviewComposerHeader {...props} form="photo" facts={{ avg: 8.64, count: 12 }} />);
    const photo = container.querySelector('[data-photo-header]');
    const img = photo?.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(props.thumbnail);
    expect(img.style.objectFit).toBe('cover');
    expect(img.style.objectPosition).toBe('center 40%');
    expect(img.style.position).toBe('absolute');
    expect(img.style.inset).toBe('0');
    expect(container.querySelector('[data-photo-name-block]')).toBeNull();
    expect(container.querySelector('header')?.getAttribute('data-header-form')).toBe('photo');
  });
  it('lays the course page wash and the fade into the page over the photo, neither taking taps', () => {
    const { container } = render(<ReviewComposerHeader {...props} form="photo" facts={{ avg: 8.64, count: 12 }} />);
    const layers = Array.from(container.querySelectorAll('[data-photo-header] [aria-hidden]')) as HTMLElement[];
    expect(layers).toHaveLength(2);
    for (const layer of layers) {
      expect(layer.style.position).toBe('absolute');
      expect(layer.style.inset).toBe('0');
      expect(layer.style.pointerEvents).toBe('none');
    }
    // jsdom drops gradient values from the DOM, so the layers themselves are
    // asserted in the source: the course page's 18% wash first, then the fade.
    expect(HERO_CANON_WASH).toBe('linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.18))');
    const src = readFileSync(resolve(__dirname, '../features/review-v2/components/ReviewComposerHeader.tsx'), 'utf8');
    expect(src).toContain('background: HERO_CANON_WASH');
    expect(src).toContain('linear-gradient(180deg, rgba(22,22,26,0) 40%, rgba(22,22,26,0.72) 72%, ${RV2.canvas} 100%)');
  });
  it('renders the course page masthead over the photo: shared kicker, place, two-line name clamp', () => {
    mockStanding = { globalRank: 16, regionalRank: 14, usaRank: null };
    const { container } = render(<ReviewComposerHeader {...props} form="photo" facts={{ avg: 8.64, count: 12 }} />);
    const masthead = container.querySelector('[data-photo-header] > div:last-child') as HTMLElement;
    expect(masthead.style.position).toBe('absolute');
    expect(masthead.style.left).toBe('20px');
    expect(masthead.style.right).toBe('20px');
    expect(masthead.style.bottom).toBe('14px');
    const kickerEl = Array.from(masthead.querySelectorAll('div')).find((d) => d.textContent === 'Fife · #16 World · #14 GB&I') as HTMLElement;
    expect(kickerEl).toBeTruthy();
    expect(kickerEl.style.textTransform).toBe('uppercase');
    const nameEl = Array.from(masthead.querySelectorAll('div')).find((d) => d.textContent === 'Kingsbarns') as HTMLElement;
    expect(nameEl.style.webkitLineClamp).toBe('2');
    expect(Array.from(masthead.querySelectorAll('div')).some((d) => d.textContent === 'Scotland')).toBe(true);
  });
  it('keeps CourseTitleOverlay\u2019s kicker rule in the shared helper, country deciding the regional list', () => {
    const standing = { globalRank: 16, regionalRank: 14, usaRank: 9 };
    expect(courseMastheadKicker({ sub_country: null, region: 'Fife', country: 'Scotland' }, standing)).toBe('Fife · #16 World · #14 GB&I');
    expect(courseMastheadKicker({ sub_country: 'Norfolk', region: 'East', country: 'England' }, standing)).toBe('Norfolk · #16 World · #14 GB&I');
    expect(courseMastheadKicker({ sub_country: null, region: 'California', country: 'United States' }, standing)).toBe('California · #16 World · #9 USA');
    expect(courseMastheadKicker({ sub_country: null, region: 'Algarve', country: 'Continental Europe' }, standing)).toBe('Algarve · #16 World · #14 Europe');
    expect(courseMastheadKicker({ sub_country: null, region: 'Fife', country: 'Scotland' }, null)).toBe('Fife');
    expect(courseMastheadKicker({ sub_country: null, region: null, country: 'Scotland' }, null)).toBeNull();
  });
  it('leads the reference line with the members\u2019 score, then the tee parts', () => {
    mockRefLine = 'Par 72 · 6,915 yds · 73.6 / 135';
    const { container } = render(<ReviewComposerHeader {...props} form="photo" facts={{ avg: 8.24, count: 1 }} />);
    const line = container.querySelector('[data-header-reference]') as HTMLElement;
    expect(line).not.toBeNull();
    expect(line.style.fontSize).toBe('13px');
    expect(line.style.fontWeight).toBe('600');
    const score = line.querySelector('b') as HTMLElement;
    expect(score.textContent).toBe('8.2');
    expect(score.style.fontWeight).toBe('700');
    expect(line.textContent).toContain('Par 72');
    expect(line.textContent).toContain('6,915 yds');
    expect(line.textContent).toContain('73.6 / 135');
  });
  it('omits the score with 0 reviews and drops the hairline row with neither score nor reference', () => {
    mockRefLine = 'Par 72';
    const withRef = render(<ReviewComposerHeader {...props} form="photo" facts={{ avg: null, count: 0 }} />);
    const line = withRef.container.querySelector('[data-header-reference]') as HTMLElement;
    expect(line.querySelector('b')).toBeNull();
    expect(line.textContent).toBe('Par 72');
    expect(headerScore({ avg: 9, count: 0 })).toBeNull();
    withRef.unmount();
    mockRefLine = null;
    const bare = render(<ReviewComposerHeader {...props} form="photo" facts={{ avg: null, count: 0 }} />);
    expect(bare.container.querySelector('[data-header-reference]')).toBeNull();
    const divs = Array.from(bare.container.querySelectorAll('div')) as HTMLElement[];
    expect(divs.some((d) => d.style.borderTop.includes('rgba(255, 255, 255, 0.18)'))).toBe(false);
  });
  it('preserves the safe-area photo height and compact height through the measured fold', () => {
    const ref = React.createRef<HTMLElement>();
    const facts = { avg: null, count: 0 };
    const { container, rerender } = render(<ReviewComposerHeader ref={ref} {...props} form="photo" facts={facts} />);
    const header = ref.current;
    expect(container.querySelector('[data-photo-header]')).toHaveClass('rv2-photo');
    expect(header).toHaveClass('rv2-header--photo');
    const cssText = readFileSync(resolve(__dirname, '../features/review-v2/components/reviewComposerHeader.css'), 'utf8');
    expect(cssText).toContain('.rv2-header--photo { height: calc(env(safe-area-inset-top, 0px) + 246px); }');
    expect(cssText).toContain('.rv2-header--compact { height: calc(env(safe-area-inset-top, 0px) + 68px); }');
    expect(cssText).toContain('.rv2-photo { height: 100%; }');
    expect(cssText).toContain('transition: height 200ms ease');
    rerender(<ReviewComposerHeader ref={ref} {...props} form="compact" facts={facts} />);
    expect(ref.current).toBe(header);
    expect(header).toHaveClass('rv2-header--compact');
    expect(container.querySelector('[data-photo-header]')).toBeNull();
  });
  it('splits the members copy into singular and plural in every locale', () => {
    for (const loc of ['en', 'en-XA', 'de', 'es', 'ja', 'ko']) {
      const json = JSON.parse(readFileSync(resolve(__dirname, `../../public/locales/${loc}/courses.json`), 'utf8'));
      const stepOne = json.review.wizard.stepOne;
      expect(stepOne.fromMembers).toBeUndefined();
      expect(stepOne.fromMembers_one).toBe('from {{count}} member');
      expect(stepOne.fromMembers_other).toBe('from {{count}} members');
    }
  });
  it('compact header carries region only at 0 reviews and keeps delete in edit mode', () => {
    const { container, getAllByRole } = render(<ReviewComposerHeader {...props} form="compact" isEditMode facts={{ avg: null, count: 0 }} />);
    expect(container.querySelector('[data-photo-header]')).toBeNull();
    expect(container.querySelector('[data-compact-meta]')?.textContent).toBe('Fife, Scotland');
    expect(getAllByRole('button')).toHaveLength(2);
  });
  it('compact header leads with region and the score when reviewed', () => {
    const { container } = render(<ReviewComposerHeader {...props} form="compact" facts={{ avg: 8.64, count: 3 }} />);
    const meta = container.querySelector('[data-compact-meta]');
    expect(meta?.textContent).toContain('Fife, Scotland');
    expect(meta?.textContent).toContain('8.6');
  });
});

describe('speak card', () => {
  const state = (c: HTMLElement) => c.querySelector('[data-speak-state]')?.getAttribute('data-speak-state');
  it('idle empty, idle with text, listening, writing — words only when transcription returns', async () => {
    const onAppend = vi.fn();
    const onStart = vi.fn();
    const { container, rerender } = render(<VoiceDictateButton idleVariant="hero" onAppend={onAppend} onStart={onStart} />);
    expect(state(container)).toBe('idle');
    fireEvent.click(container.querySelector('button')!);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(rec.startRecording).toHaveBeenCalledTimes(1);

    rerender(<VoiceDictateButton idleVariant="hero" hasText onAppend={onAppend} />);
    expect(state(container)).toBe('idle-more');

    rec.isRecording = true;
    rerender(<VoiceDictateButton idleVariant="hero" onAppend={onAppend} />);
    expect(state(container)).toBe('listening');
    expect(container.querySelector('[data-speak-stop]')).not.toBeNull();
    expect(container.querySelector('[data-speak-timer]')).not.toBeNull();
    expect(container.querySelector('[data-speak-wave]')).not.toBeNull();
    fireEvent.click(container.querySelector('button')!);
    expect(rec.stopRecording).toHaveBeenCalledTimes(1);

    rec.isRecording = false;
    rec.audioBlob = new Blob(['a']);
    rerender(<VoiceDictateButton idleVariant="hero" onAppend={onAppend} />);
    await waitFor(() => expect(state(container)).toBe('writing'));
    expect(container.querySelector('[data-speak-spinner]')).not.toBeNull();
    expect(container.querySelector('[data-speak-timer]')).toBeNull();
    expect(onAppend).not.toHaveBeenCalled();
    await act(async () => { resolveTranscript('Lovely greens'); });
    expect(onAppend).toHaveBeenCalledWith('Lovely greens');
  });
});

const item = (id: string): MediaItem => ({ id, type: 'image', previewUrl: `https://m.test/${id}.jpg`, status: 'uploaded', progress: 100 });

describe('photo row', () => {
  it('step 1 tiles are 88px with the add tile after them and chips drawn', () => {
    const { container } = render(<MediaTray appearance="step1" items={[item('a')]} onPick={vi.fn()} onRemove={vi.fn()} renderChip={() => <span data-chip-probe />} />);
    const add = container.querySelector('[data-step1-add]') as HTMLElement;
    expect(add.getAttribute('data-step1-add')).toBe('more');
    expect(add.style.width).toBe('56px');
    expect(add.parentElement!.lastElementChild).toBe(add);
    expect(container.querySelectorAll('[data-chip-probe]')).toHaveLength(1);
  });
  it('empty step 1 shows the 88px Add with the aside beside it', () => {
    const { container } = render(<MediaTray appearance="step1" items={[]} onPick={vi.fn()} onRemove={vi.fn()} emptyAside={<span data-aside />} />);
    expect((container.querySelector('[data-step1-add]') as HTMLElement).style.width).toBe('88px');
    expect(container.querySelector('[data-aside]')).not.toBeNull();
  });
});

const tags = (assignments: Record<string, number> = {}) => ({
  holes: [1, 2, 3], shots: [item('a'), item('b')], assignments, assign: vi.fn(), unassign: vi.fn(),
  metadata: {},
}) as unknown as Parameters<typeof ReviewHoleTags>[0];

describe('hole tagger from the chip', () => {
  it('hides the shot list and opens the sheet on the requested shot', () => {
    const { queryByLabelText, rerender } = render(<ReviewHoleTags {...tags()} hideShotList focusShotId={null} />);
    expect(queryByLabelText('Tag photo 1')).toBeNull();
    rerender(<ReviewHoleTags {...tags()} hideShotList focusShotId="b" />);
    const current = document.querySelector('[aria-current="true"]') as HTMLElement;
    expect(current.getAttribute('aria-label')).toContain('Shot 2 of 2');
  });
  it('a tagged shot opens in the tagged state', () => {
    const { rerender, getByText } = render(<ReviewHoleTags {...tags({ a: 2 })} hideShotList focusShotId={null} />);
    rerender(<ReviewHoleTags {...tags({ a: 2 })} hideShotList focusShotId="a" />);
    expect(getByText('Remove tag')).toBeTruthy();
  });
});

describe('step 1 footer', () => {
  it('skip renders only when a skip label is given; button is 54px', () => {
    const { container, rerender } = render(<SubmitBar appearance="step1" label="x" enabled onPress={vi.fn()} skipLabel="s" onSkip={vi.fn()} />);
    expect(container.querySelector('[data-step1-skip]')).not.toBeNull();
    expect((container.querySelector('button') as HTMLElement).style.height).toBe('54px');
    rerender(<SubmitBar appearance="step1" label="x" enabled onPress={vi.fn()} skipLabel={null} />);
    expect(container.querySelector('[data-step1-skip]')).toBeNull();
  });
});
