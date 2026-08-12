import { GAM } from '../../../gam/tokens';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type LucideIcon, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import {
  ChampionsListRow,
  CHAMPS_GRID_FULL,
  CHAMPS_GRID_GAP_FULL,
  CHAMPS_ROW_PADDING_X,
  CHAMPS_COL_30D_FULL,
  CHAMPS_COL_SCORE_FULL,
} from './ChampionsListRow';
import { MovementCell } from './_shared/MovementCell';
import { formatGapFromChampion, formatHeldFor, daysSince, NEW_BADGE_DAYS } from './_shared/helpers';
import { duelLine } from './_shared/duelTension';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';

interface SectionRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
  rank30d?: number | null;
  delta?: number | null;
}

interface CategoryDescriptor {
  key: LegendCategory;
  label: string;
  short: string;
  icon: LucideIcon;
  unit: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  courseName: string;
  groupedRows: Map<LegendCategory, { rows: SectionRow[]; total: number }>;
  visibleCategories: CategoryDescriptor[];
  initialCategory: LegendCategory;
  window: LegendWindow;
  /** Map of category -> viewer's rank (1 = champion). Drilldown already computes this. */
  yourRanks: Partial<Record<LegendCategory, number | null>>;
  /** Backdrop theme. Default 'dark' preserves handicap drilldown look. */
  theme?: 'light' | 'dark';
}

// Sheet portals outside the .hcp-light/.hcp-dark scope, so every color is a
// hardcoded literal. `theme` picks between dark (handicap host) and light
// (course-details host) palettes. Do NOT introduce var(--hcp-*) here.
const DEEP_AMBER = '#F7931E';
const GOLD = '#F7931E';

const DARK = {
  ink: '#F2F4F7',
  ink55: 'rgba(242,244,247,0.55)',
  ink40: 'rgba(242,244,247,0.38)',
  hairline: 'rgba(255,255,255,0.08)',
  surface: '#15171F',
  card: '#1B1E27',
  avatarRing: 'rgba(255,255,255,0.22)',
  pillYouBg: 'rgba(255,255,255,0.06)',
} as const;

const LIGHT = {
  ink: '#0F172A',
  ink55: '#64748B',
  ink40: '#94A3B8',
  hairline: 'rgba(15,23,42,0.08)',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  avatarRing: 'rgba(15,23,42,0.12)',
  pillYouBg: 'rgba(15,23,42,0.05)',
} as const;

const SQUIRCLE_MASK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 0h20c22.091 0 40 17.909 40 40v20c0 22.091-17.909 40-40 40H40C17.909 100 0 82.091 0 60V40C0 17.909 17.909 0 40 0z'/%3E%3C/svg%3E\")";
const squircleMaskStyle: React.CSSProperties = {
  WebkitMaskImage: SQUIRCLE_MASK_URL,
  maskImage: SQUIRCLE_MASK_URL,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

const BannerAvatar: React.FC<{ photoUrl: string | null; size?: number; ringColor: string }> = ({ photoUrl, size = 44, ringColor }) => {
  const bg = photoUrl
    ? `url(${photoUrl}) center/cover`
    : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }} aria-hidden>
      <div style={{ position: 'absolute', inset: 0, background: bg, ...squircleMaskStyle }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...squircleMaskStyle,
          boxShadow: `inset 0 0 0 1px ${ringColor}`,
        }}
      />
    </div>
  );
};

