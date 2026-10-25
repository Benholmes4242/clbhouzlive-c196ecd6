import type { MediaItem } from '@/components/media-system/types/media';
import './member-shot-credit.css';

/** Synthetic member-shot opens only; the chrome supplies its live carousel item. */
export function MemberShotCredit({ syntheticPosts, item }: { syntheticPosts: boolean; item?: MediaItem }) {
  if (!syntheticPosts || !item?.credit) return null;
  return <div data-member-shot-credit className="member-shot-credit">{item.credit}</div>;
}