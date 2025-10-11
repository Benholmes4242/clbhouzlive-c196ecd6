export function getResponsiveCols(): number {
  if (window.matchMedia('(min-width: 1280px)').matches) return 5; // xl breakpoint
  if (window.matchMedia('(min-width: 768px)').matches) return 4;  // md breakpoint
  return 3; // mobile
}
