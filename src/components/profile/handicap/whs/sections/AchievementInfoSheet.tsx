import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  achievement: {
    title: string;
    count?: number | null;
    hole_data_denominator?: {
      rounds_with_holes: number;
      total_rounds: number;
    };
  } | null;
}

const T = {
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
  inkSoft: 'var(--hcp-t-80)',
  hairline: 'var(--hcp-line-2)',
  neutralTint: 'var(--hcp-bg-2)',
  amber: '#F7931E',
  amberTint: 'rgba(247,147,30,0.10)',
  amberInk: '#854F0B',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const BODY: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.6,
  color: T.inkSoft,
  fontFamily: FONT,
};

const SectionLabel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 800,
      color: T.inkMute,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      fontFamily: FONT,
      marginBottom: 8,
      ...style,
    }}
  >
    {children}
  </div>
);

export const AchievementInfoSheet: React.FC<Props> = ({ open, onClose, achievement }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !achievement) return null;

  const denom = achievement.hole_data_denominator;
  const hasDenom = !!denom;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--hcp-t-40)',
          zIndex: 10000,
          animation: 'achInfoFadeIn 180ms ease-out',
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '80vh',
          background: 'var(--hcp-bg-1)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          animation: 'achInfoSlideUp 240ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -8px 30px rgba(15,23,42,0.18)',
          fontFamily: FONT,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'rgba(15,23,42,0.18)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: `1px solid ${T.hairline}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: T.inkMute,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              ACHIEVEMENT
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: T.ink,
                letterSpacing: '-0.01em',
              }}
            >
              About this count
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: T.neutralTint,
              color: T.ink,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 16px 28px',
          }}
        >
          <SectionLabel>{achievement.title}</SectionLabel>
          <p style={{ ...BODY, marginBottom: 18 }}>
            You've recorded{' '}
            <span style={{ fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
              {(achievement.count ?? 0).toLocaleString()}
            </span>{' '}
            so far.
          </p>

          {hasDenom ? (
            <>
              <SectionLabel>Where the count comes from</SectionLabel>
              <p style={{ ...BODY, marginBottom: 12 }}>
                This count is based on the{' '}
                <span style={{ fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {denom!.rounds_with_holes}
                </span>{' '}
                of your{' '}
                <span style={{ fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {denom!.total_rounds}
                </span>{' '}
                rounds where England Golf has hole-by-hole data.
              </p>
              <p style={{ ...BODY, marginBottom: 14 }}>
                EG records full hole detail on rounds entered via the MyEG app.
                Older or club-submitted rounds may only show your round total,
                so any {achievement.title.toLowerCase()} on those rounds won't
                be counted here.
              </p>
              <div
                style={{
                  background: T.amberTint,
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <p style={{ ...BODY, color: T.amberInk, margin: 0 }}>
                  As you play more rounds via MyEG, this count grows.
                  Future syncs of older rounds with hole detail will be
                  picked up automatically.
                </p>
              </div>
            </>
          ) : (
            <>
              <SectionLabel>How it's counted</SectionLabel>
              <p style={BODY}>
                Counted across every round England Golf has on record for you.
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes achInfoFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes achInfoSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
};

export default AchievementInfoSheet;
