import { cn } from "@/lib/utils"
import { SkeletonAvatar } from "./skeleton-avatar"
import { SkeletonText } from "./skeleton-text"

interface SkeletonCardProps {
  showAvatar?: boolean
  avatarSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  titleLines?: number
  contentLines?: number
  showFooter?: boolean
  className?: string
}

export function SkeletonCard({ 
  showAvatar = false,
  avatarSize = 'md',
  titleLines = 1,
  contentLines = 2,
  showFooter = false,
  className 
}: SkeletonCardProps) {
  return (
    <div className={cn(
      'bg-surface-card rounded-2xl shadow-card p-4',
      className
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {showAvatar && <SkeletonAvatar size={avatarSize} />}
        <div className="flex-1 space-y-2">
          <SkeletonText lines={titleLines} variant="heading" />
        </div>
      </div>

      {/* Content */}
      {contentLines > 0 && (
        <SkeletonText lines={contentLines} variant="body" className="mb-3" />
      )}

      {/* Footer */}
      {showFooter && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <SkeletonText lines={1} variant="meta" className="flex-1" />
        </div>
      )}
    </div>
  )
}
