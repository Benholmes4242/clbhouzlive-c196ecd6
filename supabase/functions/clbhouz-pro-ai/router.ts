// supabase/functions/clbhouz-pro-ai/router.ts

export type Route = "live" | "static";
export type Mode = "auto" | Route;

export function needsStaticExplainer(q: string): [boolean, string] {
  const p = q.toLowerCase();

  // Explainers / how-to / background
  if (/(explain|how does|how do|what is|what are|how to|background|origin|history of)/i.test(p)) {
    return [true, "explainer"];
  }

  // Explicitly historical years (1900–2022)
  if (/\b(19\d{2}|20(0\d|1\d|2[0-2]))\b/.test(p)) {
    return [true, "historical"];
  }

  // Default to live for everything else
  return [false, "default-live"];
}

// Safety check: if OpenAI replies with a cutoff/decline, trigger live fallback
export function modelDeclined(text?: string): boolean {
  if (!text) return false;
  const p = text.toLowerCase();
  return /\b(i (don'?t|do not) have (current|real-?time) info|knowledge cutoff|can'?t browse|check the web|not up to date)\b/.test(
    p
  );
}

// The top-level router used when mode === "auto"
export function decideRoute(q: string, mode: Mode = "auto"): { route: Route; reason: string } {
  if (mode !== "auto") return { route: mode, reason: "forced" };
  const [useStatic, reason] = needsStaticExplainer(q);
  return { route: useStatic ? "static" : "live", reason };
}
