// Example usage in edge functions for strict JSON prompts

// Per-Phase Analysis Example
export const examplePerPhaseRequest = {
  "phase": "impact",
  "context": { 
    "club": "Driver", 
    "cameraAngle": "face-on", 
    "miss": "slice" 
  },
  "frames": [
    { "index": 7, "url": "<SIGNED_URL>", "ts": 3.24 },
    { "index": 8, "url": "<SIGNED_URL>", "ts": 3.38 }
  ],
  "request": {
    "metrics": ["shaftLeanDeg","hipOpenDeg","headStabilityCm","clubFaceDeg","conf"],
    "tips": true,
    "visualPlan": true
  }
};

// Summarization Example  
export const exampleSummarizeRequest = {
  "club": "Driver",
  "cameraAngle": "face-on", 
  "miss": "slice",
  "phases": [
    { "phase":"setup", "metrics": {"spineAngleDeg": 36, "shoulderTiltDeg": 12}, "tips": ["Good posture at address"] },
    { "phase":"takeaway","metrics": {"handPathDepthCm": 15, "tempoRatio": 3.1}, "tips": ["Smooth one-piece movement"] },
    { "phase":"top","metrics": {"handPathDepthCm": 19, "tempoRatio": 3.0}, "tips": ["Excellent position at top"] },
    { "phase":"impact","metrics": {"shaftLeanDeg": 9, "hipOpenDeg": 26, "clubFaceDeg": -1}, "tips": ["Good shaft lean", "Square clubface"] }
  ]
};

// Edge Function Integration Helper
export const validateStrictJSON = (response: string): boolean => {
  try {
    const parsed = JSON.parse(response);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
};

// Schema validation for per-phase response
export const validatePerPhaseResponse = (data: any): boolean => {
  return (
    typeof data === 'object' &&
    typeof data.phase === 'string' &&
    typeof data.usedFrameIndex === 'number' &&
    typeof data.metrics === 'object' &&
    Array.isArray(data.tips) &&
    typeof data.visualPlan === 'object' &&
    typeof data.visualPlan.caption === 'string' &&
    typeof data.visualPlan.frameHint === 'string' &&
    typeof data.visualPlan.overlays === 'object'
  );
};

// Schema validation for summarize response
export const validateSummarizeResponse = (data: any): boolean => {
  return (
    typeof data === 'object' &&
    typeof data.summary === 'string' &&
    Array.isArray(data.keyFindings) &&
    typeof data.byPhase === 'object' &&
    Array.isArray(data.drills) &&
    typeof data.confidence === 'number'
  );
};