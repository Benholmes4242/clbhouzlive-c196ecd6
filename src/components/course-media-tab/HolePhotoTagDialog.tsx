import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { HolePhotoPicker } from './HolePhotoPicker';

export function HolePhotoTagDialog({ imageUrl, imageOptions, onImageChange, initialHole = null, holeCount, knownHoleNumbers, usedHoles, pending, error, onClose, onSubmit }: {
  imageUrl: string; imageOptions?: readonly string[]; onImageChange?: (url: string) => void; initialHole?: number | null;
  holeCount: number; knownHoleNumbers: readonly number[]; usedHoles: readonly number[]; pending: boolean;
  error: string | null; onClose: () => void; onSubmit: (hole: number) => void;
}) {
  const [hole, setHole] = useState<number | null>(initialHole);
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <DialogContent className="w-[calc(100%-32px)] max-w-sm rounded-lg p-4 gap-3" style={{ background: A.PANEL, color: A.INK }}>
      <DialogTitle className="tracking-normal">Tag a hole</DialogTitle>
      <DialogDescription className="sr-only">Choose a hole for your photograph.</DialogDescription>
      {imageUrl && <img src={imageUrl} alt="Your photograph" className="w-full max-h-40 object-contain rounded-lg" />}
      {imageOptions && imageOptions.length > 1 && <div className="grid grid-cols-4 gap-1">{imageOptions.map(url => <Button key={url} variant="ghost" aria-label="Choose photograph" aria-pressed={url === imageUrl} disabled={pending} className="aspect-square h-auto p-0 overflow-hidden rounded-lg" onClick={() => onImageChange?.(url)}><img src={url} alt="Your photograph" className="w-full h-full object-cover" /></Button>)}</div>}
      <HolePhotoPicker holeCount={holeCount} knownHoleNumbers={knownHoleNumbers} selectedHole={hole} usedHoles={usedHoles} onSelect={value => { if (!pending && imageUrl) { setHole(value); onSubmit(value); } }} />
      {error && <p role="alert" className="text-sm" style={{ color: A.MUTE }}>{error}</p>}
      <Button variant="ghost" disabled={pending} onClick={onClose}>Cancel</Button>
    </DialogContent>
  </Dialog>;
}