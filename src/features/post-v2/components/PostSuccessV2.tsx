// PostSuccessV2 - immersive overlay confirming a post outcome.
//
// BRIEF_POST_COMPOSER_DARK §2. The posting and posted states are ONE
// composition: the post rendered AS A CARD (option A), centred in the shell,
// with the status beneath it. The posted state is that same card RESOLVING —
// the scrims clear and the accent moves from amber to green. Nothing about
// the shell changed: it still owns z-order, the accent radial, the status bar
// and tap-to-close.
//
// Variants:
//   - 'uploading' (media in flight): the card, scrimmed, with an honest
//     eyebrow (see honestEyebrow). Phase-driven: running / complete / failed.
//   - 'scheduled' (text-only or media): calendar glyph confirmation.
//   - 'published' (text-only, and the edit-save path): the card, resolved.

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { SubmitResult } from '../hooks/usePostSubmit';
import { formatSchedule } from '../lib/formatSchedule';
import { subscribeToJob, getJobSnapshot } from '../lib/postUploadController';
import { ImmersiveSuccessShell } from './ImmersiveSuccessShell';
import { CT, CT_DARK } from '@/features/_shared/composerTokens';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';

const AMBER = CT.amber;
/** On-dark green: the shell's accent, the LIVE eyebrow. */
const GREEN_ON_DARK = CT.successOnDark;
const NEUTRAL = 'rgba(255,255,255,0.5)';

interface Props {
  result: SubmitResult;
  onDone: () => void;
}

