#!/bin/bash
# CI guardrail: Fail if hardcoded videodelivery.net URLs are found in URL construction contexts
# Run this in CI to prevent regressions

echo "Checking for hardcoded videodelivery.net URL construction..."

# Files explicitly allowed for detection/parsing purposes only
ALLOWED_FILES=(
  "src/config/cloudflareStream.ts"
  "src/utils/cloudflareStreamTransform.ts"
  "supabase/functions/backfill-video-dimensions/index.ts"
)

# Search for URL construction patterns (not just detection)
VIOLATIONS=""

# Pattern 1: Template literal URL construction
while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  skip=false
  for allowed in "${ALLOWED_FILES[@]}"; do
    if [[ "$file" == *"$allowed"* ]]; then
      skip=true
      break
    fi
  done
  if [ "$skip" = false ]; then
    VIOLATIONS+="$line"$'\n'
  fi
done < <(grep -rn 'https://videodelivery\.net/\${' src supabase/functions 2>/dev/null || true)

# Pattern 2: Direct hardcoded URLs (not in comments)
while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  # Skip allowed files
  skip=false
  for allowed in "${ALLOWED_FILES[@]}"; do
    if [[ "$file" == *"$allowed"* ]]; then
      skip=true
      break
    fi
  done
  # Skip if it's a comment line or detection pattern
  if echo "$line" | grep -qE '^\s*//' || echo "$line" | grep -qE '\.match\(|\.includes\(|\.test\('; then
    skip=true
  fi
  if [ "$skip" = false ]; then
    VIOLATIONS+="$line"$'\n'
  fi
done < <(grep -rn "https://videodelivery\.net/" src supabase/functions --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "VIDEODELIVERY_DOMAIN" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ FAILED: Found hardcoded videodelivery.net URL construction:"
  echo "$VIOLATIONS"
  echo ""
  echo "Use generateStreamHlsUrl() or generateStreamThumbnailUrl() from src/config/cloudflareStream.ts instead."
  exit 1
else
  echo "✅ PASSED: No hardcoded videodelivery.net URL construction found."
  exit 0
fi
