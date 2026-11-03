/** One event stat order and active-only comparisons apply on every picker
 * surface. Numeric model claims must be checked here, never inferred in JSX. */
import type { FitStat, BeatRow, PickRecord } from '../../../hooks/usePickInsights';
import { surnameOf } from '../../../_shared/playerName';
export const FIT_STATS = ['driving_distance', 'driving_accuracy', 'greens_in_reg', 'strokes_gained_tee_green', 'strokes_gained_putting', 'scoring_average'] as const;
export type FitKey = typeof FIT_STATS[number];
export const statLabel: Record<FitKey, string> = { driving_distance: 'Driving distance', driving_accuracy: 'Fairways hit', greens_in_reg: 'Greens hit', strokes_gained_tee_green: 'Tee to green', strokes_gained_putting: 'Putting', scoring_average: 'Scoring average' };
export interface PickResult { playerId: string; playerName: string; position: number | null; tied?: boolean; score?: number | null; status?: string | null; percentile?: number | null }
export const outStatus = (s?: string | null) => ['CUT', 'MC', 'WD', 'DQ', 'DNS', 'MDF'].includes(s?.toUpperCase() ?? '');
export const resultPosition = (p: PickResult) => outStatus(p.status) ? (p.status?.toUpperCase() === 'CUT' ? 'MC' : p.status?.toUpperCase() ?? '') : p.position == null ? '' : `${p.tied ? 'T' : ''}${p.position}`;
export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
export const wordNumber = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);
export const rankWord = (n: number) => ['','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'][n] ?? ordinal(n);
export const pronouns = (tour: string) => tour.toLowerCase() === 'lpga' ? { subject: 'She', object: 'her', possessive: 'Her' } : { subject: 'He', object: 'him', possessive: 'His' };
export const joinNames = (names: string[]) => names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

export function finishedVerdict(picks: PickResult[], championIds: string[]) {
  const top = picks.filter(p => !outStatus(p.status) && p.position != null && p.position <= 10).length;
  const size = wordNumber(picks.length);
  const count = top === picks.length ? (picks.length === 2 ? 'Both in the top 10.' : picks.length === 1 ? 'Our pick in the top 10.' : 'All three in the top 10.')
    : top === 0 ? `None of our ${size} in the top 10.` : `${wordNumber(top)[0].toUpperCase()}${wordNumber(top).slice(1)} of ${size} in the top 10.`;
  const winner = picks.find(p => championIds.includes(p.playerId));
  const cuts = picks.filter(p => ['CUT','MC'].includes(p.status?.toUpperCase() ?? '')).map(p => surnameOf(p.playerName));
  const wd = picks.filter(p => p.status?.toUpperCase() === 'WD').map(p => surnameOf(p.playerName));
  return { bold: winner ? `${surnameOf(winner.playerName)} won it.` : count,
    rest: [winner ? count : '', cuts.length ? `${joinNames(cuts)} missed the cut.` : '', wd.length ? `${joinNames(wd)} withdrew.` : ''].filter(Boolean).join(' ') };
}

