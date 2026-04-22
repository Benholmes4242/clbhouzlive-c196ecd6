import { SectionHeader as ProShopSectionHeader } from './proshop/SectionHeader';

interface WatchSectionHeaderProps {
  eyebrow: string;
  title: string;
  /** Optional second-line subhead (Pro Shop standard). */
  sub?: string;
  onSeeAll?: () => void;
  /** Action label override; defaults to "See all". */
  seeAllLabel?: string;
  paddingTop?: number;
}

/**
 * Canonical Watch surface section header.
 *
 * Phase 1.5: this is now a thin shim over the Pro Shop `SectionHeader`
 * primitive so every rail on the Watch tab shares the same editorial
 * rhythm (kicker + title + subhead + amber action with chevron).
 *
 * Existing call sites that don't pass `sub` continue to work — they
 * just render kicker + title.
 */
export default function WatchSectionHeader({
  eyebrow,
  title,
  sub,
  onSeeAll,
  seeAllLabel = 'See all',
  paddingTop = 12,
}: WatchSectionHeaderProps) {
  return (
    <ProShopSectionHeader
      kicker={eyebrow}
      title={title}
      sub={sub}
      action={onSeeAll ? { label: seeAllLabel, onClick: onSeeAll } : undefined}
      paddingTop={paddingTop}
    />
  );
}

