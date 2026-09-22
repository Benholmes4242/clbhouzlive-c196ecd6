import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';

/** Full-width long-form card for the dedicated media wall. The Amateur shelf
 * keeps its compact VideoRow because the two surfaces have different jobs. */
export function LibraryVideoCard({ item, onPress }: { item: CommunityLibraryItem; onPress: () => void }) {
  const title = item.title?.trim() || item.courseName || item.displayName;
  const creator = item.displayName?.trim() ?? '';

  return (
    <button
      type="button"
      onClick={onPress}
      style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', color: A.INK, textAlign: 'left', cursor: 'pointer', fontFamily: SANS }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: r.md, background: A.PANEL }}>
        {item.thumbnail && (
          <img src={item.thumbnail} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <GlassDurationBadge seconds={item.duration} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 11 }}>
        <SquircleAvatar
          size={34}
          src={item.avatarUrl}
          alt={creator}
          userId={item.userId}
          hairlineRing
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {title}
          </div>
          {creator && (
            <div data-library-video-creator style={{ marginTop: 3, color: A.MUTE, fontSize: 12, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {creator}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default LibraryVideoCard;