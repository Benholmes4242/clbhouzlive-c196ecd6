# Temporarily Disabled Components

These components are temporarily disabled due to type conflicts during the media system migration:

- ImmersiveProfileModal.tsx
- MediaManagerModal.tsx

## Issues
- LocalMediaItem vs standardized MediaItem type conflicts
- Complex state management mixing different MediaItem interfaces
- Needs refactoring to align with new unified MediaItem type from @/types/media

## TODO
- Refactor these components to use standardized MediaItem type
- Update state management to be consistent
- Re-enable in LazyProfileComponents.tsx once types are aligned

This does not affect the core media functionality (Activity, Media tabs, Reviews, Discover).