/**
 * HybridRecapNext — the two-state hero's non-live card (Option A).
 *
 * Leads with the tour's NEXT upcoming event (headline, venue·dates, defending
 * champ, countdown) over a real course-image background, then a white "RESULTS"
 * recap card for the most recent completed event: winner row + 2nd/3rd, and a
 * "View full leaderboard" link to that tournament.
 *
 * Image: mirrors the live HybridHero — resolves the real venue photo via
 * useBatchCourseImages keyed on venueName (NOT the id-rotation in
 * getCourseImage, which is only a last-resort fallback when no venue matches).
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import type { HeroTournament } from '../../hooks/useHeroCarouselData';
import type { TournamentLeaderWinner, TournamentFinisher } from '../../hooks/useTournamentLeadersWinners';
import type { TourTournament } from '../../hooks/useTourHubData';
import { PlayerAvatar, UpcomingCountdown } from '../shared/TourHeroHelpers';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { getCourseImage } from '../../utils/placeholders';
import { tournamentRoute } from '../../routes';
import { AMBER_INK_DARK, RECAP_VICTORY_GREEN, LEADER_GOLD, INK } from '../../_shared/tokens';


function fmtDates(start?: string, end?: string): string {
  if (!start) return '';
  try {
    const s = new Date(start);
    const e = end ? new Date(end) : null;
    if (e && s.getMonth() === e.getMonth()) return `${format(s, 'MMM d')} \u2013 ${format(e, 'd')}`;
    if (e) return `${format(s, 'MMM d')} \u2013 ${format(e, 'MMM d')}`;
    return format(s, 'MMM d');
  } catch {
    return '';
  }
}

function posLabel(f: TournamentFinisher): string {
  return `${f.position}`;
}

interface HybridRecapNextProps {
  tourName: string;
  completed?: HeroTournament;
  upcoming?: HeroTournament;
  completedLeaders?: TournamentLeaderWinner;
  height?: number;
}

export function HybridRecapNext({
  tourName,
  completed,
  upcoming,
  completedLeaders,
  height = 528,
}: HybridRecapNextProps) {
  const navigate = useNavigate();

  const venueAdapter: TourTournament[] = useMemo(() => {
    const names = [upcoming?.venueName, completed?.venueName].filter(Boolean) as string[];
    return names.map((venue_name) => ({ venue_name } as unknown as TourTournament));
  }, [upcoming?.venueName, completed?.venueName]);

  const { data: imageMap } = useBatchCourseImages(venueAdapter);

  const resolvedVenueImage =
    (upcoming?.venueName ? imageMap?.get(upcoming.venueName) : null) ??
    (completed?.venueName ? imageMap?.get(completed.venueName) : null) ??
    null;

  const bgSource = upcoming ?? completed;
  const imageUrl = resolvedVenueImage ?? getCourseImage({ id: bgSource?.id });

  const goToUpcoming = () => {
    if (upcoming) {
      const t = tournamentRoute(upcoming.id, { kind: 'overview' });
      navigate(t.to, { state: t.state });
    }
  };

  const goToLeaderboard = () => {
    if (completed) {
      const t = tournamentRoute(completed.id, { kind: 'overview' });
      navigate(t.to, { state: t.state });
    }
  };

  const top3: TournamentFinisher[] = completedLeaders?.topFinishers?.slice(0, 3) ?? [];
  const winner = top3[0];
  const runners = top3.slice(1);

  return (
    <div style={{ height, position: 'relative', width: '100%', overflow: 'hidden', background: '#1f2a14' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.30) 45%, rgba(0,0,0,0.82) 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(247,147,30,0.16)', border: '1px solid rgba(247,147,30,0.5)', padding: '6px 11px', borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#FBBC2E', textTransform: 'uppercase' }}>
            Upcoming
            {upcoming?.startDate ? <UpcomingCountdown startDate={upcoming.startDate} /> : null}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)' }}>{tourName}</span>
        </div>

        {upcoming && (
          <button type="button" onClick={goToUpcoming} style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '0 16px', cursor: 'pointer' }}>
            <div style={{ fontSize: 34, lineHeight: 0.98, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {upcoming.name}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {[upcoming.venueName, upcoming.venueCity].filter(Boolean).join(' \u00b7 ')}
              {upcoming.startDate ? `  \u00b7  ${fmtDates(upcoming.startDate, upcoming.endDate)}` : ''}
            </div>
            {upcoming.defendingChampion && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Defending champion · {upcoming.defendingChampion}
              </div>
            )}
          </button>
        )}

        {completed && winner && (
          <div style={{ margin: '14px 12px 12px', background: 'rgba(255,255,255,0.97)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px 8px' }}>
              <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(15,23,42,0.5)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Results · {completed.name}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(15,23,42,0.4)', flexShrink: 0, marginLeft: 8 }}>FINAL</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 13px 8px' }}>
              <div style={{ boxShadow: '0 0 0 1.5px #F7931E', borderRadius: '34%', flexShrink: 0 }}>
                <PlayerAvatar photoUrl={winner.photoUrl} pgaTourId={winner.pgaTourId} displayName={winner.displayName} fullName={winner.fullName} headshotOverride={winner.headshotOverride} tourCode={winner.tourCode ?? undefined} size={36} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER_DARK }}>Winner</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{winner.displayName}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: GREEN, flexShrink: 0 }}>{winner.displayScore}</div>
            </div>
            {runners.length > 0 && (
              <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.08)' }}>
                {runners.map((f) => (
                  <div key={f.playerId ?? f.displayName} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 13px' }}>
                    <span style={{ width: 18, fontSize: 11, fontWeight: 600, color: 'rgba(15,23,42,0.45)', textAlign: 'center', flexShrink: 0 }}>{posLabel(f)}</span>
                    <PlayerAvatar photoUrl={f.photoUrl} pgaTourId={f.pgaTourId} displayName={f.displayName} fullName={f.fullName} headshotOverride={f.headshotOverride} tourCode={f.tourCode ?? undefined} size={24} />
                    <span style={{ flex: 1, fontSize: 13, color: '#0F172A', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.displayName}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: GREEN, flexShrink: 0 }}>{f.displayScore}</span>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={goToLeaderboard} style={{ width: '100%', border: 'none', borderTop: '0.5px solid rgba(15,23,42,0.08)', background: 'transparent', padding: '10px 13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: AMBER_DARK }}>View full leaderboard</span>
              <ArrowRight size={14} color={AMBER_DARK} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HybridRecapNext;
