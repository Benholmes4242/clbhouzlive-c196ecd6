/**
 * BRIEF_CHAMPIONS_SHEET_MATCHES_BOARD — the deep view of one course record.
 *
 * THE ROW IS THE BOARD'S ROW. ChampionsRow in _shared/boardParts.tsx is the
 * single implementation: [MOVEMENT?] [POS] [avatar] [MEMBER] [WHEN] [MARK],
 * tie-aware positions (1, T3, T3, 5), a crown on position one only, the amber
 * own-row, and MOVEMENT gated on the category's WINDOW — present on 90-day
 * categories, ABSENT on all-time ones. The sheet does not hold a copy.
 *
 * WHAT THE SHEET KEEPS THAT THE BOARD DOES NOT — it is the deep view, and the
 * board omits these for space, not because they are wrong:
 *   formatGapFromChampion   the gap on every row beneath the holder
 *   formatHeldFor           beside the champion in the header
 *   daysSince/NEW_BADGE_DAYS the recently-taken marker
 *   duelLine                the tension between the top two
 *
 * The sheet shows the FULL FIELD — no five-row slice and NO PINNED VIEWER ROW,
 * because every member is already present and pinning would duplicate them.
 * The viewer's row is scrolled to on open when it starts off-screen.
 */
import { GAM } from '../../../gam/tokens';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { useTranslation } from 'react-i18next';
import { A, LABEL, SANS } from '@/features/courses/components/holes/analytical/tokens';
import {
  ChampionsRow,
  ChampionsColumnHeader,
  categoryWindowDays,
  hasToPar,
  positionsFor,
} from './_shared/boardParts';
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
  /** Member UUID — threaded through for the deterministic avatar initial. */
  userId?: string | null;
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
  /** Course par — the only way a gross mark can state a to-par. */
  coursePar?: number | null;
  /** Backdrop theme. Retained for callers; the analytical board is dark-only. */
  theme?: 'light' | 'dark';
}

const DEEP_AMBER = A.AMBER;

