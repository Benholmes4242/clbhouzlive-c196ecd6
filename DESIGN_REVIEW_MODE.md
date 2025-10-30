# Design Review Mode

## Overview
Step-by-step UI review system for fine-tuning the Nearby Golfers and Create Game flows using the "Island" architecture to avoid circular dependencies.

## How to Enable
Add `?review=1` to any URL:
```
https://yourapp.lovable.app/?review=1
```

## Architecture

### Island Approach
Design Review Mode uses a completely isolated "island" architecture:
- **No imports from main app** - The island is self-contained
- **Dynamic loading** - Only loads when `?review=1` is present
- **Runtime API** - Components communicate via `window.__DRM` global
- **Zero circular dependencies** - Not part of the build-time module graph

### File Structure
```
src/review-island/
  ├── bootstrap.tsx      # Island initialization
  ├── panel.tsx          # Step Runner UI
  ├── states.ts          # 16 flow states
  └── overrides.ts       # Fixed mock data + types

src/ReviewIslandLoader.tsx  # Lazy loader component
src/utils/reviewHelpers.ts  # Helper functions for components
```

## Features
- **Step Runner Panel**: Floating control panel at bottom-right of screen
- **State Navigation**: Prev/Next buttons and dropdown to jump to any state
- **Screenshot Capture**: Download PNG snapshots with semantic filenames
- **Fixed Mock Data**: Consistent golfers and game beacons for reproducibility
- **No Build Dependencies**: Lazy-loaded island won't affect app bundle

## State Flows

### Nearby Golfers Flow (8 states)
1. Open Modal - Full-screen with glass background
2. Visibility Row - Segmented control
3. Divider Line - Separator
4. Open to Play Section - Toggle with timer
5. Game Text Block - Section header
6. Golfers / Games Tabs - Navigation
7. Golfers List - Active golfers with cards
8. Games List - Available games

### Create Game Flow (8 states)
1. Open Modal - Full-screen (matches Nearby)
2. Game Type Selection - Grid of buttons
3. Location Input - Course search
4. Note Field - Textarea
5. When Selection - Timing options
6. Players Needed - Player count
7. Handicap Fields - Input fields
8. Create Button - Submit with validation

## Fixed Mock Data
All states use consistent fixtures from `src/features/design-review/fixtures.ts`:
- 5 nearby golfers
- 3 game beacons
- Reproducible data for screenshots

## Controls
- **Prev/Next**: Navigate between states
- **Jump to...**: Select any state from dropdown
- **Screenshot**: Capture current state as PNG
- **Grid**: Toggle 8px spacing guides overlay
- **Tokens**: Show design tokens for current state
- **X**: Exit review mode

## Screenshot Naming
Screenshots are saved with semantic names:
- `nearby-01-open-modal.png`
- `nearby-02-visibility-row.png`
- `creategame-01-open-modal.png`
- etc.

## Using Overrides in Components

Components can access fixed mock data without importing from the island:

```typescript
import { getDRMOverrides, isDRMActive } from '@/utils/reviewHelpers';

function NearbyGolfersList() {
  // Get overrides for this state
  const overrides = getDRMOverrides('nearby-07-golfers-list');
  
  // Use fixed data if available, otherwise use real data
  const golfers = overrides.nearbyGolfers || realGolfers;
  
  // Or check if review mode is active
  if (isDRMActive()) {
    // Use fixed data
  }
  
  return (/* render golfers */);
}
```

### Available Helper Functions
- `getDRMOverrides(stateId: string)` - Get fixed data for a state
- `getDRMState()` - Get current state info
- `isDRMActive()` - Check if review mode is running

## Implementation Status
✅ **Complete and Working**
- Island architecture implemented
- Lazy loading via `ReviewIslandLoader`
- 16 flow states defined
- Fixed mock data included
- Screenshot functionality ready
- No circular dependencies

## Next Steps
1. Open app with `?review=1`
2. Step through all 16 states using Prev/Next
3. Capture screenshots of each state
4. Update components to use `getDRMOverrides()` where needed
5. Fine-tune spacing, copy, and visuals based on screenshots
