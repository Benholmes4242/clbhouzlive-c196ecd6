/**
 * THE PAGE SCROLLER IS `#root`, BY DEFINITION.
 *
 * Measured (Sep 2026, every route: /amateur, /clubhouse, /handicap, /auth, /media):
 *   body      overflow-y: hidden   scrollHeight === clientHeight
 *   html      overflow-y: auto     scrollHeight === clientHeight (never overflows)
 *   #root     overflow-y: auto     owns the page's scrollHeight
 *   window.scrollY === 0 always, document.scrollingElement === <html>
 *
 * `#root` gets `height: 100dvh` (index.css @layer base) and `overflow-x: hidden`
 * (index.css "prevent rubber-band overscroll gaps"), and CSS computes the other
 * axis of a `hidden` pair to `auto` — so it is the scroll container on every
 * route. No route scrolls a different element at page level; the light routes
 * mentioned in useScrollDirective's comment resolve to `#root` too (body is
 * hidden there as well).
 *
 * This resolver is therefore a getElementById plus a cache, never a DOM scan:
 * AppHeader reads it inside a rAF scroll handler, and the previous
 * `querySelectorAll('*')` scan ran over the whole feed on every frame and could
 * return an open sheet or a rail when `#root` was not currently overflowing.
 */

const PAGE_SCROLLER_ID = 'root';

let cachedScroller: HTMLElement | null = null;

function isScrollContainerY(element: HTMLElement): boolean {
  /* Deliberately NOT scrollHeight > clientHeight: a page shorter than the
     viewport is still the scroller, and asking about overflow mid-drag would
     hand back a different element. */
  const { overflowY } = window.getComputedStyle(element);
  return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
}

/**
 * Resolves the element that owns document-level scrolling. `#root` when it is a
 * scroll container, else `document.scrollingElement`. Cached; re-resolved only
 * when the cached node leaves the document.
 */
export function getDocumentScrollParent(): HTMLElement | undefined {
  if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;

  if (cachedScroller && cachedScroller.isConnected) return cachedScroller;
  cachedScroller = null;

  const root = document.getElementById(PAGE_SCROLLER_ID);
  if (root instanceof HTMLElement && isScrollContainerY(root)) {
    cachedScroller = root;
    return root;
  }

  const el = document.scrollingElement as HTMLElement | null;
  if (el instanceof HTMLElement) {
    cachedScroller = el;
    return el;
  }

  if (document.documentElement instanceof HTMLElement) return document.documentElement;
  if (document.body instanceof HTMLElement) return document.body;
  return undefined;
}

/** Test seam: drop the cached scroller (the app never needs this). */
export function __resetScrollerCache() {
  cachedScroller = null;
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
 * The primary page scroller. Same node as getDocumentScrollParent — kept as its
 * own name because listeners read as "the page scroller", not "the document".
 */
export function getPrimaryScrollElement(): HTMLElement | undefined {
  return getDocumentScrollParent();
}

export function getPageScrollTop(): number {
  const scroller = getPrimaryScrollElement();
  return scroller?.scrollTop ?? 0;
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
