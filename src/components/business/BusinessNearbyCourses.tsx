/**
 * CB114 — "Courses nearby" for the five nearby categories (non-club only),
 * after BusinessYouCard. Courses come from useBusinessNearbyCounts (the hero's
 * query and key, so "All N" equals the hero's Courses near); figures from
 * useNearbyCourseStats (key shared with BusinessYouCard). Nothing renders until
 * both settle; a failed nearby read means no card; a failed stats read keeps
 * the card with distance-only meta lines and no foot.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { shortCourseName } from '@/features/courses/_shared/courseLabel';
import { NEARBY_CATEGORIES } from '@/lib/business/businessHero';
import { useBusinessNearbyCounts, type NearbyCourse } from '@/hooks/useBusinessNearbyCounts';
import { useNearbyCourseStats, type NearbyCourseStat } from '@/hooks/useNearbyCourseStats';
import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { scrollElementIntoView } from '@/lib/getScrollParent';

const T = {
  card: '#17171B', ink: '#F8FAFC', mute: 'rgba(248,250,252,0.62)',
  dim: 'rgba(248,250,252,0.42)', hair: 'rgba(255,255,255,0.08)', chip: 'rgba(255,255,255,0.2)',
} as const;
const TAB = { fontVariantNumeric: 'tabular-nums' } as const;

/** km → "1.2 mi". */
export const milesLabel = (km: number) => `${(km / 1.609344).toFixed(1)} mi`;

/** "+14.6", "−1.4" (U+2212) or "Level" at 0.0. */
export function playsLabel(avg: number): string {
  const r = Math.round(avg * 10) / 10;
  if (r === 0) return 'Level';
  return r > 0 ? `+${r.toFixed(1)}` : `\u2212${Math.abs(r).toFixed(1)}`;
}

/** Meta parts; stats null = failed read → distance only. */
export function metaLine(c: NearbyCourse, s: NearbyCourseStat | null | undefined, statsFailed: boolean): { line: string; plays: string | null } {
  const parts: string[] = [];
  if (c.distanceKm != null) parts.push(milesLabel(c.distanceKm));
  let plays: string | null = null;
  if (!statsFailed) {
    const n = s?.rounds_tracked ?? 0;
    if (n >= 3) {
      if (s?.avg_over_par != null) { plays = playsLabel(s.avg_over_par); parts.push(plays); }
      parts.push(`${formatNumber(n)} rounds`);
    } else if (n === 2) parts.push('2 rounds');
    else if (n === 1) parts.push('1 round');
    else parts.push('No rounds yet');
  }
  return { line: parts.join(' \u00B7 '), plays };
}

function Row({ c, s, statsFailed, first, onOpen }: { c: NearbyCourse; s?: NearbyCourseStat; statsFailed: boolean; first: boolean; onOpen: () => void }) {
  const { t } = useTranslation();
  const meta = metaLine(c, s, statsFailed);
  return (
    <button type="button" data-nearby-row={c.id} onClick={onOpen}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 0', background: 'transparent', border: 0,
        borderTop: first ? 'none' : `1px solid ${T.hair}`, textAlign: 'left', cursor: 'pointer', color: T.ink }}>
      <span style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, overflow: 'hidden', flex: 'none' }}>
        {c.thumbnail
          ? <img src={c.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <CourseImageFallback />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span data-nearby-name style={c.isTop100
          ? { display: 'block', fontSize: 14.5, fontWeight: 600, color: T.ink, lineHeight: 1.3 }
          : { display: 'block', fontSize: 14.5, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {shortCourseName(c.name)}
          {c.isTop100 && (
            <span data-nearby-top100 style={{ display: 'inline-block', marginLeft: 6, padding: '1px 6px', borderRadius: 999, border: `1px solid ${T.chip}`,
              fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.ink, verticalAlign: 'middle' }}>
              {t('business.nearby.top100', { defaultValue: 'Top 100' })}
            </span>
          )}
        </span>
        <span data-nearby-meta style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: T.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...TAB }}>
          {meta.line}
        </span>
      </span>
      {c.reviewCount >= 1 && c.ratingAvg != null && (
        <span data-nearby-rating style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flex: 'none' }}>
          <span data-nearby-rating-value style={{ fontSize: 15, fontWeight: 700, color: T.ink, ...TAB }}>{c.ratingAvg.toFixed(1)}</span>
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim }}>
            {t('business.nearby.rating', { defaultValue: 'Rating' })}
          </span>
        </span>
      )}
    </button>
  );
}

