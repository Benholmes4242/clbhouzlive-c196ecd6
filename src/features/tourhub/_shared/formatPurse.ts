/**
 * formatPurse — rescued from the deleted components/shared/TourHeroHelpers.tsx
 * during Wave 3e.ii Turn 4 orphan nuke. Pure formatter, no i18n.
 */
export function formatPurse(purse: number | null): string {
  if (!purse) return '';
  return purse >= 1_000_000
    ? `$${(purse / 1_000_000).toFixed(purse % 1_000_000 === 0 ? 0 : 1)}M`
    : `$${(purse / 1_000).toFixed(0)}K`;
}
