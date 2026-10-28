import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SquircleAvatar } from './SquircleAvatar';

afterEach(cleanup);

describe('SquircleAvatar explicit ring width', () => {
  it('preserves the existing standard 2px ring when ringWidth is omitted', () => {
    const { container } = render(<SquircleAvatar size={36} alt="Ben" ringColor="#F7931E" />);
    const ring = container.firstElementChild?.firstElementChild as HTMLElement | null;
    expect(ring?.style.borderWidth).toBe('2px');
  });
  it('uses the supplied 1.5px ring width', () => {
    const { container } = render(<SquircleAvatar size={36} alt="Ben" ringColor="#F7931E" ringWidth={1.5} />);
    const ring = container.firstElementChild?.firstElementChild as HTMLElement | null;
    expect(ring?.style.borderWidth).toBe('1.5px');
  });
});