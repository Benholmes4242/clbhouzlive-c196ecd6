import { Skeleton } from "@/components/ui/skeleton"

export const ShortsSkeleton = () => {
  return (
    <div className="w-full h-screen bg-[var(--bg-page)] relative">
      <Skeleton className="absolute inset-0 bg-slate-100" />
      
      {/* Bottom overlay */}
      <div className="absolute bottom-20 left-4 right-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Right rail */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-12 h-12 rounded-full" />
        ))}
      </div>
    </div>
  )
}
