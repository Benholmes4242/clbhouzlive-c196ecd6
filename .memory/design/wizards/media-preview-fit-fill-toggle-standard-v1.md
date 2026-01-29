# Memory: design/wizards/media-preview-fit-fill-toggle-standard-v1
Updated: now

The Post and Review Wizards use a fixed **4:5 aspect ratio** container for media preview with a **Fit/Fill toggle**:

1. **Container**: Fixed `aspect-[4/5]` ratio matching Instagram feed standard, ensuring consistent professional appearance
2. **Default Mode**: "Fill" (`object-cover`) - crops to fill frame, clean and consistent, matches how media appears in feed
3. **Alternative Mode**: "Fit" (`object-contain`) - shows full media with blur letterboxing via `BlurredMediaBackground`
4. **Toggle Button**: Top-right pill button with Maximize2/Minimize2 icons, styled with Apple-quality glass effect (`bg-black/60 backdrop-blur-xl`)
5. **Persistence**: User preference stored via `useLocalStorage('mediaDisplayMode', 'fill')` and persists across sessions

**Key Components**:
- `MediaCarousel.tsx`: Accepts `displayMode` and `onDisplayModeChange` props
- `CreateMomentMediaStage.tsx`: Manages display mode state with localStorage persistence
- `CarouselSlide.tsx`: Uses `objectFit` prop to switch between cover/contain

**Rationale**: Provides consistent preview dimensions while giving users control to see full media when needed. Fill mode shows exactly how media will appear in feed; Fit mode reveals full content for verification.
