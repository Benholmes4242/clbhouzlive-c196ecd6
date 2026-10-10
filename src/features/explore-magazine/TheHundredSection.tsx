import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import type { Top100CourseProgress } from '@/hooks/gam/useTop100ListProgress';

import { standingOrdinal } from './ordinal';
import {
  THE_HUNDRED,
  firstUnplayedIndex,
  hundredRailScroll,
  type HundredSlab,
} from './theHundred';

const H = THE_HUNDRED;
const fig = <span style={{ color: A.INK, fontWeight: 700 }} />;

/** T.1 — the you slab. Signed-in only; the caller decides. */
export function HundredYou({
  slab,
  list,
  listLength,
  leaderValue,
  nameOf,
}: {
  slab: HundredSlab;
  list: string;
  listLength: number;
  leaderValue: number;
  nameOf: (n: string | null | undefined) => string;
}) {
  const { t, i18n } = useTranslation('courses');
  const S = H.slab;
  let sentence: ReactNode;
  if (slab.kind === 'absent') {
    sentence = t('amateur.leaderboards.hundredSlab.absent', { list });
  } else {
    const c = slab.clause;
    const key = !c ? 'played' : c.kind === 'behind' ? 'playedBehind' : 'playedClear';
    sentence = (
      <Trans
        t={t}
        ns="courses"
        i18nKey={`amateur.leaderboards.hundredSlab.${key}`}
        values={{
          n: slab.n,
          list,
          pos: standingOrdinal(slab.pos, i18n?.language ?? 'en'),
          total: slab.total,
          gap: c?.gap,
          leader: c?.kind === 'behind' ? nameOf(c.leader) : undefined,
          second: c?.kind === 'clear' ? nameOf(c.second) : undefined,
        }}
        components={{ b: fig }}
      />
    );
  }
  const share = listLength > 0 ? Math.min(1, slab.n / listLength) : 0;
  const cap = { fontSize: S.caption.fontSize, lineHeight: `${S.caption.lineHeight}px`, fontWeight: S.caption.fontWeight, letterSpacing: S.caption.letterSpacing, textTransform: 'uppercase' as const, color: A.DIM };
  return (
    <div
      data-hundred-slab={slab.kind}
      style={{ position: 'relative', marginBottom: H.blockGap, borderRadius: S.radius, overflow: 'hidden', background: S.background, padding: S.padding, fontFamily: SANS }}
    >
      <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: S.bar, background: A.AMBER }} />
      <div style={{ fontSize: S.fontSize, lineHeight: S.lineHeight, color: A.MUTE }}>{sentence}</div>
      <div aria-hidden style={{ marginTop: S.track.marginTop, height: S.track.height, borderRadius: 999, background: S.track.background, overflow: 'hidden' }}>
        <div data-hundred-fill style={{ width: `${share * 100}%`, height: '100%', background: A.AMBER }} />
      </div>
      <div className="tabular-nums" style={{ marginTop: S.caption.marginTop, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={cap}>0</span>
        {leaderValue > 0 ? <span style={cap}>{t('amateur.leaderboards.hundredSlab.nobodyPast', { n: leaderValue })}</span> : null}
        <span style={cap}>{listLength}</span>
      </div>
    </div>
  );
}

/** T.3 — the basis sentence under the slab. */
export function HundredBasis({ list }: { list: string }) {
  const { t } = useTranslation('courses');
  return (
    <p style={{ margin: `0 0 ${H.blockGap}px`, fontFamily: SANS, fontSize: H.basis.fontSize, lineHeight: H.basis.lineHeight, color: A.DIM }}>
      <Trans
        t={t}
        ns="courses"
        i18nKey="amateur.leaderboards.hundredBasis"
        values={{ list }}
        components={{ s: <span style={{ color: A.MUTE, fontWeight: 600 }} /> }}
      />
    </p>
  );
}

