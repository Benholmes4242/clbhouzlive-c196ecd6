/** Shared search presentation and sizing. Review mode preserves its no-focus,
 * undocked behaviour. Club mode differs only by autofocus and results above the field;
 * neither mode passes a keyboard offset (the native webview already resizes). The first typed character holds the measured content height until
 * clear/close; the shared BottomSheet still owns viewport/headroom constraints. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/features/post-v2/components/BottomSheet';
import './review-course-search.css';

interface Props {
  open: boolean; onClose: () => void; mode?: 'review' | 'club';
  title: string; closeLabel: string; clearLabel: string; placeholder: string;
  query: string; onQueryChange: (value: string) => void; children: ReactNode;
  testId?: string;
}
export default function KeyboardSearchSheet(p: Props) {
  const club = p.mode === 'club';
  const content = useRef<HTMLDivElement>(null);
  const [heldHeight, setHeldHeight] = useState<number | null>(null);
  useEffect(() => { if (!p.open || !p.query.length) setHeldHeight(null); }, [p.open, p.query]);
  const change = (next: string) => {
    if (!next.length) setHeldHeight(null);
    else if (!p.query.length) setHeldHeight(content.current?.getBoundingClientRect().height ?? null);
    p.onQueryChange(next);
  };
  return <BottomSheet open={p.open} onClose={p.onClose} surfaceClassName="post-or-review-surface">
    <div ref={content} className="rcs" data-mode={club ? 'club' : 'review'} data-testid={p.testId} style={{ minHeight: heldHeight ?? undefined }}>
      <header className="rcs-head"><h1>{p.title}</h1><Button variant="ghost" size="icon" className="rcs-close" aria-label={p.closeLabel} onClick={p.onClose}><X size={17} strokeWidth={2.2} /></Button></header>
      <label className="rcs-field" data-filled={p.query.length > 0}>
        <Search size={18} aria-hidden="true" />
        <input type="search" value={p.query} onChange={e => change(e.target.value)} placeholder={p.placeholder} aria-label={p.placeholder} autoFocus={club} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search" />
        {p.query.length > 0 && <Button variant="ghost" size="icon" className="rcs-clear" aria-label={p.clearLabel} onClick={() => change('')}><X size={16} /></Button>}
      </label>
      <div className="rcs-content">{p.children}</div>
    </div>
  </BottomSheet>;
}