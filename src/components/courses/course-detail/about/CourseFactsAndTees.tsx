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
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { AboutSection, GUTTER, ABOUT_KICKER, aboutFig } from './AboutSection';

/** WHS standard slope. A course of exactly 113 plays to average difficulty. */
const STANDARD_SLOPE = 113;

const FactCell: React.FC<{ kicker: string; value: string }> = ({ kicker, value }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div className="tabular-nums lining-nums" style={aboutFig(21)}>
      {value}
    </div>
    <div style={{ ...ABOUT_KICKER, marginTop: 5 }}>{kicker}</div>
  </div>
);

interface Props {
  courseId: string | undefined;
}

export const CourseFactsAndTees: React.FC<Props> = ({ courseId }) => {
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

  const delta = slope != null ? slope - STANDARD_SLOPE : null;
  const deltaText =
    delta == null || delta === 0
      ? null
      : `${delta > 0 ? '+' : '\u2212'}${Math.abs(delta)} against a standard slope of ${STANDARD_SLOPE}.`;

  return (
    <>
      {/* §3.1 — no heading, no card. A flat row of four figures. */}
      {facts.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 22,
            padding: `0 ${GUTTER}px`,
            fontFamily: SANS,
            ...FIGS,
          }}
        >
          {facts.map((f) => (
            <FactCell key={f.kicker} kicker={f.kicker} value={f.value} />
          ))}
        </div>
      )}

      {/* §3.2 — kicker only, no section heading. The tee list is a CONTROL. */}
      <AboutSection kicker="Tees" space={16}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {teeRows.map(({ tee, slope: teeSlope }) => {
            const on = tee.tee_label === active.tee_label;
            return (
              <button
                key={tee.tee_label}
                type="button"
                onClick={() => pickTee(tee.tee_label)}
                aria-pressed={on}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  minHeight: 44,
                  padding: '8px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: 10,
                  background: on ? 'rgba(248,250,252,0.07)' : 'transparent',
                  border: on ? '1px solid rgba(248,250,252,0.18)' : '1px solid transparent',
                  fontFamily: SANS,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: on ? 600 : 500,
                    color: on ? A.INK : A.MUTE,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tee.tee_label}
                </span>

                {teeSlope != null && (
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span className="tabular-nums lining-nums" style={aboutFig(13)}>
                      {teeSlope}
                    </span>
                    <span style={ABOUT_KICKER}>Slope</span>
                  </span>
                )}

                <span
                  className="tabular-nums lining-nums"
                  style={{ ...aboutFig(13, A.MUTE), minWidth: 46, textAlign: 'right' }}
                >
                  {tee.total_yards == null ? '' : formatNumber(Math.round(tee.total_yards))}
                </span>
              </button>
            );
          })}
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 11, color: A.DIM, lineHeight: 1.5 }}>
          {`Tap a tee to set yours.${deltaText ? ` ${deltaText}` : ''}`}
        </p>
      </AboutSection>
    </>
  );
};

export default CourseFactsAndTees;
