# Search System Discovery Audit

## Overview
Current search implementation consists of two distinct systems:
1. **Header Search** - Entity search (users, courses/clubs)  
2. **Discover Search** - Media/content search (videos, photos)

---

## 1. File & Hook Inventory

### Header Search Components
- `src/components/GlobalHeader.tsx` - Contains SearchPill integration for header
- `src/components/Header.tsx` - Alternative header with SearchPill integration  
- `src/components/clubhouse/SearchPill.tsx` - Visual search input component (UI only)
- `src/components/header/HeaderSearch.tsx` - **Legacy component** (unused in current headers)
- `src/components/search/SearchResults.tsx` - Search results dropdown component

### Discover Search Components  
- `src/components/discover/MediaSearch.tsx` - Media search input for Discover page
- `src/pages/Discover.tsx` - Contains MediaSearch integration

### Search Hooks
- `src/hooks/useSearch.tsx` - **Primary entity search hook** (users, courses)
- `src/hooks/useMediaSearch.tsx` - Media search hook (placeholder implementation)
- `src/hooks/useCourseSearch.tsx` - Specialized course search for autocomplete
- `src/hooks/useDebounce.tsx` - Debouncing utility

### Storage & Persistence
- **Recent searches**: `localStorage.getItem('recent_searches')` (entity search)
- **Recent media searches**: `localStorage.getItem('recent_media_searches')` (media search)
- Both store max 5 recent searches

---

## 2. Current Entity Coverage

### ✅ Currently Searched Entities

#### Users/Profiles (`useSearch.tsx`)
**Table**: `user_profiles`  
**Columns**: `display_name`, `username`, `home_club`, `profile_photo_url`  
**Filters**: `eq('is_public', true)`  
**Query**: `or('display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%')`  
**Limit**: 6 results

#### Golf Courses/Clubs (`useSearch.tsx`) 
**Table**: `golf_courses`  
**Columns**: `name`, `country`, `region`, `thumbnail_image`, `global_rank`  
**Query**: `ilike('name', '%${searchTerm}%')`  
**Limit**: 6 results

#### Course Autocomplete (`useCourseSearch.tsx`)
**Table**: `golf_courses` (enhanced with user data)  
**Enrichment**: User ratings from `course_ratings`, played status from `user_top100_courses`
**Limit**: 20 results

### ❌ Entities NOT Currently Searched
- **Posts/Media** - Only filtered in Discover, not searched in header
- **Comments** - Not searchable
- **Tags** - Not directly searchable (only used for filtering)
- **Business Profiles** - Only individual users are searched

---

## 3. Query Plans & Performance

### Header Search Performance
```typescript
// Users Query (useSearch.tsx:89-110)
const { data, error } = await supabase
  .from('user_profiles')
  .select('id, display_name, username, home_club, profile_photo_url')
  .or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
  .eq('is_public', true)
  .limit(6);

// Courses Query (useSearch.tsx:112-131)  
const { data, error } = await supabase
  .from('golf_courses')
  .select('id, name, country, region, thumbnail_image, global_rank')
  .ilike('name', `%${searchTerm}%`)
  .limit(6);
```

### Debouncing Strategy
- **Header search**: 200ms debounce (`useSearch.tsx:27`)
- **Media search**: 200ms debounce (`useMediaSearch.tsx:25`) 
- **Course autocomplete**: 250ms debounce (`useCourseSearch.tsx:100`)

### Request Cancellation
❌ **No request cancellation implemented** - Previous requests are not cancelled when new searches are triggered

### Caching Strategy  
❌ **No React Query integration** for search - Each search hits the API directly  
✅ **React Query used elsewhere** in the app but not for search functionality

### Database Indexes
```sql
-- Existing indexes on searchable columns:
CREATE INDEX idx_user_profiles_username ON public.user_profiles USING btree (username);
CREATE UNIQUE INDEX user_profiles_username_key ON public.user_profiles USING btree (username);

-- Missing indexes for search optimization:
-- No index on user_profiles.display_name
-- No index on golf_courses.name  
-- No composite index for user_profiles (display_name, username, is_public)
```

---

## 4. Routing & Navigation

