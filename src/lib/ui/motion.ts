// motion.ts
export const prefersReduced = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const spring = (ms = 220) =>
  prefersReduced() ? `opacity ${ms}ms linear, transform ${ms}ms linear`
                   : `opacity ${ms}ms cubic-bezier(.2,.8,.2,1), transform ${ms}ms cubic-bezier(.2,.8,.2,1)`;
