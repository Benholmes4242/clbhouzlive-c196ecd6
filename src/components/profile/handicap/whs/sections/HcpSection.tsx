/**
 * HcpSection — THE ONE SECTION GRAMMAR for the single-page handicap area
 * (BRIEF: three tabs become one page, Section A).
 *
 * Every section on the page is built from this shell:
 *
 *   - No Panel, no bordered card, no radius, no background tint.
 *   - Content runs to the 20px gutter.
 *   - Optional kicker, then an optional heading row (heading left, meta right),
 *     then content.
 *   - 34px above each section's kicker, 10px from heading to content.
 *   - Separation is space and hairlines only. Where a hairline is used it is
 *     1px and runs full width inside the gutter (`hairline` prop).
 *
 * TYPE SCALE (fixed by the brief):
 *   SECTION KICKER   9 / 700 / 0.19em / uppercase / DIM
 *   SECTION HEADING  16 / 700 / -0.01em / INK
 *   SECTION META     11 / 700 / MUTE, sentence case, right of the heading
 *
 * Tones are the existing chart-token literals (INK / MUTE / DIM) — the same
 * values the whs chart primitives already use, so nothing here introduces a
 * new tone and the shell also survives being portalled.
 */
import React from 'react';
import { CHART, CHART_FONT } from '../charts/tokens';

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
};

interface Props {
  /** 9 / 700 / 0.19em / uppercase — optional. */
  kicker?: React.ReactNode;
  /** 16 / 700 — optional (the Index section has a kicker and no heading). */
  heading?: React.ReactNode;
  /** 11 / 700 right of the heading — renders only when a heading exists. */
  meta?: React.ReactNode;
  /** Full-width 1px rule above the section, inside the gutter. */
  hairline?: boolean;
  /** First section on the page drops the 34px lead-in (page supplies top air). */
  first?: boolean;
  children: React.ReactNode;
}

export const HcpSection: React.FC<Props> = ({
  kicker,
  heading,
  meta,
  hairline = false,
  first = false,
  children,
}) => {
  return (
    <section
      style={{
        fontFamily: CHART_FONT,
        padding: '0 20px',
        marginTop: first ? 0 : 34,
      }}
    >
      {hairline && (
        <div
          aria-hidden
          style={{
            height: 1,
            background: CHART.BORDER,
            marginBottom: 34 - 1, // rule sits inside the 34px lead-in
          }}
        />
      )}
      {kicker != null && (
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.19em',
            textTransform: 'uppercase',
            color: CHART.DIM,
            ...FIG,
          }}
        >
          {kicker}
        </div>
      )}
      {heading != null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: kicker != null ? 6 : 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: CHART.INK,
            }}
          >
            {heading}
          </h2>
          {meta != null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: CHART.MUTE,
                whiteSpace: 'nowrap',
                ...FIG,
              }}
            >
              {meta}
            </span>
          )}
        </div>
      )}
      <div style={{ marginTop: heading != null ? 10 : kicker != null ? 10 : 0 }}>
        {children}
      </div>
    </section>
  );
};

export default HcpSection;
