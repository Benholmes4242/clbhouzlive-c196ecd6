/**
 * TourPickerSheet — the "Select tour" bottom sheet formerly private to
 * TourSwitcherAffordance. Extracted so multiple triggers (the switcher
 * pill AND the ChromeIsland left-capsule) can reuse the same picker UI
 * and wire into the same TourSelectionContext.
 *
 * Also exports useTourPillLabel(): the pill label logic that reflects
 * whichever tour is currently in view on the hero.
 */
import React, { useMemo } from 'react';
import { Globe2, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { getTourLogo } from '../utils/tourLogos';
import { useHeroCarouselData, mapTourSlug as mapTourSlugForPicker, type HeroSlide } from '../hooks/useHeroCarouselData';
import { useActiveMensMajor } from '../hooks/useActiveMensMajor';
import { useTournamentsCache } from '@/hooks/useTournamentsCache';
import {
  RESULTS_CAP_DAYS,
  daysSinceEndDate,
} from './overview-v3/HybridHero.utils';
import { useTourSelection } from '../context/TourSelectionContext';
import {
  AMBER_TINT_04,
  FONT,
  GOLD_DEEP,
  INK,
  INK_ALPHA_45,
  INK_TINT_07,
  STATUS_LIVE,
} from '../_shared/tokens';

// i18n never-key discipline (Wave 3e.i): tour brand names are proper nouns.
// They are the same in every locale — "PGA TOUR" / "LPGA" / "DP WORLD TOUR" /
// "KORN FERRY" / "CHAMPIONS" / "LIV GOLF". Do NOT key. Same rationale as
// player names, tournament names, team names.
const TOUR_LABEL: Record<string, string> = {
  all: 'ALL TOURS',
  major: 'MAJORS',
  pga: 'PGA TOUR',
  lpga: 'LPGA',
  euro: 'DP WORLD TOUR',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
  liv: 'LIV GOLF',
};

const TOUR_LABEL_SHORT: Record<string, string> = {
  all: 'ALL TOURS',
  major: 'MAJORS',
  pga: 'PGA',
  lpga: 'LPGA',
  euro: 'DP WORLD',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
  liv: 'LIV',
};

/**
 * THE ROW LIST IS NOT THE LABEL MAP. It used to be: the sheet looped
 * Object.entries(TOUR_LABEL), which carries `all` (and now `major`) for the
 * readout hooks — so a second, permanently-disabled "ALL TOURS" row rendered
 * below the real one and read as a duplicate. `all` and `major` have their own
 * hand-built rows at the top of the sheet; only real tours belong in the loop.
 */
const TOUR_ROW_SLUGS = ['pga', 'lpga', 'euro', 'pgad', 'champ', 'liv'] as const;


const GOLD_TINT_10 = 'rgba(255,184,0,0.10)';
const GOLD_TINT_18 = 'rgba(255,184,0,0.18)';
const GOLD_BORDER = 'rgba(255,184,0,0.45)';
const SUBTITLE_COLOR = '#8A9099';

/**
 * Title-case an unmapped slug so an absence reads as visibly odd rather than as
 * a confident, wrong tour name. Never returns a real tour label.
 */
function plainSlug(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Long-form pill label. This is a READOUT of whatever tour is on screen — never
 * an independent opinion about it. appliedTourSlug (published by the active tab)
 * wins, then the hero's viewing slug, then the picker's command channel.
 */
export function useTourPillLabel(): string {
  const { selectedTourSlug, viewingTourSlug, appliedTourSlug } = useTourSelection();
  const activeTourSlug = appliedTourSlug ?? selectedTourSlug ?? viewingTourSlug ?? 'all';
  if (activeTourSlug === 'major') return 'THE MAJORS';
  return TOUR_LABEL[activeTourSlug] ?? plainSlug(activeTourSlug);
}

/**
 * Short-form label for tight chrome (Chrome island left capsule). Same rule:
 * a readout of the list on screen, in the same precedence order.
 */
export function useTourShortLabel(): string {
  const { selectedTourSlug, viewingTourSlug, appliedTourSlug } = useTourSelection();
  const activeTourSlug = appliedTourSlug ?? selectedTourSlug ?? viewingTourSlug ?? 'all';
  if (activeTourSlug === 'major') return 'MAJORS';
  return TOUR_LABEL_SHORT[activeTourSlug] ?? activeTourSlug.toUpperCase();
}

export interface TourPickerSheetProps {
  open: boolean;
  onClose: () => void;
}

export const TourPickerSheet: React.FC<TourPickerSheetProps> = ({ open, onClose }) => {
  const { data: heroSlides } = useHeroCarouselData();
  const { data: cache } = useTournamentsCache();
  const activeMajor = useActiveMensMajor();
  const { selectedTourSlug, selectTour, viewingTourSlug, viewingTournamentId, isSlugAcceptable } = useTourSelection();
  const { t } = useTranslation('tourhub');

  const activeTourSlug = appliedTourSlug ?? selectedTourSlug ?? viewingTourSlug ?? 'all';
  const isMajorActive = activeTourSlug === 'major';

  const slidesByTour = useMemo(() => {
    const map: Record<string, HeroSlide[]> = {};
    (heroSlides ?? []).forEach((s) => {
      const slug = s.tournament.tourSlug;
      if (slug === 'major') return;
      if (!map[slug]) map[slug] = [];
      map[slug].push(s);
    });
    return map;
  }, [heroSlides]);

  // SEASON COMPLETE (MICRO_BRIEF_TOUR_SEASON_COMPLETE_WINDOW §3). A tour past
  // the hero's RESULTS_CAP_DAYS with no upcoming event is omitted from the
  // carousel, so its picker row has no slide to describe. Read the last result
  // straight from the (wider) completed bucket instead. No date claim about the
  // next season — the feed may not carry it yet.
  const seasonCompleteByTour = useMemo(() => {
    const map: Record<string, { name: string; winner: string | null }> = {};
    if (!cache) return map;
    const hasUpcoming = new Set(
      cache.upcoming.map((t) => mapTourSlugForPicker(t.season?.tour_name || '')),
    );
    const hasLive = new Set(
      cache.live.map((t) => mapTourSlugForPicker(t.season?.tour_name || '')),
    );
    [...cache.completed]
      .sort((a, b) => (b.end_date || '').localeCompare(a.end_date || ''))
      .forEach((t) => {
        const slug = mapTourSlugForPicker(t.season?.tour_name || '');
        if (map[slug] || hasUpcoming.has(slug) || hasLive.has(slug)) return;
        const age = daysSinceEndDate(t.end_date);
        if (age == null || age <= RESULTS_CAP_DAYS) return;
        map[slug] = { name: t.name, winner: t.defending_champion ?? null };
      });
    return map;
  }, [cache]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="tour-switcher-sheet-title"
    >
      <SheetHeader
        eyebrow={t('picker.eyebrow')}
        title={<span id="tour-switcher-sheet-title">{t('picker.title')}</span>}
        onClose={onClose}
      />


      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* All tours — no filter: the hero river stays as it is and every
            section that can express "all" (Coming up) merges chronologically. */}
        <button
          key="all"
          type="button"
          disabled={!isSlugAcceptable('all')}
          onClick={() => {
            selectTour('all');
            onClose();
          }}
          aria-pressed={activeTourSlug === 'all'}
          style={{
            /* S2.2 — a row the active page cannot express is DIMMED, never
               hidden: a picker whose contents change per tab reads as broken. */
            opacity: isSlugAcceptable('all') ? 1 : 0.35,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: activeTourSlug === 'all' ? AMBER_TINT_04 : 'transparent',
            border: 'none',
            borderBottom: `0.5px solid ${INK_TINT_07}`,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: FONT,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              background: INK_TINT_07,
            }}
          >
            <Globe2 size={15} strokeWidth={2.2} color={INK} aria-hidden />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {t('picker.allTours')}
            </div>
            <div style={{ marginTop: 2, fontSize: 12, fontWeight: 500, color: SUBTITLE_COLOR }}>
              {t('picker.allToursSub')}
            </div>
          </div>
        </button>
        {activeMajor && (

          <button
            key="major"
            type="button"
            disabled={!isSlugAcceptable('major')}
            onClick={() => {
              selectTour('major');
              onClose();
            }}
            aria-pressed={isMajorActive}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: isMajorActive ? GOLD_TINT_18 : GOLD_TINT_10,
              opacity: isSlugAcceptable('major') ? 1 : 0.35,
              border: 'none',
              borderBottom: `0.5px solid ${INK_TINT_07}`,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: FONT,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                background: GOLD_TINT_18,
                border: `0.5px solid ${GOLD_BORDER}`,
              }}
            >
              <Trophy size={15} strokeWidth={2.4} color={GOLD_DEEP} aria-hidden />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: GOLD_DEEP,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {/* eslint-disable-next-line i18next/no-literal-string -- brand: tour-collection proper noun */}
                The Majors
              </div>

              <div
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  fontWeight: 600,
                  color: INK,
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {activeMajor.name}
              </div>
            </div>
            {activeMajor.status === 'live' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_LIVE, display: 'inline-block' }} />
                {/* AXIS 10 (floor): status marker, not language. */}
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: STATUS_LIVE }}>{t('status.live')}</span>
              </span>
            ) : (
              <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: GOLD_DEEP }}>
                {t('status.upcoming')}
              </span>
            )}
          </button>
        )}
        {TOUR_ROW_SLUGS.flatMap((slug) => {
          const label = TOUR_LABEL[slug];

          const tourSlides = slidesByTour[slug] ?? [];
          const seasonDone = seasonCompleteByTour[slug];

          if (tourSlides.length === 0) {
            return [(
              <button
                key={slug}
                type="button"
                disabled
                aria-pressed={false}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  cursor: 'default',
                  opacity: 0.4,
                  textAlign: 'left',
                  fontFamily: FONT,
                }}
              >
                <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={getTourLogo(slug)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {label}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 12, fontWeight: 500, color: SUBTITLE_COLOR, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {seasonDone ? seasonDone.name : t('picker.noEventsThisWeek')}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(15,23,42,0.30)' }}>
                  {seasonDone ? t('status.seasonComplete') : t('status.noEvent')}
                </span>
              </button>
            )];
          }

          return tourSlides.map((slide) => {
            const tournament = slide.tournament;
            const isActive = !isMajorActive
              && (viewingTournamentId
                ? tournament.id === viewingTournamentId
                : slug === activeTourSlug && slide === tourSlides[0]);

            return (
              <button
                key={`${slug}:${tournament.id}`}
                type="button"
                disabled={!isSlugAcceptable(slug)}
                onClick={() => {
                  selectTour(slug, { tournamentId: tournament.id });
                  onClose();
                }}
                aria-pressed={isActive}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: isActive ? AMBER_TINT_04 : 'transparent',
                  opacity: isSlugAcceptable(slug) ? 1 : 0.35,
                  border: 'none',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  cursor: isSlugAcceptable(slug) ? 'pointer' : 'default',
                  textAlign: 'left',
                  fontFamily: FONT,
                }}
              >
                <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={getTourLogo(slug)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {label}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 12, fontWeight: 500, color: SUBTITLE_COLOR, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tournament.name}
                  </div>
                </div>

                {slide.type === 'live' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_LIVE, display: 'inline-block' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: STATUS_LIVE }}>{t('status.live')}</span>
                  </span>
                ) : slide.type === 'completed' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Trophy size={12} strokeWidth={2.5} style={{ color: GOLD_DEEP }} aria-hidden />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: GOLD_DEEP }}>{t('status.results')}</span>
                  </span>
                ) : (
                  <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: INK_ALPHA_45 }}>
                    {t('status.upcoming')}
                  </span>
                )}
              </button>
            );
          });
        })}
      </div>

      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </BottomSheet>
  );
};

export default TourPickerSheet;