export const FullCourseLeaderboardSheet: React.FC<Props> = ({
  open,
  onClose,
  courseName,
  groupedRows,
  visibleCategories,
  initialCategory,
  window: legendWindow,
  yourRanks,
  theme = 'dark',
}) => {
  const T = theme === 'light' ? LIGHT : DARK;
  const INK = T.ink;
  const INK_55 = T.ink55;
  const INK_40 = T.ink40;
  const HAIRLINE = T.hairline;
  const SURFACE = T.surface;
  const CARD = T.card;
  const [activeCategory, setActiveCategory] = useState<LegendCategory>(initialCategory);

  useEffect(() => {
    if (open) setActiveCategory(initialCategory);
  }, [open, initialCategory]);

  const tabsToShow = useMemo(
    () =>
      visibleCategories.filter(
        (cat) => (groupedRows.get(cat.key)?.rows.length ?? 0) > 0,
      ),
    [visibleCategories, groupedRows],
  );

  const activeEntry = groupedRows.get(activeCategory);
  const activeRows = activeEntry?.rows ?? [];
  const activeDescriptor = tabsToShow.find((c) => c.key === activeCategory);
  const totalForActive = activeEntry?.total ?? 0;

  const champion = activeRows[0];
  const selfRow = activeRows.find((r) => r.isSelf);
  const defending = champion?.isSelf === true;
  const standsAlone = activeRows.length === 1;
  const selfRank = selfRow?.rank ?? null;

  const runnerUp = activeRows.find((r) => !r.isSelf) ?? null;

  // Rows in the scrollable list = everything except the pinned champion.
  const listRows = activeRows.slice(1);

  const listRef = useRef<HTMLDivElement>(null);
  const selfRowRef = useRef<HTMLDivElement>(null);
  const [selfOffscreen, setSelfOffscreen] = useState<null | 'above' | 'below'>(null);

  // Reset scroll + observer wiring on category switch.
  useEffect(() => {
    setSelfOffscreen(null);
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0 });
    }
  }, [activeCategory]);

  useEffect(() => {
    setSelfOffscreen(null);
    if (defending) return; // pinned: viewer is the champion, no jump pill needed
    const rowEl = selfRowRef.current;
    const rootEl = listRef.current;
    if (!rowEl || !rootEl || !open) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSelfOffscreen(null);
        } else {
          const rowTop = entry.boundingClientRect.top;
          const rootTop = entry.rootBounds?.top ?? 0;
          setSelfOffscreen(rowTop < rootTop ? 'above' : 'below');
        }
      },
      { root: rootEl, threshold: 0.4 },
    );
    obs.observe(rowEl);
    return () => obs.disconnect();
  }, [activeCategory, activeRows, open, defending]);

  const jumpToSelf = () => {
    selfRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const windowLabel = legendWindow === '90d' ? '90 DAYS' : 'ALL TIME';
  const eyebrow = `LEADERBOARD · ${windowLabel}`;

  // Chase line + status pill
  const opponentValue = defending
    ? (runnerUp?.value ?? champion?.value ?? 0)
    : (selfRow?.value ?? champion?.value ?? 0);
  const chaseStandsAlone = defending ? !runnerUp : standsAlone;

  const chaseLine = champion
    ? selfRow || standsAlone
      ? duelLine(activeCategory, champion.value, opponentValue, defending, chaseStandsAlone, (champion.name ?? '').split(' ')[0])
      : 'Not on the board yet'
    : '';

  const championValueDisplay = champion?.valueDisplay ?? '—';
  const championName = champion ? (champion.isSelf ? 'You' : champion.name) : '';
  const championHoldDuration = champion
    ? formatHeldFor(daysSince(champion.attained_at))
    : null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="course-legends-full-sheet-title"
      variant={theme === 'light' ? 'light' : 'dark'}
      surfaceColor={theme === 'dark' ? SURFACE : undefined}
      style={{
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        background: SURFACE,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          position: 'relative',
          fontFamily: GAM.FONT_GEIST,
          color: INK,
          background: SURFACE,
        }}
      >
        <SheetHeader
          eyebrow={eyebrow}
          title={<span id="course-legends-full-sheet-title">{courseName}</span>}
          onClose={onClose}
          borderBottom={false}
          dark={theme === 'dark'}
        />


        {/* Chase line + status pill (replaces the old "Gross Record · N entries" sub) */}
        {champion && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px',
              marginBottom: 12,
              flexShrink: 0,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: defending ? DEEP_AMBER : INK_55,
                letterSpacing: '-0.005em',
                minWidth: 0,
              }}
            >
              {chaseLine}
            </span>
            {defending ? (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(247,147,30,0.14)',
                  color: DEEP_AMBER,
                }}
              >
                YOUR CROWN
              </span>
            ) : selfRow ? (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: T.pillYouBg,
                  color: INK_55,
                }}
              >
                {`YOU'RE #${selfRank}`}
              </span>
            ) : null}
          </div>
        )}

        {/* Category pill rail */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '0 16px 12px',
            background: SURFACE,
            borderBottom: `0.5px solid ${HAIRLINE}`,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            flexShrink: 0,
          }}
          className="hcp-full-lb-tabs"
        >
          <style>{`.hcp-full-lb-tabs::-webkit-scrollbar { display: none; }`}</style>
          {tabsToShow.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.key === activeCategory;
            const youHold = yourRanks[cat.key] === 1;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 11px',
                  borderRadius: 999,
                  background: isActive ? INK : CARD,
                  border: isActive ? `1px solid ${INK}` : `1px solid ${HAIRLINE}`,
                  color: isActive ? SURFACE : INK,
                  fontSize: 11,
                  fontWeight: isActive ? 800 : 700,
                  fontFamily: GAM.FONT_GEIST,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}
              >
                <Icon size={11} strokeWidth={2.4} />
                {cat.short}
                {youHold && (
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: GOLD,
                      boxShadow: `0 0 0 1.5px ${isActive ? INK : SURFACE}`,
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* PINNED CHAMPION BANNER — static, never scrolls. Uses the shared
            column grid so 30D + SCORE align with the header + list rows. */}
        {champion && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: CHAMPS_GRID_FULL,
              gap: CHAMPS_GRID_GAP_FULL,
              alignItems: 'center',
              padding: `12px ${CHAMPS_ROW_PADDING_X}px`,
              background: 'linear-gradient(180deg, rgba(247,147,30,0.12), rgba(247,147,30,0.05))',
              borderTop: `2px solid ${GOLD}`,
              borderBottom: `0.5px solid ${HAIRLINE}`,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Crown size={17} strokeWidth={2.5} fill={GOLD} style={{ color: DEEP_AMBER }} />
            </div>
            <BannerAvatar photoUrl={champion.photoUrl} size={40} ringColor={T.avatarRing} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {championName}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: DEEP_AMBER,
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {championHoldDuration ? `${championHoldDuration} · Champion` : 'Champion'}
              </div>
            </div>
            {/* 30D column */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MovementCell
                delta={champion.delta}
                rank30d={champion.rank30d}
                theme={theme}
                size="row"
              />
            </div>
            {/* SCORE column — centered under the header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {championValueDisplay}
              </div>
            </div>
          </div>
        )}

        {/* Column header — micro-caps "30D" and "SCORE" centered above their
            fixed-width columns. Same grid template as every row below. */}
        {champion && !standsAlone && listRows.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: CHAMPS_GRID_FULL,
              gap: CHAMPS_GRID_GAP_FULL,
              alignItems: 'center',
              padding: `10px ${CHAMPS_ROW_PADDING_X}px 6px`,
              background: SURFACE,
              borderBottom: `0.5px solid ${HAIRLINE}`,
              flexShrink: 0,
              fontFamily: GAM.FONT_GEIST,
            }}
          >
            <span />
            <span />
            <span />
            <span
              style={{
                textAlign: 'center',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: INK_55,
              }}
            >
              30D
            </span>
            <span
              style={{
                textAlign: 'center',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: INK_55,
              }}
            >
              {activeDescriptor?.unit?.toUpperCase() || 'SCORE'}
            </span>
          </div>
        )}

        {/* Scrollable list — ranks 2+.
            Scrollbar is hidden so the list's 30D/SCORE columns line up
            pixel-perfect with the header row and pinned champion banner
            above (which sit outside this scroller and therefore aren't
            offset by any reserved scrollbar gutter). */}
        <div
          ref={listRef}
          className="hcp-champs-list-scroller"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '8px 0 0',
            WebkitOverflowScrolling: 'touch',
            background: SURFACE,
            scrollbarWidth: 'none',
          } as React.CSSProperties}
        >
          <style>{`.hcp-champs-list-scroller::-webkit-scrollbar { display: none; }`}</style>
          {activeRows.length === 0 ? (
            <div
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: INK_55,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              No entries in this category yet.
            </div>
          ) : standsAlone ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: INK_55,
                fontSize: 12.5,
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              The champion stands alone. Be the first to challenge.
            </div>
          ) : (
            listRows.map((row, i) => {
              const championRow = activeRows[0];
              return (
                <div
                  key={`${row.rank}-${row.attained_at}-${i}`}
                  ref={row.isSelf ? selfRowRef : undefined}
                  style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 61px' } as React.CSSProperties}
                >
                  <ChampionsListRow
                    rank={row.rank}
                    name={row.isSelf ? 'You' : row.name}
                    photoUrl={row.photoUrl}
                    valueDisplay={row.valueDisplay}
                    unitLabel={activeDescriptor?.unit ?? ''}
                    isSelf={row.isSelf}
                    isChampion={false}
                    gapToChampion={formatGapFromChampion(activeCategory, row.value, championRow.value)}
                    holdDuration={null}
                    isNew={daysSince(row.attained_at) < NEW_BADGE_DAYS}
                    theme={theme}
                    rank30d={row.rank30d}
                    delta={row.delta}
                  />
                </div>
              );
            })
          )}

          {/* Footer entry count */}
          {totalForActive > 0 && (
            <div
              style={{
                padding: '12px 16px',
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                textAlign: 'center',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: INK_40,
                textTransform: 'uppercase',
              }}
            >
              {totalForActive} ON THE BOARD
            </div>
          )}
        </div>
        {selfOffscreen && selfRank != null && !defending && (
          <button
            type="button"
            onClick={jumpToSelf}
            aria-label={`Jump to your position, ranked ${selfRank}`}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
              zIndex: 5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 14px',
              borderRadius: 999,
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontFamily: GAM.FONT_GEIST,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              fontVariantNumeric: 'tabular-nums',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(15,23,42,0.28)',
            }}
          >
            {selfOffscreen === 'above' ? (
              <ChevronUp size={12} strokeWidth={2.6} />
            ) : (
              <ChevronDown size={12} strokeWidth={2.6} />
            )}
            You · #{selfRank}
          </button>
        )}
      </div>
    </BottomSheet>
  );
};

export default FullCourseLeaderboardSheet;
