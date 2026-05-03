import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const INK = '#0F172A';
const INK_70 = 'rgba(15,23,42,0.70)';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const AMBER_DEEP = '#C97211';
const GREEN = '#059669';
const RED = '#9F1D1D';

interface Props {
  open: boolean;
  onClose: () => void;
  maxDiff: number;
  avgDiff: number;
}

interface BlockProps {
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  body: React.ReactNode;
}

const ExplainerBlock: React.FC<BlockProps> = ({ eyebrow, eyebrowColor, title, body }) => (
  <div>
    <div style={{
      fontSize: 9, fontWeight: 800, color: eyebrowColor,
      letterSpacing: '0.22em', marginBottom: 4,
    }}>
      {eyebrow}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 6 }}>
      {title}
    </div>
    <div style={{ fontSize: 13, color: INK_70, lineHeight: 1.5 }}>
      {body}
    </div>
  </div>
);

const HandicapExplainerSheet: React.FC<Props> = ({ open, onClose, maxDiff, avgDiff }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
          zIndex: 9998, animation: 'fadeIn 200ms ease',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          margin: '0 auto', width: '100%', maxWidth: 420,
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px',
          zIndex: 9999,
          animation: 'slideUp 280ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          boxShadow: '0 -8px 32px rgba(15,23,42,0.18)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, background: INK_10, borderRadius: 2,
          margin: '0 auto 16px',
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 28, height: 28, borderRadius: '50%',
            background: INK_06, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={14} color={INK} strokeWidth={2.4} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 4 }}>
          <ExplainerBlock
            eyebrow="DIFFERENTIAL"
            eyebrowColor={AMBER_DEEP}
            title="What each round contributes"
            body="A differential is the score you'd have shot on a course of standard difficulty. A lower differential is a better round. It accounts for slope and rating so a 78 at a hard course can be worth more than a 78 at an easy one."
          />

          <ExplainerBlock
            eyebrow="ROUNDS THAT COUNT"
            eyebrowColor={GREEN}
            title="Why these 8?"
            body="The handicap system looks at your last 20 rounds, picks the 8 lowest differentials, and uses those to calculate your index. Your worst rounds don't drag you down — only your best 8 matter."
          />

          <ExplainerBlock
            eyebrow="HOW IT MOVES"
            eyebrowColor={INK}
            title="Cuts, holds, and rises"
            body={
              <>
                Shoot a differential lower than your{' '}
                <strong style={{ color: GREEN, fontWeight: 700 }}>
                  worst counter (+{maxDiff.toFixed(1)})
                </strong>{' '}
                and your handicap drops. Anything between your best and worst counters leaves it where it is. If your scoring drifts above your{' '}
                <strong style={{ color: RED, fontWeight: 700 }}>
                  counter average (+{avgDiff.toFixed(1)})
                </strong>{' '}
                for a stretch, your handicap can creep up over time as good counters age out.
              </>
            }
          />
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>
      </div>
    </>
  );
};

export default HandicapExplainerSheet;
