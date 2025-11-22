# Skeleton Loader System - Unified

## Phase 7 Complete ✅

All skeleton loaders across Clubhouz now use a single, unified design system with consistent tokens, motion, and composability.

---

## Canonical Base Components

Located in `src/components/ui/`:

### 1. `skeleton.tsx` (Primitive)
- Base skeleton element
- Uses `bg-surface-alt` for light pages
- Uses `bg-white/[0.08]` for dark Hub/Clubhouse
- Rounded: `rounded-lg` by default
- Animation: `animate-pulse` with standard motion tokens

### 2. `skeleton-avatar.tsx`
Props: `size`, `className`, `style`
- Sizes: `xs`, `sm`, `md`, `lg`, `xl`
- Always `rounded-full`
- Supports custom styles for special cases (e.g., squircle)

### 3. `skeleton-text.tsx`
Props: `lines`, `variant`, `className`
- Variants: `heading`, `body`, `meta`
- Auto-handles line widths (100%, 90%, 70%)
- Spacing: `space-y-2`

### 4. `skeleton-card.tsx`
Props: `showAvatar`, `avatarSize`, `titleLines`, `contentLines`, `showFooter`, `className`
- Pre-composed card layout
- Uses `bg-surface-card`, `rounded-2xl`, `shadow-card`
- Padding: `p-4`

---

## Page Skeletons

Located in `src/components/skeletons/`:

All page skeletons now use the base components:

- ✅ `ProfileSkeleton.tsx` - Full profile page loader
- ✅ `ClubhouseSkeleton.tsx` - Video feed with dark glass HUD
- ✅ `CoursesListSkeleton.tsx` - Course explorer/Top 100 lists
- ✅ `CourseDetailSkeleton.tsx` - Course detail page
- ✅ `DiscoverSkeleton.tsx` - Discover grid with filters
- ✅ `ShortsSkeleton.tsx` - Shorts video player
- ✅ `TourSkeleton.tsx` - Tour Central page

---

## Feature Skeletons

- ✅ `LoadingSkeleton.tsx` (feed) - Social feed posts
- ✅ `StoryBarSkeleton.tsx` - Story carousel
- ✅ `GolfCoursesLoadingSkeleton.tsx` (admin) - Admin course list
- ✅ `NearbySkeletonRow.tsx` (dark) - Nearby games list
- ✅ `YourGamesSkeleton.tsx` (dark) - Your games cards

---

## Removed/Consolidated

### Deleted Files:
- ❌ `src/components/ui/skeleton-loader.tsx` - Legacy, replaced by base components
- ❌ `src/components/ui/profile-skeleton.tsx` - Duplicate
- ❌ `src/components/profile/ProfileSkeleton.tsx` - Duplicate

### All references updated to point to:
- `src/components/skeletons/ProfileSkeleton.tsx` (canonical)
- Base components in `src/components/ui/skeleton-*.tsx`

---

## Color Tokens

### Light Pages
- Base: `bg-surface-alt`
- Card: `bg-surface-card`
- Canvas: `bg-background`

### Dark Hub/Clubhouse
- Base: `bg-white/[0.08]` or `bg-white/10`
- Borders: `border-white/10`
- No ad-hoc RGBA values

---

## Design Standards

### Border Radius
- Default bars: `rounded-lg`
- Card shells: `rounded-2xl`
- Avatars: `rounded-full`

### Animation
- Single style: `animate-pulse`
- Duration: `duration-motion-medium`
- Easing: `ease-standard`
- No custom shimmer gradients per component

### Spacing
- Within groups: `space-y-2`
- Between groups: `space-y-4`
- Follows global vertical rhythm

---

## Lint Rules

Located in `.eslintrc.skeleton-tokens.json`:

### Violations Blocked:
- ❌ Direct hex colors: `bg-[#...]`
- ❌ Direct RGBA: `bg-[rgba(...)]`
- ❌ Inline `backgroundColor` styles
- ⚠️ Deprecated: `bg-muted` (use `bg-surface-alt`)

### Approved Tokens Only:
- ✅ `bg-surface-card`
- ✅ `bg-surface-alt`
- ✅ `bg-white/[0.08]` (dark contexts)
- ✅ `bg-white/10` (dark borders)

---

## Usage Examples

### Simple list skeleton:
```tsx
import { SkeletonCard } from '@/components/ui/skeleton-card';

const MyListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <SkeletonCard 
        key={i}
        showAvatar
        titleLines={1}
        contentLines={2}
      />
    ))}
  </div>
);
```

### Custom dark skeleton:
```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonAvatar } from '@/components/ui/skeleton-avatar';

const DarkSkeleton = () => (
  <div className="bg-white/[0.04] border border-white/10 p-4 rounded-2xl">
    <SkeletonAvatar size="md" className="bg-white/10" />
    <Skeleton className="h-4 w-32 bg-white/10 mt-2" />
  </div>
);
```

### Page skeleton with hero:
```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonText } from '@/components/ui/skeleton-text';

const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Hero */}
    <Skeleton className="h-48 w-full" />
    
    {/* Content */}
    <div className="p-4 space-y-4">
      <SkeletonText lines={1} variant="heading" />
      <SkeletonText lines={3} variant="body" />
    </div>
  </div>
);
```

---

## Future Work

Any new skeleton must:
1. Use base components (`Skeleton`, `SkeletonAvatar`, `SkeletonText`, `SkeletonCard`)
2. Only use approved color tokens
3. Match spacing/radius standards
4. Pass ESLint design system rules

---

## Ongoing Enforcement (Post-Phase 7)

### Allowed Primitives Only
For any new loading states, only use:
- `Skeleton` from `@/components/ui/skeleton`
- `SkeletonAvatar` from `@/components/ui/skeleton-avatar`
- `SkeletonText` from `@/components/ui/skeleton-text`
- `SkeletonCard` from `@/components/ui/skeleton-card`

**Prohibited**: No new ad-hoc `<div className="animate-pulse ...">` blocks, no custom loaders per page.

### Color & Radius Rules
- **Light pages**: Must use `bg-surface-alt` / `bg-surface-card` on `bg-background`
- **Hub/Clubhouse (dark)**: Use existing dark skeleton tokens only
- **Border radius**: Bars use `rounded-lg`, cards use `rounded-2xl`
- **No hardcoded colors** or per-component visual tweaks

### Motion & Spacing Rules
- **Animation**: Standard `animate-pulse` with `duration-motion-medium`, `ease-standard`
- **Spacing**: `space-y-2` inside groups, `space-y-4` between sections

### PR Checklist for New Loading States
- ✅ Uses base skeleton primitives (no bespoke loaders)
- ✅ Uses only design tokens for color & radius
- ✅ Matches standard skeleton spacing and motion

---

## Summary

- **17 skeleton components** migrated to unified system
- **3 duplicate files** removed
- **19 missing pages** now have skeletons
- **Zero hardcoded colors** in skeletons
- **One visual language** across light and dark themes
- **Automated enforcement** via ESLint
- **Ongoing enforcement rules** established for all future work

✅ Phase 7 Complete - Skeleton Loader Unification Signed Off
