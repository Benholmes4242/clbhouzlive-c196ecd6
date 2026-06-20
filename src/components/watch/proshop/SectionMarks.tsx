import { memo } from 'react';

const AMBER = '#F7931E';
const INK = '#0F172A';

function OutlineClipMark({ stroke }: { stroke: string }) {
  return (
    <svg width={28} height={28} viewBox="0 0 30 30" aria-hidden style={{ flexShrink: 0 }}>
      <rect x="4" y="4" width="22" height="22" rx="8" fill="none" stroke={stroke} strokeWidth={1.8} />
      <path d="M12.5 10.5 L19.5 15 L12.5 19.5 Z" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export const ClipsMark = memo(() => <OutlineClipMark stroke={AMBER} />);
export const VideosMark = memo(() => <OutlineClipMark stroke={INK} />);
