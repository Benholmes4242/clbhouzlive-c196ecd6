import type { CSSProperties } from 'react';

import { CreatorCard } from './CreatorCard';
import { MomentTile } from './MomentTile';
import type { CommunityCreator } from './hooks/useCommunityCreators';
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
 *
 * CREATOR CARDS (BRIEF_COMMUNITY_CREATOR_CARDS) enter IN THE COLUMN FLOW, each
 * taking the TALL slot of a block — so a card is exactly `tall`, the same
 * arithmetic every other block obeys. Cards never take block 0 (the section
 * opens on media) and they take DIFFERENT blocks, so alternation puts them in
 * different columns at different depths rather than in a level banner row.
 * The geometry, the gutter and the tiles are untouched; a caller that passes no
 * creators (the see-all sheet, the community page) renders exactly as before.
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
  /**
   * Creator cards to place in TALL slots, in relevance order. Omitted or empty
   * renders the mosaic exactly as it is today — no gap, no placeholder.
   */
  creators?: CommunityCreator[];
  onCreatorPress?: (c: CommunityCreator) => void;
}

/** The section opens on media, so a card can never take the first block. */
const FIRST_CARD_BLOCK = 1;

export function MomentsGrid({
  moments,
  cap,
  gap,
  tall,
  radius,
  lastSeen = null,
  onTilePress,
  autoplayGroup,
  creators,
  onCreatorPress,
}: Props) {
  // DERIVED, never a second constant: short + gap + short === tall, always.
  const short = (tall - gap) / 2;

  const shown = typeof cap === 'number' ? moments.slice(0, cap) : moments;
  const cards = onCreatorPress ? (creators ?? []) : [];

  // BLOCK BUILD. A block is one TALL slot plus two SHORTS. The tall slot is a
  // creator card whenever one is queued AND we are past the opening block;
  // otherwise it is the next media tile in rank order.
  type Block = { key: string; tall: Moment | CommunityCreator; shorts: Moment[] };
  const blocks: Block[] = [];
  let i = 0;
  let ci = 0;
  while (true) {
    const bi = blocks.length;
    const card = bi >= FIRST_CARD_BLOCK ? cards[ci] : undefined;
    if (card && shown.length - i >= 2) {
      blocks.push({ key: `creator-${card.userId}`, tall: card, shorts: shown.slice(i, i + 2) });
      i += 2;
      ci += 1;
      continue;
    }
    if (shown.length - i >= 3) {
      blocks.push({ key: shown[i].key, tall: shown[i], shorts: shown.slice(i + 1, i + 3) });
      i += 3;
      continue;
    }
    break;
  }
  const trailing = shown.slice(i);

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
        const [a, b] = block.shorts;
        const isCard = !('key' in block.tall);
        return (
          <div
            key={block.key}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}
          >
            {isCard ? (
              // EXACTLY `tall` — the height is arithmetic, not a design choice.
              <CreatorCard
                creator={block.tall as CommunityCreator}
                height={tall}
                radius={radius}
                onPress={onCreatorPress!}
                style={{ gridColumn: tallLeft ? 1 : 2, gridRow: '1 / span 2' }}
              />
            ) : (
              tile(block.tall as Moment, tall, {
                gridColumn: tallLeft ? 1 : 2,
                gridRow: '1 / span 2',
              })
            )}
            {a && tile(a, short, { gridColumn: tallLeft ? 2 : 1, gridRow: 1 })}
            {b && tile(b, short, { gridColumn: tallLeft ? 2 : 1, gridRow: 2 })}
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
