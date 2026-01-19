# Clbhouz Media System

> **The unified media system for video playback, image display, thumbnails, uploads, and galleries.**

## Quick Start

```typescript
import {
  // Core components
  UnifiedVideoPlayer,
  UnifiedImage,
  MediaThumbnail,
  MediaGrid,
  MediaGallery,
  
  // Upload hook
  useMediaUpload,
  
  // Fullscreen viewer
  FullscreenMediaViewer,
  
  // Runtime
  MediaRuntime,
  useMediaRuntime,
  
  // Utilities
  getThumbnailUrl,
} from '@/media';
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     @/media (entry point)                    │
├─────────────────────────────────────────────────────────────┤
│  Components        │  Hooks              │  Runtime          │
│  ─────────────     │  ─────             │  ─────────        │
│  UnifiedVideoPlayer│  useMediaUpload     │  MediaRuntime     │
│  UnifiedImage      │  useFullscreenViewer│  useMediaRuntime  │
│  MediaThumbnail    │  useMediaAutoplay   │  runtimeUserTap() │
│  MediaGrid         │  useSwipeNavigation │  runtimeUserMute()│
│  MediaGallery      │                     │                   │
│  Lightbox          │                     │                   │
│  FullscreenMedia   │                     │                   │
│  Viewer            │                     │                   │
├─────────────────────────────────────────────────────────────┤
│  Utils                       │  Types & Constants            │
│  ─────                       │  ─────────────────            │
│  getThumbnailUrl()           │  types.ts                     │
│  thumbnail presets           │  constants.ts                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### UnifiedVideoPlayer

The **single video player** for all video playback in the app. Features HLS.js integration with native fallback and MediaRuntime singleton playback.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Video source URL (MP4 or HLS) |
| `streamId` | `string` | - | Cloudflare Stream UID (preferred) |
| `posterUrl` | `string` | - | Poster image URL |
| `aspectRatio` | `AspectRatio` | `'16:9'` | Video aspect ratio |
| `autoplay` | `boolean` | `false` | Auto-start playback |
| `muted` | `boolean` | `true` | Start muted |
| `loop` | `boolean` | `false` | Loop video |
| `controls` | `boolean` | `true` | Show native controls |
| `surface` | `string` | `'default'` | MediaRuntime surface ID |
| `onPlay` | `() => void` | - | Called when video starts |
| `onPause` | `() => void` | - | Called when video pauses |
| `onEnded` | `() => void` | - | Called when video ends |
| `onError` | `(error) => void` | - | Called on playback error |

#### Ref Methods

| Method | Description |
|--------|-------------|
| `play()` | Start playback |
| `pause()` | Pause playback |
| `toggle()` | Toggle play/pause |
| `seek(time)` | Seek to time in seconds |
| `mute()` | Mute audio |
| `unmute()` | Unmute audio |

#### Example

```tsx
<UnifiedVideoPlayer
  streamId="abc123def456"
  aspectRatio="3:4"
  autoplay
  muted
  surface="discover-feed"
  onPlay={() => analytics.track('video_play')}
/>
```

---

### UnifiedImage

The **single image component** for all image display. Features lazy loading, CLS prevention, and automatic Cloudflare Image optimization.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | required | Image source URL |
| `alt` | `string` | `''` | Alt text for accessibility |
| `width` | `number` | - | Image width |
| `height` | `number` | - | Image height |
| `aspectRatio` | `AspectRatio` | - | Aspect ratio (alternative to width/height) |
| `lazy` | `boolean` | `true` | Enable lazy loading |
| `placeholder` | `'blur' \| 'skeleton' \| 'none'` | `'skeleton'` | Loading placeholder type |
| `className` | `string` | - | Additional CSS classes |

#### Example

```tsx
<UnifiedImage
  src="https://example.com/photo.jpg"
  alt="Golf course sunset"
  aspectRatio="16:9"
  placeholder="blur"
  className="rounded-lg"
