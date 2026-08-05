import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ACTION_DEFAULTS, UNIT_DEFAULTS, type WireEvent } from '../hooks/useDiscoverWire';
import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useCourseLatestRatings } from './hooks/useCourseLatestRatings';
import { useFriendIdSet } from './hooks/useFriendIdSet';
import { A, CARD_SHELL, Eyebrow, ImageChip, InkAction, LABEL, NUMF, SANS, SCRIM_STRONG } from './tokens';

/**
 * Section 2 — AROUND THE WORLD (BRIEF, section 2).
 *
 * The main feed and the only vertical one. Events are GROUPED BY COURSE: the
 * card is the course, the lines beneath are what happened there, newest first.
 * Five courses, then "Show N more courses" reveals the rest in place.
 *
 * PRIVACY: an actor is named only when the event is the viewer's own or the
 * actor is a friend. Everyone else reads "a member" — the course is the story,
 * not the stranger.
 */

const PAGE = 5;
const DOT = '\u00B7';

interface CourseGroup {
  courseId: string;
  courseName: string | null;
  courseImage: string | null;
  at: string;
  events: WireEvent[];
}

interface Props {
  events: WireEvent[];
  isLoading: boolean;
  userId: string | undefined;
  scopeKey: string;
  pills: React.ReactNode;
  onCoursePress: (courseId: string) => void;
  onExpand?: (revealed: number) => void;
}

function relativeWhen(iso: string, t: (k: string, o?: any) => string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return t('discover.when.today', 'Today');
  if (days === 1) return t('discover.when.yesterday', 'Yesterday');
  if (days < 7) return t('discover.when.daysAgo', { defaultValue: '{{count}} days ago', count: days });
  if (days < 14) return t('discover.when.lastWeek', 'Last week');
  if (days < 60)
    return t('discover.when.weeksAgo', { defaultValue: '{{count}}w ago', count: Math.floor(days / 7) });
  return t('discover.when.monthsAgo', {
    defaultValue: '{{count}}mo ago',
    count: Math.max(1, Math.round(days / 30)),
  });
}

export function AroundTheWorld({
  events,
  isLoading,
  userId,
  scopeKey,
  pills,
  onCoursePress,
  onExpand,
}: Props) {
  const { t } = useTranslation('courses');
  const [expanded, setExpanded] = useState(false);
  const { data: friendIds } = useFriendIdSet(userId);

  const groups = useMemo<CourseGroup[]>(() => {
    const byCourse = new Map<string, CourseGroup>();
    for (const e of events) {
      if (!e.courseId) continue;
      const g = byCourse.get(e.courseId);
      if (g) {
        if (g.events.length < 3) g.events.push(e);
        if (e.at > g.at) g.at = e.at;
      } else {
        byCourse.set(e.courseId, {
          courseId: e.courseId,
          courseName: e.courseName,
          courseImage: e.courseImage,
          at: e.at,
          events: [e],
        });
      }
    }
    return [...byCourse.values()].sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [events]);

  const shown = expanded ? groups : groups.slice(0, PAGE);
  const courseIds = useMemo(() => shown.map((g) => g.courseId), [shown]);
  const { data: meta } = useCourseCardMeta(courseIds);
  const { data: ratings } = useCourseLatestRatings(courseIds);

  const actorLabel = (e: WireEvent): string => {
    if (e.isOwn) return t('discover.wire.you', 'You');
    if (e.userId && friendIds?.has(e.userId)) return e.actorName;
    return t('discover.aMember', 'A member');
  };

  if (isLoading) {
    return (
      <section key={scopeKey}>
        <Eyebrow>{t('discover.aroundTheWorld', 'Around the world')}</Eyebrow>
        {pills}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ ...CARD_SHELL, height: 190, background: A.TRACK }} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <Eyebrow aside={<span style={LABEL}>{t('discover.last90', 'Last 90 days')}</span>}>
        {t('discover.aroundTheWorld', 'Around the world')}
      </Eyebrow>

      {pills}

      {groups.length === 0 ? (
        <div style={{ ...CARD_SHELL, padding: '18px 16px' }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, color: A.MUTE }}>
            {t(
              'discover.emptyRegion',
              'Nothing logged here in the last 90 days. Try another region.',
            )}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map((g) => {
            const m = meta?.get(g.courseId);
            const rating = ratings?.get(g.courseId);
            const lines: Array<{ text: string; fig: string | null; tone?: string }> = g.events.map(
              (e) => ({
                text: `${actorLabel(e)} ${DOT} ${t(e.actionKey, {
                  defaultValue: ACTION_DEFAULTS[e.actionKey] ?? '',
                  ...(e.actionParams ?? {}),
                })}`,
                fig: e.figure ?? null,
                tone: e.figureTone,
              }),
            );
            if (rating) {
              lines.push({
                text: t('discover.ratedByMember', {
                  defaultValue: 'Rated {{value}} by a member',
                  value: rating.rating.toFixed(1),
                }),
                fig: rating.rating.toFixed(1),
              });
            }

            return (
              <button
                key={g.courseId}
                type="button"
                onClick={() => onCoursePress(g.courseId)}
                style={{
                  ...CARD_SHELL,
                  padding: 0,
                  textAlign: 'left',
                  fontFamily: SANS,
                  cursor: 'pointer',
                }}
              >
                <CourseImageFallback
                  courseId={g.courseId}
                  courseName={m?.name ?? g.courseName}
                  imageUrl={m?.imageUrl ?? g.courseImage}
                  initialsSize={30}
                  style={{ height: 128 }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: SCRIM_STRONG }} />
                  <ImageChip>{relativeWhen(g.at, t)}</ImageChip>
                  <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10 }}>
                    <div
                      style={{
                        fontSize: 16.5,
                        fontWeight: 800,
                        color: '#fff',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {m?.name ?? g.courseName ?? t('discover.unknownCourse', 'Course')}
                    </div>
                    {m?.region && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.78)',
                          marginTop: 2,
                        }}
                      >
                        {m.region}
                      </div>
                    )}
                  </div>
                </CourseImageFallback>

                <div style={{ padding: '3px 14px 5px' }}>
                  {lines.map((l, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 8,
                        padding: '9px 0',
                        borderBottom:
                          i === lines.length - 1 ? 'none' : `1px solid ${A.BORDER}`,
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 13,
                          color: A.INK,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {l.text}
                      </span>
                      {l.fig && (
                        <span
                          style={{
                            ...NUMF,
                            fontSize: 14.5,
                            color: l.tone ?? A.INK,
                            flexShrink: 0,
                          }}
                        >
                          {l.fig}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}

          {!expanded && groups.length > PAGE && (
            <div style={{ textAlign: 'center', paddingTop: 2 }}>
              <InkAction
                onClick={() => {
                  setExpanded(true);
                  onExpand?.(groups.length - PAGE);
                }}
              >
                {t('discover.showMoreCourses', {
                  defaultValue: 'Show {{count}} more courses',
                  count: groups.length - PAGE,
                })}
              </InkAction>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default AroundTheWorld;
