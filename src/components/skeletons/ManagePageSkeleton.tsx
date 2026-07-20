/**
 * ManagePageSkeleton - light form/list-page skeleton for /edit-profile,
 * /manage/*, and /support/thread routes (all render on #F8FAFC with
 * card stacks). Replaces the dark ProfileSkeleton on these surfaces.
 */
import { Skeleton } from '@/components/ui/skeleton';

const CARD_BORDER = 'rgba(15,23,42,0.07)';

export const ManagePageSkeleton = () => {
  return (
    <div className="min-h-screen w-full" style={{ background: '#F8FAFC' }}>
      {/* Header bar (back chevron + title) */}
      <div
        className="flex items-center gap-3 px-4"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          paddingBottom: 12,
          borderBottom: `1px solid ${CARD_BORDER}`,
          background: '#F8FAFC',
        }}
      >
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Card stack */}
      <div className="px-4 pt-4 space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
};

export default ManagePageSkeleton;
