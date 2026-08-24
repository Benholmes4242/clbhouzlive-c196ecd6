/**
 * ManagePageSkeleton - dark form/list-page skeleton for /edit-profile,
 * /manage/*, and /support/thread routes (all render on A.CANVAS with
 * card stacks). Two cards only: the settled pages open with one card of
 * fields and a second beginning below it.
 */
import { Skeleton } from '@/components/ui/skeleton';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const CARD_BORDER = A.BORDER;

export const ManagePageSkeleton = () => {
  return (
    <div className="min-h-screen w-full" style={{ background: A.CANVAS }}>
      {/* Header bar (back chevron + title) */}
      <div
        className="flex items-center gap-3 px-4"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          paddingBottom: 12,
          borderBottom: `1px solid ${CARD_BORDER}`,
          background: A.CANVAS,
        }}
      >
        <Skeleton variant="dark" className="h-6 w-6 rounded-full" />
        <Skeleton variant="dark" className="h-5 w-40" />
      </div>

      {/* Card stack */}
      <div className="px-4 pt-4 space-y-3">
        <Skeleton variant="dark" className="h-24 w-full rounded-2xl" />
        <Skeleton variant="dark" className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
};

export default ManagePageSkeleton;
