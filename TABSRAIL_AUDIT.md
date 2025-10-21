# TabsRail Audit - Discover Page

**Generated:** 2025-10-21  
**Purpose:** Document current TabsRail implementation for 1:1 swap to Floating Pill Indicator

---

## 1. Component Map & Ownership

### Entry Point
- **Path:** `src/pages/Discover.tsx` (lines 170-174)
- **Component:** `<SegmentedControl>` imported from `src/components/discover/SegmentedControl.tsx`

### Component Hierarchy
```
Discover (page)
└── SegmentedControl
    ├── .discover-header (container)
    ├── .discover-tabs (tabs container)
    │   ├── flex div wrapper
    │   │   └── tab buttons (4x: Shorts, Videos, Channels, Following)
    │   └── Search button (conditional, Videos only)
    └── (no animated indicator currently - removed)
```

### Child Components
- **Tab buttons:** Simple `<button>` elements, no dedicated component
- **Search icon:** Lucide React `<Search>` component
- **No indicator component:** Previous animated underline was removed

### Shared Primitives/Hooks
- **`useDiscoverQuery()`** - `src/utils/useDiscoverQuery.ts`
  - Single source of truth for active tab state
  - Manages URL params: `main`, `sub`, `duration`, `topics`, `topic`, `channel`
  - Provides `setMain()` to switch tabs
- **`cn()`** - `src/lib/utils` - className utility
- **React hooks:** `useState`, `useRef`, `useEffect` for internal state management

---

## 2. DOM & Layout

### Rendered Structure
```html
<div class="discover-header relative w-full" ref={containerRef}>
  <div class="discover-tabs flex w-full items-center">
    <div class="flex flex-1">
      <button class="discover-tab flex-1 py-3 px-4 text-center relative z-10 text-[16px] active">Shorts</button>
      <button class="discover-tab flex-1 py-3 px-4 text-center relative z-10 text-[16px]">Videos</button>
      <button class="discover-tab flex-1 py-3 px-4 text-center relative z-10 text-[16px]">Channels</button>
      <button class="discover-tab flex-1 py-3 px-4 text-center relative z-10 text-[16px]">Following</button>
    </div>
    <!-- Search button if onOpenVideoSearch prop provided -->
    <button class="p-2 mr-2 hover:bg-black/5 rounded-full transition-colors">
      <Search size={20} />
    </button>
  </div>
</div>
```

### Layout Model
- **Container:** Flexbox (`display: flex`)
- **Tab distribution:** Each tab uses `flex-1` (equal width distribution)
- **Gap:** `gap: 0` (no spacing between tabs)
- **Alignment:** `items-center`

### Spacing Tokens
- **Vertical padding:** `py-3` (12px)
- **Horizontal padding:** `px-4` (16px)
- **Search button margin:** `mr-2` (8px right margin)
- **Search button padding:** `p-2` (8px all sides)

### Sticky Behavior
- **NOT currently sticky** - no position: sticky or fixed applied
- **Z-index:** Container has `z-30` in parent (Discover.tsx line 169)
- **iOS safe area:** No explicit safe-area-inset handling in tabs themselves

### Horizontal Scroll
- **Not scrollable** - tabs use `flex-1` equal distribution
- **No overflow:** `overflow: visible` by default
- All 4 tabs always visible on screen

---

## 3. State & Routing Logic

### Source of Truth
- **URL query parameter:** `?main=shorts|videos|channels|following`
- **Hook:** `useDiscoverQuery()` reads from `useSearchParams()`
- **State accessor:** `const { main, setMain } = useDiscoverQuery()`

### Tab Click Flow
```typescript
// SegmentedControl.tsx line 46-48
const handleTabClick = (tabId: string) => {
  setMain(tabId as MainPill);
};

// useDiscoverQuery.ts line 38-40
function setMain(next: MainPill) {
  navigate({ search: `?main=${next}` }, { replace: false });
}
```

### Deep Linking
- ✅ Supported: Direct URL navigation works (`/discover?main=channels`)
- ✅ Back/forward: Browser history maintained (`replace: false`)

### Persistence
- URL-based state = natural persistence via browser history
- No localStorage or session storage used
- Tab state survives page refresh

