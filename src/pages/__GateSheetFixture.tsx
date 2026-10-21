// TEMPORARY CB14 fixture — renders the gate with the sheet open for a
// screenshot. Deleted after capture; never shipped.
import { useState } from 'react';
import { RoundsGate } from '@/features/explore-magazine/RoundsGate';

export default function GateSheetFixture() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
      <RoundsGate>
        <div style={{ height: 600, padding: 20, color: '#fff' }}>fixture rows</div>
      </RoundsGate>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: 8, left: 8, zIndex: 9999, fontSize: 10, opacity: 0.4 }}
      >
        open sheet
      </button>
      {/* Drive the real sheet through the card's own entrypoint instead: */}
      <SheetOpener open={open} />
    </div>
  );
}

function SheetOpener({ open }: { open: boolean }) {
  // Click the card's "I don't have a handicap" button once mounted so the
  // real GateSheet opens through its real path.
  if (open) {
    setTimeout(() => {
      const btns = [...document.querySelectorAll('[data-rounds-gate-card] button')];
      (btns[1] as HTMLButtonElement | undefined)?.click();
    }, 50);
  }
  return null;
}
