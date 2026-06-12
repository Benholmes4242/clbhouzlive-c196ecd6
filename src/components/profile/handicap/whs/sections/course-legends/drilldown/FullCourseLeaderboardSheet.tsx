import { GAM } from '../../../gam/tokens';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type LucideIcon, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { ChampionsListRow } from './ChampionsListRow';
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
}

const DEEP_AMBER = '#B26818';
const GOLD = '#FBBC2E';
const INK = '#0F172A';
const INK_55 = '#64748B';
const INK_40 = '#94A3B8';

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

const BannerAvatar: React.FC<{ photoUrl: string | null; size?: number }> = ({ photoUrl, size = 44 }) => {
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
          boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.10)',
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
}) => {
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
    ? (runnerUp?.value ?? champion.value)
    : (selfRow?.value ?? champion.value);
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
      style={{
        background: '#F8FAFC',
        maxHeight: '80dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="hcp-light"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          position: 'relative',
          fontFamily: GAM.FONT_GEIST,
          color: 'var(--hcp-t-100)',
          background: 'var(--hcp-bg-0)',
        }}
      >
        <SheetHeader
          eyebrow={eyebrow}
          title={<span id="course-legends-full-sheet-title">{courseName}</span>}
          onClose={onClose}
          borderBottom={false}
        />

        {/* Chase line + status pill (replaces the old "Gross Record · N entries" sub) */}
        {champion && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px',
              marginTop: -4,
              marginBottom: 13,
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
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(251,188,46,0.16)',
                  color: DEEP_AMBER,
                }}
              >
                YOUR CROWN
              </span>
            ) : selfRow ? (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(15,23,42,0.05)',
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
            gap: 7,
            overflowX: 'auto',
            padding: '0 16px 14px',
            background: 'var(--hcp-bg-0)',
            borderBottom: '0.5px solid var(--hcp-line)',
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
                  background: isActive ? '#0F172A' : 'var(--hcp-bg-1)',
                  border: isActive ? '1px solid #0F172A' : '1px solid var(--hcp-line)',
                  color: isActive ? '#FFFFFF' : 'var(--hcp-t-100)',
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
                      boxShadow: `0 0 0 1.5px ${isActive ? '#0F172A' : '#FFFFFF'}`,
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* PINNED CHAMPION BANNER — static, never scrolls */}
        {champion && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 44px 1fr auto',
              gap: 12,
              alignItems: 'center',
              padding: '12px 18px',
              background: 'linear-gradient(180deg, rgba(251,188,46,0.10), rgba(251,188,46,0.045))',
              borderTop: `2px solid ${GOLD}`,
              borderBottom: '0.5px solid var(--hcp-line)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={17} strokeWidth={2.5} fill={GOLD} style={{ color: DEEP_AMBER }} />
            </div>
            <BannerAvatar photoUrl={champion.photoUrl} size={44} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
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
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: INK,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {championValueDisplay}
            </div>
          </div>
        )}

        {/* Scrollable list — ranks 2+ */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '8px 0 0',
            WebkitOverflowScrolling: 'touch',
            background: 'var(--hcp-bg-0)',
          }}
        >
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
                padding: '26px 18px',
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
                  />
                </div>
              );
            })
          )}

          {/* Footer entry count */}
          {totalForActive > 0 && (
            <div
              style={{
                padding: '12px 18px 20px',
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
              fontWeight: 800,
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
