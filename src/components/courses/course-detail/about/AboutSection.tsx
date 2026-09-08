/**
 * BRIEF_COURSE_TAB_REBUILD §1 — THE SECTION PRIMITIVE.
 *
 * The Course tab no longer wraps its blocks in `Panel`. Panel itself is
 * UNTOUCHED (it is imported by the business editor, verification, top100,
 * posts, moderation and shared sheets) — this tab simply stops calling it.
 *
 * THE HEADING IS THE SHARED ONE. DiscoverSectionHeading already sets the
 * heading exactly as briefed (16/700/-0.01em INK); only its right slot differed
 * (11/700 MUTE sentence case rather than DIM uppercase) and its gap (10 not
 * 14). EXPLORE WINS on a shared treatment — a member sees Explore and this tab,
 * and two headings differing only in letter case is precisely the drift that
 * gave us two board chips. So: shared heading, shared 10px gap, sentence-case
 * mute meta ("780 rounds", never "780 ROUNDS"). DiscoverSectionHeading is NOT
 * modified. This wrapper keeps the work Discover's heading does not do: the
 * 20px gutter and the 34px above each section.
 *
 * KICKERS ARE UNAFFECTED — 9/700/0.19em uppercase DIM stays for TEES, the stat
 * labels, board names and distribution labels. A kicker is not a section meta.
 */
import React from 'react';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';

/** §1 — the page gutter for every section on the tab. */
export const GUTTER = 20;

/** §1 — 34px above each section. */
export const SECTION_SPACE = 34;

/** Discover's 10px heading-to-content gap, so the two pages match. */
export const HEADING_GAP = 10;

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
  /** 11/700 MUTE sentence case, right-aligned on the heading baseline. */
  meta?: string | null;
  /** Makes the meta slot a button ("See all 18"). */
  onMetaPress?: () => void;
  /** Renders instead of a heading, at the kicker treatment. */
  kicker?: string;
  /** First section on the tab takes no 34px lead-in. */
  first?: boolean;
  /** Overrides the 34px lead-in (the tee control sits 16px under the facts). */
  space?: number;
  /** Content bleeds past the gutter (map, mosaic). Heading keeps its gutter. */
  bleed?: boolean;
  id?: string;
  children: React.ReactNode;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  heading,
  meta,
  onMetaPress,
  kicker,
  first = false,
  space,
  bleed = false,
  id,
  children,
}) => (
  <section
    style={{
      marginTop: first ? 0 : space ?? SECTION_SPACE,
      fontFamily: SANS,
    }}
  >
    {heading ? (
      <div style={{ padding: `0 ${GUTTER}px` }}>
        <DiscoverSectionHeading id={id} title={heading} right={meta ?? null} onRightPress={onMetaPress} />
      </div>
    ) : kicker || meta ? (
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
        {kicker ? <span style={ABOUT_KICKER}>{kicker}</span> : <span aria-hidden="true" />}
        {meta ? (
          <span
            className="tabular-nums lining-nums"
            style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: A.MUTE, whiteSpace: 'nowrap' }}
          >
            {meta}
          </span>
        ) : null}
      </div>
    ) : null}
    <div style={bleed ? undefined : { padding: `0 ${GUTTER}px` }}>{children}</div>
  </section>
);

export default AboutSection;
