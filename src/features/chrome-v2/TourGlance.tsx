/**
 * TourGlance — the Tour hub's glass tile (BRIEF_TOUR_ISLAND §2,
 * tour-island-signed-off.html), on GlanceShell align:'left' so its left edge
 * meets the left island's. It merges the old burger drawer's sections with
 * the picker's tour list; Profile, Settings and Sign out live in the account
 * tile and are NOT carried over.
 *
 * Sections: the same six destinations and nav.* labels TourSideMenu uses,
 * with the same showLive rule (Leaderboards only while something is live).
 * Tour rows come from useTourPickerRows — THE shared model with
 * TourPickerSheet — so row membership, order and selection never drift.
 * On the Leaderboards tab (activeTab 'live', deliberately cross-tour) the
 * tile shows sections only, with no tour list.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlanceShell } from './GlanceShell';
import { useTourPickerRows, type TourPickerRow } from '@/features/tourhub/hooks/useTourPickerRows';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { useLiveTournaments } from '@/features/tourhub/hooks/useLiveTournaments';
import { getTourLogo } from '@/features/tourhub/utils/tourLogos';
import { TOUR_DISPLAY, shortWeekday } from '@/features/tourhub/components/tourIslandRules';
import { TourIcon, TourLiveDot, type TourIconName } from '@/features/tourhub/components/tourIslandIcons';

const INK = '#F8FAFC';
const MUTE = 'rgba(248,250,252,0.62)';
const DIM = 'rgba(248,250,252,0.42)';
const GREEN = '#34D77F';
const RULE = 'rgba(255,255,255,0.08)';

/** destination id → tile icon; labels resolve from the existing nav.* strings. */
const SECTIONS: { id: string; labelKey: string; icon: TourIconName }[] = [
  { id: 'overview', labelKey: 'nav.overview', icon: 'compass' },
  { id: 'news', labelKey: 'nav.news', icon: 'news' },
  { id: 'live', labelKey: 'nav.leaderboards', icon: 'trophy' },
  { id: 'schedule', labelKey: 'nav.schedule', icon: 'cal' },
  { id: 'players', labelKey: 'nav.players', icon: 'users' },
  { id: 'leaderboards', labelKey: 'nav.leaders', icon: 'board' },
];

export interface TourGlanceProps {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  /** Leaderboards tab: sections only, no tour list. */
  sectionsOnly?: boolean;
}

function RowChip({ row }: { row: TourPickerRow }) {
  const isTour = row.slug !== 'all' && row.slug !== 'major';
  return (
    <span
      aria-hidden="true"
      style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0, overflow: 'hidden',
        background: isTour ? '#FFFFFF' : 'rgba(255,255,255,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {isTour
        ? <img src={getTourLogo(row.slug)} alt="" style={{ width: 25, height: 25, objectFit: 'contain' }} />
        : <TourIcon n={row.slug === 'major' ? 'trophy' : 'globe'} s={18.6} c={INK} w={1.7} />}
    </span>
  );
}

export function TourGlance({ onClose, anchorRef, activeTab, onSelectTab, sectionsOnly = false }: TourGlanceProps) {
  const { t } = useTranslation('tourhub');
  const { selectTour } = useTourSelection();
  const { rows } = useTourPickerRows();
  const { data: liveTournaments, isFetched: liveFetched } = useLiveTournaments();
  // The same showLive rule TourSideMenu uses today.
  const tournamentRows = Array.isArray(liveTournaments) ? liveTournaments : [];
  const showLive = liveFetched && tournamentRows.length > 0;
  const liveRoundById = new Map(tournamentRows.map(tt => [tt.id, tt.currentRound] as const));

  const sections = SECTIONS.filter(s => s.id !== 'live' || showLive);

  const pick = (row: TourPickerRow) => {
    if (row.disabled) return;
    selectTour(row.slug, row.tournamentId ? { tournamentId: row.tournamentId } : undefined);
    onClose();
  };

  return (
    <GlanceShell onClose={onClose} anchorRef={anchorRef} label="Tour menu" align="left" cardStyle={{ width: 316, padding: 14 }}>
      {/* Sections */}
      <div data-testid="tour-glance-sections" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
        {sections.map((s, i) => {
          const on = s.id === activeTab;
          const span = sections.length === 5 && i >= 3 ? 3 : 2;
          return (
            <button
              key={s.id}
              type="button"
              data-tab={s.id}
              data-active={on}
              onClick={() => { onSelectTab(s.id); onClose(); }}
              style={{
                gridColumn: `span ${span}`, height: 56, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: on ? INK : 'rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                position: 'relative', fontFamily: 'inherit',
              }}
            >
              <TourIcon n={s.icon} s={18} c={on ? '#0A0A0C' : MUTE} w={1.9} />
              <span style={{ fontSize: 11.5, fontWeight: 650, color: on ? '#0A0A0C' : INK }}>{t(s.labelKey)}</span>
              {s.id === 'live' && showLive && (
                <span style={{ position: 'absolute', top: 8, right: 9 }}><TourLiveDot s={6} /></span>
              )}
            </button>
          );
        })}
      </div>

      {!sectionsOnly && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16, padding: '0 2px' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', color: DIM }}>{t('tour.glance.thisWeek', { defaultValue: 'THIS WEEK' })}</span>
            <span style={{ fontSize: 10.5, color: DIM }}>{t('tour.glance.chooseTour', { defaultValue: 'Choose the tour you see' })}</span>
          </div>

          <div data-testid="tour-glance-rows" style={{ marginTop: 6 }}>
            {rows.map((row, i) => {
              const dimmed = row.disabled;
              const sub = row.slug === 'all'
                ? t('tour.glance.allToursSub', { defaultValue: 'Every tour, soonest first' })
                : row.status === 'none'
                  ? t('picker.noEventsThisWeek')
                  : row.eventName ?? '';
              const liveRound = row.status === 'live'
                ? liveRoundById.get(row.tournamentId ?? '') ?? row.currentRound
                : null;
              return (
                <button
                  key={row.key}
                  type="button"
                  data-tour-row={row.slug}
                  disabled={row.disabled}
                  aria-pressed={row.selected}
                  onClick={() => pick(row)}
                  style={{
                    width: '100%', height: 48, display: 'flex', alignItems: 'center', gap: 11, padding: '0 4px',
                    background: 'none', border: 'none',
                    borderBottom: i < rows.length - 1 ? `1px solid ${RULE}` : 'none',
                    opacity: dimmed ? 0.45 : 1,
                    cursor: row.disabled ? 'default' : 'pointer',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <RowChip row={row} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.slug === 'major' ? TOUR_DISPLAY.major : TOUR_DISPLAY[row.slug] ?? row.slug}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: MUTE, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub}
                    </span>
                  </span>
                  {row.status === 'live' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 11, fontWeight: 700, color: GREEN }}>
                      <TourLiveDot s={5} />
                      {liveRound != null ? `R${liveRound}` : t('tour.glance.live', { defaultValue: 'Live' })}
                    </span>
                  ) : row.status === 'completed' ? (
                    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 650, color: DIM }}>{t('tour.glance.final', { defaultValue: 'Final' })}</span>
                  ) : row.status === 'upcoming' && row.startDate ? (
                    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 650, color: DIM }}>{shortWeekday(row.startDate)}</span>
                  ) : null}
                  {row.selected
                    ? <TourIcon n="check" s={16} c={INK} w={2.4} />
                    : <span style={{ width: 16, flexShrink: 0 }} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </GlanceShell>
  );
}

export default TourGlance;
