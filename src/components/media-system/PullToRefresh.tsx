/**
 * PullToRefresh — circular progress indicator for pull-down-to-refresh gesture.
 */

interface PullToRefreshProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefresh({ pullDistance, isRefreshing, threshold = 80 }: PullToRefreshProps) {
  if (pullDistance <= 0 && !isRefreshing) return null;

  const progress = Math.min(1, pullDistance / threshold);
  const size = 36;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const translateY = Math.min(pullDistance, threshold + 20);

  return (
    <div
      className="absolute left-1/2 z-30 pointer-events-none"
      style={{
        top: 0,
        transform: `translate(-50%, ${translateY - size - 16}px)`,
        opacity: Math.min(1, progress * 2),
        transition: isRefreshing ? 'none' : 'opacity 100ms',
      }}
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: 'rgba(0,0,0,0.5)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        <svg
          width={size - 8}
          height={size - 8}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            transform: isRefreshing ? undefined : `rotate(${-90 + progress * 270}deg)`,
            animation: isRefreshing ? 'ptr-spin 0.8s linear infinite' : undefined,
          }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isRefreshing ? circumference * 0.25 : dashOffset}
            style={{ transition: isRefreshing ? 'none' : 'stroke-dashoffset 50ms' }}
          />
        </svg>
      </div>
      <style>{`
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
