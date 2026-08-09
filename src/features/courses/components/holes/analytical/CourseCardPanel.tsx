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
import { resolveDefaultTee, storageKey } from '../CourseTeeCard';
import { A, FIGS, Hairline, KICKER, LABEL, SANS } from './tokens';

/** WHS standard slope. A course of exactly 113 plays to average difficulty. */
const STANDARD_SLOPE = 113;

interface Props {
  courseId: string | undefined;
}

const DASH = '\u2014';

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  return formatNumber(Math.round(n));
}

function fmtRating(n: number | null | undefined): string {
  return n != null && Number.isFinite(n) && n > 0 ? n.toFixed(1) : DASH;
}

/** Counter cell: figure 17/800 INK over a 7.5/800/0.14em DIM label. */
const Counter: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ textAlign: 'center', minWidth: 0 }}>
    <div
      style={{
        fontSize: 7.5,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: A.DIM,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 17,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: A.INK,
        marginTop: 3,
        whiteSpace: 'nowrap',
        ...FIGS,
      }}
    >
      {value}
    </div>
  </div>
);

const SUMMARY_CELL: React.CSSProperties = { textAlign: 'center', minWidth: 0 };

/** Fixed, load-bearing grid: HOLE / yards / PAR / SI. No cell sizes to content. */
const CARD_GRID = '26px 1fr 46px 62px';

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

  const sum = (list: typeof holes, key: 'par' | 'yards') =>
    list.reduce((s, h) => s + (Number(h[key]) || 0), 0);

  if (!active) return null;

  const summaryRow = (label: string, list: typeof holes) => (
    <div
      key={label}
      style={{
        display: 'grid',
        gridTemplateColumns: CARD_GRID,
        alignItems: 'center',
        gap: 8,
        padding: '9px 0',
        borderTop: `1px solid ${A.HAIRLINE}`,
      }}
    >
      <span
        style={{
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: A.INK,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 800, color: A.INK, textAlign: 'right', ...FIGS }}>
        {fmtInt(sum(list, 'yards'))}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: A.INK, textAlign: 'right', ...FIGS }}>
        {sum(list, 'par')}
      </span>
      <span aria-hidden="true" />
    </div>
  );

  return (
    <>
      {/* Tee pills, each carrying its yardage inline. */}
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
                gap: 6,
                flexShrink: 0,
                borderRadius: 999,
                padding: '8px 13px',
                minHeight: 34,
                cursor: 'pointer',
                fontFamily: SANS,
                background: on ? A.INK : A.PANEL,
                border: `1px solid ${on ? A.INK : A.BORDER}`,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: on ? A.PANEL : A.INK }}>
                {tee.tee_label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: on ? A.PANEL : A.DIM,
                  opacity: on ? 0.7 : 1,
                  ...FIGS,
                }}
              >
                {fmtInt(tee.total_yards)}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 16px 28px', display: 'grid', gap: 12 }}>
        {/* Summary panel: PAR / CR / SLOPE / YARDS. */}
        <div
          style={{
            background: A.PANEL,
            border: `1px solid ${A.BORDER}`,
            borderRadius: 16,
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          }}
        >
          {[
            { label: t('courses:teeCard.stat.par'), value: active.par_total },
            { label: t('courses:teeCard.stat.cr'), value: fmtRating(active.course_rating) },
            {
              label: t('courses:teeCard.stat.slope'),
              value: active.slope_rating ? Math.round(active.slope_rating) : DASH,
            },
            { label: t('courses:teeCard.stat.yards'), value: fmtInt(active.total_yards) },
          ].map((cell) => (
            <div key={cell.label} style={SUMMARY_CELL}>
              <div style={{ ...LABEL, fontSize: 8 }}>{cell.label}</div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: A.INK,
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  ...FIGS,
                }}
              >
                {cell.value}
              </div>
            </div>
          ))}
        </div>

        {/* Scorecard table. No zebra striping; hairlines only above the summaries. */}
        <div
          style={{
            background: A.PANEL,
            border: `1px solid ${A.BORDER}`,
            borderRadius: 16,
            padding: '12px 16px 6px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: CARD_GRID,
              gap: 8,
              paddingBottom: 8,
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

          {holes.map((h) => (
            <div
              key={h.hole_no}
              style={{
                display: 'grid',
                gridTemplateColumns: CARD_GRID,
                alignItems: 'center',
                gap: 8,
                padding: '7px 0',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: A.INK, ...FIGS }}>
                {h.hole_no}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: A.BODY,
                  textAlign: 'right',
                  ...FIGS,
                }}
              >
                {fmtInt(h.yards)}
                <span
                  style={{
                    fontSize: 7,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    color: A.DIM,
                    marginLeft: 3,
                  }}
                >
                  {t('courses:courseDetail.card.ydsUnit')}
                </span>
              </span>
              <span
                style={{ fontSize: 13, fontWeight: 700, color: A.INK, textAlign: 'right', ...FIGS }}
              >
                {h.par}
              </span>
              <span
                style={{ fontSize: 12, fontWeight: 700, color: A.DIM, textAlign: 'right', ...FIGS }}
              >
                {h.si || DASH}
              </span>
            </div>
          ))}

          {out.length > 0 && summaryRow(t('courses:teeCard.out'), out)}
          {inn.length > 0 && summaryRow(t('courses:teeCard.in'), inn)}
          {summaryRow(t('courses:teeCard.total'), holes)}
        </div>
      </div>
    </>
  );
};

