/**
 * ChampionsHonoursBoard — the REAL, unblurred preview handed to
 * ConnectGhostPrompt on the Champions surface (BRIEF_CONNECT_GATE_HONOURS_BOARD).
 *
 * A short slice of the actual honours board: the course's own photograph, four
 * crown rows (three most recently taken held crowns, then one unclaimed) and one
 * counted line for the rest. Nothing here is decorative-fake: every name and
 * figure is the board's own data, passed down by the parent. No blur, no tint.
 *
 * COLOUR: achievement gold takes its DEEP end (#B36B00) for text — the light end
 * (#F5D061) appears ONLY as a solid marker rule, never behind type. Unclaimed is
 * its own state (dashed neutral stroke + OPEN in the demanding ramp's red), never
 * a faded gold. No amber: amber means the viewing member, and this card is shown
 * to somebody who is not on the board.
 */
import React from 'react';
import { A, SANS, FIGS, DIFFICULTY_HARD_HEX } from '@/features/courses/components/holes/analytical/tokens';

/** Achievement gold. DEEP end for type on light surfaces; LIGHT end for rules only. */
const GOLD_DEEP = '#B36B00';
const GOLD_RULE = '#F5D061';

export interface HonoursCrown {
  key: string;
  /** Category label, e.g. "Lowest gross". */
  label: string;
  /** Holder display name. Null/empty → the crown is treated as unclaimed. */
  holderName: string | null;
  /** Formatted value. Null → the row renders the name and no figure. */
  valueDisplay: string | null;
  /** ISO date the crown was taken, when known. Drives the ordering. */
  attainedAt: string | null;
}

export interface HonoursFigures {
  /** Rounds logged at this course. Omitted individually when null. */
  rounds?: number | null;
  /** Field average to par, already signed and formatted. */
  avgToPar?: string | null;
  /** Harder-than percentile (0-100). */
  harderThanPct?: number | null;
}

interface Props {
  courseName: string;
  /** The image the page already loaded for the course header. No new fetch. */
  courseHeaderImage?: string | null;
  eyebrow: string;
  headline: string;
  figures?: HonoursFigures;
  /** All crown categories on this club, in the board's own display order. */
  crowns: HonoursCrown[];
  /** Counted line for the crowns that remain unclaimed. Null → not rendered. */
  remainderLine?: string | null;
  neverWonLabel: string;
  openLabel: string;
  /** Uppercase labels for the three course figures. */
  figureLabels?: { rounds: string; avg: string; harder: string };
}

const PHOTO_BAND_HEIGHT = 132;

const FIG_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
};

const isHeld = (c: HonoursCrown) => !!(c.holderName && c.holderName.trim());

/**
 * ROW ORDER — deterministic, and stated here as the brief requires:
 * 1. Held crowns, MOST RECENTLY TAKEN FIRST (attained_at, descending). The board
 *    supplies attained_at, so "most recently taken" IS available; crowns missing
 *    a date sort last among the held, keeping the board's display order.
 * 2. Then unclaimed crowns in the board's existing display order.
 * The first four of that sequence render. A held crown with no holder name is
 * unclaimed by definition (see isHeld).
 */
export function orderHonoursRows(crowns: HonoursCrown[]): HonoursCrown[] {
  const held = crowns.filter(isHeld);
  const open = crowns.filter((c) => !isHeld(c));
  const withIndex = held.map((c, i) => ({ c, i }));
  withIndex.sort((a, b) => {
    const ta = a.c.attainedAt ? Date.parse(a.c.attainedAt) : NaN;
    const tb = b.c.attainedAt ? Date.parse(b.c.attainedAt) : NaN;
    const va = Number.isFinite(ta);
    const vb = Number.isFinite(tb);
    if (va && vb && tb !== ta) return tb - ta;
    if (va !== vb) return va ? -1 : 1;
    return a.i - b.i;
  });
  const heldSorted = withIndex.map((x) => x.c);
  // Three held then one unclaimed when both exist; otherwise fill from what there is.
  if (heldSorted.length >= 3 && open.length > 0) {
    return [...heldSorted.slice(0, 3), open[0]];
  }
  return [...heldSorted, ...open].slice(0, 4);
}

