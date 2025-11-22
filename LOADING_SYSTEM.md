# Loading & Navigation System (Phase 8)

**Last Updated:** 2025-11-22  
**Status:** ✅ Implemented

---

## Overview

Clbhouz uses a **skeleton-led navigation system** with no full-screen spinners during normal route transitions. The app chrome (header, footer, nav) stays visible at all times once mounted, and content-area skeletons provide visual feedback during data loading.

---

## Core Principles

1. **No Full-Screen Route Spinners** - After app mount, navigation is instant with skeletons in content area
2. **Chrome Stays Visible** - Header, footer, and nav remain in place during all transitions
3. **Content-Level Skeletons Only** - Loading states appear only in the content area being loaded
4. **Inline Spinners for Micro-Actions** - Small spinners for button states, never for whole pages
5. **Design System Adherence** - All loading elements use design tokens (colors, typography, motion)

---

## Loading Primitives

### 1. AppBootstrapLoader
**File:** `src/components/AppBootstrapLoader.tsx`

**Purpose:** Only shown during initial app mount (cold start). Never appears during normal navigation.

**Usage:** Top-level Suspense fallback in `App.tsx`

```tsx
<Suspense fallback={<AppBootstrapLoader />}>
  <AppRoutes />
</Suspense>
```

**Rules:**
- ✅ Use ONLY for initial app mount
- ❌ Never use for route transitions
- ❌ Never use for page-level loading

---

### 2. Skeleton Primitives
**Files:**
- `src/components/ui/skeleton.tsx` - Base primitive
- `src/components/ui/skeleton-avatar.tsx` - Avatar skeletons
- `src/components/ui/skeleton-text.tsx` - Text line skeletons
- `src/components/ui/skeleton-card.tsx` - Card layout helper

**Purpose:** Building blocks for all page/section skeletons

**Page Skeletons:**
- `ProfileSkeleton` - For `/profile/:username`
- `ClubhouseSkeleton` - For `/clubhouse`
- `CoursesListSkeleton` - For `/courses`
- `CourseDetailSkeleton` - For `/courses/:id`
- `DiscoverSkeleton` - For `/discover`
- `TourSkeleton` - For `/tour-central`
- `GenericPageSkeleton` - For generic pages (videos, messages, etc.)
- `HubSkeleton` - For `/hub/*` (dark-themed)

**Usage:** Route-level Suspense fallbacks

```tsx
<Route path="/courses" element={
  <Suspense fallback={<CoursesListSkeleton />}>
    <Courses />
  </Suspense>
} />
```

**Rules:**
- ✅ Use for page-level loading states
- ✅ Render inside normal layout (below header, above footer)
- ✅ Use unified skeleton primitives only
- ❌ Never create bespoke skeleton components
- ❌ Never use direct color values

---

### 3. InlineSpinner
**File:** `src/components/ui/InlineSpinner.tsx`

**Purpose:** Small, unobtrusive spinner for micro-interactions (buttons, inline actions)

**Props:**
- `size?: 'xs' | 'sm' | 'md' | 'lg'` (default: `'md'`)
- `className?: string`

**Usage:**

```tsx
// Button loading state
<Button disabled={isLoading}>
  {isLoading && <InlineSpinner size="sm" className="mr-2" />}
  Save Changes
</Button>

// Inline data loading
<div className="flex items-center gap-2">
  <InlineSpinner size="sm" />
  <span>Loading...</span>
</div>
```

**Rules:**
- ✅ Use for button states
- ✅ Use for small inline loading indicators
- ✅ Uses design tokens (`border-primary-accent`)
- ❌ Never use for page-level loading
- ❌ Never use full-screen

---

## Route-Level Loading Pattern

### Standard Pattern

All routes follow this structure:

```tsx
<Route path="/page" element={
  <Suspense fallback={<PageSkeleton />}>
    <PageComponent />
  </Suspense>
} />
```

