/**
 * VoiceDictateButton — Words-section dictation control with live signal.
 *
 * States:
 *   idle       -> compact pill: mic + "Say more" (or the Say it / Type it chooser)
 *   listening  -> live strip: pulsing red dot, waveform (AnalyserNode on
 *                 the recorder's live MediaStream), mm:ss timer, stop button
 *   processing -> flat shimmer bars + "Transcribing..." secondary label
 *
 * Transcript APPENDS to caller state via onAppend.
 * Respects prefers-reduced-motion (static bars/dot, no pulse).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Mic, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/transcribeAudio';
import { RV2 } from '../tokens';

interface Props {
  onAppend: (text: string) => void;
  /** 'pill' (default) = compact inline control. 'chooser' = the empty-field
   *  presentation: Say it / Type it cards, full-width live states. Same
   *  recorder and transcribe path in both — two presentations, one implementation. */
  idleVariant?: 'pill' | 'chooser' | 'hero';
  /** Chooser only: "Type it". Must not touch the recorder. */
  onChooseType?: () => void;
  /** Hero only: the box already holds words ("Speak to add more"). */
  hasText?: boolean;
  /** Reports recording-or-transcribing so the composer can fold its header. */
  onActiveChange?: (active: boolean) => void;
  /** Hero only: fired when a recording starts from the card. */
  onStart?: () => void;
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
  height = 22,
}: {
  stream: MediaStream | null;
  reduced: boolean;
  height?: number;
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
        height,
      }}
    >
      {bars.map((v, i) => {
        const h = Math.max(2, Math.round(2 + v * (height - 2)));
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

export function VoiceDictateButton({ onAppend, idleVariant = 'pill', onChooseType, hasText = false, onActiveChange, onStart }: Props) {
  const { t } = useTranslation('courses');
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
  const active = listening || processing;
  useEffect(() => { onActiveChange?.(active); }, [active, onActiveChange]);
  /** The ONE start path — the pill and the chooser's "Say it" both call this. */
  const startRecording = () => rec.startRecording();
  const chooser = idleVariant === 'chooser';
  const sayMore = t('review.wizard.step2.sayMore');

  if (idleVariant === 'hero') {
    return (
      <SpeakHeroCard
        state={listening ? 'listening' : processing ? 'writing' : 'idle'}
        hasText={hasText}
        duration={rec.duration}
        stream={rec.stream}
        reduced={reduced}
        onPress={() => {
          if (listening) { rec.stopRecording(); return; }
          if (processing) return;
          onStart?.();
          startRecording();
        }}
      />
    );
  }

  // Idle chooser (empty field)
  if (chooser && !listening && !processing) {
    const card: React.CSSProperties = {
      flex: 1,
      border: `1px solid ${RV2.hairline}`,
      borderRadius: 14,
      padding: '16px 12px',
      textAlign: 'center',
      background: 'transparent',
      cursor: 'pointer',
    };
    const circle: React.CSSProperties = {
      width: 40,
      height: 40,
      borderRadius: 999,
      margin: '0 auto',
      display: 'grid',
      placeItems: 'center',
    };
    const title: React.CSSProperties = { marginTop: 10, fontSize: 14, fontWeight: 600, color: RV2.ink };
    const sub: React.CSSProperties = { marginTop: 3, fontSize: 11.5, lineHeight: 1.4, color: RV2.secondary };
    return (
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button
          type="button"
          onClick={startRecording}
          style={{ ...card, borderColor: 'rgba(247,147,30,0.45)', background: 'rgba(247,147,30,0.07)' }}
        >
          <div style={{ ...circle, background: RV2.amber, color: '#1A1205' }}>
            <Mic size={20} />
          </div>
          <div style={title}>{t('review.wizard.step2.sayItTitle')}</div>
          <div style={sub}>{t('review.wizard.step2.sayItSub')}</div>
        </button>
        <button type="button" onClick={() => onChooseType?.()} style={card}>
          <div style={{ ...circle, background: 'rgba(255,255,255,0.07)', color: RV2.ink }}>
            <Keyboard size={20} />
          </div>
          <div style={title}>{t('review.wizard.step2.typeItTitle')}</div>
          <div style={sub}>{t('review.wizard.step2.typeItSub')}</div>
        </button>
      </div>
    );
  }

  // Idle pill
  if (!listening && !processing) {
    return (
      <button
        type="button"
        onClick={startRecording}
        aria-label={sayMore}
        title={sayMore}
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
        <span>{sayMore}</span>
      </button>
    );
  }

  // Live strip (listening OR processing). In the chooser variant only the
  // container changes: full width, the chooser's border/radius/padding.
  const strip = (
    <div
      role="status"
      aria-live="polite"
      style={chooser ? {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        boxSizing: 'border-box',
        padding: '16px 12px',
        borderRadius: 14,
        border: `1px solid ${RV2.hairline}`,
      } : {
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

  if (!chooser) return strip;
  return (
    <div style={{ width: '100%' }}>
      {strip}
      {listening && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: RV2.secondary }}>
          {t('review.wizard.step2.recordingHint')}
        </div>
      )}
    </div>
  );
}

/** STEP 1 HERO CARD (BRIEF_REVIEW_STEP_ONE §3). One button over the same
 * recorder and transcribe path as the pill and chooser; words arrive only when
 * transcription returns. Four states: idle (empty / has text), listening, writing. */
function SpeakHeroCard({ state, hasText, duration, stream, reduced, onPress }: {
  state: 'idle' | 'listening' | 'writing';
  hasText: boolean;
  duration: number;
  stream: MediaStream | null;
  reduced: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation('courses');
  const live = state !== 'idle';
  const k = 'review.wizard.stepOne.';
  const title = state === 'listening' ? t(`${k}listeningTitle`) : state === 'writing' ? t(`${k}writingTitle`)
    : hasText ? t(`${k}speakMoreTitle`) : t(`${k}speakTitle`);
  const sub = state === 'listening' ? t(`${k}listeningSub`) : state === 'writing' ? t(`${k}writingSub`)
    : hasText ? t(`${k}speakMoreSub`) : t(`${k}speakSub`);
  const heroState = state === 'idle' ? (hasText ? 'idle-more' : 'idle') : state;
  return (
    <button
      type="button"
      onClick={onPress}
      data-speak-state={heroState}
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
      style={{
        display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'left',
        borderRadius: 18, padding: 16, cursor: 'pointer', color: '#F8FAFC',
        background: live ? 'rgba(247,147,30,0.10)' : 'rgba(247,147,30,0.07)',
        border: `1.5px solid ${live ? 'rgba(247,147,30,0.60)' : 'rgba(247,147,30,0.32)'}`,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          data-speak-circle
          aria-hidden
          style={{
            width: 56, height: 56, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center',
            background: state === 'writing' ? 'rgba(247,147,30,0.35)' : '#F7931E',
            boxShadow: state === 'listening' ? '0 0 0 7px rgba(247,147,30,0.18)' : 'none',
          }}
        >
          {state === 'idle' && <Mic size={26} strokeWidth={2.2} color="#0A0A0C" />}
          {state === 'listening' && <span data-speak-stop style={{ width: 18, height: 18, borderRadius: 4, background: '#0A0A0C' }} />}
          {state === 'writing' && (
            <span
              data-speak-spinner
              style={{
                width: 22, height: 22, boxSizing: 'border-box', borderRadius: 999,
                border: '3px solid rgba(10,10,12,0.25)', borderTopColor: '#0A0A0C',
                animation: reduced ? 'none' : 'rv2-hero-spin 0.9s linear infinite',
              }}
            />
          )}
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
          <span data-speak-title style={{ display: 'block', fontSize: 17, fontWeight: 700, color: '#F8FAFC' }}>{title}</span>
          <span data-speak-sub style={{ display: 'block', marginTop: 4, fontSize: 12.5, lineHeight: 1.4, color: 'rgba(248,250,252,0.62)' }}>{sub}</span>
        </span>
        {state === 'listening' && (
          <span data-speak-timer style={{ fontSize: 13, fontWeight: 700, color: '#F7931E', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {formatTime(duration)}
          </span>
        )}
      </span>
      {state === 'listening' && (
        <span data-speak-wave style={{ display: 'flex', marginTop: 12, width: '100%' }}>
          <LiveWaveform stream={stream} reduced={reduced} height={24} />
        </span>
      )}
      <style>{`@keyframes rv2-hero-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
