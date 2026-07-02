import React from 'react';

interface Props { iso: string; dimmed?: boolean; }

const FLAG_CODE: Record<string, string> = {
  'AU': 'au',
  'CA': 'ca',
  'CH': 'ch',
  'DE': 'de',
  'ES': 'es',
  'FR': 'fr',
  'GB-ENG': 'gb-eng',
  'GB-SCT': 'gb-sct',
  'GB-WLS': 'gb-wls',
  'IE': 'ie',
  'IT': 'it',
  'NL': 'nl',
  'NZ': 'nz',
  'PT': 'pt',
  'SE': 'se',
  'US': 'us',
  'ZA': 'za',
};

const FRAME: React.CSSProperties = {
  width: 32,
  height: 22,
  borderRadius: 3,
  overflow: 'hidden',
  flexShrink: 0,
  border: '0.5px solid rgba(15,23,42,0.10)',
  position: 'relative',
  background: '#fff',
};

export const MiniFlag: React.FC<Props> = ({ iso, dimmed }) => {
  const code = FLAG_CODE[iso];
  return (
    <span style={{ ...FRAME, opacity: dimmed ? 0.65 : 1, display: 'inline-block' }}>
      {code ? (
        <span
          className={`fi fi-${code}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        <span style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.06)' }} />
      )}
    </span>
  );
};

export default MiniFlag;
