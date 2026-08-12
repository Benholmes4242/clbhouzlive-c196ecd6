// PostSuccessV2 - immersive amber-tinted overlay confirming a post outcome.
// Three variants:
//   - 'uploading' (media in flight): ProgressRing tracks the controller.
//     Phase-driven: running / complete (amber -> green + check) / failed.
//   - 'scheduled' (text-only or media): calendar glyph confirmation.
//   - 'published' (text-only): green check confirmation.
// Transient moment: tap anywhere to close; complete auto-dismisses at 1200ms.

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SubmitResult } from '../hooks/usePostSubmit';
import { formatSchedule } from '../lib/formatSchedule';
import { subscribeToJob, getJobSnapshot } from '../lib/postUploadController';
import { ImmersiveSuccessShell } from './ImmersiveSuccessShell';
import { CT } from '@/features/_shared/composerTokens';

const AMBER = CT.amber;
/** On-dark green: the shell's accent, the top bar at 100%, the LIVE kicker. */
const GREEN_ON_DARK = CT.successOnDark;
const NEUTRAL = 'rgba(255,255,255,0.5)';

interface Props {
  result: SubmitResult;
  onDone: () => void;
}

export default function PostSuccessV2({ result, onDone }: Props) {
  const { t } = useTranslation(['composer', 'common']);

  // Auto-dismiss the terminal (non-uploading) variants so edit-save success
  // closes itself if the user does not tap. Mirrors UploadingState's 1200ms
  // auto-dismiss. Tap remains the immediate path.
  const isTerminal = result.kind === 'scheduled' || result.kind === 'published';
  useEffect(() => {
    if (!isTerminal) return;
    const id = window.setTimeout(() => onDone(), 1200);
    return () => window.clearTimeout(id);
  }, [isTerminal, onDone]);

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

  // published (text-only, and the edit-save path)
  return <PostedScreen result={result} onDone={onDone} />;
}

/**
 * POSTED - minimal treatment. Green shell, green 2px bar at 100%, bottom
 * anchored copy. The strip states only what is TRUE for this post; with fewer
 * than two true cells the strip and its hairline are omitted entirely.
 */
function PostedScreen({ result, onDone }: Props) {
  const { t } = useTranslation(['composer', 'common']);
  const cells = postedCells(result, t);
  return (
    <ImmersiveSuccessShell accent={GREEN_ON_DARK} onTapClose={onDone} showTapHint padded={false}>
      <TopBar progress={100} color={GREEN_ON_DARK} />
      <BottomBlock>
        <Kicker color={GREEN_ON_DARK}>{t('composer:success.liveKicker')}</Kicker>
        <Headline>{result.courseName || t('composer:success.posted')}</Headline>
        {cells.length >= 2 && <Strip cells={cells} />}
      </BottomBlock>
    </ImmersiveSuccessShell>
  );
}

/** Figure cells for the posted strip. Never a zero, never a placeholder. */
function postedCells(result: SubmitResult, t: (k: string) => string): StripCell[] {
  const cells: StripCell[] = [];
  const r = result.round;
  if (r) {
    if (r.gross != null) cells.push({ label: t('composer:success.statGross'), value: String(r.gross) });
    if (r.toPar != null) {
      cells.push({
        label: t('composer:success.statToPar'),
        value: fmtToPar(r.toPar),
        color: r.toPar < 0 ? GREEN_ON_DARK : undefined,
      });
    }
    if (r.birdies != null && r.birdies > 0) {
      cells.push({ label: t('composer:success.statBirdies'), value: String(r.birdies) });
    }
    return cells.slice(0, 3);
  }
  if (result.photoCount) {
    cells.push({ label: t('composer:success.statPhotos'), value: String(result.photoCount) });
  }
  if (result.videoCount) {
    cells.push({ label: t('composer:success.statVideos'), value: String(result.videoCount) });
  }
  return cells.slice(0, 3);
}

