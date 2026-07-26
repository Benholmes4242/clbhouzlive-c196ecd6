import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { RoundFeat } from '@/lib/gam/roundFeats';

/**
 * RoundFeatChips - canonical feat chip strip.
 * Used by Discover "Friends' latest rounds" and "The record book".
 * Styling is fixed: do not fork or restyle per surface.
 */

const AMBER = '#F7931E';

export const featChipBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 7px',
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  lineHeight: 1,
  whiteSpace: 'nowrap',
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
