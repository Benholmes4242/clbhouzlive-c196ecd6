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
        "mt-1 h-[22px] w-[22px] rounded-full overflow-hidden",
        "bg-white/[0.08] border border-white/[0.14] backdrop-blur-[6px]",
        "shadow-[0_6px_18px_rgba(0,0,0,.22)]",
        "opacity-0 translate-y-1 will-change-transform",
        "data-[show=true]:opacity-100 data-[show=true]:translate-y-0 transition-all duration-[120ms] ease-out",
        side === 'right' ? "ml-auto mr-4" : "ml-4",
      ].join(' ')}
      role={src ? "img" : undefined}
      aria-label={src ? alt : undefined}
      data-show="true"
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {icon}
        </div>
      )}
    </div>
  );
}
