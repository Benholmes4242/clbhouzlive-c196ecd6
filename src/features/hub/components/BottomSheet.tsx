import React from 'react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
};

export function BottomSheet({ open, onClose, children, ariaLabel }: BottomSheetProps) {
  // scroll lock
  React.useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className={`fixed inset-0 z-[95] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="fixed left-0 right-0 z-[96] rounded-t-2xl"
        style={{
          top: 'var(--hub-header-h)',
          height: 'calc(100dvh - var(--hub-header-h))',
          transform: `translateY(${open ? '0%' : '100%'})`,
          transition: 'transform 320ms cubic-bezier(.22,.8,.18,1)',
          background: 'rgba(28,28,30,0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 -12px 50px rgba(0,0,0,0.45)',
          borderTop: '1px solid rgba(255,255,255,0.14)',
        }}
      >
        {/* drag handle */}
        <div className="flex justify-center py-2">
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.25)' }} />
        </div>

        <div className="h-[calc(100%-28px)] overflow-auto px-4 pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </section>
    </>
  );
}
