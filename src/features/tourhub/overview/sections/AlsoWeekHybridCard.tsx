/** Brief 48: overview event rail. Board/draw membership and skins-only reads
 * remain in their existing owners; event cards never expand scorecards. */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { fullTourLabel } from '../../_shared/tourOrder';
import { surnameOf } from '../../_shared/playerName';
import { fmtScore } from '../../utils/fmtScore';
import { tournamentRoute } from '../../routes';
import { isSkinsGame } from '../../skins/skinsRules';
import { useSkinsGame } from '../../skins/useSkinsGame';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { effectiveCurrentRound } from '../../components/overview-v3/liveStateRules';

interface Props { slide: HeroSlide; entries: BoardEntry[]; now: Date }
interface LeaderRow { name: string; figure: string; under?: boolean }
function EventCard({ slide, now, leaders }: { slide: HeroSlide; now: Date; leaders: LeaderRow[] }) {
  const navigate = useNavigate(); const tm = slide.tournament; const upcoming = slide.type === 'upcoming';
  const photos = useBatchCourseImages(upcoming ? [{ id: tm.id, venue_name: tm.venueName, venue_course_name: tm.venueCourseName, venue_city: tm.venueCity, venue_state: tm.venueState, venue_country: tm.venueCountry }] : []);
  const days = Math.max(0, Math.floor((Date.parse(tm.startDate) - now.getTime()) / 86_400_000));
  const state = slide.type === 'completed' ? 'FINAL' : upcoming ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(new Date(tm.startDate)).toUpperCase() : tm.currentRound != null ? `ROUND ${tm.currentRound}` : 'LIVE';
  const target = tournamentRoute(tm.id, { kind: 'overview' }); const image = photos.data?.get(tm.id);
  return <Button variant={null} size={null} className="ov48-also-card" data-also-event onClick={() => navigate(target.to, { state: target.state })}>
    {upcoming && image ? <img className="ov48-also-photo" src={image} alt="" /> : null}
    <div className="ov48-also-content"><div className="ov48-also-kicker">{fullTourLabel(tm.tourSlug, tm.tourName)} · {state}</div><b className="ov48-also-name">{tm.name}</b>{upcoming ? <div className="ov48-also-score"><span>Starts in</span><b>{days} {days === 1 ? 'day' : 'days'}</b></div> : leaders.map((r, i) => <div key={i} className={i === 0 ? 'ov48-also-score' : 'ov48-also-score ov48-also-second'}><span>{r.name}</span><b className={r.under ? 'ov48-under' : undefined}>{r.figure}</b></div>)}</div>
  </Button>;
}
export function AlsoWeekHybridCard(props: Props) {
  if (props.slide.type !== 'upcoming' && isSkinsGame(props.slide.tournament.name)) return <SkinsEventCard {...props} />;
  const ranked = props.entries.filter(e => e.position != null && e.score != null).sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
  const positions = [...new Set(ranked.map(e => e.position))].slice(0, 2);
  const leaders = positions.map(pos => { const group = ranked.filter(e => e.position === pos); const row = group[0]; return { name: group.length > 1 ? `${group.length} tied` : surnameOf(row?.player?.full_name ?? row?.team?.abbr_name ?? ''), figure: row?.score != null ? fmtScore(row.score) : '', under: row?.score != null && row.score < 0 }; });
  if (!leaders.length && props.slide.tournament.leaderName && props.slide.tournament.leaderScore != null) leaders.push({ name: surnameOf(props.slide.tournament.leaderName), figure: fmtScore(props.slide.tournament.leaderScore), under: props.slide.tournament.leaderScore < 0 });
  const slide = props.slide.type === 'live' ? { ...props.slide, tournament: { ...props.slide.tournament, currentRound: effectiveCurrentRound(props.slide.tournament.currentRound, props.entries) } } : props.slide;
  return <EventCard slide={slide} now={props.now} leaders={leaders} />;
}
function SkinsEventCard({ slide, entries, now }: Props) {
  const skins = useSkinsGame(slide.tournament.id, entries, true, 0, { finished: slide.type === 'completed', championId: slide.tournament.winnerId ?? null });
  const rows = skins.result?.players ?? []; const scores = [...new Set(rows.map(p => p.skins))].slice(0, 2);
  const leaders = scores.map((n, i) => { const group = rows.filter(p => p.skins === n); return { name: group.length > 1 ? `${group.length} tied` : group[0]?.surname ?? '', figure: i === 0 ? `${n} skins` : String(n) }; });
  return <EventCard slide={slide} now={now} leaders={leaders} />;
}