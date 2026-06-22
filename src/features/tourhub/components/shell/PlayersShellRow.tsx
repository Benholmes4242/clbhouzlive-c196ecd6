import { memo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Globe } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { getTourLogo, hasTourLogo } from '../../utils/tourLogos';
import {
  AMBER,
  AMBER_TINT_04,
  INK,
  INK_FAINT,
  INK_TINT_06,
  INK_TINT_07,
} from '../../_shared/tokens';

type PlayerTourCode = 'pga' | 'EURO' | 'LPGA' | 'CHAMP' | 'PGAD' | 'LIV';

const TOUR_CODES: PlayerTourCode[] = ['pga', 'EURO', 'LPGA', 'PGAD', 'LIV'];

const TOUR_LABELS: Record<PlayerTourCode, string> = {
  pga: 'PGA Tour',
  EURO: 'DP World Tour',
  LPGA: 'LPGA',
  CHAMP: 'Champions',
  PGAD: 'Korn Ferry',
  LIV: 'LIV Golf',
};

const TOUR_DESCRIPTIONS: Record<PlayerTourCode, string> = {
  pga: 'PGA Tour players',
  EURO: 'DP World Tour players',
  LPGA: 'LPGA Tour players',
  CHAMP: 'PGA Champions Tour players',
  PGAD: 'Korn Ferry Tour players',
  LIV: 'LIV Golf players',
};

/**
 * Row 2 of the Tour Hub shell on /tourhub?tab=players.
 * Trailing 🌍 Tour overflow pill only — sort lives in body, search via
 * CompactHeader magnifier.
 */
function PlayersShellRowInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTour = (searchParams.get('tour') as PlayerTourCode) || 'pga';
  const activeTour: PlayerTourCode = rawTour === 'CHAMP' ? 'pga' : rawTour;
  const [tourSheetOpen, setTourSheetOpen] = useState(false);

  const setActiveTour = (tour: PlayerTourCode) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'players');
    params.set('tour', tour);
    setSearchParams(params, { replace: true });
    window.scrollTo(0, 0);
  };

  return (
    <>
      <div
        className="relative"
        style={{
          background: '#F8FAFC',
        }}
      >
        <div
          className="flex items-center justify-end"
          style={{ padding: '7px 16px' }}
        >
          {(() => {
            const isActive = activeTour !== 'pga';
            return (
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
                  background: isActive ? INK_TINT_06 : 'transparent',
                  border: isActive ? `1px solid rgba(15,23,42,0.20)` : `1.5px solid ${INK_TINT_07}`,
                  color: isActive ? '#0A0E14' : '#64748B',
                  gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                {hasTourLogo(activeTour.toLowerCase())
                  ? <img src={getTourLogo(activeTour.toLowerCase())} alt="" className="shrink-0" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                  : <Globe size={12} strokeWidth={2.5} />
                }
                <span>{TOUR_LABELS[activeTour] ?? 'Tour'}</span>
                <ChevronDown size={11} strokeWidth={2.5} style={{ opacity: 0.6 }} />
              </button>
            );
          })()}
        </div>
      </div>

      <BottomSheet
        open={tourSheetOpen}
        onClose={() => setTourSheetOpen(false)}
        ariaLabelledBy="players-tour-sheet-title"
      >
        <SheetHeader
          eyebrow="FILTER"
          title={<span id="players-tour-sheet-title">Select tour</span>}
          onClose={() => setTourSheetOpen(false)}
        />
        {TOUR_CODES.map((code) => {
          const isSelected = activeTour === code;
          return (
            <button
              key={code}
              onClick={() => { setActiveTour(code); setTourSheetOpen(false); }}
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
                {hasTourLogo(code.toLowerCase())
                  ? <img src={getTourLogo(code.toLowerCase())} alt="" aria-hidden="true" style={{ width: 28, height: 18, objectFit: 'contain' }} />
                  : null}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: isSelected ? 700 : 500, color: INK }}>{TOUR_LABELS[code]}</div>
                <div style={{ fontSize: 12, color: INK_FAINT, marginTop: 2 }}>{TOUR_DESCRIPTIONS[code]}</div>
              </div>
              {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, flexShrink: 0 }} />}
            </button>
          );
        })}
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
      </BottomSheet>
    </>
  );
}

export const PlayersShellRow = memo(PlayersShellRowInner);
export default PlayersShellRow;
