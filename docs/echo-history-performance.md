# Echo History Performance Verification

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Search query | < 150ms | After index warming |
| Initial page load | < 1s | First contentful paint |
| Analytics dashboard | < 1.5s | All charts loaded |
| CSV export | Instant | < 100 rows |
| ZIP export | Smooth | No UI freeze, progress HUD |
| Virtual scroll | 60fps | Smooth scrolling |

## Database Performance Checks

### 1. Search Query Performance

Run in Supabase SQL Editor to verify search performance:

```sql
-- Test basic search
EXPLAIN ANALYZE 
SELECT * FROM echo_history_search(
  p_owner := (SELECT id FROM auth.users LIMIT 1),
  p_query := 'test',
  p_max_results := 50
);
```

**Expected**: Total runtime < 150ms after caching

### 2. Tag Lookup Performance

```sql
-- Test tag filtering
EXPLAIN ANALYZE
SELECT * FROM echo_history_search(
  p_owner := (SELECT id FROM auth.users LIMIT 1),
  p_filter_tag := 'research',
  p_max_results := 50
);
```

**Expected**: Should use `idx_echo_thread_tags_tag` index

### 3. Analytics Query Performance

```sql
-- Test overview aggregation
EXPLAIN ANALYZE
SELECT * FROM echo_analytics_overview_guarded(
  p_from := NOW() - INTERVAL '30 days',
  p_to := NOW()
);
```

**Expected**: < 200ms for 30-day range

### 4. Timeseries Aggregation

```sql
-- Test daily aggregation
EXPLAIN ANALYZE
SELECT * FROM echo_analytics_timeseries_guarded(
  p_from := NOW() - INTERVAL '90 days',
  p_to := NOW()
);
```

**Expected**: < 300ms for 90-day range

## Required Indexes

Verify all critical indexes exist:

```sql
-- Echo threads indexes
CREATE INDEX IF NOT EXISTS idx_echo_threads_user 
  ON echo_threads(user_id, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_echo_threads_starred 
  ON echo_threads(user_id, is_starred) 
  WHERE is_starred = true;

-- Echo messages indexes
CREATE INDEX IF NOT EXISTS idx_echo_messages_thread 
  ON echo_messages(thread_id, created_at);

-- Echo tags indexes
CREATE INDEX IF NOT EXISTS idx_echo_tags_user_tag 
  ON echo_tags(owner_id, name_norm);

-- Echo thread_tags junction
CREATE INDEX IF NOT EXISTS idx_echo_thread_tags_thread 
  ON echo_thread_tags(thread_id);
  
CREATE INDEX IF NOT EXISTS idx_echo_thread_tags_tag 
  ON echo_thread_tags(tag_id);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
  ON analytics_events(created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_analytics_events_name 
  ON analytics_events(name);
  
CREATE INDEX IF NOT EXISTS idx_analytics_events_user 
  ON analytics_events(user_id);
  
CREATE INDEX IF NOT EXISTS idx_analytics_events_props_thread_id 
  ON analytics_events((props->>'thread_id'));
  
CREATE INDEX IF NOT EXISTS idx_analytics_events_props_tag 
  ON analytics_events((props->>'tag'));
```

## Performance Monitoring Queries

### Check table sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'echo_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check index usage
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename LIKE 'echo_%'
ORDER BY idx_scan DESC;
```

### Check slow queries
```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%echo_%'
ORDER BY mean_time DESC
LIMIT 10;
```

## Frontend Performance Checks

### Bundle Size
Check that Echo History modules don't bloat the bundle:

```bash
npm run build
# Check dist/ folder size
# Echo-related chunks should be < 150KB gzipped
```

### Virtual Scrolling
Test with 500+ threads:
1. Open Echo History
2. Scroll rapidly up and down
3. Verify smooth 60fps scrolling
4. Check Chrome DevTools Performance tab

### Memory Usage
1. Open Chrome DevTools Memory tab
2. Take heap snapshot
3. Load Echo History page
4. Scroll through threads
5. Take another snapshot
6. Verify no memory leaks (< 10MB growth)

### Network Requests
1. Open Network tab
2. Load Echo History
3. Verify:
   - Search RPC: < 200ms
   - Tag suggestions: < 100ms
   - Analytics: < 300ms
   - No unnecessary requests

## Optimization Recommendations

### Database
1. **Vacuum regularly**: Run `VACUUM ANALYZE` on Echo tables weekly
2. **Monitor query plans**: Use `EXPLAIN ANALYZE` for new queries
3. **Archive old data**: Move threads older than 2 years to archive table
4. **Partition large tables**: Consider partitioning by date if > 1M rows

### Frontend
1. **Code splitting**: Lazy load Analytics dashboard
2. **Memoization**: Use `useMemo` for expensive computations
3. **Debouncing**: Debounce search input (already implemented)
4. **Virtual scrolling**: Use `react-window` for large lists (already implemented)
5. **Image optimization**: Lazy load thread thumbnails

### Caching
1. **React Query**: Increase staleTime for analytics (currently 30s)
2. **localStorage**: Cache recent searches and filters
3. **Service Worker**: Cache static assets (optional)

## Load Testing

### Simulate High Load
Use Apache Bench or similar tool:

```bash
# Test search endpoint
ab -n 1000 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_PROJECT.supabase.co/rest/v1/rpc/echo_history_search"
```

**Expected**: 95th percentile < 200ms

### Concurrent Exports
1. Open 5 browser tabs
2. Start ZIP export in each
3. Verify all complete successfully
4. Check server CPU and memory usage

## Performance Regression Tests

Add to CI/CD pipeline:

```javascript
// cypress/e2e/echo-history-performance.cy.js
describe('Echo History Performance', () => {
  it('loads in under 1 second', () => {
    cy.visit('/hub/echo-history');
    cy.window().then((win) => {
      const perfData = win.performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
      expect(loadTime).to.be.lessThan(1000);
    });
  });

  it('searches in under 200ms', () => {
    cy.intercept('POST', '**/rpc/echo_history_search').as('search');
    cy.get('[data-testid="search-input"]').type('test');
    cy.wait('@search').then((interception) => {
      expect(interception.response.duration).to.be.lessThan(200);
    });
  });
});
```

## Monitoring in Production

### Supabase Monitoring
1. Enable slow query log (> 100ms)
2. Set up alerts for:
   - Query time > 500ms
   - Error rate > 1%
   - RPC failures
3. Monitor connection pool usage
4. Track database size growth

### Application Monitoring
1. Track Core Web Vitals:
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1
2. Monitor error rates
3. Track user engagement metrics
4. Set up performance budgets

## Troubleshooting

### Slow Searches
1. Check if indexes are being used (`EXPLAIN ANALYZE`)
2. Verify no sequential scans on large tables
3. Consider adding full-text search indexes
4. Reduce `p_max_results` parameter

### Slow Analytics
1. Check if date range is too large (> 90 days)
2. Verify `analytics_events` table not too large
3. Add aggregation caching layer
4. Consider materialized views for dashboard

### Memory Leaks
1. Check for unclosed subscriptions
2. Verify cleanup in `useEffect` hooks
3. Remove stale event listeners
4. Clear large data structures on unmount

### High Bundle Size
1. Check for duplicate dependencies
2. Lazy load heavy libraries (Recharts, JSZip)
3. Use dynamic imports for large components
4. Enable tree-shaking in build config
