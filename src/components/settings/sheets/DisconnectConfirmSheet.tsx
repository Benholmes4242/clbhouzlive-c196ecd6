import React from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TITLE } from '@/lib/tokens/type';
import { SectionHeader } from '@/components/ui/SectionHeader';

const INK = '#0F172A';
const INK_55 = '#64748B';
const RED = '#DC2626';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
        className="p-0 rounded-t-[20px] border-0 max-h-[85dvh] overflow-auto"
        style={{
          fontFamily: FONT,
          color: INK,
          background: '#fff',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.18)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '4px 16px 12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 6 }}>
              <SectionHeader tier="standard" kicker="Disconnect" tone="danger" />
            </div>
            <h2 style={{ ...TITLE, margin: 0, lineHeight: 1.2 }}>
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
        <div style={{ padding: '4px 16px 8px' }}>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: INK_55, margin: '0 0 16px' }}>
            Your handicap and round history will be kept. You can reconnect any time to resume daily syncing.
          </p>

          <button
            onClick={onConfirm}
            disabled={isWorking}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: RED, color: '#fff', border: 'none',
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
