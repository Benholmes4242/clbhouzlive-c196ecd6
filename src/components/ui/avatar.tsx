
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * ⚠️ FORBIDDEN FOR USER AVATARS - USE <Squircle /> ONLY ⚠️
 * 
 * ❌ DO NOT use this component for user avatars/profile photos
 * ✅ MUST use <Squircle> from @/components/ui/squircle.tsx instead
 * 
 * ALL user avatars across the entire application MUST use the superellipse 
 * squircle shape (n=5) for visual consistency. This is the ONLY allowed 
 * geometry for user photos.
 * 
 * This circular Avatar component is DEPRECATED and FORBIDDEN for user avatars.
 * It may only be used for non-user content (system icons, brand logos, etc.).
 * 
 * @see src/components/ui/squircle.tsx - The ONLY source of truth for user avatars
 */

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => {
  // FORBIDDEN for user avatars - strict warning in development
  if (process.env.NODE_ENV === 'development') {
    console.error(
      '❌ FORBIDDEN: Avatar component must NOT be used for user avatars!\n' +
      '✅ Use <Squircle> from @/components/ui/squircle.tsx instead.\n' +
      'All user avatars must use the superellipse squircle shape (n=5).'
    );
  }

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
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
