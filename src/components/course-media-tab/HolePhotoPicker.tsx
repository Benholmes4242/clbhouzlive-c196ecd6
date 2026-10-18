/** One picker for single photographs and the future monotonic-floor flow.
 * The parent owns course count and used holes. Never fetch or assume a count.
 */
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { holeNumbers, selectableHole } from '@/lib/courseMedia/holePickerRules';

interface HolePhotoPickerProps {
  holeCount: number;
  floor?: number;
  selectedHole: number | null;
  usedHoles?: readonly number[];
  onSelect: (hole: number) => void;
}

export function HolePhotoPicker({ holeCount, floor = 0, selectedHole, usedHoles = [], onSelect }: HolePhotoPickerProps) {
  return (
    <div role="group" aria-label="Hole" className="grid grid-cols-6 gap-[6px]">
      {holeNumbers(holeCount).map(hole => {
        const available = selectableHole(hole, holeCount, floor);
        const selected = hole === selectedHole;
        const used = usedHoles.includes(hole);
        return (
          <Button
            key={hole}
            variant="ghost"
            aria-label={`Hole ${hole}`}
            aria-pressed={selected}
            disabled={!available}
            onClick={() => onSelect(hole)}
            className="aspect-square h-auto min-w-0 p-0 rounded-[9px] text-sm font-extrabold tabular-nums"
            style={{
              border: `1px ${available ? 'solid' : 'dashed'} ${selected ? A.INK : used ? A.IMPROVED : A.BORDER}`,
              background: selected ? A.INK : 'transparent',
              color: selected ? A.CANVAS : used ? A.IMPROVED : A.BODY,
              opacity: available ? 1 : 0.18,
            }}
          >{hole}</Button>
        );
      })}
    </div>
  );
}