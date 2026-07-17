/**
 * FullListSheet — the deep almanac for a single Boards category.
 *
 * Canonicalized to match the Course Champions / Courses Discover Dispatch
 * bottom sheet UI: 75dvh, SLATE_50 surface, amber metadata eyebrow, ink title,
 * and a white-card ranked ledger (rank 1 rendered in gold).
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import {
  FONT,
  GOLD_DEEP,
  GOLD_BORDER,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
} from '../_shared/tokens';

import type { LeaderCategoryDef } from './data/useLeaderCategories';
import type { LivePlayerMap } from '../players-v2/data/useLivePlayerIds';

const LIVE_GREEN = '#10B981';

export interface FullListSheetProps {
  open: boolean;
  onClose: () => void;
  category: LeaderCategoryDef | null;
  liveMap: LivePlayerMap;
  tourLabel: string;
  year: number;
}

export function FullListSheet({
  open,
  onClose,
  category,
  liveMap,
  tourLabel,
  year,
}: FullListSheetProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');

  const handleRowTap = useCallback(
    (playerId: string) => {
      if (!playerId) return;
      onClose();
      setTimeout(() => navigate(`/tourhub/player/${playerId}`), 60);
    },
    [navigate, onClose],
  );

  if (!category) return null;
  const rows = category.rows;
  const total = rows.length;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="tour-leaders-full-sheet-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        background: SLATE_50,
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 16px 12px', borderBottom: `0.5px solid ${HAIRLINE_INK_10}`, background: SLATE_50, flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_FAINT,
              marginBottom: 4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {t('leaders.sheet.eyebrow', { tourLabel, year, count: total })}
          </div>
          <div
            id="tour-leaders-full-sheet-title"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {t(category.labelKey)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: SLATE_50,
          padding: '12px 0',
        }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            {t('leaders.sheet.empty')}
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            {rows.map((r) => {
              const isTop = r.rank === 1;
              const live = !!liveMap[r.playerId];
              return (
                <button
                  key={r.playerId || `l-${r.rank}`}
                  type="button"
                  onClick={() => handleRowTap(r.playerId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    width: '100%',
                    borderRadius: 12,
                    padding: '10px 12px',
                    background: isTop ? 'linear-gradient(100deg, #fff, #fff6e8)' : '#fff',
                    border: isTop
                      ? `1px solid ${GOLD_BORDER}`
                      : '1px solid rgba(15,23,42,0.07)',
                    marginBottom: 6,
                    fontFamily: FONT,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      textAlign: 'center',
                      flexShrink: 0,
                      fontSize: 14,
                      fontWeight: 900,
                      fontVariantNumeric: 'tabular-nums',
                      color: isTop ? GOLD_DEEP : '#94A3B8',
                      lineHeight: 1,
                    }}
                  >
                    {r.rank}
                  </div>
                  <div style={{ flexShrink: 0, position: 'relative' }}>
                    <SquircleAvatar
                      size={34}
                      srcCandidates={resolvePlayerAvatarCandidates({
                        name: r.name,
                        photoUrl: r.photoUrl,
                        tourSlug: r.tourCode ?? 'pga',
                      })}
                      alt={r.name}
                      userId={r.playerId}
                      hairlineRing
                      ringColor={isTop ? GOLD_DEEP : LIGHT_HAIRLINE}
                    />
                    {live && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 1,
                          right: 1,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: LIVE_GREEN,
                          boxShadow: '0 0 0 2px #FFFFFF',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: INK,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}
                    >
                      {r.name}
                    </div>
                    <CountryFlag country={r.country} size="sm" />
                  </div>
                  <div
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      minWidth: 42,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: INK,
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {r.valueFormatted}
                    </div>
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#94A3B8',
                        lineHeight: 1,
                      }}
                    >
                      {t(category.shortKey)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default FullListSheet;
