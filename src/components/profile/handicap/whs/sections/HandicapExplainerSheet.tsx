import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { fmtDiff } from '@/lib/whs/format';

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
  currentHandicap: number;
  cutTarget: number | null;
  settleAt: number | null;
  isAtRisk: boolean;
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

const HandicapExplainerSheet: React.FC<Props> = ({
  open,
  onClose,
  currentHandicap,
  cutTarget,
  settleAt,
  isAtRisk,
}) => {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);

    // Position-fixed scroll lock — works correctly on iOS Safari and
    // Android WebView. Captures the scroll position before locking,
    // restores it after closing. Pattern matches src/components/courses/
    // review-wizard/ReviewWizard.tsx.
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
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
        <div style={{
          width: 36, height: 4, background: INK_10, borderRadius: 2,
          margin: '0 auto 16px',
        }} />

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 4 }}>
          <div>
            <h2 style={{
              fontSize: 19, fontWeight: 700, color: INK,
              margin: 0, marginBottom: 4, letterSpacing: '-0.01em',
            }}>
              How your handicap moves
            </h2>
            <p style={{ fontSize: 13, color: INK_55, margin: 0 }}>
              The system is more forgiving than people think — here's why.
            </p>
          </div>

          <ExplainerBlock
            eyebrow="STEP 1"
            eyebrowColor={AMBER_DEEP}
            title="Your last 20 rounds"
            body="Every time you play a counted round, the system keeps the most recent 20. The oldest round drops off automatically."
          />

          <ExplainerBlock
            eyebrow="STEP 2"
            eyebrowColor={AMBER_DEEP}
            title="Best 8 of those 20"
            body="From those 20 rounds, only the 8 lowest differentials count toward your index. Your worst 12 are ignored — bad rounds genuinely don't hurt you."
          />

          <ExplainerBlock
            eyebrow="STEP 3"
            eyebrowColor={AMBER_DEEP}
            title="Average those 8"
            body={
              <>
                Your handicap index is the average of those 8 lowest differentials. Right now that's{' '}
                <strong style={{ color: INK, fontWeight: 700 }}>
                  {currentHandicap.toFixed(1)}
                </strong>.
              </>
            }
          />

          {cutTarget != null && settleAt != null && (
            <ExplainerBlock
              eyebrow="STEP 4"
              eyebrowColor={GREEN}
              title="What happens next round"
              body={
                isAtRisk ? (
                  <>
                    One of your good counters is rolling out next round. That means even an average score would push your handicap up to{' '}
                    <strong style={{ color: RED, fontWeight: 700 }}>
                      {fmtDiff(settleAt, { plus: true })}
                    </strong>. To prevent that, beat a differential of{' '}
                    <strong style={{ color: GREEN, fontWeight: 700 }}>
                      {fmtDiff(cutTarget, { plus: true })}
                    </strong>{' '}
                    — that score replaces your current worst counter and pulls the average back down.
                  </>
                ) : (
                  <>
                    Beat a differential of{' '}
                    <strong style={{ color: GREEN, fontWeight: 700 }}>
                      {fmtDiff(cutTarget, { plus: true })}
                    </strong>{' '}
                    and your handicap drops. If you don't, it settles at{' '}
                    <strong style={{ color: INK, fontWeight: 700 }}>
                      {fmtDiff(settleAt, { plus: true })}
                    </strong>{' '}
                    — close to where it is now. No risk of going up this round.
                  </>
                )
              }
            />
          )}

          <ExplainerBlock
            eyebrow="WHY IT FEELS WEIRD"
            eyebrowColor={INK}
            title="Bad rounds rarely hurt you"
            body="Most bad rounds simply don't enter the top 8, so they're discarded. Your handicap usually only goes up when one of your good rounds rolls out of the 20-window and there's nothing better to replace it. That's what 'a counter is rolling out' means."
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
