/** One picker for single photographs and batches (never the known-hole path).
 * The parent owns course count. Never fetch or assume a count.
 * Every known hole is always selectable and drawn the same; there is no
 * used-hole treatment (BRIEF_HOLE_TAG_BATCH_V3).
 */
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { holeNumbers, selectableHole } from '@/lib/courseMedia/holePickerRules';

interface HolePhotoPickerProps {
  holeCount: number;
  /** Preserve sparse known-hole numbers and order from the analysis RPC. */
  knownHoleNumbers?: readonly number[];
  selectedHole: number | null;
  /** Disables every hole (the batch once nothing is left to tag). */
  disabled?: boolean;
  onSelect: (hole: number) => void;
}

export function HolePhotoPicker({ holeCount, knownHoleNumbers, selectedHole, disabled = false, onSelect }: HolePhotoPickerProps) {
  const numbers = knownHoleNumbers?.length === holeCount ? knownHoleNumbers : holeNumbers(holeCount);
  return (
    <div role="group" aria-label="Hole" className="grid grid-cols-6 gap-[6px]">
      {numbers.map(hole => {
        const available = knownHoleNumbers ? true : selectableHole(hole, holeCount);
        const selected = available && hole === selectedHole;
        return (
          <Button
            key={hole}
            variant="ghost"
            aria-label={`Hole ${hole}`}
            aria-pressed={selected}
            data-state={!available ? 'closed' : 'open'}
            disabled={!available || disabled}
            onClick={() => onSelect(hole)}
            className="aspect-square h-auto min-w-0 p-0 rounded-[9px] text-sm font-extrabold tabular-nums"
            style={{
              border: `1px ${available ? 'solid' : 'dashed'} ${selected ? A.INK : `color-mix(in srgb, ${A.INK} 12%, transparent)`}`,
              background: selected ? A.INK : 'transparent',
              color: selected ? A.CANVAS : A.BODY,
              opacity: available ? 1 : 0.18,
            }}
          >{hole}</Button>
        );
      })}
    </div>
  );
}
