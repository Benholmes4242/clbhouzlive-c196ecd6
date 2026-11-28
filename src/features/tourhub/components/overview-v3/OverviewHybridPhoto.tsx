/** Overview-only hero adapters. All lifecycle/round decisions are passed from
 * the canonical controller; skins reads never mount for a standard event. */
import type { HeroTournament } from '../../hooks/useHeroCarouselData';
import { useTranslation } from 'react-i18next';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { todayFromEntry } from '../../leaderboard/BoardTable';
import { resolveBoardEntity, resolveChampionEntry } from '../../_shared/boardEntity';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { fullTourLabel } from '../../_shared/tourOrder';
import { surnameOf } from '../../_shared/playerName';
import { fmtScore } from '../../utils/fmtScore';
import { skinsLeaders, skinsLeadLine, type SkinsResult } from '../../skins/skinsRules';
import { venueTee } from './upcomingOverviewRules';
import { initialSurname, type OverviewRoundStateResult } from './liveStateRules';
import { heroStateLine } from './HybridHeroBands/heroStateLine';
import type { HeroState } from './HybridHero.utils';
import type { OverviewCountdownUnit } from './HybridHeroBands/PhotoBand';
import { HybridGlassCard, HybridPhotoFrame, type HybridCardData } from './HybridPhotoFrame';
import { hybridFinalWeekday } from './hybridOverviewRules';

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const marginWord = (n: number) => n >= 1 && n <= 9 ? WORDS[n] : String(n);
function facesFor(entry: BoardEntry, tour: string) {
  const people = entry.team ? (entry.team.members ?? []).map(m => m.player).filter(p => p != null) : entry.player ? [entry.player] : [];
  return people.map((p, i) => ({ key: p.id ?? `${entry.id}-${i}`, name: p.full_name ?? '', candidates: resolvePlayerAvatarCandidates({ name: p.full_name, photoUrl: p.photo_url, tourSlug: tour }) }));
}
export function overviewStrokeCard(tm: HeroTournament, rows: BoardEntry[], completed: boolean, round: number): HybridCardData | null {
  const top = rows.find(e => e.score != null && e.position === 1) ?? rows.find(e => e.score != null);
  if (!top || top.score == null) return null;
  const winner = completed ? resolveChampionEntry(rows, { winner_id: tm.winnerId, event_type: tm.eventType }) : null;
  const entry = winner ?? top;
  const tied = rows.filter(e => e.position === 1 && e.score === top.score);
  const team = !!entry.team;
  const name = team ? resolveBoardEntity(entry, false, 'surname').lines.join(' / ') : initialSurname(entry.player?.full_name);
  if (completed && !winner) return { label: 'FINAL', name: `${tied.length || 1} tied`, figure: fmtScore(top.score), under: top.score < 0 };
  if (!completed && tied.length > 1) return { label: 'LEADERS', name: `${tied.length} tied`, sub: tied.map(e => surnameOf(e.player?.full_name ?? resolveBoardEntity(e, false).prose)).join(' · '), faces: tied.flatMap(e => facesFor(e, tm.tourSlug)).slice(0, 3), figure: fmtScore(top.score), under: top.score < 0 };
  const runners = rows.filter(e => e.id !== entry.id && e.score != null).map(e => e.score as number);
  const margin = runners.length && entry.score != null ? Math.min(...runners) - entry.score : null;
  const today = todayFromEntry(entry, round);
  const gross = today != null && tm.venuePar != null ? today + tm.venuePar : null;
  const day = hybridFinalWeekday(tm.endDate);
  const sub = completed
    ? margin === 0 ? 'Won in a playoff' : [margin != null ? `Won by ${team ? margin : marginWord(margin)}` : null, !team && gross != null && day ? `${gross} on ${day}` : null].filter(Boolean).join(' · ')
    : margin === 0 ? 'Tied for the lead' : [!team ? (entry.thru ?? 0) >= 18 && gross != null ? `${gross} today` : (entry.thru ?? 0) > 0 ? `Thru ${entry.thru}` : null : null, margin != null ? `${team ? 'Lead' : 'Leads'} by ${margin}` : null].filter(Boolean).join(' · ');
  return { label: completed ? 'CHAMPION' : team ? 'LEADERS' : 'LEADER', name, sub, figure: entry.score != null ? fmtScore(entry.score) : null, under: entry.score != null && entry.score < 0, champion: completed, faces: facesFor(entry, tm.tourSlug) };
}
export function overviewSkinsCard(result: SkinsResult, rows: BoardEntry[], tour: string, completed: boolean, championId: string | null): HybridCardData {
  const leaders = skinsLeaders(result);
  const winnerEntry = completed ? rows.find(e => e.player?.sr_id === championId || e.player?.id === championId) : null;
  const winner = winnerEntry?.player ? result.players.find(p => p.id === winnerEntry.player?.id) : null;
  const top = winner ?? leaders[0];
  const tied = !winner && leaders.length > 1;
  const name = tied ? completed ? `${leaders.map(p => p.surname).join(' and ')} shared the most` : leaders.length === 2 ? leaders.map(p => p.surname).join(' and ') : `${leaders.length} players` : top?.name ?? 'Every hole has carried so far';
  const entry = winnerEntry ?? rows.find(e => e.player?.id === top?.id);
  const next = skinsLeadLine(result).split(/(?<=\.)\s+/).slice(1).join(' ');
  const other = result.players.filter(p => p.id !== top?.id);
  const margin = top ? top.skins - Math.max(0, ...other.map(p => p.skins)) : null;
  const sub = completed ? result.playoff && winner ? `Took the last ${result.playoff.pot} in a playoff` : margin != null && !tied ? `Won by ${margin} ${margin === 1 ? 'skin' : 'skins'}` : null : next || 'Every hole has carried so far.';
  return { label: completed ? winner ? 'CHAMPION' : 'FINAL' : tied ? 'SKINS LEADERS' : 'SKINS LEADER', name, sub, figure: top?.skins ?? 0, unit: 'SKINS', champion: !!winner, faces: !tied && entry ? facesFor(entry, tour) : [] };
}
export function CupGlassCard({ rows, countdown }: { rows: BoardEntry[]; countdown?: OverviewCountdownUnit }) {
  const pair = rows.slice(0, 2); const a = pair[0]?.score; const b = pair[1]?.score;
  const share = a != null && b != null && a + b > 0 ? a / (a + b) : 0;
  const points = (n: number | null | undefined) => n == null ? '–' : Number.isInteger(n) ? String(n) : n % 1 === .5 ? `${Math.floor(n)}½` : String(n);
  return <div className="ov48-glass ov48-cup" data-overview-glass-card data-overview-cup><div><div className="ov48-glass-label">{pair[0]?.team?.display_name ?? pair[0]?.team?.abbr_name ?? ''}</div><b className="ov48-glass-figure">{countdown ? '–' : points(a)}</b></div><div className="ov48-cup-mid"><div className="ov48-cup-bar"><i style={{ width: `${share * 100}%` }} /></div><small>{countdown ? `STARTS IN ${countdown.value} ${countdown.label === 'days' ? countdown.value === 1 ? 'DAY' : 'DAYS' : countdown.label.toUpperCase()}` : 'MATCH POINTS'}</small></div><div><div className="ov48-glass-label">{pair[1]?.team?.display_name ?? pair[1]?.team?.abbr_name ?? ''}</div><b className="ov48-glass-figure">{countdown ? '–' : points(b)}</b></div></div>;
}
export function OverviewHybridPhoto({ tournament: tm, state, rows, image, dates, startDay, roundState, first, zone, fieldSize, countdown, skins, onOpen }: { tournament: HeroTournament; state: HeroState; rows: BoardEntry[]; image: string | null; dates: string | null; startDay: string | null; roundState: OverviewRoundStateResult | null; first: string | null; zone: string | null; fieldSize: number; countdown: OverviewCountdownUnit[]; skins?: SkinsResult | null; onOpen: () => void }) {
  const { t } = useTranslation('tourhub');
  const upcoming = state.kind === 'upcoming'; const completed = state.kind === 'results';
  const highestRound = Math.max(1, ...rows.flatMap(e => [e.round_1, e.round_2, e.round_3, e.round_4].map((v, i) => v != null ? i + 1 : 0)));
  const round = roundState?.round ?? (state.kind === 'live' || state.kind === 'suspended' ? state.round : highestRound);
  const tee = venueTee(first ?? roundState?.firstTeeTime ?? null, zone);
  const tState = heroStateLine(t, { kind: state.kind, round, totalRounds: state.kind === 'live' || state.kind === 'suspended' ? state.totalRounds : undefined, afterRound: roundState?.afterRound, delayedRound: roundState?.delayedRound, startDay });
  // State copy is supplied by the existing hero-state helper below, except
  // the newly specified first-tee/card and skins state variants.
  const status = completed ? 'FINAL' : upcoming ? tState : skins ? `SKINS GAME · ${state.kind === 'suspended' ? 'SUSPENDED' : 'LIVE'}` : roundState?.notStarted ? `ROUND ${round} · STARTS ${tee?.time ?? ''}` : roundState?.afterRound != null ? `ROUND ${roundState.afterRound} COMPLETE` : state.kind === 'suspended' || roundState?.delayedRound != null ? tState : `${tState} · LIVE`;
  const tone = state.kind === 'suspended' ? 'suspended' : !upcoming && !completed && !roundState?.notStarted && roundState?.afterRound == null && roundState?.delayedRound == null ? 'live' : 'dim';
  let card: HybridCardData | null = skins ? overviewSkinsCard(skins, rows, tm.tourSlug, completed, tm.winnerId ?? null) : overviewStrokeCard(tm, rows, completed, round);
  if (upcoming) {
    const date = Number.isFinite(Date.parse(tm.startDate)) ? new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(tm.startDate)) : '';
    const unit = countdown[0];
    card = { label: 'STARTS IN', name: date, sub: [tee ? `First tee ${tee.time}` : null, fieldSize > 0 ? `${fieldSize} players` : null].filter(Boolean).join(' · '), figure: unit?.value, unit: unit ? `${unit.label.slice(0, -1)}${unit.value === 1 ? '' : 's'}`.toUpperCase() : null };
  } else if (roundState?.notStarted) card = { label: 'FIRST TEE', name: tee ? `${tee.day} ${tee.time}` : '', sub: fieldSize > 0 ? `${fieldSize} players` : null, figure: round, unit: 'ROUND' };
  const content = tm.eventType === 'match' ? null : tm.eventType === 'cup' ? rows.length >= 2 ? <CupGlassCard rows={rows} countdown={upcoming ? countdown[0] : undefined} /> : null : card ? <HybridGlassCard card={card} /> : null;
  return <HybridPhotoFrame title={tm.name} kicker={`${fullTourLabel(tm.tourSlug, tm.tourName)} · ${status}`} tone={tone} venue={[tm.venueName, tm.venueCity ?? tm.venueCountry, dates].filter(Boolean).join(' · ')} image={image} card={content} onOpen={onOpen} stateKey={state.kind} />;
}