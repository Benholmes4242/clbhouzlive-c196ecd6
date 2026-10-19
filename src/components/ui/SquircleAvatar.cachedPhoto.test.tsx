import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { SquircleAvatar } from './SquircleAvatar';

const A = 'https://avatar.test/a.png';
const B = 'https://avatar.test/b.png';
const C = 'https://avatar.test/c.png';
const D = 'https://avatar.test/d.png';
const decoded = new Set<string>();

beforeEach(() => {
  decoded.clear();
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockImplementation(function (this: HTMLImageElement) {
    return decoded.has(this.src);
  });
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockImplementation(function (this: HTMLImageElement) {
    return decoded.has(this.src) ? 100 : 0;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SquircleAvatar cached candidate photo', () => {
  it('keeps the decoded first photo visible when later candidates reorder', () => {
    const { getByRole, rerender } = render(<SquircleAvatar srcCandidates={[A, B, C]} alt="Player" />);
    const img = getByRole('img') as HTMLImageElement;
    decoded.add(A);
    fireEvent.load(img);
    expect(img.style.opacity).toBe('1');

    rerender(<SquircleAvatar srcCandidates={[A, C, B]} alt="Player" />);

    expect(getByRole('img')).toBe(img);
    expect(img.getAttribute('src')).toBe(A);
    expect(img.style.opacity).toBe('1');
  });

  it('keeps a different first photo hidden until that photo loads', () => {
    const { getByRole, rerender } = render(<SquircleAvatar srcCandidates={[A, B, C]} alt="Player" />);
    const img = getByRole('img') as HTMLImageElement;
    decoded.add(A);
    fireEvent.load(img);
    expect(img.style.opacity).toBe('1');

    rerender(<SquircleAvatar srcCandidates={[D, A]} alt="Player" />);

    expect(getByRole('img')).toBe(img);
    expect(img.getAttribute('src')).toBe(D);
    expect(img.style.opacity).toBe('0');
    decoded.add(D);
    fireEvent.load(img);
    expect(img.style.opacity).toBe('1');
  });
});