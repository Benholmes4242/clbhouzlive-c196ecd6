// Shared sheet chrome. Bottom sheet with hairline grabber, 17/800 title.
// Aligned to messaging-v2 sheet polish.

import { X } from 'lucide-react';
import { Z } from '@/config/zIndex';

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  fullHeight?: boolean;
  /** Extra bottom padding on the backdrop; lifts the sheet above the iOS keyboard. */
  bottomOffset?: number;
}

export default function BottomSheet({ open, title, onClose, children, fullHeight, bottomOffset }: Props) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.sheet ?? 12003,
        display: 'flex',
        alignItems: 'flex-end',
        background: 'rgba(15,17,23,0.45)',
        paddingBottom: bottomOffset ? `${bottomOffset}px` : undefined,
        transition: 'padding-bottom 180ms cubic-bezier(.2,.8,.2,1)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '92vh',
          height: fullHeight ? '92vh' : undefined,
          background: '#F8FAFC',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -8px 24px rgba(15,17,23,0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.14)' }} />
        </div>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 12px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: -0.2 }}>{title}</div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'transparent', border: 0, color: '#1F2428', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}
