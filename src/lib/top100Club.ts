// src/lib/top100Club.ts
// New unified Top 100 club tier system based on total_top100_rated

export type Top100Ring =
  | 'none'
  | 'bronze'
  | 'blue'
  | 'green'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'obsidian';

export type Top100ClubMeta = {
  threshold: number;          // e.g. 20
  label: string;              // e.g. '20 Club'
  shortLabel: string;         // e.g. '20 Club'
  ring: Top100Ring;           // which ring to use
};

// Ordered lowest → highest
const CLUB_STEPS: Top100ClubMeta[] = [
  { threshold: 5,   label: '5 Club',   shortLabel: '5 Club',   ring: 'bronze'   },
  { threshold: 10,  label: '10 Club',  shortLabel: '10 Club',  ring: 'bronze'   },
  { threshold: 20,  label: '20 Club',  shortLabel: '20 Club',  ring: 'blue'     },
  { threshold: 50,  label: '50 Club',  shortLabel: '50 Club',  ring: 'green'    },
  { threshold: 100, label: '100 Club', shortLabel: '100 Club', ring: 'silver'   },
  { threshold: 200, label: '200 Club', shortLabel: '200 Club', ring: 'gold'     },
  { threshold: 300, label: '300 Club', shortLabel: '300 Club', ring: 'platinum' },
  { threshold: 400, label: '400 Club', shortLabel: '400 Club', ring: 'obsidian' },
];

export function getTop100Club(totalRated: number | null | undefined): Top100ClubMeta | null {
  const n = totalRated ?? 0;
  if (n < 5) return null; // below 5, no club

  let current: Top100ClubMeta | null = null;

  for (const step of CLUB_STEPS) {
    if (n >= step.threshold) {
      current = step;
    } else {
      break;
    }
  }

  return current;
}
