# Echo History – System Overview

## Purpose
A full AI conversation history and analytics suite for Echo Chat, including:
- Thread storage, exports, sharing, tagging, relevance sorting
- Keyboard navigation, accessibility, and admin analytics dashboard

## Architecture

### Database Tables
- **`echo_threads`** - Main conversation threads
- **`echo_messages`** - Individual messages within threads
- **`echo_tags`** - Tag definitions per owner
- **`echo_thread_tags`** - Junction table linking threads to tags
- **`echo_shares`** - Share tokens for public conversation links
- **`analytics_events`** - Event tracking for analytics

### RPC Functions

#### Search & History
- **`echo_history_search`** - Full-text search with relevance scoring, tag filtering, and date ranges

#### Tagging
- **`echo_tags_add_to_thread`** - Add tags to a thread
- **`echo_tags_set_for_thread`** - Replace all tags for a thread
- **`echo_tags_remove_from_thread`** - Remove a specific tag
- **`echo_tags_suggest`** - Autocomplete tag suggestions

#### Sharing
- **`echo_share_create`** - Generate public share token
- **`echo_share_revoke`** - Revoke a share token
- **`echo_share_resolve`** - Validate and resolve share token
- **`echo_share_get_by_thread`** - Get existing shares for a thread
- **`echo_share_get_thread`** - Get thread data for public view

#### Analytics
- **`echo_analytics_overview_guarded`** - KPI summary (threads, exports, shares, users)
- **`echo_analytics_timeseries_guarded`** - Daily activity trends
- **`echo_analytics_top_tags_guarded`** - Most used tags
- **`echo_analytics_export_formats_guarded`** - Export format breakdown
- **`echo_analytics_top_threads_guarded`** - Most opened conversations
- **`echo_analytics_overview_delta`** - Period-over-period KPI deltas

## Client Modules

| Area | Path | Notes |
|------|------|-------|
| Search & relevance | `src/features/echo/hooks/useEchoHistorySearch.ts` | Supports filters, tags, fuzzy match |
| Tagging | `src/features/echo/api/tags.ts` | CRUD + suggest RPCs |
| Exports | `src/features/echo/utils/exportOrchestrator.ts` | Worker offload + HUD feedback |
| Analytics | `src/features/admin/pages/AdminAnalyticsPage.tsx` | Full dashboard view |
| Keyboard Nav | `src/features/hub/pages/HubEchoHistoryPage.tsx` | J/K, O/Enter, Shift+range selection |
| Public Shares | `src/pages/public/SharedEchoThreadPage.tsx` | Public conversation view |

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `echo.kbNav` | true | Enables keyboard shortcuts (persisted via localStorage) |
| `echo.analytics.adminOnly` | true | Restricts analytics tab to full admin users |
| `echo.analytics.csvExport` | true | Enables per-chart CSV buttons |

## Key Features

### 1. Search & Filtering
- Full-text search across thread titles and message content
- Tag-based filtering with `tag:` directive support
- Date range filtering (from/to)
- Relevance-based sorting when search query present
- Starred-first sorting option

### 2. Tagging System
- User-specific tags (no global namespace)
- Inline tag editor in expanded thread view
- Autocomplete suggestions from existing tags
- Case-insensitive, deduplication
- Optimistic UI updates with rollback on error

### 3. Export & Sharing
- Single thread export (JSON/Markdown)
- Bulk ZIP export with progress HUD
- Cancellable exports
- Public share links with revocation
- Share-safe view (no PII exposure)

### 4. Keyboard Navigation
- `J/K` or Arrow keys: Navigate rows
- `O` or `Enter`: Open/close thread
- `Space`: Toggle selection (in select mode)
- `Shift+J/K`: Range selection
- `Home/End`: Jump to first/last
- `?`: Open shortcuts modal

### 5. Admin Analytics
- Overview KPIs with period-over-period deltas
- Activity timeseries (daily aggregation)
- Top tags and export formats breakdown
- Most opened conversations
- Click-to-filter from charts
- CSV export per widget
- Filter persistence via localStorage

## Adding New Analytics

1. **Create new RPC in Supabase** (prefix `echo_analytics_`)
   ```sql
   create or replace function echo_analytics_new_metric(
     p_from timestamptz,
     p_to timestamptz
   ) returns table (...) 
   language plpgsql security definer set search_path = public as $$
   begin
     perform admin_guard();
     -- query logic
   end $$;
   ```

2. **Add API helper** in `src/features/admin/api/analytics.ts`
   ```typescript
   export async function getNewMetric(range: DateRange) {
     const { data, error } = await supabase.rpc('echo_analytics_new_metric', {
       p_from: range.from,
       p_to: range.to,
     });
     if (error) throw error;
     return data ?? [];
   }
   ```

3. **Add useQuery hook** in `src/features/admin/hooks/useAnalytics.ts`
   ```typescript
   export function useAnalyticsNewMetric(range: DateRange) {
     return useQuery({
       queryKey: ['admin.analytics.newMetric', range],
       queryFn: () => getNewMetric(range),
       staleTime: 30_000,
     });
   }
   ```

4. **Bind chart or KPI** in `AdminAnalyticsPage.tsx`

5. **Track event** in `src/features/echo/analytics/echoHistoryAnalytics.ts` (optional)

## Security & RLS

All Echo History tables have Row-Level Security (RLS) enabled with policies ensuring:
- Users can only access their own threads, messages, tags
- Share tokens are validated before granting access to public views
- Admin analytics functions are gated by `is_admin()` RPC
- Analytics events table allows insert for authenticated users, read for admins only

## Performance Considerations

### Indexes
Critical indexes for search performance:
```sql
-- Echo threads
create index idx_echo_threads_user on echo_threads(user_id, created_at desc);
create index idx_echo_threads_starred on echo_threads(user_id, is_starred) where is_starred = true;

-- Echo messages
create index idx_echo_messages_thread on echo_messages(thread_id, created_at);

-- Echo tags
create index idx_echo_tags_user_tag on echo_tags(owner_id, name_norm);
create index idx_echo_thread_tags_thread on echo_thread_tags(thread_id);
create index idx_echo_thread_tags_tag on echo_thread_tags(tag_id);

-- Analytics events
create index idx_analytics_events_created_at on analytics_events(created_at desc);
create index idx_analytics_events_name on analytics_events(name);
create index idx_analytics_events_user on analytics_events(user_id);
```

### Query Optimization
- Full-text search uses `ts_rank` for relevance scoring
- Search results limited to 200 by default
- Analytics queries aggregate at day-level for timeseries
- Virtual scrolling for large thread lists (via `react-window`)

## Accessibility

- All interactive elements have appropriate ARIA labels
- Keyboard navigation fully supported
- Focus management for modals and expanded views
- Screen reader announcements for state changes
- Respects `prefers-reduced-motion` for animations

## Browser Compatibility

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Web Workers for ZIP export (all modern browsers)
- localStorage for preferences (graceful fallback)
- No IE11 support

## Known Limitations

1. **Search**: First 200 results only (can be adjusted in RPC)
2. **Export**: 50-page limit for document parsing
3. **Tags**: No tag hierarchies or categories
4. **Sharing**: No expiration auto-cleanup (manual revocation only)
5. **Analytics**: Daily granularity only (no hourly breakdown)

## Future Enhancements

- [ ] Tag categories and color coding
- [ ] Conversation folders/collections
- [ ] Collaborative sharing (multiple users)
- [ ] Export scheduling and automation
- [ ] Real-time analytics (WebSocket updates)
- [ ] Advanced search operators (AND/OR/NOT)
- [ ] Conversation templates
- [ ] AI-powered conversation summarization
