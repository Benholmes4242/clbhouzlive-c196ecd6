import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * SectionHead — the one heading for the eight Courses page sections
 * (BRIEF_COURSES_PAGE_REBUILD §1a). Deliberately larger than SECTION_TITLE:
 * it carries a magazine section, not a panel. No section writes its own.
 */
export interface SectionHeadProps {
  kicker: string;
  /** Omitted = no title element at all (section 08's list head). */
  title?: string;
  tone?: 'amber' | 'quiet';
}

/* Head geometry, read by SectionHead AND its shell (BRIEF_COURSES_SKELETONS 2.2). */
export const HEAD_KICKER_SIZE = 11;
export const HEAD_TITLE_SIZE = 19;
export const HEAD_TITLE_LINE_HEIGHT = 1.1;
export const HEAD_TITLE_GAP = 5;

export function SectionHead({ kicker, title, tone = 'amber' }: SectionHeadProps) {
  return (
    <div>
      {/* Matched to ScoresLeaderboardsPage's local EYEBROW const (11 / 700 /
          0.16em / uppercase) — must not drift from it. A fork until that const
          is published as a shared token; KICKER is the 9px one neither uses. */}
      <div style={{ fontSize: HEAD_KICKER_SIZE, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1, color: tone === 'amber' ? A.AMBER : A.MUTE }}>
        {kicker}
      </div>
      {title ? <h2
        style={{
          fontSize: HEAD_TITLE_SIZE,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: HEAD_TITLE_LINE_HEIGHT,
          color: A.INK,
          // These are the Courses page's own head spacing. The Explore page is being
          // brought to these values, not the other way round.
          marginTop: HEAD_TITLE_GAP,
          marginBottom: 0,
        }}
      >
        {title}
      </h2> : null}
    </div>
  );
}

/** Gap between a section's head and its content — every section reads this. */
/* HEAD_GAP and the title's marginTop are the Courses page's own head spacing.
 * The Explore page is being brought to these values, not the other way round. */
export const HEAD_GAP = 12;

/** The wrapper every section's head + content sits in. */
export const SECTION_WRAP: React.CSSProperties = { padding: '20px 16px 14px' };
