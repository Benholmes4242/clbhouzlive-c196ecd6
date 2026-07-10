/**
 * TI-1 Multi-Model Consensus Prediction Engine
 *
 * Model pins imported from ../_shared/echo-models.ts (single source of truth).
 * Request shapes and parsers aligned to the echo-v2 standard:
 *   - Claude Sonnet 5: no sampling params; concat all content[] blocks where type==="text".
 *   - OpenAI GPT-5.5: max_completion_tokens + reasoning_effort:"none"; no legacy max_tokens.
 *   - Gemini 3.5 Flash: minimal body; concatenate every non-thought text part.
 * Never-silent guarantees:
 *   - Every model call logs "[ti] <model> ok in Xms, N picks" on success.
 *   - On failure logs the VERBATIM error body.
 *   - Empty on 2xx throws with a shape snippet.
 *   - modelResults[].error records the failure reason string (not just success:false).
 */

import {
  ANTHROPIC_MODEL_SYNTH,
  OPENAI_MODEL_SYNTH,
  GEMINI_MODEL,
} from '../_shared/echo-models.ts';

// -- Types ----------------------------------------------------------------

export interface ModelPick {
  playerId: string;
  playerName: string;
  rank: number;
  winProbability: number;
  courseFitScore: number | null;
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
  courseFitScore: number | null;
  reasons: string[];
  modelVotes: ModelVote[];
  isDarkHorse: boolean;
}

interface ModelVote {
  model: string;
  rank: number | null;
  winProbability: number;
}

// -- Weights --------------------------------------------------------------

const DEFAULT_MODEL_WEIGHTS: Record<string, number> = {
  claude: 0.40,
  gpt4: 0.35,
  gemini: 0.25,
};

// -- Helpers --------------------------------------------------------------

function shapeSnippet(d: unknown): string {
  try {
    return JSON.stringify(d).slice(0, 300);
  } catch {
    return String(d).slice(0, 300);
  }
}

// -- API Callers ----------------------------------------------------------

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
      // Sonnet 5: no temperature / top_p / top_k.
      model: ANTHROPIC_MODEL_SYNTH,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `${userPrompt}\n\nReturn compact JSON - no markdown fences, no prose, reasons under 12 words each.` }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ti] claude ${res.status}:`, body);
    throw new Error(`Claude ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const text = blocks
    .filter((b: any) => b?.type === 'text' && typeof b?.text === 'string')
    .map((b: any) => b.text)
    .join('')
    .trim();
  if (!text) {
    throw new Error(`Claude empty on 2xx: ${shapeSnippet(data)}`);
  }
  return { response: text, latencyMs: Date.now() - start };
}

async function callOpenAI(
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
      // GPT-5.5: use max_completion_tokens (chat completions rejects legacy
      // max_tokens on GPT-5-series); reasoning_effort:"none" is fastest tier.
      model: OPENAI_MODEL_SYNTH,
      max_completion_tokens: 16384,
      reasoning_effort: 'none',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ti] openai ${res.status}:`, body);
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = (data?.choices?.[0]?.message?.content || '').trim();
  if (!text) {
    throw new Error(`OpenAI empty on 2xx: ${shapeSnippet(data)}`);
  }
  return { response: text, latencyMs: Date.now() - start };
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ response: string; latencyMs: number }> {
  const start = Date.now();
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ti] gemini ${res.status}:`, body);
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const parts: Array<{ text?: string; thought?: boolean }> =
    data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p) => p && p.thought !== true && typeof p.text === 'string')
    .map((p) => p.text as string)
    .join('')
    .trim();
  if (!text) {
    throw new Error(`Gemini empty on 2xx: ${shapeSnippet(data)}`);
  }
  return { response: text, latencyMs: Date.now() - start };
}

// -- Response Parser ------------------------------------------------------

