/**
 * useRoundChainGate — the capped wait for the two chained round queries
 * (BRIEF_CLUBHOUSE_ROUND_POP_IN §2, §3).
 *
 * The feed's own loading state clears one full round trip before any
 * scorecard post is ready: the round arrives via usePostScoreIds ->
 * usePostRounds, two SEQUENTIAL reads. This gate holds the feed skeleton
 * until both have SETTLED — but never longer than CAP_MS.
 *
 * Measured on the live stack: score-id lookup 26-51ms, round batch 60-95ms
 * (three reads in parallel), so ~90-150ms warm/cold from a fast connection.
 * The wait is round-trip bound, so a mobile connection roughly doubles per
 * hop. CAP_MS = 600 clears a normal chain with room to spare while never
 * letting a slow network turn a fast feed into a blank screen; past the cap
 * the feed renders and outstanding rounds show PostRoundShell.
 *
 * A page whose rounds will NEVER come (no post carries a whs_score_id) is
 * ready immediately: usePostScoreIds settles, usePostRounds is disabled and
 * reports settled, so the gate opens with no extra wait at all.
 */
import { useEffect, useRef, useState } from 'react';

export const ROUND_CHAIN_CAP_MS = 600;

/**
 * @param settled  true when BOTH round queries have settled (or are disabled)
 * @param armed    true once the feed itself has produced posts — the clock
 *                 only starts when there is something to wait on
 */
export function useRoundChainGate(settled: boolean, armed: boolean): boolean {
  const [capped, setCapped] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!armed || settled) return;
    if (startedRef.current) return;
    startedRef.current = true;
    const id = window.setTimeout(() => setCapped(true), ROUND_CHAIN_CAP_MS);
    return () => window.clearTimeout(id);
  }, [armed, settled]);

  return settled || capped;
}
