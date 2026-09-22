/**
 * WHERE YOU STAND — the member's course standings, exactly as
 * public.get_member_standings reports them.
 *
 * TWO GROUPS PER COURSE. Competitive placings take a disc; the tenure boards
 * (most_rounds_*, most_birdies_*) do NOT. 112 rounds at Sundridge Park is a
 * true and interesting fact; it is not a placing, and a newcomer can never win
 * it. It is shown, never awarded — do not "simplify" it into the disc group.
 */
import React from 'react';

import { GAM } from '../../../tokens';
import { REC } from '../tokens';
import { Caption, MetaLabel, Panel, RowButton, SectionTitle } from '../Primitives';
import {
  categoryLabel,
  courseSubline,
  discState,
  formatValue,
  groupStandings,
  standingLine,
  type DiscState,
} from '../standings';
import type { MemberStandingRow } from '@/hooks/gam/useMemberStandings';

const DISC = 34;

const DISC_STYLE: Record<DiscState, React.CSSProperties> = {
  gold: { background: REC.AMBER, border: `1px solid ${REC.AMBER}`, color: REC.CANVAS },
  silver: { background: GAM.SILVER, border: `1px solid ${GAM.SILVER}`, color: REC.CANVAS },
  bronze: { background: GAM.BRONZE, border: `1px solid ${GAM.BRONZE}`, color: REC.INK },
  /** Beat a real field but off the podium: solid neutral, real border. */
  placed: { background: REC.PANEL_2, border: `1px solid ${REC.FAINT}`, color: REC.INK },
  /** No medal: transparent, DASHED border, dim text. */
  plain: { background: 'transparent', border: `1px dashed ${REC.TRACK}`, color: REC.DIM },
};

const Disc: React.FC<{ row: MemberStandingRow }> = ({ row }) => {
  const state = discState(row);
  return (
    <div
      data-standing-disc={state}
      style={{ width: DISC, flexShrink: 0, textAlign: 'center' }}
    >
      <div
        style={{
          width: DISC,
          height: DISC,
          borderRadius: DISC / 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          ...REC.TABULAR,
          ...DISC_STYLE[state],
        }}
      >
        {row.rank}
      </div>
      <div style={{ fontSize: 9, color: REC.DIM, paddingTop: 3, ...REC.TABULAR }}>
        of {row.field_size}
      </div>
    </div>
  );
};

const StandingRow: React.FC<{ row: MemberStandingRow; withDisc: boolean; last: boolean }> = ({
  row,
  withDisc,
  last,
}) => {
  const line = standingLine(row);
  return (
    <RowButton last={last}>
      <div
        data-standing-row={row.category}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}
      >
        {withDisc ? <Disc row={row} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <MetaLabel>{categoryLabel(row.category)}</MetaLabel>
          <div
            data-standing-value="true"
            style={{ fontSize: 16, fontWeight: 700, color: REC.INK, paddingTop: 2, ...REC.TABULAR }}
          >
            {formatValue(row)}
          </div>
          {line ? (
            <div data-standing-line="true" style={{ fontSize: 11.5, color: REC.MUTE, paddingTop: 2 }}>
              {line}
            </div>
          ) : null}
        </div>
      </div>
    </RowButton>
  );
};

export const StandingsPanel: React.FC<{ rows: MemberStandingRow[] }> = ({ rows }) => {
  const groups = groupStandings(rows);

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
      <SectionTitle>Where you stand</SectionTitle>
      {groups.map((group) => (
        <div key={group.courseId} data-standing-course={group.courseId} style={{ marginBottom: 4 }}>
          <div style={{ padding: '4px 2px 8px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: REC.INK, letterSpacing: '-0.01em' }}>
              {group.courseName}
            </div>
            <div style={{ fontSize: 11.5, color: REC.DIM, paddingTop: 2, ...REC.TABULAR }}>
              {courseSubline(group)}
            </div>
          </div>
          {group.standings.length > 0 ? (
            <Panel title="Standings">
              {group.standings.map((row, i) => (
                <StandingRow
                  key={`${group.courseId}-${row.category}`}
                  row={row}
                  withDisc
                  last={i === group.standings.length - 1}
                />
              ))}
            </Panel>
          ) : null}
          {group.tenure.length > 0 ? (
            <Panel title="At this course">
              {group.tenure.map((row, i) => (
                <StandingRow
                  key={`${group.courseId}-${row.category}`}
                  row={row}
                  withDisc={false}
                  last={i === group.tenure.length - 1}
                />
              ))}
            </Panel>
          ) : null}
        </div>
      ))}
    </>
  );
};

export default StandingsPanel;
