import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Eyebrow } from '@/components/explore-tab-new/courseled/tokens';
import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';

/**
 * BROWSE BY CLUB — LAST on the page now (BRIEF_COMMUNITY_PAGE_REBUILD S2.1,
 * S5.4). It covers only TAGGED content, which is six posts in 242, so it sits
 * beneath everything and carries an honest subline rather than pretending to be
 * an index of the library.
 *
 * At most TWELVE clubs, count desc with name breaking the tie so the order is
 * stable. The thumbnail is the newest media seen for that club — the pool
 * arrives newest-first.
 */

const INK = '#0E1216';
const MUTE = '#A2A9B2';
const PANEL = '#EDF0F3';

/** Twelve clubs. A thirteenth would start to read as a list again. */
const MAX_CLUBS = 12;
const CARD_W = 118;

interface Props {
  items: CommunityLibraryItem[];
  title: string;
  subline: string;
  countLabel: (n: number) => string;
}

interface ClubCard {
  courseId: string;
  name: string;
  count: number;
  thumbnail: string | null;
}

export function CommunityCourseIndex({ items, title, subline, countLabel }: Props) {
  const navigate = useNavigate();

  const clubs = useMemo<ClubCard[]>(() => {
    const byCourse = new Map<string, ClubCard>();
    for (const item of items) {
      // No id or no legible name = nothing to put on a card.
      if (!item.courseId || !item.courseName) continue;
      const existing = byCourse.get(item.courseId);
      if (existing) {
        existing.count += 1;
        continue;
      }
      byCourse.set(item.courseId, {
        courseId: item.courseId,
        name: item.courseName,
        count: 1,
        thumbnail: item.thumbnail ?? null,
      });
    }
    return [...byCourse.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, MAX_CLUBS);
  }, [items]);

  if (clubs.length === 0) return null;

  return (
    <section style={{ marginBottom: 26 }}>
      {/* Eyebrow's own padding is 0 2px because Discover callers own their
          gutter. Rendered bare it looks pushed left, so this page supplies the
          16px itself and the icon lands on the first tile's left edge. */}
      <div style={{ padding: '0 16px' }}>
        <Eyebrow icon={MapPin} subline={subline}>
          {title}
        </Eyebrow>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '0 16px 2px',
          willChange: 'transform',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {clubs.map((c) => (
          <button
            key={c.courseId}
            type="button"
            onClick={() => navigate(`/courses/${c.courseId}?tab=media`)}
            style={{
              width: CARD_W,
              flex: 'none',
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: CARD_W,
                height: CARD_W,
                borderRadius: 12,
                overflow: 'hidden',
                background: PANEL,
              }}
            >
              {c.thumbnail && (
                <img
                  src={c.thumbnail}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: INK,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.25,
              }}
            >
              {c.name}
            </div>

            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                fontWeight: 700,
                color: MUTE,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {countLabel(c.count)}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default CommunityCourseIndex;
