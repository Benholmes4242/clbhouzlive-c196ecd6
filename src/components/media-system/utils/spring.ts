/**
 * Spring Physics Engine — lightweight solver for natural scroll animations.
 * Uses semi-implicit Euler integration for stability.
 */

export interface SpringConfig {
  tension: number;    // Stiffness — higher = snappier
  friction: number;   // Damping — higher = less bouncy
  mass: number;       // Inertia — higher = heavier feel
  precision: number;  // Stop threshold (px)
}

interface SpringState {
  value: number;
  velocity: number;   // px/s
}

export const DEFAULT_CONFIG: SpringConfig = {
  tension: 220,
  friction: 24,
  mass: 1,
  precision: 0.5,
};

export const SPRING_CONFIGS = {
  /** Normal snap — responsive with slight overshoot */
  snap: { tension: 220, friction: 24, mass: 1, precision: 0.5 } as SpringConfig,
  /** Fling — more momentum, more overshoot */
  fling: { tension: 180, friction: 22, mass: 1, precision: 0.5 } as SpringConfig,
  /** Rubber-band return — snappier, no overshoot */
  rubberBand: { tension: 300, friction: 30, mass: 1, precision: 0.5 } as SpringConfig,
};

function stepSpring(
  state: SpringState,
  target: number,
  config: SpringConfig,
  dt: number
): SpringState {
  const { tension, friction, mass } = config;
  const displacement = state.value - target;
  const springForce = -tension * displacement;
  const dampingForce = -friction * state.velocity;
  const acceleration = (springForce + dampingForce) / mass;

  const dtSec = dt / 1000;
  const newVelocity = state.velocity + acceleration * dtSec;
  const newValue = state.value + newVelocity * dtSec;

  return { value: newValue, velocity: newVelocity };
}

function isSettled(state: SpringState, target: number, precision: number): boolean {
  return Math.abs(state.value - target) < precision && Math.abs(state.velocity) < precision;
}

/**
 * Run a spring animation via RAF.
 * Returns a cancel function.
 */
export function animateSpring(
  from: number,
  to: number,
  config: Partial<SpringConfig> = {},
  onUpdate: (value: number) => void,
  onComplete?: () => void
): () => void {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  let state: SpringState = { value: from, velocity: 0 };
  let lastTime = performance.now();
  let rafId: number;
  let cancelled = false;

  function step(now: number) {
    if (cancelled) return;
    const dt = Math.min(now - lastTime, 64);
    lastTime = now;

    state = stepSpring(state, to, fullConfig, dt);
    onUpdate(state.value);

    if (isSettled(state, to, fullConfig.precision)) {
      onUpdate(to);
      onComplete?.();
    } else {
      rafId = requestAnimationFrame(step);
    }
  }

  rafId = requestAnimationFrame(step);
  return () => { cancelled = true; cancelAnimationFrame(rafId); };
}

/**
 * Animate with an initial velocity (for fling gestures).
 */
export function flingSpring(
  from: number,
  to: number,
  initialVelocity: number,
  config: Partial<SpringConfig> = {},
  onUpdate: (value: number) => void,
  onComplete?: () => void
): () => void {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  let state: SpringState = { value: from, velocity: initialVelocity };
  let lastTime = performance.now();
  let rafId: number;
  let cancelled = false;

  function step(now: number) {
    if (cancelled) return;
    const dt = Math.min(now - lastTime, 64);
    lastTime = now;

    state = stepSpring(state, to, fullConfig, dt);
    onUpdate(state.value);

    if (isSettled(state, to, fullConfig.precision)) {
      onUpdate(to);
      onComplete?.();
    } else {
      rafId = requestAnimationFrame(step);
    }
  }

  rafId = requestAnimationFrame(step);
  return () => { cancelled = true; cancelAnimationFrame(rafId); };
}
