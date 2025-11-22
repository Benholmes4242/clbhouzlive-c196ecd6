# Clbhouz Loading & Navigation System Audit

**Date:** 2025-11-22  
**Scope:** Full audit of route loading, spinners, skeletons, and page-to-page navigation behavior

---

## Executive Summary

### Current State Overview

- **5 Full-Screen Route Loaders** exist across the app
- **3 Different Loading Patterns** are currently in use:
  1. Full-screen spinners (legacy)
  2. React Suspense with skeletons (modern, preferred)
  3. In-component loading states with spinners
- **GlobalLoadingProvider System** tracks API calls and shows spinners globally
- **Mixed Behavior:** Some routes use skeletons, others use full-screen spinners, creating inconsistent UX

### Routes Using Preferred Pattern (Skeletons)

✅ `/clubhouse` - Uses `ClubhouseSkeleton`  
✅ `/courses` - Uses `CoursesListSkeleton`  
✅ `/courses/:courseId` - Uses `CourseDetailSkeleton`  
✅ `/courses/:courseId/reviews` - Uses `CourseDetailSkeleton`

### Routes Using Legacy Spinners

❌ `/profile/:username` - Uses `ClubhouzLoading` (logo spinner)  
❌ `/auth` - Uses inline spinner during session check  
❌ Global API calls - Triggers `GlobalSpinner` overlay  
❌ Admin routes - Use `AdminLoading` wrapper (logo spinner)

### Routes With No Loading State

⚠️ `/discover` - No skeleton loader  
⚠️ `/tour-central` - No skeleton loader  
⚠️ `/videos` - No skeleton loader  
⚠️ `/news` - No skeleton loader  
⚠️ `/my-ratings` - No skeleton loader  
⚠️ `/notifications` - No skeleton loader  
⚠️ `/messages` - No skeleton loader  
⚠️ `/friends` - No skeleton loader  
⚠️ `/followers` - No skeleton loader  
⚠️ `/following` - No skeleton loader  
⚠️ `/season-shop` - No skeleton loader  
⚠️ `/challenges` - No skeleton loader  
⚠️ All Hub routes (`/hub/*`) - No skeletons

---

## 1. App Entry & Global Loading

### 1.1 Initial Entry Path

**Entry Point:** `src/main.tsx`

```tsx
const root = createRoot(container);
root.render(<App />);
```

- **No top-level Suspense**: App renders immediately
- **No splash screen**: No branded loading screen on cold start
- **Mobile viewport fix**: Applied immediately on load

**First Component:** `src/App.tsx`

```tsx
<GlobalLoadingProvider>
  <BindLoadingBus />
  <Suspense fallback={<ClbhouzPageSpinner />}>
    <AuthWrapper>
      <AppRoutes />
    </AuthWrapper>
  </Suspense>
  <GlobalSpinner />
</GlobalLoadingProvider>
```

### 1.2 First-Page Behavior

#### For Unauthenticated Users

1. **Route:** `/` (redirects to `/clubhouse` or shows Clubhouse content)
2. **Access Control:** `SiteAccessControl` checks for access code
   - Shows: Spinner → "Checking access..." → Access gate form OR app content
3. **Loading Sequence:**
   - `SiteAccessControl` loading state (line 121-130 in `src/components/SiteAccessControl.tsx`)
   - Shows generic spinner with "Checking access..." text
   - Uses: `border-b-2 border-primary` spinner (NOT branded)

#### For Authenticated Users

1. **Route:** `/` → renders `ClubhouseWrapped`
2. **Auth Check:** `AuthWrapper` validates session
   - No visible spinner during this check
   - Session loads silently via `useSupabaseSession`
3. **Initial Load:**
   - If user has no profile → redirect to `/create-profile`
   - If user has profile → show Clubhouse feed

### 1.3 Global Loading Components

#### GlobalLoadingProvider System

**File:** `src/loading/GlobalLoading.tsx`

- **Purpose:** Tracks API calls via `loadingBus`
- **Suppression:** First 800ms suppressed to avoid flash
- **Behavior:** Shows `GlobalSpinner` when `active > 0`

**Integration:**
```tsx
// src/api/fetcher.ts
loadingBus.begin();  // On request start
loadingBus.end();    // On request complete
```

#### GlobalSpinner Component

**File:** `src/loading/GlobalSpinner.tsx`

```tsx
export default function GlobalSpinner() {
  const { loading, suppressUntil } = useGlobalLoading();
  if (!loading || Date.now() <= suppressUntil) return null;
  return <ClbhouzPageSpinner />;
}
```

- **Renders:** `ClbhouzPageSpinner` (green spinner on white/60 backdrop)
- **Z-index:** `z-[9999]` (blocks all interactions)
- **Trigger:** Any API call that uses `fetcher.ts`

---

## 2. Route-Level Loading & Spinners (Page-to-Page Navigation)

