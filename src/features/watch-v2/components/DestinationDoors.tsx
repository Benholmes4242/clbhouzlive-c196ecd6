import { useNavigate } from 'react-router-dom';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface DoorProps {
  title: string;
  suffix: string;
  onClick: () => void;
  tone: 'amber' | 'ink';
}

function Door({ title, suffix, onClick, tone }: DoorProps) {
  const isAmber = tone === 'amber';
  const bg = isAmber
    ? 'linear-gradient(135deg,#F7931E,#e07d0a)'
    : '#0F172A';
  const color = isAmber ? '#0b0d12' : '#fff';
  const countOpacity = isAmber ? 0.75 : 0.65;
  const chevronOpacity = isAmber ? 0.55 : 0.5;
  const circleBg = isAmber
    ? 'rgba(255,255,255,0.18)'
    : 'rgba(255,255,255,0.08)';

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        flex: 1,
        borderRadius: 14,
        padding: '14px 14px 12px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        background: bg,
        color,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -8,
          top: -10,
          width: 54,
          height: 54,
          borderRadius: 999,
          background: circleBg,
        }}
      />
      <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
        {title}
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 11.5,
          lineHeight: 1.2,
          opacity: countOpacity,
          marginTop: 2,
        }}
      >
        {suffix}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 10,
          bottom: 8,
          fontWeight: 800,
          fontSize: 18,
          lineHeight: 1,
          opacity: chevronOpacity,
        }}
      >
        {'>'}
      </div>
    </div>
  );
}

export function DestinationDoors() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
        padding: '0 4px',
      }}
    >
      <Door
        title="Clips"
        tone="amber"
        suffix="under 90s"
        onClick={() => navigate('/watch/clips')}
      />
      <Door
        title="Videos"
        tone="ink"
        suffix="full length"
        onClick={() => navigate('/watch/videos')}
      />
    </div>
  );
}

export default DestinationDoors;
