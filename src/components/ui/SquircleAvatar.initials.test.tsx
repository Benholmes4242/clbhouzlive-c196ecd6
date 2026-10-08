import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SquircleAvatar } from './SquircleAvatar';

const fallback = (c: HTMLElement) => c.querySelector('[data-avatar-fallback]') as HTMLElement;

describe('SquircleAvatar initials under a photo', () => {
  it('hides initials (still mounted) once the image has loaded', () => {
    const { container } = render(<SquircleAvatar size={32} src="https://x.test/a.png" alt="Ann Bee" />);
    const img = container.querySelector('img')!;
    fireEvent.load(img);
    expect(fallback(container)).toBeTruthy();
    expect(fallback(container).style.opacity).toBe('0');
  });

  it('shows initials with no candidates', () => {
    const { container } = render(<SquircleAvatar size={32} alt="Ann Bee" />);
    expect(fallback(container).style.opacity).toBe('1');
  });

  it('shows initials after every candidate errors', () => {
    const { container } = render(
      <SquircleAvatar size={32} srcCandidates={['https://x.test/a.png', 'https://x.test/b.png']} alt="Ann Bee" />,
    );
    for (let i = 0; i < 3; i++) {
      const img = container.querySelector('img');
      if (img) fireEvent.error(img);
    }
    expect(container.querySelector('img')).toBeNull();
    expect(fallback(container).style.opacity).toBe('1');
  });
});
