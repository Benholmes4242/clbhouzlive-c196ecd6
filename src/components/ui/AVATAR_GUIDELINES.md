# 🎯 Avatar Component Guidelines

## ✅ THE ONLY ALLOWED COMPONENT FOR USER AVATARS

**ALL user avatars across the entire application MUST use:**

```tsx
// The hairline ring defaults to DARK_HAIRLINE (white @ 22%). Never pass a
// surface-based ring colour: clbhouz is dark-only. `ringColor` is an override
// for achievement or accent rings only.
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
- ❌ `<Squircle>` for avatars (use for non-avatar content only)
- ❌ `<SquircleImage>` (deprecated)
- ❌ Any `<img>` with `rounded-full` className
- ❌ Any custom `border-radius` styles for avatars

## Why?

All user avatars must use the **new squircle shape (1/1.05 aspect ratio, 34% border radius)** for visual consistency. This creates a premium, soft-rounded square appearance.

The `<SquircleAvatar
     >` component is the **single source of truth** for this geometry.

## Size Variants

```tsx
// Extra small (28px) - for inline mentions, small lists
<SquircleAvatar size="xs" ...
/>
// or
<SquircleAvatar size={28} ...
/>

// Small (40px) - for compact lists, comments
<SquircleAvatar size="sm" ...
/>

// Medium (56px) - default for most user avatars
<SquircleAvatar size="md" ...
/>

// Large (80px) - for profile headers, featured users
<SquircleAvatar size="lg" ...
/>

// Extra large (112px) - for large profile views
<SquircleAvatar size="xl" ...
/>

// 2XL (144px) - for main profile page
<SquircleAvatar size="2xl" ...
/>
```

## Fallback Behaviour — HUE IS A PERSON

**A HUE MEANS A PERSON. THE TWELVE-SLATE PALETTE MEANS AN ENTITY.**

When no `src` is given, or the image fails, `SquircleAvatar` renders initials on
a **hue-derived gradient** keyed on the member's UUID. A business, a club, a
tour player keeps the flat twelve-slate `AVATAR_FALLBACK_PALETTE`. Courses keep
their own landscape gradients. That distinction is a rule, not an accident: it
is the only thing that tells a member apart from a business when both fall back.

### `userId` IS NOT OPTIONAL FOR A MEMBER

```tsx
<SquircleAvatar
  src={member.profile_photo_url}
  alt={member.display_name}
  userId={member.id}        // ← THE KEY. Not a nice-to-have.
  size="md"
/>
```

The hue comes from `userId || alt`. Passing only `alt` is a bug with a delay on
it: the same member renders as two obviously different coloured tiles — one hue
in the feed keyed on their name, another on their profile keyed on their id.
Twelve near-identical slates used to hide that. The hue does not.

**If the payload has no id, add it to the query.** Do not invent a key, do not
fall back to the name and call it done, do not hash a row index or an email.

### Choosing the helper

| Subject | Helper | Result |
| --- | --- | --- |
| Member | `getAvatarFallbackGradient(userId)` | hue-derived gradient |
| Business, club, tour player | `getAvatarFallbackColor(id)` | flat slate |
| Course | its own landscape gradient | unchanged |

Both live in `src/lib/avatarFallback.ts`. **Do not fork them, do not add a
local palette, do not tune a hue at a call site.** A shared subject — a
lightbox, a switcher — takes an explicit `subject` / `entity` flag from its
caller rather than guessing.

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
  across `ProfilePageV2` and `CinematicProfileHeader`.

### 2026-06 — Hue-derived member fallback, app-wide
- `SquircleAvatar` fallback flipped from the flat slate to
  `getAvatarFallbackGradient`. `userId` plumbed into every member call site
  first, so no member renders two different colours.
- Businesses, clubs and tour players deliberately KEPT the slate palette.
  `AvatarLightbox` takes `subject="entity"` for a business logo.
- The Discover board-local fallback tile was folded back into
  `SquircleAvatar`; photo rows and fallback rows now share one geometry.
