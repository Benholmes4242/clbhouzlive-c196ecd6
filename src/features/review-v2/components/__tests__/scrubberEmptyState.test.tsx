/**
 * The unset scrubber: a solid handle that a TAP must not turn into a 1.0.
 *
 * The handle now looks identical whether or not the course has been scored, so
 * the only thing standing between a stray tap and a silently-recorded 1.0 is
 * the "commit on move, never on down" rule. That rule gets a test.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverallScrubber } from '../OverallScrubber';

const props = {
  caption: '',
  ariaLabel: 'Overall',
  bandLabels: { low: 'POOR', mid: 'GOOD', high: 'GREAT' },
};

describe('OverallScrubber empty state', () => {
  it('renders a single em-dash, not skeleton-looking double hyphens', () => {
    render(<OverallScrubber value={null} onChange={() => {}} {...props} />);
    expect(screen.getByText('\u2014')).toBeTruthy();
  });

  it('does not report a value to assistive tech when unscored', () => {
    render(<OverallScrubber value={null} onChange={() => {}} {...props} />);
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuenow')).toBeNull();
    expect(slider.getAttribute('aria-valuetext')).toBe('Not scored');
  });

  it('leaves the scrubber null when the handle is tapped without movement', () => {
    const onChange = vi.fn();
    const { container } = render(
      <OverallScrubber value={null} onChange={onChange} {...props} />,
    );
    // The handle is the last absolutely-positioned child of the track.
    const handle = container.querySelectorAll('[aria-hidden]');
    const target = handle[handle.length - 1] as HTMLElement;
    fireEvent.pointerDown(target, { clientX: 10 });
    fireEvent.pointerUp(window);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('commits when the pointer actually moves', () => {
    const onChange = vi.fn();
    const { container } = render(
      <OverallScrubber value={null} onChange={onChange} {...props} />,
    );
    const nodes = container.querySelectorAll('[aria-hidden]');
    const target = nodes[nodes.length - 1] as HTMLElement;
    fireEvent.pointerDown(target, { clientX: 10 });
    fireEvent.pointerMove(window, { clientX: 120 });
    expect(onChange).toHaveBeenCalled();
  });
});