### Legacy Route Mapping
```typescript
// useDiscoverQuery.ts lines 13-15
if (rawMain === "friends") mappedMain = "following";
if (rawMain === "photos") mappedMain = "videos";
```

---

## 4. Styles & Theming

### Style Sources
- **Primary CSS:** `src/styles/discover-tabs.css`
- **Tailwind classes:** Applied inline via `className` in SegmentedControl.tsx
- **No CSS modules or styled-components**

### Design Tokens (CSS Variables)
```css
/* discover-tabs.css */
:root {
  --tab-active-color: #f5a623;          /* Orange active state */
  --tab-active-gradient: linear-gradient(135deg, #f5a623, #ff8c00);
  --tab-active-shadow: 0 2px 8px rgba(245,166,35,0.25);
}
```

### Container Styles
```css
/* .discover-header */
background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(18px) saturate(180%);
-webkit-backdrop-filter: blur(18px) saturate(180%);
border-bottom: 1px solid rgba(255, 255, 255, 0.35);
box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
transition: all 0.3s ease;
```

### Tab Base Styles
```css
/* .discover-tab */
position: relative;
padding: 12px 0;                              /* overridden by Tailwind py-3 px-4 */
color: rgba(0,0,0,0.65);                     /* inactive text color */
font-weight: 500;
transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
```

### Active Tab Styles
```css
/* .discover-tab.active */
color: #f5a623;                              /* orange */
font-weight: 600;
transform: scale(1.04);                      /* subtle scale-up */
transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
```

### Inactive Tab Interaction
```css
/* Tailwind: hover:text-foreground/70 */
hover: color: hsl(var(--foreground) / 0.7);
```

### Active State Indicator
- **REMOVED:** Previous `::after` pseudo-element underline (lines 40-51 commented out)
- **No current indicator**

### Dark Mode
- **NOT IMPLEMENTED** for tabs
- Uses HSL color tokens from `src/index.css`

---

## 5. Animation/Motion

### Tab Switch Animation
- **Active tab:** `transform: scale(1.04)` on active state
- **Tap feedback:** `transform: scale(0.97)` on `:active` pseudo-class
- **Duration:** `0.2s`
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (custom ease-out)

### Header Transition
```css
transition: all 0.3s ease;
```

### Removed Features
- **Animated underline indicator:** Previously tracked via `indicatorStyle` state
- **Transform animation:** `translateX()` movement removed

### Performance Notes
- Simple scale transforms (GPU-accelerated)
- No layout thrashing
- No FPS measurements documented

---

## 6. Responsiveness

### Breakpoints
- **No explicit breakpoints** for tabs themselves
- Uses `flex-1` for all screen sizes
- Search icon always visible (when prop provided)

### Small Screens (≤360px)
- Equal width distribution via `flex-1`
- `text-[16px]` fixed font size (no clamping)
- May cause tight spacing with long labels

### Tablet & Desktop
- Same layout (no changes)
- Constrained by parent container max-width

### Overflow Handling
- No overflow - all 4 tabs always fit
- Text does not wrap (`text-center` single line)
- No ellipsis truncation

---

## 7. Accessibility

### ARIA/Roles
- **Missing:** No `role="tablist"`, `role="tab"`, or `aria-controls`
- **Missing:** No `aria-selected` state
- **Semantic:** Uses `<button>` elements (keyboard accessible)

### Keyboard Support
- **Tab navigation:** Native button focus (working)
- **Enter/Space:** Native button activation (working)
- **Arrow keys:** NOT implemented
- **Home/End:** NOT implemented

### Focus Indicators
- **Default browser focus ring** (not customized)
- **No visible focus styling** in CSS

### Screen Readers
- Tab labels are announced via button text content
- No additional aria-label or description

**Recommendation:** Add full ARIA tablist pattern for production

---

## 8. Interactions & Edge Cases

### Gesture Conflicts
- **No horizontal swipe detection** - standard button clicks only
- **Vertical scroll:** Not affected (no sticky positioning)

### Network/Empty States
- Tabs render immediately (no loading state)
- Content below handles loading spinners
- Empty content handled by child components

### Tab Switching
- **Instant:** URL updates immediately
- **Content loads** via `SlidingPanels` component with slide animations
- **No loading indicator** on tabs themselves

### Disabled Tabs
- **NOT IMPLEMENTED** - all tabs always enabled