export function compareLivePick(mine: PickResult, picks: PickResult[]) {
  if (mine.position == null || outStatus(mine.status)) return '';
  const active = picks.filter(p => p.playerId !== mine.playerId && p.position != null && !outStatus(p.status));
  if (!active.length) return '';
  const ahead = active.filter(p => Number(p.position) < Number(mine.position)).map(p => surnameOf(p.playerName));
  const behind = active.filter(p => Number(p.position) > Number(mine.position)).map(p => surnameOf(p.playerName));
  const level = active.filter(p => p.position === mine.position).map(p => surnameOf(p.playerName));
  if (active.length > 1 && behind.length === active.length) return 'Ahead of all our picks.';
  if (active.length > 1 && ahead.length === active.length) return 'Behind all our picks.';
  return [ahead.length ? `Behind ${joinNames(ahead)}${behind.length ? `, ahead of ${joinNames(behind)}` : ''}.` : behind.length ? `Ahead of ${joinNames(behind)}.` : '', level.length ? `Level with ${joinNames(level)}.` : ''].filter(Boolean).join(' ');
}
export function compareFinishedPick(mine: PickResult, picks: PickResult[]) {
  const best = picks.filter(p => !outStatus(p.status) && p.position != null).sort((a,b) => Number(a.position)-Number(b.position))[0];
  if (!best || mine.position == null || outStatus(mine.status)) return '';
  return Number(mine.position) < Number(best.position) ? 'Ahead of our best pick.' : mine.position === best.position ? 'Level with our best.' : 'Behind our best pick.';
}
export function chooseFitStats(keys: string[]): FitKey[] {
  const map: Record<string, FitKey> = { 'sg: off-the-tee':'driving_distance', 'driving distance':'driving_distance', 'driving accuracy':'driving_accuracy', 'sg: approach':'greens_in_reg', 'greens in regulation':'greens_in_reg', gir:'greens_in_reg', 'sg: tee-to-green':'strokes_gained_tee_green', 'sg: total':'strokes_gained_tee_green', 'ball striking':'strokes_gained_tee_green', 'sg: putting':'strokes_gained_putting', putting:'strokes_gained_putting', 'scoring average':'scoring_average' };
  return [...new Set([...keys.flatMap(key => map[key.toLowerCase().trim()] ? [map[key.toLowerCase().trim()]] : []), 'greens_in_reg', 'strokes_gained_tee_green', 'driving_distance'] as FitKey[])].slice(0,3);
}
export function formatFitValue(stat: string, value: number) {
  if (stat === 'driving_distance') return `${value.toFixed(1)} yds`;
  if (stat === 'driving_accuracy' || stat === 'greens_in_reg') return `${value.toFixed(1)}%`;
  if (stat === 'scoring_average') return value.toFixed(2);
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`;
}
export function filterCheckedReasons(reasons: string[], stats: FitStat[]) {
  const values = new Map(stats.map(s => [s.stat, s.value]));
  const wins = stats[0]?.wins;
  return reasons.filter(reason => {
    const text = reason.toLowerCase();
    const numbers = [...text.matchAll(/(?:[+−-]?\d+(?:\.\d+)?|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b)/g)];
    return numbers.every(match => {
      const token = match[0];
      const words = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
      const n = words.includes(token) ? words.indexOf(token) : Number(token.replace('−','-'));
      if (n >= 2000 && n <= 2099 && Number.isInteger(n)) return true;
      const tail = text.slice((match.index ?? 0) + token.length);
      const percent = /^\s*%/.test(tail);
      const checks: [boolean, string, number][] = [
        [percent && /green|\bgir\b/.test(text), 'greens_in_reg', .3],
        [percent && /fairway|accuracy/.test(text), 'driving_accuracy', .3],
        [/tee[- ]to[- ]green/.test(text), 'strokes_gained_tee_green', .05],
        [/putt/.test(text), 'strokes_gained_putting', .05],
        [!percent && /yard|\byds\b|drive|driving/.test(text), 'driving_distance', 1],
      ];
      if (/win|won/.test(text) && wins != null && n === wins && !/by\s+\d+\s+strokes/.test(text)) return true;
      return checks.some(([applies,key,tolerance]) => applies && values.has(key) && Math.abs(Number(values.get(key))-n) <= tolerance + 1e-9);
    });
  });
}
export function lowestFit(stats: FitStat[]) { return stats.filter(s => FIT_STATS.includes(s.stat as FitKey)).sort((a,b)=>a.percentile-b.percentile)[0] ?? null; }
export function catchSentence(stat: FitStat, tour: string) {
  const p = pronouns(tour);
  if (stat.percentile >= 60) return `No real weakness: ${p.possessive.toLowerCase()} lowest number is still above the middle of the tour.`;
  const lines: Record<string,string> = { driving_accuracy:`${p.subject} misses more fairways than most.`, driving_distance:'Shorter off the tee than most of the tour.', greens_in_reg:`${p.subject} hits fewer greens than most.`, strokes_gained_tee_green:`${p.possessive} long game is weaker than most of the tour.`, strokes_gained_putting: stat.percentile >= 40 && stat.percentile <= 60 ? 'Middle of the pack on the greens.' : `${p.subject} loses shots on the greens.`, scoring_average:`${p.subject} scores higher than most of the tour.` };
  return lines[stat.stat] ?? '';
}
export function modelVoteNote(votes: { model: string; rank: number }[], tour: string) {
  const order = ['claude','gpt4','gemini'];
  const labels: Record<string,string> = { claude:'Claude', gpt4:'GPT', gemini:'Gemini' };
  const known = order.flatMap(model => { const vote = votes.find(v=>v.model===model); return vote ? [{...vote,name:labels[model]}] : []; });
  if (!known.length) return '';
  const object = pronouns(tour).object;
  if (known.length === 3 && known.every(v=>v.rank===known[0].rank)) return `All three models ranked ${object} ${rankWord(known[0].rank)}.`;
  const ranks = [...new Set(known.map(v=>v.rank))];
  return ranks.map((rank,i)=>`${joinNames(known.filter(v=>v.rank===rank).map(v=>v.name))}${i===0 ? ` had ${object}` : ''} ${rankWord(rank)}`).join(', ') + '.';
}
export function winningScoreRange(scores: number[]) { return !scores.length ? null : scores.length === 1 ? { single:true, best:scores[0], worst:scores[0] } : { single:false, best:Math.min(...scores), worst:Math.max(...scores) }; }
export function sortedBeatRows(rows: BeatRow[], record: PickRecord): (BeatRow & { is_model?: boolean })[] {
  return [...rows.filter(row=>row.picks>0), { user_id:'clbhouz', display_name:'clbhouz', username:'clbhouz', profile_photo_url:null, picks:record.picks, avg_percentile:record.avg_percentile ?? 0, is_viewer:false, is_model:true }].sort((a,b)=>b.avg_percentile-a.avg_percentile || b.picks-a.picks);
}