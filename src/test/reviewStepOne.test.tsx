/**
 * BRIEF_REVIEW_STEP_ONE — the photo header and its fold, the Speak card's four
 * states, the always-present box, tray hole chips and the step 1 footer.
 * Structure only; translated words are never asserted.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent, act, renderHook, waitFor } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

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
import type { MediaItem } from '@/features/review-v2/types';

afterEach(cleanup);
beforeEach(() => { rec.isRecording = false; rec.audioBlob = null; rec.duration = 0; vi.clearAllMocks(); });

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
  const props = { name: 'Kingsbarns', region: 'Fife, Scotland', thumbnail: 'https://x.test/k.jpg', leadingIsClose: false, onBack: vi.fn(), isEditMode: false, onDelete: vi.fn() };
  it('photo header draws the photograph, score and rank', () => {
    const { container } = render(<ReviewComposerHeader {...props} form="photo" facts={{ avg: 8.64, count: 12, rank: '#16 World' }} />);
    expect(container.querySelector('[data-photo-header] img')?.getAttribute('src')).toBe(props.thumbnail);
    expect(container.querySelector('[data-header-score] b')?.textContent).toBe('8.6');
    expect(container.querySelector('[data-header-rank]')?.textContent).toBe('#16 World');
    expect(container.querySelector('header')?.getAttribute('data-header-form')).toBe('photo');
  });
  it('omits the score at 0 reviews and the rank when none', () => {
    const { container } = render(<ReviewComposerHeader {...props} form="photo" facts={{ avg: null, count: 0, rank: null }} />);
    expect(container.querySelector('[data-header-score]')).toBeNull();
    expect(container.querySelector('[data-header-rank]')).toBeNull();
    expect(headerScore({ avg: 9, count: 0, rank: null })).toBeNull();
  });
  it('compact header carries region only at 0 reviews and keeps delete in edit mode', () => {
    const { container, getAllByRole } = render(<ReviewComposerHeader {...props} form="compact" isEditMode facts={{ avg: null, count: 0, rank: null }} />);
    expect(container.querySelector('[data-photo-header]')).toBeNull();
    expect(container.querySelector('[data-compact-meta]')?.textContent).toBe('Fife, Scotland');
    expect(getAllByRole('button')).toHaveLength(2);
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
  metadata: {}, rounds: [], chosenRound: null, chooseRound: vi.fn(),
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
