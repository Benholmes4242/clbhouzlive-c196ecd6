import React from 'react';
import { Link2Off, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isWorking: boolean;
}

export default function DisconnectConfirmSheet({ open, onClose, onConfirm, isWorking }: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v && !isWorking) onClose(); }}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 rounded-t-[20px] border-0 max-h-[90dvh] overflow-auto"
        style={{
          fontFamily: FONT,
          color: INK,
          background: '#fff',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.18)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '4px 20px 12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Link2Off size={12} color={AMBER} strokeWidth={2.4} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER }}>
                Disconnect
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 }}>
              Disconnect England Golf?
            </h2>
          </div>
          <button
            onClick={onClose}
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

        {/* Body */}
        <div style={{ padding: '4px 20px 8px' }}>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: INK_55, margin: '0 0 20px' }}>
            Your handicap and round history will be kept. You can reconnect any time to resume daily syncing.
          </p>

          <button
            onClick={onConfirm}
            disabled={isWorking}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: AMBER, color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 600, fontFamily: FONT,
              cursor: isWorking ? 'default' : 'pointer',
              opacity: isWorking ? 0.6 : 1, marginBottom: 8,
            }}
          >
            {isWorking ? 'Disconnecting…' : 'Disconnect'}
          </button>

          <button
            onClick={onClose}
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
