/**
 * TOP 100 -- four lists, each a count against a fixed set of 100.
 *
 * SORTED BY COUNT DESCENDING, so the lists a member is actually working through
 * lead and the untouched ones sit at the foot. A list at ZERO renders NO BAR and
 * reads "Not started": an empty track with a to-go count is a progress bar
 * reporting no progress, and it reads as a rebuke rather than a state.
 *
 * Below top100_share_floor no standing renders: with a median of 1 to 3
 * courses played, a share would say more about the sample than the member.
 * Above top100_rank_crossover the share saturates ("more than 94%" for
 * everybody), so an ordinal bound is used instead.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { REC } from '../tokens';
import { ChevronRight } from 'lucide-react';
import { top100Standing } from '../shareModel';
import { top100BadgeIdToListSlug } from '../../_shared/showpieces';
import type { Achievement, CareerData } from '../types';

const LIST_LABEL: Record<string, string> = {
  top_100_worldwide: 'World',
  top_100_gbni: 'GB & Ireland',
  top_100_europe: 'Continental Europe',
  top_100_usa: 'USA',
};

const RING_R = 32;
const RING_C = 2 * Math.PI * RING_R;

const ORDER = ['top_100_worldwide', 'top_100_gbni', 'top_100_europe', 'top_100_usa'];

interface Props {
  data: CareerData;
  items: Achievement[];
}

export const Top100Panel: React.FC<Props> = ({ data, items }) => {
  const { t } = useTranslation('handicap');
  const sorted = [...items].sort((a, b) => {
    const d = (b.currentValue ?? 0) - (a.currentValue ?? 0);
    // Ties keep the canonical list order, so the panel is stable between reads.
    return d !== 0 ? d : ORDER.indexOf(a.badgeId) - ORDER.indexOf(b.badgeId);
  });
  if (sorted.length === 0) return null;
  // On a tab, four "Not started" cards are the correct state -- no all-zero
  // early return.

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
      {sorted.map((item) => {
        const count = item.currentValue ?? 0;
        const zero = count === 0;
        const label = LIST_LABEL[item.badgeId] ?? item.name;
        const slug = top100BadgeIdToListSlug(item.badgeId) ?? '';
        const standing = top100Standing(
          data.distribution,
          slug,
          count,
          data.config.top100ShareFloor,
          data.config.top100RankCrossover,
          data.config.shareMinDenominator,
        );
        return (
          <button
            key={item.badgeId}
            type="button"
            onClick={() => data.onOpen({ kind: 'top100', badgeId: item.badgeId })}
            aria-label={`${label}, ${count} of 100`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              width: '100%',
              padding: 16,
              borderRadius: 16,
              border: zero ? `1px dashed ${REC.TILE_DASH}` : `1px solid ${REC.TILE_LINE}`,
              background: zero ? 'transparent' : REC.PANEL_2,
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: REC.FONT,
            }}
          >
            <span style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
              <svg width={76} height={76} viewBox="0 0 76 76" aria-hidden>
                <circle
                  cx={38}
                  cy={38}
                  r={RING_R}
                  fill="none"
                  stroke={REC.RING_TRACK}
                  strokeWidth={6}
                  strokeDasharray={zero ? '3 5' : undefined}
                />
                {!zero && (
                  <circle
                    cx={38}
                    cy={38}
                    r={RING_R}
                    fill="none"
                    stroke={REC.AMBER}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={`${(Math.min(100, count) / 100) * RING_C} ${RING_C}`}
                    transform="rotate(-90 38 38)"
                  />
                )}
              </svg>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: zero ? REC.DIM : REC.INK,
                  ...REC.TABULAR,
                }}
              >
                {count}
              </span>
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em', color: REC.INK }}>
                {label}
              </span>
              <span style={{ fontSize: 12.5, color: REC.MUTE, ...REC.TABULAR }}>
                {zero ? t('career.top100NotStarted') : t('career.top100PlayedToGo', { count, toGo: 100 - count })}
              </span>
              {standing.kind === 'share' && (
                <span style={{ fontSize: 11.5, fontWeight: 700, color: REC.GOOD, ...REC.TABULAR }}>
                  {t('career.top100Ahead', { pct: standing.pct })}
                </span>
              )}
              {standing.kind === 'ordinal' && (
                <span style={{ fontSize: 11.5, fontWeight: 700, color: REC.GOOD, ...REC.TABULAR }}>
                  {t('career.top100AmongTop', { members: standing.members })}
                </span>
              )}
            </span>
            <ChevronRight size={18} color={REC.DIM} style={{ flexShrink: 0 }} />
          </button>
        );
      })}
    </section>
  );
};

export default Top100Panel;
