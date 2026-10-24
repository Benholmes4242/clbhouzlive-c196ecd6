/** One picker for single photographs and batches (never the known-hole path).
 * The parent owns course count and used holes. Never fetch or assume a count.
 * Every known hole is always selectable; used holes are marked, never closed.
 */
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { holeNumbers, selectableHole } from '@/lib/courseMedia/holePickerRules';

interface HolePhotoPickerProps {
  holeCount: number;
  /** Preserve sparse known-hole numbers and order from the analysis RPC. */
  knownHoleNumbers?: readonly number[];
  selectedHole: number | null;
  usedHoles?: readonly number[];
  onSelect: (hole: number) => void;
}

export function HolePhotoPicker({ holeCount, knownHoleNumbers, selectedHole, usedHoles = [], onSelect }: HolePhotoPickerProps) {
  const numbers = knownHoleNumbers?.length === holeCount ? knownHoleNumbers : holeNumbers(holeCount);
  const hasUsedHole = numbers.some(hole => usedHoles.includes(hole) && (knownHoleNumbers ? true : selectableHole(hole, holeCount)));
  return (
    <div role="group" aria-label="Hole" className="grid grid-cols-6 gap-[6px]">
      {numbers.map(hole => {
        const available = knownHoleNumbers ? true : selectableHole(hole, holeCount);
        const selected = available && hole === selectedHole;
        const used = available && usedHoles.includes(hole);
        return (
          <Button
            key={hole}
            variant="ghost"
            aria-label={`Hole ${hole}`}
            aria-pressed={selected}
            data-state={!available ? 'closed' : used ? 'used' : 'open'}
            disabled={!available}
            onClick={() => onSelect(hole)}
            className="aspect-square h-auto min-w-0 p-0 rounded-[9px] text-sm font-extrabold tabular-nums"
            style={{
              border: `1px ${available ? 'solid' : 'dashed'} ${selected ? A.INK : used ? A.IMPROVED : `color-mix(in srgb, ${A.INK} 12%, transparent)`}`,
              background: selected ? A.INK : 'transparent',
              color: selected ? A.CANVAS : used ? A.IMPROVED : A.BODY,
              opacity: available ? 1 : 0.18,
            }}
          >{hole}</Button>
        );
      })}
      {hasUsedHole && <p className="col-span-full mt-1 text-[12px] leading-normal" style={{ color: A.DIM }}>
        <span aria-hidden="true" className="inline-block size-2 mr-1.5" style={{ background: A.IMPROVED }} />
        You've already tagged a photo or video here. You can add more.
      </p>}
    </div>
  );
}
