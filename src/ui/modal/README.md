# Modal System Documentation

## Overview

This document describes the standardized modal implementation extracted from ProfileModalRouter to ensure consistent behavior across all slide-in modals in the application.

## Extracted Values from ProfileModalRouter

### Sizing & Layout
- **Mobile Width**: `w-full` (100% viewport width)
- **Desktop Width**: `w-[90vw]` with `max-w-[860px]` constraint
- **Height**: Full viewport (`inset-y-0` desktop, `top-0 bottom-0` mobile)
- **Position**: Right-aligned slide-in panel
- **Border Radius**: `rounded-l-2xl` (desktop only)

### Animation Specifications
- **Transform**: `translateX(100%)` → `0` → `translateX(100%)`
- **Duration**: `0.25` seconds
- **Easing**: `easeInOut`
- **Type**: `tween` (Framer Motion)

### Overlay/Backdrop
- **Background**: `bg-black/50` (50% opacity black)
- **Blur**: None (unlike Echo's current blur effect)
- **Click to Close**: Yes

### Z-Index Hierarchy
- **Container**: `z-[1000]`
- **Panel**: `z-10` (relative to container)
- **Portal Content**: `z-[1001]` (for nested modals)

### Behavior Features
- ✅ Escape key close (when not in transition)
- ✅ Overlay click close
- ✅ Body scroll lock (`document.body.style.overflow = 'hidden'`)
- ✅ Basic focus management
- ❌ Swipe to close (not implemented)
- ❌ Advanced focus trapping

## Shared Constants Structure

### Files Created
- **`src/ui/modal/constants.ts`** - All sizing, timing, and behavior constants
- **`src/ui/modal/variants.ts`** - Framer Motion variants and transitions

### Usage Pattern
```typescript
import { MODAL_PANEL_SIZES, MODAL_ANIMATION, MODAL_Z_INDEX } from '@/ui/modal/constants';
import { panelVariants, transition } from '@/ui/modal/variants';
```

## Current Echo Modal Status

### AIChatOverlay.tsx
- ✅ Imports shared constants  
- 🟡 Still uses current styling (will be updated in future phase)
- 📝 Added comments referencing ProfileModalRouter patterns

### AIChatHistory.tsx  
- ✅ Imports shared constants
- 🟡 Still uses current styling (will be updated in future phase)  
- 📝 Added comments referencing ProfileModalRouter patterns

## Differences Between Echo and ProfileModalRouter

| Feature | ProfileModalRouter | Echo Current |
|---------|-------------------|--------------|
| **Z-Index** | `z-[1000]` | `z-[9999]` |
| **Overlay Style** | `bg-black/50` | `rgba(0, 0, 0, 0.35)` with blur |
| **Layout** | Right-slide panel | Center-positioned modal |
| **Width** | Responsive (90vw max 860px) | Fixed (448px) |
| **Animation** | Right slide | Scale + fade |
| **Background** | Solid | Glassmorphic with blur |

## Next Steps (Future Implementation)

1. **Phase 2**: Update Echo modals to use ProfileModalRouter's exact layout pattern
2. **Phase 3**: Apply ProfileModalRouter's animation system 
3. **Phase 4**: Standardize overlay and backdrop behavior
4. **Phase 5**: Implement consistent z-index hierarchy

## QA Verification Points

When implementing ProfileModalRouter behavior:

- [ ] Open/close timing matches exactly (0.25s easeInOut)
- [ ] Panel width responsive behavior (90vw max 860px desktop, full mobile)
- [ ] Right-slide animation (translateX 100% → 0)
- [ ] Overlay opacity (black/50, no blur)
- [ ] Z-index stacking (z-[1000] container)
- [ ] Close behaviors (overlay click, Esc key)
- [ ] Body scroll lock behavior
- [ ] No layout shift on open/close

## Implementation Status

✅ **Completed**: Discovery, documentation, shared constants creation  
🟡 **In Progress**: Echo modal imports and preparation  
⏳ **Pending**: Visual behavior standardization (future phase)

This foundation ensures that when Echo modals are updated to match ProfileModalRouter exactly, all timing, sizing, and behavior values will be consistent and maintainable.