import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { HybridPhotoFrame } from '@/features/tourhub/components/overview-v3/HybridPhotoFrame';

afterEach(cleanup);

describe('Hybrid overview photo navigation', () => {
  it.each(['live', 'recap'])('%s: band click and Enter each open once', stateKey => {
    const onOpen = vi.fn();
    const { getByRole } = render(<HybridPhotoFrame title="Test event" kicker="" image={null} stateKey={stateKey} onOpen={onOpen} />);
    const band = getByRole('button', { name: 'Test event' });
    expect(band.getAttribute('tabindex')).toBe('0');
    fireEvent.click(band);
    expect(onOpen).toHaveBeenCalledTimes(1);
    onOpen.mockClear();
    fireEvent.keyDown(band, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledTimes(1);
    onOpen.mockClear();
    expect(fireEvent.keyDown(band, { key: ' ', cancelable: true })).toBe(false);
    expect(onOpen).toHaveBeenCalledTimes(1);
    onOpen.mockClear();
    fireEvent.click(getByRole('heading', { name: 'Test event' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});