export interface BusinessNearbyInput { name: string; category?: string | null; lat?: number | null; lng?: number | null }

export function BusinessNearbyCourses({ isClub, viewerId, business }: { isClub: boolean; viewerId?: string; business: BusinessNearbyInput }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(false);
  const eligible = !isClub && NEARBY_CATEGORIES.has(business.category ?? '') && business.lat != null && business.lng != null;
  const nearby = useBusinessNearbyCounts(isClub ? null : business.category, business.lat, business.lng);
  const courses = nearby.data?.courses ?? [];
  const stats = useNearbyCourseStats(viewerId, courses, eligible);

  if (!eligible || nearby.isLoading || nearby.isError || !nearby.data?.courses || courses.length === 0) return null;
  if (stats.isLoading) return null;
  const failed = stats.isError;
  const byId = new Map((stats.data ?? []).map((s) => [s.id, s]));
  const shown = courses.slice(0, 4);
  const N = nearby.data.coursesNear ?? courses.length;
  const plays = failed ? null : shown.map((c) => metaLine(c, byId.get(c.id), false).plays).find((p) => p != null) ?? null;
  const open = (id: string) => { setSheet(false); navigate(`/courses/${id}`); };

  return (
    <section data-business-nearby style={{ background: T.card, border: `1px solid ${T.hair}`, borderRadius: 18, padding: 16, margin: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>
          {t('business.nearby.kicker', { defaultValue: 'Courses nearby' })}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim }}>
          {t('business.nearby.within', { defaultValue: 'Within 10 miles' })}
        </span>
      </div>
      {shown.map((c, i) => <Row key={c.id} c={c} s={byId.get(c.id)} statsFailed={failed} first={i === 0} onOpen={() => open(c.id)} />)}
      {plays && (
        <p data-nearby-foot style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.45, color: T.dim }}>
          {t('business.nearby.foot', { plays, defaultValue: "{{plays}} is how a course plays: the average score against par in members' rounds." })}
        </p>
      )}
      {courses.length > 4 && (
        <button type="button" data-nearby-all onClick={() => setSheet(true)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 12, paddingTop: 12,
            background: 'transparent', border: 0, borderTop: `1px solid ${T.hair}`, cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
            {t('business.nearby.all', { n: formatNumber(N), defaultValue: 'All {{n}} courses near here' })}
          </span>
          <span style={{ color: T.dim }}>›</span>
        </button>
      )}
      <BottomSheet open={sheet} onClose={() => setSheet(false)} ariaLabelledBy="biz-nearby-sheet-title">
        <div data-nearby-sheet style={{ padding: '0 16px 26px' }}>
          <div id="biz-nearby-sheet-title" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: T.ink, marginBottom: 10 }}>
            {t('business.nearby.sheetTitle', { name: business.name, defaultValue: 'Courses near {{name}}' })}
          </div>
          <div style={{ borderTop: `1px solid ${T.hair}` }}>
            {courses.map((c, i) => <Row key={c.id} c={c} s={byId.get(c.id)} statsFailed={failed} first={i === 0} onOpen={() => open(c.id)} />)}
          </div>
        </div>
      </BottomSheet>
    </section>
  );
}

/** Hero "Courses near"/"Top 100 near" → card top just below the top chrome. */
export function scrollToNearbyCard() {
  const el = document.querySelector<HTMLElement>('[data-business-nearby]');
  if (!el) return;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;height:0;padding-top:max(env(safe-area-inset-top, 0px), 47px);visibility:hidden';
  document.body.appendChild(probe);
  const offset = probe.getBoundingClientRect().height || parseFloat(getComputedStyle(probe).paddingTop) || 47;
  probe.remove();
  scrollElementIntoView(el, { offset, behavior: 'smooth' });
}
