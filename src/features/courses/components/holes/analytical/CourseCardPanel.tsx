/**
 * CourseCardPanel - Block 1 of the analytical Course tab
 * (BRIEF_COURSE_TAB_ANALYTICAL_V2, sections 1 and 2).
 *
 * The panel leads with ONE headline figure: SLOPE RATING, with its reference
 * point (the WHS standard of 113) beside it and one plain sentence beneath.
 * PAR / COURSE RATING / YARDS drop to a counter strip under a hairline.
 *
 * When the resolved tee carries no slope the headline FALLS BACK to LENGTH and
 * the counter strip becomes PAR / COURSE RATING / SLOPE - a panel whose hero
 * figure is missing must never render blank.
 *
 * The sheet is a refined table: tee pills carrying their yardage, a four-cell
 * summary panel, then the scorecard with a hairline above OUT / IN / TOTAL and
 * nothing between hole rows. No zebra striping, no length bars.
 *
 * Presentation only - every figure comes from useCourseTeeSets, which the page
 * already loads. No new query.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useProfileData } from '@/hooks/useProfileData';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatNumber } from '@/i18n/format';
import { useCourseTeeSets, type TeeSet } from '../../../hooks/useCourseTeeSets';
import { shortCourseName } from '../../../_shared/courseLabel';
import { resolveDefaultTee, storageKey } from '../CourseTeeCard';
import { A, FIGS, Hairline, KICKER, LABEL, SANS } from './tokens';

/** WHS standard slope. A course of exactly 113 plays to average difficulty. */
const STANDARD_SLOPE = 113;

/**
 * THE DIFFICULTY ZONES (BRIEF_COURSE_CARD_EVERY_TEE §3).
 *
 * Slope is DIFFICULTY, so it takes neither of the app's other two coloured
 * pairs: it is not a score (no to-par pair, where UNDER par is red) and it is
 * not a movement (no index-delta pair). It takes ZONE language, the same shape
 * the handicap index tile uses, because both answer one question: where does
 * this sit on a range.
 *
 * RED HERE MEANS DEMANDING, NOT BAD. A hard course is a good course - no
 * warning tone, no icon, no copy treating a high slope as a problem.
 *
 * Declared here because no shared difficulty scale exists in the codebase; the
 * hexes themselves come from the analytical tokens (A.GREEN / A.AMBER / A.RED)
 * rather than being retyped.
 */
const ZONE_EASIER_MAX = 104; // below 105: easier than standard
const ZONE_STANDARD_MAX = 129; // 105-129: around standard; 130 and up: harder

function zoneColour(slope: number): string {
  if (slope <= ZONE_EASIER_MAX) return A.GREEN;
  if (slope <= ZONE_STANDARD_MAX) return A.AMBER;
  return A.RED;
}

interface Props {
  courseId: string | undefined;
  /** Names the sheet. Falls back to the tee title when absent. */
  courseName?: string;
}

const DASH = '\u2014';

/** ONE eyebrow treatment: the panel and its sheet render identically. */
const SHEET_EYEBROW: React.CSSProperties = {
  ...KICKER,
  fontSize: 9.5,
  letterSpacing: '0.15em',
  fontWeight: 700,
};


function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  return formatNumber(Math.round(n));
}

function fmtRating(n: number | null | undefined): string {
  return n != null && Number.isFinite(n) && n > 0 ? n.toFixed(1) : DASH;
}

/** Counter cell: figure 23/700 INK over a 7.5/700/0.14em DIM label. */
const Counter: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ textAlign: 'center', minWidth: 0 }}>
    <div
      style={{
        fontSize: 7.5,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: A.DIM,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 23,
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: A.INK,
        marginTop: 8,
        whiteSpace: 'nowrap',
        ...FIGS,
      }}
    >
      {value}
    </div>
  </div>
);

/* ── Slope scale ─────────────────────────────────────────────────────────
   The full WHS slope range with the 113 standard notched, the span between
   standard and this course filled, and the course as a ringed ink dot.
   Neutral ink only - this describes the COURSE, not a score or the member. */
const SCALE_MIN = 55;
const SCALE_MAX = 155;
const DOT = 11;

