/**
 * THE PAGE SCROLLER IS #root.
 *
 * Measured on device and in Chromium (Sep 2026): body is overflow-y:hidden,
 * #root carries the page's scrollHeight, window.scrollY never leaves 0. The
 * resolver must say #root by definition - including when the page is SHORTER
 * than the viewport, which is when the old "scrollHeight > clientHeight" test
 * handed back the wrong element (an open sheet, a horizontal rail).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getPrimaryScrollElement,
  getDocumentScrollParent,
  getPageScrollTop,
  __resetScrollerCache,
} from '@/lib/getScrollParent';

function mountRoot(overflowY: string) {
  document.body.innerHTML = '';
  const root = document.createElement('div');
  root.id = 'root';
  root.style.overflowY = overflowY;
  root.style.height = '400px';
  document.body.appendChild(root);
  return root;
}

describe('page scroller resolution', () => {
  beforeEach(() => {
    __resetScrollerCache();
  });
  afterEach(() => {
    document.body.innerHTML = '';
    __resetScrollerCache();
  });

  it('returns #root when #root is the scroll container', () => {
    const root = mountRoot('auto');
    const tall = document.createElement('div');
    tall.style.height = '4000px';
    root.appendChild(tall);
    expect(getPrimaryScrollElement()).toBe(root);
    expect(getDocumentScrollParent()).toBe(root);
  });

  it('returns #root even when its content is shorter than its height', () => {
    const root = mountRoot('auto');
    const short = document.createElement('div');
    short.style.height = '10px';
    root.appendChild(short);
    expect(getPrimaryScrollElement()).toBe(root);
  });

  it('is not fooled by an earlier scrollable element in document order', () => {
    const root = mountRoot('auto');
    const sheet = document.createElement('div');
    sheet.style.overflowY = 'scroll';
    document.body.insertBefore(sheet, root);
    expect(getPrimaryScrollElement()).toBe(root);
  });

  it('falls back to the scrolling element when #root is not a scroll container', () => {
    mountRoot('visible');
    const resolved = getPrimaryScrollElement();
    expect(resolved).not.toBeNull();
    expect(resolved?.id).not.toBe('root');
  });

  it('re-resolves once the cached node is disconnected', () => {
    const first = mountRoot('auto');
    expect(getPrimaryScrollElement()).toBe(first);
    const second = mountRoot('auto');
    expect(second).not.toBe(first);
    expect(getPrimaryScrollElement()).toBe(second);
  });

  it('reads scrollTop off the page scroller, never window.scrollY', () => {
    const root = mountRoot('auto');
    Object.defineProperty(root, 'scrollTop', { value: 812, configurable: true });
    expect(getPageScrollTop()).toBe(812);
  });
});

/**
 * ShellSlot's "scrolled past 4px" shadow read window.scrollY and listened on
 * window, so it never appeared. It listens on the page scroller now.
 */
describe('ShellSlot shadow follows the page scroller', () => {
  beforeEach(() => __resetScrollerCache());
  afterEach(() => {
    document.body.innerHTML = '';
    __resetScrollerCache();
  });

  it('turns the shadow on when #root scrolls past 4px', async () => {
    const { render, act } = await import('@testing-library/react');
    const React = (await import('react')).default;
    const { ShellSlot } = await import('@/components/header/ShellSlot');

    const root = mountRoot('auto');
    render(React.createElement(ShellSlot, { dark: true, children: 'tabs' }), { container: root });

    const band = root.querySelector('[data-chrome="shell-slot"]') as HTMLElement;
    expect(band.style.boxShadow).toBe('none');

    Object.defineProperty(root, 'scrollTop', { value: 120, configurable: true });
    await act(async () => {
      root.dispatchEvent(new Event('scroll'));
    });
    expect(band.style.boxShadow).not.toBe('none');
  });
});
