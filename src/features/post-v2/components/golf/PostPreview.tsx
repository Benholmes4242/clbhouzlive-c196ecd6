/** PREVIEW — the REAL feed card (components/feed/FeedCard) rendered with the
 * draft, full screen, sliding in from the right. No hand-built lookalike:
 * actor, course, caption, media, hole chips and "with" names all go through
 * the card's own props. Back unmounts nothing in the composer underneath.
 */
import { useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { FeedCard } from '@/components/feed/FeedCard';
import type { FeedPost } from '@/components/media-system/types/media';
import { holeMediaKey } from '@/lib/courseMedia/holePhotoData';
import type { StageCourse, StageMediaItem } from '../../hooks/useStageComposer';
import { isHoleTag, type ShotTag, type SlideTag, type WithCandidate } from '../../lib/golfPostRules';
import { GP } from './golfPageTokens';

const noop = () => {};

export function buildDraftFeedPost(d: {
  caption: string; media: StageMediaItem[]; course: StageCourse | null;
  actor: { id: string; type: 'personal' | 'business'; name: string; avatarUrl: string | null; username: string | null }; userId: string;
}): FeedPost {
  return {
    id: 'draft-preview', userId: d.userId, actorType: d.actor.type, actorId: d.actor.id,
    username: d.actor.username ?? '', displayName: d.actor.name, avatarUrl: d.actor.avatarUrl ?? '', isVerified: false,
    creatorRelation: 'self' as FeedPost['creatorRelation'], caption: d.caption,
    mediaItems: d.media.map((m, i) => ({
      id: m.id, type: m.type, width: m.naturalWidth ?? 1080, height: m.naturalHeight ?? 1350, displayOrder: i,
      ...(m.type === 'image' ? { imageUrl: m.previewUrl } : { mp4Url: m.previewUrl, thumbnailUrl: m.posterUrl ?? undefined }),
    })),
    createdAt: new Date().toISOString(), likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false,
    isLikedByMe: false, isFollowedByMe: true, courseName: d.course?.name, courseId: d.course?.id, courseCountry: d.course?.country ?? undefined,
  };
}

export function PostPreview({ open, onBack, post, tags, pars, withPeople }: {
  open: boolean; onBack: () => void; post: FeedPost; tags: Record<string, ShotTag>; pars: ReadonlyMap<number, number>; withPeople: WithCandidate[];
}) {
  const slideTags = useMemo(() => {
    const m = new Map<string, SlideTag>();
    for (const item of post.mediaItems) {
      const t = tags[item.id];
      if (!t) continue;
      m.set(holeMediaKey(item), isHoleTag(t) ? { hole: t.hole, par: pars.get(t.hole) ?? null } : { place: t.place });
    }
    return m;
  }, [post.mediaItems, tags, pars]);
  return (
    <div data-testid="post-preview" aria-hidden={!open} style={{
      position: 'fixed', inset: 0, background: GP.canvas, zIndex: 1, overflowY: 'auto',
      transform: open ? 'none' : 'translateX(100%)', transition: 'transform 280ms cubic-bezier(.2,.8,.2,1)',
      pointerEvents: open ? 'auto' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'max(env(safe-area-inset-top), 47px) 16px 6px' }}>
        <button type="button" aria-label="Back" onClick={onBack} style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'transparent', border: 0, cursor: 'pointer' }}>
          <ChevronLeft size={22} color={GP.ink} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: GP.ink }}>Preview</span>
        <span style={{ width: 40 }} />
      </div>
      {open && (
        <div style={{ marginTop: 8, pointerEvents: 'none' }}>
          <FeedCard
            post={post} liked={false} likeCount={0} commentCount={0}
            onLike={noop} onComment={noop} onShare={noop} onOpenMedia={noop} onProfile={noop}
            isActive mountVideo
            playedWith={withPeople.map((p) => ({ userId: p.id, name: p.name, avatarUrl: p.avatarUrl }))}
            slideTags={slideTags}
          />
        </div>
      )}
    </div>
  );
}
