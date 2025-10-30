# Design Review Mode

## Overview
Step-by-step UI review system for fine-tuning the Nearby Golfers and Create Game flows.

## How to Enable
Add `?review=1` to any URL:
```
https://yourapp.lovable.app/?review=1
```

## Features
- **Step Runner Panel**: Floating control panel at bottom of screen
- **State Navigation**: Prev/Next buttons and dropdown to jump to any state
- **Screenshot Capture**: Save PNG snapshots of each state
- **Spacing Guides**: Toggle 8px grid overlay
- **Design Tokens**: View spacing, typography, and color tokens for each state

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

## Implementation Status
⚠️ **Build Error**: Circular dependency detected in new modules. Needs refactoring to break the circular import chain between context, types, and hooks.

## Next Steps
1. Fix circular dependency (likely in DesignReviewContext importing from hooks)
2. Test state navigation
3. Verify screenshot functionality
4. Add PDF export for full flow sequences
