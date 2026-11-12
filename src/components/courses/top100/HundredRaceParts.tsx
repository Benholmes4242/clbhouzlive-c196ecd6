import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { useLayoutEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { Top100CourseProgress } from '@/hooks/gam/useTop100ListProgress';
import type { CareerRow } from '@/hooks/top100/useTop100Race';
import { firstUnplayedIndex, hundredRailScroll, leaderCaptionLeft, raceShare, RACE_TILE_WIDTH, RACE_TILE_HEIGHT, RACE_TILE_GAP, type HundredSlab } from '@/hooks/top100/hundredRaceRules';
import { standingOrdinal } from '@/features/explore-magazine/ordinal';

/** T100 owns only race presentation; foreground/neutral paint comes from the
 * global t100 tokens. Career figures and activity-grid figures are independent. */
export function HundredYou({ slab, list, listLength, leaderValue }: { slab: HundredSlab; list: string; listLength: number; leaderValue: number }) {
  const { t, i18n } = useTranslation('courses');
  const track = useRef<HTMLDivElement>(null), caption = useRef<HTMLSpanElement>(null), leftLabel = useRef<HTMLSpanElement>(null), rightLabel = useRef<HTMLSpanElement>(null);
  const [captionLeft, setCaptionLeft] = useState(0);
  const share = raceShare(slab.n, listLength), mark = raceShare(leaderValue, listLength);
  useLayoutEffect(() => {
    const measure = () => {
      if (!track.current || !caption.current || !leftLabel.current || !rightLabel.current) return;
      setCaptionLeft(leaderCaptionLeft(mark, track.current.clientWidth, caption.current.offsetWidth, leftLabel.current.offsetWidth, rightLabel.current.offsetWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (track.current) observer.observe(track.current);
    return () => observer.disconnect();
  }, [mark, leaderValue, listLength]);
  const clause = slab.kind === 'played' ? slab.clause : null;
  const key = slab.kind === 'absent' ? 'absent' : slab.tie ? 'playedJoint' : clause?.kind === 'behind' ? 'playedBehind' : clause?.kind === 'clear' ? 'playedClear' : 'played';
  return <div data-hundred-slab={slab.kind} className="t100-slab">
    <p><Trans t={t} ns="courses" i18nKey={`amateur.leaderboards.hundredSlab.${key}`} values={{
      n: slab.n, list, pos: slab.kind === 'played' ? standingOrdinal(slab.pos, i18n.language) : undefined,
      total: slab.kind === 'played' ? slab.total : undefined, gap: clause?.gap,
      leader: clause?.kind === 'behind' ? clause.leader || t('discover.aMember') : undefined,
      second: clause?.kind === 'clear' ? clause.second || t('discover.aMember') : undefined,
    }} components={{ b: <b className="tabular-nums" /> }} /></p>
    <div ref={track} className="t100-track" aria-hidden>
      <div data-hundred-fill className="t100-track-fill" style={{ width: `${share * 100}%` }} />
      {leaderValue > 0 ? <span data-leader-mark className="t100-leader-mark" style={{ left: `${mark * 100}%` }} /> : null}
    </div>
    <div className="t100-captions tabular-nums">
      <span ref={leftLabel}>0</span>
      {leaderValue > 0 ? <span ref={caption} data-leader-caption className="t100-leader-caption" style={{ left: captionLeft }}>{t('amateur.leaderboards.hundredSlab.nobodyPast', { n: leaderValue })}</span> : null}
      <span ref={rightLabel} className="t100-end-label">{listLength}</span>
    </div>
  </div>;
}
export function HundredRail({ tiles, onOpenCourse }: { tiles: Top100CourseProgress[]; onOpenCourse: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('courses');
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollLeft = hundredRailScroll(firstUnplayedIndex(tiles), 16, ref.current.clientWidth);
    // Keyed by active list; never move a rail after its first arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} data-hundred-rail className="t100-rail" style={{ gap: RACE_TILE_GAP }}>
    {tiles.map(c => <button key={c.course_id} type="button" aria-label={c.course_name} data-played={c.is_viewer_played || undefined} className="t100-tile" style={{ width: RACE_TILE_WIDTH, height: RACE_TILE_HEIGHT }} onClick={() => onOpenCourse(c.course_id)}>
      {c.thumbnail_image ? <img src={c.thumbnail_image} alt="" loading="lazy" decoding="async" /> : null}
      <span className="t100-photo-scrim" aria-hidden />
      {c.rank != null ? <span className="t100-photo-rank tabular-nums">#{c.rank}</span> : null}
      {c.is_viewer_played ? <span data-hundred-played className="t100-played" aria-label={t('amateur.leaderboards.hundredPlayed')}><Check size={11} strokeWidth={4.2} /></span> : null}
      <span className="t100-photo-name">{shortCourseName(c.course_name)}</span>
    </button>)}
  </div>;
}
export function HundredRaceRow({ row, viewerId, total, previousViewer = false, onPress }: { row: CareerRow; viewerId: string; total: number; previousViewer?: boolean; onPress: () => void }) {
  const { t } = useTranslation('courses');
  const self = Boolean(row.is_viewer || row.user_id === viewerId);
  return <button type="button" className="t100-row" data-race-row={row.user_id} data-viewer={self || undefined} data-after-viewer={previousViewer || undefined} onClick={onPress}>
    <span className="t100-position tabular-nums">{row.is_tie ? `T${row.pos}` : row.pos}</span>
    <SquircleAvatar size={34} src={row.photo_url} alt={row.display_name ?? ''} userId={row.user_id} hairlineRing />
    <span className="t100-row-main"><span className="t100-row-name"><InlineProMemberName userId={row.user_id}>{row.display_name || t('discover.aMember')}</InlineProMemberName></span>
      {row.last_course_name ? <span className="t100-row-course">{shortCourseName(row.last_course_name)}</span> : null}
      <span className="t100-row-track" aria-hidden><span data-row-progress style={{ width: `${raceShare(Number(row.value), total) * 100}%` }} /></span>
    </span>
    <span className="t100-value tabular-nums">{row.value}</span>
  </button>;
}