const CrownRow: React.FC<{ crown: HonoursCrown; neverWonLabel: string; openLabel: string; first: boolean }> = ({
  crown,
  neverWonLabel,
  openLabel,
  first,
}) => {
  const held = isHeld(crown);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 0',
        borderTop: first ? 'none' : `1px solid ${A.HAIRLINE}`,
      }}
    >
      {held ? (
        <div style={{ width: 3, alignSelf: 'stretch', minHeight: 26, background: GOLD_RULE, borderRadius: 2 }} />
      ) : (
        <div
          style={{
            width: 3,
            alignSelf: 'stretch',
            minHeight: 26,
            borderLeft: `2px dashed ${A.DIM}`,
            borderRadius: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...FIG_LABEL, color: A.MUTE }}>{crown.label}</div>
        <div
          style={{
            marginTop: 2,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: held ? A.INK : A.BODY,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {held ? crown.holderName : neverWonLabel}
        </div>
      </div>
      {held ? (
        crown.valueDisplay ? (
          <div style={{ ...FIGS, fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: GOLD_DEEP }}>
            {crown.valueDisplay}
          </div>
        ) : null
      ) : (
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', color: DIFFICULTY_HARD_HEX }}>
          {openLabel}
        </div>
      )}
    </div>
  );
};

const FigureLine: React.FC<{ figures?: HonoursFigures; onPhoto: boolean; labels: { rounds: string; avg: string; harder: string } }> = ({
  figures,
  onPhoto,
  labels,
}) => {
  const parts: string[] = [];
  if (figures?.rounds != null) parts.push(`${figures.rounds} ${labels.rounds}`);
  if (figures?.avgToPar) parts.push(`${figures.avgToPar} ${labels.avg}`);
  if (figures?.harderThanPct != null) parts.push(`${Math.round(figures.harderThanPct)}% ${labels.harder}`);
  if (parts.length === 0) return null;
  return (
    <div
      style={{
        ...FIGS,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: onPhoto ? 'rgba(255,255,255,0.82)' : A.MUTE,
      }}
    >
      {parts.join(' · ')}
    </div>
  );
};

export const ChampionsHonoursBoard: React.FC<Props> = ({
  courseName,
  courseHeaderImage,
  eyebrow,
  headline,
  figures,
  crowns,
  remainderLine,
  neverWonLabel,
  openLabel,
  figureLabels = { rounds: 'ROUNDS', avg: 'AVG TO PAR', harder: 'HARDER THAN' },
}) => {
  const rows = orderHonoursRows(crowns);
  const hasPhoto = !!courseHeaderImage;

  return (
    <div style={{ fontFamily: SANS }}>
      {/* PHOTO BAND — decorative. Every word on it exists as real text below when
          the band is absent, and the band itself is aria-hidden. */}
      {hasPhoto && (
        <div
          aria-hidden="true"
          style={{ position: 'relative', height: PHOTO_BAND_HEIGHT, overflow: 'hidden', background: A.TRACK }}
        >
          <img
            src={courseHeaderImage as string}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.34) 46%, rgba(0,0,0,0.02) 100%)',
            }}
          />
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10 }}>
            <div style={{ ...FIG_LABEL, letterSpacing: '0.14em', color: GOLD_RULE, marginBottom: 3 }}>{eyebrow}</div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              {headline}
            </div>
            <FigureLine figures={figures} onPhoto labels={figureLabels} />
          </div>
        </div>
      )}

      {/* Real text: the header when there is no photograph, and the a11y source of
          truth for the band's words when there is. */}
      <div style={{ padding: hasPhoto ? '0 14px' : '14px 14px 0' }}>
        <h3
          style={{
            position: hasPhoto ? 'absolute' : 'static',
            width: hasPhoto ? 1 : 'auto',
            height: hasPhoto ? 1 : 'auto',
            overflow: hasPhoto ? 'hidden' : 'visible',
            clip: hasPhoto ? 'rect(0 0 0 0)' : undefined,
            whiteSpace: hasPhoto ? 'nowrap' : 'normal',
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: A.INK,
            lineHeight: 1.2,
          }}
        >
          {`${eyebrow} · ${courseName} · ${headline}`}
        </h3>
        {!hasPhoto && (
          <div style={{ marginTop: 4 }}>
            <FigureLine figures={figures} onPhoto={false} labels={figureLabels} />
          </div>
        )}
      </div>

      {/* CROWN ROWS — rows, not cards. */}
      <div style={{ padding: hasPhoto ? '6px 14px 0' : '10px 14px 0' }}>
        {rows.map((c, i) => (
          <CrownRow key={c.key} crown={c} neverWonLabel={neverWonLabel} openLabel={openLabel} first={i === 0} />
        ))}
        {remainderLine ? (
          <div
            style={{
              borderTop: `1px solid ${A.HAIRLINE}`,
              padding: '8px 0 0',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: A.BODY,
            }}
          >
            {remainderLine}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ChampionsHonoursBoard;
