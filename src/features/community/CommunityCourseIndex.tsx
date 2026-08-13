import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { countByCourse } from './useCommunityRails';
import { HEADING_STYLE, SCROLLER_GUTTER } from './CommunityRail';

/**
 * BROWSE BY CLUB — a horizontal rail of at most TWELVE clubs.
 *
 * WAS a vertical directory of every club with media, sub-grouped by country. At
 * 57 clubs that list was longer than the rest of the page combined, and the app
 * already has a searchable course directory on the Courses tab. This page must
 * not be a second one, so the twelve cards here are a SUGGESTION, not an index:
 * no country headers, no expander, no "show all".
 *
 * ORDER is moment count desc, name breaking the tie so the order is stable.
 * THUMBNAIL is the club's top-ranked moment — the pool arrives rank-ordered, so
 * the first moment seen for a course is that club's best.
 */

const INK = '#0E1216';
const MUTE = '#A2A9B2';
const PANEL = '#EDF0F3';

/** Twelve clubs. A thirteenth would start to read as a list again. */
const MAX_CLUBS = 12;
const CARD_W = 118;

interface Props {
  moments: Moment[];
  title: string;
  countLabel: (n: number) => string;
}

interface ClubCard {
  courseId: string;
  name: string;
  count: number;
  thumbnail: string | null;
}

export function CommunityCourseIndex({ moments, title, countLabel }: Props) {
  const navigate = useNavigate();

  const clubs = useMemo<ClubCard[]>(() => {
    const counts = countByCourse(moments);
    const best = new Map<string, Moment>();
    for (const m of moments) if (!best.has(m.courseId)) best.set(m.courseId, m);

    const rows: ClubCard[] = [];
    for (const [courseId, count] of counts) {
      const top = best.get(courseId);
      // No name = nothing legible to put on a card.
      if (!top?.courseName) continue;
      rows.push({
        courseId,
        name: top.courseName,
        count,
        thumbnail: top.thumbnail ?? null,
      });
    }

    return rows
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, MAX_CLUBS);
  }, [moments]);

  if (clubs.length === 0) return null;

  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={HEADING_STYLE}>{title}</h2>

      <div style={{ display: 'flex', gap: 8, paddingBottom: 2, ...SCROLLER_GUTTER }}>
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
