/**
 * PlayerInitialAvatar loading shimmer — while a headshot candidate is in
 * flight the avatar shows the rail skeleton's shimmer tile (clb-shimmer-dark)
 * with the img at opacity 0, no initials and no ring; onLoad fades the image
 * in; onError walks to the next candidate with the shimmer still up; exhausted
 * candidates show the initials fallback; an already-complete (cached) image
 * shows straight away.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { PlayerInitialAvatar } from '@/features/tourhub/_shared/PlayerInitialAvatar';

const CANDIDATES = [
  'https://cdn.example.com/pga/m-green.jpg',
  'https://cdn.example.com/lpga/m-green.jpg',
];

function mount(props: Partial<Parameters<typeof PlayerInitialAvatar>[0]> = {}) {
  return render(
    <PlayerInitialAvatar name="M Green" size={64} srcCandidates={CANDIDATES} {...props} />,
  );
}

const img = () => document.querySelector('img');
const shimmer = () => document.querySelector('.clb-shimmer-dark');
const outer = () => document.querySelector('[aria-label="M Green"]') as HTMLElement;

afterEach(cleanup);

describe('PlayerInitialAvatar loading shimmer', () => {
  it('while a candidate is loading: shimmer, no initials, img at opacity 0, no ring', () => {
    mount();
    expect(shimmer()).not.toBeNull();
    expect(img()!.style.opacity).toBe('0');
    expect(img()!.getAttribute('src')).toBe(CANDIDATES[0]);
    expect(outer().textContent).toBe(''); // no initials
    expect(outer().childElementCount).toBe(1); // ring hidden while the shimmer shows
  });

  it('an error moves to the next candidate with the shimmer still showing', () => {
    mount();
    fireEvent.error(img()!);
    expect(img()!.getAttribute('src')).toBe(CANDIDATES[1]);
    expect(img()!.style.opacity).toBe('0');
    expect(shimmer()).not.toBeNull();
    expect(outer().textContent).toBe('');
  });

  it('load fades the image in and removes the shimmer, with the ring back', () => {
    mount();
    fireEvent.load(img()!);
    expect(shimmer()).toBeNull();
    expect(img()!.style.opacity).toBe('1');
    expect(img()!.style.transition).toBe('opacity 180ms ease-out');
    expect(outer().childElementCount).toBe(2); // ring restored
  });

  it('when every candidate is exhausted the initials show, with no shimmer', () => {
    mount();
    fireEvent.error(img()!);
    fireEvent.error(img()!);
    expect(img()).toBeNull();
    expect(shimmer()).toBeNull();
    expect(outer().textContent).toBe('MG');
    expect(outer().childElementCount).toBe(2); // ring on the initials fallback
  });

  it('shows initials without shimmer when there are no candidates at all', () => {
    mount({ srcCandidates: [] });
    expect(img()).toBeNull();
    expect(shimmer()).toBeNull();
    expect(outer().textContent).toBe('MG');
  });

  it('an already-complete cached image shows straight away, never behind the shimmer', () => {
    const complete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete');
    const natural = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth');
    Object.defineProperty(HTMLImageElement.prototype, 'complete', { configurable: true, get: () => true });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => 200 });
    try {
      mount();
      expect(shimmer()).toBeNull();
      expect(img()!.style.opacity).toBe('1');
    } finally {
      if (complete) Object.defineProperty(HTMLImageElement.prototype, 'complete', complete);
      if (natural) Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', natural);
    }
  });

  it('a complete image with naturalWidth 0 is treated as an error', () => {
    const complete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete');
    const natural = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth');
    Object.defineProperty(HTMLImageElement.prototype, 'complete', { configurable: true, get: () => true });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => 0 });
    try {
      mount();
      // Both candidates fail the cached check, so the initials fallback shows.
      expect(img()).toBeNull();
      expect(shimmer()).toBeNull();
      expect(outer().textContent).toBe('MG');
    } finally {
      if (complete) Object.defineProperty(HTMLImageElement.prototype, 'complete', complete);
      if (natural) Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', natural);
    }
  });
});
