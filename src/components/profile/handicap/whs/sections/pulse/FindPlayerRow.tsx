import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight } from 'lucide-react';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  onOpen: () => void;
}

/**
 * Opens PlayerSearchSheet. Treated as a field, not a link: a chevron says
 * "opens", an arrow would say "go".
 */
export const FindPlayerRow: React.FC<Props> = ({ onOpen }) => {
  const { t } = useTranslation(['common']);
  return (
    <div style={{ padding: '10px 16px 0', fontFamily: FONT }}>
      <button
        onClick={onOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          width: '100%',
          boxSizing: 'border-box',
          background: 'var(--hcp-bg-2)',
          border: '1px solid var(--hcp-line)',
          borderRadius: 11,
          padding: '11px 13px',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: FONT,
        }}
      >
        <Search size={14} color="var(--hcp-t-40)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 400, color: 'var(--hcp-t-60)' }}>
          {t('common:handicap.pulse.findPlayer')}
        </span>
        <ChevronRight size={13} color="var(--hcp-t-40)" style={{ flexShrink: 0 }} />
      </button>
    </div>
  );
};

export default FindPlayerRow;