/** The strip's sub-head: list name left, viewer's played count right. */
export function HundredSubHead({ list, count }: { list: string; count: { played: number; total: number } | null }) {
  const { t } = useTranslation('courses');
  const base = { fontSize: H.subHead.fontSize, lineHeight: `${H.subHead.lineHeight}px`, fontWeight: H.subHead.fontWeight } as const;
  return (
    <div style={{ marginTop: H.stripTop, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
      <span style={{ ...base, letterSpacing: H.subHead.letterSpacing, textTransform: 'uppercase', color: A.DIM }}>
        {t('amateur.leaderboards.theListHundred', { list })}
      </span>
      {count ? (
        <span className="tabular-nums" style={{ ...base, fontSize: H.subHead.countSize, color: A.DIM, flexShrink: 0 }}>
          {t('amateur.leaderboards.hundredPlayedCount', { played: count.played, total: count.total })}
        </span>
      ) : null}
    </div>
  );
}

/**
 * T.2 — THIS SECTION'S OWN RAIL. A copy of the shared Rail's frame (scroller,
 * end spacer, fade) so scroll control never reaches the rail Who leads what uses.
 * MOUNT IT KEYED BY LIST: the scroll position is set once, instantly, on mount —
 * i.e. once per list arrival — and never on later updates of the same list.
 */
export function HundredRail({
  tiles,
  gutter,
  onOpenCourse,
}: {
  tiles: Top100CourseProgress[];
  gutter: number;
  onOpenCourse: (courseId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const ref = useRef<HTMLDivElement>(null);
  const next = tiles.findIndex((c) => !c.is_viewer_played);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = hundredRailScroll(firstUnplayedIndex(tiles), gutter);
    // Once per mount by design: later updates must never move the rail.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const T = H.tile;
  return (
    <div style={{ position: 'relative', marginInline: -gutter }}>
      <div
        ref={ref}
        data-hundred-rail
        style={{ display: 'flex', gap: H.rail.gap, overflowX: 'auto', paddingInline: gutter, scrollbarWidth: 'none', willChange: 'transform', scrollBehavior: 'auto' }}
      >
        {tiles.map((c, i) => (
          <button
            key={c.course_id}
            type="button"
            onClick={() => onOpenCourse(c.course_id)}
            aria-label={c.course_name}
            data-played={c.is_viewer_played || undefined}
            style={{
              width: T.width, height: T.height, borderRadius: T.radius, overflow: 'hidden', position: 'relative',
              flexShrink: 0, padding: 0, background: A.PANEL,
              border: c.thumbnail_image ? 'none' : `1px solid ${A.BORDER}`,
            }}
          >
            {c.thumbnail_image ? (
              <img src={c.thumbnail_image} alt="" loading="lazy" decoding="async"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
            <span aria-hidden style={{ position: 'absolute', inset: 0, background: T.scrim }} />
            {c.rank != null ? (
              <span className="tabular-nums" style={{ position: 'absolute', left: T.rank.inset, top: T.rank.top, fontSize: T.rank.fontSize, fontWeight: 700, color: T.text, textShadow: T.textShadow }}>
                {`#${c.rank}`}
              </span>
            ) : null}
            {c.is_viewer_played ? (
              <span
                data-hundred-played
                aria-label={t('amateur.leaderboards.hundredPlayed')}
                style={{ position: 'absolute', top: T.played.inset, right: T.played.inset, width: T.played.size, height: T.played.size, borderRadius: 999, background: A.AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Check size={T.played.check} strokeWidth={3} color={T.played.ink} />
              </span>
            ) : i === next ? (
              <span
                data-hundred-next
                style={{ position: 'absolute', top: T.next.inset, right: T.next.inset, fontSize: T.next.fontSize, fontWeight: 800, letterSpacing: T.next.letterSpacing, textTransform: 'uppercase', lineHeight: 1.2, color: T.next.ink, background: T.next.ground, borderRadius: 999, padding: T.next.padding }}
              >
                {t('amateur.leaderboards.hundredNext')}
              </span>
            ) : null}
            <span style={{
              position: 'absolute', left: T.caption.inset, right: T.caption.inset, bottom: T.caption.bottom, fontSize: T.caption.fontSize, fontWeight: 700,
              letterSpacing: T.caption.letterSpacing, textTransform: 'uppercase', lineHeight: T.caption.lineHeight, color: T.text,
              textShadow: T.textShadow,
              display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
              textAlign: 'left',
            }}>
              {c.course_name}
            </span>
          </button>
        ))}
        <span style={{ flex: `0 0 ${H.rail.endSpacer}px` }} aria-hidden />
      </div>
      <span aria-hidden style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: H.rail.fade, pointerEvents: 'none', background: `linear-gradient(to right, transparent, ${A.CANVAS})` }} />
    </div>
  );
}
