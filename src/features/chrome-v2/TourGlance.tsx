/**
 * TourGlance — the Tour hub's glass tile (BRIEF_TOUR_ISLAND §2,
 * tour-island-signed-off.html), on GlanceShell align:'left' so its left edge
 * meets the left island's. It merges the old burger drawer's sections with
 * the picker's tour list; Profile, Settings and Sign out live in the account
 * tile and are NOT carried over.
 *
 * LIVE_BOARD: sections form one row; live figures come only from useLiveTournaments.
 * Off-week grouping is local; shared row membership stays unchanged for TourPickerSheet.
 * Sections: the same destinations and nav.* labels TourSideMenu uses,
 * with the same showLive rule (Leaderboards only while something is live).
 * Tour rows come from useTourPickerRows — THE shared model with
 * TourPickerSheet — so row membership, order and selection never drift.
 * On the Leaderboards tab (activeTab 'live', deliberately cross-tour) the
 * tile shows sections only, with no tour list.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import './tour-glance.css';
import { useTranslation } from 'react-i18next';
import { GlanceShell } from './GlanceShell';
import { useTourPickerRows, type TourPickerRow } from '@/features/tourhub/hooks/useTourPickerRows';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { useLiveTournaments } from '@/features/tourhub/hooks/useLiveTournaments';
import { getTourLogo } from '@/features/tourhub/utils/tourLogos';
import { TOUR_DISPLAY, startsLabel } from '@/features/tourhub/components/tourIslandRules';
import { TourIcon, TourLiveDot, type TourIconName } from '@/features/tourhub/components/tourIslandIcons';

const INK = 'var(--tour-menu-ink)';
const MUTE = 'var(--tour-menu-mute)';
const DIM = 'var(--tour-menu-dim)';
const GREEN = 'var(--tour-menu-live)';
const RULE = 'var(--tour-menu-hair)';
export const TOUR_GLANCE_CARD_WIDTH = 'min(346px, calc(100vw - 24px))';

/** destination id → tile icon; labels resolve from the existing nav.* strings. */
const SECTIONS: { id: string; labelKey: string; icon: TourIconName }[] = [
  { id: 'overview', labelKey: 'nav.overview', icon: 'compass' },
  { id: 'news', labelKey: 'nav.news', icon: 'news' },
  { id: 'live', labelKey: 'nav.leadersShort', icon: 'trophy' },
  { id: 'schedule', labelKey: 'nav.schedule', icon: 'cal' },
  { id: 'players', labelKey: 'nav.players', icon: 'users' },
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
        width: 34, height: 34, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
        background: isTour ? 'var(--tour-menu-logo)' : 'var(--tour-menu-icon-chip)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {isTour
        ? <img src={getTourLogo(row.slug)} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
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
  const liveById = new Map(tournamentRows.map(tt => [tt.id, tt] as const));
  const liveCount = showLive ? new Set(tournamentRows.map(tt => tt.tourSlug)).size : 0;
  const visibleRows = rows.filter(row => row.status !== 'none');
  const offTours = [...new Set(rows.filter(row => row.status === 'none').map(row => TOUR_DISPLAY[row.slug] ?? row.slug))];

  const sections = SECTIONS.filter(s => s.id !== 'live' || showLive);

  const pick = (row: TourPickerRow) => {
    if (row.disabled) return;
    selectTour(row.slug, row.tournamentId ? { tournamentId: row.tournamentId } : undefined);
    onClose();
  };

  return (
    <GlanceShell onClose={onClose} anchorRef={anchorRef} label="Tour menu" align="left" cardStyle={{ width: TOUR_GLANCE_CARD_WIDTH, padding: 14 }}>
      {/* Sections */}
      <div data-testid="tour-glance-sections" className="tour-menu-sections" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
        {sections.map(s => {
          const on = s.id === activeTab;
          return <Button variant="ghost" key={s.id} type="button" data-tab={s.id} data-active={on} className="tour-menu-section"
            onClick={() => { onSelectTab(s.id); onClose(); }}>
            <TourIcon n={s.icon} s={17} c={on ? 'var(--tour-menu-on-ink)' : MUTE} w={1.9} />
            <span>{t(s.labelKey, { defaultValue: s.id === 'live' ? 'Leaders' : undefined })}</span>
            {s.id === 'live' && showLive ? <span className="tour-menu-section-dot"><TourLiveDot s={6} /></span> : null}
          </Button>;
        })}
      </div>

      {!sectionsOnly && (
        <>
          <div className="tour-menu-header">
            <span className="tour-menu-kicker">{t('tour.glance.thisWeek', { defaultValue: 'THIS WEEK' })}</span>
            {liveCount > 0 ? <span data-testid="tour-menu-live-count">{t('tour.glance.liveNow', { count: liveCount, defaultValue: `${liveCount} live now` })}</span> : null}
          </div>
          <div data-testid="tour-glance-rows">
            {visibleRows.map(row => {
              const live = row.status === 'live' ? liveById.get(row.tournamentId ?? '') : undefined;
              const round = live?.currentRound ?? row.currentRound;
              const score = live?.leaderToPar;
              const surname = live?.leaderName?.trim().split(/\s+/).pop();
              const leader = live && live.leaderCount > 1
                ? t('tour.glance.tied', { count: live.leaderCount, defaultValue: `${live.leaderCount} tied` })
                : surname;
              const hasLeader = !!leader && score != null;
              return <Button variant="ghost" key={row.key} type="button" className="tour-menu-row" data-tour-row={row.slug} disabled={row.disabled}
                aria-pressed={row.selected} onClick={() => pick(row)}>
                <RowChip row={row} />
                <span className="tour-menu-column">
                  <span className="tour-menu-name">{row.slug === 'major' ? TOUR_DISPLAY.major : TOUR_DISPLAY[row.slug] ?? row.slug}</span>
                  <span className="tour-menu-sub">{row.slug === 'all' ? t('tour.glance.allToursSub', { defaultValue: 'Every tour, soonest first' }) : row.eventName ?? ''}</span>
                </span>
                {row.status === 'live' ? <span className="tour-menu-right">
                  {hasLeader ? <b data-testid="tour-menu-leader">{leader} <span data-under-par={score < 0}>{score < 0 ? `−${Math.abs(score)}` : score === 0 ? 'E' : `+${score}`}</span></b> : null}
                  <small><span className="tour-menu-live"><TourLiveDot s={6} />{round != null ? `R${round}` : t('tour.glance.live', { defaultValue: 'Live' })}</span></small>
                </span> : row.status === 'completed' ? <span className="tour-menu-right tour-menu-status"><b>{t('tour.glance.final', { defaultValue: 'Final' })}</b></span>
                  : row.status === 'upcoming' && row.startDate ? <span className="tour-menu-right tour-menu-status"><b>{t('tour.glance.starts', { label: startsLabel(row.startDate), defaultValue: startsLabel(row.startDate) })}</b></span> : null}
              </Button>;
            })}
          </div>
          {offTours.length ? <div className="tour-menu-off" data-testid="tour-menu-off">{t('tour.glance.offThisWeek', { tours: offTours.join(' · '), defaultValue: `Off this week: ${offTours.join(' · ')}` })}</div> : null}
        </>
      )}
    </GlanceShell>
  );
}

export default TourGlance;
