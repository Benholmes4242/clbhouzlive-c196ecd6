import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TITLE } from '@/lib/tokens/type';

const INK = '#0F172A';
const INK_55 = '#64748B';
const RED = '#DC2626';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
  setConfirmText: (v: string) => void;
  isWorking: boolean;
}

/**
 * Direction A overlay for permanent account deletion. Requires the user to
 * type DELETE before the destructive button activates.
 */
export default function DeleteAccountConfirmSheet({
  open, onClose, onConfirm, confirmText, setConfirmText, isWorking,
}: Props) {
  const canConfirm = confirmText === 'DELETE' && !isWorking;

  useEffect(() => {
    if (!open) setConfirmText('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    if (isWorking) return;
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 rounded-t-[20px] border-0 max-h-[95dvh] overflow-auto"
        style={{
          fontFamily: FONT,
          color: INK,
          background: '#fff',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.18)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '4px 20px 12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: RED }}>
              Permanent
            </span>
            <h2 style={{ ...TITLE, margin: '6px 0 0' }}>
              Delete account?
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
          <p style={{ fontSize: 15, lineHeight: 1.5, color: INK_55, margin: '0 0 16px' }}>
            This cannot be undone. All your data, posts, scorecards, and connections will be permanently removed.
            Type <strong style={{ color: INK }}>DELETE</strong> to confirm.
          </p>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            disabled={isWorking}
            autoCapitalize="characters"
            aria-label="Type DELETE to confirm"
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
              background: canConfirm ? RED : 'rgba(220,38,38,0.30)',
              color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 600, fontFamily: FONT,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              marginBottom: 8,
            }}
          >
            {isWorking ? 'Deleting\u2026' : 'Delete my account'}
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
      </SheetContent>
    </Sheet>
  );
}
