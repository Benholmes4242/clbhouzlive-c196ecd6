export interface InviteTier {
  /** sent count at which this tier STARTS (bar empty) */
  floor: number;
  /** sent count at which this tier COMPLETES (bar full) */
  goal: number;
  title: string;
  /** Honest, outcome-based subcopy — no fake "unlocks". */
  sub: string;
}

// Rolling ladder: the current tier is the first whose `goal` > sentCount.
// Bar fills within the tier: (sent - floor) / (goal - floor).
// Tune freely — single source of truth.
export const INVITE_TIERS: InviteTier[] = [
  { floor: 0,  goal: 3,  title: 'Build your leaderboard', sub: 'Invite 3 friends for a friends leaderboard worth checking' },
  { floor: 3,  goal: 5,  title: 'Complete a fourball',     sub: '2 more to bring your regular fourball onto clbhouz' },
  { floor: 5,  goal: 10, title: 'Grow your circle',        sub: 'Get to 10 and your circle really comes alive' },
  { floor: 10, goal: 15, title: 'Circle builder',          sub: "You're rounding up the whole club now" },
];

/** Milestone markers shown as a dot ladder under the bar. */
export const INVITE_MILESTONES = [3, 5, 10, 15];

/** Returns the current tier, or null when all tiers are complete. */
export function tierForSent(sent: number): InviteTier | null {
  for (const t of INVITE_TIERS) {
    if (sent < t.goal) return t;
  }
  return null;
}