### Feature Flags
- **Videos search button:** Conditional on `onOpenVideoSearch` prop
- No other feature flags affect tabs

---

## 9. Z-index & Stacking

### Z-index Values
```typescript
// Parent container (Discover.tsx line 169)
className="relative z-30"

// Tab buttons (SegmentedControl.tsx line 64)
className="... relative z-10"
```

### Stacking Context
```
z-30 (tabs container)
  └── z-10 (individual tab buttons)
```

### Interactions
- **Global header:** Likely higher z-index (not in audit scope)
- **Echo FAB:** `--z-echo-fab: 1200` (src/index.css line 89)
- **Modals:** `--z-modal: 1500`
- **No conflicts** expected with current z-index values

---

## 10. Data & Performance

### Content Loading Strategy
- **Eager:** Tabs render immediately
- **Content lazy loading:** Handled by `SlidingPanels` and child components
- **Following tab:** Lazy loaded via `React.lazy()` (Discover.tsx line 26)

### Caching
- React Query manages content caching
- No tab-specific caching logic
- Browser caches URL state (back/forward)

### Memoization
- **No useMemo** in SegmentedControl
- **useEffect** reruns on `main` change (indicator positioning - now unused)

### Virtualization
- Not applicable (only 4 tabs, always visible)

---

## 11. Analytics & Tests

### Current Analytics Events
```typescript
// src/utils/analyticsEvents.ts
videos: {
  tabView: (duration: string, topics: string[]) => {
    analyticsEvents.track('videos_tab_view', { duration, topics, session_id });
  },
  filterChange: (duration: string, topics: string[]) => {
    analyticsEvents.track('videos_filter_change', { duration, topics, session_id });
  }
}
```

### Missing Analytics
- **No tab click events** tracked in SegmentedControl
- **No tab impression events**
- **Videos-specific only** (not tracked for Shorts/Channels/Following)

### Tests
- **No unit tests** found for SegmentedControl
- **No e2e tests** found referencing tabs
- **No visual regression snapshots**

**Recommendation:** Add analytics for tab clicks before redesign

---

## 12. Exact Style Measurements

### Typography
| Property | Value | Notes |
|----------|-------|-------|
| Font family | `League Spartan` | From index.css, fallback: system-ui |
| Font size | `16px` | Hardcoded via `text-[16px]` |
| Font weight (inactive) | `500` | Medium |
| Font weight (active) | `600` | Semibold |
| Letter spacing | `0` (default) | Not specified |
| Line height | Default | Not specified (~1.5) |

### Tab Button (Inactive)
| Property | Value |
|----------|-------|
| Padding vertical | `12px` (`py-3`) |
| Padding horizontal | `16px` (`px-4`) |
| Color | `rgba(0,0,0,0.65)` |
| Background | `transparent` |
| Border | None |
| Border radius | None |
| Shadow | None |
| Transform | `scale(1)` |

### Tab Button (Active)
| Property | Value |
|----------|-------|
| Color | `#f5a623` (orange) |
| Font weight | `600` |
| Transform | `scale(1.04)` |
| Background | `transparent` |
| Shadow | None |

### Tab Button (Hover - Inactive)
| Property | Value |
|----------|-------|
| Color | `hsl(var(--foreground) / 0.7)` |

### Tab Button (Active/Press)
| Property | Value |
|----------|-------|
| Transform | `scale(0.97)` |

### Container
| Property | Value |
|----------|-------|
| Gap between tabs | `0` |
| Container padding | `0` |
| Background | `rgba(255, 255, 255, 0.75)` |
| Backdrop filter | `blur(18px) saturate(180%)` |
| Border bottom | `1px solid rgba(255, 255, 255, 0.35)` |
| Shadow | `0 2px 6px rgba(0, 0, 0, 0.05)` |

### Indicator/Underline
- **REMOVED** - Previously existed as `::after` pseudo-element
- No current indicator implementation

### Spacing Summary
- **Total tab rail height:** ~48px (12px padding top + bottom + 16px text + 8px buffer)
- **Individual tab width:** 25% of container (4 equal columns)
- **Search button:** 20px icon + 8px padding = 36px total

---

## 13. File Pointers