### 2.1 Route Transition Matrix

| From Route | To Route | Loading Behavior | Component(s) Used | Notes |
|-----------|----------|------------------|-------------------|-------|
| Any | `/clubhouse` | React Suspense → Skeleton | `ClubhouseSkeleton` | ✅ **Preferred pattern** |
| Any | `/courses` | React Suspense → Skeleton | `CoursesListSkeleton` | ✅ **Preferred pattern** |
| Any | `/courses/:id` | React Suspense → Skeleton | `CourseDetailSkeleton` | ✅ **Preferred pattern** |
| Any | `/profile/:username` | Full-screen logo spinner | `ClubhouzLoading` (via `UserProfileLoader`) | ❌ **Legacy pattern** |
| Any | `/auth` | Inline session check spinner | Inline `<div>` with spinner | ❌ **Legacy pattern** |
| Any | `/discover` | No loading state | None | ⚠️ **Missing skeleton** |
| Any | `/tour-central` | No loading state | None | ⚠️ **Missing skeleton** |
| Any | `/videos` | No loading state | None | ⚠️ **Missing skeleton** |
| Any | `/news` | No loading state | None | ⚠️ **Missing skeleton** |
| Any | `/hub` | Page renders, data loads inline | None | ⚠️ **Missing skeleton** |
| Any | `/hub/*` | Sub-routes render immediately | None | ⚠️ **No route-level loading** |
| Any | `/admin` | AdminLayout + child skeletons | Various admin skeletons | ⚠️ **Inconsistent** |
| Any | `/admin/golf-courses` | Table skeleton | `GolfCoursesLoadingSkeleton` | ✅ Uses new skeleton system |
| Any | `/create-moment` | No skeleton | None | ⚠️ **Page loads instantly** |
| Any | `/courses/:id/rate` | Blank screen fallback | `<div className="fixed inset-0 bg-surface-card" />` | ⚠️ **No skeleton** |
| Global | *any route* (during API call) | Full-screen spinner overlay | `GlobalSpinner` → `ClbhouzPageSpinner` | ❌ **Blocks navigation** |

### 2.2 Suspense Fallback Patterns

**File:** `src/App.tsx` (lines 184-189)

```tsx
{/* Routes with Suspense wrappers */}
<Route path="/clubhouse" element={
  <Suspense fallback={<ClubhouseSkeleton />}>
    <ClubhouseWrapped />
  </Suspense>
} />

<Route path="/courses" element={
  <Suspense fallback={<CoursesListSkeleton />}>
    <Courses />
  </Suspense>
} />

<Route path="/courses/:courseId" element={
  <Suspense fallback={<CourseDetailSkeleton />}>
    <CourseDetailPage />
  </Suspense>
} />

<Route path="/courses/:courseId/rate" element={
  <Suspense fallback={<div className="fixed inset-0 bg-surface-card" />}>
    <RateCoursePage />
  </Suspense>
} />
```

### 2.3 Routes Without Suspense (Instant Render)

The following routes render immediately without any lazy-loading wrapper:

- `/` (ClubhouseWrapped - direct import)
- `/auth` (AuthWrapped - direct import)
- `/profile` (ProfileWrapped - direct import)
- `/profile/:username` (UserProfilePage - lazy, but no Suspense wrapper at route level)
- `/discover` (DiscoverWrapped - direct import)
- `/settings` (SettingsWrapped - direct import)
- `/tour-central` (TourCentral - lazy, no Suspense)
- `/news`, `/videos`, `/season-shop`, `/challenges` (all lazy, no Suspense)
- All `/hub/*` routes (lazy, no Suspense)
- All admin routes (lazy, no Suspense)

**Result:** These pages show previous page content until JavaScript loads, then render instantly.

---

## 3. Loading Components Inventory

### 3.1 Full-Screen Route Loaders

| Component | Path | Type | Used On / In | Color/Style Summary |
|-----------|------|------|-------------|---------------------|
| `ClbhouzPageSpinner` | `src/components/ui/ClbhouzPageSpinner.tsx` | Full-screen route loader | Global Suspense fallback, `GlobalSpinner` | Green spinner (`border-emerald-400`), white/60 backdrop, fixed inset-0, z-[9999] |
| `ClubhouzLoading` | `src/components/ClubhouzLoading.tsx` | Full-screen branded loader | Profile pages (via `UserProfileLoader`), Admin pages | **Logo-based**: Clubhouz logo animating with `animate-pulse` on `bg-background` |
| `AdminLoading` | `src/components/admin/AdminLoading.tsx` | Wrapper | Admin routes | Wrapper for `ClubhouzLoading` |
| `SiteAccessControl` loading | `src/components/SiteAccessControl.tsx` (line 122) | Access gate loader | App entry (before site access granted) | Generic spinner with "Checking access..." text |
| `AccessControl` loading | `src/components/AccessControl.tsx` (line 19) | Auth guard loader | Protected routes | Generic spinner with "Loading..." text |

