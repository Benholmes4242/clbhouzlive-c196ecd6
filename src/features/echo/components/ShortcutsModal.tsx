/**
 * Keyboard Shortcuts Cheatsheet Modal
 * Focus-trapped, ESC-to-close
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose }) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Close on ESC + focus trap
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Simple focus trap: tab cycles within modal
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  // Mount/unmount focus management
  useEffect(() => {
    if (!open) return;

    // Save current focus
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Focus close button after render
    const timeout = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    // Lock body scroll
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = '';
      // Restore previous focus
      previouslyFocused.current?.focus?.();
    };
  }, [open, onKeyDown]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Echo History keyboard shortcuts"
        className="fixed z-[1001] inset-0 flex items-center justify-center p-4"
      >
        <div
          className="w-full max-w-lg rounded-2xl border"
          style={{
            borderColor: 'var(--hub-stroke)',
            background: 'rgba(20, 20, 20, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--hub-stroke)' }}
          >
            <h2 className="text-[17px] font-semibold" style={{ color: 'var(--hub-text)' }}>
              Keyboard Shortcuts
            </h2>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
              aria-label="Close shortcuts"
            >
              <X size={18} style={{ color: 'var(--hub-text)' }} />
            </button>
          </div>

          {/* Shortcuts list */}
          <div className="px-5 py-4">
            <ul className="space-y-3" style={{ color: 'var(--hub-text)' }}>
              <li className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: 'var(--hub-text-dim)' }}>
                  Focus search
                </span>
                <kbd>/</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: 'var(--hub-text-dim)' }}>
                  Clear search / Close modals
                </span>
                <kbd>Esc</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: 'var(--hub-text-dim)' }}>
                  Star / Unstar (when expanded)
                </span>
                <kbd>S</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: 'var(--hub-text-dim)' }}>
                  Delete (when expanded)
                </span>
                <div className="flex gap-2">
                  <kbd>Del</kbd>
                  <span style={{ color: 'var(--hub-text-dim)' }}>or</span>
                  <kbd>⌫</kbd>
                </div>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: 'var(--hub-text-dim)' }}>
                  Toggle cheatsheet
                </span>
                <kbd>?</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: 'var(--hub-text-dim)' }}>
                  Select range (desktop)
                </span>
                <div className="flex gap-1 items-center">
                  <kbd>Shift</kbd>
                  <span style={{ color: 'var(--hub-text-dim)' }}>+</span>
                  <span className="text-[13px]" style={{ color: 'var(--hub-text-dim)' }}>Click</span>
                </div>
              </li>
            </ul>

            <div
              className="mt-4 pt-4 border-t text-[13px]"
              style={{ borderColor: 'var(--hub-stroke)', color: 'var(--hub-text-dim)' }}
            >
              <div className="font-medium mb-2" style={{ color: 'var(--hub-text)' }}>
                In Selection Mode:
              </div>
              <ul className="space-y-2">
                <li className="flex items-center justify-between">
                  <span>Star all selected</span>
                  <kbd>S</kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>Delete selected</span>
                  <kbd>Del</kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>Clear selection</span>
                  <kbd>Esc</kbd>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
