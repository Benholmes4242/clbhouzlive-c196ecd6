/**
 * BRIEF_COURSE_TAB_REBUILD §3.1 + §3.2 — THE FACTS and TEES.
 *
 * This replaces the TOP HALF of CourseCardPanel on the Course tab: the giant
 * slope figure, the "+21 vs standard slope of 113" line, the 55–155 slider and
 * the sentence about higher handicaps. Four numbers say it.
 *
 * CourseCardPanel is NOT deleted — it still renders its own sheet elsewhere and
 * is left untouched in the codebase.
 *
 * CRITICAL — THE TEE PICKER. This is the ONLY place in the app a member can
 * change their tee. The remembered-tee storage key is `tee-card:{courseId}`,
 * reached through `storageKey()` in ../../../../features/courses/components/holes/teePreference.
 * The literal string is NOT restated here and MUST NOT change: if it moves, every
 * member silently loses their remembered tee. Selection resolution
 * (`resolveDefaultTee`) and the pick instrumentation
 * (`course_card_tee_changed`) are the same ones CourseCardPanel used, so the
 * move is invisible to members and leaves no instrumentation gap.
 */
import React, { useMemo, useState } from 'react';
import { useProfileData } from '@/hooks/useProfileData';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatNumber } from '@/i18n/format';
import { useCourseTeeSets, type TeeSet } from '@/features/courses/hooks/useCourseTeeSets';
import {
  resolveDefaultTee,
  storageKey,
} from '@/features/courses/components/holes/teePreference';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { AboutSection } from './AboutSection';
import { FactTile, Said } from './verdictBits';
import { TEE_CHANGED_EVENT } from './useHeroReferenceLine';
import { useTranslation } from 'react-i18next';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';


interface Props {
  courseId: string | undefined;
}

export const CourseFactsAndTees: React.FC<Props> = ({ courseId }) => {
  const { t } = useTranslation('courses');
  const { profile } = useProfileData();
  const { data } = useCourseTeeSets(courseId);
  const tees = useMemo<TeeSet[]>(() => data ?? [], [data]);

  const [picked, setPicked] = useState<string | null>(null);

  const resolved = useMemo<string>(() => {
    if (!courseId || tees.length === 0) return '';
    return resolveDefaultTee(tees, courseId, profile?.gender ?? null);
  }, [courseId, tees, profile?.gender]);

  const activeLabel = picked && tees.some((x) => x.tee_label === picked) ? picked : resolved;
  const active = useMemo<TeeSet | null>(() => {
    if (tees.length === 0) return null;
    return tees.find((x) => x.tee_label === activeLabel) ?? tees[0];
  }, [tees, activeLabel]);

  const pickTee = (label: string) => {
    setPicked(label);
    try {
      window.localStorage.setItem(storageKey(courseId ?? ''), label);
    } catch {
      /* private mode — the selection is in-memory only */
    }
    window.dispatchEvent(new Event(TEE_CHANGED_EVENT));
    analyticsEvents.track('course_card_tee_changed', {
      course_id: courseId ?? null,
      tee_label: label,
    });
  };

  // §3.1 / §10 — NO CARD DATA, NO SECTIONS. Not zeros, not dashes: absent.
  if (!active) return null;

  const slope =
    active.slope_rating && active.slope_rating > 0 ? Math.round(active.slope_rating) : null;
  const rating =
    active.course_rating && active.course_rating > 0 ? active.course_rating.toFixed(1) : null;
  const par = active.par_total && active.par_total > 0 ? String(active.par_total) : null;
  const yards =
    active.total_yards != null && Number.isFinite(active.total_yards) && active.total_yards > 0
      ? formatNumber(Math.round(active.total_yards))
      : null;

  const facts: { kicker: string; value: string }[] = [];
  if (par) facts.push({ kicker: 'Par', value: par });
  if (rating) facts.push({ kicker: 'Rating', value: rating });
  if (yards) facts.push({ kicker: 'Yards', value: yards });
  if (slope != null) facts.push({ kicker: 'Slope', value: String(slope) });

  const teeRows = [...tees]
    .map((tee) => ({
      tee,
      slope: tee.slope_rating && tee.slope_rating > 0 ? Math.round(tee.slope_rating) : null,
    }))
    // Hardest first; unrated tees to the bottom, then longest first.
    .sort(
      (a, b) =>
        (b.slope ?? -1) - (a.slope ?? -1) || (b.tee.total_yards ?? 0) - (a.tee.total_yards ?? 0),
    );

  /* BRIEF_COURSE_TAB_1A — the tees became a finding. Par, yards, rating and
     slope sit on the hero line; TEE_SELECTED_STRIP_1 also renders them for the
     selected set as a strip under the cards so a tap visibly lands. The
     spread note is DERIVED from the sets' own slopes, nothing illustrative. */
  const slopes = teeRows.map((r) => r.slope).filter((v): v is number => v != null);
  const spread = slopes.length >= 2 ? Math.max(...slopes) - Math.min(...slopes) : null;
  const sets = formatNumber(teeRows.length);
  const spreadText =
    spread == null
      ? null
      : spread === 0
        ? t('courseDetail.tees.spreadNone')
        : spread === 1
          ? t('courseDetail.tees.spreadOne', { sets })
          : t('courseDetail.tees.spread', { points: formatNumber(spread), sets });

  return (
    <AboutSection kicker={t('courseDetail.tees.kicker')} title={t('courseDetail.tees.title')}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {teeRows.map(({ tee, slope: teeSlope }) => {
          const on = tee.tee_label === active.tee_label;
          return (
            <button
              key={tee.tee_label}
              type="button"
              onClick={() => pickTee(tee.tee_label)}
              aria-pressed={on}
              style={{
                flex: '1 1 0',
                minWidth: 72,
                padding: '9px 6px',
                textAlign: 'center',
                cursor: 'pointer',
                borderRadius: 10,
                background: on ? inkWithAlpha(SURFACE.dark.ink, 0.05) : 'transparent',
                border: `1px solid ${on ? inkWithAlpha(SURFACE.dark.ink, 0.22) : A.HAIRLINE}`,
                fontFamily: SANS,
              }}
            >
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: on ? A.INK : A.BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tee.tee_label}
              </span>
              {tee.total_yards != null ? (
                <span className="tabular-nums lining-nums" style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: A.DIM, marginTop: 4 }}>
                  {formatNumber(Math.round(tee.total_yards))}
                </span>
              ) : null}
              {teeSlope != null ? (
                <span className="tabular-nums lining-nums" style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: A.MUTE, marginTop: 4 }}>
                  {t('courseDetail.tees.slope', { slope: teeSlope })}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {facts.length > 0 ? (
        <div data-testid="tee-selected-strip" style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          {facts.map((f) => (
            <FactTile key={f.kicker} value={f.value} label={f.kicker} />
          ))}
        </div>
      ) : null}
      {/* BRIEF_COURSE_TAB_1B P1.4 — PERMANENTLY OMITTED: the mock's "worth less
          than one shot" line. Converting a slope spread into shots needs a
          handicap index, which is viewer data, and nothing on this tab may be
          viewer-scoped. Do not add it back. The slope-point spread stays. */}
      {spreadText ? <Said quiet>{spreadText}</Said> : null}
    </AboutSection>
  );
};

export default CourseFactsAndTees;
