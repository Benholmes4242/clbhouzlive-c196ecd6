import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import RailChips from '@/components/ui/RailChips';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { useAllMyRoundsAtCourse, type MyRoundAtCourse } from '@/hooks/feed/useMyRoundsAtCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatDayMonthShortGB, formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { A, FIGS, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { ABOUT_KICKER } from '../about/AboutSection';

type SortMode = 'recent' | 'lowest';

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  fieldAverage: number | null;
}

const FIGURE: React.CSSProperties = {
  fontFamily: SANS,
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

function dateFromPlayDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
}

function yearOf(round: MyRoundAtCourse): number {
  return dateFromPlayDate(round.playDate).getFullYear();
}

const HeadFigure: React.FC<{ label: string; value: string; amber?: boolean }> = ({ label, value, amber }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ ...FIGURE, fontSize: 18, fontWeight: 700, lineHeight: 1, color: amber ? A.AMBER : A.INK }}>{value}</div>
    <div style={{ ...ABOUT_KICKER, marginTop: 5, whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);

const YourRoundsSheet: React.FC<Props> = ({ open, onClose, courseId, courseName, fieldAverage }) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { data, isLoading, isError } = useAllMyRoundsAtCourse(courseId, open);
  const [sort, setSort] = React.useState<SortMode>('recent');
  const [openRoundId, setOpenRoundId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setSort('recent');
  }, [open]);

  const rounds = data?.rounds ?? [];
  const total = data?.total ?? 0;
  const grosses = React.useMemo(
    () => rounds.map((round) => round.grossScore).filter((gross): gross is number => gross != null),
    [rounds],
  );
  const best = grosses.length > 0 ? Math.min(...grosses) : null;
  const average = grosses.length > 0 ? grosses.reduce((sum, gross) => sum + gross, 0) / grosses.length : null;
  const sorted = React.useMemo(() => {
    const copy = [...rounds];
    if (sort === 'lowest') {
      return copy.sort((a, b) => (a.grossScore ?? Number.POSITIVE_INFINITY) - (b.grossScore ?? Number.POSITIVE_INFINITY) || b.playDate.localeCompare(a.playDate));
    }
    return copy.sort((a, b) => b.playDate.localeCompare(a.playDate) || b.whsScoreId.localeCompare(a.whsScoreId));
  }, [rounds, sort]);
  const spansYears = new Set(rounds.map(yearOf)).size > 1;
  const showYearDividers = sort === 'recent' && (total >= 10 || (total >= 5 && spansYears));

  const trackedOpen = React.useRef(false);
  React.useEffect(() => {
    if (!open || trackedOpen.current || !data) return;
    trackedOpen.current = true;
    analyticsEvents.track('course_rounds_page_viewed', { course_id: courseId, rounds: total, surface: 'sheet' });
  }, [open, data, courseId, total]);
  React.useEffect(() => {
    if (!open) trackedOpen.current = false;
  }, [open]);

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        variant="light"
        surfaceColor={A.CANVAS}
        maxHeight="85dvh"
        topRadius={22}
        grabberColor="rgba(248,250,252,0.22)"
        grabberRadius={999}
        grabberPadding="10px 0 4px"
        ariaLabelledBy="your-rounds-sheet-title"
        style={{ height: '85dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: SANS }}
      >
        <header style={{ flex: '0 0 auto', padding: '2px 20px 16px', borderBottom: `1px solid ${A.HAIRLINE}`, background: A.CANVAS }}>
          <div style={{ ...ABOUT_KICKER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 5 }}>
            <h2 id="your-rounds-sheet-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: A.INK }}>
              {t('courseDetail.yourRoundsSheet.title')}
            </h2>
            <span style={{ ...FIGURE, flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: 0, color: A.DIM }}>
              {t('courseDetail.plays.rounds', { count: total, rounds: formatNumber(total) })}
            </span>
          </div>

          {!isLoading && !isError && rounds.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
                <HeadFigure label={t('courseDetail.yourRoundsSheet.best')} value={best == null ? '\u2014' : String(best)} amber />
                <HeadFigure label={t('courseDetail.yourRoundsSheet.average')} value={average == null ? '\u2014' : average.toFixed(1)} />
                <HeadFigure label={t('courseDetail.yourRoundsSheet.field')} value={fieldAverage == null ? '\u2014' : fieldAverage.toFixed(1)} />
              </div>
              {total >= 10 ? (
                <RailChips
                  options={[
                    { id: 'recent', label: t('courseDetail.yourRoundsSheet.mostRecent') },
                    { id: 'lowest', label: t('courseDetail.yourRoundsSheet.lowestFirst') },
                  ]}
                  value={sort}
                  onChange={(next) => setSort(next as SortMode)}
                  ariaLabel={t('courseDetail.yourRoundsSheet.sortA11y')}
                  style={{ marginTop: 18 }}
                />
              ) : null}
            </>
          ) : null}
        </header>

        <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', willChange: 'transform', padding: '0 20px 24px' }}>
          {isLoading ? (
            <p style={{ margin: '24px 0', fontSize: 13, lineHeight: 1.55, color: A.MUTE }}>{t('courseDetail.yourRoundsSheet.loading')}</p>
          ) : isError ? (
            <p style={{ margin: '24px 0', fontSize: 13, lineHeight: 1.55, color: A.MUTE }}>{t('courseDetail.yourRoundsSheet.error')}</p>
          ) : sorted.length === 0 ? (
            <p style={{ margin: '24px 0', fontSize: 13, lineHeight: 1.55, color: A.MUTE }}>{t('courseDetail.yourRoundsSheet.empty')}</p>
          ) : (
            sorted.map((round, index) => {
              const year = yearOf(round);
              const previousYear = index > 0 ? yearOf(sorted[index - 1]) : null;
              const showYear = showYearDividers && (index === 0 || year !== previousYear);
              const toPar = round.grossScore != null && round.coursePar != null ? round.grossScore - round.coursePar : null;
              const parts = toParParts(toPar, 0);
              const isBest = total > 1 && best != null && round.grossScore === best;
              return (
                <React.Fragment key={round.whsScoreId}>
                  {showYear ? (
                    <div style={{ ...ABOUT_KICKER, paddingTop: index === 0 ? 18 : 26, paddingBottom: 10 }}>{year}</div>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      analyticsEvents.track('course_you_round_opened', { course_id: courseId, whs_score_id: round.whsScoreId, source: 'all_rounds' });
                      setOpenRoundId(round.whsScoreId);
                    }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto 34px 34px 10px',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      height: 'auto',
                      minHeight: 44,
                      padding: '12px 0',
                      borderRadius: 0,
                      borderBottom: `1px solid ${A.HAIRLINE}`,
                      color: A.INK,
                      fontFamily: SANS,
                    }}
                  >
                    <span style={{ minWidth: 0, textAlign: 'left', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatDayMonthShortGB(dateFromPlayDate(round.playDate))}
                    </span>
                    {isBest ? <span style={{ ...ABOUT_KICKER, color: A.AMBER }}>{t('courseDetail.yourRoundsSheet.best')}</span> : <span />}
                    <span style={{ ...FIGS, width: 34, textAlign: 'right', fontSize: 16, fontWeight: 700, color: isBest ? A.AMBER : A.INK }}>{round.grossScore ?? '\u2014'}</span>
                    <span style={{ ...FIGS, width: 34, textAlign: 'right', fontSize: 13, fontWeight: 700, color: parts?.tone ?? A.MUTE }}>{parts?.text ?? '\u2014'}</span>
                    <ChevronRight size={13} aria-hidden="true" style={{ width: 10, color: A.DIM }} />
                  </Button>
                </React.Fragment>
              );
            })
          )}
        </div>
      </BottomSheet>

      <RoundDetailSheet
        open={openRoundId != null}
        onClose={() => setOpenRoundId(null)}
        scoreId={openRoundId}
        profileUserId={user?.id ?? null}
      />
    </>
  );
};

export default YourRoundsSheet;