/>
```

---

### MediaThumbnail

Video/image thumbnails with duration badges, view counts, and custom overlays.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `streamId` | `string` | - | Cloudflare Stream UID |
| `imageUrl` | `string` | - | Direct image URL |
| `duration` | `number` | - | Video duration in seconds |
| `viewCount` | `number` | - | View count to display |
| `aspectRatio` | `AspectRatio` | `'3:4'` | Thumbnail aspect ratio |
| `showDuration` | `boolean` | `true` | Show duration badge |
| `showViewCount` | `boolean` | `false` | Show view count badge |
| `overlay` | `ReactNode` | - | Custom overlay content |
| `onClick` | `() => void` | - | Click handler |

#### Example

```tsx
<MediaThumbnail
  streamId="abc123"
  duration={125}
  viewCount={1234}
  aspectRatio="3:4"
  showDuration
  showViewCount
  onClick={() => openFullscreen(index)}
/>
```

---

### MediaGrid

Responsive grid for video collections with infinite scroll support.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `MediaGridItem[]` | required | Array of media items |
| `columns` | `ResponsiveColumns` | `{ default: 3, sm: 2, lg: 4 }` | Responsive column counts |
| `gap` | `number` | `4` | Gap between items (Tailwind spacing) |
| `aspectRatio` | `AspectRatio` | `'3:4'` | Thumbnail aspect ratio |
| `onItemClick` | `(item, index) => void` | - | Item click handler |
| `hasMore` | `boolean` | `false` | Enable infinite scroll |
| `onLoadMore` | `() => void` | - | Load more callback |
| `loading` | `boolean` | `false` | Show loading skeletons |
| `skeletonCount` | `number` | `6` | Number of skeletons when loading |

#### Example

```tsx
<MediaGrid
  items={videos}
  columns={{ default: 2, sm: 3, lg: 4 }}
  aspectRatio="3:4"
  onItemClick={(item, index) => openFullscreen(index)}
  hasMore={hasNextPage}
  onLoadMore={fetchNextPage}
/>
```

---

### MediaGallery

Image gallery with lightbox integration.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `GalleryImage[]` | required | Array of images |
| `columns` | `ResponsiveColumns` | `{ default: 2, sm: 3, lg: 4 }` | Responsive column counts |
| `layout` | `'grid' \| 'masonry'` | `'grid'` | Layout style |
| `gap` | `number` | `4` | Gap between items |
| `enableLightbox` | `boolean` | `true` | Enable lightbox on click |

#### Example

```tsx
<MediaGallery
  images={coursePhotos}
  columns={{ default: 2, md: 3, lg: 4 }}
  layout="masonry"
  enableLightbox
/>
```

---

### FullscreenMediaViewer

Full-screen media viewer with vertical/horizontal swipe navigation.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `FullscreenMediaItemType[]` | required | Array of fullscreen items |
| `initialIndex` | `number` | `0` | Starting index |
| `isOpen` | `boolean` | required | Viewer open state |
| `onClose` | `() => void` | required | Close handler |
| `onIndexChange` | `(index) => void` | - | Index change handler |
| `onLike` | `(item) => void` | - | Like button handler |
| `onComment` | `(item) => void` | - | Comment button handler |
| `onShare` | `(item) => void` | - | Share button handler |
| `showCreatorInfo` | `boolean` | `true` | Show creator info overlay |
| `showActionRail` | `boolean` | `true` | Show action buttons |

---

## Hooks

### useMediaUpload

Unified upload hook that auto-routes video → Cloudflare Stream, images → R2.

```typescript
const {
  upload,
  cancel,
  reset,
  progress,
  status,
  result,
  error,
} = useMediaUpload({
  onProgress: (progress) => console.log(`${progress.percent}%`),
  onSuccess: (result) => console.log('Uploaded:', result),
  onError: (error) => console.error('Failed:', error),
});

