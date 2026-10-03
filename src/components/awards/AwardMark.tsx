/**
 * AWARD MARK — the one place the award rectangle is constructed: a rounded
 * rectangle in the tier's medal colour with a lucide Medal in INK. The
 * scorecard sheet (RoundResults), Explore's AWARDS cell and the Scores pill all
 * draw this, so they cannot drift apart. Sizes live here, never at call sites.
 * The marks are medals (medalTierTone); the things they stand for are awards.
 */
import { Crown, Medal } from 'lucide-react';
import { INK } from '@/features/tourhub/_shared/tokens';
import { medalTierTone } from '@/lib/tokens/medals';

export type AwardTier = 'gold' | 'silver' | 'bronze';
export type AwardMarkSize = 'sheet' | 'row' | 'pill';

export const AWARD_MARK_SIZES = {
  sheet: { w: 22, h: 26, radius: 6, icon: 14 },
  row: { w: 15, h: 18, radius: 5, icon: 10 },
  pill: { w: 12, h: 14, radius: 4, icon: 8 },
} as const;

/** glyph 'crown' is the record book's lucide Crown — for crowns held. */
export function AwardMark({ tier, size, ring, style, glyph = 'medal' }: { tier: AwardTier; size: AwardMarkSize; ring?: string; style?: React.CSSProperties; glyph?: 'medal' | 'crown' }) {
  const s = AWARD_MARK_SIZES[size];
  const Glyph = glyph === 'crown' ? Crown : Medal;
  return (
    <span
      aria-hidden="true"
      style={{
        width: s.w, height: s.h, borderRadius: s.radius, display: 'grid', placeItems: 'center', flex: 'none',
        background: medalTierTone(tier), color: INK,
        ...(ring ? { boxShadow: `0 0 0 1.5px ${ring}` } : null),
        ...style,
      }}
    >
      <Glyph size={s.icon} strokeWidth={2.25} />
    </span>
  );
}

export default AwardMark;
