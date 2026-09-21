import type { BoardEntry } from '../leaderboard/BoardTable';

export interface BoardEntity {
  kind: 'player' | 'team';
  /** Row label. Player: "Alex Smalley". Team: "Smalley / Springer",
   * or "G. Kim / Y. Wilson" when the board needs initials. */
  label: string;
  /** Prose form. Player: "Alex Smalley".
   * Team: "Gina Kim and Yana Wilson" — always full names. */
  prose: string;
}

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

export function resolveBoardEntity(entry: BoardEntry, needsInitials: boolean): BoardEntity {
  const playerName = entry.player?.full_name?.trim() ?? '';
  if (!entry.team) return { kind: 'player', label: playerName, prose: playerName };

  const abbrName = entry.team?.abbr_name?.trim() ?? '';
  const displayName = entry.team?.display_name?.trim() ?? '';
  const memberNames = orderedMemberNames(entry);
  const label = needsInitials && displayName
    ? readableDisplayName(displayName)
    : abbrName || (displayName ? readableDisplayName(displayName) : '') || playerName;

  return { kind: 'team', label: label || playerName, prose: memberNames.join(' and ') || label || playerName };
}