### 3.2 Page/Section Skeletons (Unified System)

| Component | Path | Type | Used On / In | Status |
|-----------|------|------|-------------|--------|
| `Skeleton` | `src/components/ui/skeleton.tsx` | Base primitive | All skeletons | ✅ **Unified** - `bg-surface-alt`, `rounded-lg`, `animate-pulse` |
| `SkeletonAvatar` | `src/components/ui/skeleton-avatar.tsx` | Avatar primitive | Profile, feed, cards | ✅ **Unified** - Sizes: xs/sm/md/lg/xl |
| `SkeletonText` | `src/components/ui/skeleton-text.tsx` | Text line primitive | All skeletons | ✅ **Unified** - Variants: heading/body/meta |
| `SkeletonCard` | `src/components/ui/skeleton-card.tsx` | Card layout helper | Course cards, feed cards | ✅ **Unified** - `bg-surface-card`, `rounded-2xl` |
| `ProfileSkeleton` | `src/components/skeletons/ProfileSkeleton.tsx` | Page skeleton | Profile page (fallback) | ✅ **Uses unified primitives** |
| `ClubhouseSkeleton` | `src/components/skeletons/ClubhouseSkeleton.tsx` | Page skeleton | `/clubhouse` route | ✅ **Uses unified primitives** |
| `CoursesListSkeleton` | `src/components/skeletons/CoursesListSkeleton.tsx` | Page skeleton | `/courses` route | ✅ **Uses unified primitives** |
| `CourseDetailSkeleton` | `src/components/skeletons/CourseDetailSkeleton.tsx` | Page skeleton | `/courses/:id` route | ✅ **Uses unified primitives** |
| `DiscoverSkeleton` | `src/components/skeletons/DiscoverSkeleton.tsx` | Page skeleton | **Not currently used** | ✅ **Ready** - Uses unified primitives |
| `ShortsSkeleton` | `src/components/skeletons/ShortsSkeleton.tsx` | Page skeleton | **Not currently used** | ✅ **Ready** - Uses unified primitives |
| `TourSkeleton` | `src/components/skeletons/TourSkeleton.tsx` | Page skeleton | **Not currently used** | ✅ **Ready** - Uses unified primitives |
| `StoryBarSkeleton` | `src/components/StoryBar/StoryBarSkeleton.tsx` | Section skeleton | Story bar component | ✅ **Uses unified primitives** |
| `LoadingSkeleton` | `src/components/feed/LoadingSkeleton.tsx` | Feed skeleton | Feed components | ✅ **Uses unified primitives** |
| `GolfCoursesLoadingSkeleton` | `src/components/admin/golf-courses/GolfCoursesLoadingSkeleton.tsx` | Admin table skeleton | Admin golf courses page | ✅ **Uses unified primitives** |
| `NearbySkeletonRow` | `src/features/nearby/components/NearbySkeletonRow.tsx` | Game list skeleton | Nearby games list | ✅ **Uses unified primitives + dark tokens** |
| `YourGamesSkeleton` | `src/features/nearby/components/your-games/YourGamesSkeleton.tsx` | Your games skeleton | Your games section | ✅ **Uses unified primitives + dark tokens** |

### 3.3 Inline / Special-Purpose Loaders

| Component | Path | Type | Used On / In | Color/Style Summary |
|-----------|------|------|-------------|---------------------|
| `SwingAnalysisLoader` | `src/components/ai-chat/SwingAnalysisLoader.tsx` | Inline animated loader | Echo swing analysis | **Teal spinner** (`border-[#2A9D8F]`) with cycling analysis steps, custom card layout |
| `SkeletonRow` | `src/components/ui/SkeletonRow.tsx` | Horizontal scroll skeleton | Course carousels | ✅ **Uses unified** - `bg-muted animate-pulse` |
| `UserProfileLoader` | `src/components/profile/UserProfileLoader.tsx` | Conditional wrapper | User profile pages | Renders `ClubhouzLoading` if loading, error state if no profile |

### 3.4 Legacy/Removed Components

These were cleaned up during Phase 7 skeleton unification:

- ❌ `src/components/ui/skeleton-loader.tsx` (deleted)
- ❌ `src/components/ui/profile-skeleton.tsx` (deleted)
- ❌ `src/components/profile/ProfileSkeleton.tsx` (deleted - duplicate)

---

## 4. Skeleton vs Spinner - How They Interact

### 4.1 Current Behavior by Page Type

#### Pages Using Skeletons Only (✅ Preferred)

