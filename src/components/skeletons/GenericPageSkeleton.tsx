/**
 * GenericPageSkeleton
 * Flexible skeleton for pages with header + content area
 */

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonText } from "@/components/ui/skeleton-text"
import { SkeletonCard } from "@/components/ui/skeleton-card"

interface GenericPageSkeletonProps {
  /** Show cards in a grid layout */
  layout?: 'list' | 'grid'
  /** Number of placeholder items */
  count?: number
}

export function GenericPageSkeleton({ layout = 'list', count = 4 }: GenericPageSkeletonProps) {
  return (
    <div className="min-h-screen bg-background page-with-header">
      {/* Header skeleton */}
      <div className="px-4 pt-[72px] pb-4">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Content skeleton */}
      <div className="px-4 pb-6">
        {layout === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} showAvatar={false} titleLines={1} contentLines={2} />
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} showAvatar titleLines={1} contentLines={3} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
