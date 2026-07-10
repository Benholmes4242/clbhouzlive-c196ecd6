// Shared model pins for Echo v2 + engine health probe.
// Single source of truth — bump BUILD when any pin or engine behavior changes.
// ASCII only.

export const ANTHROPIC_MODEL_SYNTH = "claude-sonnet-5";     // Claude Sonnet 5
export const OPENAI_MODEL_SYNTH    = "gpt-5.5";             // GPT-5.5 synthesis
export const OPENAI_MODEL_INTENT   = "gpt-5.5";             // reserved
export const GEMINI_MODEL          = "gemini-3.5-flash";    // Gemini 3.5 Flash
export const PERPLEXITY_MODEL      = "sonar-pro";           // verified current

export const BUILD                 = "e2.9";                // bump on every change
