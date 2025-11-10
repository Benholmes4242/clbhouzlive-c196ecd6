/**
 * Keyboard Shortcuts Cheatsheet Modal
 * Toggled by pressing ?
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose }) => {
  // Handle ESC key to close
  useEffect(() => {
    if (!open) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    
    const modal = document.querySelector('[data-shortcuts-modal]');
    if (!modal) return;
    
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    firstElement?.focus();
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      data-shortcuts-modal
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="mx-4 max-w-md w-full rounded-2xl border shadow-2xl p-6"
        style={{
          background: 'var(--hub-glass-bg)',
          borderColor: 'var(--hub-stroke)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            id="shortcuts-title"
            className="text-xl font-semibold"
            style={{ color: 'var(--hub-text)' }}
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close shortcuts"
          >
            <X size={20} style={{ color: 'var(--hub-text-dim)' }} />
          </button>
        </div>

        {/* Shortcuts list */}
        <ul className="space-y-3" style={{ color: 'var(--hub-text)' }}>
          <li className="flex items-center justify-between">
            <span style={{ color: 'var(--hub-text-dim)' }}>Focus search</span>
            <kbd className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'rgba(255,255,255,0.1)' }}>
              /
            </kbd>
          </li>
          <li className="flex items-center justify-between">
            <span style={{ color: 'var(--hub-text-dim)' }}>Star / Unstar</span>
            <kbd className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'rgba(255,255,255,0.1)' }}>
              S
            </kbd>
          </li>
          <li className="flex items-center justify-between">
            <span style={{ color: 'var(--hub-text-dim)' }}>Delete</span>
            <kbd className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'rgba(255,255,255,0.1)' }}>
              Del
            </kbd>
          </li>
          <li className="flex items-center justify-between">
            <span style={{ color: 'var(--hub-text-dim)' }}>Toggle cheatsheet</span>
            <kbd className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'rgba(255,255,255,0.1)' }}>
              ?
            </kbd>
          </li>
          <li className="flex items-center justify-between">
            <span style={{ color: 'var(--hub-text-dim)' }}>Range select (desktop)</span>
            <kbd className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'rgba(255,255,255,0.1)' }}>
              Shift+Click
            </kbd>
          </li>
          <li className="flex items-center justify-between">
            <span style={{ color: 'var(--hub-text-dim)' }}>Open inline thread</span>
            <kbd className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'rgba(255,255,255,0.1)' }}>
              Enter
            </kbd>
          </li>
          <li className="flex items-center justify-between">
            <span style={{ color: 'var(--hub-text-dim)' }}>Clear selection</span>
            <kbd className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'rgba(255,255,255,0.1)' }}>
              Esc
            </kbd>
          </li>
        </ul>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
          style={{ color: 'var(--hub-text)' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
};