| Page | First Load | Subsequent Navigation | Refetch/Reload |
|------|-----------|----------------------|----------------|
| `/clubhouse` | Shows `ClubhouseSkeleton` via Suspense | Suspense fallback | Previous content visible, new data loads inline |
| `/courses` | Shows `CoursesListSkeleton` via Suspense | Suspense fallback | React Query keeps previous data visible |
| `/courses/:id` | Shows `CourseDetailSkeleton` via Suspense | Suspense fallback | React Query keeps previous data visible |

**Behavior:** Clean, instant navigation → skeleton → content. No full-screen spinners.

#### Pages Using Full-Screen Spinners (❌ Legacy)

| Page | First Load | Subsequent Navigation | Refetch/Reload |
|------|-----------|----------------------|----------------|
| `/profile/:username` | Shows `ClubhouzLoading` (logo spinner) | Logo spinner on each navigation | Logo spinner during data fetch |

**File:** `src/components/profile/UserProfileLoader.tsx` (line 13-14)

```tsx
if (isLoading) {
  return <ClubhouzLoading />;
}
```

**Behavior:** Full-screen logo spinner blocks entire page. Harsh transition.

#### Pages With No Loading State (⚠️ Missing Skeletons)

| Page | First Load | Subsequent Navigation | Refetch/Reload |
|------|-----------|----------------------|----------------|
| `/discover` | Page shell renders, content pops in | Instant render | Flash of empty state |
| `/tour-central` | Page shell renders, tabs load | Instant render | Content replaces inline |
| `/videos` | Page shell renders, grid loads | Instant render | Content replaces inline |
| `/hub` (all routes) | Page renders, data loads inline | Instant render | No loading indication |

**Behavior:** Page structure appears instantly, content loads asynchronously without visual feedback.

### 4.2 Global Spinner Interference

**Problem:** `GlobalSpinner` (via `GlobalLoadingProvider`) can appear **on top of** page skeletons during API calls.

**Example Flow:**
1. User navigates to `/courses`
2. Suspense shows `CoursesListSkeleton`
3. Course list API call triggers `loadingBus.begin()`
4. `GlobalSpinner` (green spinner) appears as overlay
5. Both skeleton AND spinner visible simultaneously

**File:** `src/api/fetcher.ts`

```tsx
export async function fetcher(url: string) {
  loadingBus.begin();  // Triggers GlobalSpinner
  try {
    const res = await fetch(url);
    return res.json();
  } finally {
    loadingBus.end();
  }
}
```

**Result:** Inconsistent UX - sometimes see skeleton, sometimes see spinner, sometimes both.

### 4.3 Pages Where Spinner Appears Instead of Skeleton

| Route | Reason | Component | Fix Needed |
|-------|--------|-----------|-----------|
| `/profile/:username` | Custom loading logic in page | `ClubhouzLoading` | Replace with ProfileSkeleton |
| `/auth` | Session check uses inline spinner | Custom div | Add AuthSkeleton or use instant render |
| During API calls (any page) | `GlobalLoadingProvider` active | `GlobalSpinner` | Remove GlobalSpinner system |

---

## 5. Special Cases & Edge States

### 5.1 Auth / Protected Routes

#### Site Access Control

**File:** `src/components/SiteAccessControl.tsx`

```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );
}
```

**Behavior:** Full-screen spinner on cold start before user can access any content.

#### User Authentication Check

**File:** `src/components/AccessControl.tsx`

```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

**Behavior:** Generic spinner during session validation. Blocks access to protected routes.

#### Admin Route Protection

**File:** `src/features/admin/components/AdminGuard.tsx`

```tsx
if (isLoading) return null;  // Render nothing during admin check
if (!isAdmin) return <Navigate to="/" replace />;
```

**Behavior:** Silent loading (no spinner), then redirect if not admin.

### 5.2 Error → Retry Flows

**No global error boundary with retry spinner.** Errors handled per-component.

Examples:
- Course detail: Shows error message inline, no spinner on retry
- AI Chat: Shows error state, retry triggers new request (no dedicated spinner)
- Profile: `UserProfileLoader` shows "User not found" message (no retry flow)

### 5.3 Mobile vs Desktop Differences

**No significant differences found.** Loading behavior is identical across breakpoints.

**Minor responsive notes:**
- Spinners are centered and sized consistently
- Skeletons adapt to screen width but show same pattern
- No mobile-specific loading components

### 5.4 Hub Overlay Navigation

**Hub routes render as overlays** when navigated to via Hub context:

```tsx
// src/App.tsx (line 158)
const showHubOverlay = isHubRoute && !!state?.backgroundLocation;
```

**Loading Behavior:**
- Hub pages render instantly (no Suspense wrapper)
- Data loads inline without skeleton
- Background page remains visible during Hub load

**Result:** No loading state for Hub navigation - instant overlay appearance.

### 5.5 Create Moment Page (ECM)

**Route:** `/create-moment`

**Loading:** No route-level loading state. Page renders instantly.

**Data dependencies:** Form state only, no API data on mount.

### 5.6 Rate Course Page

**Route:** `/courses/:courseId/rate`

**Suspense Fallback:** `<div className="fixed inset-0 bg-surface-card" />`

**Issue:** Blank screen instead of skeleton. Should use a proper skeleton.

---

## 6. Detailed Route Loading Patterns

### 6.1 High-Traffic Routes

#### `/clubhouse` (Home Feed)

**Pattern:** ✅ **React Suspense → Skeleton → Content**

```tsx
<Suspense fallback={<ClubhouseSkeleton />}>
  <ClubhouseWrapped />
