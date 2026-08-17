import React, { useState } from 'react';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import { CourseImageFallback } from './CourseImageFallback';
import { A, CARD_SHELL, LABEL, NEW_CARD_RING, NUMF, SANS } from './tokens';
import { TILE_SCRIM } from './StandoutTile';

/**
 * PERSONAL BESTS — THE TWO NEW SHAPES (BRIEF_FEAT_SECTIONS_HIERARCHY Part 2).
 *
 * Personal Bests is NOT Standout Rounds. Its six kinds are all personal
 * milestones with a narrow spread, so Standout's rarity rules would leave two
 * of six kinds permanently photoless. The axis used instead is ALREADY IN THE
 * DATA: nearly every feat carries a BEFORE.
 *
 *   (a) PROGRESSION — WITHDRAWN (BRIEF_FEAT_SECTIONS_FINISHING §5.1). A feat
 *       with a previous best now renders the STANDARD photo tile, with the
 *       improvement inside the glass chip. `treatmentFor` still names the case
 *       so the parse stays tested; PersonalBests maps it to StandoutTile.
 *   (b) EFFORT — the feat has an ATTEMPT COUNT and no previous best. A short
 *       74px photo strip, the figure, and the wait emphasised in the sentence.
 *   (c) PHOTO — neither. Unchanged, full height (StandoutTile).
 *
 * SERVER STRINGS ARE NEVER REWORDED (§2.6). `headline` renders verbatim; the
 * figures below are PARSED out of the two generated forms of `reference_line`
 * — "Previous best N" and "In N rounds" — and the display is then BUILT from
 * the parsed numbers rather than by editing the sentence. Both forms are
 * literal concatenations in get_personal_bests, keyed to the feat kind, so the
 * patterns are anchored to the kind as well as the shape and a string that does
 * not match falls back to treatment (c) rather than being guessed at.
 */

export type PBTreatment = 'progression' | 'effort' | 'photo';

const PREVIOUS_BEST_KINDS = new Set(['most_birdies_here', 'most_pars_here']);
const ATTEMPT_KINDS = new Set([
  'first_sub_70_here',
  'first_sub_80_here',
  'first_double_free_here',
]);

/** "Previous best 9" -> 9. Null for any other kind or any other shape. */
export function parsePreviousBest(featKind: string, reference: string | null): number | null {
  if (!reference || !PREVIOUS_BEST_KINDS.has(featKind)) return null;
  const m = /^previous best (\d+)$/i.exec(reference.trim());
  return m ? Number(m[1]) : null;
}

/** "In 41 rounds" -> 41. Null for any other kind or any other shape. */
export function parseAttempts(featKind: string, reference: string | null): number | null {
  if (!reference || !ATTEMPT_KINDS.has(featKind)) return null;
  const m = /^in (\d+) rounds?$/i.exec(reference.trim());
  return m ? Number(m[1]) : null;
}

export function treatmentFor(featKind: string, reference: string | null): PBTreatment {
  if (parsePreviousBest(featKind, reference) !== null) return 'progression';
  if (parseAttempts(featKind, reference) !== null) return 'effort';
  return 'photo';
}

/**
 * HEIGHT ESTIMATES (§0.1, §2 acceptance P). Billed from the geometry written
 * below, string lengths only, no measurement.
 */

/**
 * EFFORT:
 *   photo strip                                            = 74
 *   padding 11 + 12                                        = 23
 *   figure row (26px numeral at lineHeight 1)              = 26
 *   WHO row marginTop 9 + 18                               = 27
 *                                                     base = 150
 *   sentence marginTop 4 + 16 a line (12/600 at 1.32), max 2 lines
 */
export const EFFORT_BASE = 150;

export function estimateEffortHeight(sentence: string): number {
  const lines = sentence ? Math.min(2, Math.ceil(sentence.length / 24)) : 0;
  return EFFORT_BASE + (lines > 0 ? 4 + lines * 16 : 0);
}

