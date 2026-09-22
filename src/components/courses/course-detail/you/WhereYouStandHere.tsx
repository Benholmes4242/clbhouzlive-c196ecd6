/**
 * BRIEF_YOU_TAB_STANDINGS — the compact "Where you stand here" block on the
 * course You tab.
 *
 * SAME DATA, SAME RULES, TIGHTER DENSITY. Every figure, line and colour
 * decision comes from career/standings.ts — discState, standingLine, tiedWith
 * and formatValue are IMPORTED, never re-implemented. One rule, one place.
 *
 * COMPACT MEANS THE NUMERAL, NOT THE DISC. A row here is one line —
 * {label} {value} {rank}ord /{field_size} — with the standing line beneath it
 * in the muted tone. No 34px disc: at this density a disc reads as clutter,
 * not as a trophy.
 *
 * THE NUMERAL'S THREE TONES, from the same inputs the disc uses:
 *   medal_earned && rank === 1  →  amber
 *   !medal_earned               →  dim
 *   otherwise                   →  default ink
 *
 * TENURE ROWS (is_tenure) sit in the same block with NO rank emphasis at all:
 * label, value and the line. 112 rounds here is a fact about the course, not a
 * placing. No second heading for two rows.
 *
 * NO EMPTY STATE. The block appears only when the RPC returns rows; a member
 * with no standings here simply does not see it.
 */
import React from 'react';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from '../about/AboutSection';
import { ordinal } from './youBits';
import {
  categoryLabel,
  formatValue,
  standingLine,
} from '@/components/profile/handicap/whs/gam/trophy-room/career/standings';
import type { MemberStandingRow } from '@/hooks/gam/useMemberStandings';

function rankTone(row: MemberStandingRow): string {
  if (!row.medal_earned) return A.DIM;
  return row.rank === 1 ? A.AMBER : A.INK;
}

const CompactRow: React.FC<{ row: MemberStandingRow }> = ({ row }) => {
  const line = standingLine(row);
  return (
    <div data-you-standing-row={row.category} style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            fontWeight: 600,
            color: A.MUTE,
            fontFamily: SANS,
          }}
        >
          {categoryLabel(row.category)}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: A.INK,
            fontFamily: SANS,
            ...FIGS,
          }}
        >
          {formatValue(row)}
        </span>
        {!row.is_tenure ? (
          <span
            data-you-standing-rank="true"
            style={{
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
              color: rankTone(row),
              fontFamily: SANS,
              ...FIGS,
            }}
          >
            {ordinal(row.rank)} /{row.field_size}
          </span>
        ) : null}
      </div>
      {line ? (
        <div
          data-you-standing-line="true"
          style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: A.DIM, fontFamily: SANS, ...FIGS }}
        >
          {line}
        </div>
      ) : null}
    </div>
  );
};

const WhereYouStandHere: React.FC<{ rows: MemberStandingRow[] }> = ({ rows }) => {
  if (rows.length === 0) return null;
  const standings = rows.filter((r) => !r.is_tenure);
  const tenure = rows.filter((r) => r.is_tenure);
  return (
    <AboutSection heading="Where you stand here">
      <div>
        {standings.map((row) => (
          <CompactRow key={row.category} row={row} />
        ))}
        {tenure.map((row) => (
          <CompactRow key={row.category} row={row} />
        ))}
      </div>
    </AboutSection>
  );
};

export default WhereYouStandHere;
