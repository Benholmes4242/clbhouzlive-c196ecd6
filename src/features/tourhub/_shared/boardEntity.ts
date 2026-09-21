import type { BoardEntry } from '../leaderboard/BoardTable';

export interface BoardEntity {
  kind: 'player' | 'team';
  /** Row label. Player: "Alex Smalley". Team: "Smalley / Springer",
   * or "G. Kim / Y. Wilson" when a surname is ambiguous in this event. */
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
 * Surnames that belong to more than one distinct person in this event.
 * The feed's abbr_name supplies the surname forms; its ordered members supply
 * person identity, so compound surnames and CJK ordering are never re-parsed.
 */
export function ambiguousTeamSurnames(board: BoardEntry[]): Set<string> {
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
  return new Set(
    [...peopleBySurname.entries()]
      .filter(([, people]) => people.size >= 2)
      .map(([surname]) => surname),
  );
}

function readableDisplayName(value: string): string {
  return value
    .replace(/\.\s*/g, '. ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveBoardEntity(entry: BoardEntry, ambiguous: Set<string>): BoardEntity {
  const playerName = entry.player?.full_name?.trim() ?? '';
  if (playerName) return { kind: 'player', label: playerName, prose: playerName };

  const abbrName = entry.team?.abbr_name?.trim() ?? '';
  const displayName = entry.team?.display_name?.trim() ?? '';
  const memberNames = orderedMemberNames(entry);
  const hasAmbiguity = teamSegments(entry).some((surname) => ambiguous.has(surname));
  const label = hasAmbiguity && displayName
    ? readableDisplayName(displayName)
    : abbrName || (displayName ? readableDisplayName(displayName) : '') || playerName;
  const prose = memberNames.join(' and ') || label;

  return { kind: 'team', label, prose };
}