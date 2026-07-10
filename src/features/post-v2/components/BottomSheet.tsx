// Shared sheet chrome. Bottom sheet with hairline handle.

import { X } from 'lucide-react';
import { Z } from '@/config/zIndex';

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  fullHeight?: boolean;
}

export default function BottomSheet({ open, title, onClose, children, fullHeight }: Props) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: Z.sheet ?? 12003, display: 'flex', alignItems: 'flex-end', background: 'rgba(15,17,23,0.45)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '92vh',
          height: fullHeight ? '92vh' : undefined,
          background: '#F8FAFC',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.12)' }} />
        </div>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px 16px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1F2428' }}>{title}</div>
            <button onClick={onClose} style={{ background: 'transparent', border: 0, color: '#1F2428', cursor: 'pointer' }}><X size={20} /></button>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}
