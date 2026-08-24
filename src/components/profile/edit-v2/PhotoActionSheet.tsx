import React from 'react';
import { ImageIcon, Camera, Trash2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SF_STACK, INK, INK_45, SURFACE_RAISED, DANGER, HAIR } from '@/components/manage/ui';

interface PhotoActionSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  hasPhoto: boolean;
  removeLabel: string;
  onChoose: () => void;
  onTake: () => void;
  onRemove?: () => void;
}

function RowBtn({
  icon, label, onClick, danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: SF_STACK,
        fontSize: 15,
        fontWeight: 500,
        color: danger ? DANGER : INK,
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'inline-flex', width: 20, justifyContent: 'center' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export function PhotoActionSheet({
  open, onClose, title, hasPhoto, removeLabel,
  onChoose, onTake, onRemove,
}: PhotoActionSheetProps) {
  const fire = (fn: () => void) => () => { onClose(); setTimeout(fn, 60); };

  return (
    <BottomSheet open={open} onClose={onClose} variant="light">
      <div style={{ paddingTop: 4, paddingBottom: 12 }}>
        <div
          style={{
            textAlign: 'center',
            fontFamily: SF_STACK,
            fontSize: 12,
            fontWeight: 600,
            color: INK_45,
            padding: '4px 0 12px',
            letterSpacing: '-0.005em',
          }}
        >
          {title}
        </div>
        <div style={{ borderTop: `1px solid ${HAIR}` }}>
          <RowBtn icon={<ImageIcon size={18} strokeWidth={2} style={{ color: INK }} />} label="Choose photo" onClick={fire(onChoose)} />
          <RowBtn icon={<Camera size={18} strokeWidth={2} style={{ color: INK }} />} label="Take photo" onClick={fire(onTake)} />
          {hasPhoto && onRemove && (
            <RowBtn
              icon={<Trash2 size={18} strokeWidth={2} style={{ color: DANGER }} />}
              label={removeLabel}
              onClick={fire(onRemove)}
              danger
            />
          )}
        </div>
        <div style={{ height: 8, background: 'transparent' }} />
        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'block',
            width: 'calc(100% - 32px)',
            margin: '0 16px',
            padding: '12px 0',
            background: SURFACE_RAISED,
            border: `1px solid ${HAIR}`,
            borderRadius: 12,
            fontFamily: SF_STACK,
            fontSize: 15,
            fontWeight: 600,
            color: INK,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  );
}
