/** Photo-only feed grid eligibility; review fill frames remain caller-owned. */
export function feedPhotoGridLayout(items: ReadonlyArray<{ type: string; width?: number | null; height?: number | null }>) {
  if (items.length < 4 || items.some(item => item.type !== 'image')) return null;
  const first = items[0];
  const dimensions = first && Number.isFinite(first.width) && Number.isFinite(first.height) && (first.width ?? 0) > 0 && (first.height ?? 0) > 0;
  const shape = !dimensions || (first?.height ?? 0) > (first?.width ?? 0) ? 'upright' as const : 'wide' as const;
  return { shape, shown: [0, 1, 2, 3], more: items.length - 4, leadRatio: shape === 'wide' ? Math.min(1.91, Math.max(4 / 3, (first?.width ?? 1) / (first?.height ?? 1))) : 4 / 5 };
}