import type { ReactNode } from 'react';
import { SectionHeader as ProShopSectionHeader } from './proshop/SectionHeader';

interface WatchSectionHeaderProps {
  eyebrow?: string;
  title: string;
  /** Optional second-line subhead (Pro Shop standard). */
  sub?: string;
  onSeeAll?: () => void;
  /** Action label override; defaults to "See all". */
  seeAllLabel?: string;
  paddingTop?: number;
  /** Optional left-aligned section mark (icon/glyph). */
  mark?: ReactNode;
  /** Override kicker tone; defaults to slate via ProShopSectionHeader. */
  kickerColor?: 'amber' | 'emerald' | 'slate';
}

/**
 * Canonical Watch surface section header — thin shim over the Pro Shop
 * `SectionHeader` primitive. Phase 1 warmth pass adds `mark` and
 * `kickerColor` passthroughs for bespoke landing-section identity.
 */
export default function WatchSectionHeader({
  eyebrow,
  title,
  sub,
  onSeeAll,
  seeAllLabel = 'See all',
  paddingTop,
  mark,
  kickerColor,
}: WatchSectionHeaderProps) {
  return (
    <ProShopSectionHeader
      kicker={eyebrow}
      kickerColor={kickerColor}
      title={title}
      sub={sub}
      action={onSeeAll ? { label: seeAllLabel, onClick: onSeeAll } : undefined}
      paddingTop={paddingTop}
      mark={mark}
    />
  );
}