### Search Result Navigation (`SearchResults.tsx:48-67`)
```typescript
const handleResultClick = (result: SearchResult) => {
  if (result.type === 'user' && result.username) {
    navigate(`/profile/${result.username}`);
  } else if (result.type === 'course') {
    navigate(`/courses/${result.id}`);  
  }
  onResultClick(result);
};
```

### Route Patterns
- **User profiles**: `/profile/${username}`
- **Course details**: `/courses/${courseId}`
- **No special handling** for business profiles, channels, or other entity types

---

## 5. Result Shape & Data Structure

### Header Search Results (`useSearch.tsx:5-17`)
```typescript
interface SearchResult {
  id: string;
  type: 'user' | 'course';
  title: string;        // display_name || username for users, name for courses
  subtitle: string;     // home_club for users, region/country + rank for courses  
  image?: string;       // profile_photo_url for users, thumbnail_image for courses
  username?: string;    // Only for user results
}
```

### User Result Mapping (`useSearch.tsx:102-109`)
```typescript
{
  id: user.id,
  type: 'user',
  title: user.display_name || user.username || 'Anonymous User',
  subtitle: user.home_club ? `${user.home_club}` : 'No home club set',
  username: user.username || user.id,
  image: user.profile_photo_url || undefined
}
```

### Course Result Mapping (`useSearch.tsx:124-130`)
```typescript
{
  id: course.id,
  type: 'course', 
  title: course.name,
  subtitle: `${course.region || course.country}${course.global_rank ? ` • #${course.global_rank}` : ''}`,
  image: course.thumbnail_image || undefined
}
```

---

## 6. Gaps & Issues Found

### 🔴 Critical Issues
1. **No request cancellation** - Multiple simultaneous requests possible
2. **Missing database indexes** - Poor performance on `display_name` and `name` searches
3. **No React Query caching** - Repeated identical searches hit the database
4. **SearchPill has no functionality** - Currently just a visual component with no search logic

### 🟡 Performance Issues  
1. **Parallel queries not optimized** - Users and courses searched separately instead of potentially using a unified search approach
2. **No query optimization** - Full `ILIKE` scans without indexed search
3. **No search analytics** - No tracking of search patterns or performance

### 🟠 UX Issues
1. **Inconsistent search interfaces** - Different components for header vs discover search
2. **Limited result information** - No indication of user verification, course rankings prominence, etc.
3. **No search history persistence** - Recent searches not synced across devices

### 🔵 Missing Features
1. **No search suggestions** - No autocomplete or query suggestions
2. **No trending searches** - Popular clubs shown but no trending queries
3. **No search filters** - Can't filter by location, course type, user type, etc.  
4. **No fuzzy search** - Exact substring matching only

---

## 7. Current Component Integration

### Header Integration (Working)
```typescript
// GlobalHeader.tsx:128 & Header.tsx:126
<SearchPill className="w-full max-w-xl" variant={variant} />

// Mobile overlay SearchPill
<SearchPill 
  autoFocus 
  onClose={() => setSearchOpen(false)}
  placeholder="Search clbhouz..."
  variant={variant}
/>
```

### Discover Integration (Working)
```typescript  
// Discover.tsx:146-150
<MediaSearch 
  placeholder="Search videos and photos..." 
  onSearchChange={setSearchQuery}
/>
```

### Unused Components
- `HeaderSearch.tsx` - Legacy component not integrated in current headers
- SearchPill currently has no actual search functionality - just UI

---

## 8. Recommendations for Phase B

### Immediate Fixes Needed
1. **Integrate search logic into SearchPill** - Currently just UI, needs `useSearch` hook integration
2. **Add database indexes** for search performance  
3. **Implement request cancellation** to prevent race conditions
4. **Add React Query caching** for search results

### Performance Optimizations
1. **Add fuzzy search capabilities** - Consider using PostgreSQL full-text search or external search service
2. **Optimize queries** with proper indexing strategy
3. **Implement search result caching** and invalidation strategy

### UX Improvements  
1. **Unified search experience** across header and discover
2. **Enhanced result metadata** (verification badges, prominence indicators)
3. **Search suggestions and autocomplete**
4. **Search analytics and trending features**