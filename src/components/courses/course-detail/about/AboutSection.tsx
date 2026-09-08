/**
 * BRIEF_COURSE_TAB_REBUILD §1 — THE SECTION PRIMITIVE.
 *
 * The Course tab no longer wraps its blocks in `Panel`. Panel itself is
 * UNTOUCHED (it is imported by the business editor, verification, top100,
 * posts, moderation and shared sheets) — this tab simply stops calling it.
 *
 * WHY LOCAL AND NOT DiscoverSectionHeading: that component is shared with
 * Explore and Tour Hub, and it differs from this brief in three ways —
 *   • its right slot is 11/700 MUTE sentence case, this brief asks 11/700 DIM
 *     UPPERCASE
 *   • its heading-to-content gap is 10px, this brief asks 14px
 *   • it owns no gutter and no section-to-section space
 * Rather than change a shared component for one tab, the heading is rebuilt
 * here to the brief's numbers. Do NOT repoint this at DiscoverSectionHeading.
 */
import React from 'react';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';

/** §1 — the page gutter for every section on the tab. */
export const GUTTER = 20;

/** §1 — 34px above each section. */
export const SECTION_SPACE = 34;

/** §1 — 14px between a heading and its content. */
export const HEADING_GAP = 14;

/** The tab's only rule: a row divider inside a list, or a drill-down seam. */
export const AboutHairline: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ height: 1, background: A.HAIRLINE, ...style }} aria-hidden="true" />
);

/** A kicker, used where a section is labelled rather than titled (TEES). */
export const ABOUT_KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: A.DIM,
  fontFamily: SANS,
};

/** Figure treatment for the tab: tight, tabular, never heavier than 700. */
export const aboutFig = (size: number, color: string = A.INK): React.CSSProperties => ({
  fontSize: size,
  fontWeight: 700,
  letterSpacing: '-0.03em',
  color,
  ...FIGS,
});

interface AboutSectionProps {
  /** 16/700/-0.01em INK. Omit for a kicker-only section (§3.2). */
  heading?: string;
  /** 11/700 DIM UPPERCASE, right-aligned on the heading baseline. */
  meta?: string | null;
  /** Renders instead of a heading, at the kicker treatment. */
  kicker?: string;
  /** First section on the tab takes no 34px lead-in. */
  first?: boolean;
  /** Content bleeds past the gutter (map, mosaic). Heading keeps its gutter. */
  bleed?: boolean;
  id?: string;
  children: React.ReactNode;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  heading,
  meta,
  kicker,
  first = false,
  bleed = false,
  id,
  children,
}) => (
  <section
    style={{
      marginTop: first ? 0 : SECTION_SPACE,
      fontFamily: SANS,
    }}
  >
    {(heading || kicker || meta) && (
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          padding: `0 ${GUTTER}px`,
          marginBottom: HEADING_GAP,
        }}
      >
        {heading ? (
          <h2
            id={id}
            style={{
              minWidth: 0,
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              color: A.INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {heading}
          </h2>
        ) : kicker ? (
          <span style={ABOUT_KICKER}>{kicker}</span>
        ) : (
          <span aria-hidden="true" />
        )}
        {meta ? (
          <span
            className="tabular-nums lining-nums"
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: A.DIM,
              whiteSpace: 'nowrap',
            }}
          >
            {meta}
          </span>
        ) : null}
      </div>
    )}
    <div style={bleed ? undefined : { padding: `0 ${GUTTER}px` }}>{children}</div>
  </section>
);

export default AboutSection;
