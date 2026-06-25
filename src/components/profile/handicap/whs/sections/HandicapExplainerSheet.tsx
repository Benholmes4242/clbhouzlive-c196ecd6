import React, { useEffect } from 'react';
import SheetHeader from '@/components/ui/SheetHeader';
import { fmtDiff } from '@/lib/whs/format';

/**
 * Educational copy note: "your" in this sheet refers to the reader
 * (the person viewing the sheet), not the profile owner. These sheets
 * explain WHS mechanics; do not friend-prefix or change to third-person.
 */

const INK = 'var(--hcp-t-100)';
const INK_70 = 'var(--hcp-t-80)';
const INK_55 = 'var(--hcp-t-60)';
const INK_10 = 'var(--hcp-line-2)';
const INK_06 = 'var(--hcp-bg-3)';
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
      letterSpacing: '0.16em', marginBottom: 4,
    }}>
      {eyebrow}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--hcp-t-100)', marginBottom: 6 }}>
      {title}
    </div>
    <div style={{ fontSize: 13, color: 'var(--hcp-t-80)', lineHeight: 1.5 }}>
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
    lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockBodyScroll();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'var(--hcp-t-40)',
          zIndex: 9998, animation: 'fadeIn 200ms ease',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          margin: '0 auto', width: '100%', maxWidth: 420,
          background: 'var(--hcp-bg-1)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 0 32px',
          zIndex: 9999,
          animation: 'slideUp 280ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          maxHeight: '90vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{
          width: 36, height: 4, background: INK_10, borderRadius: 2,
          margin: '0 auto 8px',
        }} />

        <SheetHeader
          eyebrow="HOW IT WORKS"
          title="How your handicap moves"
          sub="The system is more forgiving than people think — here's why."
          onClose={onClose}
          borderBottom={false}
          dark
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: '8px 16px 0' }}>

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
                <strong style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
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
                    <strong style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
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
