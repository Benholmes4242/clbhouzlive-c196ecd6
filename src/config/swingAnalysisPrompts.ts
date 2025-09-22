// Golf Swing Analysis Prompts for OpenAI API
// Ready to use in Supabase Edge Functions

export const SWING_ANALYSIS_PROMPTS = {
  
  // Per-Phase Analysis System Prompt (Strict JSON)
  perPhaseSystem: `You are Echo, a professional golf instructor. Return STRICT JSON only.
Include: phase, usedFrameIndex, metrics (numeric where possible, include 'conf' 0..1),
tips (string[]), and visualPlan { caption, frameHint, overlays {lines[], angles[], keypoints[]} }.
No prose outside JSON.`,

  // Per-Phase User Prompt Template
  perPhaseUser: (data: {
    phase: string;
    context: {
      club: string;
      cameraAngle: string;
      miss?: string;
    };
    frames: Array<{
      index: number;
      url: string;
      ts: number;
    }>;
    request: {
      metrics: string[];
      tips: boolean;
      visualPlan: boolean;
    };
  }) => JSON.stringify(data),

  // Expected Per-Phase Response Format
  perPhaseResponse: `{
  "phase": "impact",
  "usedFrameIndex": 7,
  "metrics": { 
    "shaftLeanDeg": 9, 
    "hipOpenDeg": 26, 
    "headStabilityCm": 1.8, 
    "clubFaceDeg": -1, 
    "conf": 0.82 
  },
  "tips": [
    "Feel lead wrist flatter approaching impact",
    "Keep head steady through strike"
  ],
  "visualPlan": {
    "caption": "Good shaft lean; clubface near square.",
    "frameHint": "P7",
    "overlays": {
      "lines": [{"x1":100,"y1":220,"x2":240,"y2":120,"label":"shaft"}],
      "angles": [{"cx":180,"cy":220,"a":28,"b":0,"label":"hip open"}],
      "keypoints": [{"x":150,"y":180,"label":"lead_wrist","conf":0.8}]
    }
  }
}`,

  // Summarization System Prompt (Strict JSON)
  summarizeSystem: `Compose a concise golf swing review. Return STRICT JSON: 
{
  "summary": string,
  "keyFindings": string[], 
  "byPhase": { "setup": string, "takeaway": string, "backswing": string, "top": string, "downswing": string, "impact": string, "followThrough": string },
  "drills": string[],
  "confidence": number
}
No extra text.`,

  // Summarization User Prompt Template
  summarizeUser: (data: {
    club: string;
    cameraAngle: string;
    miss?: string;
    phases: Array<{
      phase: string;
      metrics: Record<string, number>;
      tips: string[];
      confidence?: number;
    }>;
  }) => JSON.stringify(data),

  // Expected Summarization Response Format
  summarizeResponse: `{
  "summary": "Your swing shows strong fundamentals with excellent shoulder turn and good impact position. The primary focus should be improving weight transfer through impact to reduce the slice tendency.",
  "keyFindings": [
    "Excellent shoulder turn creating good width and power",
    "Impact position shows forward shaft lean and square clubface",
    "Weight transfer could be more aggressive into the front side",
    "Setup position provides solid foundation for consistency"
  ],
  "byPhase": {
    "setup": "Strong foundation with good posture and alignment to target.",
    "takeaway": "Smooth one-piece movement maintaining connection through the triangle.",
    "backswing": "Excellent shoulder turn creating width and power potential.",
    "top": "Good position at the top with proper lag angle maintained.",
    "downswing": "Good sequencing with room for more aggressive weight shift.",
    "impact": "Solid contact position with forward shaft lean and square clubface.",
    "followThrough": "Complete rotation showing good extension through the ball."
  },
  "drills": [
    "Step-through drill: Practice transferring weight by stepping through impact with trail foot",
    "Impact bag work: Focus on forward shaft lean and square clubface at contact",
    "Hip rotation drill: Practice aggressive hip clearing through impact position",
    "Balance finish: Hold follow-through for 3 seconds to improve weight transfer"
  ],
  "confidence": 0.85
}`,

  // Model Configuration for Different Analysis Types
  modelConfig: {
    perPhase: {
      model: "gpt-4.1-2025-04-14", // Good for structured analysis
      max_completion_tokens: 600,   // Reduced for strict JSON
      // Note: temperature not supported for GPT-4.1+
    },
    summarize: {
      model: "gpt-5-2025-08-07", // Best for comprehensive analysis
      max_completion_tokens: 800,  // Reduced for strict JSON
      // Note: temperature not supported for GPT-5
    }
  }
};

// Example usage in edge function:
export const callPerPhaseAnalysis = async (
  openAIApiKey: string, 
  phaseData: any
) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SWING_ANALYSIS_PROMPTS.modelConfig.perPhase.model,
      max_completion_tokens: SWING_ANALYSIS_PROMPTS.modelConfig.perPhase.max_completion_tokens,
      messages: [
        { 
          role: 'system', 
          content: SWING_ANALYSIS_PROMPTS.perPhaseSystem 
        },
        { 
          role: 'user', 
          content: SWING_ANALYSIS_PROMPTS.perPhaseUser(phaseData)
        }
      ],
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message}`);
  }
  
  return JSON.parse(data.choices[0].message.content);
};

export const callSummarizeAnalysis = async (
  openAIApiKey: string, 
  summaryData: any
) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SWING_ANALYSIS_PROMPTS.modelConfig.summarize.model,
      max_completion_tokens: SWING_ANALYSIS_PROMPTS.modelConfig.summarize.max_completion_tokens,
      messages: [
        { 
          role: 'system', 
          content: SWING_ANALYSIS_PROMPTS.summarizeSystem 
        },
        { 
          role: 'user', 
          content: SWING_ANALYSIS_PROMPTS.summarizeUser(summaryData)
        }
      ],
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message}`);
  }
  
  return JSON.parse(data.choices[0].message.content);
};