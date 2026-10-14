import React from 'react';
import { KICKER } from '@/lib/tokens/type';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * SectionHead — the one heading for the eight Courses page sections
 * (BRIEF_COURSES_PAGE_REBUILD §1a). Deliberately larger than SECTION_TITLE:
 * it carries a magazine section, not a panel. No section writes its own.
 */
export interface SectionHeadProps {
  n: string;
  kicker: string;
  title: string;
  subline?: string;
  tone?: 'amber' | 'quiet';
}

export function SectionHead({ n, kicker, title, subline, tone = 'amber' }: SectionHeadProps) {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <div
          aria-hidden="true"
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: 'rgba(248,250,252,0.22)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums lining-nums',
            flex: 'none',
          }}
        >
          {n}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ ...KICKER, lineHeight: 1, color: tone === 'amber' ? A.AMBER : A.MUTE }}>
            {kicker}
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.036em',
              lineHeight: 1.1,
              color: A.INK,
              marginTop: 7,
              marginBottom: 0,
            }}
          >
            {title}
          </h2>
        </div>
      </div>
      {subline ? (
        <p style={{ fontSize: 12, lineHeight: 1.5, color: A.DIM, marginTop: 8, marginBottom: 0 }}>
          {subline}
        </p>
      ) : null}
    </div>
  );
}

/** The wrapper every section's head + content sits in. */
export const SECTION_WRAP: React.CSSProperties = { padding: '18px 16px 15px' };
