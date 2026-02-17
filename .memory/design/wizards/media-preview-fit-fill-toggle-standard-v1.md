# Memory: design/wizards/media-preview-fit-only-standard-v2
Updated: now

The Post and Review Wizards use a fixed **4:5 aspect ratio** container for media preview in **Fit-only mode** (no toggle):

1. **Container**: Fixed `aspect-[4/5]` ratio, transparent background so the wizard's CanonicalAmberBg shows through
2. **Display**: Always `object-contain` — shows full media at natural aspect ratio, centered
3. **No Toggle**: The Fit/Fill toggle has been removed; Fill mode no longer exists in wizard contexts
4. **No Scrims/Gradients**: All dark gradient overlays (top/bottom scrims) and BlurredMediaBackground have been removed from the wizard media stack

**Key Components**:
- `MediaCarousel.tsx`: Always renders media with `objectFit="contain"`, no display mode props
- `CreateMomentMediaStage.tsx`: No displayMode state or localStorage persistence
- `CarouselSlide.tsx`: Always uses `object-contain` / `max-w-full max-h-full` styling

**Rationale**: Fit-only mode provides a clean, consistent preview where the media floats on the wizard's branded background. Removes visual noise from blur fills, dark gradients, and mode-switching UI.
