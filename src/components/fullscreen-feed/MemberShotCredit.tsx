import type { MediaItem } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VERDICT_KICKER } from '@/components/courses/course-detail/about/AboutSection';
import './member-shot-credit.css';

/** Synthetic-only active caption replaces the author row; never shows relative time.
 * Member identity is media-local, so a course avatar/initial can never leak in. */
export function MemberShotCredit({ syntheticPosts, item }: { syntheticPosts: boolean; item?: MediaItem }) {
  const shot = item?.memberShot;
  if (!syntheticPosts || !shot) return null;
  return <div data-member-shot-credit className={`member-shot-caption${item?.type === 'video' ? ' member-shot-caption-video' : ''}`}>
    <div className="member-shot-avatar">
      <SquircleAvatar key={item?.id} size={40} src={shot.avatarUrl} alt={shot.memberName}
        fallback={shot.memberName.trim().charAt(0).toUpperCase() || '?'} hairlineRing />
    </div>
    <div className="member-shot-text">
      <div style={VERDICT_KICKER}>{shot.kicker}</div>
      <div className="member-shot-title">{shot.title}</div>
      {shot.detail && <div className="member-shot-detail">{shot.detail}</div>}
      <div className="member-shot-credit">{shot.credit}</div>
    </div>
  </div>;
}
