import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { RoundFeat } from '@/lib/gam/roundFeats';

/**
 * RoundFeatChips - canonical feat chip strip.
 * Used by Discover "Friends' latest rounds", "The record book" and honours.
 * Styling is fixed: do not fork or restyle per surface.
 *
 * Chips are WEIGHTED BY RARITY across three tiers (no emoji - the label and
 * the weighting carry the meaning). To restore the medal treatment, revert
 * this file only; no consumer knows about tiers.
 *
 *   tier 3  HOLE IN ONE, ALBATROSS   solid amber fill, white text
 *   tier 2  EAGLE, CLEAN CARD        amber outline on warm wash, amber text
 *   tier 1  N BIRDIES, UNDER PAR     quiet grey fill, hairline, muted text
 */

const AMBER = '#F7931E';
const AMBER_DEEP = '#B45309';

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

type FeatTierLevel = 1 | 2 | 3;

function tierFor(key: RoundFeat['key']): FeatTierLevel {
  switch (key) {
    case 'holes_in_one':
    case 'albatrosses':
      return 3;
    case 'eagles':
    case 'clean_card':
      return 2;
    default:
      return 1;
  }
}

const TIER_STYLE: Record<FeatTierLevel, CSSProperties> = {
  3: {
    background: AMBER,
    color: '#FFFFFF',
    border: '1px solid transparent',
  },
  2: {
    background: 'rgba(247,147,30,0.10)',
    color: AMBER_DEEP,
    border: `1px solid rgba(247,147,30,0.45)`,
  },
  1: {
    background: 'rgba(15,23,42,0.05)',
    color: 'rgba(15,23,42,0.55)',
    border: '1px solid rgba(15,23,42,0.08)',
  },
};


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
}

export function RoundFeatChips({ feats }: Props) {
  const featLabel = useRoundFeatLabel();
  if (!feats || feats.length === 0) return null;
  return (
    <>
      {feats.slice(0, 2).map((f) => {
        const label = featLabel(f);
        return (
          <span
            key={f.key}
            style={{
              ...featChipBase,
              background: 'rgba(247,147,30,0.10)',
              color: AMBER,
              textTransform: 'none',
              letterSpacing: '0.02em',
              fontSize: 10.5,
              fontWeight: 600,
            }}
            title={label}
          >
            <span aria-hidden style={{ fontSize: 11 }}>{'\uD83C\uDFC5'}</span>
            <span
              style={{
                maxWidth: 120,
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
