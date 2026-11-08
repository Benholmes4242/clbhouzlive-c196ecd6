/** Upcoming overview uses published R1 draw membership, then the canonical
 * pick field before the draw. IDs are authoritative; name matching is only
 * the fallback when the historical winner has no id. No draw invents times. */
import type { LastYearFinisher } from '../../hooks/useTournamentLastYearTop4';
import type { HeadlineSegment } from '../../overview/magazineCopy';
import en from '../../../../../public/locales/en/tourhub.json';
import { surnameOf } from '../../_shared/playerName';

export interface UpcomingPlayer { id: string; name: string; worldRank?: number | null; teeTime?: string | null }
export const normalizedPlayerName = (name: string) => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function winnerInField(winner: LastYearFinisher & { playerId?: string | null }, field: UpcomingPlayer[]) {
  return field.some(player => winner.playerId ? player.id === winner.playerId : normalizedPlayerName(player.name) === normalizedPlayerName(winner.name));
}
export function venueTee(at: string | null | undefined, zone: string | null | undefined) {
  if (!at || !zone || !Number.isFinite(Date.parse(at))) return null;
  try {
    const date = new Date(at);
    return { day: new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: zone }).format(date), time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zone }).format(date) };
  } catch { return null; }
}
function marginWords(n: number): string {
  const ones = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  if (n < 20) return ones[n] ?? '';
  if (n < 100) return `${['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'][Math.floor(n / 10)]}${n % 10 ? `-${ones[n % 10]}` : ''}`;
  return `${marginWords(Math.floor(n / 100))} hundred${n % 100 ? ` and ${marginWords(n % 100)}` : ''}`;
}
const numericScore = (value: string) => value.trim() === 'E' ? 0 : Number(value.replace('−', '-'));
export function upcomingSentence(last: LastYearFinisher[], field: UpcomingPlayer[], first: string | null, zone: string | null): HeadlineSegment[] {
  const winner = last.find(row => row.rank === '1') ?? last.find(row => row.rank === 'T1');
  const runner = winner ? last.find(row => row !== winner) : undefined;
  const margin = winner && runner ? numericScore(runner.score) - numericScore(winner.score) : NaN;
  let template: string | undefined;
  let values: Record<string, string> = {};
  if (winner && runner && Number.isFinite(margin) && margin >= 0 && winner.name && winner.name !== '—') {
    const defending = winnerInField(winner, field);
    template = en.overview.upcomingPlus[margin === 0 ? defending ? 'defendsPlayoff' : 'wonPlayoff' : defending ? 'defends' : 'won'];
    values = { name: surnameOf(winner.name), margin: marginWords(margin), score: winner.score };
  } else {
    const tee = venueTee(first, zone);
    if (tee) { template = en.overview.upcomingPlus.firstTeeSentence; values = tee; }
  }
  if (!template) return [];
  const resolved = Object.entries(values).reduce((text, [key, value]) => text.split(`{{${key}}}`).join(value), template);
  return resolved.split(/(<b>.*?<\/b>)/g).filter(Boolean).map(text => ({ text: text.replace(/<\/?b>/g, ''), figure: text.startsWith('<b>') }));
}
export function followedUpcomingPlayers(member: boolean, followed: Set<string>, field: UpcomingPlayer[], drawn: boolean) {
  if (!member) return [];
  return field.filter(player => followed.has(player.id)).sort((a, b) => {
    if (drawn) { const time = (a.teeTime ? Date.parse(a.teeTime) : Infinity) - (b.teeTime ? Date.parse(b.teeTime) : Infinity); if (time) return time; }
    return (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity) || a.name.localeCompare(b.name);
  });
}