</Suspense>
```

**Loading Sequence:**
1. User navigates to `/clubhouse`
2. React Suspense catches lazy-loaded component
3. `ClubhouseSkeleton` renders (full page layout with pulsing cards)
4. Component loads → skeleton fades out → real content fades in
5. No global spinner interference (unless API call triggers `GlobalSpinner`)

**Files:**
- Route: `src/App.tsx` (line 184)
- Page: `src/pages/ClubhouseWrapped.tsx`
- Skeleton: `src/components/skeletons/ClubhouseSkeleton.tsx`

#### `/courses` (Courses List)

**Pattern:** ✅ **React Suspense → Skeleton → Content**

```tsx
<Suspense fallback={<CoursesListSkeleton />}>
  <Courses />
</Suspense>
```

**Loading Sequence:**
1. User navigates to `/courses`
2. `CoursesListSkeleton` shows grid of card skeletons
3. React Query fetches course data
4. Skeleton replaced with course cards
5. Tabs/filters load inline

**Files:**
- Route: `src/App.tsx` (line 186)
- Page: `src/pages/Courses.tsx`
- Skeleton: `src/components/skeletons/CoursesListSkeleton.tsx`

#### `/courses/:courseId` (Course Detail)

**Pattern:** ✅ **React Suspense → Skeleton → Content**

```tsx
<Suspense fallback={<CourseDetailSkeleton />}>
  <CourseDetailPage />
