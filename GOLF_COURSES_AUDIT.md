# Golf Courses & Top 100 Ecosystem - Complete Technical Audit

**Date:** 2025-01-16  
**Audited by:** Lovable AI Development Team  
**Project:** Clubhouse Golf - TripAdvisor for Golf  

---

## Executive Summary

This document provides a comprehensive technical audit of all golf course-related features in the Clubhouse Golf application, covering data architecture, UI implementations, admin tools, performance considerations, and recommendations for the upcoming redesign.

**Key Findings:**
- **14,000+ golf courses** managed across multiple regional Top 100 lists
- **Hybrid data storage**: User course interactions split between `user_top100_courses` and `course_ratings` tables
- **Mock data present**: Community score breakdowns, leaderboard data, and video moments
- **Performance concerns**: Some queries fetch large datasets without pagination
- **Hard-coded logic**: Regional filters and Top 100 lists require code changes to extend

---

## Table of Contents

1. [Data Model & Architecture](#1-data-model--architecture)
2. [Courses Explore Page](#2-courses-explore-page)
3. [Global Top 100 Hub](#3-global-top-100-hub)
4. [Profile → Courses Tab](#4-profile--courses-tab)
5. [Individual Course Page](#5-individual-course-page)
6. [Admin Console → Golf Courses](#6-admin-console--golf-courses)
7. [Admin Console → Create/Edit Course](#7-admin-console--createedit-course)
8. [Tagging, Media & Posts](#8-tagging-media--posts)
9. [Ratings, Reviews & XP Logic](#9-ratings-reviews--xp-logic)
10. [Performance, Tech Debt & Known Issues](#10-performance-tech-debt--known-issues)
11. [Recommendations](#11-recommendations)

---

## 1. Data Model & Architecture

### 1.1 Core Tables & Relationships

#### **`golf_courses`** (Primary Table)
Main table storing all golf course data.

**Key Columns:**
- `id` (uuid, PK)
- `name` (text, required)
- `description` (text, nullable)
- `country` (text, required) - Primary country assignment
- `sub_country` (text, nullable) - State/province
- `region` (text, nullable) - Additional region info
- `continent` (enum: europe, north_america, etc.)
- `global_rank` (integer, nullable) - Global Top 100 ranking (1-100)
- `regional_rank` (integer, nullable) - Regional Top 100 ranking (1-100)
- `usa_rank` (integer, nullable) - USA-specific ranking
- `country_rank` (integer, nullable) - Country-level ranking
- `latitude` (numeric, nullable)
- `longitude` (numeric, nullable)
- `thumbnail_image` (text, nullable) - Featured image URL
- `website_url` (text, nullable)
- `top100_url` (text, nullable)
- `created_at`, `updated_at` (timestamps)

**Foreign Keys:** None (standalone table)

**RLS Policies:**
- Public read access (all users can view courses)
- No user write access (admin-only via service role)

**Indexes:**
- Primary key on `id`
- Likely indexes on ranking columns (global_rank, regional_rank)
- No confirmed full-text search index on `name`

#### **`user_top100_courses`**
Tracks which courses users have played (legacy/primary method).

**Key Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, required)
- `course_id` (uuid, FK → `golf_courses.id`)
- `played` (boolean, default false)
- `played_date` (timestamp, nullable)
- `created_at`, `updated_at`

**Relationships:**
- One-to-many from `golf_courses`
- One-to-many from users (via `user_id`)

**RLS Policies:**
- Users can read/write their own entries
- `auth.uid() = user_id` pattern

#### **`course_ratings`**
Stores user ratings and reviews for courses.

**Key Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, required)
- `course_id` (uuid, FK → `golf_courses.id`)
- `rating` (numeric, required) - Scale 0.5-10
- `review` (text, nullable)
- `review_date` (timestamp, default now())
- `helpful_count` (integer, default 0)
- `unhelpful_count` (integer, default 0)
- `created_at`, `updated_at`

**Relationships:**
- One-to-many from `golf_courses`
- One-to-many from users

**RLS Policies:**
- Public read (anyone can view ratings)
- Users can create/update/delete their own ratings
- Constraint: Users can only rate courses they've played (enforced via policy checking `user_top100_courses.played = true`)

**Important Note:** Creating a rating automatically implies the course is "played" - system treats rated courses as played even without explicit `user_top100_courses` entry.

#### **`course_review_media`**
Media attachments for course reviews.

**Key Columns:**
- `id` (uuid, PK)
- `review_id` (uuid, FK → `course_ratings.id`)
- `media_url` (text, required)
- `media_type` (text, required: 'image' or 'video')
- `file_name` (text, nullable)
- `poster_url` (text, nullable) - Video thumbnail
- `stream_id` (text, nullable) - Cloudflare Stream ID
- `file_size` (integer, nullable)
- `created_at`

**Relationships:**
- One-to-many from `course_ratings`

**RLS Policies:**
- Public read
- Users can create media for their own reviews
- Users can delete their own review media

#### **`user_top_ten_lists`**
Stores each user's personal Top 10 courses.

**Key Columns:**
- `user_id` (uuid, PK) - One list per user
- `courses` (jsonb) - Array of course objects with position
- `updated_at`, `created_at`

**Structure of `courses` JSONB:**
```json
[
  {
    "id": "course-uuid",
    "name": "Course Name",
    "country": "USA",
    "region": "...",
    "global_rank": 5,
    "regional_rank": 2,
    // ... other course fields
  },
  undefined, // Empty slot
  {...}, // Another course
  // ... up to 10 total
]
```

**RLS Policies:**
- Users can read their own list
- Users can upsert their own list
- Others can read public lists (via profile views)

#### **`taggable_entities`** & **`post_tags`**
Links posts to courses and other entities.

**`taggable_entities`:**
- `id` (uuid, PK)
- `entity_type` (text: 'golf_course', 'user', etc.)
- `entity_id` (uuid) - References actual entity
- `name` (text)
- `username` (text, nullable)

**`post_tags`:**
- `id` (uuid, PK)
- `post_id` (uuid, FK → `posts.id`)
- `tagged_entity_id` (uuid, FK → `taggable_entities.id`)
- `tagged_by_user_id` (uuid)

When a user tags a course in a post, an entry is created in `post_tags` linking the post to the course's `taggable_entities` record.

#### **`course_rating_stats`** (View)
Materialized or computed view providing aggregate stats.

**Columns:**
- `course_id` (uuid)
- `average_rating` (numeric)
- `total_ratings` (bigint)
- `total_reviews` (bigint)

Derived from `course_ratings` table via aggregation.

### 1.2 Data Integrity & Constraints

**Soft Deletes:** No soft-delete mechanism currently implemented. Courses are not intended to be deleted once created.

**Duplicate Prevention:** No unique constraint on course names. Duplicates possible if admin creates them manually.

**Region/Country Enforcement:**
- Primary countries are **hardcoded** in admin form:
  - `Britain & Ireland`
  - `Continental Europe`
  - `USA`
  - `Rest of World`
- Sub-countries are **hardcoded** per primary country (e.g., all US states)
- `continent` field uses ENUM type (database-enforced)
- No relational tables for countries/regions - all text fields

**Ranking Constraints:**
- No database-level uniqueness constraint on rankings within a list
- Duplicate rankings are technically possible
- Admin UI validation prevents duplicates during edit
- Orphaned rankings possible if course deleted

### 1.3 Top 100 Data Structure

**Multiple Top 100 Lists Supported:**
1. **Global Top 100** - `global_rank` (1-100)
2. **GB&I Top 100** - `regional_rank` where `country = 'Britain & Ireland'`
3. **USA Top 100** - `regional_rank` where `country = 'USA'`
4. **Continental Europe Top 100** - `regional_rank` where `country = 'Continental Europe'`

**How it works:**
- A course can be in multiple lists simultaneously
- `global_rank` is independent
- `regional_rank` is context-dependent (filtered by `country` field)
- A course ranked #5 Global might also be #2 GB&I

**Limitations:**
- Cannot easily add new Top 100 lists (e.g., "Asia Top 100") without code changes
- Hardcoded filtering logic in multiple components
- No dedicated `top100_lists` table - all inline in `golf_courses`

### 1.4 User-Course Relationships

**How "played" status is tracked:**

1. **Primary method**: `user_top100_courses` table
   - Explicit `played = true` flag
   - `played_date` timestamp
   
2. **Implicit method**: `course_ratings` table
   - Any course with a rating is considered played
   - `review_date` or `created_at` serves as played date

**Queries must combine both sources** to get accurate "played" counts. Most hooks use:
```typescript
const playedCourses = [
  ...user_top100_courses (where played=true),
  ...course_ratings (any rating)
].uniqueBy(course_id)
```

**Top 10 Courses:**
- Stored in `user_top_ten_lists.courses` JSONB array
- 10 fixed slots (can contain `undefined` for empty slots)
- Managed via `useUserTopTen` hook
- Supports drag-and-drop reordering

**XP / Progress Calculation:**
```typescript
// For each region (GB&I, USA, Europe, Worldwide):
const progress = {
  played: count(user played courses in region),
  total: count(all courses with rank in region)
}

// XP = played * 110 points per course
```

**Current XP Logic:**
- Each course played = 110 XP
- No bonus for ratings, reviews, or Top 100 courses
- XP aggregated per region and globally
- Displayed as rings/circles in UI (e.g., "21/100")

### 1.5 Indexes & Performance

**Confirmed Indexes:**
- Primary keys on all tables
- Foreign keys likely auto-indexed
- Ranking columns likely indexed for sorting

**Missing/Needed Indexes:**
- **Full-text search on `golf_courses.name`** - Currently using `ILIKE` which is slow
- **Composite index on `(country, regional_rank)`** - For regional list queries
- **Index on `golf_courses.global_rank`** - For Global Top 100 sorting

**Performance Observations:**
- Queries fetching 14,000+ courses without pagination
- Some components load all courses client-side then filter
- No reported slow query issues yet, but risk at scale

---

## 2. Courses Explore Page (Map Pin)

**Route:** `/courses`  
**Component:** `src/pages/Courses.tsx` → `CoursesContent.tsx` → `CourseExplorer.tsx`

### 2.1 Data Source & Query

**API:** Direct Supabase query from `CourseExplorer.tsx`

```typescript
const { data: courses = [] } = useQuery({
  queryKey: ['courses', selectedRegion],
  queryFn: async () => {
    let query = supabase.from('golf_courses').select('*');
    
    if (selectedRegion === 'all') {
      query = query.order('created_at', { ascending: false });
    } else if (selectedRegion === 'britain-ireland') {
      query = query
        .eq('country', 'Britain & Ireland')
        .not('regional_rank', 'is', null)
        .order('regional_rank', { ascending: true });
    } 
    // ... similar for USA, Europe, Global
    
    return query;
  }
});
```

**Load Strategy:**
- Fetches **all courses** for selected region in one query
- No pagination
- No limit clause
- Client-side search filtering after fetch

**Sort Order:**
- **All Courses**: `created_at DESC` (newest first)
- **Regional lists**: `regional_rank ASC` (1, 2, 3...)
- **Global**: `global_rank ASC`

### 2.2 Search Bar

**Implementation:** Client-side filter on fetched data

```typescript
const filteredCourses = courses.filter(course => 
  course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  course.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
  course.region?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**Search Fields:**
- `name`
- `country`
- `region`

**Search Method:**
- Case-insensitive substring match
- No debouncing (instant)
- No full-text search
- No special character handling

**Known Issues:**
- Searches across all fetched courses (could be 14k+)
- No server-side search - not scalable

### 2.3 Filter Dropdown

**Options:**
- All Courses
- Britain & Ireland
- United States
- Continental Europe
- Worldwide (Global Top 100)

**Mapping:**
- Hardcoded in `CourseExplorer.tsx`
- Maps to database filters:
  - `'all'` → No filter
  - `'britain-ireland'` → `country = 'Britain & Ireland' AND regional_rank NOT NULL`
  - `'usa'` → `country = 'USA' AND regional_rank NOT NULL`
  - `'europe'` → `country = 'Continental Europe' AND regional_rank NOT NULL`
  - `'global'` → `global_rank NOT NULL`

**Extensibility:** 
- **Cannot add new regions without code changes**
- Requires updating hardcoded mapping in component

### 2.4 Explore / Global Top 100 Toggle

**Current State:** No toggle exists on Courses Explore page

**Navigation:**
- Separate route `/global-top100` accessible via:
  - Bottom navigation (globe icon)
  - Profile courses tab "View Global Top 100" button
  
**Not a Toggle:** Two distinct pages, no shared state

### 2.5 Image Sourcing

**Course Images:**
- Stored in `golf_courses.thumbnail_image` field
- Direct URLs (likely Supabase Storage or external CDN)
- Fallback image: `https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa`

**Implementation in `CourseCard`:**
```typescript
<img
  src={course.thumbnail_image || fallbackUrl}
  onError={(e) => {
    e.currentTarget.src = fallbackUrl;
  }}
/>
```

**Missing Image Handling:**
- Fallback to generic golf course image
- No placeholder/skeleton during load
- Images loaded eagerly (no lazy loading on explore page)

---

## 3. Global Top 100 Hub

**Route:** `/global-top100`  
**Component:** `src/pages/GlobalTop100.tsx` → `GlobalTop100Content.tsx`

### 3.1 Hero Carousel (Global / GB&I / Europe / USA Slides)

**Component:** `Top100CourseLists.tsx`

**Slide Configuration:**
```typescript
const courseListData = [
  {
    id: 'global',
    title: 'Global Top 100',
    icon: Globe,
    description: "The world's greatest golf courses",
    backgroundImage: '/lovable-uploads/bd96819b-505e-4a35-b242-d106babe5179.png'
  },
  {
    id: 'gbi',
    title: 'GB&I Top 100',
    description: "Great Britain & Ireland's finest",
    backgroundImage: 'https://images.unsplash.com/photo-1587174486073...'
  },
  {
    id: 'europe',
    title: 'Europe Top 100',
    icon: Star,
    description: "Continental Europe's best courses"
  },
  {
    id: 'usa',
    title: 'USA Top 100',
    icon: MapPin,
    description: "America's premier golf destinations"
  }
];
```

**Hardcoded:** All slide data is static in component  
**Interaction:** 
- Mobile: Swipeable carousel
- Desktop: Grid layout
- **GB&I click** → Opens `GBITestModal` (demo modal showing GB&I courses)
- **Other clicks** → Not wired to actual course lists yet

**Link Behavior:** 
- No routes to actual `/top100/global`, `/top100/usa` pages exist
- Only GB&I has modal implementation
- This is **placeholder UI**

### 3.2 Top 100 Course Lists

**Status:** **Not yet implemented**

- No `/top100/global/1-100` or similar routes exist
- GB&I has a test modal (`GBITestModal.tsx`) showing ranked courses
- Other lists (Global, USA, Europe) have no browse experience yet

**Expected Implementation:**
- Fetch courses with `global_rank` or `regional_rank` (1-100)
- Display in ranked order with course cards
- Show user's played status, ratings

### 3.3 Community Top 100 Leaderboards

**Component:** `CommunityLeaderboards.tsx`

**Status:** **100% Mock Data**

```typescript
const leaderboardData = [
  {
    region: 'Global',
    leaders: [
      { name: 'James MacLeod', courses: 87 },
      { name: 'Sarah Williams', courses: 82 },
      // ...
    ]
  },
  // ... GB&I, Europe, USA
];
```

**Data Source:** Hardcoded array  
**No Real Logic:** No actual database queries  
**View Full Leaderboard:** Not wired - shows placeholder text

**Expected Real Implementation:**  
Query should be:
```sql
SELECT 
  user_id,
  COUNT(DISTINCT course_id) as courses_played
FROM user_top100_courses
WHERE played = true
  AND course_id IN (
    SELECT id FROM golf_courses 
    WHERE global_rank <= 100  -- or regional_rank for region-specific
  )
GROUP BY user_id
ORDER BY courses_played DESC
LIMIT 10
```

### 3.4 Top 100 Video Moments

**Component:** `Top100VideoMoments.tsx`

**Status:** **100% Mock Data**

```typescript
const videoMomentsData = [
  {
    id: '1',
    user: { name: 'James MacLeod', username: 'jamesmac_golf' },
    course: { name: 'St. Andrews Old Course', rank: '#1' },
    thumbnail: 'https://images.unsplash.com/...',
    duration: '0:24',
    stats: { likes: 234, comments: 45 }
  },
  // ...
];
```

**Expected Real Implementation:**
- Query `posts` table
- Filter by `post_tags` linking to courses with `global_rank <= 100`
- Filter by media type (video)
- Sort by recent or popular
- Display with play button

**Current Limitations:**
- No actual video playback
- No connection to real posts
- Static placeholder cards

### 3.5 Community Top 100 Moments

**Component:** `CommunityTop100Moments.tsx`

**Status:** **100% Mock Data**

Similar to Video Moments but includes photos.

**Expected Real Implementation:**
- Query posts tagged to Top 100 courses
- Support both images and videos
- Show ratings, hashtags, engagement stats
- Link to full post view

**Missing:**
- No "Load More" pagination
- No filter by region
- No filter by specific course

---

## 4. Profile → Courses Tab

**Route:** `/profile/{username}` → Courses tab  
**Component:** `InlineMyCoursesTab.tsx` → `UserCoursesContent.tsx`

### 4.1 Top 10 Courses Rated by You

**Data Source:** `user_top_ten_lists` table via `useUserTopTen` hook

**Schema:**
```typescript
{
  user_id: string,
  courses: Array<Course | undefined>, // 10 slots
  updated_at: timestamp
}
```

**Storage:** JSONB array with full course objects

**How Users Manage It:**
- **Add Course:** Click empty slot → `CoursePickerModal` opens → Search & select
- **Reorder:** Drag & drop (uses `@dnd-kit` library)
- **Remove:** Click X on course card
- **Clear All:** Button to reset all slots

**Hook:** `useUserTopTen(profileOwnerId)`
```typescript
const {
  topTen,           // Array of 10 courses (some may be undefined)
  canEdit,          // True if current user owns this list
  isInTopTen,       // (courseId) => boolean
  addCourseAtIndex, // (course, index) => void
  moveCourse,       // (fromIndex, toIndex) => void
  removeCourse,     // (index) => void
  clearAll,         // () => void
  isSaving          // Boolean
} = useUserTopTen(userId);
```

**Validation:**
- No duplicate courses allowed (checked in `isInTopTen`)
- Exactly 10 slots always maintained
- Slots can be empty (`undefined`)

**Ratings Display:**
- Each Top 10 course shows user's rating if they've rated it
- Fetched from `course_ratings` table
- Displayed as "X/10" badge

### 4.2 Recently Played

**Data Source:** Combined query from `user_top100_courses` and `course_ratings`

**Query Logic (from `useUserCoursesData`):**
```typescript
// 1. Get from user_top100_courses
const playedCourses = await supabase
  .from('user_top100_courses')
  .select('course_id, played_date, golf_courses(*)')
  .eq('user_id', userId)
  .eq('played', true);

// 2. Get from course_ratings
const ratedCourses = await supabase
  .from('course_ratings')
  .select('course_id, created_at, rating, golf_courses(*)')
  .eq('user_id', userId);

// 3. Merge both (dedupe by course_id)
// 4. Attach rating if exists
// 5. Sort by most recent played_date or created_at
```

**Display:**
- Shows ~12 most recent courses
- Course card format with rating overlay
- Sorted by date descending
- "View All" expands to full list

### 4.3 Highlights From My Journey

**Component:** Uses `HighlightsCarousel` or similar

**Data Source:** Posts tagged with golf courses

**Query:**
```typescript
const posts = await supabase
  .from('posts')
  .select(`
    *,
    post_tags(tagged_entity_id),
    post_media(*)
  `)
  .eq('user_id', userId)
  .not('post_tags', 'is', null); // Must have tags
```

**Filtering:**
- Only shows posts with course tags
- No specific "Top 100 only" filter currently
- Could be any course, not just Top 100

**Display:**
- Horizontal scrollable carousel
- Shows post media (photo/video thumbnail)
- Course name badge overlay
- Click → Full post view

### 4.4 Courses by Region (XP Rings & Counts)

**Component:** `RegionalCompletionSection.tsx` or `GamificationProgressBar.tsx`

**Data Source:** `useTop100CoursesData` hook

**XP Calculation Logic:**
```typescript
// For each region:
const allCoursesInRegion = golf_courses.filter(c => {
  if (region === 'worldwide') return c.global_rank <= 100;
  if (region === 'usa') return c.country === 'USA' && c.regional_rank <= 100;
  if (region === 'britain-ireland') return c.country === 'Britain & Ireland' && c.regional_rank <= 100;
  if (region === 'europe') return c.country === 'Continental Europe' && c.regional_rank <= 100;
});

const playedInRegion = userPlayedCourses.filter(c => 
  allCoursesInRegion.includes(c.course_id)
);

const progress = {
  played: playedInRegion.length,
  total: allCoursesInRegion.length,
  xp: playedInRegion.length * 110
};
```

**Displayed As:**
- Circular progress rings
- "21/100" count
- XP badge "2,310 XP"
- Trophy milestones (20 Club, 50 Club, Century Club, etc.)

**Regions Tracked:**
1. Worldwide (Global Top 100)
2. GB&I Top 100
3. USA Top 100
4. Continental Europe Top 100

**Total Counts (Hardcoded/Dynamic):**
- Global: 100 courses (fixed)
- GB&I: ~100 courses (dynamic count from DB)
- USA: ~100 courses (dynamic count from DB)
- Europe: ~99 courses (dynamic count from DB)

### 4.5 Regional Course Carousels

**Components:** `NetflixCourseRow.tsx` (for Netflix-style scrolling)

**For Each Region:**
- Worldwide
- USA
- GB&I
- Continental Europe

**Data Source:** 
- Filters user's played courses by region
- Sorted by rating (highest first) or rank

**Display Rules:**
- Shows only courses user has played in that region
- Empty regions hidden or show "No courses played" state
- Horizontal scroll with course cards
- Course cards show:
  - Course image
  - Course name
  - Official rank badge (e.g., "#5 Global")
  - User's rating if rated
  - XP earned

**Badges Explained:**
- **Globe icon with number:** Official global or regional rank
- **Star with number:** User's personal rating
- **XP indicator:** 110 XP per course (static)

---

## 5. Individual Course Page

**Route:** `/courses/{courseId}`  
**Component:** `CourseDetailPage.tsx` → `GolfClubView.tsx`

### 5.1 Header & Badges

**Data Source:** `golf_courses` table

**Header Components:**
```typescript
// Image
<img src={course.thumbnail_image || fallback} />

// Title & Location
<h1>{course.name}</h1>
<div>
  <CountryFlag country={course.country} />
  <span>{course.sub_country || course.country}</span>
</div>

// Rank Badges
<CourseRankBadges
  globalRank={course.global_rank}
  regionalRank={course.regional_rank}
  usaRank={course.usa_rank}
  country={course.country}
/>
```

**Badge Logic (in `CourseRankBadges.tsx`):**
```typescript
// Shows badges for all applicable lists
if (globalRank) show "Global #{globalRank}"
if (regionalRank && country === 'Britain & Ireland') show "GB&I #{regionalRank}"
if (regionalRank && country === 'USA') show "USA #{regionalRank}"
if (regionalRank && country === 'Continental Europe') show "Europe #{regionalRank}"
if (usaRank) show "USA #{usaRank}" // Legacy field
```

**Multiple Badges:** A course can show 2-3 badges simultaneously (e.g., Global #5, GB&I #2)

### 5.2 Community Score

**Component:** `CourseAboutTab.tsx`

**Overall Score:**
- Data: `course_rating_stats` view or computed from `course_ratings`
- Calculation:
  ```typescript
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  const rounded = Math.round(avg * 10) / 10; // e.g., 8.7
  ```
- Display: Large Clubhouse logo + "8.7/10"
- Count: "Based on 234 ratings"

**Breakdown (Course Design, Condition, Facilities):**
- **Status:** **MOCK DATA**
- Hardcoded values in `CourseAboutTab.tsx`:
  ```typescript
  const communityScores = {
    courseDesign: 8.4,
    courseCondition: 8.8,
    facilities: 7.7
  };
  ```
- Display: Horizontal bars with scores
- **Not Real:** No database storage for these breakdowns yet

**Intended Future Implementation:**
- Add columns to `course_ratings`: `design_rating`, `condition_rating`, `facilities_rating`
- Compute averages like overall score
- Requires migration

### 5.3 About Section

**Data Source:** `golf_courses.description` field

**Content:**
- Long-form text (no length limit in DB)
- Supports line breaks (`\n` converted to `<br />`)
- No rich text formatting (plain text only)

**Display:**
- First 50 words shown initially
- "Read more" button to expand
- Full text shown after expand

**Editing:** Admin-only via Golf Course Editor

### 5.4 Location Block

**Data:**
- `golf_courses.country`
- `golf_courses.sub_country`
- `golf_courses.latitude`, `longitude`

**Map Embed:**
```typescript
const mapUrl = `https://www.google.com/maps/embed/v1/place?key={API_KEY}&q=${lat},${lng}&zoom=15&maptype=satellite`;

<iframe src={mapUrl} />
```

**Implementation:** `CourseMap.tsx`
- Uses Google Maps Embed API
- Satellite view, zoom 15
- Centered on course coordinates
- API key visible in client code: `AIzaSyBFw0Qbyq9zTFTd-tUY6dOWTgHz4TJlE7o`

**Links:**
- "View in Maps" → Opens Google Maps in new tab
- Uses `latitude,longitude` query

### 5.5 Reviews Tab

**Component:** `CourseReviewsTab.tsx`

**Data Source:** 
```typescript
const reviews = await supabase
  .from('course_ratings')
  .select(`
    id, rating, review, review_date, user_id,
    helpful_count, unhelpful_count
  `)
  .eq('course_id', courseId)
  .not('review', 'is', null)  // Only ratings with text reviews
  .not('review', 'eq', '')
  .order('review_date', { ascending: false });

// Join with user_profiles for names/avatars
// Join with course_review_media for attached media
```

**Review Structure:**
- Rating (0.5-10)
- Review text (nullable)
- Review date
- User info (name, avatar)
- Attached media (photos/videos)
- Helpful/Unhelpful counts
- User's vote (if logged in)

**Features:**
- **Edit:** User can edit their own review (opens `EditRatingModal`)
- **Delete:** User can delete their own review
- **Helpful/Unhelpful:** Logged-in users can vote
  - Stored in `review_votes` table (not fully confirmed structure)
  - One vote per user per review
  - Can change vote
- **Media Display:** Videos (with Cloudflare Stream) and images
- **"Your Review" Badge:** Highlights current user's review

**Sorting:** Most recent first (no sort options)

### 5.6 Media Tab

**Component:** `CourseMediaTab.tsx`

**Data Source:** Edge function `get-club-media`
```typescript
const { data } = await supabase.functions.invoke('get-club-media', {
  body: { clubId: courseId, limit: 30 }
});
```

**What's Included:**
- Course-tagged posts with media
- Review media from `course_review_media`
- Both photos and videos

**Filter Options (UI Only):**
- All
- Videos
- Photos

**Display:**
- `MediaGrid` component
- Masonry/grid layout
- Click → Opens fullscreen viewer or vertical feed
- Uses `DiscoverVerticalFeed` for consistent UX

**Limitations:**
- Limit 30 items (hardcoded)
- No pagination/"Load More"
- No sort options
- No filter by date range or user

### 5.7 Visit Website

**Data:** `golf_courses.website_url`

**Button:**
```typescript
<Button onClick={() => window.open(course.website_url, '_blank')}>
  <ExternalLink /> Visit Website
</Button>
```

**Validation:** 
- No URL validation in DB
- Accepts any text
- Could be malformed URLs
- Admin should ensure proper format

---

## 6. Admin Console → Golf Courses Tab

**Route:** `/admin/golf-courses` (within admin layout)  
**Component:** `GolfCoursesManagement.tsx`

### 6.1 Course List View

**Data Source:** `useGolfCourses` custom hook

**Query Implementation:**
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['admin-golf-courses', regionalFilter, searchTerm],
  queryFn: async ({ pageParam = 0 }) => {
    const pageSize = 50;
    let query = supabase
      .from('golf_courses')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (regionalFilter.top100List) {
      // Filter by Global/GB&I/USA/Europe
    }
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }
    
    query = query
      .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1)
      .order('name', { ascending: true });
    
    return query;
  },
  getNextPageParam: (lastPage, pages) => {
    return lastPage.courses.length === 50 ? pages.length : undefined;
  }
});
```

**Pagination:**
- **Infinite scroll** (not traditional pagination)
- Fetches 50 courses per page
- Uses `IntersectionObserver` to trigger `fetchNextPage` when scrolling to bottom
- Flattens all pages into single array client-side

**Visible Columns:**
- Course name
- Country (with flag icon)
- Sub-country
- Top 100 badges (Global, Regional)
- Last updated timestamp

**Actions Per Row:**
- **Edit** → Navigate to `/admin/golf-courses/{id}/edit`

### 6.2 Search & Filters

**Search:**
- Input field at top
- Debounced (300ms) via `useDebounce`
- Server-side `ILIKE` on `name` field
- Case-insensitive
- **Only searches name**, not country/region

**Filters:**
- **Regional Filter Dropdown:**
  - All Top 100 Courses
  - Global Top 100
  - GB&I Top 100
  - USA Top 100
  - Continental Europe Top 100
- **Implementation:** `CascadingFilters.tsx`
- Maps filter to query:
  ```typescript
  if (filter === 'global') {
    query.not('global_rank', 'is', null)
  } else if (filter === 'gbi') {
    query.eq('country', 'Britain & Ireland')
        .not('regional_rank', 'is', null)
  }
  // ... etc
  ```

**Limitations:**
- No filter by country (unless using search)
- No filter by "has coordinates"
- No filter by "has description"
- No bulk selection

### 6.3 Permissions

**Access Control:**
- **Full Admin:** Can view, edit, create, and (presumably) delete courses
- **Limited Admin:** Can only view Golf Courses tab (no user management, etc.)
- **Regular Users:** Cannot access admin console

**Role Check:**
```typescript
const { userRole } = useAdmin(); // Queries admin_memberships table

if (userRole === 'limited_admin') {
  return <GolfCoursesManagement />; // Only this view
}
```

**RLS Bypass:**
- Admin queries use service role or admin role with elevated privileges
- Bypasses RLS policies on `golf_courses`

---

## 7. Admin Console → Create / Edit Golf Course

**Routes:**
- Create: `/admin/golf-courses/new`
- Edit: `/admin/golf-courses/{id}/edit`

**Component:** `GolfCourseEditor.tsx`

### 7.1 Fields & Structure

**Core Fields:**
- **Course Name** (text, required)
- **Description** (textarea, optional, multi-line)
- **Primary Country** (dropdown, required)
  - Options: Britain & Ireland, Continental Europe, USA, Rest of World
- **Sub-Country** (dropdown, required)
  - Dynamically populated based on Primary Country
  - E.g., USA → All 50 states + DC
- **Region** (text input, optional)
  - Free-form text, no validation
- **Coordinates:**
  - Latitude (number, optional)
  - Longitude (number, optional)
- **Website URL** (text, optional)
- **Course Image:**
  - Upload or URL input
  - Stored in Supabase Storage or direct URL
  - Managed via `CourseImageUpload` component

**Ranking Fields:**
- **Global Rank** (dropdown, 1-100 or "No Rank")
- **Regional Ranking:**
  - Dropdown to select region (GB&I, USA, Continental Europe)
  - Dropdown to select rank (1-100 or "No Rank")
  - If selecting regional rank, must also ensure Primary Country matches

**Validation:**
- Name required
- Primary Country required
- Sub-Country required
- If regional rank set, Primary Country must match regional context
- No duplicate rank checking at DB level (done in UI)

### 7.2 Top 100 Ranking Inputs

**Interface:**
```tsx
// Global Rank
<Select value={globalRank} onChange={setGlobalRank}>
  <option value="">No Global Rank</option>
  {[1...100].map(n => <option value={n}>#{n}</option>)}
</Select>

// Regional Rank
<Select value={regionalRankingRegion}>
  <option value="">No Regional Rank</option>
  <option value="Great Britain and Ireland">GB&I</option>
  <option value="USA">USA</option>
  <option value="Continental Europe">Continental Europe</option>
</Select>

<Select value={regionalRank}>
  <option value="">No Rank</option>
  {[1...100].map(n => <option value={n}>#{n}</option>)}
</Select>
```

**Logic:**
- Setting regional rank updates `golf_courses.regional_rank`
- Admin must manually ensure Primary Country aligns with regional list
- **Conflict Handling:** UI validation warns if rank already taken
  - Queries `golf_courses` for existing rank in same region
  - Shows error toast if duplicate found
  - **Does not prevent save** (DB allows duplicates)

### 7.3 Media & Assets

**Course Image:**
- **Upload:** Drag-drop or file picker
  - Uploaded to Supabase Storage bucket `course-images`
  - Returns public URL
  - Stored in `golf_courses.thumbnail_image`
- **URL Input:** Paste external URL (e.g., Unsplash, own CDN)
- **Preview:** Shows current image or placeholder
- **Replace:** Delete button + re-upload

**Video Thumbnails:**
- Not directly managed in course editor
- Videos come from posts/reviews

### 7.4 Editing and Versioning

**Edit Flow:**
1. Load existing course data via ID
2. Populate form fields
3. User modifies
4. Click "Save Changes"
5. PATCH request to Supabase
6. Cache invalidated, list refreshes

**Risk of Breaking Relations:**
- **Renaming:** No issue (ID-based foreign keys)
- **Changing Country:** Could mess up regional list logic
  - E.g., changing USA course to GB&I while keeping `regional_rank`
  - UI validation should prevent, but DB doesn't enforce
- **Deleting:** Not exposed in UI (no delete button)
  - If manually deleted via DB, orphaned references in:
    - `user_top100_courses`
    - `course_ratings`
    - `post_tags`
  - Would cause errors/null refs

**Audit Trail:**
- **No audit logging** of changes
- `updated_at` timestamp updated automatically
- No "edited by" tracking
- No history of ranking changes

**Draft Persistence:**
- Form uses `usePageDraft` hook
- Auto-saves draft to `localStorage`
- Draft restored if user navigates away and returns
- Prevents accidental loss of work

---

## 8. Tagging, Media & Posts

### 8.1 Tagging a Course in a Post

**Flow:**
1. User creates post via `PostCreationModal`
2. Clicks "Tag Course" (or similar)
3. `CourseSearchSheet` opens
4. User searches for course (queries `golf_courses`)
5. Selects course
6. Creates `taggable_entities` entry if not exists:
   ```typescript
   {
     entity_type: 'golf_course',
     entity_id: courseId,
     name: courseName,
     username: null
   }
   ```
7. Creates `post_tags` entry:
   ```typescript
   {
     post_id: newPostId,
     tagged_entity_id: taggableEntityId,
     tagged_by_user_id: userId
   }
   ```

**Taggable Entities Table:**
- Acts as a polymorphic join table
- Allows posts to tag courses, users, or future entity types
- Single source for all tag relationships

### 8.2 Which Content Appears Where

**Highlights From My Journey (Profile Courses Tab):**
- Posts by current user
- Must have at least one course tag
- Sorted by recency
- No limit on number of courses (can tag multiple)

**Course Media Tab:**
- All posts tagged with specific course
- All reviews with media for that course
- Combined via edge function `get-club-media`

**Top 100 Video Moments (Global Top 100 Hub):**
- **Currently mock**
- Expected: Posts tagged with courses where `global_rank <= 100`
- Video posts only
- Sorted by recency or popularity

**Community Top 100 Moments:**
- **Currently mock**
- Expected: Same as Video Moments but includes photos

### 8.3 Association Loss Scenarios

**Can association be lost?**

1. **Course Renamed:** No - Uses `id`, not `name`
2. **Course Deleted:** Yes - Orphaned `taggable_entities` and `post_tags`
   - Posts would show null/broken course tags
   - No cascade delete configured
3. **Region Changed:** No direct impact on tags
4. **Post Deleted:** `post_tags` cascade deleted (assumed)
5. **User Deletes Account:** Posts may be orphaned (depends on cascade rules)

**Recommendations:**
- Implement soft deletes for courses
- Add DB foreign key ON DELETE behavior
- Add integrity checks for orphaned tags

---

## 9. Ratings, Reviews & XP Logic

### 9.1 Ratings System

**Data Storage:** `course_ratings` table

**Rating Scale:** 0.5 - 10.0 (increments of 0.5)

**Standalone vs With Review:**
- **Standalone:** User can rate without writing review (`review` field null)
- **With Review:** Rating + text review

**Interface:**
- Star rating component (converted to 0-10 scale)
- Or numeric input (0.5, 1.0, 1.5... 10.0)

**Multiple Ratings by Same User:**
- **One rating per user per course** (enforced by unique constraint presumed)
- Editing rating updates existing row
- No rating history stored

**Rating Creation Flow:**
1. User must have played course (checked via RLS policy)
2. `PostPlayRatingModal` or similar opens
3. User selects rating
4. Optional: Write review
5. Optional: Upload media (photos/videos)
6. Submit → Creates `course_ratings` row
7. Media → Creates `course_review_media` rows

### 9.2 XP / Progress System

**XP Per Action:**
- **Playing a course:** 110 XP
- **Rating a course:** 0 XP (no bonus)
- **Reviewing a course:** 0 XP (no bonus)
- **Posting media:** 0 XP (no bonus)

**XP Aggregation:**
```typescript
// Per region
const regionXP = coursesPlayedInRegion * 110;

// Global total
const globalXP = allCoursesPlayed * 110;
```

**What Counts as "Played":**
- Entry in `user_top100_courses` with `played = true`, OR
- Entry in `course_ratings` (any rating)

**XP Display:**
- Per-region rings (e.g., "2,310 XP")
- Trophy milestones (20 Club = 2,200 XP, 50 Club = 5,500 XP, etc.)
- No global XP leaderboard (only per-region)

**Trophy System:**
- **Global Trophies (XP-based):**
  - 20 Club: 2,200 XP (20 courses)
  - 50 Club: 5,500 XP (50 courses)
  - Century Club: 11,000 XP (100 courses)
  - Clubhouse Elite: 22,000 XP (200 courses)
  - Club Collector: 33,000 XP (300 courses)

- **Regional Completion Badges:**
  - Links Legend (GB&I 100%)
  - Continental Swinger (Europe 100%)
  - Stars and Stripes Tourer (USA 100%)
  - Legends Club (Worldwide 100%)

**Unlock Dates:**
- Stored or computed from `played_date` / `created_at` of Nth course
- Displayed as "Unlocked 3 months ago"

### 9.3 Current Limitations

**No Bonus XP For:**
- High ratings (10/10 doesn't give more XP than 5/10)
- Writing reviews
- Adding media
- Playing Top 100 vs non-Top 100

**Future Enhancements (Recommendations):**
- Bonus XP for detailed reviews (e.g., +50 XP)
- Bonus XP for 9+ ratings (e.g., +20 XP)
- Bonus XP for first to rate a course
- Streak bonuses (play 5 courses in a month)

---

## 10. Performance, Tech Debt & Known Issues

### 10.1 Performance Pain Points

**1. Loading All Courses Client-Side**
- **Where:** `CourseExplorer.tsx`
- **Issue:** Fetches entire regional lists without pagination
  - "All Courses" = 14,000+ courses
  - GB&I = ~100 courses
  - USA = ~100 courses
- **Impact:** Slow initial load, large payload
- **Recommendation:** Implement server-side pagination or limit to 50-100 results with "Load More"

**2. No Full-Text Search Index**
- **Where:** Admin search, user search
- **Issue:** Using `ILIKE` for name search
  - Slow on large tables
  - Cannot search by multiple fields efficiently
- **Recommendation:** Add Postgres full-text search (`tsvector`) or integrate Algolia/Meilisearch

**3. Multiple Queries for User Courses**
- **Where:** `useUserCoursesData`, `usePlayedCoursesWithRatings`
- **Issue:** Separate queries to `user_top100_courses` and `course_ratings`, then merge client-side
- **Impact:** Double queries, slower page loads
- **Recommendation:** Create database view or edge function to combine in one query

**4. No Caching for Static Data**
- **Where:** Course images, course lists
- **Issue:** No CDN caching headers
- **Recommendation:** Add `Cache-Control` headers to S3/Supabase Storage responses

**5. Large Image Downloads**
- **Where:** Course cards, detail pages
- **Issue:** No responsive image sizes, always fetches full-res
- **Recommendation:** Generate thumbnails (e.g., 400x300, 800x600) and use `srcset`

### 10.2 Tech Debt

**1. Hardcoded Regional Logic**
- **Where:** `CourseExplorer`, `useTop100CoursesData`, admin filters
- **Issue:** Cannot add new regions without code changes
- **Example:**
  ```typescript
  if (region === 'britain-ireland') { ... }
  else if (region === 'usa') { ... }
  ```
- **Impact:** Requires code deploy to add "Asia Top 100"
- **Recommendation:** Create `top100_lists` table with configuration

**2. Duplicate Country/Region Data**
- **Where:** `GolfCourseEditor` dropdown options
- **Issue:** Hardcoded arrays of countries, sub-countries
- **Impact:** Must update code to add new countries
- **Recommendation:** Move to database table or config file

**3. Mock Data in Production Components**
- **Where:**
  - `CommunityLeaderboards.tsx`
  - `Top100VideoMoments.tsx`
  - `CommunityTop100Moments.tsx`
  - `CourseAboutTab.tsx` (community score breakdown)
- **Issue:** Placeholder data confuses users, can't test real functionality
- **Recommendation:** Implement real queries or remove sections until ready

**4. Inconsistent Data Sources**
- **Where:** Played courses tracked in two places
- **Issue:** `user_top100_courses` vs `course_ratings`
  - Some queries use one, some use other
  - Easy to miss played courses if not checking both
- **Recommendation:** Consolidate into one source of truth (probably `user_top100_courses` with automatic sync from ratings)

**5. No Audit Logging**
- **Where:** Golf course edits
- **Issue:** No record of who changed rankings, when, or what changed
- **Impact:** Can't trace errors or malicious edits
- **Recommendation:** Add `audit_log` table for admin actions

**6. Client-Side Search Filtering**
- **Where:** `CourseExplorer` search
- **Issue:** Fetches all data then filters in browser
- **Impact:** Slow, not scalable
- **Recommendation:** Move to server-side search with proper indexing

### 10.3 Mock vs Real Data Summary

| Feature | Status | Location |
|---------|--------|----------|
| Course List | ✅ Real | `golf_courses` table |
| User Ratings | ✅ Real | `course_ratings` table |
| User Reviews | ✅ Real | `course_ratings` table |
| Course Images | ✅ Real | Supabase Storage / URLs |
| Community Score (Overall) | ✅ Real | Computed from `course_ratings` |
| Community Score (Breakdown) | ❌ Mock | Hardcoded in `CourseAboutTab.tsx` |
| Leaderboards | ❌ Mock | Hardcoded array in `CommunityLeaderboards.tsx` |
| Video Moments | ❌ Mock | Hardcoded array in `Top100VideoMoments.tsx` |
| Community Moments | ❌ Mock | Hardcoded array in `CommunityTop100Moments.tsx` |
| User XP | ✅ Real | Computed from played courses |
| Trophies | ✅ Real | Computed from XP thresholds |
| Top 10 Lists | ✅ Real | `user_top_ten_lists` table |

### 10.4 Known Bugs / Issues

**1. Duplicate Ranks Allowed**
- Admin can assign same rank to multiple courses in same list
- DB has no unique constraint
- UI validation exists but can be bypassed

**2. Orphaned Course Tags**
- Deleting course doesn't clean up `taggable_entities` or `post_tags`
- Posts show broken course links

**3. Rating Without Playing Check**
- RLS policy checks `user_top100_courses.played = true`
- But what if user only has entry in `course_ratings`?
- Policy may fail incorrectly

**4. No Validation on Coordinates**
- Admin can enter invalid lat/long (e.g., 999, -999)
- Breaks map embeds

**5. Website URL Not Validated**
- Can save malformed URLs
- Clicking "Visit Website" may fail

**6. Image Upload Errors Not Handled**
- If S3/Storage upload fails, user sees generic error
- No retry mechanism

---

## 11. Recommendations

### 11.1 Schema Improvements

**1. Create `top100_lists` Table**
```sql
CREATE TABLE top100_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- "Global Top 100"
  slug TEXT UNIQUE NOT NULL,       -- "global"
  description TEXT,
  filter_type TEXT NOT NULL,       -- "global_rank" | "regional_rank"
  filter_country TEXT,             -- For regional lists
  max_rank INTEGER DEFAULT 100,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Benefits:**
- Add new lists without code changes
- Dynamic filters
- Easier to manage

**2. Create `countries` and `regions` Tables**
```sql
CREATE TABLE countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  top100_list_id UUID REFERENCES top100_lists(id)
);

CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT REFERENCES countries(code),
  name TEXT NOT NULL
);
```

**Benefits:**
- Consistent country names
- Easier to add new countries
- Can link countries to their Top 100 list

**3. Add `rating_breakdown` Columns to `course_ratings`**
```sql
ALTER TABLE course_ratings ADD COLUMN design_rating NUMERIC;
ALTER TABLE course_ratings ADD COLUMN condition_rating NUMERIC;
ALTER TABLE course_ratings ADD COLUMN facilities_rating NUMERIC;
```

**Benefits:**
- Real data for community score breakdown
- Remove mock data

**4. Add Unique Constraint on Rankings**
```sql
CREATE UNIQUE INDEX unique_global_rank 
  ON golf_courses(global_rank) 
  WHERE global_rank IS NOT NULL;

CREATE UNIQUE INDEX unique_regional_rank_gbi 
  ON golf_courses(regional_rank) 
  WHERE country = 'Britain & Ireland' AND regional_rank IS NOT NULL;
-- Repeat for USA, Europe
```

**Benefits:**
- Prevent duplicate ranks
- Data integrity

**5. Add `audit_log` Table**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,          -- "update", "create", "delete"
  table_name TEXT NOT NULL,      -- "golf_courses"
  record_id UUID NOT NULL,       -- Course ID
  changes JSONB,                 -- { "global_rank": { "old": 5, "new": 3 } }
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Benefits:**
- Track all admin changes
- Audit trail for compliance
- Rollback capability

### 11.2 API / Query Improvements

**1. Centralize Course Query Logic**
- Create `useCourses` hook that all components use
- Single source of truth for filtering, sorting, pagination
- Easier to optimize

**2. Implement Full-Text Search**
```sql
ALTER TABLE golf_courses ADD COLUMN search_vector tsvector;

CREATE INDEX golf_courses_search_idx ON golf_courses USING GIN(search_vector);

CREATE FUNCTION update_golf_courses_search() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_golf_courses_search_trigger
  BEFORE INSERT OR UPDATE ON golf_courses
  FOR EACH ROW EXECUTE FUNCTION update_golf_courses_search();
```

**Benefits:**
- Fast search across name, country, description
- Supports typos, relevance ranking

**3. Create Database View for User Courses**
```sql
CREATE VIEW user_courses_with_ratings AS
SELECT 
  COALESCE(utc.user_id, cr.user_id) AS user_id,
  COALESCE(utc.course_id, cr.course_id) AS course_id,
  COALESCE(utc.played_date, cr.created_at) AS played_date,
  cr.rating,
  cr.review,
  gc.*
FROM user_top100_courses utc
FULL OUTER JOIN course_ratings cr 
  ON utc.course_id = cr.course_id AND utc.user_id = cr.user_id
LEFT JOIN golf_courses gc 
  ON COALESCE(utc.course_id, cr.course_id) = gc.id
WHERE utc.played = true OR cr.rating IS NOT NULL;
```

**Benefits:**
- Single query for played courses
- Automatically combines both sources
- Faster page loads

**4. Add Edge Function for Course Search**
```typescript
// /functions/search-courses/index.ts
Deno.serve(async (req) => {
  const { query, region, limit = 20, offset = 0 } = await req.json();
  
  let dbQuery = supabase
    .from('golf_courses')
    .select('*', { count: 'exact' });
  
  if (query) {
    dbQuery = dbQuery.textSearch('search_vector', query);
  }
  
  if (region && region !== 'all') {
    dbQuery = applyRegionFilter(dbQuery, region);
  }
  
  const { data, count, error } = await dbQuery
    .range(offset, offset + limit - 1);
  
  return new Response(JSON.stringify({ data, count }));
});
```

**Benefits:**
- Server-side search
- Pagination support
- Consistent API for all clients

### 11.3 Maintainability

**1. Feature Flags**
- Implement feature flag system (e.g., using `localStorage` or database)
- Toggle mock sections on/off
- Gradual rollout of new features

**2. Component Library for Course Cards**
- Standardize `CourseCard` props and variants
- Create Storybook documentation
- Easier to maintain consistency

**3. Shared Constants File**
```typescript
// src/constants/courses.ts
export const TOP100_LISTS = [
  { id: 'global', name: 'Global Top 100', ... },
  { id: 'gbi', name: 'GB&I Top 100', ... },
  // ...
] as const;

export const PRIMARY_COUNTRIES = [
  'Britain & Ireland',
  'Continental Europe',
  'USA',
  'Rest of World'
] as const;
```

**Benefits:**
- Single source of truth
- Easier to update
- Type-safe

**4. Automated Tests**
- Unit tests for hooks (`useUserTopTen`, `useTop100CoursesData`)
- Integration tests for admin course editing
- E2E tests for critical flows (rate course, add to Top 10)

**5. Database Migrations**
- Use proper migration system (e.g., Supabase migrations)
- Version control all schema changes
- Document breaking changes

### 11.4 Quick Wins (Low Effort, High Impact)

1. **Add Loading States Everywhere**
   - Replace instant "No data" with skeletons
   - Better perceived performance

2. **Implement Image Lazy Loading**
   - Use `loading="lazy"` attribute
   - Faster initial page loads

3. **Add Debouncing to Search**
   - 300ms debounce on search inputs
   - Reduce unnecessary queries

4. **Fix Map API Key**
   - Move API key to environment variable
   - Security best practice

5. **Add "Load More" to Courses**
   - Replace infinite scroll with explicit button
   - Better UX on mobile

6. **Remove Mock Sections**
   - Hide Community Leaderboards until real
   - Hide Video Moments until real
   - Reduce user confusion

7. **Add Empty States**
   - Better messaging when no courses played
   - Encourage user action

8. **Validate URLs in Admin**
   - Check website URLs are valid
   - Prevent broken links

9. **Add Course Image Compression**
   - Compress uploads to 1200px max
   - Faster loads

10. **Cache Common Queries**
    - Cache Top 100 lists for 1 hour
    - Cache course details for 5 minutes
    - Reduce DB load

---

## Conclusion

The Clubhouse Golf golf courses ecosystem is **largely functional** with real data driving most features. The architecture supports the core "TripAdvisor for golf" vision, with user ratings, reviews, Top 10 lists, and regional progress tracking.

**Critical Areas for Redesign:**
1. **Eliminate hardcoded regional logic** - Move to database-driven configuration
2. **Consolidate played course tracking** - Single source of truth
3. **Replace mock data** - Implement real leaderboards and video moments
4. **Add server-side search** - Full-text search with pagination
5. **Optimize queries** - Reduce multiple queries, add proper indexes

With these improvements, the system will scale confidently to 100k+ courses and millions of ratings while maintaining performance and developer velocity.

---

**End of Audit**