**Where:**
- `PageSkeleton` = Appropriate skeleton for the page type
- Skeleton renders **inside** the main layout (not full-screen)
- Header/footer remain visible during loading

### Route-Specific Implementations

| Route | Skeleton | Notes |
|-------|----------|-------|
| `/` | `ClubhouseSkeleton` | Home = Clubhouse feed |
| `/clubhouse` | `ClubhouseSkeleton` | Vertical video feed |
| `/courses` | `CoursesListSkeleton` | Course list/grid |
| `/courses/:id` | `CourseDetailSkeleton` | Course detail page |
| `/profile/:username` | `ProfileSkeleton` | User profile |
| `/discover` | `DiscoverSkeleton` | Discover feed |
| `/tour-central` | `TourSkeleton` | Tour central page |
| `/videos` | `GenericPageSkeleton` (grid) | Video grid |
| `/messages` | `GenericPageSkeleton` | Message list |
| `/notifications` | `GenericPageSkeleton` | Notification list |
| `/friends` | `GenericPageSkeleton` | Friends list |
| `/hub/*` | `HubSkeleton` | Dark-themed Hub pages |

---

## Data Fetching: Keep Previous Data

To achieve "no loading page" feel (like Instagram/TikTok), use React Query's `keepPreviousData`:

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['courses', filters],
  queryFn: fetchCourses,
  keepPreviousData: true, // ✅ Keep old data visible while fetching new
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 15 * 60 * 1000, // 15 minutes
});
```

**Result:**
- Skeleton only appears when **no cached data** exists (first visit)
- On filter/pagination changes, previous data stays visible while new data loads
- No flash of empty state between data transitions

---

## Intra-Page / Micro Loading

### Buttons

```tsx
<Button disabled={isLoading}>
  {isLoading && <InlineSpinner size="sm" className="mr-2" />}
  Follow
</Button>
```

### Lists Refreshing

```tsx
{isRefreshing ? (
  <div className="space-y-3">
    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
  </div>
) : (
  <CourseList courses={data} />
)}
```

**Rules:**
- ✅ Use `InlineSpinner` for buttons
- ✅ Use skeleton rows/cards for list refreshes
- ❌ Never show full-page spinner for small actions

---

## What Was Removed (Phase 8)

### Deprecated Components (Deleted)

| Component | Replacement |
|-----------|-------------|
| `GlobalLoadingProvider` | React Suspense + route skeletons |
| `GlobalSpinner` | Route-level skeletons |
| `BindLoadingBus` | N/A (system removed) |
| `loadingBus` | N/A (system removed) |
| `ClbhouzPageSpinner` | `AppBootstrapLoader` (app mount only) |
| `ClubhouzLoading` | Page-specific skeletons |

### Deprecated Patterns

❌ **Full-Screen Spinners During Navigation**
```tsx
// OLD (removed)
if (isLoading) return <ClbhouzPageSpinner />;
```

✅ **New: Suspense + Skeleton**
```tsx
// NEW (correct)
<Suspense fallback={<PageSkeleton />}>
  <PageContent />
</Suspense>
```

❌ **Global Loading Overlay**
```tsx
// OLD (removed)
<GlobalLoadingProvider>
  <App />
  <GlobalSpinner />