// Upload a file
await upload(file, { bucket: 'post-media' });
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `bucket` | `R2BucketType` | R2 bucket for images: `'post-media' \| 'profile-images' \| 'course-media'` |
| `streamAsset` | `boolean` | Save Stream asset to database |
| `userId` | `string` | User ID for database records |

#### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `upload` | `(file, options) => Promise` | Start upload |
| `cancel` | `() => void` | Cancel current upload |
| `reset` | `() => void` | Reset state |
| `progress` | `MediaUploadProgress` | Upload progress (percent, loaded, total) |
| `status` | `UploadMediaStatus` | `'idle' \| 'uploading' \| 'processing' \| 'success' \| 'error'` |
| `result` | `MediaUploadResult \| null` | Final URL and metadata |
| `error` | `MediaUploadError \| null` | Error details |

---

### useFullscreenViewer

Hook to manage fullscreen viewer state.

```typescript
const {
  open,
  close,
  isOpen,
  items,
  currentIndex,
  setIndex,
} = useFullscreenViewer({
  items: mediaItems,
  onClose: () => console.log('Viewer closed'),
});

// Open at specific index
open(3);
```

---

## Utilities

### getThumbnailUrl

Generate optimized thumbnail URLs for Cloudflare Stream videos.

```typescript
import { getThumbnailUrl, thumbnailPresets } from '@/media';

// Basic usage
const url = getThumbnailUrl({ streamId: 'abc123' });

// With options
const largeUrl = getThumbnailUrl({
  streamId: 'abc123',
  size: 'large',
  time: 5,
  fit: 'cover',
});

// Using presets
const preset = thumbnailPresets.grid; // { width: 400, height: 533, fit: 'cover' }
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `streamId` | `string` | required | Cloudflare Stream UID |
| `size` | `ThumbnailSize` | `'medium'` | Preset size: `'small' \| 'medium' \| 'large' \| 'xl'` |
| `width` | `number` | - | Custom width (overrides size) |
| `height` | `number` | - | Custom height (overrides size) |
| `time` | `number` | - | Frame time in seconds |
| `fit` | `'contain' \| 'cover' \| 'crop' \| 'scale'` | `'cover'` | Resize fit mode |

---

## MediaRuntime

The global playback authority. Ensures only one video plays at a time.

```typescript
import { useMediaRuntime, runtimeUserTap } from '@/media';

// In components
const runtime = useMediaRuntime();

// Signal user interactions (never call play/pause directly)
runtimeUserTap(videoElement, 'discover-feed');
runtimeUserMute(true);
runtimeUserPause();
```

### Rules

1. **Never call `video.play()` or `video.pause()` directly**
2. Use `runtimeUserTap()` for user-initiated play/pause
3. Use `runtimeUserMute()` for mute state changes
4. Use `runtimeSetModalOpen()` when modals/sheets open

---

## Best Practices

### Loading Strategy

The system uses a **"poster-first"** loading strategy:

1. Display poster image immediately via `<img>` tag
2. Video element hidden with `opacity: 0` until first frame
3. Smooth crossfade (150ms) from poster to video
4. No gray boxes or dark flashes

### Performance

- Videos outside viewport are automatically detached (no buffering)
- HLS manifests prefetched for adjacent items in fullscreen
- Thumbnail URLs cached for 5 minutes
- Single video plays at a time (MediaRuntime enforced)

### Error Handling

All components include built-in error states. Override with custom UI:

```tsx
<UnifiedImage
  src={imageUrl}
  fallback={<CustomErrorPlaceholder />}
/>
```

---

## Migration Guide

See [MIGRATION.md](./MIGRATION.md) for upgrading from legacy components.

---

## Debug Mode

Enable debug logging (development only):

```typescript
// In browser console
localStorage.setItem('DEBUG_MEDIA', 'true');
location.reload();
```

Debug flags:
- `DEBUG_MEDIA` - General media system logs
- `DEBUG_HLS_PLAYER` - HLS.js playback logs
- `DEBUG_MEDIA_RUNTIME` - Runtime state changes
- `DEBUG_SAFE_PLAY` - Play/pause call tracking
