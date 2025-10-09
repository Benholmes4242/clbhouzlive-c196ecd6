import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
};

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <div className={clsx(
      'fixed inset-0 z-[999]',
      isOpen ? 'pointer-events-auto' : 'pointer-events-none'
    )}>
      {/* scrim */}
      <div
        className={clsx(
          'absolute inset-0 transition-opacity',
          isOpen ? 'bg-black/40 opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      {/* sheet */}
      <div
        ref={ref}
        className={clsx(
          'absolute left-0 right-0 bottom-0 rounded-t-2xl bg-background',
          'border-t border-border',
          'shadow-[0_-12px_40px_rgba(0,0,0,0.2)]',
          'transition-transform will-change-transform',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ minHeight: 140 }}
      >
        {title && (
          <div className="px-4 pt-3 pb-2 text-sm font-medium text-muted-foreground">
            {title}
          </div>
        )}
        <div className="p-2">{children}</div>
        <div className="h-4" />
      </div>
    </div>
  );
}