### Source Files
```
src/pages/Discover.tsx                          # Page entry point
src/components/discover/SegmentedControl.tsx    # Tab component
src/styles/discover-tabs.css                    # Tab styles
src/utils/useDiscoverQuery.ts                   # Routing logic
src/constants/discoverPills.ts                  # Tab type definitions
```

### Dependencies
```
tailwind.config.ts                              # Tailwind config
src/index.css                                   # Global styles & tokens
src/lib/utils.ts                                # cn() utility
```

### Related Components
```
src/components/discover/DiscoverVideosHeader.tsx  # Video duration filters
src/components/explore/ExploreFilters.tsx         # Sub-pill filters
src/components/ui/SlidingPanels.tsx               # Content slide animations
```

---

## Code Snippets

### Container
```tsx
<div 
  ref={containerRef}
  className="discover-header relative w-full"
>
  <div className="discover-tabs flex w-full items-center">
    {/* tabs */}
  </div>
</div>
```

### Tab Button
```tsx
<button
  key={tab.id}
  ref={el => tabRefs.current[index] = el}
  onClick={() => handleTabClick(tab.id)}
  className={cn(
    "discover-tab flex-1 py-3 px-4 text-center relative z-10 text-[16px]",
    main === tab.id 
      ? "active" 
      : "hover:text-foreground/70"
  )}
>
  {tab.label}
</button>
```

### Indicator (REMOVED)
```tsx
// Previously tracked indicator position (now unused)
const [indicatorStyle, setIndicatorStyle] = useState({});

useEffect(() => {
  const activeIndex = tabs.findIndex(tab => tab.id === main);
  const activeTabElement = tabRefs.current[activeIndex];
  
  if (activeTabElement && containerRef.current) {
    const containerRect = containerRef.current.getBoundingClientRect();
    const tabRect = activeTabElement.getBoundingClientRect();
    
    setIndicatorStyle({
      width: tabRect.width,
      transform: `translateX(${tabRect.left - containerRect.left}px)`,
    });
  }
}, [main]);
// NOTE: No DOM element renders this style
```

---

## Migration Checklist for Floating Pill

### Must Preserve
- ✅ URL-based state (`?main=shorts`)
- ✅ `useDiscoverQuery()` hook integration
- ✅ 4 tab labels: Shorts, Videos, Channels, Following
- ✅ Search button conditional rendering
- ✅ Browser history (back/forward)
- ✅ `onTabChange` no-op callback (backwards compat)

### Can Change Safely
- ❌ Visual appearance (colors, sizes, pill shape)
- ❌ Animation style (scale → pill movement)
- ❌ Typography (maintain readability)
- ❌ Spacing (adjust for pills)

### Must Add
- ⚠️ ARIA tablist pattern
- ⚠️ Keyboard arrow navigation
- ⚠️ Tab click analytics
- ⚠️ Focus styling

### Must Test
- 📱 Mobile layout (320px - 480px)
- 🖥️ Desktop layout (1024px+)
- ⌨️ Keyboard navigation
- 🎨 Visual regression vs current design
- 📊 Analytics event firing

---

## Current Issues/Debt

1. **No ARIA roles** - fails accessibility audit
2. **No keyboard arrow nav** - standard tab pattern missing
3. **No analytics** - can't measure engagement
4. **No visual indicator** - removed without replacement
5. **Hard-coded text size** - doesn't scale responsively
6. **Missing tests** - no automated coverage

---

## Recommendations for Pill Implementation

### Suggested Approach
1. **Keep container structure** - no changes to DOM hierarchy
2. **Add pill background** - white pill with `border-radius: 9999px`
3. **Adjust spacing** - increase `gap` between tabs to 12px
4. **Remove `flex-1`** - let pills size to content
5. **Add horizontal scroll** - `overflow-x: auto` for future-proofing
6. **Animate pill position** - track active tab and transition `transform`
7. **Add proper ARIA** - complete tablist pattern

### Visual Target
```css
/* Active pill */
background: #FFFFFF;
color: #000000;
font-weight: 600;
padding: 6px 16px;
border-radius: 9999px;
box-shadow: 0 2px 6px rgba(0,0,0,0.08);
transition: all 0.25s ease-in-out;

/* Inactive */
background: transparent;
color: rgba(0,0,0,0.6);
font-weight: 500;
padding: 6px 16px;
```

---

**End of Audit**