export default function PostSuccessV2({ result, onDone }: Props) {
  const { t } = useTranslation(['composer', 'common']);

  // Auto-dismiss the terminal (non-uploading) variants so edit-save success
  // closes itself if the user does not tap. Tap remains the immediate path.
  const isTerminal = result.kind === 'scheduled' || result.kind === 'published';
  useEffect(() => {
    if (!isTerminal) return;
    const id = window.setTimeout(() => onDone(), 2200);
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

/** POSTED — the same card, resolved. Green accent, no scrims, LIVE eyebrow. */
function PostedScreen({ result, onDone }: Props) {
  const { t } = useTranslation(['composer', 'common']);
  // The edit-save path arrives with no card facts at all — there is nothing to
  // render as a card, so it keeps the plain confirmation.
  const hasCard = !!(result.mediaPreviews?.length || (result.caption ?? '').trim() || result.actorName);
  if (!hasCard) {
    return (
      <ImmersiveSuccessShell accent={GREEN_ON_DARK} onTapClose={onDone} showTapHint>
        <Column>
          <Label>{t('composer:success.posted')}</Label>
          <Copy>{t('composer:success.postedBody')}</Copy>
        </Column>
      </ImmersiveSuccessShell>
    );
  }
  return (
    <ImmersiveSuccessShell accent={GREEN_ON_DARK} onTapClose={onDone} showTapHint>
      <Column>
        <PostCard result={result} completedFiles={result.mediaPreviews?.length ?? 0} resolved />
        <Status
          eyebrow={t('composer:success.liveKicker')}
          eyebrowColor={GREEN_ON_DARK}
          headline={t('composer:success.posted')}
        />
      </Column>
    </ImmersiveSuccessShell>
  );
}

type Phase = 'running' | 'complete' | 'failed';

function UploadingState({ result, onDone }: Props) {
  const { t } = useTranslation(['composer', 'common']);
  const isUploadingKind = result.kind === 'uploading';
  const jobId = isUploadingKind ? (result.jobId ?? null) : null;
  const initial = jobId ? getJobSnapshot(jobId) : null;
  const [completed, setCompleted] = useState<number>(initial?.completedFiles ?? 0);
  const [total, setTotal] = useState<number>(initial?.totalFiles ?? (result.mediaPreviews?.length ?? 0));
  const [phase, setPhase] = useState<Phase>((initial?.phase as Phase) ?? 'running');
  const [errorText, setErrorText] = useState<string | null>(initial?.error ?? null);

  useEffect(() => {
    if (!jobId) return;
    return subscribeToJob(jobId, (s) => {
      setCompleted(s.completedFiles);
      setTotal(s.totalFiles);
      setPhase(s.phase as Phase);
      if (s.error) setErrorText(s.error);
    });
  }, [jobId]);

  // Auto-dismiss shortly after completion so the user does not need to tap.
  // Longer than the old 1200ms: the resolved card is now worth looking at.
  useEffect(() => {
    if (!isUploadingKind) return;
    if (phase !== 'complete') return;
    const id = window.setTimeout(() => onDone(), 2400);
    return () => window.clearTimeout(id);
  }, [isUploadingKind, phase, onDone]);

  if (!isUploadingKind) return null;

  const isScheduled = !!result.isScheduled;

  if (phase === 'complete') {
    // Scheduled keeps its own amber copy; posted becomes the green card.
    if (isScheduled) {
      return (
        <ImmersiveSuccessShell onTapClose={onDone} showTapHint>
          <Column>
            <PostCard result={result} completedFiles={total} resolved />
            <Status
              eyebrow={t('composer:success.scheduled')}
              headline={result.scheduledAt ? formatSchedule(new Date(result.scheduledAt)) : t('composer:success.scheduled')}
              body={t('composer:success.scheduledBody')}
            />
          </Column>
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
    <ImmersiveSuccessShell onTapClose={onDone}>
      <Column>
        <PostCard result={result} completedFiles={completed} />
        <Status
          eyebrow={honestEyebrow(total, completed, isScheduled, t)}
          eyebrowColor={AMBER}
          headline={isScheduled ? t('composer:success.scheduled') : t('composer:success.posting')}
          reassure
          body={isScheduled && result.scheduledAt
            ? t('composer:success.uploadingScheduledBody', { when: formatSchedule(new Date(result.scheduledAt)) })
            : undefined}
        />
      </Column>
    </ImmersiveSuccessShell>
  );
}

/**
 * §2.3 — THE PROGRESS IS HONEST TO WHAT THE UPLOAD REPORTS.
 * The controller reports PER-ITEM COMPLETION reliably (completedFiles is
 * incremented after each item, sequentially, and emitted). Bytes are NOT
 * uniformly smooth: an image only reports 50 then 100, so a percentage sits
 * still for most of an image-only post. So:
 *   > 1 item  -> "UPLOADING · N OF M"  (items-completed, the honest figure)
 *   1 item    -> "UPLOADING"           (no "1 OF 1", no stuck percentage)
 */
function honestEyebrow(
  total: number,
  completed: number,
  isScheduled: boolean,
  t: (k: string, o?: Record<string, unknown>) => string,
): string {
  const stem = isScheduled ? t('composer:success.scheduled') : t('composer:success.uploadingSimple');
  if (total > 1) return `${stem} · ${Math.min(completed, total)} of ${total}`;
  return stem;
}

// ---------- the card ----------

const CARD_MAX = 344;
const CELL_GAP = 2;

/**
 * The post as it will appear in the clubhouse: media block, actor, caption,
 * course. `completedFiles` scrims the cells still in flight; `resolved` clears
 * every scrim regardless.
 */
function PostCard({ result, completedFiles, resolved }: { result: SubmitResult; completedFiles: number; resolved?: boolean }) {
  const previews = result.mediaPreviews ?? [];
  const caption = (result.caption ?? '').trim();
  return (
    <div
      style={{
        width: '100%',
        maxWidth: CARD_MAX,
        background: CT_DARK.elev,
        border: `1px solid ${CT_DARK.line}`,
        borderRadius: 18,
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
      {previews.length > 0 && (
        <MediaMosaic previews={previews} completedFiles={completedFiles} resolved={resolved} />
      )}

      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {result.actorName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <SquircleAvatar
              src={result.actorAvatarUrl ?? null}
              alt={result.actorName}
              size={26}
              fallback={result.actorName[0]}
              hairlineRing
              ringColor={DARK_HAIRLINE}
            />
            <div style={{ fontSize: 13, fontWeight: 700, color: CT_DARK.ink, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {result.actorName}
            </div>
          </div>
        )}

        {caption.length > 0 && (
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.45,
              color: CT_DARK.ink,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {caption}
          </div>
        )}

        {result.courseName && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', border: `1px solid ${CT_DARK.line}`, background: 'rgba(248,250,252,0.06)', borderRadius: 999, padding: '5px 10px' }}>
            <MapPin size={11} color={CT_DARK.mute} strokeWidth={2.5} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: CT_DARK.ink }}>{result.courseName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * §2.2 — THE MOSAIC (option 3). MAX_MEDIA is 10, at most three cells render.
 *   1        one full-width image, no grid, no badge, no +N
 *   2        two cells
 *   3        one large leading cell, two stacked beside it
 *   4+       the same three cells, +N over the last
 * The +N is NOT a progress indicator: it never animates and never counts down.
 */
function MediaMosaic({
  previews,
  completedFiles,
  resolved,
}: {
  previews: { url: string; type: 'image' | 'video' }[];
  completedFiles: number;
  resolved?: boolean;
}) {
  const n = previews.length;
  const visible = previews.slice(0, 3);
  const overflow = n > 3 ? n - 3 : 0;
  const pending = (i: number) => !resolved && i >= completedFiles;

  if (n === 1) {
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: '#000' }}>
        <Cell item={visible[0]} pending={pending(0)} />
      </div>
    );
  }

  if (n === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: CELL_GAP, width: '100%', aspectRatio: '4 / 5', background: '#000' }}>
        {visible.map((m, i) => (
          <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
            <Cell item={m} pending={pending(i)} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: CELL_GAP, width: '100%', aspectRatio: '4 / 5', background: '#000' }}>
      <div style={{ gridRow: '1 / span 2', position: 'relative', overflow: 'hidden' }}>
        <Cell item={visible[0]} pending={pending(0)} />
      </div>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Cell item={visible[1]} pending={pending(1)} />
      </div>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Cell item={visible[2]} pending={pending(2)} />
        {overflow > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(11,15,20,0.58)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: '#FFFFFF',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

/** One mosaic cell: the local preview, plus the pending scrim that clears. */
function Cell({ item, pending }: { item: { url: string; type: 'image' | 'video' }; pending: boolean }) {
  const reduce = useReducedMotion();
  return (
    <>
      {item.type === 'video' ? (
        <video
          src={item.url}
          muted
          playsInline
          preload="metadata"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <img
          src={item.url}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: pending ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(11,15,20,0.55)', pointerEvents: 'none' }}
      />
    </>
  );
}

// ---------- status beneath the card ----------

function Status({
  eyebrow,
  eyebrowColor,
  headline,
  body,
  reassure,
}: {
  eyebrow: string;
  eyebrowColor?: string;
  headline: string;
  body?: string;
  reassure?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div style={{ width: '100%', maxWidth: CARD_MAX, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
      <motion.div
        initial={false}
        animate={{ color: eyebrowColor ?? 'rgba(255,255,255,0.38)' }}
        transition={reduce ? { duration: 0 } : { duration: 0.4 }}
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.19em',
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </motion.div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, color: 'rgba(255,255,255,0.96)' }}>
        {headline}
      </div>
      {reassure && <Reassurance />}
      {body && <Body>{body}</Body>}
    </div>
  );
}

/** §2.4 — the best thing on either screen, given real weight. */
function Reassurance() {
  const { t } = useTranslation('composer');
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{t('success.keepUsing')}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
        {t('success.keepUsingSub')}
      </div>
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

// ---------- pieces ----------

function Column({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 20, maxWidth: CARD_MAX, width: '100%', textAlign: 'center',
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
