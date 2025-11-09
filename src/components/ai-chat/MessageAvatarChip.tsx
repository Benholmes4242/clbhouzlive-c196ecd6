import * as React from 'react';

type Side = 'left' | 'right';

export function MessageAvatarChip({
  side = 'left',
  src,
  icon,
  alt = '',
}: {
  side?: Side;
  src?: string;
  icon?: React.ReactNode;
  alt?: string;
}) {
  return (
    <div
      className={[
        "mt-[var(--chip-gap)] inline-flex items-center justify-center",
        "w-[var(--chip-size)] h-[var(--chip-size)]",
        "rounded-[8px] bg-[var(--chip-bg)]",
        "border border-[var(--chip-stroke)]",
        "backdrop-blur-md transition-all duration-[120ms]",
        "opacity-100 translate-y-0",
        side === 'right' ? "ml-auto" : "",
      ].join(' ')}
      role="img"
      aria-hidden="true"
    >
      {src ? (
        <img src={src} alt={alt} className="w-[18px] h-[18px] rounded-[6px] object-cover" />
      ) : (
        <div className="flex items-center justify-center w-[18px] h-[18px]">
          {icon}
        </div>
      )}
    </div>
  );
}
