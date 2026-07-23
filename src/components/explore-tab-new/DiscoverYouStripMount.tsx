import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { YouStrip, type YouStripPreview, type YouStripVariant } from './YouStrip';
import { useViewerListContext } from './hooks/useViewerListContext';
import { DISCOVER_YOU_STRIP } from '@/config/featureFlags';

/**
 * DiscoverYouStripMount — data-wired wrapper around `YouStrip`.
 *
 * Per BRIEF_G2_CLIENT_AND_EDGE, this only mounts under Latest Birdie Hauls
 * and The Record Book. Signed-out → renders nothing. Feature flag OFF →
 * renders nothing (guarded in YouStrip). The RPC contract is silent-fail:
 * the hook returns { empty: true } on error or 404, and this component
 * renders the section-appropriate single-line empty state.
 *
 * IMPORTANT: the client must never compose or compute stat text. When
 * `on_list` is false, we render `delta_label` verbatim from the RPC.
 * When `on_list` is true, we do NOT render the strip at all (the
 * highlight is expected to be applied inline on the viewer's existing
 * StatRow by the parent — this component reports that state via
 * `onViewerOnList(viewerRank)` so the parent can paint the wash).
 */

export interface DiscoverYouStripMountProps {
  /** Rail-cache key, e.g. `records:gbi` or `feats:usa:birdie_hauls`. */
  railKey: string;
  /** Section-scoped fallback line when the RPC returns `{ empty: true }`. */
  emptyMessage: string;
  /** Notifies parent when the viewer is on the visible board so the
   *  parent can paint the amber wash inline on the existing StatRow. */
  onViewerOnList?: (viewerRank: number | null) => void;
  /** Optional tap handler on the strip row (off-list only). */
  onPress?: () => void;
}

export function DiscoverYouStripMount({
  railKey,
  emptyMessage,
  onViewerOnList,
  onPress,
}: DiscoverYouStripMountProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id ?? null;
  const { data } = useViewerListContext(userId ? railKey : null);

  // Signed-out → render nothing (no empty state on Discover for anon).
  if (!userId) return null;

  // Flag OFF → render nothing (also guarded inside <YouStrip/> itself).
  if (!DISCOVER_YOU_STRIP) return null;

  // Empty / silent-fail from the RPC → single-line empty state.
  if (!data || data.empty) {
    const preview: YouStripPreview = {
      variant: 'empty',
      emptyMessage,
    };
    return <YouStrip preview={preview} />;
  }

  // On-list → paint the highlight on the parent's StatRow, render no strip.
  if (data.on_list) {
    onViewerOnList?.(data.viewer_rank);
    return null;
  }

  // Off-list → strip row rendering delta_label verbatim.
  const variant: YouStripVariant = 'offList';
  const preview: YouStripPreview = {
    variant,
    name: 'You',
    rank: data.viewer_rank,
    delta: data.delta_label, // verbatim from the RPC — client never composes stat text.
    onPress,
  };
  return <YouStrip preview={preview} />;
}

export default DiscoverYouStripMount;
