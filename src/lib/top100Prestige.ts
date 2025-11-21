export type Top100PrestigeRing =
  | 'bronze'
  | 'blue'
  | 'green'
  | 'silver'
  | 'gold'
  | 'platinum'
  | null;

export function getTop100PrestigeRing(totalTop100: number): Top100PrestigeRing {
  if (totalTop100 >= 300) return 'platinum';
  if (totalTop100 >= 200) return 'gold';
  if (totalTop100 >= 100) return 'silver';
  if (totalTop100 >= 50) return 'green';
  if (totalTop100 >= 20) return 'blue';
  if (totalTop100 > 0) return 'bronze';
  return null;
}

export function getTop100MilestoneLabel(totalTop100: number): string | null {
  if (totalTop100 >= 300) return '300 Club Champion';
  if (totalTop100 >= 200) return '200 Clubhouse Elite';
  if (totalTop100 >= 100) return '100 Century Club';
  if (totalTop100 >= 50) return '50 Club';
  if (totalTop100 >= 20) return '20 Club';
  return null;
}

export function getRingLabel(ring?: Top100PrestigeRing | null): string | null {
  switch (ring) {
    case 'bronze': return 'Bronze Ring';
    case 'blue': return 'Blue Ring';
    case 'green': return 'Green Ring';
    case 'silver': return 'Silver Ring';
    case 'gold': return 'Gold Ring';
    case 'platinum': return 'Platinum Ring';
    default: return null;
  }
}

export function getRingColorClass(ring?: Top100PrestigeRing | null): string {
  switch (ring) {
    case 'bronze': return 'ring-amber-500/80';
    case 'blue': return 'ring-sky-500/80';
    case 'green': return 'ring-emerald-500/80';
    case 'silver': return 'ring-slate-200/80';
    case 'gold': return 'ring-yellow-400/90';
    case 'platinum': return 'ring-fuchsia-400/90';
    default: return 'ring-border';
  }
}
