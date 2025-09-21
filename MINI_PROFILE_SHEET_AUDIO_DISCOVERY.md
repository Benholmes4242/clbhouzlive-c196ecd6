# Mini Profile Sheet Video/Audio + Mute Icon Discovery Report

## 1) File & Component Map

### Core Components:

**`src/components/clubhouse/MiniProfileSheet.tsx`**
- **Exports**: `MiniProfileSheet` (default)
- **Responsibility**: Main sheet container, wraps content with `SheetPlaybackProvider`, handles sheet lifecycle
- **Rendering**: Contains `RecentPostTile` components for each video/image post

**`src/components/clubhouse/VideoThumbPlayer.tsx`**  
- **Exports**: `VideoThumbPlayer`
- **Responsibility**: Individual video tile player with controls (play/pause, mute/unmute, progress)
- **Key Features**: HLS support, exclusive playback via context, intersection observer auto-pause

**`src/components/clubhouse/SheetPlaybackContext.tsx`**
- **Exports**: `SheetPlaybackProvider`, `useSheetPlayback`
- **Responsibility**: Manages exclusive playback control (only one video plays/unmuted at a time)
- **Functions**: `register()`, `requestPlay()`, `requestUnmute()`, `pauseAll()`, `muteAll()`

### Data Flow Components:

**`src/hooks/useUserProfilePosts.ts`** (referenced)
- **Responsibility**: Fetches user's recent posts data including media URLs and poster URLs

**HLS Utilities**: 
- Uses dynamic `import('hls.js/dist/hls.light.min.js')` for .m3u8 streams
- Fallback to native `<video>` for non-HLS sources

## 2) Data Flow (Props/State)

### RecentPostTile Props:
```typescript
{
  media: { 
    type: 'image' | 'video'; 
    url: string; 
    posterUrl?: string 
  };
  onTileClick: () => void;
  ioRoot?: Element | null;
}
```

### VideoThumbPlayer Props:
```typescript
{
  url: string;           // HLS (.m3u8) or direct video URL
  poster: string;        // Thumbnail image URL  
  ioRoot?: Element;      // Scroll container for intersection observer
  className?: string;
}
```

### Mute State Storage:
- **Local React State**: `const [muted, setMuted] = useState(true);` in VideoThumbPlayer
- **Video Element**: `<video muted={muted} />` - synced with state
- **Context Control**: `SheetPlaybackContext` manages exclusive unmute via `requestUnmute()`

### Mute Icon Wiring:
```typescript
const toggleMute = useCallback((e: React.MouseEvent) => {
  e.stopPropagation();  // Prevent tile click
  const video = videoRef.current;
  if (!video) return;

  if (video.muted) {
    requestUnmute(id);    // Mutes all other videos
    video.muted = false;
    setMuted(false);
  } else {
    video.muted = true;
    setMuted(true);
  }
}, [id, requestUnmute]);
```

## 3) Player Implementation Details

### Video Element:
- **Raw `<video>` tag** with custom controls overlay
- **HLS Handling**: Lazy-loaded `hls.js` for .m3u8, native support on Safari
- **Attributes**: `muted={muted}`, `playsInline`, `preload="metadata"`

### HLS Setup Flow:
```typescript
// Check if HLS is needed
const needsHls = url.endsWith('.m3u8') && !video.canPlayType('application/vnd.apple.mpegurl');

if (needsHls) {
  const { default: Hls } = await import('hls.js/dist/hls.light.min.js');
  const hls = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 20 });
  hlsRef.current = hls;
  hls.loadSource(url);
  hls.attachMedia(video);
}
```

### Autoplay Policy:
- Videos start **paused** and **muted** by default
- User must explicitly tap play button
- iOS `playsInline` attribute prevents fullscreen takeover

### Exclusive Playback:
- **Yes** - `SheetPlaybackContext` ensures only one video plays at a time
- **Yes** - Only one video can be unmuted at a time
- When requesting play/unmute, context pauses/mutes all other registered players

## 4) Current Event Wiring

### Mute Icon Click Handler:
```typescript
<button onClick={toggleMute} className="absolute bottom-2 right-2 ...">
  {muted ? <VolumeX /> : <Volume2 />}
</button>
```

### Video Event Listeners:
```typescript
video.addEventListener('play', handlePlay);
video.addEventListener('pause', handlePause); 
video.addEventListener('volumechange', handleVolumeChange);
video.addEventListener('error', handleError);

const handleVolumeChange = () => {
  setMuted(video.muted);  // Sync state with video element
};
```

### Play/Pause Handler:
```typescript
const togglePlayPause = useCallback(async () => {
  if (video.paused) {
    requestPlay(id);  // Pause other videos first
    await video.play();
  } else {
    video.pause();
  }
}, [id, requestPlay]);
```

