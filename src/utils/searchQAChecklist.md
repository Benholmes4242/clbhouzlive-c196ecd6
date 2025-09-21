# Global Search QA Checklist

## ✅ Functionality Tests

### Entity-Only Results
- [x] Header search returns only people, clubs/courses, pages (no posts)
- [x] Discover search still handles media/posts separately
- [x] useGlobalEntitySearch used for header only

### Search Relevance
- [x] "Augusta" prioritizes clubs/courses over low-score people
- [x] Clubs appear before random people with weak name matches
- [x] Global rankings influence course result ordering

### Keyboard Navigation
- [x] ↑/↓ arrows move through results
- [x] Enter selects highlighted item
- [x] Esc closes dropdown
- [x] Tab cycles through interface elements
- [x] Focus indicators visible with high contrast

### Recent/Trending Behavior
- [x] Recent searches appear on focus with empty query
- [x] Trending items show when no recent searches
- [x] Results disappear when typing begins
- [x] Clicking chips fills input and triggers search
- [x] Max 8 recent searches stored

### Routing Verification
- [x] People → `/profile/:username` or `/profile/:id`
- [x] Clubs/Courses → `/courses/:id`
- [x] Pages → (ready for future implementation)
- [x] SearchRouter handles navigation consistently

## ✅ Performance Tests

### Response Times
- [x] Warm cache results render <300ms
- [x] 250ms debounce prevents excessive queries
- [x] React Query cancels in-flight requests
- [x] No flicker during rapid typing

### Database Optimization
- [x] Indexes on display_name, username, course name
- [x] Composite indexes for public users/ranked courses
- [x] Query limits: 6-8 per section, ~20 total

## ✅ Mobile & Accessibility

### Mobile Sheet Behavior
- [x] Full-width sheet on mobile
- [x] Anchored below header input
- [x] Independent scrolling
- [x] Safe area padding at bottom
- [x] Proper touch targets (≥44px)
- [x] Row height ≥56px

### Accessibility Features
- [x] ARIA labels and roles
- [x] High-contrast focus rings
- [x] Screen reader announcements
- [x] Keyboard-only navigation
- [x] Reduced motion support (≤120ms transitions)

### Motion & Animation
- [x] Respects prefers-reduced-motion
- [x] Fade/scale animations ≤120ms
- [x] No large transforms in reduced motion
- [x] Smooth transitions on capable devices

## 🔧 Architecture Notes

### Component Separation
- [x] SearchPill: UI component with proper hook integration
- [x] useGlobalEntitySearch: Global search for header only
- [x] useMediaSearch: Separate for Discover page
- [x] No mixing between header/discover search

### Optimization Details
- [x] React Query keys: `['global-search', type, query]`
- [x] 2-5 minute cache with 5-10 minute garbage collection
- [x] Automatic request cancellation on query change
- [x] Analytics tracking for performance monitoring

## ✅ Cross-Platform Testing

### Desktop
- [x] Dropdown positioned correctly
- [x] Hover states work
- [x] Focus management
- [x] Keyboard shortcuts

### Mobile
- [x] Sheet slides up smoothly
- [x] Touch targets appropriate size
- [x] Scroll behavior isolated
- [x] Virtual keyboard handling

### Tablet
- [x] Responsive layout
- [x] Touch and mouse support
- [x] Appropriate sizing

**Status: ✅ ALL TESTS PASSED**
**Ready for production deployment**