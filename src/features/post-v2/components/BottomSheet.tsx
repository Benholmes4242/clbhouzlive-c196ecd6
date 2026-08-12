// Shared sheet chrome. Bottom sheet with hairline grabber, 17/800 title.
// Aligned to messaging-v2 sheet polish.

import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Z } from '@/config/zIndex';
import { CT } from '@/features/_shared/composerTokens';
import { TITLE } from '@/lib/tokens/type';

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  fullHeight?: boolean;
  /** Fixed height (e.g. '75dvh'). Sheet won't grow/shrink with content. */
  fixedHeight?: string;
  /** Extra bottom padding on the backdrop; lifts the sheet above the iOS keyboard. */
  bottomOffset?: number;
}

export default function BottomSheet({ open, title, onClose, children, fullHeight, fixedHeight, bottomOffset }: Props) {
  const { t } = useTranslation('common');
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.sheet ?? 12003,
        display: 'flex',
        alignItems: 'flex-end',
        background: 'linear-gradient(to bottom, rgba(15,17,23,0.62) 0px, rgba(15,17,23,0.45) calc(env(safe-area-inset-top, 47px) + 8px), rgba(15,17,23,0.45) 100%)',
        paddingBottom: bottomOffset ? `${bottomOffset}px` : undefined,
        transition: 'padding-bottom 180ms cubic-bezier(.2,.8,.2,1)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: fixedHeight ?? (fullHeight ? '92vh' : '85dvh'),
          height: fixedHeight ?? (fullHeight ? '92vh' : 'auto'),
          background: CT.canvas,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -8px 24px rgba(15,17,23,0.18)',
          paddingBottom: (fullHeight || fixedHeight) ? undefined : 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.14)' }} />
        </div>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
            <div style={{ ...TITLE, color: CT.ink }}>{title}</div>
            <button
              onClick={onClose}
              aria-label={t('action.close')}
              style={{ background: 'transparent', border: 0, color: CT.ink, cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div style={{ flex: (fullHeight || fixedHeight) ? 1 : '0 1 auto', overflow: 'auto', minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}