### Video Element Muted Property:
- Set via `video.muted = true/false` directly
- Synced to React state via `volumechange` event listener
- **No `.volume` property manipulation** - only binary muted state

## 5) Root Cause Assessment

Based on the code analysis, the mute functionality **should be working correctly**. Here's why:

### ✅ **Likely Working As Intended:**
1. **Correct Video Ref**: `toggleMute` directly accesses `videoRef.current.muted`
2. **Event Propagation**: `e.stopPropagation()` prevents tile click interference  
3. **State Sync**: `volumechange` listener keeps React state in sync
4. **Context Integration**: `requestUnmute()` properly mutes other videos
5. **Button Accessibility**: Proper `pointer-events` and click handling

### 🤔 **Potential Issues to Investigate:**

1. **Browser Autoplay Policy**: Some browsers block audio until user gesture on page
2. **HLS Timing**: Race condition where mute toggle happens before HLS attachment
3. **Context State Desync**: React state vs video element state mismatch
4. **Mobile Touch Events**: iOS might require different event handling
5. **Volume vs Muted**: Browsers might have different behavior for `.muted` vs `.volume = 0`

### 🔍 **Most Likely Issue:**
**Browser audio policy** - videos might be technically "unmuted" but browser blocks audio until user interacts with the page directly.

## 6) Diagnostics Added (Debugging Logs)

Added comprehensive logging behind `window.__DEBUG_SHEET__` flag:

### Tile Mount Logging:
```typescript
console.log(`[VideoThumbPlayer] Registering tile:`, {
  id, url, type: 'video', initialMuted: muted, 
  hlsAttached: !!hlsRef.current, videoElement: !!videoRef.current
});
```

### Mute Click Logging:
```typescript
console.log(`[VideoThumbPlayer] Mute button clicked:`, {
  id, previousMuted, newMuted: video.muted,
  videoRefMuted: videoRef.current?.muted, stateAfterToggle: muted
});
```

### Video Event Logging:
- Play/pause events with muted state
- Volume change events with before/after state
- Error events with muted state

### Context Logging:
- Player registration/unregistration
- Exclusive play requests
- Exclusive unmute requests with affected players

## 7) Interaction Boundaries

### ✅ **Verified Button Accessibility:**
- Mute button has `position: absolute` with high z-index
- No parent `pointer-events: none` blocking clicks
- `e.stopPropagation()` prevents tile click bubbling
- Proper ARIA labels for screen readers

### ✅ **Event Flow:**
1. User taps mute button
2. `toggleMute` handler fires
3. Context `requestUnmute()` mutes other videos  
4. Direct `video.muted = false` on target video
5. `volumechange` event syncs React state

### ⚠️ **Potential Conflicts:**
- Tile's `onClick={togglePlayPause}` could interfere if event bubbles
- Multiple rapid clicks could cause state desync
- Intersection observer auto-pause might conflict with manual controls

## 8) Reproduction Checklist

### Test Steps:
1. **Open Mini Profile Sheet** with 2+ video tiles
2. **Enable Debug Logs**: `window.__DEBUG_SHEET__ = true` in console
3. **Tap Mute on Tile A**: 
   - ✅ Expect console logs showing mute state change
   - ✅ Icon should change from VolumeX to Volume2
   - ✅ Other tiles should show muted via context
4. **Start Playing Tile A**: 
   - ✅ Audio should be audible (if browser allows)
   - ✅ Console should show play event with muted=false
5. **Tap Mute on Tile B**:
   - ✅ Tile A should become muted via context
   - ✅ Tile B should become unmuted
6. **Close Sheet**:
   - ✅ All videos pause and mute
   - ✅ No audio leaks continue

### Browser-Specific Tests:
- **Safari iOS**: Test native HLS vs hls.js behavior
- **Chrome Mobile**: Verify autoplay policy compliance
- **Firefox**: Check volume change event firing

## 9) Deliverables

### ✅ **Completed:**
- **File mapping** with component responsibilities
- **Data flow documentation** with props and state management  
- **Code analysis** of event handlers and HLS setup
- **Root cause assessment** - likely browser audio policy
- **Debug logging** behind `window.__DEBUG_SHEET__` flag
- **Interaction boundary verification**
- **Reproduction checklist** for QA testing

### 📋 **Next Steps:**
1. **Run reproduction test** with debug logs enabled
2. **Verify browser audio policy** compliance
3. **Test HLS attachment timing** vs mute toggle
4. **Implement minimal fix** based on discovered root cause

### 🎯 **Expected Fix:**
Most likely fix will be ensuring proper user gesture requirement compliance or adding explicit audio context initialization after first user interaction.

---

**Debug Flag Usage**: Set `window.__DEBUG_SHEET__ = true` in browser console to enable detailed logging of all mute/unmute operations.