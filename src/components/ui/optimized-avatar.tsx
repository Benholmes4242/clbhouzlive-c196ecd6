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
      {/* Loading state with blur effect */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse rounded-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23f1f5f9'/%3E%3Cellipse cx='20' cy='16' rx='7' ry='6' fill='%23e2e8f0'/%3E%3Cellipse cx='20' cy='28' rx='11' ry='7' fill='%23e2e8f0'/%3E%3C/svg%3E")`,
            backgroundSize: 'cover'
          }}
        />
      )}
      
      {/* Optimized image */}
      {cachedSrc && (
        <AvatarPrimitive.Image
          className={cn(
            "aspect-square h-full w-full transition-opacity duration-200",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          src={cachedSrc}
          alt={alt}
        />
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