/** Shared observer boundary: HB4 extraction preserves IslandDock's probe/fallback. */
export function measureIslandBoundary(): number {
  const sat = getComputedStyle(document.documentElement).getPropertyValue('--sat');
  const probe = document.createElement('div');
  probe.style.height = `calc(${sat.trim() || '0px'} + 56px)`;
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  document.body.appendChild(probe);
  const measuredBoundary = probe.getBoundingClientRect().height;
  probe.remove();
  return measuredBoundary > 0 ? measuredBoundary : 56;
}