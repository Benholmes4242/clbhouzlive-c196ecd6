/**
 * PostGolfContext (PF1B) — the hole chip and attached-round row/pill for a
 * post that carries golf context. Data arrives batched from the host
 * (usePostGolfContext); nothing here reads per card.
 *
 * Mock pf1b-feed-golf-context.html is the signed-off spec:
 *  - Hole chip: first media slide only, top-left 10px inset on the card;
 *    below the top bar in fullscreen. "{NTH}" in ink, then "· PAR p · y YDS"
 *    in mute — only the parts that exist, "{NTH}" alone with no hole data.
 *  - Feed round row: between the media and the action row; gross + to-par,
 *    the 18- or 9-bar strip with the post's hole outlined, chevron. The whole
 *    row is a button opening the scorecard sheet — never the fullscreen viewer.
 *  - Fullscreen round pill: one glass pill in the caption block, no strip.
 * Tags are NOT shown on the card: they power search, course pages and Explore.
 */
import React from 'react';
import { ordinal, signedScore } from '@/features/post-v2/lib/composerGolfRules';
import type { TeeHole } from '@/features/courses/hooks/useCourseTeeSets';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { PostGolfContext } from '@/hooks/feed/usePostGolfContext';

const INK = '#F8FAFC';
const MUTE = 'rgba(248,250,252,0.62)';
const DIM = 'rgba(248,250,252,0.42)';
const UNDER = '#E2574C';

/** Strip bar tones, signed-off mock: under par / par / bogey / worse. */
function barTone(delta: number | null): string {
  if (delta == null) return 'rgba(255,255,255,0.12)';
  if (delta < 0) return UNDER;
  if (delta === 0) return 'rgba(255,255,255,0.55)';
  if (delta === 1) return 'rgba(255,255,255,0.22)';
  return 'rgba(255,255,255,0.12)';
}

/** "{NTH}" plus whatever hole data exists: "· PAR 3 · 166 YDS". */
export function holeChipText(holeNo: number, hole: TeeHole | null | undefined): { lead: string; rest: string } {
  const parts: string[] = [];
  if (hole?.par != null && hole.par > 0) parts.push(`PAR ${hole.par}`);
  if (hole?.yards != null && hole.yards > 0) parts.push(`${hole.yards} YDS`);
  return { lead: ordinal(holeNo).toUpperCase(), rest: parts.length ? `· ${parts.join(' · ')}` : '' };
}

export function HoleChip({ holeNo, hole, style }: { holeNo: number; hole?: TeeHole | null; style?: React.CSSProperties }) {
  const { lead, rest } = holeChipText(holeNo, hole);
  return (
    <span
      data-testid="post-hole-chip"
      style={{
        height: 28,
        padding: '0 10px',
        borderRadius: 9,
        background: 'rgba(14,14,16,0.6)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
        color: INK,
        ...style,
      }}
    >
      {lead}
      {rest ? <i style={{ fontStyle: 'normal', color: MUTE, fontWeight: 700 }}>{rest}</i> : null}
    </span>
  );
}

/** Feed card round row (mock A): score block, hole strip, chevron. The whole
 *  row is the scorecard door; it must never open the fullscreen viewer. */
export function FeedRoundRow({
  gross,
  toPar,
  shape,
  roundHoles,
  activeHole,
  onOpen,
}: {
  gross: number | null;
  toPar: number | null;
  /** Hole detail for the strip; null hides the strip and keeps the score. */
  shape: HoleShape | null;
  /** Declared round length (18 or 9) — the strip's column count. */
  roundHoles: number | null;
  /** The post's hole, outlined on the strip when present. */
  activeHole: number | null;
  onOpen: () => void;
}) {
  const cols = roundHoles === 9 ? 9 : 18;
  return (
    <button
      type="button"
      data-testid="post-round-row"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ flex: 'none' }}>
        <b style={{ display: 'block', fontSize: 13.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: INK }}>
          {gross ?? ''}
          {toPar != null && (
            <em style={{ fontStyle: 'normal', color: MUTE, fontWeight: 600, marginLeft: 4 }}>{signedScore(toPar)}</em>
          )}
        </b>
        <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: DIM, marginTop: 2 }}>
          ROUND
        </span>
      </div>
      {shape && (
        <div
          data-testid="post-round-strip"
          style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, alignItems: 'end', minWidth: 0 }}
        >
          {shape.holes.map((h) => {
            const delta = h.strokes != null && h.par != null ? h.strokes - h.par : null;
            return (
              <i
                key={h.holeNo}
                data-hole={h.holeNo}
                data-active={activeHole === h.holeNo ? 'true' : undefined}
                style={{
                  display: 'block',
                  height: 6,
                  borderRadius: 2,
                  background: barTone(delta),
                  ...(activeHole === h.holeNo ? { outline: `1.5px solid ${INK}`, outlineOffset: 1 } : {}),
                }}
              />
            );
          })}
        </div>
      )}
      <span aria-hidden style={{ flex: 'none', fontSize: 16, color: DIM }}>›</span>
    </button>
  );
}

/** Fullscreen round pill (mock B): one glass pill in the caption block. */
export function FullscreenRoundPill({ gross, toPar, onOpen }: { gross: number | null; toPar: number | null; onOpen: () => void }) {
  return (
    <button
      type="button"
      data-testid="post-round-pill"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      style={{
        marginTop: 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 34,
        padding: '0 12px',
        borderRadius: 11,
        background: 'rgba(14,14,16,0.55)',
        border: '1px solid rgba(255,255,255,0.14)',
        width: 'max-content',
        maxWidth: '100%',
        fontSize: 12.5,
        fontWeight: 700,
        color: INK,
        cursor: 'pointer',
        pointerEvents: 'auto',
        fontFamily: 'inherit',
        textShadow: 'none',
      }}
    >
      <span>
        Round {gross ?? ''}
        {toPar != null && <em style={{ fontStyle: 'normal', color: MUTE, fontWeight: 600 }}> {signedScore(toPar)}</em>}
      </span>
      <span style={{ color: MUTE, fontWeight: 600 }}>· Scorecard ›</span>
    </button>
  );
}

/** Fullscreen hole chip (mock B): below the viewer's top bar, left aligned
 *  with the caption block, first slide only. Mounts INSIDE the chrome's fixed
 *  top container so `top: 100%` tracks the bar's real height (chevron-only vs
 *  course header) instead of a guessed offset. */
export function FullscreenHoleChipSlot({
  context,
  hole,
  activeSlide,
}: {
  context: PostGolfContext | null | undefined;
  hole: TeeHole | null | undefined;
  activeSlide: number;
}) {
  if (!context || context.holeNo == null || activeSlide !== 0) return null;
  return (
    <div
      data-testid="post-hole-chip-fs"
      style={{
        position: 'absolute',
        top: '100%',
        left: 'max(14px, env(safe-area-inset-left, 0px))',
        marginTop: 4,
        pointerEvents: 'none',
      }}
    >
      <HoleChip holeNo={context.holeNo} hole={hole} />
    </div>
  );
}
