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
  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev;
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: zIndexBase }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-xl transform transition-transform duration-300 ${className}`}
        style={{ 
          zIndex: zIndexBase + 1,
          maxHeight: '90vh',
        }}
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
