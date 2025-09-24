# SwingCoach Consolidation Summary

## Completed Actions

### ✅ Files Consolidated
1. **KEPT:** `src/components/ai-chat/SwingCoach.tsx` (REAL - 1359 lines)
   - Full implementation with API calls to `clbhouz-pro-ai`
   - Frame extraction + OpenAI Vision analysis
   - This is the LIVE implementation used by AIChatOverlay

2. **DELETED:** `src/components/ai-chat/SwingCoachNew.tsx` 
   - 10-line wrapper that imported the simulator
   - Was unused (AIChatOverlay imports SwingCoach directly)

3. **ARCHIVED:** `src/components/swing/ReliableSwingCoach.archived.tsx`
   - Simulator implementation with fake progress timers
   - Moved to .archived.tsx to prevent confusion

4. **ARCHIVED:** `src/components/swing/StreamingSwingAnalyzer.archived.tsx`
   - Frame visualization component used by simulator
   - Moved to .archived.tsx to prevent confusion

### ✅ Code Quality Improvements
1. **Feature Flag Added:**
   ```typescript
   export const SWINGCOACH_MODE: 'live' | 'sim' = 'live';
   ```

2. **Canonical Logging Added:**
   ```typescript
   console.info(`[SC] Analyze → frames:${extractedFrames.length}, model:gpt-4.1-2025-04-14, route:clbhouz-pro-ai, mode:${SWINGCOACH_MODE}`);
   ```

## Verification Checklist

### ✅ Console Output
When running analysis, you should see:
```
[SC] Analyze → frames:10, model:gpt-4.1-2025-04-14, route:clbhouz-pro-ai, mode:live
```

### ✅ Network Activity  
When analyzing a swing, you should see:
- `POST /functions/v1/clbhouz-pro-ai` with base64 image payload
- ~500KB request size (10 frames × ~50KB each)
- Response with OpenAI analysis

### ✅ No More Simulation
- No fake progress timers
- No hardcoded analysis text
- Real API consumption and costs

## Current Pipeline (Confirmed Real)
1. User uploads video → `handleFileUpload()`
2. User clicks "Analyze Swing" → `analyzeSwing()`
3. Extract 10 frames @ 640×480 JPEG → `extractFramesFromVideo()`
4. Call Edge Function → `supabase.functions.invoke('clbhouz-pro-ai')`
5. Edge Function calls OpenAI Vision → `gpt-4.1-2025-04-14`
6. Return analysis → UI updates with real results

## Performance Target: 15 Seconds
Current bottlenecks identified for optimization:
1. **Frame count:** 10 → 5-6 frames (-40% payload)
2. **Resolution:** 640×480 → 512×384 (-30% per frame)  
3. **Model:** `gpt-4.1-2025-04-14` → `gpt-4o-mini` (faster)
4. **Streaming:** Add real SSE instead of progress simulation

Estimated impact: 60s → 15s achievable with these changes.