import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListProgress } from '@/hooks/gam/useTop100ListProgress';

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
  viewerId: string | undefined;
  /** The distinct all-lists count published on the tab (Phase 1 §1.3). Never recomputed here. */
  distinctTop100: number | null;
  /** List currently selected in the filter bar. */
  listSlug: string;
}

export const TheChaseSection: React.FC<Props> = ({ userId, viewerId, distinctTop100, listSlug }) => {
  const navigate = useNavigate();
  const { data: progress } = useTop100ProgressForUser(userId);
  const { data: listCourses } = useTop100ListProgress(listSlug, userId, viewerId ?? userId);

  const lists = progress?.lists ?? [];
  if (!lists.some((l) => l.played > 0)) return null;

  const listName = lists.find((l) => l.listSlug === listSlug)?.listName ?? '';
  const unplayed = (listCourses ?? [])
    .filter((c) => !c.is_owner_played && c.rank != null)
    .sort((a, b) => (a.rank as number) - (b.rank as number));
  const target = unplayed[0];
  const allPlayed = !!listCourses && listCourses.length > 0 && unplayed.length === 0;

  return (
    <section data-testid="the-chase" style={{ padding: '0 20px' }}>
      <SectionHeader kicker="THE CHASE" title="Four hundreds, one life" />
      {lists.map((l) => (
        <div key={l.listSlug} style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 66, flexShrink: 0, fontSize: 11, fontWeight: 700, color: A.BODY }}>{l.listName}</span>
          <ChaseBar ratio={l.total > 0 ? l.played / l.total : 0} fill={A.AMBER} />
          <span style={{ width: 62, flexShrink: 0, textAlign: 'right', fontSize: 11, fontWeight: 700, color: A.BODY, ...NUMERIC }}>
            {l.played} / {l.total}
          </span>
        </div>
      ))}
      {distinctTop100 != null && (
        <p style={{ margin: '10px 0 0', fontSize: 11.5, color: A.DIM }}>
          <b style={{ color: A.BODY, fontWeight: 700, ...NUMERIC }}>{distinctTop100}</b> distinct courses — the lists overlap, so they do not sum.
        </p>
      )}
      {(target || allPlayed) && (
        <div style={{ marginTop: 12, background: A.PANEL, borderRadius: 12, padding: 11 }}>
          {allPlayed ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>You have played the whole list.</span>
          ) : (
            <button
              type="button"
              onClick={() => navigate(`/courses/${target!.course_id}`)}
              style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: A.FAINT }}>
                NEXT ON THIS LIST
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: A.SOFT }}>
                  {target!.thumbnail_image && (
                    <img src={target!.thumbnail_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>{target!.course_name}</div>
                  <div style={{ fontSize: 11, color: A.DIM, ...NUMERIC }}>#{target!.rank} {listName}</div>
                </div>
              </div>
            </button>
          )}
        </div>
      )}
    </section>
  );
};
