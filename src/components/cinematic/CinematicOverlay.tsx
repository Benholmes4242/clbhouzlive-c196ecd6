import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../../../src/styles/cinematic.css';

type Variant = 'sheet' | 'center';
type Tone = 'light' | 'dark' | 'translucent';
type Size = 'auto' | 'sm' | 'md' | 'lg' | 'fullscreen';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  blur?: number;
  backdropOpacity?: number;
  showHandle?: boolean;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const root = () => document.getElementById('modal-root') ?? document.body;

export default function CinematicOverlay({
  isOpen,
  onClose,
  variant = 'sheet',
  tone = 'translucent',
  size = 'fullscreen',
  blur = 14,
  backdropOpacity = 0.65,
  showHandle = true,
  closeOnEsc = true,
  closeOnBackdrop = true,
  header,
  footer,
  children,
  className,
  initialFocusRef,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    const toFocus = initialFocusRef?.current ?? sheetRef.current;
    toFocus?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [isOpen, closeOnEsc, onClose, initialFocusRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={[
        'cin-overlay',
        `cin-variant-${variant}`,
        `cin-tone-${tone}`,
        `cin-size-${size}`,
        className || '',
      ].join(' ')}
      style={
        {
          ['--cin-blur' as any]: `${blur}px`,
          ['--cin-backdrop-opacity' as any]: backdropOpacity,
        } as React.CSSProperties
      }
      aria-modal
      role="dialog"
    >
      <div
        className="cin-backdrop"
        onClick={() => closeOnBackdrop && onClose()}
      />
      <div
        className="cin-sheet"
        ref={sheetRef}
        tabIndex={-1}
      >
        {showHandle && variant === 'sheet' && <div className="cin-handle" />}
        {header && <div className="cin-header">{header}</div>}
        <div className="cin-body">{children}</div>
        {footer && <div className="cin-footer">{footer}</div>}
      </div>
    </div>,
    root()
  );
}
