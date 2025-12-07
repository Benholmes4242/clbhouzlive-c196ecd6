# 🎯 Avatar Component Guidelines

## ✅ THE ONLY ALLOWED COMPONENT FOR USER AVATARS

**ALL user avatars across the entire application MUST use:**

```tsx
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// Normal avatar (1px grey ring)
<SquircleAvatar 
  src={user.avatar} 
  alt={user.name} 
  size={56} 
/>

// Achievement avatar (colored outer ring + grey inner ring)
<SquircleAvatar 
  src={user.avatar} 
  alt={user.name} 
  size={56} 
  ringColor="#8CE06A" 
/>
```

## 🎨 Global Squircle Spec

All avatars use this shape:

- **Aspect ratio**: `1 / 1.05` (slightly taller than wide)
- **Border radius**: `34%` (continuous soft squircle)
- **Overflow**: `hidden`
- **Image fit**: `object-fit: cover`

### Normal State (no achievement)
- **Ring**: 1px grey (`gray-300` / `#D1D5DB`)
- **Shape**: Same squircle (1/1.05, 34%)

### Achievement State (with ring color)
- **Outer ring**: 1.5px colored (achievement tier color)
- **Inner ring**: 1px grey
- **Gap**: 2px padding between outer and inner rings
- **Glow**: Subtle box-shadow with ring color at 53% opacity

## 🚫 FORBIDDEN Components for User Avatars

The following components are **FORBIDDEN** for user avatars:

- ❌ `<Avatar>` from `@/components/ui/avatar`
- ❌ `<OptimizedAvatar>` from `@/components/ui/optimized-avatar`
- ❌ `<AvatarSquircle>` from `@/components/ui/AvatarSquircle`
- ❌ `<Squircle>` for avatars (use for non-avatar content only)
- ❌ `<SquircleImage>` (deprecated)
- ❌ Any `<img>` with `rounded-full` className
- ❌ Any custom `border-radius` styles for avatars

## Why?

All user avatars must use the **new squircle shape (1/1.05 aspect ratio, 34% border radius)** for visual consistency. This creates a premium, soft-rounded square appearance.

The `<SquircleAvatar>` component is the **single source of truth** for this geometry.

## Size Variants

```tsx
// Extra small (28px) - for inline mentions, small lists
<SquircleAvatar size="xs" ... />
// or
<SquircleAvatar size={28} ... />

// Small (40px) - for compact lists, comments
<SquircleAvatar size="sm" ... />

// Medium (56px) - default for most user avatars
<SquircleAvatar size="md" ... />

// Large (80px) - for profile headers, featured users
<SquircleAvatar size="lg" ... />

// Extra large (112px) - for large profile views
<SquircleAvatar size="xl" ... />

// 2XL (144px) - for main profile page
<SquircleAvatar size="2xl" ... />
```

## With Fallback (Initials)

```tsx
<SquircleAvatar 
  src={user.avatar} 
  alt={user.name}
  fallback="JD" // Shows "JD" if image fails to load
  size={56} 
/>
```

## Achievement Ring Colors

Pass the achievement tier color to `ringColor` prop:

```tsx
// Founder green
<SquircleAvatar ringColor="#8CE06A" ... />

// Ring colors from Global Achievement & Milestone System
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
<SquircleAvatar ringColor={getRingColorForTotalPlayed(totalPlayed)} ... />
```

## Enforcement

- All deprecated components will log **console.error** warnings in development
- Code reviews should reject any new user avatars not using `<SquircleAvatar>`
- Visual QA should flag any circular or non-standard avatars

## Questions?

See `src/components/ui/SquircleAvatar.tsx` for the implementation details.
