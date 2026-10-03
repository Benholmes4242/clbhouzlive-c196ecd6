/**
 * THE CABINET — the band under the career header.
 *
 * SHOWPIECES: at most TWO tiles, drawn only from first_birdie / first_eagle /
 * hole_in_one (SHOWPIECE_BADGE_IDS) with a non-zero count. Top 100 is excluded
 * because it has its own tab.
 *
 * RARITY SORT (unchanged): ascending population share from data.shares via
 * measuredShare; below the denominator floor the member's own count ascending
 * stands in. This deliberately diverges from LIFETIME_ORDER — do not harmonise.
 *
 * RECORDS TILE: alongside the showpieces, a RECORDS WON tile (RECORDS HELD when
 * the field read is unavailable) fed by recordSplit(), shared with the Courses
 * tab. Tapping it switches the sheet to the Courses tab.
 *
 * Nothing to show: the band does not render. Never a placeholder, never a zero.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('handicap');
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
      label: split.available ? t('career.cabinetRecordsWon') : t('career.cabinetRecordsHeld'),
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
