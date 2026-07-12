/**
 * FullListSheet — the deep almanac for a single Boards category.
 *
 * House BottomSheet, 90vh, own scroll. Gold No.1 masthead + RankedPlayerRow
 * ledger (2..50). Row tap closes the sheet first, then navigates to the
 * player profile (avoids a stuck overlay on route change).
 */

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import {
  AMBER,
  FONT,
  GOLD_DEEP,
  GOLD_BORDER,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
  SURFACE,
} from '../_shared/tokens';

import { RankedPlayerRow } from '../players-v2/RankedPlayerRow';
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

  const handleRowTap = useCallback(
    (playerId: string) => {
      if (!playerId) return;
      onClose();
      // give the sheet a beat to unmount its portal before route change
      setTimeout(() => navigate(`/tourhub/player/${playerId}`), 60);
    },
    [navigate, onClose],
  );

  // Defensive: if route changes while sheet open, unmount cleanly.
  useEffect(() => {
    if (!open) return;
    return () => {
      /* cleanup — BottomSheet handles scroll-lock reset itself. */
    };
  }, [open]);

  if (!category) return null;
  const top = category.rows[0];
  const rest = category.rows.slice(1);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '90vh',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 16px 12px', borderBottom: `0.5px solid ${HAIRLINE_INK_10}`, background: SLATE_50 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: AMBER,
                marginBottom: 4,
              }}
            >
              {category.short}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: INK,
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              {category.label}
            </div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: INK_MUTE,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginTop: 3,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {tourLabel} {'\u00B7'} {year} {'\u00B7'} {category.rows.length} PLAYERS
            </div>
          </div>
        </div>

        {/* No.1 masthead */}
        {top && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              background: SURFACE,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 3px rgba(255,184,0,0.10)',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <SquircleAvatar
                size={52}
                srcCandidates={resolvePlayerAvatarCandidates({
                  name: top.name,
                  photoUrl: top.photoUrl,
                  tourSlug: top.tourCode ?? 'pga',
                })}
                alt={top.name}
                userId={top.playerId}
                hairlineRing
                ringColor={GOLD_DEEP}
              />
              {liveMap[top.playerId] && (
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: LIVE_GREEN,
                    boxShadow: '0 0 0 2px #FFFFFF',
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 7.5,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: GOLD_DEEP,
                  marginBottom: 3,
                }}
              >
                No.1 {'\u00B7'} {category.short}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: INK,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {top.name}
                </span>
                <CountryFlag country={top.country} size="sm" />
              </div>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 200,
                color: GOLD_DEEP,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
                flexShrink: 0,
              }}
            >
              {top.valueFormatted}
            </div>
          </div>
        )}
      </div>

      {/* Ledger 2..50 */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: SURFACE }}>
        {rest.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            No further players ranked in this category.
          </div>
        ) : (
          rest.map((r) => {
            const live = !!liveMap[r.playerId];
            return (
              <RankedPlayerRow
                key={r.playerId || `l-${r.rank}`}
                rank={r.rank}
                player={{
                  playerId: r.playerId,
                  name: r.name,
                  country: r.country,
                  countryCode: r.countryCode,
                  photoUrl: r.photoUrl,
                  tourCode: r.tourCode,
                }}
                stat={r.value}
                statFormatted={r.valueFormatted}
                live={live}
                onClick={() => handleRowTap(r.playerId)}
              />
            );
          })
        )}
        <div style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default FullListSheet;
