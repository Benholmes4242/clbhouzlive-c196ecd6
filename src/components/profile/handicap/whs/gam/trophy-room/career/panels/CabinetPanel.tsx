/**
 * THE CABINET — up to three medal tiles under the career header.
 *
 * WHICH THREE: the member's SHOWPIECES (SHOWPIECE_BADGE_IDS — the one list,
 * never a second) with a non-zero count, ordered BY RARITY ASCENDING.
 *
 * THIS DELIBERATELY DIVERGES FROM LIFETIME_ORDER, which leads with birdies.
 * A cabinet shows what is rare; 323 birdies is volume and belongs in the list
 * below, not behind glass. Do not "harmonise" the two orders.
 *
 * Rarity is the population share the sheet already loads (data.shares via
 * measuredShare). Below the denominator floor there is no honest share, so the
 * member's own count ascending stands in. No new rarity source.
 *
 * Fewer than three: only what exists, same tile width, left-aligned. None: the
 * band does not render. Never a placeholder, never a zero.
 */
import React from 'react';
import { Medal } from 'lucide-react';
import { REC } from '../tokens';
import { measuredShare } from '../shareModel';
import { tierTone, toneAlpha } from '../medalTone';
import { isTop100Achievement, SHOWPIECE_BADGE_IDS, SHOWPIECE_COUNTER_LABEL, shortenShowpieceCaption } from '../../_shared/showpieces';
import { MEDAL_BRONZE, MEDAL_GOLD } from '@/features/tourhub/_shared/tokens';
import type { Achievement, CareerData } from '../types';

interface Props {
  data: CareerData;
  items: Achievement[];
  /** From recordSplit() -- the cabinet never computes its own split. */
  split: { available: boolean; won: number; total: number };
  onShowCourses: () => void;
}

interface Tile {
  key: string;
  tone: string;
  value: number;
  label: string;
  onClick: () => void;
}

export const CabinetPanel: React.FC<Props> = ({ data, items, split, onShowCourses }) => {
  const floor = data.config.shareMinDenominator;
  const pieces = items
    .filter((a) => SHOWPIECE_BADGE_IDS.has(a.badgeId) && !isTop100Achievement(a.badgeId) && (a.currentValue ?? 0) > 0)
    .map((a) => ({ a, share: measuredShare(data.shares.get(a.badgeId), floor) }))
    .sort((x, y) => {
      if (x.share !== null && y.share !== null && x.share !== y.share) return x.share - y.share;
      return (x.a.currentValue ?? 0) - (y.a.currentValue ?? 0);
    })
    .slice(0, 2);

  const tiles: Tile[] = pieces.map(({ a }) => {
    // A non-zero showpiece below tier 1 still earns a tile; it takes the
    // bottom-third tone rather than a hollow chip — it is behind glass.
    const caption = SHOWPIECE_COUNTER_LABEL[a.badgeId];
    return {
      key: a.badgeId,
      tone: tierTone(a) ?? MEDAL_BRONZE,
      value: a.currentValue ?? 0,
      label: caption ? shortenShowpieceCaption(caption) : a.name,
      onClick: () => data.onOpen({ kind: 'counting', badgeId: a.badgeId }),
    };
  });
  if (split.total > 0) {
    tiles.push({
      key: 'records',
      tone: MEDAL_GOLD,
      value: split.available ? split.won : split.total,
      label: split.available ? 'RECORDS WON' : 'RECORDS HELD',
      onClick: onShowCourses,
    });
  }

  if (tiles.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
      {tiles.map(({ key, tone, value, label, onClick }) => {
        return (
          <button
            key={key}
            type="button"
            onClick={onClick}
            aria-label={`${label}, ${value}`}
            style={{
              flex: '1 1 0',
              maxWidth: 'calc((100% - 16px) / 3)',
              minWidth: 0,
              textAlign: 'left',
              borderRadius: 13,
              padding: '13px 12px',
              border: `1px solid ${toneAlpha(tone, 0.26)}`,
              background: toneAlpha(tone, 0.07),
              fontFamily: REC.FONT,
              cursor: 'pointer',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 26,
                height: 30,
                borderRadius: 7,
                display: 'grid',
                placeItems: 'center',
                background: tone,
                color: REC.CANVAS,
              }}
            >
              <Medal size={15} strokeWidth={2.25} />
            </span>
            <span
              style={{
                display: 'block',
                marginTop: 10,
                fontSize: 25,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: REC.INK,
                lineHeight: 1,
                ...REC.TABULAR,
              }}
            >
              {value}
            </span>
            <span
              style={{
                display: 'block',
                marginTop: 6,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: REC.MUTE,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CabinetPanel;
