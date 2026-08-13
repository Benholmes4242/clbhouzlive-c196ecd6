import type { CSSProperties } from 'react';

import { MomentTile } from './MomentTile';
import type { Moment } from './hooks/useMomentsOfTheWeek';
import { isNewSince } from './newSince';
import { NEW_CARD_RING } from './tokens';

/**
 * MOMENTS GRID (BRIEF_MOMENTS_COMMUNITY_GRID) — the ONE geometry for member
 * media, shared by the Discover section and the see-all sheet. Two layouts of
 * one thing was the defect; every remaining difference between the surfaces is
 * a prop passed in here.
 *
 * The unit is a BLOCK OF EXACTLY THREE: one TALL tile beside a column of TWO
 * SHORTS, where SHORT is DERIVED as (tall - gap) / 2 so the block can never go
 * ragged. Tiles are chunked in rank order and the FIRST tile of each block
 * takes the tall slot, so hierarchy cascades instead of resetting. The tall
 * tile ALTERNATES SIDE BY BLOCK INDEX ONLY — block 1 left, block 2 right.
 * A remainder of one renders FULL WIDTH (never half, which leaves a hole); a
 * remainder of two renders as a pair row. Trailing rows take no alternation
 * turn.
 *
 * Every tile is labelled with the COURSE, never the poster — Discover is
 * course-led, and an unlabelled wall of media is unattributed.
 */

interface Props {
  moments: Moment[];
  /** Omit for the uncapped sheet. */
  cap?: number;
  gap: number;
  tall: number;
  radius: number;
  /** Last-seen stamp for the new-since ring; null/undefined marks nothing. */
  lastSeen?: number | null;
  onTilePress: (m: Moment) => void;
  autoplayGroup: string;
}

export function MomentsGrid({
  moments,
  cap,
  gap,
  tall,
  radius,
  lastSeen = null,
  onTilePress,
  autoplayGroup,
}: Props) {
  // DERIVED, never a second constant: short + gap + short === tall, always.
  const short = (tall - gap) / 2;

  const shown = typeof cap === 'number' ? moments.slice(0, cap) : moments;

  const blockCount = Math.floor(shown.length / 3);
  const blocks: Moment[][] = [];
  for (let i = 0; i < blockCount; i += 1) blocks.push(shown.slice(i * 3, i * 3 + 3));
  const trailing = shown.slice(blockCount * 3);

  const tile = (m: Moment, height: number, extra?: CSSProperties) => (
    <MomentTile
      key={m.key}
      moment={m}
      onPress={onTilePress}
      radius={radius}
      initialsSize={height === tall ? 30 : 20}
      // Both heights are large enough for moving video to read.
      autoplayGroup={autoplayGroup}
      labelSize={10}
      // Inside the tile — the gutter does not touch it.
      labelInset={8}
      scrimStop="45%"
      style={{
        height,
        ...extra,
        ...(isNewSince(m.post.createdAt, lastSeen) ? NEW_CARD_RING : null),
      }}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {blocks.map((block, bi) => {
        // ALTERNATION COUNTS BLOCKS ONLY — trailing rows take no turn.
        const tallLeft = bi % 2 === 0;
        const [lead, a, b] = block;
        return (
          <div
            key={lead.key}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}
          >
            {tile(lead, tall, {
              gridColumn: tallLeft ? 1 : 2,
              gridRow: '1 / span 2',
            })}
            {tile(a, short, { gridColumn: tallLeft ? 2 : 1, gridRow: 1 })}
            {tile(b, short, { gridColumn: tallLeft ? 2 : 1, gridRow: 2 })}
          </div>
        );
      })}

      {/* A LEFTOVER SINGLE TILE ALWAYS GOES FULL WIDTH. */}
      {trailing.length === 1 && <div>{tile(trailing[0], short, { width: '100%' })}</div>}

      {trailing.length === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
          {trailing.map((m) => tile(m, short))}
        </div>
      )}
    </div>
  );
}

export default MomentsGrid;
