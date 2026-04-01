import { useNavigate } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface Props {
  prompt: string;
  label: string;
  sublabel?: string;
  dark?: boolean;
  compact?: boolean;
  source: string;
}

export function EchoContextualButton({ prompt, label, sublabel, dark = true, compact = false, source }: Props) {
  const navigate = useNavigate();

  const handleTap = () => {
    analyticsEvents.track('echo_contextual_tap', { source, prompt_preview: prompt.slice(0, 80) });
    navigate(`/echo?prompt=${encodeURIComponent(prompt)}`);
  };

  const bg = dark ? 'rgba(247,147,30,0.1)' : 'rgba(247,147,30,0.08)';
  const border = dark ? 'rgba(247,147,30,0.22)' : 'rgba(247,147,30,0.2)';
  const textColor = dark ? '#ffffff' : '#1a1a1a';
  const subColor = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const pad = compact ? '8px 11px' : '11px 13px';
  const iconSize = compact ? 28 : 32;
  const iconRadius = compact ? 8 : 9;
  const fontSize = compact ? 12 : 13;
  const subSize = compact ? 10 : 11;

  return (
    <button
      onClick={handleTap}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 9 : 11,
        padding: pad,
        borderRadius: 12,
        background: bg,
        border: `1px solid ${border}`,
        cursor: 'pointer',
        textAlign: 'left',
      }}
      className="active:scale-[0.98] transition-transform"
    >
      {/* Echo icon container */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: iconRadius,
          background: 'linear-gradient(135deg, #F7931E, #E8920A)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* Echo waveform SVG */}
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="8" width="2" height="8" rx="1" fill="white" opacity="0.7" />
          <rect x="7" y="5" width="2" height="14" rx="1" fill="white" opacity="0.85" />
          <rect x="11" y="3" width="2" height="18" rx="1" fill="white" />
          <rect x="15" y="6" width="2" height="12" rx="1" fill="white" opacity="0.85" />
          <rect x="19" y="9" width="2" height="6" rx="1" fill="white" opacity="0.7" />
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize, fontWeight: 700, color: textColor, margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
        {sublabel && (
          <p style={{ fontSize: subSize, color: subColor, margin: '2px 0 0', lineHeight: 1.3 }}>{sublabel}</p>
        )}
      </div>

      {/* Arrow */}
      <span style={{ fontSize: 18, color: subColor, flexShrink: 0, fontWeight: 300 }}>›</span>
    </button>
  );
}
