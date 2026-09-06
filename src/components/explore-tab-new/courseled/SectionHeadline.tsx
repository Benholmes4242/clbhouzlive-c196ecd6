import { A } from '@/features/courses/components/holes/analytical/tokens';

import { DISCOVER_FACT, SANS } from './tokens';

interface SectionHeadlineProps {
  title: string;
  count?: string;
}

/** Shared Scores section heading: one baseline and one right edge. */
export function SectionHeadline({ title, count }: SectionHeadlineProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        minWidth: 0,
        marginBottom: 10,
        fontFamily: SANS,
      }}
    >
      <h2
        style={{
          minWidth: 0,
          margin: 0,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: DISCOVER_FACT,
          lineHeight: 1.1,
        }}
      >
        {title}
      </h2>
      {count ? (
        <span
          className="tabular-nums"
          style={{
            flexShrink: 0,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: A.DIM,
          }}
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}