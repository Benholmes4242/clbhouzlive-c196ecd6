import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

interface WatchRevealValue {
  register: (id: string) => void;
  markSettled: (id: string) => void;
  revealed: boolean;
}

const noop: WatchRevealValue = {
  register: () => {},
  markSettled: () => {},
  revealed: true,
};

const WatchRevealContext = createContext<WatchRevealValue>(noop);

export function useWatchReveal(id: string, settled: boolean) {
  const ctx = useContext(WatchRevealContext);
  const { register, markSettled, revealed } = ctx;

  // useLayoutEffect: child commit effects run BEFORE the parent provider's
  // useLayoutEffect, which is how we deterministically close the registration
  // race — every rail is in the registry before the provider flips
  // `evaluationReady` and starts checking all-settled.
  useLayoutEffect(() => {
    register(id);
  }, [register, id]);

  useEffect(() => {
    if (settled) markSettled(id);
  }, [settled, markSettled, id]);

  return revealed;
}
export function useWatchRevealed() {
  return useContext(WatchRevealContext).revealed;
}

interface ProviderProps {
  children: ReactNode;
  /** Max ms to hold reveal for laggards. */
  deadlineMs?: number;
}

export function WatchRevealProvider({ children, deadlineMs = 1500 }: ProviderProps) {

  const [revealed, setRevealed] = useState(false);
  const [evaluationReady, setEvaluationReady] = useState(false);
  const registeredRef = useRef<Set<string>>(new Set());
  const settledRef = useRef<Set<string>>(new Set());
  const revealedRef = useRef(false);
  const evaluationReadyRef = useRef(false);

  const doReveal = useCallback((_cause: string) => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
  }, []);

  const checkAllSettled = useCallback(() => {
    if (revealedRef.current) return;
    if (!evaluationReadyRef.current) return; // gate: wait for child registration window to close
    const reg = registeredRef.current;
    if (reg.size === 0) return;
    const settled = settledRef.current;
    for (const id of reg) {
      if (!settled.has(id)) return;
    }
    doReveal('all-settled');
  }, [doReveal]);

  const register = useCallback((id: string) => {
    if (revealedRef.current) return;
    registeredRef.current.add(id);
  }, []);

  const markSettled = useCallback((id: string) => {
    if (revealedRef.current) return;
    settledRef.current.add(id);
    checkAllSettled();
  }, [checkAllSettled]);

  // Parent useLayoutEffect runs AFTER all children's useLayoutEffects —
  // by the time this fires, every rail/hero using useWatchReveal has
  // registered. Only now do we permit all-settled evaluation.
  useLayoutEffect(() => {
    evaluationReadyRef.current = true;
    setEvaluationReady(true);
  }, []);

  // If a warm visit had everything pre-settled during registration, run the
  // check the moment evaluation opens.
  useEffect(() => {
    if (evaluationReady) checkAllSettled();
  }, [evaluationReady, checkAllSettled]);

  // Deadline fallback — reveal even if a rail never settles.
  useEffect(() => {
    const t = setTimeout(() => doReveal('deadline'), deadlineMs);
    return () => clearTimeout(t);
  }, [doReveal, deadlineMs]);


  const value = useMemo<WatchRevealValue>(
    () => ({ register, markSettled, revealed }),
    [register, markSettled, revealed],
  );

  return <WatchRevealContext.Provider value={value}>{children}</WatchRevealContext.Provider>;
}
