import React from 'react';

const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  isCounter: boolean;
  handicapDelta: number | null;
}

interface StatusInfo {
  text: string;
  color: string;
}

function statusInfo({ isCounter, handicapDelta }: Props): StatusInfo {
  if (!isCounter) {
    return { text: 'non counting round', color: 'rgba(255,255,255,0.65)' };
  }
  if (handicapDelta == null || Math.abs(handicapDelta) < 0.05) {
    return { text: 'no effect on index', color: 'rgba(255,255,255,0.85)' };
  }
  const abs = Math.abs(handicapDelta).toFixed(1);
  if (handicapDelta < 0) {
    return { text: `lowered index by ${abs}`, color: '#86EFAC' };
  }
  return { text: `raised index by ${abs}`, color: '#FCA5A5' };
}

const TEXT_SHADOW = '0 1px 2px rgba(0,0,0,0.3)';

/** On-photo bottom band: status hint (left) + SCORECARD glass pill (right). */
export const CinemaCardOnPhotoFooter: React.FC<Props> = (props) => {
  const status = statusInfo(props);

  return (
    <>
      {/* bottom-right SCORECARD pill */}
      <div
        style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          zIndex: 3,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 13px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.10)',
          border: '0.5px solid rgba(255,255,255,0.25)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.10em',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          fontFamily: FONT_SF,
          pointerEvents: 'none',
        }}
      >
        SCORECARD <span style={{ opacity: 0.7 }}>{'\u203A'}</span>
      </div>
    </>
  );
};

export default CinemaCardOnPhotoFooter;
