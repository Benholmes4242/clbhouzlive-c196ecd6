import React from 'react';
import { Share2, MapPin } from 'lucide-react';
import { GAM } from '../../tokens';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';
import { materialNameForTier } from '../_shared/rarityPalette';

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
  const isTiered = item.kind === 'achievement' && item.tiers.length > 1;
  const material =
    isTiered && item.kind === 'achievement' && item.reachedTier >= 1
      ? materialNameForTier(item.reachedTier)
      : '';
  const shareLabel = isTiered && material ? `Share your ${material}` : 'Share';
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '12px 16px 16px',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        background: '#15171F',
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
        {shareLabel}
      </button>
      {isLegend && (
        <button
          type="button"
          onClick={onOpenCourse}
          style={{
            ...baseBtn,
            background: 'transparent',
            color: 'rgba(255,255,255,0.96)',
            border: '1px solid rgba(255,255,255,0.10)',
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
