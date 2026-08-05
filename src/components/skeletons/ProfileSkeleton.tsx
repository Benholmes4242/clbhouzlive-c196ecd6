/**
 * ProfileSkeleton - personal profile (ProfilePageV2) loading silhouette.
 *
 * The old stacked-panel silhouette (250px banner, 144px overlaid avatar, white
 * meta card, centred stats row, four tab bars, three post cards) mirrored a
 * page that no longer exists. It now configures the shared
 * ProfileSurfaceSkeleton: dark hero + index headline + sparkline + four-cell
 * strip, canvas bio, Top 10 rail, three chip tabs.
 */
import { ProfileSurfaceSkeleton } from './ProfileSurfaceSkeleton';

export * from './ProfileSkeletonHelpers';

export const ProfileSkeleton = () => (
  <ProfileSurfaceSkeleton headline sparkline counters={4} topTen tabs={3} />
);
