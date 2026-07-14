/**
 * Resolves the element that actually owns document-level scrolling, at runtime.
 *
 * Our CSS puts `overflow-y: auto` on BOTH html and body (src/index.css). Which of
 * those is the real scroller is engine/mode-dependent (iOS Safari, Median WKWebView,
 * Android WebView can differ, and can change across WebView updates).
 * `document.scrollingElement` is the spec-defined answer to that ambiguity and stays
 * correct as the environment changes — so window-scrolled virtualised lists
 * (react-virtuoso `customScrollParent`) anchor to the right element everywhere.
 *
 * Returns an HTMLElement suitable for `customScrollParent`. Falls back defensively.
 */
export function getDocumentScrollParent(): HTMLElement | undefined {
  if (typeof document === 'undefined') return undefined;

  const el = document.scrollingElement as HTMLElement | null;
  if (el instanceof HTMLElement) return el;

  if (document.documentElement instanceof HTMLElement) return document.documentElement;
  if (document.body instanceof HTMLElement) return document.body;
  return undefined;
}

export type ScrollBehaviorLike = ScrollBehavior | 'instant';

function isScrollableY(element: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(element);
  const canScroll = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  return canScroll && element.scrollHeight > element.clientHeight;
}

/**
 * Resolve the real vertical scroll owner for a rendered element by walking up
 * from that element. This avoids assuming that document/window owns page scroll.
 */
export function getScrollAncestor(element: Element | null): HTMLElement | undefined {
  if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;

  let current = element?.parentElement ?? null;
  while (current) {
    if (isScrollableY(current)) return current;
    current = current.parentElement;
  }

  return getDocumentScrollParent();
}

/**
 * Resolve the primary page scroller when there is no target element to anchor
 * from. Prefer the first real scrollable element in DOM order, then fall back
 * to document.scrollingElement.
 */
export function getPrimaryScrollElement(): HTMLElement | undefined {
  if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;

  const root = document.body ?? document.documentElement;
  const candidates: HTMLElement[] = [];
  if (document.documentElement) candidates.push(document.documentElement);
  if (document.body) candidates.push(document.body);
  candidates.push(...Array.from(root.querySelectorAll<HTMLElement>('*')));

  return candidates.find(isScrollableY) ?? getDocumentScrollParent();
}

export function getPageScrollTop(): number {
  const scroller = getPrimaryScrollElement();
  return scroller?.scrollTop ?? window.scrollY ?? 0;
}

export function scrollPageToTop(behavior: ScrollBehaviorLike = 'auto') {
  const scroller = getPrimaryScrollElement();
  scroller?.scrollTo({ top: 0, left: 0, behavior: behavior as ScrollBehavior });
}

export function scrollPageTo(top: number, behavior: ScrollBehaviorLike = 'auto') {
  const scroller = getPrimaryScrollElement();
  scroller?.scrollTo({ top: Math.max(0, top), left: 0, behavior: behavior as ScrollBehavior });
}

export function scrollElementIntoView(
  element: Element,
  options: { offset?: number; behavior?: ScrollBehaviorLike } = {},
) {
  const scroller = getScrollAncestor(element);
  if (!scroller) return;

  const offset = options.offset ?? 0;
  const rowRect = element.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  const targetTop = scroller.scrollTop + rowRect.top - scrollerRect.top - offset;

  scroller.scrollTo({
    top: Math.max(0, targetTop),
    left: 0,
    behavior: (options.behavior ?? 'auto') as ScrollBehavior,
  });
}
