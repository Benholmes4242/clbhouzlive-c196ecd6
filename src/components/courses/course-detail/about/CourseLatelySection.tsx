import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { RoundCard } from '@/features/explore-magazine/watch/RoundCard';
import '@/features/explore-magazine/watch/lately-tile.css';
import { SHELF_CARD, SHELF_SKELETON } from '@/features/explore-magazine/watch/roundsShelfRules';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import AboutSection, { GUTTER } from './AboutSection';
import { useCourseLately } from './useCourseLately';
import { LATELY_TILES_MIN, latelyShortDate, signedAvg } from './latelyRules';

/**
 * CS1 — LATELY HERE. Course tab, after the verdict and before About this
 * course. One paged read (useCourseLately); summary fields from the first row;
 * one batched hole-shapes read over every loaded round. Signed-out viewers get
 * nothing from the RPC, so nothing renders. Zero rounds renders nothing; an
 * errored read hides quietly (Recent rounds' behaviour), never as empty.
 * The rail reuses Recent rounds' RoundCard; it is never forked.
 * COURSE_PAGE_ROUND_TILES: the boxed tiles became a plain four-cell facts row
 * (same LATELY_TILES_MIN rule) and a colour key sits under the rail.
 */
const RAIL_INSET = 16;

const CourseLatelySection: React.FC<{ courseId: string; userId: string | undefined }> = ({ courseId, userId }) => {
  const { t, i18n } = useTranslation('courses');
  const locale = i18n.language || 'en';
  const opener = useScorecardOpener();
  const q = useCourseLately(courseId, userId);
  const rounds = useMemo(() => q.data?.pages.flat() ?? [], [q.data]);
  const shapes = useRoundHoleShapes(useMemo(() => rounds.map((r) => r.whs_score_id), [rounds]));

  useEffect(() => {
    if (q.isError) console.warn('[course lately] read failed; section hidden');
  }, [q.isError]);

  const railRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = q;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const rail = railRef.current;
    if (!sentinel || !rail || !hasNextPage || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { root: rail, rootMargin: '0px 300px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rounds.length]);

  if (!userId) return null;

  if (q.isPending && q.fetchStatus !== 'idle') {
    return (
      <div data-course-lately="loading" aria-hidden style={{ marginTop: 34 }}>
        <div style={{ padding: `0 ${GUTTER}px` }}>
          <div style={{ height: 11, width: 60, borderRadius: 4, background: A.PANEL }} />
          <div style={{ height: 19, width: 190, borderRadius: 6, background: A.PANEL, marginTop: 6 }} />
          <div style={{ height: 13, width: 240, borderRadius: 6, background: A.PANEL, marginTop: 8 }} />
        </div>
        <div style={{ display: 'flex', gap: SHELF_CARD.gap, padding: `14px ${RAIL_INSET}px 0`, overflow: 'hidden' }}>
          {[0, 1].map((i) => (
            /* The initial loading skeleton stays at the fixed 214. */
            <div key={i} style={{ flex: 'none', width: SHELF_CARD.width, height: 214, borderRadius: SHELF_CARD.radius, background: A.PANEL }} />
          ))}
        </div>
      </div>
    );
  }

  if (q.isError) return <div data-course-lately="error" hidden />;
  const first = rounds[0];
  const total = first?.total_count ?? 0;
  if (!first || total === 0) return null;

  const golfers = first.golfers;
  const anyCircle = rounds.some((r) => r.in_circle);
  const roundsText = `${total} ${total === 1 ? t('courseDetail.lately.round', 'round') : t('courseDetail.lately.rounds', 'rounds')}`;
  const golfersText = `${golfers} ${golfers === 1 ? t('courseDetail.lately.golfer', 'golfer') : t('courseDetail.lately.golfers', 'golfers')}`;

  return (
    <div data-course-lately="ready">
      <AboutSection kicker={t('courseDetail.lately.kicker', 'LATELY')} title={t('courseDetail.lately.title', "Who's been out here")} bleed>
        <div style={{ padding: `0 ${GUTTER}px`, fontFamily: SANS }}>
          {/* AboutSection's title block owns 12px below; the lede sits 6 under the title. */}
          <p data-course-lately-lede style={{ margin: '-6px 0 0', fontSize: 13.5, color: A.MUTE, lineHeight: 1.45 }}>
            <b style={{ color: A.INK, fontWeight: 700 }}>{roundsText}</b>
            {t('courseDetail.lately.ledeMid', ' in the last 30 days, from ')}
            <b style={{ color: A.INK, fontWeight: 700 }}>{golfersText}</b>
            .
          </p>
        </div>
        {total >= LATELY_TILES_MIN ? (
          <div data-course-lately-facts className="lately-facts">
            <div><b>{total}</b><small>{t('courseDetail.lately.tile.factRounds', 'ROUNDS')}</small></div>
            <div><b>{golfers}</b><small>{t('courseDetail.lately.tile.factGolfers', 'GOLFERS')}</small></div>
            <div>
              <b>{signedAvg(first.window_avg_topar)}</b>
              <small>
                <span className="lately-long">{t('courseDetail.lately.tile.factAvg', 'AVG TO PAR')}</span>
                <span className="lately-short">{t('courseDetail.lately.tile.factAvgShort', 'AVG')}</span>
              </small>
            </div>
            <div>
              <b>{first.best_gross ?? '–'}</b>
              <small>
                <span className="lately-long">
                  {t('courseDetail.lately.tile.factBest', 'BEST')}
                  {first.best_gross_date ? ` · ${latelyShortDate(first.best_gross_date, locale)}` : ''}
                </span>
                <span className="lately-short">{t('courseDetail.lately.tile.factBestShort', 'BEST')}</span>
              </small>
            </div>
          </div>
        ) : null}
        <div
          ref={railRef}
          data-course-lately-rail
          style={{
            display: 'flex', gap: SHELF_CARD.gap, padding: `16px ${RAIL_INSET}px 2px`, overflowX: 'auto', alignItems: 'stretch',
            scrollbarWidth: 'none', scrollSnapType: 'x proximity', scrollPaddingInline: RAIL_INSET,
            overscrollBehaviorX: 'contain', willChange: 'transform',
          }}
        >
          {rounds.map((round) => (
            <RoundCard
              key={`round:${round.whs_score_id ?? round.user_id}:${round.play_date}`}
              round={round}
              shapes={shapes}
              locale={locale}
              here
              inCircle={round.in_circle}
              own={round.user_id === userId}
              onOpenRound={(scoreId, owner) => opener.openByScore(scoreId, null, owner)}
              onOpenMember={(id) => opener.openProfile(id)}
            />
          ))}
          {hasNextPage ? <div ref={sentinelRef} data-course-lately-sentinel style={{ flex: 'none', width: 1 }} aria-hidden /> : null}
          {isFetchingNextPage ? (
            <div style={{ flex: 'none', width: SHELF_SKELETON.width, minHeight: SHELF_SKELETON.minHeight, borderRadius: SHELF_SKELETON.radius, background: SHELF_SKELETON.background }} />
          ) : null}
        </div>
        <div data-course-lately-key className="lately-key">
          <span><i data-key="under" />{t('courseDetail.lately.tile.keyUnder', 'Under par')}</span>
          <span><i data-key="bogey" />{t('courseDetail.lately.tile.keyBogey', 'Bogey')}</span>
          <span><i data-key="double" />{t('courseDetail.lately.tile.keyDouble', 'Double')}</span>
          <span><i data-key="triple" />{t('courseDetail.lately.tile.keyTriple', 'Triple+')}</span>
        </div>
        <div data-course-lately-foot style={{ padding: `0 ${GUTTER}px`, marginTop: 12, fontSize: 12, color: A.DIM }}>
          {anyCircle
            ? t('courseDetail.lately.footCircle', 'Newest first. Your circle is marked.')
            : t('courseDetail.lately.foot', 'Newest first.')}
        </div>
      </AboutSection>
      <RoundDetailSheet
        open={opener.target != null}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </div>
  );
};

export default CourseLatelySection;