export const FullCourseLeaderboardSheet: React.FC<Props> = ({
  open,
  onClose,
  courseName,
  groupedRows,
  visibleCategories,
  initialCategory,
  window: legendWindow,
  yourRanks,
  coursePar = null,
  theme = 'dark',
}) => {
  const { t } = useTranslation('courses');
  const [activeCategory, setActiveCategory] = useState<LegendCategory>(initialCategory);

  useEffect(() => {
    if (open) setActiveCategory(initialCategory);
  }, [open, initialCategory]);

  const tabsToShow = useMemo(
    () => visibleCategories.filter((cat) => (groupedRows.get(cat.key)?.rows.length ?? 0) > 0),
    [visibleCategories, groupedRows],
  );

  const activeEntry = groupedRows.get(activeCategory);
  const activeRows = activeEntry?.rows ?? [];
  const activeDescriptor =
    tabsToShow.find((c) => c.key === activeCategory) ??
    visibleCategories.find((c) => c.key === activeCategory);
  const totalForActive = activeEntry?.total ?? activeRows.length;

  const champion = activeRows[0];
  const selfRow = activeRows.find((r) => r.isSelf);
  const defending = champion?.isSelf === true;
  const standsAlone = activeRows.length === 1;
  const selfRank = selfRow?.rank ?? null;
  const runnerUp = activeRows.find((r) => !r.isSelf) ?? null;

  const positions = useMemo(() => positionsFor(activeRows), [activeRows]);
  /* MOVEMENT IS GATED ON THE WINDOW, exactly as on the board. An all-time
     record does not move for months, so the column is absent rather than a
     column of dashes. The test is the category's window, never its name. */
  const showMovement = categoryWindowDays(activeCategory) != null;
  const showToPar = hasToPar(activeCategory) && coursePar != null;

  const listRef = useRef<HTMLDivElement>(null);
  const selfRowRef = useRef<HTMLDivElement>(null);
  const [selfOffscreen, setSelfOffscreen] = useState<null | 'above' | 'below'>(null);

  // Reset scroll on category switch.
  useEffect(() => {
    setSelfOffscreen(null);
    listRef.current?.scrollTo({ top: 0 });
  }, [activeCategory]);

  useEffect(() => {
    setSelfOffscreen(null);
    if (defending) return; // the viewer is row one; nothing to find
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

  /* SCROLL TO THE VIEWER ON OPEN. Deferred past the sheet's entry transform:
     scrolling a translating element mid-animation lands on the wrong offset,
     so this waits for the sheet to settle before it moves. */
  useEffect(() => {
    if (!open || defending || !selfRow) return;
    const id = window.setTimeout(() => {
      const rowEl = selfRowRef.current;
      const rootEl = listRef.current;
      if (!rowEl || !rootEl) return;
      if (rowEl.offsetTop > rootEl.clientHeight - 40) {
        rootEl.scrollTo({ top: Math.max(0, rowEl.offsetTop - rootEl.clientHeight / 2), behavior: 'smooth' });
      }
    }, 420);
    return () => window.clearTimeout(id);
  }, [open, activeCategory, defending, selfRow]);

  const jumpToSelf = () => {
    selfRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const windowLabel =
    legendWindow === '90d' ? t('champions.board.last90Days') : t('champions.board.allTime');

  const pillMounted = selfOffscreen != null && selfRank != null && !defending;

  const opponentValue = defending
    ? (runnerUp?.value ?? champion?.value ?? 0)
    : (selfRow?.value ?? champion?.value ?? 0);
  const chaseStandsAlone = defending ? !runnerUp : standsAlone;

  const chaseLine = champion
    ? selfRow || standsAlone
      ? duelLine(
          activeCategory,
          champion.value,
          opponentValue,
          defending,
          chaseStandsAlone,
          (champion.name ?? '').split(' ')[0],
        )
      : 'Not on the board yet'
    : '';

  const championName = champion ? (champion.isSelf ? 'You' : champion.name) : '';
  const championHoldDuration = champion ? formatHeldFor(daysSince(champion.attained_at)) : null;

  const roundsTotal = useMemo(() => {
    const roundsCat = visibleCategories.find((c) => String(c.key).startsWith('most_rounds'));
    const r = roundsCat ? groupedRows.get(roundsCat.key)?.rows ?? [] : [];
    return r.reduce((s, x) => s + (x.value || 0), 0);
  }, [visibleCategories, groupedRows]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="course-legends-full-sheet-title"
      variant="dark"
      /* THE SURFACE REACHES THE SHEET'S OWN TOP EDGE, grabber on it. Passed
         unconditionally so no host theme can leave a strip above the header. */
      surfaceColor={A.CANVAS}
      style={{
        maxHeight: '95dvh',
        display: 'flex',
        flexDirection: 'column',
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          position: 'relative',
          fontFamily: SANS,
          color: A.INK,
          background: A.CANVAS,
        }}
      >
        <SheetHeader
          eyebrow={courseName}
          title={
            <span
              id="course-legends-full-sheet-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: A.INK,
              }}
            >
              {activeDescriptor?.label ?? courseName}
            </span>
          }
          onClose={onClose}
          borderBottom={false}
          dark
        />

        {/* STAT RAIL — members, rounds, and the window, which is load-bearing:
            a member must know whether this is all time or three months. */}
        <div
          style={{
            ...LABEL,
            padding: '0 16px',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            color: A.DIM,
            fontVariantNumeric: 'tabular-nums lining-nums',
            flexShrink: 0,
          }}
        >
          <span>{t('champions.board.members', { count: totalForActive })}</span>
          {roundsTotal > 0 && <span>{t('champions.board.rounds', { count: roundsTotal })}</span>}
          <span style={{ color: A.MUTE }}>{windowLabel}</span>
        </div>

        {/* THE CHAMPION AND HOW LONG THEY HAVE HELD IT. "held for 94 days" is
            the sentence that makes a course record feel like a record. */}
        {champion && (
          <div
            style={{
              padding: '8px 16px 0',
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}>
              {championName}
            </span>
            {championHoldDuration && (
              <span style={{ ...LABEL, fontSize: 10.5, color: DEEP_AMBER }}>{championHoldDuration}</span>
            )}
          </div>
        )}

        {/* THE DUEL LINE — the tension between the top two. */}
        {champion && chaseLine && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px 0',
              marginBottom: 12,
              flexShrink: 0,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: defending ? DEEP_AMBER : A.MUTE,
                letterSpacing: '-0.005em',
                minWidth: 0,
              }}
            >
              {chaseLine}
            </span>
          </div>
        )}

        {/* CATEGORY PILLS — a member moves between records without closing. */}
        <div
          className="hcp-full-lb-tabs"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '0 16px 12px',
            background: A.CANVAS,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            flexShrink: 0,
          }}
        >
          <style>{`.hcp-full-lb-tabs::-webkit-scrollbar { display: none; }`}</style>
          {tabsToShow.map((cat) => {
            const isActive = cat.key === activeCategory;
            const youHold = yourRanks[cat.key] === 1;
            const mark = groupedRows.get(cat.key)?.rows[0]?.valueDisplay ?? '';
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 11px',
                  borderRadius: 999,
                  background: isActive ? A.INK : 'transparent',
                  border: `1px solid ${isActive ? A.INK : A.BORDER}`,
                  color: isActive ? A.CANVAS : A.MUTE,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: SANS,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}
              >
                {cat.short}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    color: isActive ? A.CANVAS : youHold ? DEEP_AMBER : A.INK,
                  }}
                >
                  {mark}
                </span>
              </button>
            );
          })}
        </div>

        {activeRows.length > 0 && (
          <ChampionsColumnHeader
            showMovement={showMovement}
            posLabel={t('champions.board.pos')}
            memberLabel={t('champions.board.member')}
            whenLabel={t('champions.board.when')}
            markLabel={t('champions.board.mark')}
          />
        )}

        {/* THE FULL FIELD. Scrolls, and pays the bottom safe-area inset on the
            scrolling content so the last row clears the home indicator. */}
        <div
          ref={listRef}
          className="hcp-champs-list-scroller"
          style={
            {
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              background: A.CANVAS,
              scrollbarWidth: 'none',
              paddingBottom: pillMounted
                ? 'calc(60px + env(safe-area-inset-bottom, 0px))'
                : 'calc(24px + env(safe-area-inset-bottom, 0px))',
            } as React.CSSProperties
          }
        >
          <style>{`.hcp-champs-list-scroller::-webkit-scrollbar { display: none; }`}</style>
          {activeRows.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: A.MUTE, fontSize: 13 }}>
              No entries in this category yet.
            </div>
          ) : (
            activeRows.map((row, i) => (
              <ChampionsRow
                key={`${row.userId ?? row.name}-${row.attained_at}-${i}`}
                rowRef={row.isSelf ? selfRowRef : undefined}
                row={row}
                pos={positions[i]}
                showMovement={showMovement}
                showToPar={showToPar}
                coursePar={coursePar}
                rule={i !== 0}
                /* THE GAP FROM THE CHAMPION — the sheet's most useful figure,
                   on every row beneath the holder. The holder passes null:
                   zero is not a fact there, it is what being first means. */
                subline={
                  i === 0
                    ? null
                    : formatGapFromChampion(activeCategory, row.value, activeRows[0].value)
                }
                isNew={daysSince(row.attained_at) < NEW_BADGE_DAYS}
              />
            ))
          )}

          {totalForActive > 0 && (
            <div
              style={{
                ...LABEL,
                padding: '14px 16px 4px',
                textAlign: 'center',
                color: A.DIM,
              }}
            >
              {`${totalForActive} ON THE BOARD`}
            </div>
          )}
        </div>

        {pillMounted && (
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
              background: A.PANEL,
              color: A.INK,
              border: `1px solid ${A.BORDER}`,
              fontFamily: SANS,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              fontVariantNumeric: 'tabular-nums lining-nums',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
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
