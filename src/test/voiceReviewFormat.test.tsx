import { act, renderHook, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const invoke = vi.hoisted(() => vi.fn(async () => ({ data: { text: 'Great greens' }, error: null })));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/transcribeAudio';
import { audioFormat } from '../../supabase/functions/voice-to-text/audioFormat';
import { EVENT_LABELS } from '@/features/admin/lib/eventLabels';

describe('voice recording format', () => {
  let supported: string | null;
  let options: MediaRecorderOptions | undefined;
  let count: number;
  class Recorder {
    static isTypeSupported(type: string) { return type === supported; }
    mimeType: string;
    ondataavailable?: (event: { data: Blob }) => void;
    onstop?: () => void;
    state = 'recording';
    constructor(_stream: MediaStream, opts?: MediaRecorderOptions) { options = opts; count = arguments.length; this.mimeType = opts?.mimeType ?? 'audio/mp4'; }
    start() {}
    stop() { this.ondataavailable?.({ data: new Blob(['bytes']) }); this.onstop?.(); }
  }
  beforeEach(() => {
    supported = null;
    vi.stubGlobal('MediaRecorder', Recorder);
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })) } });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:voice');
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('MP4-only device records and exposes an MP4 blob', async () => {
    supported = 'audio/mp4';
    const { result } = renderHook(useVoiceRecorder);
    await act(async () => result.current.startRecording());
    expect(options).toEqual({ mimeType: 'audio/mp4' });
    act(() => result.current.stopRecording());
    expect(result.current.audioBlob?.type).toBe('audio/mp4');
    expect(result.current.mimeType).toBe('audio/mp4');
  });
  it('no supported preference constructs the recorder without MIME options', async () => {
    const { result } = renderHook(useVoiceRecorder);
    await act(async () => result.current.startRecording());
    expect(count).toBe(1);
    expect(options).toBeUndefined();
    act(() => result.current.stopRecording());
    expect(result.current.audioBlob?.type).toBe('audio/mp4');
  });
});
it('transcription sends the blob MIME type', async () => {
  const blob = { type: 'audio/mp4', arrayBuffer: async () => new Uint8Array([1, 2]).buffer } as Blob;
  await transcribeAudio(blob);
  expect(invoke).toHaveBeenCalledWith('voice-to-text', { body: { audio: 'AQI=', mimeType: 'audio/mp4' } });
});
it('Whisper filenames match MIME and missing MIME defaults to webm', () => {
  expect(audioFormat('audio/mp4')).toEqual({ mimeType: 'audio/mp4', filename: 'audio.m4a' });
  expect(audioFormat('audio/webm;codecs=opus').filename).toBe('audio.webm');
  expect(audioFormat().filename).toBe('audio.webm');
  expect(audioFormat('audio/aac').filename).toBe('audio.m4a');
  expect(audioFormat('audio/ogg').filename).toBe('audio.ogg');
  expect(audioFormat('audio/wav').filename).toBe('audio.wav');
  expect(audioFormat('audio/mpeg').filename).toBe('audio.mp3');
});
it('admin labels include both voice outcomes', () => {
  expect(EVENT_LABELS.review_voice_finished).toBe('Review voice finished');
  expect(EVENT_LABELS.review_voice_failed).toBe('Review voice failed');
});