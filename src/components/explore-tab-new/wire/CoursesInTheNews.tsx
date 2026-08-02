import { useTranslation } from 'react-i18next';

import {
  A,
  FIGS,
  LABEL,
  SANS,
  TITLE,
} from '@/features/courses/components/holes/analytical/tokens';
import { formatDayMonthShortGB, formatNumber } from '@/i18n/format';
import { CourseCommunityRating } from '@/components/courses/CourseCommunityRating';
import { ACTION_DEFAULTS } from '../hooks/useDiscoverWire';
import { MIN_NEWS_COURSES, type NewsCourse } from '../hooks/useNewsCourses';

/**
 * CoursesInTheNews — the photography returns here, and only here. Courses earn
 * a place by appearing in the wire, so the rail says "this course is live"
 * rather than "this course is pretty".
 *
 * Fixed 250x186, not an aspect ratio: with a ratio a two-line name on one card
 * and a one-line name on the next gives a ragged rail.
 */

const CARD_W = 250;
const CARD_H = 186;

interface Props {
  courses: NewsCourse[];
  isLoading: boolean;
  onCardPress: (course: NewsCourse) => void;
  onBrowseAll: () => void;
}

function RailSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 10, overflow: 'hidden', paddingBottom: 4 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: CARD_W,
            height: CARD_H,
            flex: 'none',
            borderRadius: 14,
            background: A.TRACK,
          }}
        />
      ))}
    </div>
  );
}

export function CoursesInTheNews({ courses, isLoading, onCardPress, onBrowseAll }: Props) {
  const { t } = useTranslation('courses');

  // Fewer than three distinct courses and the rail does not render: two cards
  // in a horizontal scroller looks broken (BRIEF_DISCOVER_REBUILD §3.2).
  if (!isLoading && courses.length < MIN_NEWS_COURSES) return null;

  return (
    <section style={{ fontFamily: SANS, ...FIGS }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '0 2px 10px',
        }}
      >
        <span style={TITLE}>{t('discover.newsTitle', 'Courses in the news')}</span>
        <button
          type="button"
          onClick={onBrowseAll}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            fontFamily: SANS,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            ...LABEL,
            color: A.AMBER_DEEP,
          }}
        >
          {t('discover.browseAllCourses', 'Browse all courses')}
          <span aria-hidden="true" style={{ fontWeight: 800 }}>
            {'\u203A'}
          </span>
        </button>
      </div>

      {isLoading ? (
        <RailSkeleton />
      ) : (
        <div
          className="scrollbar-hide"
          style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}
        >
          {courses.map((c) => {
            // Over a quarter the "why" line has to earn its place: one event
            // names itself and its date, several become a count.
            const why =
              c.eventCount > 1
                ? t('discover.nFeatsQuarter', {
                    defaultValue: '{{value}} feats this quarter',
                    count: c.eventCount,
                    value: formatNumber(c.eventCount),
                  })
                : [
                    t(c.why.actionKey, {
                      defaultValue: ACTION_DEFAULTS[c.why.actionKey] ?? '',
                      ...(c.why.actionParams ?? {}),
                    }),
                    formatDayMonthShortGB(c.why.at),
                  ]
                    .filter(Boolean)
                    .join(', ');
            return (
              <article
                key={c.courseId}
                style={{
                  position: 'relative',
                  width: CARD_W,
                  height: CARD_H,
                  flex: 'none',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: A.TRACK,
                }}
              >
                <button
                  type="button"
                  onClick={() => onCardPress(c)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  aria-label={c.name}
                >
                  {c.image && (
                    <img
                      src={c.image}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.34) 54%, rgba(0,0,0,0.04) 100%)',
                    }}
                  />

                  {why && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        maxWidth: CARD_W - 20,
                        borderRadius: 999,
                        padding: '4px 9px',
                        background: 'rgba(12,18,14,0.58)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        fontSize: 8.5,
                        fontWeight: 800,
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {why}
                    </span>
                  )}

                  <span style={{ position: 'absolute', left: 12, right: 12, bottom: 11 }}>
                    <span
                      style={{
                        fontSize: 15.5,
                        fontWeight: 800,
                        color: '#FFFFFF',
                        letterSpacing: '-0.015em',
                        lineHeight: 1.22,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        overflow: 'hidden',
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        marginTop: 3,
                        minWidth: 0,
                      }}
                    >
                      {c.place && (
                        <span
                          style={{
                            fontSize: 11.5,
                            color: 'rgba(255,255,255,0.72)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.place}
                        </span>
                      )}
                      {c.rating != null && (
                        <CourseCommunityRating rating={c.rating} size="sm" onDark />
                      )}
                      {c.ratingCount > 0 && (
                        <span
                          style={{
                            ...LABEL,
                            fontSize: 8,
                            color: 'rgba(255,255,255,0.6)',
                            flex: 'none',
                          }}
                        >
                          {t('discover.ratingCount', {
                            defaultValue: '{{value}} ratings',
                            count: c.ratingCount,
                            value: formatNumber(c.ratingCount),
                          })}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CoursesInTheNews;
