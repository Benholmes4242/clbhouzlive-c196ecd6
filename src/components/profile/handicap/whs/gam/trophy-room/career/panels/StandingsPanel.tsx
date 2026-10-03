/**
 * WHERE YOU STAND — the member's course standings, exactly as
 * public.get_member_standings reports them.
 *
 * ONE-OPEN ACCORDION. Each course is a header; the open course shows a
 * 90 days / all time table. Competitive placings take a disc; the tenure
 * boards (most_rounds_*, most_birdies_*) do NOT — they render as plain values.
 * 112 rounds at Sundridge Park is a true fact, not a placing: shown, never
 * awarded. The course page's You tab keeps the full detail.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';

import { GAM } from '../../../tokens';
import { REC, LABEL } from '../tokens';
import { Caption, Collapsible, Kicker, MetaLabel, Panel, SectionTitle } from '../Primitives';
import {
  courseSubline,
  discState,
  formatValue,
  groupStandings,
  type DiscState,
  type StandingsCourseGroup,
} from '../standings';
import { pairStandings } from '@/components/courses/course-detail/you/WhereYouStandHere';
import type { MemberStandingRow } from '@/hooks/gam/useMemberStandings';

const DISC = 28;
const DOT = 12;
const MAX_DOTS = 6;
const GRID = 'minmax(0, 1fr) 64px 64px';

const DISC_STYLE: Record<DiscState, React.CSSProperties> = {
  gold: { background: REC.AMBER, border: `1px solid ${REC.AMBER}`, color: REC.CANVAS },
  silver: { background: GAM.SILVER, border: `1px solid ${GAM.SILVER}`, color: REC.CANVAS },
  bronze: { background: GAM.BRONZE, border: `1px solid ${GAM.BRONZE}`, color: REC.INK },
  /** Beat a real field but off the podium: solid neutral, real border. */
  placed: { background: REC.PANEL_2, border: `1px solid ${REC.FAINT}`, color: REC.INK },
  /** No medal: transparent, DASHED border, dim text. */
  plain: { background: 'transparent', border: `1px dashed ${REC.TRACK}`, color: REC.DIM },
};

const MEDAL_ORDER: DiscState[] = ['gold', 'silver', 'bronze'];

const Cell: React.FC<{ row?: MemberStandingRow }> = ({ row }) => {
  if (!row) return <div />;
  if (row.is_tenure) {
    return (
      <div style={{ textAlign: 'center', fontSize: 12.5, color: REC.MUTE, ...REC.TABULAR }}>
        {formatValue(row)}
      </div>
    );
  }
  const state = discState(row);
  return (
    <div data-standing-disc={state} style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          width: DISC,
          height: DISC,
          borderRadius: DISC / 2,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12.5,
          fontWeight: 700,
          ...REC.TABULAR,
          ...DISC_STYLE[state],
        }}
      >
        {row.rank}
      </div>
    </div>
  );
};

function headerSubline(group: StandingsCourseGroup): string {
  const golds = group.standings.filter((r) => r.medal_earned && r.rank === 1).length;
  const boards = group.standings.length + group.tenure.length;
  return golds > 0 ? `1st on ${golds} of ${boards} boards` : courseSubline(group);
}

function medalDots(group: StandingsCourseGroup): DiscState[] {
  const states = group.standings.map(discState).filter((s) => MEDAL_ORDER.includes(s));
  states.sort((a, b) => MEDAL_ORDER.indexOf(a) - MEDAL_ORDER.indexOf(b));
  return states.slice(0, MAX_DOTS);
}

const CourseItem: React.FC<{
  group: StandingsCourseGroup;
  open: boolean;
  last: boolean;
  onToggle: () => void;
}> = ({ group, open, last, onToggle }) => {
  const navigate = useNavigate();
  const boards = pairStandings([...group.standings, ...group.tenure]);
  const dots = open ? [] : medalDots(group);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <div
      data-standing-course={group.courseId}
      style={{ borderBottom: last ? 'none' : `1px solid ${REC.BORDER}` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '13px 14px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          fontFamily: REC.FONT,
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: REC.INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {group.courseName}
          </div>
          <div style={{ fontSize: 11.5, color: REC.MUTE, paddingTop: 2, ...REC.TABULAR }}>
            {headerSubline(group)}
          </div>
        </div>
        {dots.length > 0 ? (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} aria-hidden>
            {dots.map((s, i) => (
              <span
                key={i}
                style={{
                  width: DOT,
                  height: DOT,
                  borderRadius: DOT / 2,
                  background: DISC_STYLE[s].background,
                }}
              />
            ))}
          </div>
        ) : null}
        <Chevron size={16} color={REC.DIM} style={{ flexShrink: 0 }} />
      </button>

      {open ? (
        <>
          <div style={{ padding: '0 14px 6px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                padding: '6px 0',
                borderBottom: `1px solid ${REC.TABLE_HEAD_LINE}`,
              }}
            >
              <div />
              <div style={{ ...LABEL, fontFamily: REC.FONT, textAlign: 'center' }}>90 days</div>
              <div style={{ ...LABEL, fontFamily: REC.FONT, textAlign: 'center' }}>All time</div>
            </div>
            {boards.map((b, i) => (
              <div
                key={b.key}
                data-standing-row={b.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom:
                    i === boards.length - 1 ? 'none' : `1px solid ${REC.TABLE_ROW_LINE}`,
                }}
              >
                <div style={{ fontSize: 13, color: REC.INK, minWidth: 0 }}>{b.label}</div>
                <Cell row={b.cells['90d']} />
                <Cell row={b.cells.all} />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/courses/${group.courseId}?tab=you`)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '11px 14px',
              background: 'transparent',
              border: 'none',
              borderTop: `1px solid ${REC.BORDER}`,
              fontFamily: REC.FONT,
              fontSize: 12.5,
              fontWeight: 600,
              color: REC.INK,
              cursor: 'pointer',
            }}
          >
            Open the course ›
          </button>
        </>
      ) : null}
    </div>
  );
};

export const StandingsPanel: React.FC<{ rows: MemberStandingRow[] }> = ({ rows }) => {
  const { t } = useTranslation('handicap');
  const groups = groupStandings(rows);
  const [openId, setOpenId] = useState<string | null>(groups[0]?.courseId ?? null);

  if (groups.length === 0) {
    return (
      <>
        <SectionTitle>Where you stand</SectionTitle>
        <Caption>
          No course standings yet — they start once someone else has played a course you have.
        </Caption>
      </>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          padding: '0 2px 8px',
          marginTop: 22,
        }}
      >
        <Kicker>Where you stand</Kicker>
        <MetaLabel>Your place on each board</MetaLabel>
      </div>
      <Panel>
        <Collapsible
          threshold={5}
          collapsedCount={5}
          showAllLabel={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              All {groups.length} courses
              <ChevronRight size={13} strokeWidth={2.4} />
            </span>
          }
          showFewerLabel={t('career.showFewer')}
        >
          {groups.map((group, i) => (
            <CourseItem
              key={group.courseId}
              group={group}
              open={openId === group.courseId}
              last={i === groups.length - 1}
              onToggle={() =>
                setOpenId((prev) => (prev === group.courseId ? null : group.courseId))
              }
            />
          ))}
        </Collapsible>
      </Panel>
    </>
  );
};

export default StandingsPanel;