</GlobalLoadingProvider>
```

✅ **New: No Global Overlay**
```tsx
// NEW (correct)
<App />
// No global spinner - each route handles its own loading
```

---

## QA Checklist

When implementing new pages or modifying loading behavior, verify:

### Cold Start
- [ ] `AppBootstrapLoader` appears briefly on first load
- [ ] `AppBootstrapLoader` never re-appears during navigation

### Navigation
Navigate between: `/hub` → `/clubhouse` → `/courses` → `/profile/:username` → `/discover`

- [ ] Header/footer/nav always present after mount
- [ ] No full-screen logo/spinner between pages
- [ ] Skeletons appear in content area only (when no cached data)
- [ ] Previous page doesn't flash during transition

### Filters & Pagination
- [ ] Lists keep previous data visible while refetching (no skeleton flash)
- [ ] Skeleton only appears on first load (no cached data)

### Micro-Actions
- [ ] Button states use `InlineSpinner`, not full-page spinner
- [ ] Small loading indicators remain inline

### Slow Network (3G Throttle)
- [ ] Skeletons match final content layout
- [ ] No blank white flashes
- [ ] Chrome (header/footer) stays visible throughout

---

## For New Development

### Adding a New Page

1. **Create page skeleton** (if needed):
```tsx
// src/components/skeletons/MyPageSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export function MyPageSkeleton() {
  return (
    <div className="min-h-screen bg-background page-with-header">
      {/* Header area */}
      <div className="pt-[72px] px-4">
        <Skeleton className="h-8 w-48 mb-4" />
      </div>
      
      {/* Content */}
      <div className="px-4 space-y-4">
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
```

2. **Wire to route**:
```tsx
<Route path="/my-page" element={
  <Suspense fallback={<MyPageSkeleton />}>
    <MyPage />
  </Suspense>
} />
```

3. **Use `keepPreviousData` in queries**:
```tsx
const { data } = useQuery({
  queryKey: ['myData', filters],
  queryFn: fetchData,
  keepPreviousData: true,
  staleTime: 5 * 60 * 1000,
});
```

### Adding a Button Action

```tsx
const [isLoading, setIsLoading] = useState(false);

<Button 
  disabled={isLoading}
  onClick={async () => {
    setIsLoading(true);
    await doAction();
    setIsLoading(false);
  }}
>
  {isLoading && <InlineSpinner size="sm" className="mr-2" />}
  Click Me
</Button>
```

---

## Design System Compliance

All loading elements must:

- ✅ Use semantic color tokens (`bg-surface-alt`, `border-primary-accent`)
- ✅ Use typography tokens (`text-body-md`, `text-meta`)
- ✅ Use motion tokens (`duration-motion-fast`, `ease-standard`)
- ✅ Use spacing tokens (`space-y-4`, `gap-3`)
- ❌ Never use direct hex colors
- ❌ Never use pixel-based text sizes
- ❌ Never use custom transitions

---

## Enforcement Rules

### Lint Rules (Future)

To prevent regressions, the following patterns should be flagged:

1. **Deprecated component imports**:
```tsx
// ❌ ERROR: These components no longer exist
import ClbhouzPageSpinner from '...';
import ClubhouzLoading from '...';
import { GlobalLoadingProvider } from '...';
```

2. **Full-screen Suspense fallbacks at route level**:
```tsx
// ❌ ERROR: No full-screen spinners at route level
<Suspense fallback={<div className="fixed inset-0">...</div>}>
```

3. **Direct color values in loading components**:
```tsx
// ❌ ERROR: Use design tokens
<div className="bg-[#ffffff]" />
<div style={{ color: '#000000' }} />
```

### PR Checklist

For PRs that add/modify loading states:

- [ ] Uses only approved loading primitives (`AppBootstrapLoader`, skeletons, `InlineSpinner`)
- [ ] No full-screen spinners for route transitions
- [ ] Skeletons use unified primitives only
- [ ] All loading elements use design tokens
- [ ] React Query uses `keepPreviousData` where appropriate
- [ ] QA tested with slow network throttling

---

## Summary

**Before Phase 8:**
- ❌ Multiple global loading overlays
- ❌ Full-screen spinners between routes
- ❌ Inconsistent loading patterns
- ❌ Chrome hidden during loading

**After Phase 8:**
- ✅ Single `AppBootstrapLoader` for app mount only
- ✅ Route-level skeletons in content area
- ✅ Chrome always visible
- ✅ Inline spinners for micro-actions
- ✅ Consistent, Instagram-like navigation feel

**Result:** Instant page transitions with subtle skeletons where needed, no blocking overlays, predictable UX across the entire app.
