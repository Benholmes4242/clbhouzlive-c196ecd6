/**
 * ParTypeBars - the ONE component behind "By par" (Discover courses panel) and
 * "How each par plays" (course detail Course tab). The two surfaces rendered the
 * same three figures from two copies of the same markup and drifted; they now
 * share this file. BRIEF_BY_PAR_SIGNED_SCALE.
 *
 * THE SCALE IS SIGNED. Bars grow LEFT of a centred zero rule when a par type
 * plays under par and RIGHT when it plays over, so direction is legible from the
 * shape and not only from the colour of the figure. The domain is symmetric
 * around zero and shared by every row, so lengths are comparable between rows
 * and between courses. The tint spread is deliberately gone from these rows: a
 * relative easiest-to-hardest ramp over three values cannot also carry
 * direction, and direction was the missing thing.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, FIGS, TOPAR_RED, toParParts } from './tokens';
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
  const trackH = compact ? 7 : 8;
  const figSize = compact ? 12.5 : 13.5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 9 : 10, ...FIGS }}>
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
              gridTemplateColumns: compact ? '44px 1fr 40px' : '46px 1fr auto',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: compact ? 12 : 12.5, fontWeight: 700, color: A.INK }}>
              {t('courseDetail.parTypes.parNPlural', { n: r.par, defaultValue: 'Par {{n}}s' })}
            </span>

            <span
              style={{
                position: 'relative',
                display: 'block',
                height: trackH,
                borderRadius: 4,
                background: A.TRACK,
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
                  background: A.BORDER,
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
                  borderRadius: 4,
                  background: under ? TOPAR_RED : A.INK,
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
                        color: fieldFig ? fieldFig.tone : A.INK,
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
                  color: fieldFig ? fieldFig.tone : A.INK,
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
