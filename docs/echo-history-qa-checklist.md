# Echo History QA Regression Checklist

## Search & Relevance
- [ ] Search highlights update live as you type
- [ ] No double-wrapped `<mark>` tags in results
- [ ] "Relevance" sort mode instantly resorts when query present
- [ ] Quoted phrases match exact text
- [ ] Tag directive (`tag:#foo`) filters correctly
- [ ] Date filters (from/to) work as expected
- [ ] Empty search shows all threads (unfiltered)
- [ ] Clear button removes all filters and highlights

## Keyboard Navigation
- [ ] `J/K` keys move focus down/up
- [ ] Arrow keys also move focus
- [ ] `O` or `Enter` expands/collapses focused thread
- [ ] `Space` toggles selection in select mode
- [ ] `Shift+J/K` performs range selection
- [ ] `Home` jumps to first thread
- [ ] `End` jumps to last thread
- [ ] `?` opens shortcuts modal
- [ ] `Esc` closes shortcuts modal
- [ ] Focus ring visible on keyboard navigation
- [ ] Auto-scroll keeps focused row in view
- [ ] Keyboard shortcuts disabled in text inputs

## Tagging
- [ ] Add tag via inline editor
- [ ] Remove tag via "x" button
- [ ] Tag suggestions appear as you type
- [ ] Autocomplete navigable with arrow keys
- [ ] Enter accepts suggestion
- [ ] Duplicate tags ignored
- [ ] Case-insensitive tag matching
- [ ] Tags update optimistically
- [ ] Failed tag operations show toast error
- [ ] Tag filter pill displays active tag
- [ ] Clicking tag pill clears filter

## Exports
- [ ] Single thread export to JSON works
- [ ] Single thread export to Markdown works
- [ ] Bulk export creates valid ZIP file
- [ ] Progress HUD shows during export
- [ ] Percentage and file count update correctly
- [ ] Cancel button stops export immediately
- [ ] Export completion shows success toast
- [ ] ZIP contains all selected conversations
- [ ] Filenames are sanitized (no special chars)
- [ ] Large exports (50+ threads) complete without error

## Sharing
- [ ] Create share link generates unique token
- [ ] Share link copies to clipboard
- [ ] Public share page loads without auth
- [ ] Public page displays thread correctly
- [ ] Public page hides sensitive data (user_id, etc.)
- [ ] Revoke share invalidates link
- [ ] Revoked links show error message
- [ ] Share info displays in context menu

## Analytics Dashboard
- [ ] Dashboard loads in under 1.5 seconds
- [ ] All KPIs display correct values
- [ ] Period deltas show green/red arrows
- [ ] Timeseries chart renders correctly
- [ ] Top tags bar chart renders
- [ ] Export formats pie chart renders
- [ ] Top threads bar chart renders
- [ ] CSV export buttons present on all charts
- [ ] CSV downloads contain valid data
- [ ] Click on tag bar applies tag filter
- [ ] Click on format pie slice applies event filter
- [ ] Filter inputs update query results
- [ ] Filter persistence works (localStorage)
- [ ] Date range presets (7d/30d/90d) work
- [ ] Custom date range selection works

## Accessibility
- [ ] All rows have `role="option"`
- [ ] Selected rows have `aria-selected="true"`
- [ ] Keyboard focus visible with focus ring
- [ ] Screen reader announces selection changes
- [ ] Modals trap focus
- [ ] Modal close buttons accessible via keyboard
- [ ] Chart elements have ARIA labels
- [ ] Live region announces state changes
- [ ] All interactive elements keyboard-navigable
- [ ] Color contrast meets WCAG AA standards

## Admin Gating
- [ ] Non-admin users cannot access `/admin/analytics`
- [ ] Admin guard RPC returns false for non-admins
- [ ] Analytics queries fail gracefully for non-admins
- [ ] Admin menu item hidden for non-admin users
- [ ] Direct URL access redirects non-admins

## Dark Mode
- [ ] All text readable in dark mode
- [ ] Highlights (`<mark>`) have sufficient contrast
- [ ] Focus rings visible in dark mode
- [ ] Charts use theme-aware colors
- [ ] Card backgrounds semi-transparent
- [ ] Border colors visible
- [ ] Hover states visible

## Performance
- [ ] Search query completes in < 150ms (cached)
- [ ] Initial page load < 1 second
- [ ] Virtualized list scrolls smoothly (60fps)
- [ ] No layout shift during search
- [ ] Analytics dashboard loads < 1.5 seconds
- [ ] CSV export completes instantly for < 100 rows
- [ ] ZIP export handles 200+ threads without freeze
- [ ] No memory leaks during extended use

## Mobile Responsiveness
- [ ] Search bar full width on mobile
- [ ] Filter pills wrap correctly
- [ ] Charts scale to fit screen
- [ ] Touch scrolling smooth
- [ ] Swipe gestures work (if implemented)
- [ ] Modals display correctly
- [ ] Keyboard shows for text inputs
- [ ] Navigation accessible

## Error Handling
- [ ] Network errors show toast notifications
- [ ] Failed RPC calls don't crash UI
- [ ] Invalid share tokens show error page
- [ ] Export failures show error toast
- [ ] Tag operation failures rollback optimistic UI
- [ ] Analytics query errors display fallback message
- [ ] Empty states show helpful messages

## Edge Cases
- [ ] Threads with no messages display correctly
- [ ] Very long thread titles truncate with ellipsis
- [ ] Special characters in tags handled correctly
- [ ] Empty search results show "no results" message
- [ ] Extremely long messages display without breaking layout
- [ ] Multiple rapid filter changes handled gracefully
- [ ] Concurrent export operations handled
- [ ] Share links with expired tokens handled

## Browser Compatibility
- [ ] Works in Chrome 90+
- [ ] Works in Firefox 88+
- [ ] Works in Safari 14+
- [ ] Works in Edge 90+
- [ ] Web Workers supported
- [ ] localStorage available

## Security
- [ ] RLS policies prevent unauthorized access
- [ ] Share tokens are unguessable (UUID)
- [ ] Public pages don't expose PII
- [ ] Admin functions check `is_admin()`
- [ ] SQL injection not possible via search
- [ ] XSS not possible via user content
