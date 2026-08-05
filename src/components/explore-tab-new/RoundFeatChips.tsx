import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { RoundFeat } from '@/lib/gam/roundFeats';

/**
 * RoundFeatChips - canonical feat badge strip.
 * Used by Discover "Friends' latest rounds" rail and the see-all sheet rows.
 * Styling is fixed: do not fork or restyle per surface.
 *
 * Two species only (round 3 spec):
 *   STANDARD   under par, eagle, birdie haul, clean card -> ink on canvas
 *   LEGENDARY  hole in one, albatross                    -> gold, the one exception
 *
 * The hcp delta chip is a different species (semantic banding) and keeps
 * featChipBase, which is exported for that purpose only.
 */

const INK = '#0E1216';
const CANVAS = '#F4F6F9';
const GOLD = '#D8A93C';

/** Geometry shared with the semantic delta chip. Do not restyle. */
export const featChipBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 6px',
  borderRadius: 4,
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

/** Badge geometry - round 3 spec. */
const badgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 8.5,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  borderRadius: 6,
  padding: '3px 7px',
};

const STANDARD_STYLE: CSSProperties = {
  color: INK,
  background: CANVAS,
  border: '1px solid rgba(14,18,22,0.14)',
};

const LEGENDARY_STYLE: CSSProperties = {
  color: GOLD,
  background: CANVAS,
  border: `1px solid ${GOLD}`,
};

function isLegendary(key: RoundFeat['key']): boolean {
  return key === 'holes_in_one' || key === 'albatrosses';
}

export function useRoundFeatLabel(): (f: RoundFeat) => string {
  const { t } = useTranslation('courses');
  return (f: RoundFeat): string => {
    switch (f.key) {
      case 'holes_in_one':
        return t('discover.friendsRounds.feats.holesInOne', {
          count: f.count,
          defaultValue_one: 'HOLE IN ONE',
          defaultValue_other: '{{count}} HOLES IN ONE',
        });
      case 'albatrosses':
        return t('discover.friendsRounds.feats.albatrosses', {
          count: f.count,
          defaultValue_one: 'ALBATROSS',
          defaultValue_other: '{{count}} ALBATROSSES',
        });
      case 'eagles':
        return t('discover.friendsRounds.feats.eagles', {
          count: f.count,
          defaultValue_one: 'EAGLE',
          defaultValue_other: '{{count}} EAGLES',
        });
      case 'birdies':
        return t('discover.friendsRounds.feats.birdies', {
          count: f.count,
          defaultValue_one: '{{count}} BIRDIE',
          defaultValue_other: '{{count}} BIRDIES',
        });
      case 'beat_par':
        return t('discover.friendsRounds.feats.beatPar', 'UNDER PAR');
      case 'clean_card':
        return t('discover.friendsRounds.feats.cleanCard', 'CLEAN CARD');
      default:
        return '';
    }
  };
}

interface Props {
  feats: RoundFeat[];
  /** Max badges rendered. Default 2; the rail and sheet pass 1. */
  maxChips?: number;
}

export function RoundFeatChips({ feats, maxChips = 2 }: Props) {
  const featLabel = useRoundFeatLabel();
  if (!feats || feats.length === 0) return null;
  return (
    <>
      {feats.slice(0, Math.max(0, maxChips)).map((f) => {
        const label = featLabel(f);
        return (
          <span
            key={f.key}
            style={{
              ...badgeBase,
              ...(isLegendary(f.key) ? LEGENDARY_STYLE : STANDARD_STYLE),
              fontVariantNumeric: 'tabular-nums',
            }}
            title={label}
          >
            <span
              style={{
                maxWidth: 130,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </span>
        );
      })}
    </>
  );
}

export default RoundFeatChips;
