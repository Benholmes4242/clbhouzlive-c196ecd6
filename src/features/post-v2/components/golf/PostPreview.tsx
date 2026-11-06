/** PREVIEW — the REAL feed card (components/feed/FeedCard) rendered with the
 * draft, full screen, sliding in from the right. No hand-built lookalike:
 * actor, course, caption, media, hole chips and "with" names all go through
 * the card's own props. Back unmounts nothing in the composer underneath.
 */
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { FeedCard } from '@/components/feed/FeedCard';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
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
    creatorRelation: 'none', caption: d.caption,
    mediaItems: d.media.map((m, i) => ({
      id: m.id, type: m.type, width: m.naturalWidth ?? 1080, height: m.naturalHeight ?? 1350, displayOrder: i,
      ...(m.type === 'image'
        ? { imageUrl: m.previewUrl }
        : m.streamId
          // Edit mode: the real engine plays the stream exactly as in the feed.
          ? { hlsUrl: generateStreamHlsUrl(m.streamId), thumbnailUrl: m.posterUrl ?? undefined }
          // New local video: the blob plays through InlineVideo's local branch.
          : { mp4Url: m.previewUrl, thumbnailUrl: m.posterUrl ?? undefined }),
    })),
    createdAt: new Date().toISOString(), likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false,
    isLikedByMe: false, isFollowedByMe: true, courseName: d.course?.name, courseId: d.course?.id, courseCountry: d.course?.country ?? undefined,
  };
}

/** Local blob videos carry no naturalWidth/Height, so the card would frame
 * them at the 1080×1350 fallback and crop a portrait clip. When Preview
 * opens, probe each blob video's real dimensions from its metadata and hold
 * the card until every probe resolves — or 1500ms at most, keeping the
 * fallback for any still unknown. Dimensions stay local to the preview;
 * composer state is never written. */
function useProbedVideoDims(post: FeedPost, open: boolean): Record<string, { w: number; h: number }> | null {
  const [dims, setDims] = useState<Record<string, { w: number; h: number }> | null>(null);
  useEffect(() => {
    if (!open) { setDims(null); return; }
    const videos = post.mediaItems.filter((m) => m.type === 'video' && typeof (m as { mp4Url?: string }).mp4Url === 'string' && (m as { mp4Url?: string }).mp4Url!.startsWith('blob:'));
    if (videos.length === 0) { setDims({}); return; }
    let cancelled = false;
    const result: Record<string, { w: number; h: number }> = {};
    const pending = new Set(videos.map((v) => v.id));
    const finish = (id: string) => {
      pending.delete(id);
      if (pending.size === 0 && !cancelled) setDims({ ...result });
    };
    const timer = setTimeout(() => { for (const v of videos) finish(v.id); }, 1500);
    const probes: HTMLVideoElement[] = [];
    for (const v of videos) {
      const el = document.createElement('video');
      el.preload = 'metadata';
      el.muted = true;
      el.playsInline = true;
      el.src = (v as { mp4Url?: string }).mp4Url!;
      el.onloadedmetadata = () => {
        if (el.videoWidth > 0 && el.videoHeight > 0) result[v.id] = { w: el.videoWidth, h: el.videoHeight };
        finish(v.id);
      };
      el.onerror = () => finish(v.id);
      probes.push(el);
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      for (const el of probes) {
        el.onloadedmetadata = null;
        el.onerror = null;
        el.removeAttribute('src');
        try { el.load(); } catch { /* ignore */ }
      }
    };
  }, [open, post]);
  return dims;
}

export function PostPreview({ open, onBack, post, tags, pars, withPeople }: {
  open: boolean; onBack: () => void; post: FeedPost; tags: Record<string, ShotTag>; pars: ReadonlyMap<number, number>; withPeople: WithCandidate[];
}) {
  const videoDims = useProbedVideoDims(post, open);
  const shownPost = useMemo(() => {
    if (!videoDims) return post;
    let changed = false;
    const mediaItems = post.mediaItems.map((m) => {
      const d = videoDims[m.id];
      if (!d) return m;
      changed = true;
      return { ...m, width: d.w, height: d.h };
    });
    return changed ? { ...post, mediaItems } : post;
  }, [post, videoDims]);
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
        <button type="button" aria-label="Back" onClick={onBack} style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', background: 'transparent', border: 0, cursor: 'pointer' }}>
          <ChevronLeft size={22} color={GP.ink} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: GP.ink }}>Preview</span>
        <span style={{ width: 40 }} />
      </div>
      {open && videoDims && (
        <div style={{ marginTop: 8, pointerEvents: 'none' }}>
          <FeedCard
            post={shownPost} liked={false} likeCount={0} commentCount={0}
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