function parseModelResponse(
  rawResponse: string,
  modelName: string,
): { picks: ModelPick[]; confidence: number; courseAnalysis: any } {
  try {
    let json = rawResponse.trim();
    if (json.startsWith('```')) {
      json = json.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    // Gemini/Claude sometimes wrap JSON in prose; grab the outermost object.
    if (!json.startsWith('{')) {
      const first = json.indexOf('{');
      const last = json.lastIndexOf('}');
      if (first >= 0 && last > first) json = json.slice(first, last + 1);
    }
    const parsed = JSON.parse(json);
    const contenders = parsed.topContenders || parsed.top_contenders || parsed.picks || [];

    const picks = contenders.slice(0, 8).map((c: any, i: number) => {
      const rawFit =
        typeof c.courseFitScore === 'number'
          ? c.courseFitScore
          : typeof c.course_fit_score === 'number'
          ? c.course_fit_score
          : null;
      return {
        playerId: c.playerId || c.player_id || '',
        playerName: c.playerName || c.player_name || c.name || 'Unknown',
        rank: c.rank || i + 1,
        winProbability: c.winProbability || c.win_probability || 0,
        courseFitScore: rawFit,
        reasons: (c.reasons || []).slice(0, 3).map((r: any) =>
          typeof r === 'string' ? r : r.text || r.reason || '',
        ),
      };
    });

    return {
      picks,
      confidence: parsed.confidence || 0.7,
      courseAnalysis: parsed.courseAnalysis || parsed.course_analysis || null,
    };
  } catch (err) {
    console.error(`[ti] ${modelName} parse failed:`, (err as Error).message, 'raw head:', rawResponse.slice(0, 200));
    return { picks: [], confidence: 0, courseAnalysis: null };
  }
}

// -- Consensus Aggregation -----------------------------------------------

export function aggregateConsensus(
  modelResults: ModelResult[],
  modelWeights: Record<string, number> = DEFAULT_MODEL_WEIGHTS,
  calculatedFitScores?: Map<string, number>,
): ConsensusResult {
  const successfulModels = modelResults.filter((r) => r.success);

  if (successfulModels.length === 0) {
    throw new Error('All models failed - cannot generate consensus');
  }

  if (successfulModels.length === 1) {
    const model = successfulModels[0];
    return {
      topContenders: model.picks.map((p, i) => ({
        ...p,
        rank: i + 1,
        consensusScore: 100 - i * 10,
        courseFitScore:
          calculatedFitScores?.get(p.playerId) ??
          (typeof p.courseFitScore === 'number' && p.courseFitScore > 0 ? p.courseFitScore : null),
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

  const activeWeightSum = successfulModels.reduce(
    (sum, r) => sum + (modelWeights[r.model] || 0.33),
    0,
  );
  const normalizedWeights: Record<string, number> = {};
  for (const r of successfulModels) {
    normalizedWeights[r.model] = (modelWeights[r.model] || 0.33) / activeWeightSum;
  }

  const playerScores = new Map<string, {
    name: string;
    score: number;
    winProbabilities: number[];
    courseFitScores: Map<string, number>;
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
        courseFitScores: new Map<string, number>(),
        reasons: new Map(),
        votes: [],
        modelCount: 0,
      };
      existing.score += bordaPoints;
      existing.winProbabilities.push(pick.winProbability);
      if (typeof pick.courseFitScore === 'number' && pick.courseFitScore > 0) {
        existing.courseFitScores.set(result.model, pick.courseFitScore);
      }
      existing.reasons.set(result.model, pick.reasons);
      existing.votes.push({ model: result.model, rank: pick.rank, winProbability: pick.winProbability });
      existing.modelCount += 1;
      playerScores.set(pick.playerId, existing);
    }
  }

  const ranked = [...playerScores.entries()].sort(([, a], [, b]) => b.score - a.score);

  const top5ByModel = successfulModels.map((r) =>
    new Set(r.picks.slice(0, 5).map((p) => p.playerId)),
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
  const agreementScore =
    totalPairComparisons > 0 ? Math.round((overlapCount / totalPairComparisons) * 100) : 0;

  const topContenders: ConsensusPick[] = ranked.slice(0, 8).map(([playerId, data], index) => {
    const modelsByWeight = Object.entries(normalizedWeights)
      .sort(([, a], [, b]) => b - a)
      .map(([model]) => model);
    let bestReasons: string[] = [];
    for (const model of modelsByWeight) {
      const candidate = data.reasons.get(model);
      if (candidate && candidate.length >= 1) {
        bestReasons = candidate;
        break;
      }
    }
    if (bestReasons.length === 0) {
      bestReasons = ['Strong overall profile'];
    }

    const avgWinProb =
      data.winProbabilities.length > 0
        ? data.winProbabilities.reduce((a, b) => a + b, 0) / data.winProbabilities.length
        : 0;

    const calculatedFit = calculatedFitScores?.get(playerId);
    const modelFitValues = [...data.courseFitScores.values()];
    const avgModelFit =
      modelFitValues.length > 0
        ? Math.round(modelFitValues.reduce((a, b) => a + b, 0) / modelFitValues.length)
        : null;
    const finalFit = calculatedFit ?? avgModelFit ?? null;

    return {
      playerId,
      playerName: data.name,
      rank: index + 1,
      consensusScore: Math.round(data.score * 100),
      winProbability: Math.round(avgWinProb * 10) / 10,
      courseFitScore: finalFit,
      reasons: bestReasons,
      modelVotes: data.votes,
      isDarkHorse: data.modelCount === 1 && data.votes[0]?.rank !== null && data.votes[0].rank <= 3,
    };
  });

  const bestModel = successfulModels.reduce((best, r) =>
    r.confidence > (best?.confidence || 0) ? r : best,
  );

  return {
    topContenders,
    modelResults,
    consensusMethod: 'weighted_borda_count',
    consensusConfidence:
      Math.round((successfulModels.reduce((sum, r) => sum + r.confidence, 0) / successfulModels.length) * 100) / 100,
    courseAnalysis: bestModel.courseAnalysis,
    agreementScore,
  };
}

// -- Fabrication Guard ---------------------------------------------------

/**
 * Discards any pick whose playerId/playerName is not present in the provided
 * field pool. Logs every discard so it appears in the never-silent log stream.
 */
export function filterPicksToPool(
  picks: ModelPick[],
  poolPlayerIds: Set<string>,
  poolNameToId: Map<string, string>,
  modelName: string,
): ModelPick[] {
  const kept: ModelPick[] = [];
  for (const p of picks) {
    if (p.playerId && poolPlayerIds.has(p.playerId)) {
      kept.push(p);
      continue;
    }
    // Try match-by-name so an AI that omitted or garbled the ID isn't
    // silently dropped as long as the NAME is genuinely in the pool.
    const nameKey = (p.playerName || '').toLowerCase().trim();
    const idFromName = nameKey ? poolNameToId.get(nameKey) : undefined;
    if (idFromName) {
      kept.push({ ...p, playerId: idFromName });
      continue;
    }
    console.warn(`[ti] ${modelName} DISCARDED fabricated pick: "${p.playerName}" (id="${p.playerId}") - not in field pool`);
  }
  return kept;
}

// -- Main Orchestrator ---------------------------------------------------

export async function runConsensus(
  systemPrompt: string,
  userPrompt: string,
  calculatedFitScores?: Map<string, number>,
  modelWeights?: Record<string, number>,
  poolPlayerIds?: Set<string>,
  poolNameToId?: Map<string, string>,
): Promise<ConsensusResult> {
  console.log('[ti] Starting multi-model prediction...');
  console.log(`[ti] pins claude=${ANTHROPIC_MODEL_SYNTH} openai=${OPENAI_MODEL_SYNTH} gemini=${GEMINI_MODEL}`);

  const modelCalls: Array<Promise<ModelResult>> = [];

  // Claude (required)
  modelCalls.push(
    (async (): Promise<ModelResult> => {
      const t0 = Date.now();
      try {
        const { response, latencyMs } = await callClaude(systemPrompt, userPrompt);
        const parsed = parseModelResponse(response, 'claude');
        let picks = parsed.picks;
        if (poolPlayerIds && poolNameToId) {
          picks = filterPicksToPool(picks, poolPlayerIds, poolNameToId, 'claude');
        }
        const success = picks.length >= 5;
        console.log(`[ti] claude ${success ? 'ok' : 'insufficient'} in ${latencyMs}ms, ${picks.length} picks`);
        return {
          model: 'claude',
          picks,
          confidence: parsed.confidence,
          courseAnalysis: parsed.courseAnalysis,
          rawResponse: response,
          latencyMs,
          success,
          error: success ? undefined : `only ${picks.length} valid picks after fabrication guard`,
        };
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.error(`[ti] claude FAILED in ${Date.now() - t0}ms:`, msg);
        return { model: 'claude', picks: [], confidence: 0, courseAnalysis: null, rawResponse: '', latencyMs: Date.now() - t0, success: false, error: msg };
      }
    })(),
  );

  // OpenAI (optional)
  if (Deno.env.get('OPENAI_API_KEY')) {
    modelCalls.push(
      (async (): Promise<ModelResult> => {
        const t0 = Date.now();
        try {
          const { response, latencyMs } = await callOpenAI(systemPrompt, userPrompt);
          const parsed = parseModelResponse(response, 'gpt4');
          let picks = parsed.picks;
          if (poolPlayerIds && poolNameToId) {
            picks = filterPicksToPool(picks, poolPlayerIds, poolNameToId, 'gpt4');
          }
          const success = picks.length >= 5;
          console.log(`[ti] openai ${success ? 'ok' : 'insufficient'} in ${latencyMs}ms, ${picks.length} picks`);
          return {
            model: 'gpt4',
            picks,
            confidence: parsed.confidence,
            courseAnalysis: parsed.courseAnalysis,
            rawResponse: response,
            latencyMs,
            success,
            error: success ? undefined : `only ${picks.length} valid picks after fabrication guard`,
          };
        } catch (err: any) {
          const msg = err?.message || String(err);
          console.error(`[ti] openai FAILED in ${Date.now() - t0}ms:`, msg);
          return { model: 'gpt4', picks: [], confidence: 0, courseAnalysis: null, rawResponse: '', latencyMs: Date.now() - t0, success: false, error: msg };
        }
      })(),
    );
  } else {
    console.log('[ti] skipping openai - no OPENAI_API_KEY');
  }

  // Gemini (optional)
  if (Deno.env.get('GEMINI_API_KEY')) {
    modelCalls.push(
      (async (): Promise<ModelResult> => {
        const t0 = Date.now();
        try {
          const { response, latencyMs } = await callGemini(systemPrompt, userPrompt);
          const parsed = parseModelResponse(response, 'gemini');
          let picks = parsed.picks;
          if (poolPlayerIds && poolNameToId) {
            picks = filterPicksToPool(picks, poolPlayerIds, poolNameToId, 'gemini');
          }
          const success = picks.length >= 5;
          console.log(`[ti] gemini ${success ? 'ok' : 'insufficient'} in ${latencyMs}ms, ${picks.length} picks`);
          return {
            model: 'gemini',
            picks,
            confidence: parsed.confidence,
            courseAnalysis: parsed.courseAnalysis,
            rawResponse: response,
            latencyMs,
            success,
            error: success ? undefined : `only ${picks.length} valid picks after fabrication guard`,
          };
        } catch (err: any) {
          const msg = err?.message || String(err);
          console.error(`[ti] gemini FAILED in ${Date.now() - t0}ms:`, msg);
          return { model: 'gemini', picks: [], confidence: 0, courseAnalysis: null, rawResponse: '', latencyMs: Date.now() - t0, success: false, error: msg };
        }
      })(),
    );
  } else {
    console.log('[ti] skipping gemini - no GEMINI_API_KEY');
  }

  const modelResults = await Promise.all(modelCalls);

  const successCount = modelResults.filter((r) => r.success).length;
  console.log(`[ti] ${successCount}/${modelResults.length} models succeeded`);

  const consensus = aggregateConsensus(modelResults, modelWeights || DEFAULT_MODEL_WEIGHTS, calculatedFitScores);

  console.log(`[ti] Top 5: ${consensus.topContenders.slice(0, 5).map((p) => p.playerName).join(', ')}`);
  console.log(`[ti] agreement=${consensus.agreementScore}% method=${consensus.consensusMethod}`);

  return consensus;
}
