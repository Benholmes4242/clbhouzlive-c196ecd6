/**
 * DeleteMessageSheet - Options sheet for deleting a message
 */

import { User, Users } from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { haptic } from '@/utils/haptics';

interface DeleteMessageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwnMessage: boolean;
  canDeleteForEveryone: boolean;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
}

export function DeleteMessageSheet({
  open,
  onOpenChange,
  isOwnMessage,
  canDeleteForEveryone,
  onDeleteForMe,
  onDeleteForEveryone,
}: DeleteMessageSheetProps) {
  const handleDeleteForMe = () => {
    haptic('medium');
    onDeleteForMe();
    onOpenChange(false);
  };

  const handleDeleteForEveryone = () => {
    haptic('medium');
    onDeleteForEveryone();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="!rounded-t-[24px] !p-0"
        style={{ background: '#fff', padding: '0 16px 32px' }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(15,23,42,0.12)',
            margin: '10px auto 0', flexShrink: 0,
          }}
        />

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 16px', marginBottom: 4, borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          <div style={{ width: 3, height: 10, background: '#DC2626', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#DC2626', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Delete Message
          </span>
        </div>

        <div style={{ padding: '0 16px' }}>
          {/* Delete for me */}
          <button
            onClick={handleDeleteForMe}
            className="w-full flex items-center text-left active:bg-[rgba(0,0,0,0.03)] transition-colors"
            style={{
              gap: 14, padding: '12px 16px', borderRadius: 16,
              border: 'none', background: 'transparent',
              cursor: 'pointer', marginBottom: 8,
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(15,23,42,0.05)' }}
            >
              <User size={18} style={{ color: '#64748b' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>Delete for me</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Only removed from your view — others can still see it</p>
            </div>
          </button>

          {/* Delete for everyone */}
          {isOwnMessage && (
            <button
              onClick={canDeleteForEveryone ? handleDeleteForEveryone : undefined}
              disabled={!canDeleteForEveryone}
              className="w-full flex items-center text-left transition-colors"
              style={{
                gap: 14, padding: '12px 16px', borderRadius: 16,
                border: 'none', background: 'transparent',
                cursor: canDeleteForEveryone ? 'pointer' : 'not-allowed',
                opacity: canDeleteForEveryone ? 1 : 0.45,
                marginBottom: 8,
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239,68,68,0.08)' }}
              >
                <Users size={18} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', margin: 0 }}>Delete for everyone</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                  {canDeleteForEveryone
                    ? 'Permanently removed for all participants'
                    : 'Only available within 1 hour of sending'
                  }
                </p>
              </div>
            </button>
          )}

          {/* Cancel button */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-full active:scale-[0.98] transition-transform"
            style={{
              padding: '13px 0', borderRadius: 14,
              border: '1px solid transparent',
              background: 'rgba(247,147,30,0.08)',
              fontSize: '14.5px', fontWeight: 600, color: '#F7931E',
              cursor: 'pointer', marginTop: 8,
            }}
          >
            Cancel
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
