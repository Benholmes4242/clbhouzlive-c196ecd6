/** Signed-off empty ruler: no thumb until set; taps and drags both commit. */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverallScrubber } from '../OverallScrubber';
const props = { caption: '', ariaLabel: 'Overall' };
function rail() {
  const slider = screen.getByRole('slider');
  vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 180 } as DOMRect);
  return slider;
}
function pointer(target: EventTarget, type: string, x: number) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'clientX', { value: x });
  fireEvent(target, event);
}
describe('OverallScrubber empty state', () => {
  it('renders a single em-dash, not skeleton-looking double hyphens', () => {
    render(<OverallScrubber value={null} onChange={() => {}} {...props} />);
    expect(screen.getByText('—')).toBeTruthy();
  });
  it('does not report a value to assistive tech when unscored', () => {
    render(<OverallScrubber value={null} onChange={() => {}} {...props} />);
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBeNull();
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('Not scored');
  });
  it('commits a ruler tap immediately without a ghost handle', () => {
    const onChange = vi.fn();
    const { container } = render(<OverallScrubber value={null} onChange={onChange} {...props} />);
    expect(container.querySelector('[data-score-thumb]')).toBeNull();
    pointer(rail(), 'pointerdown', 90);
    fireEvent.pointerUp(window);
    expect(onChange).toHaveBeenCalledWith(5.5);
  });
  it('commits when the pointer actually moves', () => {
    const onChange = vi.fn();
    render(<OverallScrubber value={null} onChange={onChange} {...props} />);
    pointer(rail(), 'pointerdown', 0);
    pointer(window, 'pointermove', 123);
    expect(onChange).toHaveBeenLastCalledWith(7.2);
  });
});
