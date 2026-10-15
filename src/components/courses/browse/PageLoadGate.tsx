import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * PageLoadGate — one reveal per tab (BRIEF_COURSES_LOAD_GATE).
 *
 * Children stay MOUNTED behind display:none so their queries fire exactly as
 * before; the gate reveals in one paint (no fade, no height tween) once every
 * expected section has reported ready. One-shot: never hides again.
 * The skeleton is a single 180px block — smaller than either page's smallest
 * settled state, so the surface only ever expands outwards.
 */
interface GateCtx {
  report: (id: string, ready: boolean) => void;
  revealed: boolean;
}

const Ctx = createContext<GateCtx | null>(null);

/** Call at the TOP of a section, before any early return. Ready = !isLoading. */
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
const FAILSAFE_MS = 4000;

export function PageLoadGate({ expect, children }: { expect: readonly string[]; children: React.ReactNode }) {
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
      {revealed ? null : (
        <div style={{ padding: '0 16px' }}>
          <Skeleton className="w-full" style={{ height: 180, borderRadius: 0 }} />
        </div>
      )}
      <div style={revealed ? undefined : { display: 'none' }}>{children}</div>
    </Ctx.Provider>
  );
}
