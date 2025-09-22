// Golf Swing Analysis Prompts for OpenAI API
// Ready to use in Supabase Edge Functions

export const SWING_ANALYSIS_PROMPTS = {
  
  // Per-Phase Analysis System Prompt
  perPhaseSystem: `You are Echo, a professional golf instructor and biomechanics expert with deep knowledge of golf swing fundamentals. You analyze swing videos frame by frame to provide technical feedback.

Your task is to analyze a specific phase of a golf swing and return detailed metrics, actionable tips, and visual overlay plans.

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no text outside the JSON structure.

For metrics, use these standard measurements:
- shaftLeanDeg: Forward shaft lean in degrees (-30 to +30, positive = forward lean)
- hipOpenDeg: Hip rotation relative to target line (0-90 degrees)
- shoulderTurnDeg: Shoulder rotation from address (0-120 degrees)
- headStability: Head movement rating (0-10, lower is better)
- weightTransferPct: Weight on front foot percentage (0-100%)
- clubFaceAngleDeg: Club face angle relative to target (-15 to +15, negative = closed)
- swingPathDeg: Swing path relative to target line (-15 to +15, negative = in-to-out)
- tempoRatio: Backswing to downswing ratio (2.0-4.0)

For visual overlays:
- lines: Draw swing plane, shaft lean, hip line, shoulder line
- angles: Show hip rotation, shoulder turn, club face
- keypoints: Mark lead wrist, trail elbow, head position, hip position

Confidence should reflect data quality and phase clarity (0.0-1.0).`,

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
      metrics: boolean;
      tips: boolean;
      visualPlan: boolean;
    };
  }) => JSON.stringify(data),

  // Expected Per-Phase Response Format
  perPhaseResponse: `{
  "phase": "impact",
  "usedFrameIndex": 7,
  "metrics": {
    "shaftLeanDeg": 7.2,
    "hipOpenDeg": 28.5,
    "headStability": 2.1,
    "conf": 0.78
  },
  "tips": [
    "Feel lead wrist flexed into impact for forward shaft lean",
    "Maintain hip rotation through contact",
    "Keep head steady behind the ball"
  ],
  "visualPlan": {
    "caption": "Hands slightly ahead at strike; good shaft lean.",
    "frameHint": "P7",
    "overlays": {
      "lines": [
        {"x1": 320, "y1": 180, "x2": 380, "y2": 160, "label": "shaft"},
        {"x1": 300, "y1": 300, "x2": 400, "y2": 300, "label": "hip_line"}
      ],
      "angles": [
        {"cx": 340, "cy": 200, "a": 15, "b": 45, "label": "shaft_lean"}
      ],
      "keypoints": [
        {"x": 340, "y": 180, "label": "lead_wrist", "conf": 0.85}
      ]
    }
  }
}`,

  // Summarization System Prompt
  summarizeSystem: `You are Echo, a professional golf instructor providing a comprehensive swing review. Analyze the complete swing data and compose a motivational yet technical summary.

Your analysis should be:
- Encouraging but honest about areas for improvement
- Technically accurate using proper golf terminology
- Actionable with specific practice recommendations
- Focused on the most impactful changes

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no text outside the JSON structure.

Structure your response as:
- summary: 2-3 sentences covering overall swing quality and primary focus areas
- keyFindings: 3-5 short bullet points highlighting the most important discoveries
- byPhase: Object with 1-2 sentences per analyzed phase
- drills: Maximum 4 specific practice drills addressing the biggest opportunities
- confidence: Overall analysis confidence (0.0-1.0) based on video quality and completeness`,

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
      max_completion_tokens: 800,
      // Note: temperature not supported for GPT-4.1+
    },
    summarize: {
      model: "gpt-5-2025-08-07", // Best for comprehensive analysis
      max_completion_tokens: 1200,
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