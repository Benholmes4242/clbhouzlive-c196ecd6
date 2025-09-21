# Global Search Performance Optimizations

## Database Indexes Added
- `idx_user_profiles_display_name` - For user display name searches
- `idx_user_profiles_username` - For username searches
- `idx_golf_courses_name` - For golf course name searches
- `idx_user_profiles_search_public` - Composite index for public user searches
- `idx_golf_courses_search_rank` - Composite index for ranked course searches

## Query Optimization
- **Debounce**: 250ms delay in SearchPill for optimal user experience
- **React Query Keys**: Proper keying with `['global-search', type, query]` for automatic cancellation
- **Cache Strategy**: 2-5 minute cache with 5-10 minute garbage collection
- **Limits**: Each section capped at 6-8 items, total ~20 results maximum

## Performance Features
1. **Automatic Cancellation**: New searches cancel previous in-flight requests
2. **Normalized Queries**: Consistent lowercase search terms for better caching
3. **Stale-While-Revalidate**: 2-5 minute stale time for instant results
4. **Optimized SQL**: Uses indexed columns with proper ordering
5. **Error Boundaries**: Graceful fallback for search failures

## Monitoring
- Analytics tracking for search behavior
- Performance metrics via React Query DevTools
- Search result relevance scoring

## Cache Strategy
```typescript
// People & Clubs Search
staleTime: 2 * 60 * 1000,    // 2 minutes
gcTime: 5 * 60 * 1000,       // 5 minutes

// Trending Items
staleTime: 5 * 60 * 1000,    // 5 minutes  
gcTime: 10 * 60 * 1000,      // 10 minutes
```

## Query Cancellation
React Query automatically cancels previous requests when:
- User types new search term
- Component unmounts
- Query key changes

This prevents race conditions and reduces unnecessary network traffic.