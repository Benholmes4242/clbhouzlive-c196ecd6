import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
} as const

interface SkeletonAvatarProps {
  size?: keyof typeof sizeMap
  className?: string
  style?: React.CSSProperties
}

export function SkeletonAvatar({ size = 'md', className, style }: SkeletonAvatarProps) {
  return (
    <Skeleton 
      className={cn('rounded-full', sizeMap[size], className)} 
      style={style}
    />
  )
}
