import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { useProfilePhotoCache } from "@/hooks/useProfilePhotoCache"

interface OptimizedAvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string;
  alt?: string;
  size?: number;
  fallback?: React.ReactNode;
  priority?: boolean;
}

export const OptimizedAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  OptimizedAvatarProps
>(({ className, src, alt, size = 40, fallback, priority = false, children, ...props }, ref) => {
  const { cachedSrc, isLoading } = useProfilePhotoCache({ 
    src: src || '', 
    size,
    preload: priority 
  });

  // Extract size for CSS
  const sizeClass = `w-${Math.round(size/4)} h-${Math.round(size/4)}`;

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClass,
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {/* Optimized image - show immediately if cached */}
      {cachedSrc && (
        <AvatarPrimitive.Image
          className={cn(
            "aspect-square h-full w-full transition-opacity duration-300",
            isLoading ? "opacity-70" : "opacity-100"
          )}
          src={cachedSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
        />
      )}
      
      {/* Minimal loading state - only show for first 2 seconds */}
      {isLoading && !cachedSrc && (
        <div 
          className="absolute inset-0 bg-muted/60 animate-pulse rounded-full flex items-center justify-center"
        >
          <div className="text-xs font-medium text-muted-foreground/60">
            {alt?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      )}
      
      {/* Fallback */}
      {!cachedSrc && !isLoading && (
        <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted">
          {fallback || (
            <div className="text-xs font-medium text-muted-foreground">
              {alt?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </AvatarPrimitive.Fallback>
      )}
      
      {children}
    </AvatarPrimitive.Root>
  );
});

OptimizedAvatar.displayName = "OptimizedAvatar"