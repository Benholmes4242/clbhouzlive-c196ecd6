import React from 'react';

interface Props {
  iso: string;
  dimmed?: boolean;
}

const FRAME: React.CSSProperties = {
  width: 32, height: 22, borderRadius: 3,
  overflow: 'hidden', flexShrink: 0,
  border: '0.5px solid rgba(15,23,42,0.10)',
  position: 'relative',
  background: '#fff',
};

export const MiniFlag: React.FC<Props> = ({ iso, dimmed }) => {
  const style: React.CSSProperties = {
    ...FRAME,
    opacity: dimmed ? 0.65 : 1,
  };

  switch (iso) {
    case 'GB-ENG':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, background: '#B91C1C', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 4, background: '#B91C1C', transform: 'translateX(-50%)' }} />
        </div>
      );
    case 'GB-SCT':
      return (
        <div style={{ ...style, background: '#002F87' }}>
          <svg viewBox="0 0 32 22" width="32" height="22" style={{ display: 'block' }}>
            <line x1="0" y1="0" x2="32" y2="22" stroke="#fff" strokeWidth="3" />
            <line x1="32" y1="0" x2="0" y2="22" stroke="#fff" strokeWidth="3" />
          </svg>
        </div>
      );
    case 'GB-WLS':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: '#fff' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: '#006A3E' }} />
        </div>
      );
    case 'FR':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 1, background: '#002395' }} />
            <div style={{ flex: 1, background: '#fff' }} />
            <div style={{ flex: 1, background: '#ED2939' }} />
          </div>
        </div>
      );
    case 'IE':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 1, background: '#169B62' }} />
            <div style={{ flex: 1, background: '#fff' }} />
            <div style={{ flex: 1, background: '#FF883E' }} />
          </div>
        </div>
      );
    case 'IT':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 1, background: '#009246' }} />
            <div style={{ flex: 1, background: '#fff' }} />
            <div style={{ flex: 1, background: '#CE2B37' }} />
          </div>
        </div>
      );
    case 'DE':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '33.33%', background: '#000' }} />
          <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '33.33%', background: '#DD0000' }} />
          <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '33.34%', background: '#FFCE00' }} />
        </div>
      );
    case 'NL':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '33.33%', background: '#AE1C28' }} />
          <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '33.33%', background: '#fff' }} />
          <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '33.34%', background: '#21468B' }} />
        </div>
      );
    case 'ES':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '25%', background: '#AA151B' }} />
          <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '50%', background: '#F1BF00' }} />
          <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: '25%', background: '#AA151B' }} />
        </div>
      );
    case 'PT':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 2, background: '#006600' }} />
            <div style={{ flex: 3, background: '#FF0000' }} />
          </div>
        </div>
      );
    case 'US':
      return (
        <div style={style}>
          <svg viewBox="0 0 32 22" width="32" height="22" style={{ display: 'block' }}>
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <rect key={i} x="0" y={i * (22 / 7)} width="32" height={22 / 7} fill={i % 2 === 0 ? '#BF0A30' : '#fff'} />
            ))}
            <rect x="0" y="0" width="13" height="12" fill="#002868" />
          </svg>
        </div>
      );
    case 'CA':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 1, background: '#FF0000' }} />
            <div style={{ flex: 2, background: '#fff' }} />
            <div style={{ flex: 1, background: '#FF0000' }} />
          </div>
        </div>
      );
    case 'AU':
    case 'NZ':
      return (
        <div style={{ ...style, background: '#012169' }}>
          <div style={{ position: 'absolute', top: 2, left: 2, width: 12, height: 8, background: 'linear-gradient(135deg, #C8102E 50%, #fff 50%)', borderRadius: 1 }} />
        </div>
      );
    case 'ZA':
      return (
        <div style={style}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '33%', background: '#007A4D' }} />
          <div style={{ position: 'absolute', top: '33%', left: 0, right: 0, height: '34%', background: '#fff' }} />
          <div style={{ position: 'absolute', top: '67%', left: 0, right: 0, height: '33%', background: '#DE3831' }} />
        </div>
      );
    case 'SE':
      return (
        <div style={{ ...style, background: '#006AA7' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, background: '#FECC00', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 4, background: '#FECC00' }} />
        </div>
      );
    case 'CH':
      return (
        <div style={{ ...style, background: '#FF0000' }}>
          <div style={{ position: 'absolute', top: '50%', left: '25%', right: '25%', height: 3, background: '#fff', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', top: '25%', bottom: '25%', left: '50%', width: 3, background: '#fff', transform: 'translateX(-50%)' }} />
        </div>
      );
    default:
      return <div style={{ ...style, background: 'rgba(15,23,42,0.06)' }} />;
  }
};

export default MiniFlag;