/** True minus U+2212, and "E" for level. */
function fmtToPar(n: number): string {
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`;
}

type Phase = 'running' | 'complete' | 'failed';

function UploadingState({ result, onDone }: Props) {
  const { t } = useTranslation(['composer', 'common']);
  const isUploadingKind = result.kind === 'uploading';
  const jobId = isUploadingKind ? (result.jobId ?? null) : null;
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
    if (!isUploadingKind) return;
    if (phase !== 'complete') return;
    const t = window.setTimeout(() => onDone(), 1200);
    return () => window.clearTimeout(t);
  }, [isUploadingKind, phase, onDone]);

  if (!isUploadingKind) return null;

  const isScheduled = !!result.isScheduled;

  if (phase === 'complete') {
    // Scheduled keeps its own amber copy; posted becomes the green screen.
    if (isScheduled) {
      return (
        <ImmersiveSuccessShell onTapClose={onDone} showTapHint padded={false}>
          <TopBar progress={100} color={AMBER} />
          <BottomBlock>
            <Kicker>{t('composer:success.scheduled')}</Kicker>
            <Headline>{result.courseName || t('composer:success.scheduled')}</Headline>
            <Body>{t('composer:success.scheduledBody')}</Body>
          </BottomBlock>
        </ImmersiveSuccessShell>
      );
    }
    return <PostedScreen result={result} onDone={onDone} />;
  }

  if (phase === 'failed') {
    const copy = errorText || t('composer:success.uploadFailedFallback');
    return (
      <ImmersiveSuccessShell onTapClose={onDone}>
        <Column>
          <GlyphTile accent={NEUTRAL} noGlow>
            <AlertTriangle size={40} color="rgba(255,255,255,0.85)" strokeWidth={2.25} />
          </GlyphTile>
          <Label>{t('composer:success.uploadFailed')}</Label>
          <Copy>{copy}</Copy>
          <DonePill onClick={onDone} />
        </Column>
      </ImmersiveSuccessShell>
    );
  }

  return (
    <ImmersiveSuccessShell onTapClose={onDone} padded={false}>
      <TopBar progress={progress} color={AMBER} />
      <BottomBlock>
        <Kicker>
          {isScheduled
            ? t('composer:success.scheduledKicker', { n: Math.round(progress) })
            : t('composer:success.uploadingKicker', { n: Math.round(progress) })}
        </Kicker>
        <Headline>{result.courseName || t('composer:success.posting')}</Headline>
        <Body>
          {isScheduled && result.scheduledAt
            ? t('composer:success.uploadingScheduledBody', { when: formatSchedule(new Date(result.scheduledAt)) })
            : t('composer:success.uploadingBody')}
        </Body>
        <div style={{ marginTop: 4 }}>
          <DonePill onClick={onDone} />
        </div>
      </BottomBlock>
    </ImmersiveSuccessShell>
  );
}

// ---------- minimal treatment pieces ----------

/** 2px determinate bar pinned to the very top edge, full width, no radius. */
function TopBar({ progress, color }: { progress: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'rgba(255,255,255,0.10)',
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          background: color,
          transition: 'width 300ms ease, background 400ms ease',
        }}
      />
    </div>
  );
}

/** Bottom-anchored, left-aligned content block. */
function BottomBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 'auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        gap: 10,
        padding: 28,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)',
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ color, children }: { color?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: color ?? 'rgba(255,255,255,0.38)',
      }}
    >
      {children}
    </div>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.15,
        color: 'rgba(255,255,255,0.96)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: 'rgba(255,255,255,0.55)' }}>
      {children}
    </div>
  );
}

interface StripCell { label: string; value: string; color?: string }

function Strip({ cells }: { cells: StripCell[] }) {
  return (
    <div
      style={{
        marginTop: 8,
        width: '100%',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        paddingTop: 14,
        display: 'flex',
        gap: 30,
      }}
    >
      {cells.map((c) => (
        <div key={c.label} style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: c.color ?? 'rgba(255,255,255,0.96)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {c.value}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 7.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.38)',
            }}
          >
            {c.label}
          </div>
        </div>
      ))}
    </div>
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
      fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em',
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
  const { t } = useTranslation('common');
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
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
      {t('action.done')}
    </button>
  );
}

function GlyphTile({ accent, noGlow, children }: { accent: string; noGlow?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      width: 104, height: 104,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: CT.cardRadius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: noGlow ? undefined : `drop-shadow(0 0 24px ${accent}55) drop-shadow(0 0 8px ${accent}66)`,
    }}>
      {children}
    </div>
  );
}
