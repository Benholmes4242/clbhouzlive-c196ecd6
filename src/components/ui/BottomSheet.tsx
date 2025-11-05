import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  zIndexBase?: number;
  children: React.ReactNode;
  className?: string;
  ariaLabelledBy?: string;
}

export function BottomSheet({
  open,
  onClose,
  zIndexBase = 1400,
  children,
  className = '',
  ariaLabelledBy,
}: BottomSheetProps) {
  // Scroll lock + sheet-open class
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    body.classList.add('sheet-open');
    return () => {
      body.style.overflow = prev;
      body.classList.remove('sheet-open');
    };
  }, [open]);

  // TEMP: enable global overlay debug while this sheet is open
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add('overlay-debug');
    return () => {
      root.classList.remove('overlay-debug');
    };
  }, [open]);

  // ESC key handling
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="sheet-backdrop"
        style={{ zIndex: zIndexBase }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`sheet sheet-enter ${className}`}
        style={{ zIndex: zIndexBase + 1 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
      >
        {children}
      </div>
    </>,
    document.body
  );
}
