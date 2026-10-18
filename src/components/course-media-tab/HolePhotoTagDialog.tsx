import { useState } from 'react';
import { Check, Loader2, MoreVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { HolePhotoPicker } from './HolePhotoPicker';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

export function HolePhotoOutcome({ row }: { row: HolePhoto }) {
  const published = row.status === 'approved';
  const tone = published ? A.IMPROVED : A.AMBER;
  return <div role="status" className="flex items-center gap-2 rounded-lg p-3" style={{ border: `1px solid ${tone}`, background: `color-mix(in srgb, ${tone} 7%, transparent)` }}>
    {published ? <Check className="h-4 w-4 shrink-0" style={{ color: tone }} /> : <MoreVertical className="h-4 w-4 shrink-0" style={{ color: tone }} />}
    <p className="text-[11.5px] leading-[1.45]" style={{ color: A.MUTE }}>
      <strong style={{ color: A.INK }}>{published ? 'Published. ' : 'Waiting. '}</strong>
      {published ? 'Taken the day you posted a round here, so nobody needs to check it.' : 'The scorecard cannot vouch for this date, so a human will look. You can see it; nobody else can yet.'}
    </p>
  </div>;
}

export function HolePhotoTagDialog({ imageUrl, holeCount, knownHoleNumbers, usedHoles, pending, result, error, onClose, onSubmit }: {
  imageUrl: string; holeCount: number; knownHoleNumbers: readonly number[]; usedHoles: readonly number[]; pending: boolean;
  result: HolePhoto | null; error: string | null; onClose: () => void; onSubmit: (hole: number) => void;
}) {
  const [hole, setHole] = useState<number | null>(null);
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <DialogContent className="w-[calc(100%-32px)] max-w-sm rounded-lg p-4 gap-3" style={{ background: A.PANEL, color: A.INK }}>
      <DialogTitle className="tracking-normal">{result ? 'Photograph tagged' : 'Tag photograph'}</DialogTitle>
      <DialogDescription className="sr-only">Choose a hole for your photograph.</DialogDescription>
      <img src={imageUrl} alt="Your photograph" className="w-full max-h-40 object-contain rounded-lg" />
      {result ? <HolePhotoOutcome row={result} /> : <HolePhotoPicker holeCount={holeCount} knownHoleNumbers={knownHoleNumbers} selectedHole={hole} usedHoles={usedHoles} onSelect={setHole} />}
      {error && <p role="alert" className="text-sm" style={{ color: A.MUTE }}>{error}</p>}
      <Button variant="ghost" disabled={pending || (!result && hole == null)} className="w-full" style={{ background: A.INK, color: A.CANVAS }}
        onClick={() => { if (result) onClose(); else if (hole != null) onSubmit(hole); }}>
        {pending && <Loader2 className="animate-spin" />}{result ? 'Done' : pending ? 'Tagging' : 'Tag'}
      </Button>
      {!result && <Button variant="ghost" disabled={pending} onClick={onClose}>Cancel</Button>}
    </DialogContent>
  </Dialog>;
}