/** Zone band edges as track percentages, shared by the scale and the rows. */
const scalePct = (v: number) =>
  ((Math.min(SCALE_MAX, Math.max(SCALE_MIN, v)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

/** The three zones behind a track, at 0.22 so a fill still reads over them. */
const ZoneBed: React.FC<{ radius: number }> = ({ radius }) => (
  <>
    {[
      { from: SCALE_MIN, to: ZONE_EASIER_MAX + 1, colour: A.GREEN },
      { from: ZONE_EASIER_MAX + 1, to: ZONE_STANDARD_MAX + 1, colour: A.AMBER },
      { from: ZONE_STANDARD_MAX + 1, to: SCALE_MAX, colour: A.RED },
    ].map((z) => (
      <div
        key={z.colour}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${scalePct(z.from)}%`,
          width: `${scalePct(z.to) - scalePct(z.from)}%`,
          background: z.colour,
          opacity: 0.22,
          borderRadius: radius,
        }}
      />
    ))}
  </>
);

const SlopeScale: React.FC<{ slope: number }> = ({ slope }) => {
  const { t } = useTranslation(['courses']);

  const here = scalePct(slope);
  const std = scalePct(STANDARD_SLOPE);
  const left = Math.min(here, std);
  const width = Math.abs(here - std);
  const zone = zoneColour(slope);

  return (
    <div style={{ marginTop: 14 }} aria-hidden="true">
      <div
        style={{
          position: 'relative',
          height: 6,
          borderRadius: 3,
          background: A.TRACK,
        }}
      >
        {/* THE TRACK IS GRADED (§4). A grey track with a dot tells a member
            WHERE the number is but not WHAT IT MEANS. */}
        <ZoneBed radius={3} />
        {/* Span between standard and this course, in this tee's zone colour -
            works in both directions. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${left}%`,
            width: `${width}%`,
            borderRadius: 3,
            background: zone,
          }}
        />
        {/* Standard notch, overhanging 3px top and bottom. */}
        <div
          style={{
            position: 'absolute',
            left: `${std}%`,
            top: -3,
            bottom: -3,
            width: 1.5,
            marginLeft: -0.75,
            background: 'rgba(14,18,22,0.28)',
          }}
        />
        {/* This course. Clamped so the dot never hangs off the track. */}
        <div
          style={{
            position: 'absolute',
            left: `clamp(${DOT / 2}px, ${here}%, calc(100% - ${DOT / 2}px))`,
            top: '50%',
            width: DOT,
            height: DOT,
            marginLeft: -DOT / 2,
            marginTop: -DOT / 2,
            borderRadius: '50%',
            background: zone,
            border: '2.5px solid #FFFFFF',
            boxShadow: '0 1px 3px rgba(14,18,22,0.22)',
            boxSizing: 'border-box',
          }}
        />
      </div>
      {/* Range labels. Standard is centred on the notch but kept inside the
          card, and the range ends hold their own space so nothing overlaps. */}
      <div
        style={{
          position: 'relative',
          marginTop: 6,
          display: 'flex',
          justifyContent: 'space-between',
          ...LABEL,
          fontSize: 7,
        }}
      >
        <span>{SCALE_MIN}</span>
        <span
          style={{
            position: 'absolute',
            left: `clamp(22%, ${std}%, 78%)`,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          {t('courses:courseDetail.card.standardMark', { standard: STANDARD_SLOPE })}
        </span>
        <span>{SCALE_MAX}</span>
      </div>
    </div>
  );
};


const SUMMARY_CELL: React.CSSProperties = { textAlign: 'center', minWidth: 0 };

/** Fixed, load-bearing grid: HOLE / yards / PAR / SI. No cell sizes to content. */
const CARD_GRID = '30px 1fr 46px 46px';
const CARD_GAP = 10;

const SheetBody: React.FC<{ courseId: string; tees: TeeSet[]; initialTee: string }> = ({
  courseId,
  tees,
  initialTee,
}) => {
  const { t } = useTranslation(['courses']);
  const [selected, setSelected] = useState(initialTee);

  const active = useMemo(
    () => tees.find((x) => x.tee_label === selected) ?? tees[0],
    [tees, selected],
  );

  const pick = (label: string) => {
    setSelected(label);
    try {
      window.localStorage.setItem(storageKey(courseId), label);
    } catch {
      /* private mode - selection is in-memory only */
    }
  };

  const holes = useMemo(
    () => [...(active?.holes ?? [])].sort((a, b) => a.hole_no - b.hole_no),
    [active],
  );
  const out = holes.filter((h) => h.hole_no <= 9);
  const inn = holes.filter((h) => h.hole_no > 9);

  /** An incomplete total is not a total: one missing hole omits the figure. */
  const sum = (list: typeof holes, key: 'par' | 'yards'): number | null => {
    let total = 0;
    for (const h of list) {
      const v = h[key];
      if (v == null || !Number.isFinite(Number(v))) return null;
      total += Number(v);
    }
    return total;
  };

  if (!active) return null;

  const summaryRow = (label: string, list: typeof holes, figSize: number) => {
    const y = sum(list, 'yards');
    const p = sum(list, 'par');
    return (
      <div
        key={label}
        style={{
          display: 'grid',
          gridTemplateColumns: CARD_GRID,
          alignItems: 'center',
          gap: CARD_GAP,
          padding: '9px 0',
          borderTop: `1px solid ${A.HAIRLINE}`,
        }}
      >
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.INK,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: figSize,
            fontWeight: 700,
            color: A.INK,
            textAlign: 'right',
            ...FIGS,
          }}
        >
          {y == null ? '' : formatNumber(Math.round(y))}
        </span>
        <span
          style={{
            fontSize: figSize,
            fontWeight: 700,
            color: A.INK,
            textAlign: 'right',
            ...FIGS,
          }}
        >
          {p == null ? '' : p}
        </span>
        <span aria-hidden="true" />
      </div>
    );
  };

  const holeRow = (h: (typeof holes)[number]) => (
    <div
      key={h.hole_no}
      style={{
        display: 'grid',
        gridTemplateColumns: CARD_GRID,
        alignItems: 'center',
        gap: CARD_GAP,
        padding: '8.5px 0',
      }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, ...FIGS }}>{h.hole_no}</span>
      <span
        style={{ fontSize: 13, fontWeight: 600, color: A.BODY, textAlign: 'right', ...FIGS }}
      >
        {h.yards == null ? '' : formatNumber(Math.round(h.yards))}
      </span>
      <span
        style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, textAlign: 'right', ...FIGS }}
      >
        {h.par}
      </span>
      <span
        style={{ fontSize: 13, fontWeight: 700, color: A.MUTE, textAlign: 'right', ...FIGS }}
      >
        {h.si == null ? '' : h.si}
      </span>
    </div>
  );

  /* Summary panel: only the cells that carry a value, evenly distributed. */
  const summaryCells = [
    { label: t('courses:teeCard.stat.par'), value: active.par_total ? active.par_total : null },
    {
      label: t('courses:courseDetail.card.courseRating'),
      value:
        active.course_rating && active.course_rating > 0 ? active.course_rating.toFixed(1) : null,
    },
    {
      label: t('courses:teeCard.stat.slope'),
      value: active.slope_rating ? Math.round(active.slope_rating) : null,
    },
  ].filter((c) => c.value != null);

  return (
    <>
      {/* Tee pills, each carrying its yardage inline - the only yardage on open. */}
      <div
        style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px' }}
        aria-label={t('courses:teeCard.a11yPills')}
      >
        {tees.map((tee) => {
          const on = tee.tee_label === active.tee_label;
          return (
            <button
              key={tee.tee_label}
              type="button"
              onClick={() => pick(tee.tee_label)}
              aria-pressed={on}
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 7,
                flexShrink: 0,
                borderRadius: 999,
                padding: '9px 14px',
                minHeight: 36,
                cursor: 'pointer',
                fontFamily: SANS,
                background: on ? A.INK : A.PANEL,
                border: `1px solid ${on ? A.INK : A.BORDER}`,
                transition: 'background-color 160ms ease, border-color 160ms ease',
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700, color: on ? A.PANEL : A.INK }}>
                {tee.tee_label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: on ? 'rgba(255,255,255,0.78)' : A.MUTE,
                  ...FIGS,
                }}
              >
                {fmtInt(tee.total_yards)}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 16px 32px', display: 'grid', gap: 12 }}>
        {/* Summary panel: PAR / COURSE RATING / SLOPE. */}
        {summaryCells.length > 0 ? (
          <div
            style={{
              background: A.PANEL,
              border: `1px solid ${A.BORDER}`,
              borderRadius: 16,
              padding: '18px 16px',
              display: 'grid',
              gridTemplateColumns: `repeat(${summaryCells.length}, minmax(0, 1fr))`,
            }}
          >
            {summaryCells.map((cell) => (
              <div key={cell.label} style={SUMMARY_CELL}>
                <div style={{ ...LABEL, fontSize: 8 }}>{cell.label}</div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: A.INK,
                    marginTop: 7,
                    whiteSpace: 'nowrap',
                    ...FIGS,
                  }}
                >
                  {cell.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Scorecard table. No zebra striping; hairlines only above the summaries.
            NOTE: no overflow: hidden here - it would kill the sticky header. */}
        <div
          style={{
            background: A.PANEL,
            border: `1px solid ${A.BORDER}`,
            borderRadius: 16,
            padding: '0 16px 14px',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              background: A.PANEL,
              margin: '0 -16px',
              padding: '14px 16px 10px',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              display: 'grid',
              gridTemplateColumns: CARD_GRID,
              gap: CARD_GAP,
            }}
          >
            <span style={{ ...LABEL, fontSize: 8 }}>{t('courses:teeCard.col.hole')}</span>
            <span style={{ ...LABEL, fontSize: 8, textAlign: 'right' }}>
              {t('courses:teeCard.col.yards')}
            </span>
            <span style={{ ...LABEL, fontSize: 8, textAlign: 'right' }}>
              {t('courses:teeCard.col.par')}
            </span>
            <span style={{ ...LABEL, fontSize: 8, textAlign: 'right' }}>
              {t('courses:teeCard.col.si')}
            </span>
          </div>

          {out.map(holeRow)}
          {out.length > 0 && summaryRow(t('courses:teeCard.out'), out, 13)}

          {inn.length > 0 ? (
            <>
              <div style={{ height: 14 }} aria-hidden="true" />
              {inn.map(holeRow)}
              {summaryRow(t('courses:teeCard.in'), inn, 13)}
            </>
          ) : null}

          <div style={{ height: 6 }} aria-hidden="true" />
          {summaryRow(t('courses:teeCard.total'), holes, 14)}
        </div>
      </div>
    </>
  );
};


export const CourseCardPanel: React.FC<Props> = ({ courseId, courseName }) => {
  const { t } = useTranslation(['courses']);
  const { profile } = useProfileData();
  const { data } = useCourseTeeSets(courseId);
  const tees = useMemo<TeeSet[]>(() => data ?? [], [data]);

  const [open, setOpen] = useState(false);
  // Bumped when the sheet closes so the resolved tee is re-read from storage.
  const [readToken, setReadToken] = useState(0);

  const active = useMemo<TeeSet | null>(() => {
    if (!courseId || tees.length === 0) return null;
    const label = resolveDefaultTee(tees, courseId, profile?.gender ?? null);
    return tees.find((x) => x.tee_label === label) ?? tees[0];
    // readToken is a deliberate re-read trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, tees, profile?.gender, readToken]);

  const slope = active?.slope_rating && active.slope_rating > 0 ? Math.round(active.slope_rating) : null;

  // Fallback telemetry: how often the catalogue has no slope for the resolved tee.
  useEffect(() => {
    if (!courseId || !active) return;
    if (slope == null) {
      analyticsEvents.track('course_card_slope_fallback', {
        course_id: courseId,
        tee: active.tee_label,
      });
    }
  }, [courseId, active, slope]);

  if (!courseId || !active) return null;

  const openSheet = () => {
    analyticsEvents.track('course_card_sheet_opened', { course_id: courseId });
    setOpen(true);
  };
  const closeSheet = () => {
    setOpen(false);
    setReadToken((n) => n + 1);
  };

  const yards = active.total_yards ?? null;
  const delta = slope != null ? slope - STANDARD_SLOPE : null;
  const deltaText =
    delta == null
      ? ''
      : delta > 0
      ? `+${delta}`
      : delta < 0
      ? `\u2212${Math.abs(delta)}`
      : 'E';
  const sentence =
    delta == null
      ? null
      : delta > 0
      ? t('courses:courseDetail.card.playsHarder')
      : delta < 0
      ? t('courses:courseDetail.card.playsEasier')
      : t('courses:courseDetail.card.playsAverage');

  return (
    <>
      <section
        style={{
          margin: '0 16px',
          background: A.PANEL,
          border: `1px solid ${A.BORDER}`,
          borderRadius: 16,
          padding: '18px 16px 3px',
          fontFamily: SANS,
          ...FIGS,
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span style={SHEET_EYEBROW}>{t('courses:teeCard.eyebrow')}</span>
          <button
            type="button"
            onClick={openSheet}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: SANS,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: A.INK,
              }}
            >
              {t('courses:courseDetail.card.fullCard')}
            </span>
            <span style={{ fontSize: 12, color: A.INK, fontWeight: 700 }} aria-hidden="true">
              {'\u203A'}
            </span>
          </button>
        </header>

        {/* HEADLINE: slope, or length when the catalogue carries no slope.
            The label carries the TEE - it qualifies every figure beneath it. */}
        <div
          style={{
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.DIM,
          }}
        >
          {`${
            slope != null
              ? t('courses:courseDetail.card.slopeLabel')
              : t('courses:courseDetail.card.lengthLabel')
          } \u00B7 ${t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
          <span
            style={{
              fontSize: 46,
              fontWeight: 700,
              letterSpacing: '-0.035em',
              color: A.INK,
              lineHeight: 0.92,
            }}
          >
            {slope != null ? slope : fmtInt(yards)}
          </span>
          {slope != null ? (
            <>
              {/* Difficulty is neither a score nor the viewing member - no colour. */}
              <span style={{ fontSize: 16, fontWeight: 700, color: A.INK }}>{deltaText}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: A.MUTE }}>
                {t('courses:courseDetail.card.vsStandard', { standard: STANDARD_SLOPE })}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 600, color: A.MUTE }}>
              {t('courses:courseDetail.card.yardsUnit')}
            </span>
          )}
        </div>

        {/* SLOPE SCALE - only when there is a slope to place. */}
        {slope != null ? <SlopeScale slope={slope} /> : null}

        {slope != null && sentence ? (
          <p
            style={{
              margin: '15px 0 0',
              fontSize: 13.5,
              fontWeight: 500,
              color: A.BODY,
              lineHeight: 1.4,
            }}
          >
            {sentence}
          </p>
        ) : null}

        {/* COUNTER STRIP under a hairline. */}
        <Hairline style={{ marginTop: 16 }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            paddingTop: 15,
          }}
        >
          <Counter label={t('courses:teeCard.stat.par')} value={active.par_total} />
          <Counter
            label={t('courses:courseDetail.card.courseRating')}
            value={fmtRating(active.course_rating)}
          />
          {slope != null ? (
            <Counter label={t('courses:teeCard.stat.yards')} value={fmtInt(yards)} />
          ) : (
            <Counter
              label={t('courses:teeCard.stat.slope')}
              value={DASH}
            />
          )}
        </div>
      </section>


      <BottomSheet
        open={open}
        onClose={closeSheet}
        variant="light"
        ariaLabelledBy="course-card-sheet-title"
        style={{
          height: 'auto',
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
          background: A.CANVAS,
        }}
      >
        <div style={{ padding: '0 16px 12px' }}>
          <div style={SHEET_EYEBROW}>{t('courses:teeCard.eyebrow')}</div>
          {/* The heading names the COURSE - it must not restate the tee pill. */}
          <h2
            id="course-card-sheet-title"
            style={{
              margin: '3px 0 0',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: A.INK,
            }}
          >
            {courseName && courseName.trim()
              ? shortCourseName(courseName)
              : t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })}
          </h2>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', fontFamily: SANS, ...FIGS }}>
          <SheetBody courseId={courseId} tees={tees} initialTee={active.tee_label} />
        </div>
      </BottomSheet>
    </>
  );
};

export default CourseCardPanel;