</Suspense>
```

**Loading Sequence:**
1. User clicks course card
2. Navigation to `/courses/:courseId`
3. `CourseDetailSkeleton` shows hero image placeholder + content bars
4. React Query fetches course data + ratings
5. Skeleton replaced with real course detail

**Files:**
- Route: `src/App.tsx` (line 187)
- Page: `src/pages/CourseDetailPage.tsx`
- Skeleton: `src/components/skeletons/CourseDetailSkeleton.tsx`

#### `/profile/:username` (User Profile)

**Pattern:** ❌ **Instant Render → Logo Spinner → Content**

```tsx
// No Suspense wrapper at route level
<Route path="/profile/:username" element={<UserProfilePage />} />
```

**Loading Sequence:**
1. User navigates to profile
2. Page component renders immediately
3. `useUserProfileQueries` hook returns `isLoading: true`
4. `UserProfileLoader` shows `ClubhouzLoading` (logo spinner)
5. Query completes → logo fades out → profile content appears

**Files:**
- Route: `src/App.tsx` (line 181)
- Page: `src/pages/UserProfilePage.tsx`
- Loader: `src/components/profile/UserProfileLoader.tsx` (line 13)

**Problem:** Uses legacy logo spinner instead of skeleton. Should match courses pattern.

#### `/discover` (Discover Feed)

**Pattern:** ⚠️ **Instant Render → No Loading State**

```tsx
// No Suspense, direct import
<Route path="/discover" element={<DiscoverWrapped />} />
```

**Loading Sequence:**
1. User navigates to `/discover`
2. Page shell renders instantly (header, tabs)
3. Content (shorts grid, videos) loads asynchronously
4. Content pops in when ready
5. No skeleton → flash of empty state

**Files:**
- Route: `src/App.tsx` (line 185)
- Page: `src/pages/DiscoverWrapped.tsx` → `src/pages/Discover.tsx`

**Problem:** No skeleton loader. Should add `DiscoverSkeleton` (already created but not wired).

#### `/hub` (Hub Overlay)

**Pattern:** ⚠️ **Instant Render → Inline Data Loading**

```tsx
// Lazy-loaded, no Suspense wrapper
const HubHomePage = lazy(() => import("./features/hub/pages/HubHomePage"));
```

**Loading Sequence:**
1. User clicks Hub icon in bottom nav
2. `useHub().open()` navigates with `backgroundLocation`
3. Hub overlay slides up instantly
4. Data (golfers, games, etc.) loads inline
5. No skeleton → content pops in

**Files:**
- Route: `src/App.tsx` (line 270)
- Page: `src/features/hub/pages/HubHomePage.tsx`

**Problem:** No route-level loading indication. Hub should have skeletons for each sub-page.

### 6.2 Secondary Routes

| Route | Pattern | Has Skeleton? | Notes |
|-------|---------|---------------|-------|
| `/tour-central` | Instant render | ❌ No | Page shell loads, tabs load inline |
| `/news` | Instant render | ❌ No | News cards load asynchronously |
| `/videos` | Instant render | ❌ No | Video grid loads asynchronously |
| `/season-shop` | Instant render | ❌ No | Shop items load inline |
| `/challenges` | Instant render | ❌ No | Challenge cards load inline |
| `/messages` | Instant render | ❌ No | Message list loads inline |
| `/notifications` | Instant render | ❌ No | Notification list loads inline |
| `/friends` | Instant render | ❌ No | Friends list loads inline |
| `/my-ratings` | Instant render | ❌ No | Ratings list loads inline |

**Common Pattern:** All secondary routes render page structure instantly, data loads asynchronously without visual feedback.

---

## 7. Key Findings & Issues

### 7.1 Critical Issues

#### Issue 1: GlobalSpinner Conflicts With Skeletons

**Problem:** `GlobalSpinner` can appear on top of route skeletons during API calls.

**Root Cause:** `loadingBus` (in `src/api/fetcher.ts`) triggers global spinner for ALL API calls.

**Impact:** Inconsistent UX - users see skeleton → spinner → content OR just spinner → content.

**Fix Required:** Remove `GlobalSpinner` system entirely. Let React Query + route skeletons handle all loading states.

#### Issue 2: Inconsistent Loading Patterns Across Routes

**Problem:** Some routes use skeletons, others use logo spinners, many have no loading state.

**Examples:**
- ✅ `/courses` → Skeleton (good)
- ❌ `/profile/:username` → Logo spinner (legacy)
- ⚠️ `/discover` → Nothing (bad)

**Impact:** Unpredictable UX. Users don't know what to expect during navigation.

**Fix Required:** Standardize ALL routes to use: **Instant navigation → Skeleton → Content**

#### Issue 3: Logo Spinner Blocks Interaction

**Problem:** `ClubhouzLoading` is full-screen and blocks all user interaction.

**Files:**
- `src/components/ClubhouzLoading.tsx`
- Used by: `UserProfileLoader`, `AdminLoading`

**Impact:** User can't cancel navigation or interact with page while loading.

**Fix Required:** Replace with page skeletons that maintain page structure.

### 7.2 Secondary Issues

#### Issue 4: Hub Routes Have No Loading State

**Problem:** All `/hub/*` routes render instantly with no skeleton feedback.

**Impact:** Content pops in abruptly. No visual continuity during data fetch.

**Fix Required:** Add skeletons for Hub sub-pages (golfers, games, echo, etc.).

#### Issue 5: Auth/Access Guards Use Legacy Spinners

**Problem:** `SiteAccessControl` and `AccessControl` use ad-hoc spinner divs.

**Files:**
- `src/components/SiteAccessControl.tsx` (line 122)
- `src/components/AccessControl.tsx` (line 19)

**Impact:** Inconsistent with unified skeleton system.

**Fix Required:** Create lightweight skeletons for auth states OR make auth checks silent.

#### Issue 6: "Rate Course" Page Has Blank Fallback

**Problem:** `/courses/:courseId/rate` uses empty div as Suspense fallback.

```tsx
<Suspense fallback={<div className="fixed inset-0 bg-surface-card" />}>
```

**Impact:** Blank screen flash during load.

**Fix Required:** Create `RateCourseSkeleton` showing form layout.

### 7.3 Missing Skeletons (Created But Not Wired)

These skeletons exist but are not used:

- ✅ `DiscoverSkeleton` - Ready, not wired to `/discover` route
- ✅ `ShortsSkeleton` - Ready, not used (Discover handles shorts internally)
- ✅ `TourSkeleton` - Ready, not wired to `/tour-central` route

---

## 8. Recommendations

### 8.1 Immediate Actions (Phase 1)

#### 1. Remove GlobalSpinner System

**Files to modify:**
- `src/App.tsx` - Remove `<GlobalSpinner />` and `<GlobalLoadingProvider>`
- `src/loading/GlobalSpinner.tsx` - Delete file
- `src/loading/GlobalLoading.tsx` - Delete file
- `src/loading/BindLoadingBus.tsx` - Delete file
- `src/api/loadingBus.ts` - Delete file
- `src/api/fetcher.ts` - Remove `loadingBus.begin()` / `loadingBus.end()` calls

**Rationale:** Conflicts with React Suspense + skeletons. React Query handles loading states better.

#### 2. Replace Logo Spinners With Skeletons

**Files to modify:**
- `src/components/profile/UserProfileLoader.tsx` - Use `ProfileSkeleton` instead of `ClubhouzLoading`
- `src/components/admin/AdminLoading.tsx` - Create admin-specific skeletons

**Files to deprecate:**
- `src/components/ClubhouzLoading.tsx` - Delete (no longer needed)

**Rationale:** Logo spinners block interaction and feel slow. Skeletons maintain page structure.

#### 3. Wire Existing Skeletons to Routes

**Routes to update in `src/App.tsx`:**

```tsx
// Add Suspense wrappers
<Route path="/discover" element={
  <Suspense fallback={<DiscoverSkeleton />}>
    <DiscoverWrapped />
  </Suspense>
} />

<Route path="/tour-central" element={
  <Suspense fallback={<TourSkeleton />}>
    <TourCentral />
  </Suspense>
} />

<Route path="/profile/:username" element={
  <Suspense fallback={<ProfileSkeleton />}>
    <UserProfilePage />
  </Suspense>
} />
```

**Rationale:** Skeletons already exist and follow unified system. Just need to wire them.

### 8.2 Short-Term Actions (Phase 2)

#### 4. Add Skeletons for Missing Routes

**Routes needing skeletons:**
- `/videos` - Create `VideosSkeleton` (grid of video cards)
- `/news` - Create `NewsSkeleton` (list of news cards)
- `/season-shop` - Create `ShopSkeleton` (grid of shop items)
- `/challenges` - Create `ChallengesSkeleton` (list of challenge cards)
- `/messages` - Create `MessagesSkeleton` (chat list layout)
- `/notifications` - Create `NotificationsSkeleton` (notification list)
- `/friends` - Create `FriendsSkeleton` (user list)

**Pattern:** All should use `SkeletonCard` + `SkeletonAvatar` + `SkeletonText` primitives.

#### 5. Add Hub Sub-Page Skeletons

**Routes needing skeletons:**
- `/hub` - `HubHomeSkeleton` (hero + quick actions grid)
- `/hub/golfers` - `HubGolfersSkeleton` (user list)
- `/hub/games` - `HubGamesSkeleton` (game cards)
- `/hub/echo` - `HubEchoSkeleton` (chat interface)

**Pattern:** Use dark theme tokens (`bg-white/08` on Hub's dark background).

#### 6. Update Auth Guards to Use Skeletons

**Options:**
1. Silent auth (no loading state) - **Recommended** for fast checks
2. Minimal skeleton - For slow auth checks only

**Recommendation:** Make `SiteAccessControl` and `AccessControl` silent unless auth check takes >500ms.

### 8.3 Long-Term Actions (Phase 3)

#### 7. Transition to Optimistic Navigation

**Goal:** Never show loading spinners during route transitions.

**Implementation:**
- Use React Query's `keepPreviousData` option
- Show new route's skeleton immediately
- Fade out previous content → fade in skeleton → fade in new content
- No flash of white/empty state

#### 8. Add Skeleton Fade Transitions

**Goal:** Smooth fade between skeleton and real content.

**Implementation:**
- Add `transition-opacity duration-300` to skeleton containers
- Add `animate-fadeIn` to content containers
- Coordinate exit/enter animations

#### 9. Preload Route Components

**Goal:** Eliminate Suspense delay for frequently navigated routes.

**Implementation:**
- Preload lazy components on hover/focus of navigation links
- Use `<link rel="prefetch">` for critical routes
- Cache route components in service worker

---

## 9. Implementation Priority Matrix

| Priority | Action | Impact | Effort | Files Affected |
|----------|--------|--------|--------|----------------|
| **P0** | Remove GlobalSpinner system | **High** - Eliminates spinner conflicts | **Low** - Delete 4 files | 6 files |
| **P0** | Replace logo spinners with skeletons | **High** - Consistent UX | **Low** - Update 2 components | 3 files |
| **P0** | Wire existing skeletons to routes | **High** - Instant visual improvement | **Low** - Update App.tsx | 1 file |
| **P1** | Add skeletons for missing routes | **Medium** - Complete coverage | **Medium** - Create 7 skeletons | 7 new files |
| **P1** | Add Hub sub-page skeletons | **Medium** - Hub consistency | **Medium** - Create 4 skeletons | 4 new files |
| **P2** | Silent auth guards | **Low** - Minor UX improvement | **Low** - Update 2 guards | 2 files |
| **P2** | Optimistic navigation | **High** - Best-in-class UX | **High** - Refactor data fetching | Many files |
| **P3** | Skeleton fade transitions | **Low** - Polish | **Medium** - Add animation classes | CSS + components |

---

## 10. Example Implementation: Remove GlobalSpinner

### Before (Current State)

```tsx
// src/App.tsx
<GlobalLoadingProvider>
  <BindLoadingBus />
  <AuthWrapper>
    <AppRoutes />
  </AuthWrapper>
  <GlobalSpinner />  {/* ❌ Remove this */}
