import React, { useEffect, useState } from 'react';
import { adminTheme as t } from '../theme';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  /** When provided, user must type this exact string to enable confirm. */
  requireText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  busy?: boolean;
}

export default function ConfirmDialog({
  open, onClose, onConfirm,
  title, description, requireText,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  tone = 'default', busy,
}: Props) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const matches = !requireText || typed.trim() === requireText.trim();
  const confirmBg = tone === 'danger' ? t.danger : t.ink;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.surface,
          borderRadius: t.radius.lg,
          boxShadow: t.shadowPop,
          width: '100%', maxWidth: 420,
          padding: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.ink }}>{title}</div>
          {description && (
            <div style={{ fontSize: 13, color: t.inkMuted, marginTop: 6, lineHeight: 1.45 }}>
              {description}
            </div>
          )}
        </div>

        {requireText && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: t.inkMuted }}>
              Type <strong style={{ color: t.ink }}>{requireText}</strong> to confirm
            </label>
            <input
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: t.radius.md,
                border: `1px solid ${t.line}`,
                background: t.canvas,
                color: t.ink, fontSize: 14, outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: '8px 14px',
              borderRadius: t.radius.md,
              border: `1px solid ${t.line}`,
              background: t.surface, color: t.ink,
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches || busy}
            style={{
              padding: '8px 14px',
              borderRadius: t.radius.md,
              border: 'none',
              background: confirmBg,
              color: t.surface,
              fontSize: 13, fontWeight: 600,
              cursor: matches && !busy ? 'pointer' : 'not-allowed',
              opacity: matches && !busy ? 1 : 0.55,
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
