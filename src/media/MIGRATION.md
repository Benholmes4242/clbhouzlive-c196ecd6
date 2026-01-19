# Media System Migration Guide

> **Migrating from legacy components to the unified @/media system**

## Quick Reference

| Old (Deprecated) | New (Use Instead) |
|------------------|-------------------|
| `HLSPlayer` | `UnifiedVideoPlayer` |
| `EnhancedVideoPlayer` | `UnifiedVideoPlayer` |
| `HLSVideoCard` | `UnifiedVideoPlayer` |
| `OptimizedImage` | `UnifiedImage` |
| `getStreamPoster()` | `getThumbnailUrl()` |
| `generateStreamThumbnailUrl()` | `getThumbnailUrl()` |
| `useCloudflareStream` | `useMediaUpload` |
| `useChunkedUpload` | `useMediaUpload` |
| `UnifiedFullscreenViewer` | `FullscreenMediaViewer` |
| Various VideoGrid components | `MediaGrid` |
| Various Gallery components | `MediaGallery` |

---

## Video Player Migration

### Before: HLSPlayer

```tsx
import HLSPlayer from '@/components/ui/HLSPlayer';

<HLSPlayer
  src={videoUrl}
  poster={posterUrl}
  autoPlay
  muted
  onPlayStateChange={(playing) => setIsPlaying(playing)}
/>
```

### After: UnifiedVideoPlayer

```tsx
import { UnifiedVideoPlayer } from '@/media';

<UnifiedVideoPlayer
  src={videoUrl}
  posterUrl={posterUrl}
  autoplay
  muted
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
/>
```

### Key Differences

| HLSPlayer | UnifiedVideoPlayer |
|-----------|-------------------|
| `poster` | `posterUrl` |
| `autoPlay` | `autoplay` |
| `onPlayStateChange(bool)` | `onPlay()` + `onPause()` |
| Manual HLS setup | Automatic HLS detection |
| No MediaRuntime | Integrated MediaRuntime |

---

## Image Component Migration

### Before: OptimizedImage

```tsx
import { OptimizedImage } from '@/components/ui/OptimizedImage';

<OptimizedImage
  src={imageUrl}
  alt="Photo"
  width={300}
  height={200}
  loading="lazy"
/>
```

### After: UnifiedImage

```tsx
import { UnifiedImage } from '@/media';

<UnifiedImage
  src={imageUrl}
  alt="Photo"
  width={300}
  height={200}
  lazy // or lazy={true}
  placeholder="skeleton"
/>
```

### Key Differences

| OptimizedImage | UnifiedImage |
|----------------|--------------|
| `loading="lazy"` | `lazy={true}` (default) |
| No placeholder | `placeholder="skeleton"` or `"blur"` |
| No aspect ratio | `aspectRatio="16:9"` supported |
| Basic error state | Customizable `fallback` |

---

## Thumbnail URL Migration

### Before: Multiple functions

```tsx
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

const url = generateStreamThumbnailUrl(streamId);
```

Or:

```tsx
import { getStreamPoster } from '@/config/cloudflare';

const url = getStreamPoster(streamId);
```

### After: Single function

```tsx
import { getThumbnailUrl } from '@/media';

// Basic
const url = getThumbnailUrl({ streamId });

// With options
const url = getThumbnailUrl({
  streamId,
  size: 'large',
  time: 5,
});

// Using presets
import { thumbnailPresets } from '@/media';
const preset = thumbnailPresets.grid;
```

### Key Differences

| Old Functions | getThumbnailUrl |
|---------------|-----------------|
| Multiple functions | Single unified function |
| String concatenation | Object options |
| No caching | Built-in URL caching |
| Fixed sizes | Preset sizes + custom |

---

## Upload Hook Migration

### Before: useCloudflareStream

```tsx
import { useCloudflareStream } from '@/hooks/useCloudflareStream';

const {
  uploadVideo,
  uploadProgress,
  isUploading,
  videoUrl,
} = useCloudflareStream();

await uploadVideo(file);
```

### After: useMediaUpload

```tsx
import { useMediaUpload } from '@/media';

const {
  upload,
  progress,
  status,
  result,
} = useMediaUpload({
  onProgress: (p) => console.log(p.percent),
  onSuccess: (r) => console.log(r.url),
});

await upload(file, { bucket: 'post-media' });
```

### Key Differences

| useCloudflareStream | useMediaUpload |
|---------------------|----------------|
| Video only | Video + Images |
| `uploadProgress` (number) | `progress.percent` |
| `isUploading` | `status === 'uploading'` |
| `videoUrl` | `result.url` |
| No cancellation | `cancel()` method |
| No retry | Built-in retry with backoff |

---

## Fullscreen Viewer Migration

### Before: UnifiedFullscreenViewer

```tsx
import { UnifiedFullscreenViewer } from '@/components/fullscreen';

<UnifiedFullscreenViewer
  items={items}
  startIndex={index}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### After: FullscreenMediaViewer

```tsx
import { FullscreenMediaViewer, adaptItemsToFullscreen } from '@/media';

const fullscreenItems = adaptItemsToFullscreen(posts);

<FullscreenMediaViewer
  items={fullscreenItems}
  initialIndex={index}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onLike={handleLike}
  onComment={handleComment}
/>
```

### Key Differences

| UnifiedFullscreenViewer | FullscreenMediaViewer |
|-------------------------|----------------------|
| `open` + `onOpenChange` | `isOpen` + `onClose` |
| `startIndex` | `initialIndex` |
| Mixed item format | Typed `FullscreenMediaItemType` |
| Monolithic component | Modular sub-components |

---

## Grid Component Migration

### Before: Various custom grids

```tsx
// Different implementations across surfaces
<div className="grid grid-cols-3 gap-2">
  {videos.map((video) => (
    <VideoThumbnail key={video.id} video={video} />
  ))}
</div>
```

### After: MediaGrid

```tsx
import { MediaGrid } from '@/media';

<MediaGrid
  items={videos.map(v => ({
    id: v.id,
    streamId: v.stream_id,
    duration: v.duration,
    aspectRatio: '3:4',
  }))}
  columns={{ default: 3, lg: 4 }}
  onItemClick={(item, index) => openFullscreen(index)}
  hasMore={hasNextPage}
  onLoadMore={fetchNextPage}
/>
```

---

## Gallery Migration

### Before: Custom gallery implementations

```tsx
<div className="grid grid-cols-2 gap-2">
  {images.map((img) => (
    <img
      key={img.id}
      src={img.url}
      onClick={() => openLightbox(img)}
    />
  ))}
</div>
```

### After: MediaGallery

```tsx
import { MediaGallery } from '@/media';

<MediaGallery
  images={images.map(img => ({
    id: img.id,
    src: img.url,
    alt: img.caption,
    width: img.width,
    height: img.height,
  }))}
  columns={{ default: 2, md: 3 }}
  enableLightbox
/>
```

---

## Deprecation Timeline

All deprecated components/hooks are functional wrappers around the new system. They will be removed in a future release.

| Phase | Status | Date |
|-------|--------|------|
| Wrappers created | ✅ Complete | Phase 6-7 |
| Migration guide published | ✅ Complete | Phase 8 |
| Deprecation warnings added | ✅ Complete | Phase 8 |
| Legacy code removal | 🔜 Planned | Future |

---

## Need Help?

If you encounter issues during migration:

1. Check this guide for the correct new API
2. Search for `@deprecated` in the codebase for inline guidance
3. All deprecated components log console warnings in development
