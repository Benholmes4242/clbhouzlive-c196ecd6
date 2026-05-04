/**
 * Priority 1: Multi-Model Consensus Prediction Engine
 * (Adapted to available Sportradar stats)
 * 
 * Calls Claude, GPT-4, and Gemini independently with the same data,
 * then aggregates their picks using weighted Borda count scoring.
 * 
 * Gracefully degrades: if only Claude's API key is available, falls back
 * to single-model with all other improvements (course DNA, calculated fit, etc.)
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ModelPick {
  playerId: string;
  playerName: string;
  rank: number;
  winProbability: number;
  courseFitScore: number;
  reasons: string[];
}

export interface ModelResult {
  model: string;
  picks: ModelPick[];
  confidence: number;
  courseAnalysis: any;
  rawResponse: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface ConsensusResult {
  topContenders: ConsensusPick[];
  modelResults: ModelResult[];
  consensusMethod: string;
  consensusConfidence: number;
  courseAnalysis: any;
  agreementScore: number;
}

export interface ConsensusPick {
  playerId: string;
  playerName: string;
  rank: number;
  consensusScore: number;
  winProbability: number;
  courseFitScore: number | null;       // null when no DNA + no AI-returned fit
  reasons: string[];
  modelVotes: ModelVote[];
  isDarkHorse: boolean;
}

interface ModelVote {
  model: string;
  rank: number | null;
  winProbability: number;
}

// ── Model Weights ──────────────────────────────────────────────────────────────

const DEFAULT_MODEL_WEIGHTS: Record<string, number> = {
  claude: 0.40,
  gpt4: 0.35,
  gemini: 0.25,
};

// ── API Callers ────────────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ response: string; latencyMs: number }> {
  const start = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  const data = await res.json();
  return { response: data.content?.[0]?.text || '', latencyMs: Date.now() - start };
}

async function callGPT4(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ response: string; latencyMs: number }> {
  const start = Date.now();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  return { response: data.choices?.[0]?.message?.content || '', latencyMs: Date.now() - start };
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ response: string; latencyMs: number }> {
  const start = Date.now();
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[Consensus] Gemini HTTP ${res.status}:`, errorBody);
    return { response: '', latencyMs: Date.now() - start };
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) {
    console.error('[Consensus] Gemini empty response. Status:', res.status, 'finishReason:', data.candidates?.[0]?.finishReason, 'blockReason:', data.promptFeedback?.blockReason);
  }
  return { response: text, latencyMs: Date.now() - start };
}

// ── Response Parser ────────────────────────────────────────────────────────────

function parseModelResponse(rawResponse: string, modelName: string): { picks: ModelPick[]; confidence: number; courseAnalysis: any } {
  try {
    let json = rawResponse.trim();
    if (json.startsWith('```')) {
      json = json.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    const parsed = JSON.parse(json);
    const contenders = parsed.topContenders || parsed.top_contenders || parsed.picks || [];

    const picks = contenders.slice(0, 8).map((c: any, i: number) => ({
      playerId: c.playerId || c.player_id || '',
      playerName: c.playerName || c.player_name || c.name || 'Unknown',
      rank: c.rank || i + 1,
      winProbability: c.winProbability || c.win_probability || 0,
      courseFitScore: c.courseFitScore || c.course_fit_score || 50,
      reasons: (c.reasons || []).slice(0, 3).map((r: any) =>
        typeof r === 'string' ? r : r.text || r.reason || ''
      ),
    }));

    return {
      picks,
      confidence: parsed.confidence || 0.7,
      courseAnalysis: parsed.courseAnalysis || parsed.course_analysis || null,
    };
  } catch (err) {
    console.error(`[Consensus] Failed to parse ${modelName} response:`, err);
    return { picks: [], confidence: 0, courseAnalysis: null };
  }
}

// ── Consensus Aggregation ──────────────────────────────────────────────────────

export function aggregateConsensus(
  modelResults: ModelResult[],
  modelWeights: Record<string, number> = DEFAULT_MODEL_WEIGHTS,
  calculatedFitScores?: Map<string, number>,
): ConsensusResult {
  
  const successfulModels = modelResults.filter((r) => r.success);
  
  if (successfulModels.length === 0) {
    throw new Error('All models failed — cannot generate consensus');
  }

  // Single model fallback
  if (successfulModels.length === 1) {
    const model = successfulModels[0];
    return {
      topContenders: model.picks.map((p, i) => ({
        ...p,
        rank: i + 1,
        consensusScore: 100 - i * 10,
        courseFitScore: calculatedFitScores?.get(p.playerId) || p.courseFitScore,
        modelVotes: [{ model: model.model, rank: p.rank, winProbability: p.winProbability }],
        isDarkHorse: false,
      })),
      modelResults,
      consensusMethod: 'single_model_fallback',
      consensusConfidence: model.confidence,
      courseAnalysis: model.courseAnalysis,
      agreementScore: 100,
    };
  }

  // Normalize weights for active models
  const activeWeightSum = successfulModels.reduce(
    (sum, r) => sum + (modelWeights[r.model] || 0.33), 0
  );
  const normalizedWeights: Record<string, number> = {};
  for (const r of successfulModels) {
    normalizedWeights[r.model] = (modelWeights[r.model] || 0.33) / activeWeightSum;
  }

  // Weighted Borda count
  const playerScores = new Map<string, {
    name: string;
    score: number;
    winProbabilities: number[];
    reasons: Map<string, string[]>;
    votes: ModelVote[];
    modelCount: number;
  }>();

  for (const result of successfulModels) {
    const weight = normalizedWeights[result.model];
    for (const pick of result.picks) {
      const bordaPoints = (9 - pick.rank) * weight;
      const existing = playerScores.get(pick.playerId) || {
        name: pick.playerName,
        score: 0,
        winProbabilities: [],
        reasons: new Map(),
        votes: [],
        modelCount: 0,
      };
      existing.score += bordaPoints;
      existing.winProbabilities.push(pick.winProbability);
      existing.reasons.set(result.model, pick.reasons);
      existing.votes.push({ model: result.model, rank: pick.rank, winProbability: pick.winProbability });
      existing.modelCount += 1;
      playerScores.set(pick.playerId, existing);
    }
  }

  const ranked = [...playerScores.entries()].sort(([, a], [, b]) => b.score - a.score);

  // Agreement score
  const top5ByModel = successfulModels.map((r) =>
    new Set(r.picks.slice(0, 5).map((p) => p.playerId))
  );
  let overlapCount = 0;
  let totalPairComparisons = 0;
  for (let i = 0; i < top5ByModel.length; i++) {
    for (let j = i + 1; j < top5ByModel.length; j++) {
      const intersection = [...top5ByModel[i]].filter((id) => top5ByModel[j].has(id));
      overlapCount += intersection.length;
      totalPairComparisons += 5;
    }
  }
  const agreementScore = totalPairComparisons > 0
    ? Math.round((overlapCount / totalPairComparisons) * 100) : 0;

  // Build final contenders
  const topContenders: ConsensusPick[] = ranked.slice(0, 8).map(([playerId, data], index) => {
    const bestVote = data.votes.reduce((best, v) =>
      (v.rank !== null && (!best || v.rank < best.rank!)) ? v : best
    );
    const bestReasons = data.reasons.get(bestVote.model) || ['Strong overall profile'];
    const avgWinProb = data.winProbabilities.length > 0
      ? data.winProbabilities.reduce((a, b) => a + b, 0) / data.winProbabilities.length : 0;

    return {
      playerId,
      playerName: data.name,
      rank: index + 1,
      consensusScore: Math.round(data.score * 100),
      winProbability: Math.round(avgWinProb * 10) / 10,
      courseFitScore: calculatedFitScores?.get(playerId) || 50,
      reasons: bestReasons,
      modelVotes: data.votes,
      isDarkHorse: data.modelCount === 1 && data.votes[0]?.rank !== null && data.votes[0].rank <= 3,
    };
  });

  const bestModel = successfulModels.reduce((best, r) =>
    r.confidence > (best?.confidence || 0) ? r : best
  );

  return {
    topContenders,
    modelResults,
    consensusMethod: 'weighted_borda_count',
    consensusConfidence: Math.round(
      successfulModels.reduce((sum, r) => sum + r.confidence, 0) / successfulModels.length * 100
    ) / 100,
    courseAnalysis: bestModel.courseAnalysis,
    agreementScore,
  };
}

// ── Main Orchestrator ──────────────────────────────────────────────────────────

export async function runConsensus(
  systemPrompt: string,
  userPrompt: string,
  calculatedFitScores?: Map<string, number>,
  modelWeights?: Record<string, number>,
): Promise<ConsensusResult> {
  
  console.log('[Consensus] Starting multi-model prediction...');

  const modelCalls: Array<Promise<ModelResult>> = [];

  // Always call Claude (required)
  modelCalls.push(
    (async (): Promise<ModelResult> => {
      try {
        const { response, latencyMs } = await callClaude(systemPrompt, userPrompt);
        const { picks, confidence, courseAnalysis } = parseModelResponse(response, 'claude');
        return { model: 'claude', picks, confidence, courseAnalysis, rawResponse: response, latencyMs, success: picks.length >= 5 };
      } catch (err: any) {
        console.error('[Consensus] Claude failed:', err.message);
        return { model: 'claude', picks: [], confidence: 0, courseAnalysis: null, rawResponse: '', latencyMs: 0, success: false, error: err.message };
      }
    })()
  );

  // Optionally call GPT-4
  if (Deno.env.get('OPENAI_API_KEY')) {
    modelCalls.push(
      (async (): Promise<ModelResult> => {
        try {
          const { response, latencyMs } = await callGPT4(systemPrompt, userPrompt);
          const { picks, confidence, courseAnalysis } = parseModelResponse(response, 'gpt4');
          return { model: 'gpt4', picks, confidence, courseAnalysis, rawResponse: response, latencyMs, success: picks.length >= 5 };
        } catch (err: any) {
          console.error('[Consensus] GPT-4 failed:', err.message);
          return { model: 'gpt4', picks: [], confidence: 0, courseAnalysis: null, rawResponse: '', latencyMs: 0, success: false, error: err.message };
        }
      })()
    );
  } else {
    console.log('[Consensus] Skipping GPT-4 — no OPENAI_API_KEY');
  }

  // Optionally call Gemini
  if (Deno.env.get('GEMINI_API_KEY')) {
    modelCalls.push(
      (async (): Promise<ModelResult> => {
        try {
          const { response, latencyMs } = await callGemini(systemPrompt, userPrompt);
          const { picks, confidence, courseAnalysis } = parseModelResponse(response, 'gemini');
          return { model: 'gemini', picks, confidence, courseAnalysis, rawResponse: response, latencyMs, success: picks.length >= 5 };
        } catch (err: any) {
          console.error('[Consensus] Gemini failed:', err.message);
          return { model: 'gemini', picks: [], confidence: 0, courseAnalysis: null, rawResponse: '', latencyMs: 0, success: false, error: err.message };
        }
      })()
    );
  } else {
    console.log('[Consensus] Skipping Gemini — no GEMINI_API_KEY');
  }

  // Run all models in parallel
  const modelResults = await Promise.all(modelCalls);
  
  const successCount = modelResults.filter((r) => r.success).length;
  console.log(`[Consensus] ${successCount}/${modelResults.length} models succeeded`);
  for (const r of modelResults) {
    console.log(`[Consensus] ${r.model}: ${r.success ? `${r.picks.length} picks in ${r.latencyMs}ms` : `FAILED — ${r.error}`}`);
  }

  const consensus = aggregateConsensus(modelResults, modelWeights || DEFAULT_MODEL_WEIGHTS, calculatedFitScores);
  
  console.log(`[Consensus] Top 5: ${consensus.topContenders.slice(0, 5).map((p) => p.playerName).join(', ')}`);
  console.log(`[Consensus] Agreement: ${consensus.agreementScore}%, Method: ${consensus.consensusMethod}`);

  return consensus;
}
