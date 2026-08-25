/**
 * VoiceDictateButton — Words-section dictation control with live signal.
 *
 * States:
 *   idle       -> compact pill: mic + "Dictate"
 *   listening  -> live strip: pulsing red dot, waveform (AnalyserNode on
 *                 the recorder's live MediaStream), mm:ss timer, stop button
 *   processing -> flat shimmer bars + "Transcribing..." secondary label
 *
 * Transcript APPENDS to caller state via onAppend.
 * Respects prefers-reduced-motion (static bars/dot, no pulse).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/transcribeAudio';
import { RV2 } from '../tokens';

interface Props {
  onAppend: (text: string) => void;
}

const BAR_COUNT = 24;
const AMBER = RV2.amber;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Live waveform driven by an AnalyserNode on the recorder's MediaStream. */
function LiveWaveform({
  stream,
  reduced,
}: {
  stream: MediaStream | null;
  reduced: boolean;
}) {
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0));
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!stream || reduced) return;

    const AudioCtor: typeof AudioContext =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128; // 64 frequency bins
    analyser.smoothingTimeConstant = 0.75;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const smoothed = new Array<number>(BAR_COUNT).fill(0);

    const tick = (t: number) => {
      // Cap ~30fps
      if (t - lastFrameRef.current < 32) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrameRef.current = t;
      analyser.getByteFrequencyData(data);

      // Bucket 64 bins into BAR_COUNT bars (focus on lower bins where voice sits)
      const usable = Math.min(data.length, 48);
      const perBar = Math.max(1, Math.floor(usable / BAR_COUNT));
      const next = new Array<number>(BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < perBar; j++) {
          sum += data[i * perBar + j] ?? 0;
        }
        const avg = sum / perBar / 255; // 0..1
        // Smooth + slight boost so speech is legible
        const eased = Math.min(1, Math.pow(avg, 0.75) * 1.3);
        smoothed[i] = smoothed[i] * 0.5 + eased * 0.5;
        next[i] = smoothed[i];
      }
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      try { source.disconnect(); } catch { /* noop */ }
      try { analyser.disconnect(); } catch { /* noop */ }
      ctx.close().catch(() => { /* noop */ });
      ctxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      setLevels(new Array(BAR_COUNT).fill(0));
    };
  }, [stream, reduced]);

  const bars = reduced
    ? new Array(BAR_COUNT).fill(0.35)
    : levels;

  return (
    <div
      aria-hidden
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        height: 22,
      }}
    >
      {bars.map((v, i) => {
        const h = Math.max(2, Math.round(2 + v * 20));
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 2,
              height: h,
              borderRadius: 1,
              background: AMBER,
              opacity: reduced ? 0.55 : 0.35 + v * 0.65,
              transition: reduced ? 'none' : 'height 60ms linear, opacity 60ms linear',
            }}
          />
        );
      })}
    </div>
  );
}

/** Flat shimmer strip shown during transcription. */
function ProcessingStrip({ reduced }: { reduced: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: 22,
        opacity: 0.85,
      }}
    >
      {new Array(BAR_COUNT).fill(0).map((_, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 2,
            height: 6,
            borderRadius: 1,
            background: `linear-gradient(90deg, rgba(247,147,30,0.35), rgba(247,147,30,0.75), rgba(247,147,30,0.35))`,
            backgroundSize: '200% 100%',
            animation: reduced ? 'none' : 'rv2-shimmer 1.6s ease-in-out infinite',
            animationDelay: `${(i % 6) * 60}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes rv2-shimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes rv2-pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.25); opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}

export function VoiceDictateButton({ onAppend }: Props) {
  const rec = useVoiceRecorder();
  const [processing, setProcessing] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!rec.audioBlob) return;
    let cancelled = false;
    setProcessing(true);
    transcribeAudio(rec.audioBlob)
      .then((text) => {
        if (cancelled) return;
        const trimmed = text.trim();
        if (trimmed) onAppend(trimmed);
      })
      .catch(() => { /* silent */ })
      .finally(() => {
        if (!cancelled) {
          setProcessing(false);
          rec.resetRecording();
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.audioBlob]);

  const listening = rec.isRecording;

  // Idle pill
  if (!listening && !processing) {
    return (
      <button
        type="button"
        onClick={() => rec.startRecording()}
        aria-label="Dictate"
        title="Dictate"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 28,
          padding: '0 10px',
          borderRadius: 999,
          border: `1px solid ${RV2.hairlineStrong}`,
          background: RV2.ghost,
          color: RV2.ink,
          /* CAPS ACTION (§5) — 'Dictate' two points down at the floor. */
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          cursor: 'pointer',
        }}
      >
        <Mic size={16} />
        <span>Dictate</span>
      </button>
    );
  }

  // Live strip (listening OR processing)
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 220,
        height: 32,
        padding: '0 8px 0 10px',
        borderRadius: 999,
        border: `1px solid ${AMBER}`,
        background: 'rgba(247,147,30,0.08)',
      }}
    >
      {/* Red dot (listening) or steady amber dot (processing) */}
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: listening ? RV2.danger : AMBER,
          animation:
            listening && !reduced ? 'rv2-pulse-dot 1s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      />

      {listening ? (
        <LiveWaveform stream={rec.stream} reduced={reduced} />
      ) : (
        <ProcessingStrip reduced={reduced} />
      )}

      {listening ? (
        <>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: RV2.ink,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 32,
              textAlign: 'right',
            }}
          >
            {formatTime(rec.duration)}
          </span>
          <button
            type="button"
            onClick={() => rec.stopRecording()}
            aria-label="Stop dictation"
            title="Stop dictation"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 999,
              border: 'none',
              background: AMBER,
              color: RV2.dark,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Square size={12} fill="currentColor" />
          </button>
        </>
      ) : (
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: RV2.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          Transcribing...
        </span>
      )}
    </div>
  );
}
