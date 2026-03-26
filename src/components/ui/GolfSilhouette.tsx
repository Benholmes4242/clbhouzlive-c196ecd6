export function GolfSilhouette({ size }: { size: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="22" r="11"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path d="M35 42 Q38 36 50 34 Q62 36 65 42 L68 68 Q60 72 50 72 Q40 72 32 68 Z"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.30)" strokeWidth="1.5" />
      <path d="M35 44 L22 62 L20 90"
        stroke="rgba(255,255,255,0.30)" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 90 L23 90"
        stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M65 44 L74 58"
        stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
      <path d="M42 72 L40 95"
        stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
      <path d="M58 72 L60 95"
        stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
