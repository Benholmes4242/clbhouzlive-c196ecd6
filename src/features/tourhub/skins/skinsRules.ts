/**
 * Brief 47 — skins games. Detection, the skins rule and every skins sentence
 * live here, so the tournament page, the overview hero/board and Also this
 * week cannot disagree. The provider labels a skins game as stroke play with
 * no skins or money, so skins are worked out from sr_scorecards strokes.
 * No dollar values anywhere: the feed has none.
 */
import { surnameOf } from '../_shared/playerName';

/** A tournament is a skins game when its name contains the word "skins". */
export function isSkinsGame(name: string | null | undefined): boolean {
  return /\bskins\b/i.test(name ?? '');
}

export interface SkinsHoleInput { hole_number: number; strokes: number | null; par?: number | null }
export interface SkinsPlayerInput { id: string; name: string; holes: SkinsHoleInput[] }

export interface SkinsHole {
  hole: number;
  par: number | null;
  /** Every player in the field has strokes for it. */
  played: boolean;
  /** Sole lowest score on a played hole; null when tied or unplayed. */
  winner: string | null;
  /** Skins this hole paid (winner) or was worth when it carried. */
  pot: number;
  state: 'won' | 'carried' | 'next' | 'later';
}
export interface SkinsPlayer { id: string; name: string; surname: string; skins: number; holesWon: number[]; strokes: Map<number, number> }
export interface SkinsResult {
  holes: SkinsHole[];
  players: SkinsPlayer[];
  carrying: number;
  nextHole: number | null;
  nextWorth: number | null;
  holesTied: number;
  totalHoles: number;
  played: number;
  finished: boolean;
  skinsWon: number;
}

/** Skins table order: skins desc, then surname. */
export function sortSkinsPlayers(players: SkinsPlayer[]): SkinsPlayer[] {
  return [...players].sort((a, b) => b.skins - a.skins || a.surname.localeCompare(b.surname));
}

