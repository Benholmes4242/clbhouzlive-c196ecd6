import { cn } from "@/lib/utils"

interface InlineSpinnerProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const sizeMap = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-2',
} as const

export function InlineSpinner({ className, size = 'md' }: InlineSpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-primary-accent border-t-transparent transition-motion-fast ease-standard",
        sizeMap[size],
        className
      )}
    />
  )
}
