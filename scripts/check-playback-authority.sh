#!/bin/bash
# ============================================================================
# PLAYBACK AUTHORITY GUARD
# ============================================================================
# This script enforces the single-authority rule: ONLY MediaRuntime may 
# control video playback. Any .play(), .pause(), or safePlay() calls outside
# the strict allowlist will fail the build.
#
# IMPORTANT: No comment-based exceptions. Only files in ALLOWLIST may call
# .play()/.pause() directly. Everything else MUST use MediaRuntime.
#
# Run: ./scripts/check-playback-authority.sh
# ============================================================================

set -e

# STRICT ALLOWLIST - Only these files may call .play()/.pause() directly
# Each entry must have a documented reason:
ALLOWLIST=(
  # Core runtime - the single authority for playback control
  "src/media/runtime/MediaRuntime.ts"
  "src/media/MediaSystemProvider.tsx"
  
  # Core HLS players - controlled components that respond to runtime
  "src/media/HLSPlayer.tsx"
  "src/components/ui/HLSPlayer.tsx"
  "src/components/ui/HLSVideoCard.tsx"
  
  # Feed video player - exposes imperative handle for runtime control
  "src/components/feed/FeedVideoPlayer.tsx"
  
  # Highlights video controller - manages highlights carousel playback
  "src/components/profile/HighlightsVideoController.tsx"
  
  # Vertical media feeds - fullscreen viewers with internal video management
  "src/components/explore/VerticalMediaFeed.tsx"
  "src/components/discover/DiscoverVerticalFeed.tsx"
  "src/components/clubhouse/ClubhouseVerticalFeed.tsx"
  
  # Carousel/carousel components - cleanup pauses for non-visible slides
  "src/components/posts/MediaCarousel.tsx"
  "src/components/clubhouse/VideoThumbPlayer.tsx"
  
  # Utility function used by runtime
  "src/utils/safePlay.ts"
  
  # Debug/development tools (not user-facing)
  "src/components/debug/VideoDebugger.tsx"
  
  # Audio-only (not video playback)
  "src/components/posts/BackgroundMusicSelector.tsx"
  
  # AI chat with internal video processing
  "src/components/ai-chat/SwingCoach.tsx"
  
  # Autoplay guard hook (uses safePlay internally)
  "src/hooks/useAutoplayGuard.ts"
  
  # This script itself
  "scripts/check-playback-authority.sh"
)

# Build grep exclusion pattern for file-based allowlist
EXCLUDE_ARGS=""
for file in "${ALLOWLIST[@]}"; do
  # Skip comments
  [[ "$file" =~ ^# ]] && continue
  # Skip empty lines
  [[ -z "$file" ]] && continue
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$file"
done

echo "🔍 Checking for unauthorized .play() calls..."
PLAY_VIOLATIONS=$(grep -rn "\.play(" src/ $EXCLUDE_ARGS 2>/dev/null | \
  grep -v "requestPlay" | \
  grep -v "autoplay" | \
  grep -v "canplaythrough" | \
  grep -v "oncanplay" || true)

echo "🔍 Checking for unauthorized .pause() calls..."
PAUSE_VIOLATIONS=$(grep -rn "\.pause(" src/ $EXCLUDE_ARGS 2>/dev/null | \
  grep -v "requestPause" | \
  grep -v "video.paused" | \
  grep -v "\.paused" || true)

echo "🔍 Checking for unauthorized safePlay() calls..."
SAFEPLAY_VIOLATIONS=$(grep -rn "safePlay(" src/ $EXCLUDE_ARGS 2>/dev/null | \
  grep -v "export.*safePlay" | \
  grep -v "function safePlay" | \
  grep -v "from.*safePlay" || true)

FOUND_VIOLATIONS=0

if [ -n "$PLAY_VIOLATIONS" ]; then
  echo ""
  echo "❌ UNAUTHORIZED .play() CALLS FOUND:"
  echo "$PLAY_VIOLATIONS"
  FOUND_VIOLATIONS=1
fi

if [ -n "$PAUSE_VIOLATIONS" ]; then
  echo ""
  echo "❌ UNAUTHORIZED .pause() CALLS FOUND:"
  echo "$PAUSE_VIOLATIONS"
  FOUND_VIOLATIONS=1
fi

if [ -n "$SAFEPLAY_VIOLATIONS" ]; then
  echo ""
  echo "❌ UNAUTHORIZED safePlay() CALLS FOUND:"
  echo "$SAFEPLAY_VIOLATIONS"
  FOUND_VIOLATIONS=1
fi

if [ $FOUND_VIOLATIONS -eq 1 ]; then
  echo ""
  echo "============================================================================"
  echo "⛔ PLAYBACK AUTHORITY VIOLATION"
  echo "============================================================================"
  echo "Only MediaRuntime may control video playback."
  echo ""
  echo "To fix:"
  echo "1. Use MediaRuntime.requestPlay() / MediaRuntime.requestPause() instead"
  echo "2. For visibility-based autoplay, use useMediaAutoplay hook"
  echo "3. ONLY if this is a core infrastructure file, add to ALLOWLIST with reason"
  echo ""
  echo "DO NOT use comment-based exceptions. All playback must route through runtime."
  echo "============================================================================"
  exit 1
fi

echo "✅ Playback authority check passed - no violations found"
echo ""
echo "Allowlisted files (${#ALLOWLIST[@]} total):"
for file in "${ALLOWLIST[@]}"; do
  [[ "$file" =~ ^# ]] && continue
  [[ -z "$file" ]] && continue
  echo "  - $file"
done
exit 0
