import { LoopCardSkeleton } from '@/components/loop-tab/LoopCardSkeleton';

export function FriendsFeedSkeleton() {
  return (
    <div className="flex flex-col gap-3 pb-4 pt-2 px-0">
      <LoopCardSkeleton variant="landscape" />
      <LoopCardSkeleton variant="portrait" />
      <LoopCardSkeleton variant="landscape" />
    </div>
  );
}
