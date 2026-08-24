import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { A, Eyebrow } from '@/components/explore-tab-new/courseled/tokens';
import { SURFACE } from '@/lib/tokens/surface';
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

const LIGHT = { ink: '#0E1216', mute: '#A2A9B2', panel: '#EDF0F3' } as const;
/**
 * DARK IS FOR DISCOVER, WHICH IMPORTS THIS SECTION RATHER THAN COPYING IT
 * (BRIEF_DISCOVER_ABSORBS_COMMUNITY §2). The brief states these components are
 * already dark; they are NOT — every one of them was written against
 * /community's #F8FAFC canvas and carries its own light hexes. A tone switch is
 * the smallest change that lets ONE component serve both surfaces, which is the
 * outcome the brief actually asked for. Light stays the default so /community
 * renders byte-for-byte what it renders today.
 */
const DARK = { ink: SURFACE.dark.ink, mute: SURFACE.dark.mute, panel: A.PANEL } as const;

/** Twelve clubs. A thirteenth would start to read as a list again. */
const MAX_CLUBS = 12;
const CARD_W = 118;

interface Props {
  items: CommunityLibraryItem[];
  title: string;
  /** Optional: Discover dropped section sublines (BRIEF_DISCOVER_ONE_PAGE §5). */
  subline?: string;
  countLabel: (n: number) => string;
  /** Discover is dark. Default light = /community, unchanged. */
  tone?: 'light' | 'dark';
  /**
   * TRUE ON DISCOVER: the caller already owns the page gutter and the 28px
   * section seam, so this section supplies neither and cannot double either.
   */
  embedded?: boolean;
}

interface ClubCard {
  courseId: string;
  name: string;
  count: number;
  thumbnail: string | null;
}

export function CommunityCourseIndex({
  items,
  title,
  subline,
  countLabel,
  tone = 'light',
  embedded = false,
}: Props) {
  const navigate = useNavigate();
  const C = tone === 'dark' ? DARK : LIGHT;

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
    <section style={{ marginBottom: embedded ? 0 : 26 }}>
      {/* Eyebrow's own padding is 0 2px because Discover callers own their
          gutter. Rendered bare it looks pushed left, so this page supplies the
          16px itself and the icon lands on the first tile's left edge. */}
      <div style={{ padding: embedded ? 0 : '0 14px' }}>
        <Eyebrow subline={subline || undefined}>
          {title}
        </Eyebrow>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: embedded ? '0 0 2px' : '0 16px 2px',
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
                background: C.panel,
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
                color: C.ink,
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
                color: C.mute,
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
