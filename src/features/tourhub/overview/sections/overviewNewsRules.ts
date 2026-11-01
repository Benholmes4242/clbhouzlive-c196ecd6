/** Overview-only metadata and ordered player extraction; storyTime and News
 * defaults remain untouched. IDs are sr_players.id, never provider sr_id. */
import type { TourStory } from '../../news/useTourStories';
import { storyTime } from '../../news/storyTime';
import { readingMinutes } from '../../news/readingTime';
import { surnameOf } from '../../_shared/playerName';
import { todayFromEntry, fmtThru, type BoardEntry } from '../../leaderboard/BoardTable';
import { formatRank, fmtScore } from '../../components/overview-v3/HybridHero.utils';
import { getScoreColor } from '../../_shared/scoreColor';

export const NEWS_TOUR_LABELS: Record<string, string> = { pga: 'PGA Tour', lpga: 'LPGA', euro: 'DP World', pgad: 'Korn Ferry', champ: 'Champions', liv: 'LIV Golf' };
export function newsAge(at: string | null, short = false, now = new Date()): string {
  const age = storyTime(at, now);
  if (age === 'JUST NOW') return short ? 'now' : 'just now';
  if (age === 'YESTERDAY') return short ? '1d' : 'yesterday';
  if (age.endsWith('H AGO')) return age.replace('H AGO', short ? 'h' : 'h ago');
  if (age.endsWith(' DAYS AGO')) return age.replace(' DAYS AGO', short ? 'd' : ' days ago');
  return age.replace(/[A-Z]+/g, month => month[0] + month.slice(1).toLowerCase());
}
export function storyPlayerIds(story: TourStory): string[] {
  return [...new Set(story.body_blocks.flatMap(block => 'player_id' in block ? [block.player_id] : []))];
}
export function orderedNewsPlayers(story: TourStory, follows: Set<string>): string[] {
  const ids = storyPlayerIds(story);
  return [...ids.filter(id => follows.has(id)), ...ids.filter(id => !follows.has(id))];
}
export interface NewsPlayer { id: string; surname: string; followed: boolean; live: boolean; position?: string; score?: string; color?: string; thru?: string }
export interface NewsPresentation { isNew: boolean; liveRound: number | null; players: NewsPlayer[]; now?: Date }
export function newsPlayers(story: TourStory, follows: Set<string>, names: Map<string, string>, board: BoardEntry[], round: number | null): NewsPlayer[] {
  return orderedNewsPlayers(story, follows).flatMap(id => {
    const entry = board.find(row => row.player?.id === id);
    const full = entry?.player?.last_name || entry?.player?.full_name || names.get(id);
    if (!full || (round != null ? !entry : !follows.has(id))) return [];
    const surname = entry?.player?.last_name || surnameOf(full);
    const followed = follows.has(id);
    if (round == null || !entry) return [{ id, surname, followed, live: false }];
    const thru = todayFromEntry(entry, round) == null || !entry.thru ? '' : fmtThru(entry.thru);
    return [{ id, surname, followed, live: true, position: formatRank(entry), score: fmtScore(entry.score, { absent: '' }), color: getScoreColor(entry.score, 'dark'), thru }];
  }).slice(0, 3);
}
export function newsDetails(story: TourStory, round: number | null, short = false, now = new Date()) {
  return { tour: NEWS_TOUR_LABELS[story.tour_slug ?? ''] ?? '', minutes: round == null ? readingMinutes(story.body_blocks) : null, age: newsAge(story.published_at, short, now) };
}