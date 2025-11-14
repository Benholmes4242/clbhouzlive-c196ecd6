/**
 * People Results Component
 * Shows list of people when in People tab
 */
import React from 'react';
import { haptic } from '@/utils/haptics';

interface Person {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
  handicap?: number;
  homeClubName?: string;
}

interface PeopleResultsProps {
  searchQuery: string;
  people: Person[];
  onTapPerson: (person: Person) => void;
}

export function PeopleResults({ people, searchQuery, onTapPerson }: PeopleResultsProps) {
  if (!searchQuery && people.length === 0) {
    return (
      <div className="mt-8 px-8 text-center text-[12px] text-[color:var(--hub-text-muted)]">
        Search for golfers to see the games they're hosting or have joined recently.
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="mt-8 px-8 text-center text-[12px] text-[color:var(--hub-text-muted)]">
        No golfers found. Try a different name or club.
      </div>
    );
  }

  return (
    <ul className="mt-2 space-y-2">
      {people.map((person) => (
        <li key={person.id}>
          <button
            type="button"
            onClick={() => {
              haptic('light');
              onTapPerson(person);
            }}
            className="flex w-full items-center gap-3 rounded-[16px] bg-[color:var(--hub-glass-bg-subtle)] border border-[color:var(--hub-stroke-subtle)] px-3 py-2.5 active:scale-[0.98] transition-transform duration-100"
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-black/70 bg-black/50">
              {person.avatarUrl ? (
                <img src={person.avatarUrl} className="h-full w-full object-cover" alt={person.name} />
              ) : (
                <span className="text-[12px] font-semibold text-white/80">
                  {person.initials}
                </span>
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-[13px] font-semibold text-[color:var(--hub-text-body)]">
                {person.name}
              </p>
              <p className="mt-0.5 text-[11px] text-[color:var(--hub-text-muted)]">
                HCP {person.handicap ?? '—'} · {person.homeClubName ?? 'No home club set'}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
