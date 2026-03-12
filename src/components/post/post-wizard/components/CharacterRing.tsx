interface CharacterRingProps {
  current: number;
  max: number;
  accentColor?: string;
}

export function CharacterRing({ current, max, accentColor = '#f59e0b' }: CharacterRingProps) {
  const circumference = 2 * Math.PI * 10;
  const ratio = Math.min(current / max, 1);
  const offset = circumference * (1 - ratio);
  const strokeColor = ratio > 0.95 ? '#FF3B30' : ratio > 0.8 ? '#FF9500' : accentColor;
  const showCount = ratio > 0.8;

  return (
    <div className="flex items-center gap-2">
      {showCount && (
        <span
          className="text-[12px] font-medium tabular-nums min-w-[20px] text-right"
          style={{ color: strokeColor }}
        >
          {max - current}
        </span>
      )}
      <svg width="26" height="26" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="13" cy="13" r="10" fill="none" stroke="#EEECEA" strokeWidth="2.5" />
        {current > 0 && (
          <circle
            cx="13" cy="13" r="10" fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.35s cubic-bezier(0.16,1,0.3,1), stroke 0.25s ease',
            }}
          />
        )}
      </svg>
    </div>
  );
}
