import * as React from 'react';

type Props = { size?: number; className?: string; title?: string };

export function EchoBotIcon({ size = 28, className, title = 'Echo' }: Props) {
  // Simple rounded robot face (monochrome, no green disc)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={className}
    >
      <rect x="2" y="5" width="20" height="14" rx="6" fill="currentColor" opacity="0.85" />
      <circle cx="9" cy="12" r="1.6" fill="#0B0B0B" />
      <circle cx="15" cy="12" r="1.6" fill="#0B0B0B" />
      <rect x="7" y="15" width="10" height="1.6" rx="0.8" fill="#0B0B0B" opacity="0.7" />
      <rect x="10.8" y="2" width="2.4" height="3" rx="1.2" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
