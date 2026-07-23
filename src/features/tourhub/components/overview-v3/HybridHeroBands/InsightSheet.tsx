/**
 * InsightSheet — read-more sheet for the PhotoBand insight line.
 * Light-mode sheet on the app canvas. Reuses shared BottomSheet primitive
 * (drag-to-dismiss, ESC, scroll lock).
 */

import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  insight: string;
}

export function InsightSheet({ open, onClose, insight }: Props) {
  const { t } = useTranslation('tourhub');
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="insight-sheet-title">
      <div
        style={{
          padding: '4px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          maxHeight: '70dvh',
          overflowY: 'auto',
        }}
      >
        <div
          id="insight-sheet-title"
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#64748B',
          }}
        >
          {t('overview.photoBand.insightTitle')}
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: '#0F172A',
            whiteSpace: 'pre-wrap',
          }}
        >
          {insight}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            minHeight: 50,
            borderRadius: 14,
            background: '#0F172A',
            color: '#fff',
            fontSize: 15.5,
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          {'Close'}
        </button>
      </div>
    </BottomSheet>
  );
}

export default InsightSheet;
