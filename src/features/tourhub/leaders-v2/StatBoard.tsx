/**
 * StatBoard — one white card per category. Three rows (top 3), gold rank 1,
 * live dot when the player is on the course. "Full list >" opens the sheet.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import {
  GOLD_DEEP,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SURFACE,
} from '../_shared/tokens';
import type { LeaderCategoryDef } from './data/useLeaderCategories';
import type { LivePlayerMap } from '../players-v2/data/useLivePlayerIds';

const LIVE_GREEN = '#10B981';

export interface StatBoardProps {
  category: LeaderCategoryDef;
  liveMap: LivePlayerMap;
  onOpen: () => void;
}

function StatBoardInner({ category, liveMap, onOpen }: StatBoardProps) {
  const { t } = useTranslation('tourhub');
  const top3 = category.rows.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div
      style={{
        background: SURFACE,
        borderRadius: 16,
        border: `0.5px solid ${HAIRLINE_INK_10}`,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        margin: '0 16px 12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '12px 14px 8px',
          background: 'transparent',
          border: 'none',
          borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: INK_FAINT,
            textTransform: 'uppercase',
          }}
        >
          {category.short}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: INK_MUTE,
            letterSpacing: '0.02em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          Full list <ChevronRight size={11} color={INK_MUTE} />
        </span>
      </button>

      {/* Rows */}
      {top3.map((r, i) => {
        const live = liveMap[r.playerId];
        const isGold = r.rank === 1;
        const candidates = resolvePlayerAvatarCandidates({
          name: r.name,
          photoUrl: r.photoUrl,
          tourSlug: r.tourCode ?? 'pga',
        });
        return (
          <div
            key={r.playerId || `r-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 14px',
              borderBottom: i === top3.length - 1 ? 'none' : `0.5px solid ${HAIRLINE_INK_10}`,
            }}
          >
            {/* Rank */}
            <div
              style={{
                width: 18,
                fontSize: 13,
                fontWeight: 200,
                color: isGold ? GOLD_DEEP : INK,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {r.rank}
            </div>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <SquircleAvatar
                size={26}
                srcCandidates={candidates}
                alt={r.name}
                userId={r.playerId}
                hairlineRing
                ringColor={LIGHT_HAIRLINE}
              />
              {live && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: LIVE_GREEN,
                    boxShadow: '0 0 0 1.5px #FFFFFF',
                  }}
                />
              )}
            </div>
            {/* Name */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.name}
              </span>
              <CountryFlag country={r.country} size="sm" />
            </div>
            {/* Value */}
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 200,
                color: isGold ? GOLD_DEEP : INK,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {r.valueFormatted}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const StatBoard = memo(StatBoardInner);
export default StatBoard;
