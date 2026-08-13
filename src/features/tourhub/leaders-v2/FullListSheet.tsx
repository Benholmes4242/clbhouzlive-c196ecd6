/**
 * FullListSheet - the deep almanac for a single Boards category.
 *
 * 75dvh, SLATE_50 surface, flat ranked ledger: no alternating fill, no rule
 * between rows, no gold or amber on any row. The gap to the leader sits
 * beneath each value; the leader's own row shows nothing there.
 *
 * Ranks are competition ranks (T3 / T3 / 5) computed upstream in
 * useLeaderCategories. Filtering never re-ranks: a filtered row keeps its
 * original rank label, value and gap, because the member is looking up where
 * somebody sits.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
} from '../_shared/tokens';
import { TITLE } from '@/lib/tokens/type';

import type { LeaderCategoryDef } from './data/useLeaderCategories';
import type { LivePlayerMap } from '../players-v2/data/useLivePlayerIds';

const LIVE_GREEN = '#10B981';
/** Below this the list is short enough to read; a filter would be noise. */
const SEARCH_MIN_ROWS = 12;

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

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 200);

  const categoryKey = category?.key ?? null;
  const rows = category?.rows ?? [];
  const total = rows.length;
  const poolSize = category?.poolSize ?? total;

  // A new category is a new list: never carry a stale filter into it.
  useEffect(() => {
    setQuery('');
  }, [categoryKey]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, debouncedQuery]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!open || !categoryKey || !q) return;
    analyticsEvents.track('tour_leaders_sheet_searched', {
      category: categoryKey,
      query_length: q.length,
      results: filtered.length,
    });
    // Debounced value only - not per keystroke, and never the query text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, categoryKey, open]);

  const handleRowTap = useCallback(
    (playerId: string, rank: number, tied: boolean) => {
      if (!playerId) return;
      if (categoryKey) {
        analyticsEvents.track('tour_leaders_sheet_player_tapped', {
          category: categoryKey,
          player_id: playerId,
          rank,
          tied,
          tour: tourLabel,
        });
      }
      onClose();
      setTimeout(() => navigate(`/tourhub/player/${playerId}`), 60);
    },
    [navigate, onClose, categoryKey, tourLabel],
  );

  if (!category) return null;

  const sliced = poolSize > total;
  const eyebrow = sliced
    ? t('leaders.sheet.eyebrowSliced', { tourLabel, year, shown: total, pool: poolSize })
    : t('leaders.sheet.eyebrow', { tourLabel, year, count: poolSize });
  const showSearch = total > SEARCH_MIN_ROWS;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="tour-leaders-full-sheet-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: 'auto',
        maxHeight: '95dvh',
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
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: INK,
              marginBottom: 5,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {eyebrow}
          </div>
          <div
            id="tour-leaders-full-sheet-title"
            style={{
              ...TITLE,
              color: INK,
            }}
          >
            {t(category.labelKey)}
          </div>
        </div>

        {showSearch && (
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#FFFFFF',
              border: `0.5px solid ${HAIRLINE_INK_10}`,
              borderRadius: 18,
              padding: '6px 12px',
            }}
          >
            <Search size={13} color={INK_MUTE} strokeWidth={2.25} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('leaders.sheet.searchPlaceholder')}
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: FONT,
                fontSize: 13,
                color: INK,
              }}
            />
          </div>
        )}
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
        {total === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            {t('leaders.sheet.empty')}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: '28px 24px',
              textAlign: 'center',
              color: INK_MUTE,
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {t('leaders.sheet.noMatch', { shown: total, pool: poolSize })}
          </div>
        ) : (
          <div style={{ padding: '0 4px' }}>
            {filtered.map((r) => {
              const live = !!liveMap[r.playerId];
              return (
                <button
                  key={r.playerId || `l-${r.rank}`}
                  type="button"
                  onClick={() => handleRowTap(r.playerId, r.rank, r.tied)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    width: '100%',
                    padding: '11px 12px',
                    background: 'transparent',
                    border: 'none',
                    fontFamily: FONT,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      flex: '0 0 30px',
                      textAlign: 'right',
                      fontSize: 12,
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                      color: INK_MUTE,
                      lineHeight: 1,
                    }}
                  >
                    {r.rankLabel}
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
                      ringColor={LIGHT_HAIRLINE}
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
                          boxShadow: `0 0 0 2px ${SLATE_50}`,
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
                      width: 112,
                      flex: '0 0 112px',
                      textAlign: 'right',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: INK,
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums lining-nums',
                      }}
                    >
                      {r.valueFormatted}
                    </div>
                    {/* Leader row renders nothing here: rank 1 already says it. */}
                    {r.behindFormatted && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: '0.10em',
                          textTransform: 'uppercase',
                          color: INK_FAINT,
                          whiteSpace: 'nowrap',
                          lineHeight: 1,
                          fontVariantNumeric: 'tabular-nums lining-nums',
                        }}
                      >
                        {t('leaders.behind', { gap: r.behindFormatted })}
                      </div>
                    )}
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
