import React from 'react';
import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const h = vi.hoisted(() => ({ track: vi.fn(), invoke: vi.fn(async () => ({ data: { text: 'ok' }, error: null })) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: h.invoke } } }));
import { useTextClearedTracking } from '@/features/review-v2/hooks/useTextClearedTracking';
import { transcribeAudio } from '@/lib/transcribeAudio';
import { appendPrompt, whisperPrompt } from '../../supabase/functions/voice-to-text/audioFormat';
import { EVENT_LABELS } from '@/features/admin/lib/eventLabels';

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
const blob = { type: 'audio/mp4', arrayBuffer: async () => new Uint8Array([1, 2]).buffer } as Blob;

describe('voice review hint and clearing', () => {
  it('clearing dictated text tracks review_text_cleared with after_voice true', () => {
    const { result, rerender } = renderHook(({ text }) => useTextClearedTracking(text, true), { initialProps: { text: '' } });
    act(() => result.current());
    rerender({ text: 'Great greens' });
    rerender({ text: '' });
    expect(h.track).toHaveBeenCalledTimes(1);
    expect(h.track).toHaveBeenCalledWith('review_text_cleared', { from_len: 12, after_voice: true });
  });
  it('typed-only clearing reports after_voice false', () => {
    const { rerender } = renderHook(({ text }) => useTextClearedTracking(text, true), { initialProps: { text: 'abc' } });
    rerender({ text: '' });
    expect(h.track).toHaveBeenCalledWith('review_text_cleared', { from_len: 3, after_voice: false });
  });
  it('transcribeAudio forwards prompt, and omits it when absent', async () => {
    await transcribeAudio(blob, { prompt: 'A golf course review of St Andrews Links (Old).' });
    expect(h.invoke).toHaveBeenLastCalledWith('voice-to-text', { body: { audio: 'AQI=', mimeType: 'audio/mp4', prompt: 'A golf course review of St Andrews Links (Old).' } });
    await transcribeAudio(blob);
    expect(h.invoke).toHaveBeenLastCalledWith('voice-to-text', { body: { audio: 'AQI=', mimeType: 'audio/mp4' } });
  });
  it('edge function adds prompt only when present, trimmed to 200 chars', () => {
    const with_ = new FormData(); appendPrompt(with_, whisperPrompt(`  ${'x'.repeat(250)}  `));
    expect(with_.get('prompt')).toBe('x'.repeat(200));
    const without = new FormData(); appendPrompt(without, whisperPrompt(undefined));
    expect(without.has('prompt')).toBe(false);
    const blank = new FormData(); appendPrompt(blank, whisperPrompt('   '));
    expect(blank.has('prompt')).toBe(false);
  });
  it('eventLabels has the three labels', () => {
    expect(EVENT_LABELS.review_voice_finished).toBe('Review voice finished');
    expect(EVENT_LABELS.review_voice_failed).toBe('Review voice failed');
    expect(EVENT_LABELS.review_text_cleared).toBe('Review text cleared');
  });
});
