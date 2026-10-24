import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HolePhotoPicker } from '@/components/course-media-tab/HolePhotoPicker';
import { holeNumbers, selectableHole } from '@/lib/courseMedia/holePickerRules';

describe('MEDIA_ENGINE_1_R course-count picker', () => {
  it('nine-hole course renders exactly nine selectable holes', () => {
    render(<HolePhotoPicker holeCount={9} selectedHole={null} onSelect={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(9);
    expect(screen.getByRole('button', { name: 'Hole 9' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Hole 18' })).toBeNull();
  });
  it('every known hole is selectable; only holes outside the count are refused', () => {
    const selected: number[] = [];
    render(<HolePhotoPicker holeCount={9} selectedHole={null} onSelect={hole => selected.push(hole)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    expect(selected).toEqual([3, 4]);
    expect(selectableHole(3, 9)).toBe(true);
    expect(selectableHole(10, 9)).toBe(false);
  });
  it('does not turn an invalid count into eighteen', () => {
    expect(holeNumbers(0)).toEqual([]);
    expect(holeNumbers(Number.NaN)).toEqual([]);
  });
  it('a shown used hole explains the marker and remains selectable', () => {
    const selected: number[] = [];
    const { container } = render(<HolePhotoPicker holeCount={3} selectedHole={null} usedHoles={[2]} onSelect={hole => selected.push(hole)} />);
    expect(container.querySelector('p')).not.toBeNull();
    const button = screen.getByRole('button', { name: 'Hole 2' });
    expect(button).toHaveAttribute('data-state', 'used');
    expect(button).toBeEnabled(); fireEvent.click(button);
    expect(selected).toEqual([2]);
  });
  it('no used hole means no marker explanation', () => {
    const { container } = render(<HolePhotoPicker holeCount={3} selectedHole={null} onSelect={() => {}} />);
    expect(container.querySelector('p')).toBeNull();
  });
  it('used holes outside the shown list do not draw the explanation', () => {
    const { container } = render(<HolePhotoPicker holeCount={3} selectedHole={null} usedHoles={[9]} onSelect={() => {}} />);
    expect(container.querySelector('p')).toBeNull();
  });
});