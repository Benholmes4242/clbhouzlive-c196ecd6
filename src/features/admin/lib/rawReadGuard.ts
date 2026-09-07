/**
 * PostgREST returns AT MOST 2000 rows, whatever `.limit()` says.
 *
 * ── THIS GUARD IS A HEURISTIC, NOT A PROOF. READ BEFORE TRUSTING IT. ────────
 *
 * It fires when a response length equals the cap, which is the common shape of
 * a truncated read. It has two known blind spots and cannot close either one
 * by itself:
 *
 *   1. FALSE POSITIVE. A window that genuinely contains exactly 2000 rows is
 *      complete, and this guard will still flag it. Rare, but real.
 *
 *   2. FALSE NEGATIVE. A paged read can be truncated at a page boundary
 *      without any single response ever being 2000 rows long, so the guard
 *      never fires and the loss is silent — exactly the failure it exists to
 *      catch.
 *
 * Blind spot 1 IS closable at the call site, and cheaply: ask for cap + 1 rows
 * with `.limit(POSTGREST_PROBE_LIMIT)` and pass `probed: true`. If the cap is
 * really the ceiling you still get 2000 back and the guard is right; if the
 * window genuinely held 2000 you get 2000 and no more rows exist, so the guard
 * would be wrong — which is why probing must be paired with `expectedTotal`
 * from a `{ count: 'exact', head: true }` query to be conclusive. When
 * `expectedTotal` is supplied the check is a PROOF: received < expected means
 * truncated, full stop. Without it, it is a warning.
 *
 * Blind spot 2 is NOT closable here. It belongs to whoever writes the paging
 * loop, and the only real answer is not to page raw analytics events in the
 * browser at all.
 *
 * STANDING RULE, which is the actual protection: no admin figure is computed
 * by counting rows in the browser. Counting happens in Postgres, behind an
 * admin-gated RPC. This guard is a tripwire for code that has already broken
 * that rule, not a licence to break it.
 */
export const POSTGREST_ROW_CAP = 2000;

/** Request this many to tell "capped at 2000" from "exactly 2000 exist". */
export const POSTGREST_PROBE_LIMIT = POSTGREST_ROW_CAP + 1;

export interface TruncationCheck {
  /** Hook or function name, so the log names the culprit. */
  hook: string;
  /** Human description of the window read, e.g. "last 14 days". */
  window: string;
  /** Rows actually received. */
  received: number | null | undefined;
  /**
   * Exact row count for the same window from a head/count query. When given,
   * the check is conclusive rather than heuristic.
   */
  expectedTotal?: number | null;
  /** True when the select asked for POSTGREST_PROBE_LIMIT rows. */
  probed?: boolean;
}

/**
 * Development throws, so truncation is found on the first run. Production logs
 * an error naming the hook and the window, so it is found in the logs rather
 * than in a quietly plausible number six months later.
 */
export function assertNotTruncated(check: TruncationCheck): void;
export function assertNotTruncated(hook: string, window: string, received: number | null | undefined): void;
export function assertNotTruncated(
  a: TruncationCheck | string,
  window?: string,
  received?: number | null | undefined,
): void {
  const c: TruncationCheck = typeof a === 'string'
    ? { hook: a, window: window ?? 'unknown', received }
    : a;
  const got = c.received ?? 0;

  // Conclusive path: an exact count for the same window.
  if (typeof c.expectedTotal === 'number') {
    if (got >= c.expectedTotal) return;
    fail(
      `[admin raw read] ${c.hook} received ${got} of ${c.expectedTotal} rows for window "${c.window}". ` +
      `This read IS truncated and any figure derived from it is false.`,
    );
    return;
  }

  if (got < POSTGREST_ROW_CAP) return;

  // Heuristic path.
  const qualifier = c.probed
    ? `The select asked for ${POSTGREST_PROBE_LIMIT} rows and received the cap, so this is truncation.`
    : `LIKELY truncation — a window holding exactly ${POSTGREST_ROW_CAP} rows would look identical. ` +
      `Pass expectedTotal from a { count: 'exact', head: true } query to be certain.`;
  fail(
    `[admin raw read] ${c.hook} received ${got} rows for window "${c.window}", equal to the PostgREST cap. ` +
    `${qualifier} Aggregate in Postgres behind an admin-gated RPC instead.`,
  );
}

function fail(message: string): void {
  if (import.meta.env.DEV) throw new Error(message);
  console.error(message);
}
