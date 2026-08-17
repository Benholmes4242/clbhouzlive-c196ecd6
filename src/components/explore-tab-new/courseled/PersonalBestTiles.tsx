import React, { useState } from 'react';

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
 *   (a) PROGRESSION — the feat has a PREVIOUS BEST. No photo; the jump fills
 *       the space a photograph would have taken.
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
 *
 * PROGRESSION, fixed chrome in render order:
 *   padding 12 + 13                                       = 25
 *   kicker 9/700 lineHeight 1, marginBottom 8              = 17
 *   jump row (30px numeral at lineHeight 1)                = 30
 *   bar marginTop 10 + 6 track                             = 16
 *   gain line marginTop 6 + 14 (11/600 at 1.3)             = 20
 *   course name marginTop 6 + 16 (13/700 at 1.2, 1 line)   = 22
 *   WHO row marginTop 9 + 18                               = 27
 *                                                     base = 157
 * Nothing in it wraps: the kicker is the server headline clamped to one line,
 * the gain line is a two-word figure, the course name is ellipsised.
 */
export const PROGRESSION_HEIGHT = 157;

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
}: {
  who: string;
  isOwn: boolean;
  trailing?: React.ReactNode;
  marginTop?: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop }}>
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

/** (a) THE PROGRESSION TILE — old -> new, and the gain drawn beneath it. */
export function ProgressionTile({
  courseName,
  who,
  isOwn,
  whenLabel,
  trailing,
  isNew,
  onPress,
  /** Server headline, verbatim, as the kicker. */
  kicker,
  previous,
  figure,
  unit,
  gainLine,
}: Shared & {
  kicker: string;
  previous: number;
  figure: string | null;
  unit?: string;
  gainLine: string;
}) {
  const now = Number(figure ?? 0);
  const total = Math.max(now, previous, 1);
  const oldPct = Math.max(0, Math.min(100, (previous / total) * 100));

  return (
    <Shell isNew={isNew} onPress={onPress} padding="12px 13px 13px">
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            lineHeight: 1,
            color: A.MUTE,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {kicker}
        </span>
        <span style={{ ...LABEL, fontSize: 6.5, marginLeft: 'auto', color: A.DIM }}>
          {whenLabel}
        </span>
      </div>

      {/* THE JUMP. This is what earns the missing photograph. */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, height: 30 }}>
        <span style={{ ...NUMF, fontSize: 17, lineHeight: 1, color: A.DIM }}>{previous}</span>
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden>
          <path
            d="M1 5h9.5M7.5 1.5 11 5l-3.5 3.5"
            stroke={A.DIM}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ ...NUMF, fontSize: 30, fontWeight: 800, lineHeight: 1, color: A.INK }}>
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

      {/* TWO SEGMENTS: what they had, then the gain in ink. */}
      <div
        style={{
          marginTop: 10,
          height: 6,
          borderRadius: 999,
          background: A.BORDER,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <span style={{ width: `${oldPct}%`, background: '#D8DDE3' }} />
        <span style={{ flex: 1, background: A.INK }} />
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.3,
          color: A.MUTE,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {gainLine}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: A.INK,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {courseName}
      </div>

      <WhoRow who={who} isOwn={isOwn} trailing={trailing} />
    </Shell>
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

        <WhoRow who={who} isOwn={isOwn} trailing={trailing} />
      </div>
    </Shell>
  );
}
