/** PF4 media editor filmstrip. Padding contains the full selected outline;
 * arrow reordering retains the existing live composer state ownership. */
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { MAX_MEDIA, type StageMediaItem } from '../hooks/useStageComposer';
import SlideThumb from './SlideThumb';
import './golf/composerGolf.css';

interface Props {
  media: StageMediaItem[]; activeIndex: number; onSelect: (i: number) => void;
  onRemove: (i: number) => void; onReorder: (from: number, to: number) => void;
  onAddFiles: (files: File[]) => void | Promise<void>;
}
export default function MediaTray({ media, activeIndex, onSelect, onRemove, onReorder, onAddFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <div className="pf4-filmstrip">
    <div className="pf4-filmstrip-scroll" role="listbox" aria-label="Album order">
      {media.map((m, i) => <div key={m.id} role="option" aria-selected={i === activeIndex} aria-label={`Shot ${i + 1}`} tabIndex={0} className="pf4-filmstrip-tile" onClick={() => onSelect(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(i); } }}>
        <div className="pf4-filmstrip-image"><SlideThumb item={m}/></div>
        <span className="pf4-filmstrip-number">{i + 1}</span>
        <Button variant="ghost" className="pf4-filmstrip-remove" aria-label="Remove" onClick={e => { e.stopPropagation(); onRemove(i); }}><X size={12}/></Button>
      </div>)}
      <Button variant="ghost" className="pf4-filmstrip-add" aria-label="Add photos or video" onClick={() => inputRef.current?.click()}>+</Button>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={async e => { const input = e.currentTarget; const files = Array.from(input.files ?? []); if (media.length + files.length > MAX_MEDIA) toast('Posts carry up to 10 photos or clips.'); await onAddFiles(files); input.value = ''; }}/>
    </div>
    <div className="pf4-filmstrip-order"><p>Tap a shot, then move it. This is the album order.</p>
      <Button variant="ghost" className="pf4-filmstrip-arrow" aria-label="Move left" disabled={activeIndex === 0} onClick={() => onReorder(activeIndex, activeIndex - 1)}><ChevronLeft/></Button>
      <Button variant="ghost" className="pf4-filmstrip-arrow" aria-label="Move right" disabled={activeIndex >= media.length - 1} onClick={() => onReorder(activeIndex, activeIndex + 1)}><ChevronRight/></Button>
    </div>
  </div>;
}