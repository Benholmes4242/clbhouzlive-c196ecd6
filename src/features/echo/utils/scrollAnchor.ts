/**
 * Scroll anchor preservation utilities
 * Prevents visual jumps when prepending content (e.g., "Load older messages")
 */

export type AnchorSnapshot = {
  anchorId: string | null;
  anchorTop: number;
};

/**
 * Capture the topmost visible item as an anchor
 */
export function takeTopAnchorSnapshot(container: HTMLElement): AnchorSnapshot {
  // Find first message that is at/near the top
  const children = Array.from(container.querySelectorAll<HTMLElement>('[data-msg-id]'));
  const top = container.scrollTop;
  let best: HTMLElement | null = null;
  let bestDelta = Infinity;

  for (const el of children) {
    const delta = Math.abs(el.offsetTop - top);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = el;
    }
  }
  
  return {
    anchorId: best?.dataset.msgId ?? null,
    anchorTop: best?.offsetTop ?? 0,
  };
}

/**
 * Restore scroll position so anchored item stays in the same visual position
 */
export function restoreTopAnchor(container: HTMLElement, snap: AnchorSnapshot) {
  if (!snap.anchorId) return;
  const el = container.querySelector<HTMLElement>(`[data-msg-id="${snap.anchorId}"]`);
  if (!el) return;
  const delta = el.offsetTop - snap.anchorTop;
  // Shift the scroll so the same element remains at the same visual position
  container.scrollTop += delta;
}
