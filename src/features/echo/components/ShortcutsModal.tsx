/**
 * Keyboard Shortcuts Cheatsheet Modal
 * Focus-trapped, ESC-to-close
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { echoHistoryAnalytics } from '../analytics/echoHistoryAnalytics';

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose }) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    echoHistoryAnalytics.shortcutsClosed();
    onClose();
  }, [onClose]);

  // Close on ESC + focus trap
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
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
    [handleClose]
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
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Card */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.85)] backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="shortcuts-title" className="text-[15px] font-semibold text-white/90">
            Keyboard Shortcuts
          </h2>
          <button
            ref={closeBtnRef}
            onClick={handleClose}
            aria-label="Close"
            className="rounded-full p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 py-4 text-[13px] text-white/80">
          {/* General */}
          <section aria-labelledby="sc-general">
            <h3 id="sc-general" className="text-white/70 text-xs uppercase tracking-wide mb-2">General</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <span>Focus search</span><kbd className="kbd">/</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Clear search / Close modals</span><kbd className="kbd">Esc</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Toggle cheatsheet</span><kbd className="kbd">?</kbd>
              </li>
            </ul>
          </section>

          {/* Chat actions */}
          <section aria-labelledby="sc-chat">
            <h3 id="sc-chat" className="text-white/70 text-xs uppercase tracking-wide mb-2">Chat actions</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <span>Star / Unstar (expanded)</span><kbd className="kbd">S</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Delete (expanded)</span>
                <span className="flex items-center gap-1">
                  <kbd className="kbd">Del</kbd><span className="text-white/40 text-[11px]">or</span><kbd className="kbd">⌫</kbd>
                </span>
              </li>
            </ul>
          </section>

          {/* Selection Mode */}
          <section aria-labelledby="sc-select">
            <h3 id="sc-select" className="text-white/70 text-xs uppercase tracking-wide mb-2">Selection mode</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <span>Star all selected</span><kbd className="kbd">S</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Delete selected</span><kbd className="kbd">Del</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Clear selection</span><kbd className="kbd">Esc</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Select a range (desktop)</span><span className="flex items-center gap-1"><kbd className="kbd">Shift</kbd> + <span className="kbd">Click</span></span>
              </li>
            </ul>
          </section>

          {/* Navigation (optional, if you support it later) */}
          <section aria-labelledby="sc-nav">
            <h3 id="sc-nav" className="text-white/70 text-xs uppercase tracking-wide mb-2">Navigation</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <span>Next / Previous row</span><span className="flex items-center gap-1"><kbd className="kbd">J</kbd><span className="text-white/40 text-[11px]">/</span><kbd className="kbd">K</kbd></span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/10">
          <label className="inline-flex items-center gap-2 text-white/70 text-[12px]">
            <input
              type="checkbox"
              className="accent-white/80"
              onChange={(e) => localStorage.setItem('echo.shortcutHintSeen', e.target.checked ? 'true' : 'false')}
              defaultChecked={localStorage.getItem('echo.shortcutHintSeen') === 'true'}
            />
            Don&apos;t show this automatically
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/10 text-white/85 text-[12px]"
            >
              Print
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-1.5 rounded-md bg-white/90 hover:bg-white text-black text-[12px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
