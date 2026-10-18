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
  it('holes below the floor cannot be selected and the floor itself can', () => {
    const selected: number[] = [];
    render(<HolePhotoPicker holeCount={9} floor={4} selectedHole={null} onSelect={hole => selected.push(hole)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    expect(selected).toEqual([4]);
    expect(selectableHole(3, 9, 4)).toBe(false);
  });
  it('does not turn an invalid count into eighteen', () => {
    expect(holeNumbers(0)).toEqual([]);
    expect(holeNumbers(Number.NaN)).toEqual([]);
  });
});