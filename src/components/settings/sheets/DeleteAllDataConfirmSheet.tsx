import React, { useState, useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

const INK = '#0F172A';
const INK_55 = '#64748B';
const RED = '#B91C1C';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isWorking: boolean;
}

export default function DeleteAllDataConfirmSheet({ open, onClose, onConfirm, isWorking }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const canConfirm = confirmText === 'DELETE' && !isWorking;

  useEffect(() => {
    if (!open) setConfirmText('');
  }, [open]);

  const handleClose = () => {
    if (isWorking) return;
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.45)',
          zIndex: 10080,
          animation: 'whsConfirmFade 200ms ease',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          zIndex: 10081,
          background: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          fontFamily: FONT,
          color: INK,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          animation: 'whsConfirmSlide 280ms cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '90dvh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.18)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '4px 20px 12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Trash2 size={12} color={RED} strokeWidth={2.4} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: RED }}>
                Permanent
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 }}>
              Delete all data?
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isWorking}
            aria-label="Close"
            style={{
              background: 'transparent', border: 'none', padding: 6, marginLeft: 8,
              cursor: isWorking ? 'default' : 'pointer', color: INK_55,
              opacity: isWorking ? 0.4 : 1,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '4px 20px 8px' }}>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: INK_55, margin: '0 0 12px' }}>
            This will permanently delete your synced handicap, all round history, hole-by-hole data, and your friends list from England Golf. This cannot be undone.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: INK_55, margin: '0 0 20px' }}>
            Your friends on clbhouz will still see your last-known data, but no new updates.
          </p>

          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_55, marginBottom: 8 }}>
            Type DELETE to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isWorking}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1px solid rgba(15,23,42,0.14)', borderRadius: 12,
              fontSize: 15, background: '#fff', color: INK, fontFamily: FONT,
              outline: 'none', marginBottom: 18,
              letterSpacing: '0.10em', fontWeight: 600,
              opacity: isWorking ? 0.5 : 1,
              boxSizing: 'border-box',
            }}
          />

          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: canConfirm ? RED : 'rgba(185,28,28,0.30)',
              color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 600, fontFamily: FONT,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              marginBottom: 8,
            }}
          >
            {isWorking ? 'Deleting…' : 'Delete all data'}
          </button>

          <button
            onClick={handleClose}
            disabled={isWorking}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: 'transparent', color: INK, border: 'none',
              fontSize: 15, fontWeight: 500, fontFamily: FONT,
              cursor: isWorking ? 'default' : 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes whsConfirmFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes whsConfirmSlide { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  );
}
