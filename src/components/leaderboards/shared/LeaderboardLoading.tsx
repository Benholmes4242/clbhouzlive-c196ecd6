import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardLoadingProps {
  rows?: number;
}

export function LeaderboardLoading({ rows = 5 }: LeaderboardLoadingProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
