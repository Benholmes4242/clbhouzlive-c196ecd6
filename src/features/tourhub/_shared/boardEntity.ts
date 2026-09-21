import type { BoardEntry } from '../leaderboard/BoardTable';
import type { TournamentMeta } from '../leaderboard/useTournamentMeta';
import { eventFormat } from './eventFormat';

export interface BoardEntity {
  kind: 'player' | 'team';
  /** One entry per line. A player row has one; a team row has two. */
  lines: string[];
  /** Prose form. Player: "Alex Smalley".
   * Team: "Gina Kim and Yana Wilson" — always full names. */
  prose: string;
}

export type BoardNameTier = 'full' | 'short' | 'surname';

function teamSegments(entry: BoardEntry): string[] {
  return (entry.team?.abbr_name ?? '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
}

function orderedMemberNames(entry: BoardEntry): string[] {
  return [...(entry.team?.members ?? [])]
    .sort((a, b) => (a.position_in_team ?? Number.MAX_SAFE_INTEGER) - (b.position_in_team ?? Number.MAX_SAFE_INTEGER))
    .map((member) => member.player?.full_name?.trim() ?? '')
    .filter(Boolean);
}

/**
 * True when any surname on this board belongs to more than one distinct
 * person. Dow 2026 has three Kims and the Iwai twins; Zurich 2026 has
 * Brown, Fitzpatrick, Griffin, Kim and Svensson. When it fires, EVERY row
 * takes the initial form — a board that switches naming convention between
 * adjacent rows reads as a defect.
 */
export function teamNamesNeedInitials(board: BoardEntry[]): boolean {
  const peopleBySurname = new Map<string, Set<string>>();
  for (const entry of board) {
    const surnames = teamSegments(entry);
    const members = orderedMemberNames(entry);
    surnames.forEach((surname, index) => {
      const person = members[index];
      if (!person) return;
      const people = peopleBySurname.get(surname) ?? new Set<string>();
      people.add(person);
      peopleBySurname.set(surname, people);
    });
  }
  return [...peopleBySurname.values()].some((people) => people.size >= 2);
}

function readableDisplayName(value: string): string {
  return value
    .replace(/\.\s*/g, '. ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
}

function teamLines(value: string): string[] {
  return value
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function resolveBoardEntity(
  entry: BoardEntry,
  needsInitials: boolean,
  tier: BoardNameTier = needsInitials ? 'short' : 'surname',
): BoardEntity {
  const playerName = entry.player?.full_name?.trim() ?? '';
  if (!entry.team) return { kind: 'player', lines: [playerName], prose: playerName };

  const abbrName = entry.team?.abbr_name?.trim() ?? '';
  const displayName = entry.team?.display_name?.trim() ?? '';
  const memberNames = orderedMemberNames(entry);
  const safeTier = needsInitials && tier === 'surname' ? 'short' : tier;
  const fullLabel = memberNames.join(' / ');
  const shortLabel = displayName ? readableDisplayName(displayName) : '';
  const label = safeTier === 'full'
    ? fullLabel || shortLabel || abbrName || playerName
    : safeTier === 'short'
      ? shortLabel || abbrName || playerName
      : abbrName || shortLabel || playerName;
  const lines = teamLines(label);

  return {
    kind: 'team',
    lines: lines.length > 0 ? lines : ['', ''],
    prose: memberNames.join(' and ') || label || playerName,
  };
}

/**
 * A stroke champion comes from winner_id: the board cannot be trusted,
 * because playoff participants are all marked T1 (see PURE 2026).
 * A team champion comes from the board: there is no team winner_id, and
 * the feed does separate the winning team on position 1, untied.
 * A tie with no separation names nobody — never infer from row order.
 */
export function resolveChampionEntry(board: BoardEntry[], meta: Pick<TournamentMeta, 'winner_id' | 'event_type'>): BoardEntry | null {
  const format = eventFormat(meta.event_type);

  if (format === 'stroke') {
    const winnerSrId = meta.winner_id?.trim();
    if (!winnerSrId) return null;
    return board.find((entry) => entry.player?.sr_id === winnerSrId) ?? null;
  }

  if (format === 'team') {
    const separatedTop = board.filter((entry) => entry.position === 1);
    if (separatedTop.length !== 1) return null;
    const winner = separatedTop[0];
    if (winner.position_tied || !winner.team || winner.score == null) return null;
    return winner;
  }

  return null;
}

export function resolveChampion(board: BoardEntry[], meta: Pick<TournamentMeta, 'winner_id' | 'event_type'>): BoardEntity | null {
  const entry = resolveChampionEntry(board, meta);
  if (!entry) return null;
  return resolveBoardEntity(entry, teamNamesNeedInitials(board));
}