export function skinsFromScorecards(field: SkinsPlayerInput[]): SkinsResult {
  const players: SkinsPlayer[] = field.map((p) => {
    const strokes = new Map<number, number>();
    for (const h of p.holes) if (h.strokes != null && Number.isFinite(h.strokes)) strokes.set(h.hole_number, h.strokes);
    return { id: p.id, name: p.name, surname: surnameOf(p.name) || p.name, skins: 0, holesWon: [], strokes };
  });
  const pars = new Map<number, number>();
  let maxHole = 0;
  for (const p of field) for (const h of p.holes) {
    maxHole = Math.max(maxHole, h.hole_number);
    if (h.par != null && !pars.has(h.hole_number)) pars.set(h.hole_number, h.par);
  }
  const totalHoles = maxHole > 0 ? maxHole : 18;
  const holes: SkinsHole[] = [];
  let pot = 0;
  let open = true; // holes count in order; the first unplayed hole stops the run
  let played = 0;
  let holesTied = 0;
  let nextHole: number | null = null;
  for (let hole = 1; hole <= totalHoles; hole++) {
    const isPlayed = open && players.length > 0 && players.every((p) => p.strokes.has(hole));
    if (!isPlayed) {
      if (open) { open = false; nextHole = hole; holes.push({ hole, par: pars.get(hole) ?? null, played: false, winner: null, pot: pot + 1, state: 'next' }); }
      else holes.push({ hole, par: pars.get(hole) ?? null, played: false, winner: null, pot: 0, state: 'later' });
      continue;
    }
    played++;
    pot += 1;
    const low = Math.min(...players.map((p) => p.strokes.get(hole)!));
    const best = players.filter((p) => p.strokes.get(hole) === low);
    if (best.length === 1) {
      best[0].skins += pot;
      best[0].holesWon.push(hole);
      holes.push({ hole, par: pars.get(hole) ?? null, played: true, winner: best[0].id, pot, state: 'won' });
      pot = 0;
    } else {
      holesTied++;
      holes.push({ hole, par: pars.get(hole) ?? null, played: true, winner: null, pot, state: 'carried' });
    }
  }
  const finished = played === totalHoles;
  return {
    holes, players: sortSkinsPlayers(players), carrying: pot,
    nextHole: finished ? null : nextHole, nextWorth: finished ? null : pot + 1,
    holesTied, totalHoles, played, finished,
    skinsWon: players.reduce((n, p) => n + p.skins, 0),
  };
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
/** One to nine in words, numerals from 10. */
export function skinsWord(n: number): string { return n >= 0 && n <= 9 ? WORDS[n] : String(n); }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export function skinsOrdinal(n: number): string {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}
const skinsN = (n: number) => `${n} ${n === 1 ? 'skin' : 'skins'}`;
const skinsW = (n: number) => `${skinsWord(n)} ${n === 1 ? 'skin' : 'skins'}`;

/** Leaders: everyone on the top skins count, when it is above zero. */
export function skinsLeaders(r: SkinsResult): SkinsPlayer[] {
  const top = r.players[0]?.skins ?? 0;
  return top > 0 ? r.players.filter((p) => p.skins === top) : [];
}
const names = (ps: SkinsPlayer[]) => ps.length === 2 ? `${ps[0].surname} and ${ps[1].surname}` : `${cap(skinsWord(ps.length))} players`;

/** Hero lead line. */
export function skinsLeadLine(r: SkinsResult): string {
  const leaders = skinsLeaders(r);
  if (leaders.length === 0) return 'Every hole has carried so far.';
  const n = leaders[0].skins;
  if (r.finished) {
    const head = leaders.length === 1 ? `${leaders[0].surname} won with ${skinsN(n)}.` : `${names(leaders)} finished level on ${skinsN(n)}.`;
    const tail = r.carrying > 0 ? ` ${cap(skinsWord(r.carrying))} ${r.carrying === 1 ? 'skin was' : 'skins were'} left unclaimed.` : '';
    return head + tail;
  }
  const head = leaders.length === 1 ? `${leaders[0].surname} leads with ${skinsN(n)}.` : `${names(leaders)} lead with ${skinsN(n)}.`;
  if (r.nextHole == null) return head;
  const tail = r.carrying > 0
    ? ` ${cap(skinsWord(r.carrying))} ${r.carrying === 1 ? 'skin carries' : 'skins carry'} to the ${skinsOrdinal(r.nextHole)}, worth ${r.nextWorth}.`
    : ` The ${skinsOrdinal(r.nextHole)} is worth one skin.`;
  return head + tail;
}

/** "The skins" title. */
export function skinsTableTitle(r: SkinsResult): string {
  const leaders = skinsLeaders(r);
  if (leaders.length === 0) return 'Every hole has carried so far';
  const n = leaders[0].skins;
  if (leaders.length > 1) return `${names(leaders)} level on ${skinsW(n)}`;
  const margin = n - (r.players[1]?.skins ?? 0);
  return r.finished ? `${leaders[0].surname} won by ${skinsW(margin)}` : `${leaders[0].surname} leads by ${skinsW(margin)}`;
}

/** "Hole by hole" title: the biggest pot won so far, the latest on a tie. */
export function skinsHoleTitle(r: SkinsResult): string {
  let best: SkinsHole | null = null;
  for (const h of r.holes) if (h.state === 'won' && (!best || h.pot >= best.pot)) best = h;
  if (!best) return 'Every hole has carried so far';
  const who = r.players.find((p) => p.id === best!.winner)?.surname ?? '';
  return `${who}'s ${skinsOrdinal(best.hole)} was worth ${skinsW(best.pot)}`;
}

/** Hero right-hand block: skins count and caps line; tied leaders show no face. */
export function skinsHeroFigure(r: SkinsResult): { count: number; caps: string; leaderId: string | null } {
  const leaders = skinsLeaders(r);
  if (leaders.length === 1) return { count: leaders[0].skins, caps: `SKINS · ${leaders[0].surname.toUpperCase()}`, leaderId: leaders[0].id };
  return { count: leaders[0]?.skins ?? 0, caps: 'SKINS · TIED', leaderId: null };
}

/** Progress under the hero. */
export function skinsProgress(r: SkinsResult): { fraction: number; left: string; right: string } {
  return {
    fraction: r.totalHoles > 0 ? r.played / r.totalHoles : 0,
    left: r.finished || r.nextHole == null ? 'Final' : `Hole ${r.nextHole} of ${r.totalHoles}`,
    right: `${r.players.length} ${r.players.length === 1 ? 'player' : 'players'} · One round`,
  };
}

/** Position shown once per tie group: 1 + players with more skins. */
export function skinsPositions(players: SkinsPlayer[]): Array<number | null> {
  return players.map((p, i) => (i > 0 && players[i - 1].skins === p.skins ? null : players.filter((q) => q.skins > p.skins).length + 1));
}
