# 🎯 Avatar Component Guidelines

## ✅ THE ONLY ALLOWED COMPONENT FOR USER AVATARS

**ALL user avatars across the entire application MUST use:**

```tsx
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';

// Normal avatar (1px grey ring)
<SquircleAvatar 
  src={user.avatar} 
  alt={user.name} 
  size={56}
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
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
- ❌ `<Squircle>` for avatars (use for non-avatar content only)
- ❌ `<SquircleImage>` (deprecated)
- ❌ Any `<img>` with `rounded-full` className
- ❌ Any custom `border-radius` styles for avatars

## Why?

All user avatars must use the **new squircle shape (1/1.05 aspect ratio, 34% border radius)** for visual consistency. This creates a premium, soft-rounded square appearance.

The `<SquircleAvatar
       hairlineRing
       ringColor={LIGHT_HAIRLINE}
     >` component is the **single source of truth** for this geometry.

## Size Variants

```tsx
// Extra small (28px) - for inline mentions, small lists
<SquircleAvatar size="xs" ...
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>
// or
<SquircleAvatar size={28} ...
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>

// Small (40px) - for compact lists, comments
<SquircleAvatar size="sm" ...
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>

// Medium (56px) - default for most user avatars
<SquircleAvatar size="md" ...
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>

// Large (80px) - for profile headers, featured users
<SquircleAvatar size="lg" ...
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>

// Extra large (112px) - for large profile views
<SquircleAvatar size="xl" ...
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>

// 2XL (144px) - for main profile page
<SquircleAvatar size="2xl" ...
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>
```

## Fallback Behaviour (Updated)

When no `src` is provided or the image fails to load, `SquircleAvatar` renders
initials on a deterministic coloured background:

- **Colour** is derived from the user's UUID (preferred) or their display name
  (fallback). Same user → same colour every time, everywhere in the app.
- **Initials** are auto-derived from `alt` (the user's display name). Two
  characters max. Override via `fallback` prop if needed.

```tsx
// Recommended — colour is consistent across the whole app for this user
<SquircleAvatar
  src={user.profile_photo_url}
  alt={user.display_name}
  userId={user.id}
  size="md"
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>

// If UUID isn't available (rare), colour hashes from the name
<SquircleAvatar
  src={null}
  alt="Chris Leeson"
  size="md"
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>

// Manual override for edge cases
<SquircleAvatar
  src={null}
  alt="Guest"
  fallback="G"
  size="md"
  hairlineRing
  ringColor={LIGHT_HAIRLINE}
/>
```

Palette and hash live in `src/lib/avatarFallback.ts`. Do not fork.

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
- Code reviews should reject any new user avatars not using `<SquircleAvatar
                                                               hairlineRing
                                                               ringColor={LIGHT_HAIRLINE}
                                                             >`
- Visual QA should flag any circular or non-standard avatars

## Questions?

See `src/components/ui/SquircleAvatar.tsx` for the implementation details.

## Changelog

### 2026-04-21 — Fallback unification
- `SquircleAvatar.fallback` prop now actually renders. Previously the prop was
  accepted but silently dropped; only `PlayerSilhouette` ever rendered.
- New `userId` prop drives deterministic per-user fallback colour.
- `avatar.tsx` (shadcn) and `optimized-avatar.tsx` deprecated app-wide
  (Avatar/AvatarFallback/AvatarImage exports removed from `components/index.ts`).
- 3 duplicate `FALLBACK_PALETTE` / `getAvatarFallbackColor` copies consolidated
  into `src/lib/avatarFallback.ts`.
- New `CoverPhotoFallback` component unifies the empty cover-photo state
  across `ProfilePageV2`, `ProfileHeroShell`, and `CinematicProfileHeader`.

