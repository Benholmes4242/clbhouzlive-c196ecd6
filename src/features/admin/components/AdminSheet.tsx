import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { adminTheme as t } from '../theme';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

/**
 * Responsive admin sheet/modal.
 * - Mobile (<768px): bottom sheet, full-width, ~92dvh height, sticky header/footer.
 * - Desktop: centered modal capped to maxWidth.
 */
export default function AdminSheet({ open, onClose, title, subtitle, children, footer, maxWidth = 520 }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      className="admin-sheet-root"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="admin-sheet-panel"
        style={{
          background: t.surface,
          width: '100%',
          maxWidth,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92dvh',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'sticky', top: 0, zIndex: 2,
          background: t.surface,
          borderBottom: `1px solid ${t.line}`,
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '14px 16px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.ink, lineHeight: 1.2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 36, height: 36, borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>

        {footer && (
          <div style={{
            position: 'sticky', bottom: 0, zIndex: 2,
            background: t.surface,
            borderTop: `1px solid ${t.line}`,
            padding: 12,
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          }}>
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .admin-sheet-root { align-items: center !important; padding: 24px; }
          .admin-sheet-panel { border-radius: 16px !important; max-height: 88dvh !important; }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
