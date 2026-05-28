import React from 'react';
import { Share2, MapPin } from 'lucide-react';
import { GAM } from '../../tokens';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';

interface Props {
  item: TrophyItem;
  onShare: () => void;
  onOpenCourse: () => void;
}

const baseBtn: React.CSSProperties = {
  flex: 1,
  height: 40,
  borderRadius: 12,
  fontFamily: GAM.FONT_GEIST,
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '0.04em',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  cursor: 'pointer',
  border: 'none',
};

export const DetailFooter: React.FC<Props> = ({ item, onShare, onOpenCourse }) => {
  const isLegend = item.kind === 'legend';
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '12px 16px 18px',
        borderTop: '0.5px solid var(--hcp-line)',
        background: 'var(--hcp-bg-0)',
        display: 'flex',
        gap: 10,
      }}
    >
      <button
        type="button"
        onClick={onShare}
        style={{ ...baseBtn, background: GAM.AMBER, color: '#1A1300' }}
      >
        <Share2 size={16} />
        Share
      </button>
      {isLegend && (
        <button
          type="button"
          onClick={onOpenCourse}
          style={{
            ...baseBtn,
            background: 'transparent',
            color: 'var(--hcp-t-100)',
            border: '1px solid var(--hcp-line-2)',
          }}
        >
          <MapPin size={16} />
          Open course
        </button>
      )}
    </div>
  );
};

export default DetailFooter;
