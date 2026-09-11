/**
 * CollegeFranchise — COMPRESSED (BRIEF_TOUR_OVERVIEW_STRUCTURAL section F).
 *
 * WHAT THIS SECTION IS NOW: kicker, meta, one sentence, three figures, one
 * terminal row. Roughly 120px where the Open Duel treatment ran to roughly 700.
 * The full treatment (duel, captains, tug bar, chasing standings) lives behind
 * the see-all at /tourhub?tab=college — it was not deleted, it MOVED OFF THIS
 * PAGE. See the roadmap dead list for the retired blocks and their old line
 * ranges in this file's previous revision.
 *
 * GLOBAL section — one franchise game across golf. Does NOT read the tour
 * picker.
 *
 * WHY IT IS INSTRUMENTED, AND WHY THAT MATTERS MORE THAN THE COMPRESSION:
 * Ben's ruling on this section was "keep it if it works", and that is only
 * answerable if something counts whether anyone reaches the foot of this page.
 * Two events, no sampling.
 *
 * THE VIEW EVENT IS THE DETAIL THAT MAKES THIS USEFUL. A mount event would
 * always report success, because this section is wrapped in LazySection and
 * LazySection mounts children 200px before they enter the viewport. An
 * instrument that always says "yes" answers nothing. So the view event fires
 * ONCE per mount, at threshold 0.5, on the RENDERED BODY ref — never from the
 * loading hold, never from LazySection's premature mount, and never more than
 * once. If you add another view event on this page, copy this shape: the next
 * maintainer will reach for onMount, and onMount here is a lie.
 *
 *   tour_overview_college_view — once per mount when the section is genuinely
 *     half in the viewport.
 *   tour_overview_college_tap — the terminal row only. Reach, then intent.
 *
 * Both are best-effort writes through analyticsEvents and never block the UI.
 *
 * DATA is unchanged: useCollegeSeasonStats (earnings-sorted standings) plus
 * useCollegeMediaMap (short/full name). useFranchiseCaptains and
 * getCollegeLogoUrl are no longer read HERE — the captains and logos are part
 * of the retired treatment; both files stay on disk and are read by the college
 * pages.
 *
 * THE SENTENCE: a championship_editorial_daily headline when there is one
 * (which may be human-written), otherwise the templated line with the leader
 * bold. Every figure in the templated line is arithmetic on figures already on
 * screen; nothing extra is queried for it.
 */

import { useEffect, useMemo, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';
import { useDailyEditorial } from '@/hooks/championship/useDailyEditorial';
import { formatCurrencyUsdCompact } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { SectionShell } from './SectionShell';
import { V4, OVERVIEW_GUTTER as GUT } from '../tokens';
import { Skeleton } from '@/components/ui/skeleton';

function displayName(stats: CollegeSeasonStats, media: CollegeMedia | undefined): string {
  return media?.short_name || media?.college_name || stats.normalized_name;
}

/** Figure name kicker: 9/700/0.12em uppercase, per the brief. */
const NAME_KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: V4.inkFaint,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

function TerminalRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 0 0',
        marginTop: 12,
        background: 'transparent',
        border: 'none',
        borderTop: `1px solid ${V4.hairline}`,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: V4.ink }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: V4.inkMute }} aria-hidden>
        &rsaquo;
      </span>
    </button>
  );
}

export function CollegeFranchise() {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data: collegeStats, isLoading } = useCollegeSeasonStats();
  const { data: mediaMap } = useCollegeMediaMap();
  const editorial = useDailyEditorial({
    surface: 'college_rivalry',
    seasonId: null,
    timeFilter: 'all_time',
  });

  const sorted = useMemo(() => {
    if (!collegeStats) return [];
    return [...collegeStats].sort((a, b) => b.earnings_total - a.earnings_total);
  }, [collegeStats]);

  const leader = sorted[0];
  const chaser = sorted[1];
  const topThree = useMemo(() => sorted.slice(0, 3), [sorted]);

  /* VIEW EVENT — half the section in the viewport, once per mount. The ref is
     attached to the rendered body, so it cannot fire from the loading hold. */
  const viewRef = useRef<HTMLDivElement>(null);
  const viewFired = useRef(false);
  useEffect(() => {
    const el = viewRef.current;
    if (!el || viewFired.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewFired.current) {
          viewFired.current = true;
          obs.disconnect();
          analyticsEvents.track('tour_overview_college_view', { section: 'college_franchise' });
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [leader?.id]);

  const goAll = () => {
    analyticsEvents.track('tour_overview_college_tap', { section: 'college_franchise', target: 'all_franchises' });
    navigate('/tourhub?tab=college');
  };

  if (isLoading && (!leader || !chaser)) {
    return (
      <SectionShell
        padX={GUT}
        eyebrow={t('overview.collegeFranchise.eyebrow')}
        rightMeta={t('overview.collegeFranchise.linkLabel')}
      >
        <div style={{ padding: `0 ${GUT}px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton className="h-4 w-11/12 rounded" />
          <div style={{ display: 'flex', gap: 28 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Skeleton className="h-4 w-14 rounded" />
                <Skeleton className="h-2.5 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </SectionShell>
    );
  }
  if (!leader || !chaser) return null;

  const leaderShort = displayName(leader, mediaMap?.get(leader.normalized_name));
  const chaserShort = displayName(chaser, mediaMap?.get(chaser.normalized_name));
  const gap = leader.earnings_total - chaser.earnings_total;
  const isClosingRace = gap > 0 && gap < 5_000_000;
  const editorialLine = editorial.data?.headline as string | undefined;

  return (
    <SectionShell
      padX={GUT}
      eyebrow={t('overview.collegeFranchise.eyebrow')}
      rightMeta={t('overview.collegeFranchise.linkLabel')}
    >
      <div ref={viewRef} style={{ padding: `0 ${GUT}px` }}>
        {/* ONE SENTENCE, 14/1.5, leader bold. */}
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: V4.inkSoft }}>
          {editorialLine ? (
            editorialLine
          ) : (
            <Trans
              t={t}
              i18nKey={isClosingRace ? 'overview.collegeFranchise.summaryClose' : 'overview.collegeFranchise.summaryWide'}
              values={{
                leader: leaderShort,
                chaser: chaserShort,
                amount: formatCurrencyUsdCompact(leader.earnings_total),
                gap: formatCurrencyUsdCompact(gap),
              }}
              components={[
                <span key="l" style={{ color: V4.ink, fontWeight: 700 }} />,
                <span key="g" style={{ color: V4.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} />,
              ]}
            />
          )}
        </div>

        {/* THREE FIGURES — the top three franchises' season alumni earnings,
            each under its own name. The name IS the kicker, so no legend row is
            needed and the figures carry what they are. */}
        <div style={{ marginTop: 12, display: 'flex', gap: 24 }}>
          {topThree.map((s) => (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: '0 1 auto' }}>
              <span
                className="tabular-nums lining-nums"
                style={{ fontSize: 16, fontWeight: 700, color: V4.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
              >
                {formatCurrencyUsdCompact(s.earnings_total)}
              </span>
              <span style={NAME_KICKER}>{displayName(s, mediaMap?.get(s.normalized_name))}</span>
            </div>
          ))}
        </div>

        <TerminalRow label={t('overview.collegeFranchise.allAction')} onPress={goAll} />
      </div>
    </SectionShell>
  );
}

export default CollegeFranchise;
