import { Skeleton } from '@/components/ui/skeleton';

export function CreatorSectionSkeleton() {
  return (
    <div className="px-3 py-2 space-y-3">
      {/* Featured video skeleton */}
      <Skeleton className="aspect-video w-full rounded-xl" />

      {/* Pinned posts skeleton */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="w-[120px] shrink-0 aspect-[4/5] rounded-lg" />
        ))}
      </div>

      {/* Stats skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