</GlobalLoadingProvider>
```

```tsx
// src/api/fetcher.ts
export async function fetcher(url: string) {
  loadingBus.begin();  // ❌ Remove
  try {
    const res = await fetch(url);
    return res.json();
  } finally {
    loadingBus.end();  // ❌ Remove
  }
}
```

### After (Proposed State)

```tsx
// src/App.tsx
<AuthWrapper>
  <AppRoutes />
</AuthWrapper>
// No GlobalLoadingProvider, no GlobalSpinner
```

```tsx
// src/api/fetcher.ts
export async function fetcher(url: string) {
  const res = await fetch(url);
  return res.json();
}
// React Query handles loading states
```

**Result:** Clean, predictable loading. Only route skeletons appear during navigation.

---

## Appendix: Complete File Structure

### Loading-Related Files (Current)

```
src/
├── loading/
│   ├── GlobalLoading.tsx          ❌ Remove (Phase 1)
│   ├── GlobalSpinner.tsx          ❌ Remove (Phase 1)
│   └── BindLoadingBus.tsx         ❌ Remove (Phase 1)
├── api/
│   ├── loadingBus.ts              ❌ Remove (Phase 1)
│   └── fetcher.ts                 ✏️ Update (remove loadingBus)
├── components/
│   ├── ClubhouzLoading.tsx        ❌ Remove (Phase 1)
│   ├── ui/
│   │   ├── ClbhouzPageSpinner.tsx ❌ Remove (Phase 1)
│   │   ├── skeleton.tsx           ✅ Keep (base primitive)
│   │   ├── skeleton-avatar.tsx    ✅ Keep (primitive)
│   │   ├── skeleton-text.tsx      ✅ Keep (primitive)
│   │   ├── skeleton-card.tsx      ✅ Keep (primitive)
│   │   └── SkeletonRow.tsx        ✅ Keep (carousel skeleton)
│   ├── skeletons/
│   │   ├── ProfileSkeleton.tsx    ✅ Keep + wire to route
│   │   ├── ClubhouseSkeleton.tsx  ✅ Keep (already wired)
│   │   ├── CoursesListSkeleton.tsx ✅ Keep (already wired)
│   │   ├── CourseDetailSkeleton.tsx ✅ Keep (already wired)
│   │   ├── DiscoverSkeleton.tsx   ✅ Keep + wire to route
│   │   ├── ShortsSkeleton.tsx     ✅ Keep (ready)
│   │   └── TourSkeleton.tsx       ✅ Keep + wire to route
│   ├── profile/
│   │   └── UserProfileLoader.tsx  ✏️ Update (use skeleton)
│   ├── admin/
│   │   └── AdminLoading.tsx       ✏️ Update (use skeleton)
│   ├── feed/
│   │   └── LoadingSkeleton.tsx    ✅ Keep
│   ├── StoryBar/
│   │   └── StoryBarSkeleton.tsx   ✅ Keep
│   └── ai-chat/
│       └── SwingAnalysisLoader.tsx ✅ Keep (special case)
├── features/
│   └── nearby/
│       └── components/
│           ├── NearbySkeletonRow.tsx     ✅ Keep
│           └── your-games/
│               └── YourGamesSkeleton.tsx  ✅ Keep
```

### Skeletons to Create (Phase 2)

```
src/components/skeletons/
├── VideosSkeleton.tsx          📝 Create
├── NewsSkeleton.tsx            📝 Create
├── ShopSkeleton.tsx            📝 Create
├── ChallengesSkeleton.tsx      📝 Create
├── MessagesSkeleton.tsx        📝 Create
├── NotificationsSkeleton.tsx   📝 Create
├── FriendsSkeleton.tsx         📝 Create
├── HubHomeSkeleton.tsx         📝 Create
├── HubGolfersSkeleton.tsx      📝 Create
├── HubGamesSkeleton.tsx        📝 Create
└── HubEchoSkeleton.tsx         📝 Create
```

---

## Summary

**Current State:**
- **Mixed loading patterns**: Spinners, skeletons, and no loading states coexist
- **GlobalSpinner conflicts** with route skeletons
- **4 routes using skeletons** (good), **1 using logo spinner** (bad), **15+ with no loading state** (needs work)

**Ideal State:**
- **One pattern**: Instant navigation → route skeleton → content
- **No global spinner**: React Query + Suspense handle all loading
- **100% skeleton coverage**: Every route has a skeleton loader
- **Smooth transitions**: Fade between skeleton and content

**Effort Required:**
- **Phase 1 (P0):** ~2-3 hours - Remove GlobalSpinner, wire existing skeletons
- **Phase 2 (P1):** ~4-6 hours - Create missing skeletons
- **Phase 3 (P2-P3):** ~8-10 hours - Optimistic navigation + polish

**Next Steps:**
1. Review this audit with the team
2. Approve Phase 1 implementation plan
3. Execute Phase 1 changes
4. Test navigation across all routes
5. Measure perceived performance improvement
6. Plan Phase 2 skeleton creation

---

**End of Audit**
