/** Route and mounted overview share the same remembered loading silhouette. */
import { readOverviewShape, TourOverviewShell } from '@/features/tourhub/components/overview-v3/overviewShells';
export const TourHubOverviewSkeleton = ({ lens = 'all' }: { lens?: string | null }) => <TourOverviewShell shape={readOverviewShape(lens)} />;
export default TourHubOverviewSkeleton;
