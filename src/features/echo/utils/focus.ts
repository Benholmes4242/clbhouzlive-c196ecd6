/**
 * Focus utilities for keyboard navigation
 */

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function isTypingTarget(el: Element | null) {
  if (!el) return false;
  const tag = (el as HTMLElement).tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}

export function readHashIndex(): number | null {
  const m = location.hash.match(/(?:^|#|&)idx=(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function writeHashIndex(idx: number) {
  const url = new URL(location.href);
  const params = new URLSearchParams(url.hash.replace(/^#/, ''));
  params.set('idx', String(idx));
  url.hash = params.toString();
  history.replaceState(null, '', url.toString());
}
