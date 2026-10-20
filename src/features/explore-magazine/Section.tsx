import type { CSSProperties, ReactNode } from 'react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';

/**
 * EX2 — the Rounds tab's one section head, moved unchanged out of
 * ScoresLeaderboardsPage so the sections it mounts can use it without an import
 * cycle back into the page. Do not re-export it from the page.
 */

export const GUTTER = 16;

export const EYEBROW = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
};

export function Section({
  eyebrow,
  contest,
  title,
  meta,
  metaAlign,
  first,
  lede,
  ledeStyle,
  children,
}: {
  eyebrow: string;
  contest: boolean;
  title: ReactNode;
  meta?: ReactNode;
  /** 'center' for a control in the meta slot — the row is baseline-aligned for text. */
  metaAlign?: 'center';
  first?: boolean;
  lede?: ReactNode;
  ledeStyle?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        fontFamily: SANS,
        paddingInline: GUTTER,
        marginTop: 0, // first section: the tab strip's own gap is the seam (matches All / Watch)
        // No rule between sections: the eyebrow separates them, so the seam is 18 + 18 = 36.
        paddingTop: first ? 0 : 18,
        marginBottom: 18,
      }}
    >
      {/* lineHeight 1 / 1.1 match Courses' SectionHead: the inherited 1.5 added ~7px of
          invisible leading between eyebrow and title, so equal margins read as unequal gaps. */}
      <div style={{ ...EYEBROW, lineHeight: 1, color: contest ? A.AMBER : A.DIM }}>{eyebrow}</div>
      <div
        style={{
          marginTop: 5,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: A.INK }}>
          {title}
        </div>
        {meta != null ? (
          <div
            className="tabular-nums"
            style={{
              ...EYEBROW,
              color: A.DIM,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              alignSelf: metaAlign,
              // A centred control is taller than the title; negative block margins stop it
              // setting the row height so the title governs the 5 / 12 gaps (Courses parity).
              ...(metaAlign === 'center' ? { marginTop: -5, marginBottom: -5 } : null),
            }}
          >
            {meta}
          </div>
        ) : null}
      </div>
      {lede != null ? (
        <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.45, color: A.MUTE, ...ledeStyle }}>{lede}</div>
      ) : null}
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}
