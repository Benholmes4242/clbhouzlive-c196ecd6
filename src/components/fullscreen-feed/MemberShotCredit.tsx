import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import type { MediaItem } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VERDICT_KICKER } from '@/components/courses/course-detail/about/AboutSection';
import './member-shot-credit.css';

/** Synthetic-only active caption replaces the author row; never shows relative time.
 * Member identity is media-local, so a course avatar/initial can never leak in.
 * PF2_GUIDE: a shot that came from a live Everyone post carries sourcePostId and
 * gains one glass "View post ›" pill under the caption; the caption lifts 46px
 * only then, and the pill's tap never advances the slide. */
export function MemberShotCredit({ syntheticPosts, item, onViewPost }: { syntheticPosts: boolean; item?: MediaItem; onViewPost?: (postId: string) => void }) {
  const shot = item?.memberShot;
  if (!syntheticPosts || !shot) return null;
  const video = item?.type === 'video';
  const sourcePostId = shot.sourcePostId ?? null;
  return <>
    <div data-member-shot-credit className={`member-shot-caption${video ? ' member-shot-caption-video' : ''}${sourcePostId ? ' member-shot-caption-lifted' : ''}`}>
      <div className="member-shot-avatar">
        <SquircleAvatar key={item?.id} size={40} src={shot.avatarUrl} alt={shot.memberName}
          hairlineRing />
      </div>
      <div className="member-shot-text">
        <div style={VERDICT_KICKER}>{shot.kicker}</div>
        <div className="member-shot-title">{shot.title}</div>
        {shot.detail && <div className="member-shot-detail">{shot.detail}</div>}
        <div className="member-shot-credit"><InlineProMemberName userId={shot.memberUserId}>{shot.memberName}</InlineProMemberName>{shot.credit.startsWith(shot.memberName) ? shot.credit.slice(shot.memberName.length) : ''}</div>
      </div>
    </div>
    {sourcePostId && onViewPost && (
      <div className={`member-shot-viewpost${video ? ' member-shot-viewpost-video' : ''}`}>
        <button type="button" className="member-shot-viewpost-pill" aria-label="View post"
          onClick={(e) => { e.stopPropagation(); onViewPost(sourcePostId); }}>
          View post <em>›</em>
        </button>
      </div>
    )}
  </>;
}
