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

export function SectionHead({ kicker, title, tone = 'amber' }: SectionHeadProps) {
  return (
    <div>
      {/* Matched to ScoresLeaderboardsPage's local EYEBROW const (11 / 700 /
          0.16em / uppercase) — must not drift from it. A fork until that const
          is published as a shared token; KICKER is the 9px one neither uses. */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1, color: tone === 'amber' ? A.AMBER : A.MUTE }}>
        {kicker}
      </div>
      {title ? <h2
        style={{
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          color: A.INK,
          // Title marginTop 12 and HEAD_GAP 24 are MEASURED to match ScoresLeaderboardsPage's RENDERED head, not its source
          // values: deliberately larger than that page's own marginTop 5 / 12, because its
          // title row carries a ~44px toggle pill that makes the row taller than the words.
          // Do not "fix" these back to 5 and 12.
          marginTop: 12,
          marginBottom: 0,
        }}
      >
        {title}
      </h2> : null}
    </div>
  );
}

/** Gap between a section's head and its content — every section reads this. */
/* HEAD_GAP 24 and the title's marginTop 12 are MEASURED to match ScoresLeaderboardsPage's RENDERED head, not its source
 * values: deliberately larger than that page's own marginTop 5 / 12, because its
 * title row carries a ~44px toggle pill that makes the row taller than the words.
 * Do not "fix" these back to 5 and 12. */
export const HEAD_GAP = 24;

/** The wrapper every section's head + content sits in. */
export const SECTION_WRAP: React.CSSProperties = { padding: '20px 16px 14px' };