export const CourseCardPanel: React.FC<Props> = ({ courseId }) => {
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
  const deltaTone = delta == null || delta === 0 ? A.INK : delta > 0 ? A.RED : A.GREEN;
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
          padding: '12px 16px',
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
            marginBottom: 10,
          }}
        >
          <span style={{ ...KICKER, fontSize: 9, letterSpacing: '0.14em', fontWeight: 800 }}>
            {t('courses:teeCard.eyebrow')}
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: A.DIM,
              textAlign: 'right',
              ...FIGS,
            }}
          >
            {yards != null
              ? `${active.tee_label} \u00B7 ${t('courses:courseDetail.card.yards', {
                  count: Math.round(yards),
                  yards: formatNumber(Math.round(yards)),
                })}`
              : active.tee_label}
          </span>
        </header>

        {/* HEADLINE: slope, or length when the catalogue carries no slope. */}
        <div
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.DIM,
          }}
        >
          {slope != null
            ? t('courses:courseDetail.card.slopeLabel')
            : t('courses:courseDetail.card.lengthLabel')}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, lineHeight: 1.05 }}>
            {slope != null ? slope : fmtInt(yards)}
          </span>
          {slope != null ? (
            <>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: deltaTone }}>{deltaText}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: A.BODY }}>
                {t('courses:courseDetail.card.vsStandard', { standard: STANDARD_SLOPE })}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 11.5, fontWeight: 600, color: A.BODY }}>
              {t('courses:courseDetail.card.yardsUnit')}
            </span>
          )}
        </div>
        {slope != null && sentence ? (
          <p style={{ margin: '5px 0 0', fontSize: 11.5, fontWeight: 600, color: A.BODY, lineHeight: 1.4 }}>
            {sentence}
          </p>
        ) : null}

        {/* COUNTER STRIP under a hairline. */}
        <Hairline style={{ marginTop: 10 }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            paddingTop: 8,
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

        {/* Footer action under a second hairline. */}
        <Hairline style={{ marginTop: 8 }} />
        <button
          type="button"
          onClick={openSheet}
          style={{
            marginTop: 0,
            width: '100%',
            minHeight: 32,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: 0,
            fontFamily: SANS,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: A.INK,
            }}
          >
            {t('courses:courseDetail.card.seeFullShort')}
          </span>
          <span style={{ fontSize: 12, color: A.INK, fontWeight: 800 }} aria-hidden="true">
            {'\u203A'}
          </span>
        </button>
      </section>

      <BottomSheet
        open={open}
        onClose={closeSheet}
        variant="light"
        maxHeight="90dvh"
        ariaLabelledBy="course-card-sheet-title"
        style={{
          height: '75dvh',
          maxHeight: '75dvh',
          display: 'flex',
          flexDirection: 'column',
          background: A.CANVAS,
        }}
      >
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ ...LABEL, fontSize: 9, letterSpacing: '0.14em' }}>
            {t('courses:teeCard.eyebrow')}
          </div>
          <h2
            id="course-card-sheet-title"
            style={{
              margin: '3px 0 0',
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: A.INK,
            }}
          >
            {t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })}
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
