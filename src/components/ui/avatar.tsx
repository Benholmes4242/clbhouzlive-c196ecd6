
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"
import { useImageLoader } from "@/hooks/useImageLoader"
import { useLazyIntersectionObserver } from "@/hooks/useLazyIntersectionObserver"
import { getOptimizedImageUrl } from "@/utils/imageOptimization"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  const { isInView, setContainerRef } = useLazyIntersectionObserver({
    threshold: 0.1,
    rootMargin: "50px" // Start loading when avatar is close to viewport
  });

  const optimizedSrc = src ? getOptimizedImageUrl(src, 80, 80) : '';
  
  const { 
    currentSrc, 
    isLoading, 
    hasError,
    handleLoad,
    handleError 
  } = useImageLoader({
    src: optimizedSrc,
    isInView,
    priority: false, // Avatars are not priority content
    progressive: true, // Use progressive loading for smooth experience
    quality: 'medium', // Good balance for small avatars
    fallback: '/placeholder.svg'
  });

  return (
    <div ref={setContainerRef} className="relative w-full h-full">
      {/* Loading state with subtle grey background */}
      {isLoading && currentSrc && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
      )}
      
      {/* Optimized image with enhanced loading */}
      {currentSrc && (
        <AvatarPrimitive.Image
          ref={ref}
          className={cn(
            "aspect-square h-full w-full transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          src={currentSrc}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
