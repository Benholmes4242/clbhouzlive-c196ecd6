import { Heart } from 'lucide-react';

import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { formatRelativeRounded } from '@/i18n/format';
import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useMediaImpression, type MediaTrackTarget } from '@/utils/mediaEngagement';

/**
 * LATEST VIDEOS ROW (BRIEF_COMMUNITY_PAGE_REBUILD, reference frame).
 *
 * Long form is FRAMED LANDSCAPE, so the thumbnail is 16:9 — but on a
 * destination the section is a LIST, not a stack of full-width tiles: a member
 * scanning long form wants titles, and a 132px thumbnail beside a two-line
 * title puts four rows where one tile used to sit.
 *
 * Rows are separated by a hairline, never by a card. Zero likes render nothing.
 */

const INK = '#0E1216';
const MUTE = '#5B6572';
const DIM = '#A2A9B2';
const HAIR = '#EDF0F3';
const PANEL = '#EDF0F3';
const NUM = { fontVariantNumeric: 'tabular-nums lining-nums' as const };

interface Props {
  item: CommunityLibraryItem;
  first: boolean;
  onPress: (item: CommunityLibraryItem) => void;
  /** Media engagement target. Absent = the row reports nothing. */
  track?: MediaTrackTarget;
}

export function CommunityVideoRow({ item, first, onPress, track }: Props) {
  const impressionRef = useMediaImpression(track);
  const open = () => {
    if (track) analyticsEvents.media.opened(track);
    onPress(item);
  };
  const hasTitle = item.title.length > 0;
  const title = hasTitle ? item.title : item.displayName;
  const when = formatRelativeRounded(item.createdAt);
  const meta = hasTitle ? `${item.displayName} · ${when}` : when;

  return (
    <div
      ref={impressionRef}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      style={{
        display: 'flex',
        gap: 11,
        padding: '11px 0',
        borderTop: first ? 'none' : `1px solid ${HAIR}`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'relative',
          flex: '0 0 132px',
          aspectRatio: '16 / 9',
          borderRadius: 10,
          overflow: 'hidden',
          background: PANEL,
        }}
      >
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt=""
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 5,
            bottom: 5,
            padding: '2px 5px',
            borderRadius: 5,
            background: 'rgba(10,14,10,0.72)',
            color: '#FFFFFF',
            fontSize: 9.5,
            fontWeight: 700,
            ...NUM,
          }}
        >
          {formatDuration(item.durationSeconds)}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.012em',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt=""
              loading="lazy"
              style={{
                width: 15,
                height: 15,
                borderRadius: '34%',
                objectFit: 'cover',
                flexShrink: 0,
                boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.10)',
              }}
            />
          ) : (
            <span
              aria-hidden
              style={{
                width: 15,
                height: 15,
                borderRadius: '34%',
                flexShrink: 0,
                background: PANEL,
              }}
            />
          )}
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11,
              color: MUTE,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {meta}
          </span>
          {item.likeCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                color: DIM,
                fontSize: 10.5,
                fontWeight: 700,
                ...NUM,
              }}
            >
              <Heart size={11} strokeWidth={2.4} />
              {item.likeCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommunityVideoRow;
