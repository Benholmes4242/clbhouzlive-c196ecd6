import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { RoundCard } from '@/features/explore-magazine/watch/RoundsThisWeekShelf';
import { SHELF_CARD, SHELF_SKELETON } from '@/features/explore-magazine/watch/roundsShelfRules';
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
 */
const RAIL_INSET = 16;
const TILE: React.CSSProperties = {
  flex: 1, minWidth: 0, background: '#17171B', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: '10px 12px', boxSizing: 'border-box',
};

const CourseLatelySection: React.FC<{ courseId: string; userId: string | undefined }> = ({ courseId, userId }) => {
  const { t, i18n } = useTranslation('courses');
  const locale = i18n.language || 'en';
  const navigate = useNavigate();
  const q = useCourseLately(courseId, userId);
  const rounds = useMemo(() => q.data?.pages.flat() ?? [], [q.data]);
  const shapes = useRoundHoleShapes(useMemo(() => rounds.map((r) => r.whs_score_id), [rounds]));
  const [open, setOpen] = useState<{ scoreId: string; owner: string | null } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
            <div key={i} style={{ flex: 'none', width: SHELF_CARD.width, height: SHELF_CARD.height, borderRadius: SHELF_CARD.radius, background: A.PANEL }} />
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
  const valueStyle: React.CSSProperties = { display: 'block', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, lineHeight: 1.15 };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.DIM, marginTop: 3 };

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
          {total >= LATELY_TILES_MIN ? (
            <div data-course-lately-tiles style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <div style={TILE}>
                <b className="tabular-nums" style={valueStyle}>{total}</b>
                <small style={labelStyle}>{t('courseDetail.lately.tileRounds', 'ROUNDS')}</small>
              </div>
              <div style={TILE}>
                <b className="tabular-nums" style={valueStyle}>{signedAvg(first.window_avg_topar)}</b>
                <small style={labelStyle}>{t('courseDetail.lately.tileAvg', 'AVG OVER PAR')}</small>
              </div>
              <div style={TILE}>
                <b className="tabular-nums" style={valueStyle}>{first.best_gross ?? '–'}</b>
                <small style={labelStyle}>
                  {t('courseDetail.lately.tileBest', 'BEST GROSS')}
                  {first.best_gross_date ? ` · ${latelyShortDate(first.best_gross_date, locale)}` : ''}
                </small>
              </div>
            </div>
          ) : null}
        </div>
        <div
          ref={railRef}
          data-course-lately-rail
          style={{
            display: 'flex', gap: SHELF_CARD.gap, marginTop: 14, padding: `0 ${RAIL_INSET}px 2px`, overflowX: 'auto',
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
              onOpenRound={(scoreId, owner) => {
                setOpen({ scoreId, owner });
                setSheetOpen(true);
              }}
              onOpenMember={(id) => navigate(`/profile/${id}`)}
            />
          ))}
          {hasNextPage ? <div ref={sentinelRef} data-course-lately-sentinel style={{ flex: 'none', width: 1 }} aria-hidden /> : null}
          {isFetchingNextPage ? (
            <div style={{ flex: 'none', width: SHELF_SKELETON.width, height: SHELF_SKELETON.height, borderRadius: SHELF_SKELETON.radius, background: SHELF_SKELETON.background }} />
          ) : null}
        </div>
        <div data-course-lately-foot style={{ padding: `0 ${GUTTER}px`, marginTop: 12, fontSize: 12, color: A.DIM }}>
          {anyCircle
            ? t('courseDetail.lately.footCircle', 'Newest first. Your circle is marked.')
            : t('courseDetail.lately.foot', 'Newest first.')}
        </div>
      </AboutSection>
      <RoundDetailSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        scoreId={open?.scoreId ?? null}
        profileUserId={open?.owner ?? userId}
      />
    </div>
  );
};

export default CourseLatelySection;
