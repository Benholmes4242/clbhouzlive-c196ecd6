import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Globe } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { useTourSeason, useTourTournaments } from '../../hooks/useTourHubData';
import { getTourLogo, hasTourLogo } from '../../utils/tourLogos';
import { getTourMeta } from '../../constants/tourMap';
import type { ScheduleFilterType, TourFilterCode } from '../schedule';
import {
  AMBER,
  AMBER_TINT_04,
  INK,
  INK_FAINT,
  INK_TINT_06,
  INK_TINT_07,
} from '../../_shared/tokens';

interface ChipDef {
  id: ScheduleFilterType;
  label: string;
}

const FILTERS: ChipDef[] = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Past' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
];

const TOUR_CODES: Array<'all' | 'pga' | 'EURO' | 'LPGA' | 'CHAMP' | 'PGAD' | 'LIV'> = [
  'all', 'pga', 'EURO', 'LPGA', 'CHAMP', 'PGAD', 'LIV',
];

/**
 * Row 2 of the Tour Hub shell on /tourhub?tab=schedule.
 * Past / Live / Upcoming canonical chips + trailing 🌍 Tour overflow pill.
 * URL is the single source of truth — both this row and ScheduleTab read
 * `filter` and `tour` from searchParams.
 */
function ScheduleShellRowInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = (searchParams.get('filter') as ScheduleFilterType) || 'all';
  const activeTour = (searchParams.get('tour') as TourFilterCode) || 'all';
  const [tourSheetOpen, setTourSheetOpen] = useState(false);
  const filterRowRef = useRef<HTMLDivElement | null>(null);

  const { data: season } = useTourSeason();
  const { data: tournaments } = useTourTournaments(season?.id);

  const tourCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    if (!tournaments) return counts;
    counts.all = tournaments.length;
    for (const t of tournaments) {
      if (t.tour_code) counts[t.tour_code] = (counts[t.tour_code] || 0) + 1;
    }
    return counts;
  }, [tournaments]);

  const setFilter = (f: ScheduleFilterType) => {
    const params = new URLSearchParams(searchParams);
    if (f === 'all') params.delete('filter');
    else params.set('filter', f);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setActiveTour = (t: TourFilterCode) => {
    const params = new URLSearchParams(searchParams);
    if (t === 'all') params.delete('tour');
    else params.set('tour', t);
    setSearchParams(params, { replace: true });
  };

  const tourLabel = activeTour === 'all'
    ? 'All Tours'
    : (getTourMeta(activeTour)?.short ?? activeTour);

  useEffect(() => {
    const row = filterRowRef.current;
    if (!row) return;

    row.scrollLeft = 0;
    const frame = window.requestAnimationFrame(() => {
      row.scrollLeft = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTour]);

  return (
    <>
      <div
        className="relative"
        style={{
          background: '#F8FAFC',
          borderBottom: '0.5px solid rgba(15,23,42,0.08)',
        }}
      >
        <div
          ref={filterRowRef}
          role="tablist"
          aria-label="Filter Schedule"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
          style={{
            padding: '8.5px 16px',
            scrollSnapType: 'x proximity',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
          }}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(f.id)}
                className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
                style={{
                  height: 30,
                  padding: '0 11px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 15,
                  background: isActive ? INK_TINT_06 : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(15,23,42,0.20)' : INK_TINT_07}`,
                  color: isActive ? '#0A0E14' : '#64748B',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  scrollSnapAlign: 'start',
                }}
              >
                {f.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setTourSheetOpen(true)}
            className="shrink-0 active:scale-[0.97] flex items-center"
            aria-label="Filter by tour"
            style={{
              height: 30,
              padding: '0 11px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 15,
              background: activeTour !== 'all' ? INK_TINT_06 : 'transparent',
              border: `1px solid ${activeTour !== 'all' ? 'rgba(15,23,42,0.20)' : INK_TINT_07}`,
              color: activeTour !== 'all' ? '#0A0E14' : '#64748B',
              gap: 5,
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
            }}
          >
            {activeTour !== 'all' && hasTourLogo(activeTour.toLowerCase())
              ? <img src={getTourLogo(activeTour.toLowerCase())} alt="" className="shrink-0" style={{ width: 14, height: 14, objectFit: 'contain' }} />
              : <Globe size={12} strokeWidth={2.5} />
            }
            <span>{tourLabel}</span>
            <ChevronDown size={11} strokeWidth={2.5} style={{ opacity: 0.6 }} />
          </button>
        </div>

        {/* right-edge fade hint */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 24,
            pointerEvents: 'none',
            background: 'linear-gradient(90deg, rgba(248,250,252,0), #F8FAFC)',
          }}
        />
      </div>

      <BottomSheet
        open={tourSheetOpen}
        onClose={() => setTourSheetOpen(false)}
        ariaLabelledBy="schedule-tour-sheet-title"
      >
        <SheetHeader
          eyebrow="FILTER"
          title={<span id="schedule-tour-sheet-title">Select tour</span>}
          onClose={() => setTourSheetOpen(false)}
        />
        <div>
          {TOUR_CODES.map((code) => {
            const meta = code === 'all' ? null : getTourMeta(code);
            const label = code === 'all' ? 'All Tours' : (meta?.short ?? code);
            const description = code === 'all'
              ? 'Show events from every tour'
              : `${meta?.label ?? code} events`;
            const isSelected = activeTour === code;
            const count = tourCounts[code] ?? 0;
            return (
              <button
                key={code}
                onClick={() => { setActiveTour(code as TourFilterCode); setTourSheetOpen(false); }}
                aria-pressed={isSelected}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: isSelected ? AMBER_TINT_04 : 'transparent',
                  border: 'none',
                  borderLeft: isSelected ? `3px solid ${AMBER}` : '3px solid transparent',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 36, height: 22, borderRadius: 4, background: INK_TINT_06, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {code === 'all' ? (
                    <Globe className="w-4 h-4" style={{ color: INK_FAINT }} />
                  ) : hasTourLogo(code.toLowerCase()) ? (
                    <img src={getTourLogo(code.toLowerCase())} alt="" aria-hidden="true" style={{ width: 28, height: 18, objectFit: 'contain' }} />
                  ) : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: isSelected ? 700 : 500, color: INK }}>{label}</div>
                  <div style={{ fontSize: 12, color: INK_FAINT, marginTop: 2 }}>{description}</div>
                </div>
                <span style={{ fontSize: 13, color: INK_FAINT, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{count}</span>
                {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}

export const ScheduleShellRow = memo(ScheduleShellRowInner);
export default ScheduleShellRow;
