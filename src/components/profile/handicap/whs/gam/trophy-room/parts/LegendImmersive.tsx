/**
 * LegendImmersive
 *
 * Minimal full-screen detail view for legend rows. Same presentation
 * grammar as AchievementImmersive: portalled overlay, radial bloom,
 * blur, tap anywhere to close.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { renderBadgeIcon } from '../../badgeIcons';
import { GAM } from '../../tokens';
import type { LegendCategory } from '@/lib/gam/types';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';

interface Props {
  item: Extract<TrophyItem, { kind: 'legend' }>;
  onClose: () => void;
  onShare: () => void;
}

// Reuse the amber legendary treatment used by LegendCard.
const LEGEND_COLOR = GAM.AMBER;

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '247,147,30';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

const LEGEND_CATEGORY_LABEL: Record<LegendCategory, string> = {
  lowest_gross_90d: 'Lowest gross (90d)',
  lowest_gross_all_time: 'Lowest gross',
  best_score_diff_90d: 'Best differential (90d)',
  best_score_diff_all_time: 'Best differential',
  most_birdies_90d: 'Most birdies (90d)',
  most_birdies_all_time: 'Most birdies',
  best_stableford_90d: 'Best Stableford (90d)',
  best_stableford_all_time: 'Best Stableford',
  most_eagles_90d: 'Most eagles (90d)',
  most_eagles_all_time: 'Most eagles',
  most_aces_90d: 'Most hole-in-ones (90d)',
  most_aces_all_time: 'Most hole-in-ones',
  most_albatrosses_90d: 'Most albatrosses (90d)',
  most_albatrosses_all_time: 'Most albatrosses',
  most_rounds_90d: 'Most rounds (90d)',
  most_rounds_all_time: 'Most rounds',
};

export const LegendImmersive: React.FC<Props> = ({ item, onClose, onShare }) => {
  const rgb = hexToRgb(LEGEND_COLOR);
  const label = LEGEND_CATEGORY_LABEL[item.category] ?? item.name;
  const held = (() => {
    try {
      return format(new Date(item.attainedAt), 'MMM d, yyyy');
    } catch {
      return '';
    }
  })();

  const overlay = (
    <div
      role="dialog"
      aria-label={label}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        // Must clear: BottomSheet surface (~1401, from src/components/ui/BottomSheet.tsx),
        // Z.sheet (12003), Z.toast (12000), and Z.header (1000, ChromeIsland).
        // Kept below Z.logHud (13000) so the perf debug pill still overlays.
        zIndex: 12500,
        background: `radial-gradient(ellipse 120% 90% at 50% 16%, rgba(${rgb},0.14) 0%, rgba(${rgb},0.05) 32%, #0A0B0D 62%), #0A0B0D`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontFamily: GAM.FONT_GEIST,
        color: 'rgba(255,255,255,0.96)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        aria-label="Share"
        onClick={(e) => {
          e.stopPropagation();
          onShare();
        }}
        style={{
          position: 'absolute',
          top: 'max(env(safe-area-inset-top, 0px), 20px)',
          right: 18,
          width: 36,
          height: 36,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <Share2 size={16} />
      </button>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: LEGEND_COLOR,
            filter: `drop-shadow(0 0 24px ${LEGEND_COLOR}66) drop-shadow(0 0 8px ${LEGEND_COLOR}88)`,
          }}
        >
          {renderBadgeIcon(item.iconKey, 96, LEGEND_COLOR, 1.4)}
        </div>

        <div
          style={{
            fontSize: 54,
            fontWeight: 200,
            lineHeight: 1,
            color: 'rgba(255,255,255,0.98)',
            letterSpacing: '-0.03em',
            ...GAM.TABULAR,
          }}
        >
          {item.formattedValue}
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'rgba(255,255,255,0.96)',
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.4,
            ...GAM.TABULAR,
          }}
        >
          #{item.rank} at {item.courseName}
        </div>

        {held && (
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              ...GAM.TABULAR,
            }}
          >
            Held since {held}
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          textAlign: 'center',
          fontSize: 10.5,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Tap anywhere to close
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(overlay, document.body) : null;
};

export default LegendImmersive;
