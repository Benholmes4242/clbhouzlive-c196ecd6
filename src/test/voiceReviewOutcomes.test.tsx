import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const h = vi.hoisted(() => ({ blob: null as Blob | null, error: null as string | null, transcribe: vi.fn(), track: vi.fn(), toast: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useVoiceRecorder', () => ({ useVoiceRecorder: () => ({ audioBlob: h.blob, error: h.error, isRecording: false, stream: null, duration: 0, resetRecording: vi.fn(), startRecording: vi.fn() }) }));
vi.mock('@/lib/transcribeAudio', () => ({ transcribeAudio: h.transcribe }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/lib/toast', () => ({ toast: { error: h.toast } }));
import { VoiceDictateButton } from '@/features/review-v2/components/VoiceDictateButton';
const message = "Couldn't catch that. Try again, or type it instead.";
beforeEach(() => { vi.clearAllMocks(); h.blob = new Blob(['audio'], { type: 'audio/mp4' }); h.error = null; });
afterEach(cleanup);
describe('review voice outcomes', () => {
  it('appends Great greens and tracks twelve characters without transcript content', async () => {
    h.transcribe.mockResolvedValue('Great greens'); const append = vi.fn();
    render(<VoiceDictateButton onAppend={append} />);
    await waitFor(() => expect(append).toHaveBeenCalledWith('Great greens'));
    expect(h.track).toHaveBeenCalledWith('review_voice_finished', { chars: 12, empty: false, ms: expect.any(Number), mime: 'audio/mp4' });
    expect(h.toast).not.toHaveBeenCalled();
  });
  it('empty transcript tracks empty and shows retry toast', async () => {
    h.transcribe.mockResolvedValue(''); const append = vi.fn(); render(<VoiceDictateButton onAppend={append} />);
    await waitFor(() => expect(h.toast).toHaveBeenCalledWith(message));
    expect(h.track).toHaveBeenCalledWith('review_voice_finished', { chars: 0, empty: true, ms: expect.any(Number), mime: 'audio/mp4' });
    expect(append).not.toHaveBeenCalled();
  });
  it('rejection tracks failure and appends nothing', async () => {
    h.transcribe.mockRejectedValue(new Error('Network error')); const append = vi.fn(); render(<VoiceDictateButton onAppend={append} />);
    await waitFor(() => expect(h.toast).toHaveBeenCalledWith(message));
    expect(h.track).toHaveBeenCalledWith('review_voice_failed', { reason: 'Network error', ms: expect.any(Number), mime: 'audio/mp4' });
    expect(append).not.toHaveBeenCalled();
  });
  it('recorder start failure tracks recorder_start with null MIME and shows toast', () => {
    h.blob = null; h.error = 'Permission denied'; render(<VoiceDictateButton onAppend={vi.fn()} />);
    expect(h.track).toHaveBeenCalledWith('review_voice_failed', { reason: 'recorder_start', mime: null });
    expect(h.toast).toHaveBeenCalledWith(message);
  });
});