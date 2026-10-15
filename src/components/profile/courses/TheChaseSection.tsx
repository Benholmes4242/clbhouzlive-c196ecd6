import React from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { RANK_LIST_BY_SLUG, RANK_LIST_LABEL } from '@/features/courses/_shared/courseRankLabels';

// RANK_LIST_LABEL is the one home for how these four lists are named on screen. top100_lists.name is unbounded database text and will break a fixed-width row. Do not print it directly.
const displayListName = (slug: string, fallback: string) =>
  slug in RANK_LIST_BY_SLUG ? RANK_LIST_LABEL[RANK_LIST_BY_SLUG[slug]] : fallback;

const TRACK = 'rgba(255,255,255,0.07)';
const ZERO_FILL = 'rgba(255,255,255,0.14)';
const NUMERIC: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

/** 7px rounded track; non-zero fills never drop below 2%, a true zero shows a neutral fill. */
export const ChaseBar: React.FC<{ ratio: number; fill: string }> = ({ ratio, fill }) => {
  const zero = !(ratio > 0);
  const pct = zero ? 100 : Math.max(2, Math.min(100, ratio * 100));
  return (
    <div style={{ flex: 1, height: 7, borderRadius: 7, background: TRACK, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 7, background: zero ? ZERO_FILL : fill }} />
    </div>
  );
};

interface Props {
  userId: string;
}

export const TheChaseSection: React.FC<Props> = ({ userId }) => {
  const { data: progress } = useTop100ProgressForUser(userId);

  const lists = progress?.lists ?? [];
  if (!lists.some((l) => l.played > 0)) return null;

  return (
    <section data-testid="the-chase" style={{ padding: '0 20px' }}>
      <SectionHeader kicker="TOP 100 GOLF COURSES" title="Four lists, one life" />
      {lists.map((l) => (
        <div key={l.listSlug} style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 66, flexShrink: 0, fontSize: 11, fontWeight: 700, color: A.BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayListName(l.listSlug, l.listName)}
          </span>
          <ChaseBar ratio={l.total > 0 ? l.played / l.total : 0} fill={A.AMBER} />
          <span style={{ width: 62, flexShrink: 0, textAlign: 'right', fontSize: 11, fontWeight: 700, color: A.BODY, ...NUMERIC }}>
            {l.played} / {l.total}
          </span>
        </div>
      ))}
    </section>
  );
};
