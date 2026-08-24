import React, { useState, useEffect } from 'react';
import { TITLE } from '@/lib/tokens/type';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';
  PANEL, BORDER, INK, MUTE, DIM, BAD, TRACK, FONT, KICKER, LABEL,
} from '@/components/profile/handicap/whs/connect/designTokens';

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

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 rounded-t-[20px] border-0 max-h-[85dvh] overflow-auto"
        style={{
          fontFamily: FONT,
          color: INK,
          background: PANEL,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: TRACK }} />
        </div>

        <div style={{ padding: '10px 20px 0' }}>
          <div style={{ ...KICKER, color: BAD, marginBottom: 8 }}>Permanent</div>
          <h2 style={{ ...TITLE, margin: 0, lineHeight: 1.14 }}>
            Delete everything?
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.52, color: MUTE, margin: '10px 0 0' }}>
            Your synced index, every round, the hole-by-hole detail and your England Golf friends
            list all go. This cannot be undone.
          </p>
          <p style={{ fontSize: 12.5, lineHeight: 1.52, color: MUTE, margin: '10px 0 0' }}>
            Friends on clbhouz keep seeing your last known figures, with no new updates.
          </p>
        </div>

        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ ...LABEL, marginBottom: 7 }}>Type DELETE to confirm</div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isWorking}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Type DELETE to confirm"
            className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS}`}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 15,
              color: INK,
              fontFamily: FONT,
              outline: 'none',
              letterSpacing: '0.10em',
              fontWeight: 600,
              opacity: isWorking ? 0.5 : 1,
            }}
          />
        </div>

        <div style={{ marginTop: 18, padding: 16, borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              width: '100%',
              padding: '15px 18px',
              borderRadius: 12,
              border: 'none',
              background: canConfirm ? BAD : TRACK,
              color: canConfirm ? '#FFF' : DIM,
              fontSize: 14.5,
              fontWeight: 700,
              fontFamily: FONT,
              cursor: canConfirm ? 'pointer' : 'default',
            }}
          >
            {isWorking ? 'Deleting' : 'Delete everything'}
          </button>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleClose}
              disabled={isWorking}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: FONT,
                ...LABEL,
                color: MUTE,
                cursor: isWorking ? 'default' : 'pointer',
              }}
            >
              Keep my data
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
