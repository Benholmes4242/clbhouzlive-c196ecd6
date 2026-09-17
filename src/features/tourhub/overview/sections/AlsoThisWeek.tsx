import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHeroCarouselData, type HeroSlide } from '../../hooks/useHeroCarouselData';
import { useTourSelection } from '../../context/TourSelectionContext';
import { tournamentRoute } from '../../routes';
import { getScoreColor } from '../../_shared/scoreColor';
import { fmtScore } from '../../components/overview-v3/HybridHero.utils';
import { FONT, INK, INK_MUTE, SURFACE, TREND_UP, WHITE_ALPHA_06 } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';

const SHORT_TOUR_LABELS: Record<string, string> = {
  pga: 'PGA', euro: 'DP WORLD', lpga: 'LPGA', pgad: 'KORN FERRY', champ: 'CHAMPIONS', liv: 'LIV',
};

export function statusFor(slide: HeroSlide, now = new Date()): string {
  if (slide.type === 'live') return `Live${slide.tournament.currentRound ? ` · Round ${slide.tournament.currentRound}` : ''}`;
  if (slide.type === 'completed') return 'Final';
  const start = new Date(slide.tournament.startDate);
  if (Number.isNaN(start.getTime())) return '';
  const hoursAway = (start.getTime() - now.getTime()) / 3_600_000;
  const format = hoursAway > 24
    ? new Intl.DateTimeFormat('en', { weekday: 'long' })
    : new Intl.DateTimeFormat('en', { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false });
  return `Starts ${format.format(start)}`;
}

export function isAlsoThisWeek(slide: HeroSlide, now = new Date()): boolean {
  if (slide.type === 'live') return true;
  if (slide.type !== 'upcoming') return false;
  const start = new Date(slide.tournament.startDate);
  if (Number.isNaN(start.getTime()) || start.getTime() < now.getTime()) return false;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  sunday.setHours(23, 59, 59, 999);
  return start.getTime() <= sunday.getTime();
}

function OtherTournamentRow({ slide, last }: { slide: HeroSlide; last: boolean }) {
  const navigate = useNavigate();
  const score = slide.tournament.leaderScore;
  const name = slide.type === 'completed'
    ? slide.tournament.winnerName
    : slide.tournament.leaderName?.trim().split(/\s+/).slice(-1)[0] ?? null;
  const target = tournamentRoute(slide.tournament.id, { kind: 'overview' });
  const status = statusFor(slide);
  const tourLabel = SHORT_TOUR_LABELS[slide.tournament.tourSlug] ?? slide.tournament.tourName.replace(/\s+TOUR$/i, '');
  return (
    <button type="button" onClick={() => navigate(target.to, { state: target.state })} style={{ width: '100%', minHeight: 58, padding: '10px 14px', display: 'grid', gridTemplateColumns: '62px minmax(0,1fr) auto', alignItems: 'center', columnGap: 12, border: 0, borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', color: INK, textAlign: 'left', fontFamily: FONT, cursor: 'pointer' }}>
      <span style={{ display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, fontSize: 9.5, lineHeight: 1.15, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_MUTE }}>{tourLabel}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{slide.tournament.name}</span>
        {status ? <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: slide.type === 'live' ? TREND_UP : INK_MUTE }}>{status}</span> : null}
      </span>
      {score != null && name ? <span style={{ minWidth: 48, textAlign: 'right' }}><span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: getScoreColor(score, 'dark'), fontVariantNumeric: 'tabular-nums' }}>{fmtScore(score)}</span><span style={{ display: 'block', marginTop: 2, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: INK_MUTE }}>{name}</span></span> : null}
    </button>
  );
}

export function AlsoThisWeek() {
  const { t } = useTranslation('tourhub');
  const { data: slides = [] } = useHeroCarouselData();
  const { viewingTournamentId } = useTourSelection();
  const others = useMemo(
    () => slides.filter((slide) => slide.tournament.id !== viewingTournamentId && isAlsoThisWeek(slide)).slice(0, 4),
    [slides, viewingTournamentId],
  );
  if (others.length === 0) return null;
  return <section><OverviewSectionHead title={t('overview.alsoThisWeek.title')} /><div style={{ margin: '0 10px', overflow: 'hidden', borderRadius: 16, background: SURFACE }}>{others.map((slide, index) => <OtherTournamentRow key={slide.tournament.id} slide={slide} last={index === others.length - 1} />)}</div></section>;
}