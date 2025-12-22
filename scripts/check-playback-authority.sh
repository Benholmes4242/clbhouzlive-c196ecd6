#!/bin/bash
# ============================================================================
# PLAYBACK AUTHORITY GUARD
# ============================================================================
# This script enforces the single-authority rule: ONLY MediaRuntime may 
# control video playback. Any .play(), .pause(), or safePlay() calls outside
# the allowlist will fail the build.
#
# Run: ./scripts/check-playback-authority.sh
# ============================================================================

set -e

ALLOWLIST=(
  "src/media/runtime/MediaRuntime.ts"
  "src/media/HLSPlayer.tsx"
  "src/utils/safePlay.ts"
  "src/components/swing-review/KeyframePlayer.tsx"
  "src/components/ai-chat/SwingCoach.tsx"
  "scripts/check-playback-authority.sh"
)

# Build grep exclusion pattern
EXCLUDE_PATTERN=""
for file in "${ALLOWLIST[@]}"; do
  EXCLUDE_PATTERN="$EXCLUDE_PATTERN --exclude=$file"
done

echo "🔍 Checking for unauthorized .play() calls..."
PLAY_VIOLATIONS=$(grep -rn "\.play(" src/ $EXCLUDE_PATTERN 2>/dev/null | grep -v "// PLAYBACK_AUTHORITY_ALLOWED" | grep -v "requestPlay" | grep -v "autoplay" || true)

echo "🔍 Checking for unauthorized .pause() calls..."
PAUSE_VIOLATIONS=$(grep -rn "\.pause(" src/ $EXCLUDE_PATTERN 2>/dev/null | grep -v "// PLAYBACK_AUTHORITY_ALLOWED" | grep -v "requestPause" | grep -v "video.paused" || true)

echo "🔍 Checking for unauthorized safePlay() calls..."
SAFEPLAY_VIOLATIONS=$(grep -rn "safePlay(" src/ $EXCLUDE_PATTERN 2>/dev/null | grep -v "// PLAYBACK_AUTHORITY_ALLOWED" | grep -v "export.*safePlay" | grep -v "function safePlay" || true)

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
  echo "3. If this is a user-only tool (keyframe stepper, etc.), add file to ALLOWLIST"
  echo "============================================================================"
  exit 1
fi

echo "✅ Playback authority check passed - no violations found"
exit 0
