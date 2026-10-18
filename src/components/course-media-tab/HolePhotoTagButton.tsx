import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { FeedPost } from '@/components/media-system/types/media';
import { canTagHolePhoto } from '@/lib/courseMedia/holePhotoData';

export function HolePhotoTagButton({ post, memberId, holeCount, taggedUrls, onTag }: {
  post: FeedPost; memberId: string | undefined; holeCount: number | null;
  taggedUrls: ReadonlySet<string>; onTag: (post: FeedPost) => void;
}) {
  if (!canTagHolePhoto(post, memberId, holeCount, taggedUrls)) return null;
  return <Button variant="ghost" size="sm" aria-label="Tag photograph" className="absolute right-[5px] bottom-[5px] z-10 h-auto min-h-0 rounded-full px-2 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.06em]"
    style={{ background: A.INK, color: A.CANVAS }}
    onClick={event => { event.stopPropagation(); onTag(post); }}>Tag a hole</Button>;
}