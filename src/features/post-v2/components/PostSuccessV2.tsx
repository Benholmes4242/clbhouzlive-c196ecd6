// PostSuccessV2 - immersive amber-tinted overlay confirming a post outcome.
// Three variants:
//   - 'uploading' (media in flight): ProgressRing tracks the controller.
//     Phase-driven: running / complete (amber -> green + check) / failed.
//   - 'scheduled' (text-only or media): calendar glyph confirmation.
//   - 'published' (text-only): green check confirmation.
// Transient moment: tap anywhere to close; complete auto-dismisses at 1200ms.

import { useEffect, useState } from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SubmitResult } from '../hooks/usePostSubmit';
import { formatSchedule } from '../lib/formatSchedule';
import { subscribeToJob, getJobSnapshot } from '../lib/postUploadController';
import { ImmersiveSuccessShell } from './ImmersiveSuccessShell';

const AMBER = '#F7931E';
const GREEN = '#22C55E';
const NEUTRAL = 'rgba(255,255,255,0.5)';

interface Props {
  result: SubmitResult;
  onDone: () => void;
}

export default function PostSuccessV2({ result, onDone }: Props) {
  const { t } = useTranslation(['composer', 'common']);

  if (result.kind === 'uploading') {
    return <UploadingState result={result} onDone={onDone} />;
  }

  if (result.kind === 'scheduled') {
    const label = result.scheduledAt
      ? t('composer:success.scheduledFor', { when: formatSchedule(new Date(result.scheduledAt)) })
      : t('composer:success.scheduled');
    return (
      <ImmersiveSuccessShell onTapClose={onDone} showTapHint>
        <Column>
          <GlyphTile accent={AMBER}>
            <Clock size={44} color={AMBER} strokeWidth={2.25} />
          </GlyphTile>
          <Label>{label}</Label>
          <Copy>{t('composer:success.scheduledBody')}</Copy>
        </Column>
      </ImmersiveSuccessShell>
    );
  }

  // published (text-only)
  return (
    <ImmersiveSuccessShell onTapClose={onDone} showTapHint>
      <Column>
        <GlyphTile accent={GREEN}>
          <Check size={48} color={GREEN} strokeWidth={2.5} />
        </GlyphTile>
        <Label>{t('composer:success.posted')}</Label>
        <Copy>{t('composer:success.postedBody')}</Copy>
      </Column>
    </ImmersiveSuccessShell>
  );
}

type Phase = 'running' | 'complete' | 'failed';

function UploadingState({ result, onDone }: Props) {
  const { t } = useTranslation(['composer', 'common']);
  if (result.kind !== 'uploading') return null;
  const jobId = result.jobId ?? null;
  const initial = jobId ? getJobSnapshot(jobId) : null;
  const [progress, setProgress] = useState<number>(initial?.overallProgress ?? 0);
  const [phase, setPhase] = useState<Phase>((initial?.phase as Phase) ?? 'running');
  const [errorText, setErrorText] = useState<string | null>(initial?.error ?? null);

  useEffect(() => {
    if (!jobId) return;
    return subscribeToJob(jobId, (s) => {
      setProgress(s.overallProgress);
      setPhase(s.phase as Phase);
      if (s.error) setErrorText(s.error);
    });
  }, [jobId]);

  // Auto-dismiss shortly after completion so the user does not need to tap.
  useEffect(() => {
    if (phase !== 'complete') return;
    const t = window.setTimeout(() => onDone(), 1200);
    return () => window.clearTimeout(t);
  }, [phase, onDone]);

  const isScheduled = !!result.isScheduled;

  if (phase === 'complete') {
    const label = isScheduled ? 'Scheduled' : 'Posted';
    const copy = isScheduled
      ? "It is queued and will go out on time."
      : "It is live. Pull to refresh if you don't see it yet.";
    return (
      <ImmersiveSuccessShell onTapClose={onDone} showTapHint>
        <Column>
          <RingTile progress={100} accent={GREEN} showCheck />
          <Label>{label}</Label>
          <Copy>{copy}</Copy>
        </Column>
      </ImmersiveSuccessShell>
    );
  }

  if (phase === 'failed') {
    const copy = errorText || 'Something went wrong - your post was not published.';
    return (
      <ImmersiveSuccessShell onTapClose={onDone}>
        <Column>
          <GlyphTile accent={NEUTRAL} noGlow>
            <AlertTriangle size={40} color="rgba(255,255,255,0.85)" strokeWidth={2.25} />
          </GlyphTile>
          <Label>Upload failed</Label>
          <Copy>{copy}</Copy>
          <DonePill onClick={onDone} />
        </Column>
      </ImmersiveSuccessShell>
    );
  }

  return (
    <ImmersiveSuccessShell onTapClose={onDone}>
      <Column>
        <RingTile progress={progress} accent={AMBER} />
        <Label>{isScheduled ? 'Scheduled' : 'Posting...'}</Label>
        <Copy>
          {isScheduled && result.scheduledAt
            ? `Uploading - it'll go out ${formatSchedule(new Date(result.scheduledAt))}.`
            : "Uploading - we'll take it from here. You can keep using the app."}
        </Copy>
        <DonePill onClick={onDone} />
      </Column>
    </ImmersiveSuccessShell>
  );
}

// ---------- pieces ----------

function Column({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 22, maxWidth: 340, width: '100%', textAlign: 'center',
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 21, fontWeight: 800, letterSpacing: '-0.01em',
      color: 'rgba(255,255,255,0.96)', lineHeight: 1.15,
    }}>{children}</div>
  );
}

function Copy({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 13.5, color: 'rgba(255,255,255,0.62)',
      lineHeight: 1.5, maxWidth: 300,
    }}>{children}</div>
  );
}

function DonePill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        marginTop: 8,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.96)',
        borderRadius: 999,
        padding: '10px 24px',
        fontSize: 13.5,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      Done
    </button>
  );
}

function GlyphTile({ accent, noGlow, children }: { accent: string; noGlow?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      width: 104, height: 104,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: noGlow ? undefined : `drop-shadow(0 0 24px ${accent}55) drop-shadow(0 0 8px ${accent}66)`,
    }}>
      {children}
    </div>
  );
}

function RingTile({ progress, accent, showCheck }: { progress: number; accent: string; showCheck?: boolean }) {
  const size = 104;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, progress));
  const dashOffset = clamped === 0 ? c * 0.75 : c - (c * clamped) / 100;
  return (
    <div style={{
      width: size, height: size,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      filter: `drop-shadow(0 0 24px ${accent}55) drop-shadow(0 0 8px ${accent}66)`,
      transition: 'filter 400ms ease',
    }}>
      <svg width={size - 20} height={size - 20} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={accent} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 300ms ease, stroke 400ms ease',
            animation: clamped === 0 ? 'pv2-ring-spin 1.2s linear infinite' : undefined,
            transformOrigin: `${size/2}px ${size/2}px`,
          }}
        />
      </svg>
      {showCheck && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pv2-check-draw 400ms ease-out both',
        }}>
          <Check size={44} color={accent} strokeWidth={2.75} />
        </div>
      )}
      <style>{`
        @keyframes pv2-ring-spin { to { transform: rotate(360deg); } }
        @keyframes pv2-check-draw {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
