# Architecture Rules & Patterns

This document codifies critical patterns that **must not regress**. Read before modifying related features.

---

## 1. Golf Course Resolution (Played At)

### The Problem
Posts can have golf course associations stored in two places:
- **Preferred**: `posts.course_id` (direct FK to `golf_courses`)
- **Legacy**: `post_tags` where `entity_type === 'golf_club'`

### The Rules

#### ✅ ALWAYS use the canonical helper
```typescript
import { resolveGolfCourse, extractCourseId, collectCourseIds, hasGolfCourseReference } from '@/utils/resolveGolfCourse';
```

#### ✅ ALWAYS include `course_id` in post queries
```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    course_id,  // ← REQUIRED
    post_tags (...)
  `);
```

#### ❌ NEVER use `!inner` on `post_tags`
```typescript
// BAD - excludes posts with course_id but no tags
.select('*, post_tags!inner(...)')

// GOOD - allows posts with either storage pattern
.select('*, post_tags(...)')
```

#### ✅ UI Safety Net
Always show "Played at" row if course reference exists, even if lookup fails:
```typescript
const showGolfCourse = golfCourse || hasGolfCourseReference(post);
```

#### ✅ Dev Warnings
The `resolveGolfCourse` helper logs warnings in development when:
- `post.course_id` exists but course not found in map
- `post_tags` has golf_club but course not found in map

### Files Using This Pattern
- `src/utils/resolveGolfCourse.ts` - The canonical helper
- `src/components/grid/adapters.ts`
- `src/components/shared/grid/adapters.ts`
- `src/hooks/useLongFormVideos.ts`
- `src/hooks/useRelatedLongFormVideos.ts`
- `src/hooks/useTop100Highlights.ts`
- `src/hooks/explore/useRealPostsFetcher.ts`
- `src/components/courses/highlights/LatestHighlights.tsx`
- `src/components/profile/Top100VideoHighlights.tsx`
- `src/components/posts/user-post/*`

---

## 2. Post Music/Audio

### The Problem
Posts can have music associations that need consistent resolution across all views.

### The Rules

#### ✅ ALWAYS include music fields in post queries
```typescript
.select(`
  id,
  music_id,
  music_title,
  music_artist,
  music_cover_url,
  ...
`)
```

#### ✅ Use consistent music resolution
When adapting posts for different views, always map music fields consistently:
```typescript
{
  musicId: post.music_id,
  musicTitle: post.music_title,
  musicArtist: post.music_artist,
  musicCoverUrl: post.music_cover_url,
}
```

#### ❌ NEVER assume music fields exist
Always use optional chaining or nullish coalescing:
```typescript
const hasMusic = post.music_id && post.music_title;
```

---

## 3. General Query Patterns

### ✅ Prefer left joins over inner joins for optional relationships
```typescript
// GOOD - doesn't exclude posts missing the relationship
.select('*, related_table(...)')

// BAD - excludes posts without the relationship
.select('*, related_table!inner(...)')
```

### ✅ Always handle null/undefined in adapters
```typescript
// GOOD
golfCourseId: resolveGolfCourse(post, courseMap)?.id || null

// BAD - assumes data exists
golfCourseId: post.post_tags[0].entity_id
```

### ✅ Collect IDs for batch fetching
```typescript
const courseIds = collectCourseIds(posts);
const { data: courses } = await supabase
  .from('golf_courses')
  .select('*')
  .in('id', courseIds);
```

---

## 4. Regression Prevention Checklist

Before merging changes to post/feed/video features:

- [ ] Does the query include `course_id`?
- [ ] Are `post_tags` joins NOT using `!inner`?
- [ ] Is `resolveGolfCourse` used instead of manual tag parsing?
- [ ] Is `hasGolfCourseReference` used for UI visibility checks?
- [ ] Are music fields included if the view shows music?
- [ ] Do adapters handle null/undefined gracefully?

---

## 5. Adding New Features

When adding new post display features:

1. Use existing adapters in `src/components/grid/adapters.ts`
2. If creating new adapters, import and use `resolveGolfCourse`
3. Include `course_id` in your query SELECT
4. Never filter out posts based on tag existence
5. Test with both old posts (tags only) and new posts (course_id only)
