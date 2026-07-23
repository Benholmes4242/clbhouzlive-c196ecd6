/**
 * PREDICTION_LOGIC_VERSION — client mirror of the constant defined in
 * supabase/functions/generate-predictions/index.ts. Bump BOTH in the same
 * change whenever prediction logic, prompt schema, or scoring maths change.
 *
 * The client compares a cached ai_predictions row's `logic_version` against
 * this value; rows below the current version are treated as a cache miss
 * and force a regeneration via the generate-predictions edge function.
 */
export const PREDICTION_LOGIC_VERSION = 2;
