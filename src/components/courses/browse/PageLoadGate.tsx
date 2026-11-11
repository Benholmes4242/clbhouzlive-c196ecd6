import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * PageLoadGate — one reveal per tab (BRIEF_COURSES_LOAD_GATE).
 *
 * Children stay MOUNTED behind display:none so their queries fire exactly as
 * before; the gate reveals in one paint (no fade, no height tween) once every
 * expected section has reported ready. One-shot: never hides again.
 * Courses supplies its existing section shells as a fallback; other tabs default
 * to no fallback. A failsafe leaves unsettled sections on their own shells.
 */
interface GateCtx {
  report: (id: string, ready: boolean) => void;
  revealed: boolean;
}

const Ctx = createContext<GateCtx | null>(null);

/** Disabled/dependent queries are not settled merely because isLoading is false. */
export function settled(query: { isFetched?: boolean; isError?: boolean; status?: string }): boolean {
  return query.isFetched === true || query.isError === true || query.status === 'success' || query.status === 'error';
}

/** Call at the TOP of a section, before any early return. */
export function useSectionReady(id: string, ready: boolean): void {
  const ctx = useContext(Ctx);
  const report = ctx?.report;
  useEffect(() => {
    report?.(id, ready);
  }, [report, id, ready]);
}

export function usePageRevealed(): boolean {
  return useContext(Ctx)?.revealed ?? true;
}

/** FAILSAFE, not a timing mechanism: a hung query degrades to ungated rendering. */
const FAILSAFE_MS = 8000;

export function PageLoadGate({ expect, children, fallback = null }: { expect: readonly string[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const [readyIds, setReadyIds] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState(false);

  const report = useCallback((id: string, ready: boolean) => {
    setReadyIds((prev) => (prev[id] === ready ? prev : { ...prev, [id]: ready }));
  }, []);

  const allReady = expect.every((id) => readyIds[id]);
  useEffect(() => {
    if (allReady) setRevealed(true);
  }, [allReady]);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), FAILSAFE_MS);
    return () => clearTimeout(t);
  }, []);

  const value = useMemo(() => ({ report, revealed }), [report, revealed]);

  return (
    <Ctx.Provider value={value}>
      {!revealed && fallback}
      <div style={revealed ? undefined : { display: 'none' }}>{children}</div>
    </Ctx.Provider>
  );
}
