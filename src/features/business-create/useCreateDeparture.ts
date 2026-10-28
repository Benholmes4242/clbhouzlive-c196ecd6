/** BrowserRouter has no useBlocker support. Intercept its navigator for app exits
 * and capture native POP before the router commits an out-of-flow history entry.
 * Step POPs remain native; rejected departures restore the old index first. */
import { useContext, useEffect, useRef, useState } from 'react';
import { UNSAFE_NavigationContext, useLocation } from 'react-router-dom';

export function useCreateDeparture(dirty: boolean, busy: boolean, complete: boolean, step: number) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const allowed = useRef(false);
  const state = useRef({ dirty, busy, complete, step });
  state.current = { dirty, busy, complete, step };
  const requestExit = (action: () => void) => {
    if (state.current.busy) return;
    if (state.current.dirty && !state.current.complete) { pending.current = action; setConfirmOpen(true); }
    else action();
  };
  useEffect(() => {
    const originalGo = navigator.go.bind(navigator);
    navigator.go = delta => {
      const s = state.current;
      if (!allowed.current && delta < 0 && s.step === 1 && !s.complete) requestExit(() => { allowed.current = true; originalGo(delta); });
      else originalGo(delta);
    };
    const originalPush = navigator.push.bind(navigator);
    navigator.push = (...args) => {
      const to = args[0];
      const path = typeof to === 'string' ? to.split('?')[0] : to.pathname;
      if (!allowed.current && path && path !== location.pathname && path !== '/auth') requestExit(() => { allowed.current = true; originalPush(...args); });
      else originalPush(...args);
    };
    return () => { navigator.go = originalGo; navigator.push = originalPush; };
  }, [navigator, location.pathname]);
  const entries = useRef(new Set<number>());
  const currentIndex = useRef<number | null>(null);
  useEffect(() => {
    const idx = window.history.state?.idx;
    if (typeof idx === 'number') { entries.current.add(idx); currentIndex.current = idx; }
  }, [location.key]);
  useEffect(() => {
    let restoring = false;
    const pop = (event: PopStateEvent) => {
      if (restoring) { restoring = false; event.stopImmediatePropagation(); return; }
      const idx = event.state?.idx;
      const from = currentIndex.current;
      const s = state.current;
      if (allowed.current || s.complete || (!s.dirty && !s.busy) || typeof idx !== 'number' || from == null || entries.current.has(idx)) return;
      event.stopImmediatePropagation();
      restoring = true;
      window.history.go(from - idx);
      if (!s.busy) { pending.current = () => { allowed.current = true; window.history.go(idx - from); }; setConfirmOpen(true); }
    };
    window.addEventListener('popstate', pop, true);
    const unload = (event: BeforeUnloadEvent) => { if (state.current.dirty && !state.current.complete) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', unload);
    return () => { window.removeEventListener('popstate', pop, true); window.removeEventListener('beforeunload', unload); };
  }, []);
  return { confirmOpen, setConfirmOpen, requestExit, discard: () => { setConfirmOpen(false); const action = pending.current; pending.current = null; action?.(); } };
}