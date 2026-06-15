import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { adminTheme as t } from '../theme';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function DetailDrawer({ open, onClose, title, subtitle, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden={!open}
        style={{
          position: 'fixed', inset: 0, zIndex: 150,
          background: 'rgba(15,23,42,0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .22s ease',
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed', top: 0, bottom: 0, right: 0, zIndex: 160,
          width: 'min(440px, 100vw)',
          background: t.surface,
          borderLeft: `1px solid ${t.line}`,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .26s cubic-bezier(0.22,1,0.36,1)',
          display: 'flex', flexDirection: 'column',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '12px 16px',
          borderBottom: `1px solid ${t.line}`,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <div style={{ fontSize: 15, fontWeight: 700, color: t.ink, lineHeight: 1.2 }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 36, height: 36, borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.surface,
              color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {children}
        </div>

        {footer && (
          <div style={{
            borderTop: `1px solid ${t.line}`,
            padding: 12,
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
            background: t.surface,
          }}>
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
