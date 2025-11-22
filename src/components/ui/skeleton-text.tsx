import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

const variantMap = {
  heading: 'h-6',
  body: 'h-4',
  meta: 'h-3',
} as const

const widths = ['w-full', 'w-[90%]', 'w-[70%]']

interface SkeletonTextProps {
  lines?: number
  variant?: keyof typeof variantMap
  className?: string
}

export function SkeletonText({ 
  lines = 1, 
  variant = 'body',
  className 
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          className={cn(
            variantMap[variant],
            widths[i % widths.length]
          )}
        />
      ))}
    </div>
  )
}
