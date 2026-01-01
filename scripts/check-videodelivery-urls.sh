#!/bin/bash
# CI guardrail: Fail if hardcoded videodelivery.net URLs are found in URL construction contexts
# Run this in CI to prevent regressions
#
# IMPORTANT: videodelivery.net is NOT valid for our Cloudflare Stream setup.
# All URL construction MUST use the customer subdomain via centralized helpers.

set -e

echo "Checking for hardcoded videodelivery.net URL construction..."

# Files explicitly allowed for detection/parsing purposes only
ALLOWED_FILES=(
  "src/config/cloudflareStream.ts"
  "src/utils/cloudflareStreamTransform.ts"
  "supabase/functions/backfill-video-dimensions/index.ts"
  "supabase/functions/backfill-poster-urls/index.ts"
  "supabase/functions/_shared/cloudflare-config.ts"
  "docs/"
  "*.md"
)

# Search for URL construction patterns (not just detection)
VIOLATIONS=""

# Pattern 1: Template literal URL construction with videodelivery.net
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

# Pattern 2: Direct hardcoded URLs (not in comments or detection patterns)
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
  # Skip if it's a comment line, detection pattern, or migration file
  if echo "$line" | grep -qE '^\s*//' || echo "$line" | grep -qE '\.match\(|\.includes\(|\.test\(' || echo "$line" | grep -qE 'migrations/'; then
    skip=true
  fi
  if [ "$skip" = false ]; then
    VIOLATIONS+="$line"$'\n'
  fi
done < <(grep -rn "https://videodelivery\.net/" src supabase/functions --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "VIDEODELIVERY_DOMAIN" | grep -v "Detection only" | grep -v "// Detection" || true)

# Pattern 3: Check for any `https://videodelivery.net` being used in backticks (URL construction)
while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  skip=false
  for allowed in "${ALLOWED_FILES[@]}"; do
    if [[ "$file" == *"$allowed"* ]]; then
      skip=true
      break
    fi
  done
  # Skip comments
  if echo "$line" | grep -qE '^\s*//|^\s*\*'; then
    skip=true
  fi
  if [ "$skip" = false ]; then
    VIOLATIONS+="$line"$'\n'
  fi
done < <(grep -rn '\`https://videodelivery\.net' src supabase/functions --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -n "$VIOLATIONS" ]; then
  echo ""
  echo "❌ FAILED: Found hardcoded videodelivery.net URL construction:"
  echo ""
  echo "$VIOLATIONS"
  echo ""
  echo "----------------------------------------------------------------------"
  echo "FIX: Use centralized helpers instead of hardcoding videodelivery.net:"
  echo ""
  echo "  Frontend:  import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';"
  echo "  Edge Fn:   import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '../_shared/cloudflare-config.ts';"
  echo ""
  echo "videodelivery.net causes 404 errors - only customer subdomain works for our setup."
  echo "----------------------------------------------------------------------"
  exit 1
else
  echo "✅ PASSED: No hardcoded videodelivery.net URL construction found."
  echo ""
  echo "All Cloudflare Stream URLs correctly use customer subdomain via centralized helpers."
  exit 0
fi
