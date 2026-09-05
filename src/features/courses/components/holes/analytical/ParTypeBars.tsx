/**
 * ParTypeBars - the ONE component behind "By par" (Discover courses panel) and
 * "How each par plays" (course detail Course tab). The two surfaces rendered the
 * same three figures from two copies of the same markup and drifted; they now
 * share this file. BRIEF_BY_PAR_SIGNED_SCALE.
 *
 * THE SCALE IS SIGNED. Bars grow LEFT of a centred zero rule when a par type
 * plays under par and RIGHT when it plays over, so direction is legible from the
 * shape and not only from the colour of the figure. Like the Tour Overview
 * ladder, the track itself is transparent: only the centre rule, signed bar,
 * and optional member marker are drawn, with no ghost rail behind them. The domain is symmetric
 * around zero and shared by every row, so lengths are comparable between rows
 * and between courses. The tint spread is deliberately gone from these rows: a
 * relative easiest-to-hardest ramp over three values cannot also carry
 * direction, and direction was the missing thing.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, FIGS, toParParts } from './tokens';
import type { ParTypeRow } from './CourseAnalyticsPanels';

export interface SignedParScale {
  /** Symmetric bound: the domain runs from -bound to +bound. */
  bound: number;
}

/**
 * Sibling of buildTourHoleScale, not a reuse of it: that builder takes tournament
 * hole rows and returns an ASYMMETRIC min/max plus a difficulty ranking, which
 * would put zero at an arbitrary place in the track. These rows need zero at a
 * FIXED centre so three rows can be read against one another. Same floor (0.2)
 * and the same reasoning about a field that plays dead level.
 */
export function buildSignedParScale(rows: ReadonlyArray<ParTypeRow>): SignedParScale {
  const values: number[] = [];
  rows.forEach((r) => {
    if (Number.isFinite(r.field)) values.push(r.field);
    if (r.you != null && Number.isFinite(r.you)) values.push(r.you);
  });
  const peak = values.length ? Math.max(...values.map((v) => Math.abs(v))) : 0;
  // Headroom keeps the longest bar off the track's end; the floor stops three
  // dead-level par types dividing by ~0.
  return { bound: Math.max(0.2, peak * 1.15) };
}

/**
 * THE ZONE LAW, NOT THE TO-PAR LAW (BRIEF_COURSE_ANALYTICS_SHARPEN §1.5/§1.6).
 *
 * This block answers "is this par type EASIER or HARDER than par", which is a
 * zone question, so it takes the zone convention THROUGHOUT: green easy, red
 * hard, muted at level, BAR AND FIGURE TOGETHER. What must never happen is a
 * green bar beside a red figure for the same value.
 *
 * Every OTHER figure on these surfaces keeps the to-par law (under par red,
 * over par ink, level muted) via toParParts. The two conventions are kept apart
 * BY BLOCK, deliberately - see the note in YourCourseAnalyticsSheet.
 */
function zoneTone(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (r < 0) return A.GREEN;
  if (r > 0) return A.RED;
  return A.MUTE;
}

/** The zero rule: the reference every bar is read against. */
const ZERO_RULE = 'rgba(255,255,255,0.20)';

/** PAR 3S / PAR 4S / PAR 5S - column-header scale, the block's only label. */
const PAR_LABEL: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: A.MUTE,
};

/** Signed position in the track, 0% = far left, 50% = par, 100% = far right. */
function posPct(value: number, bound: number): number {
  return Math.max(0, Math.min(100, 50 + (value / bound) * 50));
}

export const ParTypeBars: React.FC<{
  rows: ParTypeRow[];
  fieldIsOnlyYou: boolean;
  /** compact = Discover's panel; default = the course detail Course tab. */
  density?: 'compact' | 'default';
  /** The Course tab prints the member's own figure beside the field's. */
  showYouFigure?: boolean;
}> = ({ rows, fieldIsOnlyYou, density = 'compact', showYouFigure = false }) => {
  const { t } = useTranslation('courses');
  if (rows.length === 0) return null;

  const { bound } = buildSignedParScale(rows);
  const anyYou = rows.some((r) => r.you != null);
  const compact = density === 'compact';
  /* §3.3 - a 34px pitch: a 9px track inside a 22px row with 12px between rows. */
  const trackH = 9;
  const figSize = compact ? 12.5 : 13.5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...FIGS }}>
      {rows.map((r) => {
        const fieldFig = toParParts(r.field);
        const youFig = toParParts(r.you);
        const under = r.field < 0;
        const centre = 50;
        const end = posPct(r.field, bound);
        const left = Math.min(centre, end);
        const width = Math.max(Math.abs(end - centre), 1.2);
        return (
          <div
            key={r.par}
            style={{
              display: 'grid',
              /* §3.2 - a FIXED 46px label, a 10px gap, then the track takes every
                 remaining pixel to the figure column. */
              gridTemplateColumns: '46px 1fr auto',
              alignItems: 'center',
              gap: 10,
              minHeight: 22,
            }}
          >
            <span style={PAR_LABEL}>
              {t('courseDetail.parTypes.parNPlural', { n: r.par, defaultValue: 'Par {{n}}s' })}
            </span>

            <span
              style={{
                position: 'relative',
                display: 'block',
                height: trackH,
              }}
            >
              {/* The reference every bar is read against - on EVERY row. */}
              <i
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '50%',
                  width: 1,
                  background: ZERO_RULE,
                  display: 'block',
                }}
              />
              <i
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${left}%`,
                  width: `${width}%`,
                   borderRadius: under ? '4px 1px 1px 4px' : '1px 4px 4px 1px',
                  background: under ? A.GREEN : A.RED,
                   opacity: 0.85,
                  display: 'block',
                }}
              />
              {r.you != null && !fieldIsOnlyYou && (
                <i
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: -3,
                    bottom: -3,
                    left: `${posPct(r.you, bound)}%`,
                    width: 2,
                    borderRadius: 1,
                    background: A.AMBER,
                    display: 'block',
                  }}
                />
              )}
            </span>

            {showYouFigure ? (
              <span
                style={{ display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap' }}
              >
                {fieldIsOnlyYou ? (
                  <span
                    style={{
                      fontSize: figSize,
                      fontWeight: 700,
                      color: A.AMBER_DEEP,
                      minWidth: 34,
                      textAlign: 'right',
                    }}
                  >
                    {youFig ? youFig.text : fieldFig ? fieldFig.text : ''}
                  </span>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: figSize,
                        fontWeight: 700,
                        color: fieldFig ? zoneTone(r.field) : A.INK,
                        minWidth: 34,
                        textAlign: 'right',
                      }}
                    >
                      {fieldFig ? fieldFig.text : ''}
                    </span>
                    {anyYou && (
                      <span
                        style={{
                          fontSize: figSize,
                          fontWeight: 700,
                          color: A.AMBER_DEEP,
                          minWidth: 34,
                          textAlign: 'right',
                        }}
                      >
                        {youFig ? youFig.text : ''}
                      </span>
                    )}
                  </>
                )}
              </span>
            ) : (
              <span
                className="tabular-nums"
                style={{
                  fontSize: figSize,
                  fontWeight: 700,
                  textAlign: 'right',
                  color: fieldFig ? zoneTone(r.field) : A.INK,
                }}
              >
                {fieldFig ? fieldFig.text : ''}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
