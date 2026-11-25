/** Edit-mode display order: kept (already-saved) media are numbered by their
 * position in the composer's state.media, the one source of post order. */
import type { StageMediaItem } from '../hooks/useStageComposer';
export function keptMediaDisplayOrders(media: readonly StageMediaItem[]): { existingId: string; display_order: number }[] {
  return media.filter((m) => m.existingId).map((m, i) => ({ existingId: m.existingId as string, display_order: i }));
}