interface Shared {
  courseName: string | null;
  who: string;
  isOwn: boolean;
  whenLabel: string;
  trailing?: React.ReactNode;
  isNew?: boolean;
  onPress?: () => void;
}

function Shell({
  children,
  isNew,
  onPress,
  padding,
}: {
  children: React.ReactNode;
  isNew?: boolean;
  onPress?: () => void;
  padding: string | number;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPress}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        ...CARD_SHELL,
        ...(isNew ? NEW_CARD_RING : null),
        padding,
        textAlign: 'left',
        fontFamily: SANS,
        cursor: onPress ? 'pointer' : 'default',
        opacity: pressed ? 0.72 : 1,
        transition: 'opacity 120ms ease',
      }}
    >
      {children}
    </div>
  );
}

function WhoRow({
  who,
  isOwn,
  trailing,
  marginTop = 9,
  avatarUrl = null,
  avatarUserId = null,
}: {
  who: string;
  isOwn: boolean;
  trailing?: React.ReactNode;
  marginTop?: number;
  /** §3: the fallback colour hashes the USER ID, never the display name. */
  avatarUrl?: string | null;
  avatarUserId?: string | null;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop }}>
      {who ? (
        <SquircleAvatar src={avatarUrl} userId={avatarUserId} alt={who} size={20} hideRing />
      ) : null}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: isOwn ? A.AMBER_DEEP : A.INK,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {who}
      </div>
      {trailing}
    </div>
  );
}

/** (b) THE EFFORT TILE — a 74px strip, then the wait emphasised in the line. */
export function EffortTile({
  courseId,
  courseName,
  imageUrl,
  who,
  isOwn,
  whenLabel,
  trailing,
  isNew,
  onPress,
  figure,
  unit,
  headline,
  attemptPhrase,
  attempts,
  avatarUrl,
  avatarUserId,
}: Shared & {
  courseId: string;
  imageUrl: string | null;
  figure: string | null;
  unit?: string;
  /** Server headline, verbatim. */
  headline: string;
  /** Localised "After 41 rounds"; the numeral inside it is emphasised. */
  attemptPhrase: string;
  attempts: number;
  avatarUrl?: string | null;
  avatarUserId?: string | null;
}) {
  const marker = String(attempts);
  const at = attemptPhrase.indexOf(marker);
  const before = at >= 0 ? attemptPhrase.slice(0, at) : attemptPhrase;
  const after = at >= 0 ? attemptPhrase.slice(at + marker.length) : '';

  return (
    <Shell isNew={isNew} onPress={onPress} padding={0}>
      <CourseImageFallback
        courseId={courseId}
        courseName={courseName}
        imageUrl={imageUrl}
        initialsSize={18}
        style={{ height: 74 }}
      >
        <div style={{ position: 'absolute', inset: 0, background: TILE_SCRIM }} />
        <span
          style={{
            position: 'absolute',
            top: 7,
            right: 9,
            fontSize: 6.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.72)',
            textShadow: '0 1px 2px rgba(10,14,10,0.55)',
          }}
        >
          {whenLabel}
        </span>
        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 8,
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.025em',
            lineHeight: 1.14,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {courseName}
        </div>
      </CourseImageFallback>

      <div style={{ padding: '11px 13px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, height: 26 }}>
          <span style={{ ...NUMF, fontSize: 26, lineHeight: 1, color: A.INK }}>
            {figure ?? '—'}
          </span>
          {unit ? (
            <span
              style={{
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                lineHeight: 1,
                color: A.MUTE,
              }}
            >
              {unit}
            </span>
          ) : null}
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.32,
            color: A.MUTE,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {headline}
          {' \u00B7 '}
          {before}
          <span style={{ color: A.INK, fontWeight: 700 }}>{marker}</span>
          {after}
        </div>

        <WhoRow
          who={who}
          isOwn={isOwn}
          trailing={trailing}
          avatarUrl={avatarUrl}
          avatarUserId={avatarUserId}
        />
      </div>
    </Shell>
  );
}
